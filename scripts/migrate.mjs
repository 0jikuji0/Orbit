#!/usr/bin/env node
// Applique les migrations Prisma (prisma/migrations/*/migration.sql) au démarrage du conteneur.
//
// Équivalent de `prisma migrate deploy`, sans embarquer la CLI Prisma (~130 Mo) dans l'image :
// même table `_prisma_migrations`, même checksum (SHA-256 du fichier). Une base migrée par ce
// script reste « à jour » pour `prisma migrate status`, et inversement.
//
// Usage : DATABASE_URL=… node scripts/migrate.mjs [dossier-des-migrations]

import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const LOCK_ID = 72_707_369; // verrou consultatif : une seule instance migre à la fois

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  VARCHAR(36)  PRIMARY KEY NOT NULL,
  "checksum"            VARCHAR(64)  NOT NULL,
  "finished_at"         TIMESTAMPTZ,
  "migration_name"      VARCHAR(255) NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMPTZ,
  "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER      NOT NULL DEFAULT 0
)`;

/** Migrations présentes sur le disque, dans l'ordre (le nom commence par un horodatage). */
export async function readMigrations(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const names = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(path.join(dir, name, "migration.sql"), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    }),
  );
}

/** Applique les migrations manquantes. Renvoie les noms appliqués. */
export async function migrate({ connectionString, dir, log = console.log }) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  const applied = [];
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await client.query(CREATE_TABLE);

    const { rows } = await client.query(
      `SELECT migration_name, checksum, finished_at FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`,
    );
    const failed = rows.find((r) => r.finished_at === null);
    if (failed) {
      throw new Error(
        `La migration « ${failed.migration_name} » a échoué lors d'un précédent démarrage. ` +
          `Corrigez la base puis marquez-la résolue (prisma migrate resolve).`,
      );
    }
    const done = new Map(rows.map((r) => [r.migration_name, r.checksum]));

    for (const migration of await readMigrations(dir)) {
      if (done.has(migration.name)) {
        if (done.get(migration.name) !== migration.checksum) {
          log(`[migrate] Attention : « ${migration.name} » a été modifiée après son application.`);
        }
        continue;
      }
      const id = randomUUID();
      await client.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count)
         VALUES ($1, $2, $3, now(), 0)`,
        [id, migration.checksum, migration.name],
      );
      try {
        await client.query("BEGIN");
        await client.query(migration.sql);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        await client.query(`UPDATE "_prisma_migrations" SET logs = $2 WHERE id = $1`, [
          id,
          String(error?.stack ?? error),
        ]);
        throw new Error(`Échec de la migration « ${migration.name} » : ${error?.message ?? error}`);
      }
      await client.query(
        `UPDATE "_prisma_migrations" SET finished_at = now(), applied_steps_count = 1 WHERE id = $1`,
        [id],
      );
      log(`[migrate] Appliquée : ${migration.name}`);
      applied.push(migration.name);
    }
    if (!applied.length) log("[migrate] Base à jour.");
    return applied;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
    await client.end();
  }
}

// Exécution directe (pas lors d'un import depuis les tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[migrate] DATABASE_URL manquant.");
    process.exit(1);
  }
  const dir = process.argv[2] ?? path.join(process.cwd(), "prisma", "migrations");
  migrate({ connectionString, dir }).catch((error) => {
    console.error(`[migrate] ${error.message}`);
    process.exit(1);
  });
}
