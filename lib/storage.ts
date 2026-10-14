import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

/**
 * Stockage des fichiers. Seule l'implémentation locale existe ; une implémentation S3/MinIO
 * pourra respecter la même interface sans toucher au reste du code.
 */
export interface FileStorage {
  put(key: string, data: ReadableStream<Uint8Array>): Promise<void>;
  get(key: string): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements FileStorage {
  constructor(private readonly root: string) {}

  /** Les clés sont générées côté serveur ; on vérifie quand même qu'elles restent sous la racine. */
  private resolve(key: string) {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep))
      throw new Error("Clé de stockage invalide");
    return full;
  }

  async put(key: string, data: ReadableStream<Uint8Array>) {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await pipeline(Readable.fromWeb(data as NodeReadableStream), createWriteStream(file));
  }

  async get(key: string) {
    const file = this.resolve(key);
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) return null;
    return {
      stream: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
      size: info.size,
    };
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}

export const storage: FileStorage = new LocalStorage(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"),
);
