/**
 * Copies of the database in DATA_DIR/backups/, for undoing mistakes:
 *
 * - daily:   taken before the first change of each day (New York time); the last 7 are kept.
 * - monthly: the first daily copy of each month; the last 6 are kept.
 * - manual:  "Back up now" in the admin panel; the last 5 are kept.
 *
 * They live on the same volume as the database, so they don't survive losing
 * the volume; Railway's volume backups cover that (and the images).
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { dataDir, getDb } from "./db/connection";
import { dateInputValue, SITE_TIME_ZONE } from "./dates";

export type BackupKind = "daily" | "monthly" | "manual";
export type Backup = { name: string; kind: BackupKind; createdAt: string; bytes: number };

const KEEP: Record<BackupKind, number> = { daily: 7, monthly: 6, manual: 5 };

// site-2026-11-15-daily.db, site-2026-11-monthly.db, site-2026-11-15T14-03-22-manual.db
const NAME = /^site-\d{4}-\d{2}(?:-\d{2}(?:T\d{2}-\d{2}-\d{2})?)?-(daily|monthly|manual)\.db$/;

export const backupsDir = () => path.join(dataDir(), "backups");

/** Absolute path of a backup, or null if `name` isn't one (so it can't point anywhere else). */
export function backupPath(name: string): string | null {
  return NAME.test(name) ? path.join(backupsDir(), name) : null;
}

export async function listBackups(): Promise<Backup[]> {
  const names = await fs.readdir(backupsDir()).catch(() => []);
  const backups = await Promise.all(
    names.flatMap((name) => {
      const kind = name.match(NAME)?.[1] as BackupKind | undefined;
      if (!kind) return [];
      return fs
        .stat(path.join(backupsDir(), name))
        .then((stat) => ({ name, kind, createdAt: stat.mtime.toISOString(), bytes: stat.size }))
        .catch(() => []);
    }),
  );
  return backups.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

let pending: Promise<void> | null = null;

/**
 * Called before every change to posts. Only the first call of the day copies
 * anything. Never throws: a failed backup is logged and the change goes ahead.
 */
export function backupBeforeChange(now = new Date()): Promise<void> {
  // Two saves at once share one copy.
  pending ??= dailyAndMonthly(now)
    .catch((error) => console.error("[backup] daily backup failed", error))
    .finally(() => (pending = null));
  return pending;
}

async function dailyAndMonthly(now: Date) {
  const day = dateInputValue(now);
  const daily = `site-${day}-daily.db`;
  const monthly = `site-${day.slice(0, 7)}-monthly.db`;
  if (!(await exists(daily))) await snapshot(daily);
  if (!(await exists(monthly))) await copy(daily, monthly);
  await prune();
}

/** "Back up now". */
export async function backupNow(now = new Date()): Promise<void> {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .replaceAll(":", "-");
  await snapshot(`site-${dateInputValue(now)}T${time}-manual.db`);
  await prune();
}

/** SQLite's online backup: a consistent copy even while the site is writing. */
async function snapshot(name: string) {
  await fs.mkdir(backupsDir(), { recursive: true });
  // Written under a temporary name so a half-written copy is never listed.
  const temporary = path.join(backupsDir(), `.${randomUUID()}.tmp`);
  try {
    await getDb().backup(temporary);
    await fs.rename(temporary, path.join(backupsDir(), name));
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function copy(from: string, to: string) {
  const temporary = path.join(backupsDir(), `.${randomUUID()}.tmp`);
  await fs.copyFile(path.join(backupsDir(), from), temporary);
  await fs.rename(temporary, path.join(backupsDir(), to));
}

const exists = (name: string) =>
  fs.access(path.join(backupsDir(), name)).then(
    () => true,
    () => false,
  );

/** Deletes the oldest copies of each kind past its limit. Names sort by date. */
async function prune() {
  const names = (await fs.readdir(backupsDir())).filter((name) => NAME.test(name)).sort();
  for (const kind of Object.keys(KEEP) as BackupKind[]) {
    const ofKind = names.filter((name) => name.endsWith(`-${kind}.db`));
    const old = ofKind.slice(0, Math.max(0, ofKind.length - KEEP[kind]));
    await Promise.all(old.map((name) => fs.rm(path.join(backupsDir(), name), { force: true })));
  }
}
