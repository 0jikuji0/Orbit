export type Migration = { name: string; sql: string; checksum: string };
export function readMigrations(dir: string): Promise<Migration[]>;
export function migrate(options: {
  connectionString: string;
  dir: string;
  log?: (message: string) => void;
}): Promise<string[]>;
