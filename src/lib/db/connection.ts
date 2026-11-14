import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { migrations } from "./schema";

/** Root of everything that must persist: the database file and uploads/. */
export function dataDir(): string {
  // Runtime-only location; tell the build tracer not to bundle what's there.
  return path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? "data");
}

// Kept on globalThis so dev-server hot reloads reuse one connection.
const globalForDb = globalThis as unknown as { db?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.db) globalForDb.db = open(path.join(dataDir(), "site.db"));
  return globalForDb.db;
}

export function open(file: string): Database.Database {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let version = current; version < migrations.length; version++) {
    db.transaction(() => {
      db.exec(migrations[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}
