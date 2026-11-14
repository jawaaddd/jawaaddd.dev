/**
 * Development only: replaces every post in the local database with sample
 * content so the feed has something to show. Never run against production.
 *
 *   npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { dataDir, open } from "../src/lib/db/connection";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV is production.");
  process.exit(1);
}

const db = open(path.join(dataDir(), "site.db"));
const uploads = path.join(dataDir(), "uploads", "seed");
fs.mkdirSync(uploads, { recursive: true });

/** A soft two-color gradient standing in for a photo. */
async function sampleImage(name: string, from: string, to: string, width = 1200, height = 1200) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="${width * 0.7}" cy="${height * 0.35}" r="${width * 0.18}" fill="#fff" fill-opacity="0.35"/>
  </svg>`;
  await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toFile(path.join(uploads, `${name}.webp`));
  return `seed/${name}.webp`;
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type Seed = {
  type: string;
  slug: string;
  status?: "draft" | "published";
  title?: string;
  body?: string;
  excerpt?: string;
  image?: string;
  caption?: string;
  days: number;
};

const sunset = await sampleImage("sunset", "#f59e0b", "#7c2d12");
const lake = await sampleImage("lake", "#0ea5e9", "#1e3a8a");
const forest = await sampleImage("forest", "#4d7c0f", "#14532d");
const desk = await sampleImage("desk", "#e7e5e4", "#57534e");
const grid = await sampleImage("grid", "#a5b4fc", "#312e81", 1200, 900);

const lorem =
  "This is sample content for local development. It stands in for a real post so the layout can be checked.";

const posts: Seed[] = [
  {
    type: "blogpost",
    slug: "sample-blogpost",
    title: "A sample blogpost title",
    excerpt: "The first line or two of the post, enough to tell someone whether to open it.",
    body: lorem,
    days: 0,
  },
  {
    type: "til",
    slug: "sample-til",
    body: "A one or two sentence thing learned today, kept short enough to read whole.",
    days: 1,
  },
  {
    type: "photo",
    slug: "sample-photo-sunset",
    image: sunset,
    caption: "Sunset from the balcony",
    days: 2,
  },
  {
    type: "thought",
    slug: "sample-thought",
    body: "An interesting thought, short enough to read whole.",
    days: 4,
  },
  {
    type: "project",
    slug: "sample-project",
    title: "A sample project write-up",
    excerpt: "The first line or two of the post, enough to tell someone whether to open it.",
    body: lorem,
    image: grid,
    days: 5,
  },
  { type: "photo", slug: "sample-photo-lake", image: lake, caption: "Short caption", days: 6 },
  {
    type: "photo",
    slug: "sample-photo-forest",
    image: forest,
    caption: "A longer caption that runs on for a while to see how it wraps",
    days: 7,
  },
  { type: "idea", slug: "sample-idea", body: "A project idea from the backlog.", days: 9 },
  {
    type: "blogpost",
    slug: "sample-blogpost-2",
    title: "A blogpost with a much longer title that wraps onto a second line",
    excerpt:
      "An excerpt long enough that it needs to be cut off after two lines, because it keeps going well past what fits in the tile at any width.",
    body: lorem,
    days: 11,
  },
  {
    type: "til",
    slug: "sample-til-280",
    body:
      "A note at the 280-character limit, to see how the tile copes. ".repeat(4).slice(0, 279) +
      ".",
    days: 13,
  },
  {
    type: "project",
    slug: "sample-project-no-image",
    title: "A project without a tile image",
    excerpt: "Without an image the text takes the full width of the tile.",
    body: lorem,
    days: 16,
  },
  {
    type: "photo",
    slug: "sample-photo-desk",
    image: desk,
    caption: "Light photo, dark text",
    days: 17,
  },
  // Page two, for "Older posts" in phase 4.
  {
    type: "thought",
    slug: "sample-thought-2",
    body: "An older thought from the second page.",
    days: 20,
  },
  {
    type: "blogpost",
    slug: "sample-blogpost-3",
    title: "An older blogpost",
    excerpt: "From the second page of the feed.",
    body: lorem,
    days: 24,
  },
  { type: "idea", slug: "sample-idea-2", body: "Another idea, further back.", days: 30 },
  // Must never appear publicly.
  {
    type: "blogpost",
    slug: "sample-draft",
    status: "draft",
    title: "DRAFT: should never appear",
    excerpt: "If you can see this on the public site, drafts are leaking.",
    body: lorem,
    days: 0,
  },
];

const insert = db.prepare(`
  INSERT INTO posts (type, slug, status, title, body_md, excerpt, image_path, caption, published_at, created_at, updated_at)
  VALUES (@type, @slug, @status, @title, @body, @excerpt, @image, @caption, @publishedAt, @now, @now)
`);

db.transaction(() => {
  db.exec("DELETE FROM posts");
  const now = new Date().toISOString();
  for (const post of posts) {
    const status = post.status ?? "published";
    insert.run({
      title: null,
      body: null,
      excerpt: null,
      image: null,
      caption: null,
      ...post,
      status,
      publishedAt: status === "published" ? daysAgo(post.days) : null,
      now,
    });
  }
})();

console.log(`Seeded ${posts.length} posts into ${dataDir()}`);
