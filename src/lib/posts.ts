/**
 * Post data access. Everything public reads through here, and every public
 * query filters to published posts, so drafts can't leak from a single page.
 * The admin functions at the bottom see drafts too; only the admin panel,
 * behind its session check, calls them. This is the only module that knows
 * posts live in SQLite.
 */
import { getDb } from "./db/connection";
import { isNote, type FeedPost, type Post, type PostType } from "./postTypes";

export * from "./postTypes";

export const FEED_PAGE_SIZE = 12;

/** Position of the last tile shown; the next page starts after it. */
export type FeedCursor = { publishedAt: string; id: number };

type FeedRow = {
  id: number;
  type: PostType;
  slug: string;
  title: string | null;
  excerpt: string | null;
  body_md: string | null;
  image_path: string | null;
  caption: string | null;
  published_at: string;
};

export function listFeed({
  after,
  limit = FEED_PAGE_SIZE,
}: { after?: FeedCursor; limit?: number } = {}): { posts: FeedPost[]; next: FeedCursor | null } {
  // Fetch one extra row to learn whether another page exists.
  const rows = getDb()
    .prepare<unknown[], FeedRow>(
      `SELECT id, type, slug, title, excerpt, image_path, caption, published_at,
              CASE WHEN type IN ('til', 'thought', 'idea') THEN body_md END AS body_md
         FROM posts
        WHERE status = 'published' AND published_at IS NOT NULL
          ${after ? "AND (published_at, id) < (?, ?)" : ""}
        ORDER BY published_at DESC, id DESC
        LIMIT ?`,
    )
    .all(...(after ? [after.publishedAt, after.id] : []), limit + 1);

  const page = rows.slice(0, limit).map(toFeedPost);
  const last = page.at(-1);
  return {
    posts: page,
    next: rows.length > limit && last ? { publishedAt: last.publishedAt, id: last.id } : null,
  };
}

function toFeedPost(row: FeedRow): FeedPost {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    text: isNote(row.type) ? row.body_md : null,
    imagePath: row.image_path,
    caption: row.caption,
    publishedAt: row.published_at,
  };
}

/** A published post by slug, or null if there's no such post or it's a draft. */
export function getPublishedPost(slug: string): Post | null {
  const row = getDb()
    .prepare<[string], FeedRow>(
      `SELECT id, type, slug, title, excerpt, body_md, image_path, caption, published_at
         FROM posts
        WHERE slug = ? AND status = 'published' AND published_at IS NOT NULL`,
    )
    .get(slug);
  return row ? { ...toFeedPost(row), body: row.body_md } : null;
}

/** The images uploaded with a Markdown post, keyed by the name the Markdown refers to them by. */
export function getPostImages(postId: number): Map<string, string> {
  const rows = getDb()
    .prepare<[number], { filename: string; path: string }>(
      "SELECT filename, path FROM post_images WHERE post_id = ?",
    )
    .all(postId);
  return new Map(rows.map((row) => [row.filename, row.path]));
}

// ---------- Admin: every post, drafts included ----------

export type PostStatus = "draft" | "published";

/** One row of the admin post list. */
export type AdminPostSummary = {
  id: number;
  type: PostType;
  slug: string;
  status: PostStatus;
  title: string | null;
  body: string | null;
  caption: string | null;
  publishedAt: string | null;
};

/** An image a Markdown post refers to: the name used in the file, and where it's stored. */
export type PostImageFile = { filename: string; path: string };

/** A post as the composer edits it. */
export type EditablePost = AdminPostSummary & {
  excerpt: string | null;
  imagePath: string | null;
  images: PostImageFile[];
};

/** What gets written for a post; the database fills in ids and timestamps. */
export type PostRecord = {
  type: PostType;
  slug: string;
  status: PostStatus;
  title: string | null;
  body: string | null;
  excerpt: string | null;
  imagePath: string | null;
  caption: string | null;
  publishedAt: string;
};

type AdminRow = {
  id: number;
  type: PostType;
  slug: string;
  status: PostStatus;
  title: string | null;
  body_md: string | null;
  excerpt: string | null;
  image_path: string | null;
  caption: string | null;
  published_at: string | null;
};

const toSummary = (row: AdminRow): AdminPostSummary => ({
  id: row.id,
  type: row.type,
  slug: row.slug,
  status: row.status,
  title: row.title,
  body: row.body_md,
  caption: row.caption,
  publishedAt: row.published_at,
});

/** Every post, newest first. */
export function listAllPosts(): AdminPostSummary[] {
  return getDb()
    .prepare<[], AdminRow>(
      `SELECT id, type, slug, status, title, body_md, excerpt, image_path, caption, published_at
         FROM posts
        ORDER BY published_at DESC, id DESC`,
    )
    .all()
    .map(toSummary);
}

export function getPostById(id: number): EditablePost | null {
  const row = getDb()
    .prepare<[number], AdminRow>(
      `SELECT id, type, slug, status, title, body_md, excerpt, image_path, caption, published_at
         FROM posts WHERE id = ?`,
    )
    .get(id);
  if (!row) return null;
  const images = getDb()
    .prepare<[number], PostImageFile>(
      "SELECT filename, path FROM post_images WHERE post_id = ? ORDER BY id",
    )
    .all(id);
  return { ...toSummary(row), excerpt: row.excerpt, imagePath: row.image_path, images };
}

export function isSlugTaken(slug: string, exceptId?: number): boolean {
  return !!getDb()
    .prepare<[string, number], { id: number }>("SELECT id FROM posts WHERE slug = ? AND id != ?")
    .get(slug, exceptId ?? -1);
}

/** `base`, or `base-2`, `base-3`… whichever no other post uses yet. */
export function uniqueSlug(base: string, exceptId?: number): string {
  let slug = base;
  for (let n = 2; isSlugTaken(slug, exceptId); n++) slug = `${base}-${n}`;
  return slug;
}

export function createPost(record: PostRecord, images: PostImageFile[]): number {
  const db = getDb();
  return db.transaction(() => {
    const now = new Date().toISOString();
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO posts (type, slug, status, title, body_md, excerpt, image_path, caption,
                            published_at, created_at, updated_at)
         VALUES (@type, @slug, @status, @title, @body, @excerpt, @imagePath, @caption,
                 @publishedAt, @now, @now)`,
      )
      .run({ ...record, now });
    const id = Number(lastInsertRowid);
    insertImages(id, images);
    return id;
  })();
}

/** Overwrites the post and replaces its set of Markdown images. */
export function updatePost(id: number, record: PostRecord, images: PostImageFile[]): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `UPDATE posts
          SET type = @type, slug = @slug, status = @status, title = @title, body_md = @body,
              excerpt = @excerpt, image_path = @imagePath, caption = @caption,
              published_at = @publishedAt, updated_at = @now
        WHERE id = @id`,
    ).run({ ...record, id, now: new Date().toISOString() });
    db.prepare("DELETE FROM post_images WHERE post_id = ?").run(id);
    insertImages(id, images);
  })();
}

/** Deletes the post (its image rows go with it). False if there was no such post. */
export function deletePost(id: number): boolean {
  return getDb().prepare("DELETE FROM posts WHERE id = ?").run(id).changes > 0;
}

function insertImages(postId: number, images: PostImageFile[]) {
  const insert = getDb().prepare(
    "INSERT INTO post_images (post_id, filename, path) VALUES (?, ?, ?)",
  );
  for (const image of images) insert.run(postId, image.filename, image.path);
}
