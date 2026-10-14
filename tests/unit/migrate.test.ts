import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate, readMigrations } from "../../scripts/migrate.mjs";

/**
 * Test d'intégration du script de migration de l'image Docker, sur une base temporaire :
 * il doit produire exactement ce que `prisma migrate deploy` produirait.
 */
const adminUrl = process.env.DATABASE_URL!;
const dbName = `orbit_migrate_${Math.random().toString(36).slice(2, 8)}`;
const testUrl = (() => {
  const url = new URL(adminUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
})();
const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const silent = () => {};

async function admin(sql: string) {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

beforeAll(() => admin(`CREATE DATABASE "${dbName}"`));
afterAll(() => admin(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`));

describe("scripts/migrate.mjs", () => {
  it("applique toutes les migrations dans l'ordre, puis ne fait plus rien", async () => {
    const all = (await readMigrations(migrationsDir)).map((m) => m.name);
    expect(await migrate({ connectionString: testUrl, dir: migrationsDir, log: silent })).toEqual(
      all,
    );
    expect(await migrate({ connectionString: testUrl, dir: migrationsDir, log: silent })).toEqual(
      [],
    );
  });

  it("est compatible avec Prisma : `prisma migrate status` voit la base à jour", () => {
    const output = execFileSync("npx", ["prisma", "migrate", "status"], {
      env: { ...process.env, DATABASE_URL: testUrl },
      encoding: "utf8",
    });
    expect(output).toContain("Database schema is up to date");
  }, 60_000);

  it("une migration en échec est annulée et bloque les démarrages suivants", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "orbit-migrations-"));
    try {
      await cp(migrationsDir, dir, { recursive: true });
      await mkdir(path.join(dir, "99999999999999_broken"));
      await writeFile(
        path.join(dir, "99999999999999_broken", "migration.sql"),
        'CREATE TABLE "Partial" (id int);\nSELECT * FROM table_inexistante;',
      );
      await expect(migrate({ connectionString: testUrl, dir, log: silent })).rejects.toThrow(
        /Échec de la migration « 99999999999999_broken »/,
      );
      // Rien n'a été appliqué à moitié (transaction annulée)…
      const client = new pg.Client({ connectionString: testUrl });
      await client.connect();
      const { rows } = await client.query(`SELECT to_regclass('"Partial"') AS t`);
      await client.end();
      expect(rows[0].t).toBeNull();
      // …et le démarrage suivant refuse de continuer tant que ce n'est pas résolu.
      await expect(migrate({ connectionString: testUrl, dir, log: silent })).rejects.toThrow(
        /a échoué/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
