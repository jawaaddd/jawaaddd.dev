import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// Point the data layer at a throwaway database before it opens one.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "posts-test-"));
const { getDb } = await import("./db/connection");
const { listFeed } = await import("./posts");

beforeAll(() => {
  const insert = getDb().prepare(
    `INSERT INTO posts (type, slug, status, body_md, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '2026-01-01', '2026-01-01')`,
  );
  // Two posts share a timestamp to check the id tie-break.
  insert.run("til", "a", "published", "a", "2026-11-10T12:00:00Z");
  insert.run("til", "b", "published", "b", "2026-11-12T12:00:00Z");
  insert.run("til", "c", "published", "c", "2026-11-12T12:00:00Z");
  insert.run("til", "d", "published", "d", "2026-11-14T12:00:00Z");
  insert.run("til", "draft", "draft", "draft", "2026-11-15T12:00:00Z");
  insert.run("blogpost", "post", "published", "# body", "2026-11-01T12:00:00Z");
});

describe("listFeed", () => {
  it("never returns drafts", () => {
    const slugs = listFeed({ limit: 100 }).posts.map((p) => p.slug);
    expect(slugs).not.toContain("draft");
  });

  it("orders newest first, breaking ties by id", () => {
    expect(listFeed({ limit: 100 }).posts.map((p) => p.slug)).toEqual(["d", "c", "b", "a", "post"]);
  });

  it("pages without skipping or repeating posts", () => {
    const seen: string[] = [];
    let page = listFeed({ limit: 2 });
    seen.push(...page.posts.map((p) => p.slug));
    while (page.next) {
      page = listFeed({ after: page.next, limit: 2 });
      seen.push(...page.posts.map((p) => p.slug));
    }
    expect(seen).toEqual(["d", "c", "b", "a", "post"]);
  });

  it("only loads bodies for notes", () => {
    const post = listFeed({ limit: 100 }).posts.find((p) => p.slug === "post");
    expect(post?.text).toBeNull();
  });
});
