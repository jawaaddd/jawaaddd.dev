import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

// Point the data layer at a throwaway database before it opens one.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "backup-test-"));
const { getDb } = await import("./db/connection");
const { backupBeforeChange, backupNow, backupPath, backupsDir, listBackups } =
  await import("./backup");

const names = () => fs.readdirSync(backupsDir()).sort();
// Noon in New York on a given day.
const day = (date: string) => new Date(`${date}T17:00:00Z`);

beforeEach(() => fs.rmSync(backupsDir(), { recursive: true, force: true }));

describe("backupBeforeChange", () => {
  it("copies once a day, and starts the month's copy", async () => {
    await backupBeforeChange(day("2026-11-15"));
    await backupBeforeChange(day("2026-11-15"));
    expect(names()).toEqual(["site-2026-11-15-daily.db", "site-2026-11-monthly.db"]);
  });

  it("uses the New York day", async () => {
    // 01:00 UTC on the 16th is still the 15th in New York.
    await backupBeforeChange(new Date("2026-11-16T01:00:00Z"));
    expect(names()).toContain("site-2026-11-15-daily.db");
  });

  it("copies the database as it was", async () => {
    getDb()
      .prepare(
        `INSERT INTO posts (type, slug, status, body_md, created_at, updated_at)
         VALUES ('til', ?, 'draft', 'x', '2026-01-01', '2026-01-01')`,
      )
      .run(`backup-${Date.now()}`);
    const count = (getDb().prepare("SELECT count(*) AS n FROM posts").get() as { n: number }).n;
    await backupBeforeChange(day("2026-11-15"));
    const copy = new Database(path.join(backupsDir(), "site-2026-11-15-daily.db"), {
      readonly: true,
    });
    expect((copy.prepare("SELECT count(*) AS n FROM posts").get() as { n: number }).n).toBe(count);
    copy.close();
  });

  it("keeps 7 daily and 6 monthly copies", async () => {
    for (let month = 1; month <= 8; month++) {
      for (let date = 1; date <= 3; date++) {
        await backupBeforeChange(day(`2026-${pad(month)}-${pad(date)}`));
      }
    }
    const daily = names().filter((name) => name.endsWith("-daily.db"));
    const monthly = names().filter((name) => name.endsWith("-monthly.db"));
    expect(daily).toHaveLength(7);
    expect(daily[0]).toBe("site-2026-06-03-daily.db");
    expect(monthly).toEqual(
      ["03", "04", "05", "06", "07", "08"].map((month) => `site-2026-${month}-monthly.db`),
    );
  });
});

describe("backupNow", () => {
  it("adds a timestamped copy and keeps the last 5", async () => {
    for (let minute = 0; minute < 6; minute++) {
      await backupNow(new Date(`2026-11-15T19:${pad(minute)}:05Z`));
    }
    expect(names()).toHaveLength(5);
    expect(names().at(-1)).toBe("site-2026-11-15T14-05-05-manual.db");
    const [newest] = await listBackups();
    expect(newest.kind).toBe("manual");
  });
});

describe("backupPath", () => {
  it("accepts only backup names", () => {
    expect(backupPath("site-2026-11-15-daily.db")).toBe(
      path.join(backupsDir(), "site-2026-11-15-daily.db"),
    );
    for (const name of ["site.db", "../site.db", "site-2026-11-15-daily.db/../../site.db", ""]) {
      expect(backupPath(name)).toBeNull();
    }
  });
});

const pad = (n: number) => String(n).padStart(2, "0");
