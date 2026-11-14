/**
 * Migrations, applied in order. `PRAGMA user_version` records how many have run,
 * so append new entries; never edit one that has shipped.
 */
export const migrations: string[] = [
  `
  CREATE TABLE posts (
    id            INTEGER PRIMARY KEY,
    type          TEXT NOT NULL CHECK (type IN ('blogpost','project','til','thought','idea','photo')),
    slug          TEXT NOT NULL UNIQUE,
    status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    title         TEXT,
    body_md       TEXT,
    excerpt       TEXT,
    image_path    TEXT,
    caption       TEXT,
    published_at  TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE post_images (
    id        INTEGER PRIMARY KEY,
    post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    filename  TEXT NOT NULL,
    path      TEXT NOT NULL
  );

  CREATE INDEX posts_feed ON posts (status, published_at DESC, id DESC);
  CREATE INDEX post_images_post ON post_images (post_id);
  `,
];
