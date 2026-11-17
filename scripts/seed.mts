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
  /** Images the Markdown body refers to: name used in the Markdown → path under uploads/. */
  images?: Record<string, string>;
  days: number;
};

const sunset = await sampleImage("sunset", "#f59e0b", "#7c2d12");
const lake = await sampleImage("lake", "#0ea5e9", "#1e3a8a");
const forest = await sampleImage("forest", "#4d7c0f", "#14532d");
const desk = await sampleImage("desk", "#e7e5e4", "#57534e");
const grid = await sampleImage("grid", "#a5b4fc", "#312e81", 1200, 900);

const gridShot = await sampleImage("grid-shot", "#d4d4d8", "#71717a", 1286, 724);
const wideShot = await sampleImage("wide-shot", "#fde68a", "#b45309", 1600, 500);

// The "Markdown rendering / Example project post" frame in Figma, as Markdown.
const projectMarkdown = `![The feed grid](grid-shot.webp "The grid at four columns. Wide tiles take two.")

The feed on this site mixes short notes, photos and longer posts in one grid. Tiles come in two sizes, so a naive layout leaves holes. This write-up covers how \`grid-auto-flow\` fixes that, with the full [layout notes on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-flow).

## The problem

A two-column tile that does not fit at the end of a row drops to the next one and leaves a gap behind it. With posts arriving in date order, that happens often.

- Notes and photos take one column.
- Blogposts and projects take two.
- The order should still read newest first.

### The fix

Dense packing lets later, smaller tiles move up into earlier holes.

\`\`\`css
.feed {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-flow: dense;
  gap: var(--space-6);
}

.tile--wide {
  grid-column: span 2;
}
\`\`\`

1. Set the column count per screen width.
2. Mark wide tiles with a span.
3. Turn on dense flow.

> Dense packing changes the visual order, not the document order. Keyboard and screen reader users still move through posts by date.

---

That is the whole trick. The same rule drives the three-column tablet layout and the two-column phone layout.
`;

// Everything else Markdown can do, to check edge cases.
const kitchenSinkMarkdown = `Opening paragraph with **bold**, *italic*, ~~struck~~ text, \`inline code\`, an [internal link](/about) and a bare URL: https://jawaaddd.dev.

# A top-level heading (renders like ##)

Text right after a heading.

#### A fourth-level heading

A paragraph with an inline image ![tiny](grid-shot.webp) in the middle of the text.

![A wide image](./images/wide-shot.webp)

![This image was never uploaded](missing.png "So it's left out")

\`\`\`
a very long line of code that keeps going and going so that the code block has to scroll sideways instead of wrapping onto the next line
\`\`\`

- A list item
  - A nested item
  - Another nested item
- Back to the top level

* [x] A finished task
* [ ] An unfinished task

| Breakpoint | Columns | Gap |
| --- | --- | --- |
| Below 640px | 2 | 16px |
| 640px | 3 | 24px |
| 1024px | 4 | 24px |

> A quote with two paragraphs.
>
> The second one.

A sentence with a footnote.[^1]

<div onclick="alert(1)">Raw HTML is left out.</div>

[^1]: The footnote text.
`;

const lorem =
  "This is sample content for local development. It stands in for a real post so the layout can be checked.";

const posts: Seed[] = [
  {
    type: "blogpost",
    slug: "sample-blogpost",
    title: "A sample blogpost title",
    excerpt: "The first line or two of the post, enough to tell someone whether to open it.",
    body: kitchenSinkMarkdown,
    images: { "grid-shot.webp": gridShot, "wide-shot.webp": wideShot },
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
    title: "A feed grid that packs itself",
    excerpt: "How dense grid packing keeps a mixed feed of wide and square tiles free of holes.",
    body: projectMarkdown,
    images: { "grid-shot.webp": gridShot },
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
  // Page two, for "Older posts".
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

const insertImage = db.prepare(
  "INSERT INTO post_images (post_id, filename, path) VALUES (?, ?, ?)",
);

db.transaction(() => {
  db.exec("DELETE FROM posts"); // post_images rows go with them (ON DELETE CASCADE)
  const now = new Date().toISOString();
  for (const { images, ...post } of posts) {
    const status = post.status ?? "published";
    const { lastInsertRowid } = insert.run({
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
    for (const [filename, path] of Object.entries(images ?? {})) {
      insertImage.run(lastInsertRowid, filename, path);
    }
  }
})();

console.log(`Seeded ${posts.length} posts into ${dataDir()}`);
