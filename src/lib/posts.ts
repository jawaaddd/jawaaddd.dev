/**
 * Post data access. Everything public reads through here, and every public
 * query filters to published posts, so drafts can't leak from a single page.
 * This is the only module that knows posts live in SQLite.
 */
import { getDb } from "./db/connection";

export const POST_TYPES = ["blogpost", "project", "til", "thought", "idea", "photo"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const TYPE_LABELS: Record<PostType, string> = {
  blogpost: "Blogpost",
  project: "Project",
  til: "TIL",
  thought: "Thought",
  idea: "Idea",
  photo: "Photo",
};

export const FEED_PAGE_SIZE = 12;

/** What a tile needs. Bodies are only loaded for notes, whose tile shows the full text. */
export type FeedPost = {
  id: number;
  type: PostType;
  slug: string;
  title: string | null;
  excerpt: string | null;
  text: string | null;
  imagePath: string | null;
  caption: string | null;
  publishedAt: string;
};

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

/** Everything needed to show one post opened. */
export type Post = FeedPost & { body: string | null };

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

export const isNote = (type: PostType) => type === "til" || type === "thought" || type === "idea";

/** Public URL for a file stored under uploads/ on the data volume. */
export const mediaUrl = (imagePath: string) => `/media/${imagePath}`;
