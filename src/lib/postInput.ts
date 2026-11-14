/**
 * Reading and checking what the composer sends. Shared by the composer (live
 * preview, inline errors) and the server action, which re-checks everything.
 */
import { isNote, type PostType } from "./postTypes";

export const POST_LIMITS = {
  title: 200,
  slug: 80,
  note: 280,
  caption: 300,
  excerpt: 300,
  markdownBytes: 1024 * 1024,
  imageBytes: 15 * 1024 * 1024,
};

/** Image formats uploads may use, by MIME type. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export type PostFields = {
  type: PostType;
  title: string;
  slug: string;
  /** The Markdown for blogposts and projects; the typed text for notes. */
  body: string;
  excerpt: string;
  caption: string;
  /** YYYY-MM-DD */
  date: string;
  /** Photo posts: whether an image is attached. */
  hasImage: boolean;
};

export type PostErrors = Partial<
  Record<"title" | "slug" | "body" | "excerpt" | "caption" | "date" | "image", string>
>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Characters as people count them (an emoji is one), which is what the 280 limit means. */
export const charCount = (text: string) => [...text].length;

export function validatePost(fields: PostFields): PostErrors {
  const errors: PostErrors = {};
  const { type } = fields;

  if (type === "blogpost" || type === "project") {
    if (!fields.body.trim()) errors.body = "Add a Markdown file.";
    if (!fields.title.trim()) errors.title = "Enter a title.";
    else if (fields.title.length > POST_LIMITS.title)
      errors.title = `Keep the title under ${POST_LIMITS.title} characters.`;
    if (!fields.slug) errors.slug = "Enter a link name.";
    else if (fields.slug.length > POST_LIMITS.slug)
      errors.slug = `Keep the link name under ${POST_LIMITS.slug} characters.`;
    else if (!SLUG_PATTERN.test(fields.slug))
      errors.slug = "Use lowercase letters, numbers and dashes, like my-first-post.";
    if (fields.excerpt.length > POST_LIMITS.excerpt)
      errors.excerpt = `Keep the excerpt under ${POST_LIMITS.excerpt} characters.`;
  } else if (isNote(type)) {
    if (!fields.body.trim()) errors.body = "Write something first.";
    else if (charCount(fields.body.trim()) > POST_LIMITS.note)
      errors.body = `Keep it to ${POST_LIMITS.note} characters.`;
  } else {
    if (!fields.hasImage) errors.image = "Add a photo.";
    if (fields.caption.length > POST_LIMITS.caption)
      errors.caption = `Keep the caption under ${POST_LIMITS.caption} characters.`;
  }

  if (!isDateInput(fields.date)) errors.date = "Pick a date.";
  return errors;
}

export const hasPostErrors = (errors: PostErrors) => Object.values(errors).some(Boolean);

/** A real calendar date written as YYYY-MM-DD. */
export function isDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** "A feed grid that packs itself!" → "a-feed-grid-that-packs-itself" */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents
    .toLowerCase()
    .replace(/['’]/g, "") // "don't" → "dont", not "don-t"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= POST_LIMITS.slug) return slug;
  // Cut at a word boundary when there is one.
  const cut = slug.slice(0, POST_LIMITS.slug + 1);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut.slice(0, POST_LIMITS.slug)).replace(
    /-+$/,
    "",
  );
}

// ---------- Markdown ----------

/** The file's lines, with those inside fenced code blocks marked so they're never read as Markdown. */
function markdownLines(markdown: string): { text: string; code: boolean }[] {
  let fence: string | null = null;
  return markdown.split(/\r?\n/).map((text) => {
    const marker = text.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      return { text, code: true };
    }
    if (marker) {
      fence = marker;
      return { text, code: true };
    }
    return { text, code: false };
  });
}

const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;

/** Inline Markdown reduced to the words a reader sees. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url)
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1") // [text][ref]
    .replace(/\[\^[^\]]+\]/g, "") // footnote markers
    .replace(/<(https?:\/\/[^>]+)>/g, "$1") // autolinks
    .replace(/<[^>]+>/g, "") // raw HTML tags
    .replace(/`+([^`]*)`+/g, "$1")
    .replace(/(\*\*|__|~~)(.+?)\1/g, "$2")
    .replace(/(^|[^\w*])[*_](\S(?:.*?\S)?)[*_](?![\w*])/g, "$1$2")
    .replace(/\\([\\`*_{}[\]()#+\-.!|~>])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** The text of the file's first heading, which becomes the post title. */
export function titleFromMarkdown(markdown: string): string {
  for (const line of markdownLines(markdown)) {
    const match = !line.code && line.text.match(HEADING);
    if (match) return plainText(match[2]);
  }
  return "";
}

/**
 * The first paragraph as plain text, for the tile. Headings, lists, quotes,
 * code, tables and image-only lines are skipped.
 */
export function excerptFromMarkdown(markdown: string, max = POST_LIMITS.excerpt): string {
  const lines = markdownLines(markdown);
  let paragraph: string[] = [];
  for (const line of [...lines, { text: "", code: false }]) {
    const text = line.text.trim();
    if (line.code || !text) {
      const excerpt = plainText(paragraph.join(" "));
      if (excerpt) return truncate(excerpt, max);
      paragraph = [];
      continue;
    }
    const startsBlock = paragraph.length === 0;
    const notProse =
      HEADING.test(line.text) ||
      /^([-*+]|\d+[.)])\s/.test(text) || // list item
      /^(>|\||<|!\[)/.test(text) || // quote, table, HTML, image
      /^([-*_])(\s*\1){2,}$/.test(text) || // thematic break
      /^\[\^?[^\]]+\]:/.test(text); // link or footnote definition
    if (notProse) {
      if (startsBlock) continue;
      // A paragraph ends where another block starts.
      const excerpt = plainText(paragraph.join(" "));
      if (excerpt) return truncate(excerpt, max);
      paragraph = [];
      continue;
    }
    paragraph.push(text);
  }
  return "";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/**
 * The body without its first line when that line is a top-level heading: it's
 * the title, which the post's header already shows.
 */
export function withoutLeadingTitle(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1 || !/^ {0,3}#[ \t]/.test(lines[first])) return markdown;
  return lines.slice(first + 1).join("\n");
}

/** The local images a Markdown file refers to (`![alt](grid.png)`), in order, without repeats. */
export function markdownImageRefs(markdown: string): string[] {
  const refs = new Set<string>();
  for (const line of markdownLines(markdown)) {
    if (line.code) continue;
    for (const match of line.text.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)/g)) {
      const src = match[1];
      if (!/^[a-z][a-z\d+.-]*:/i.test(src) && !src.startsWith("//")) refs.add(src);
    }
  }
  return [...refs];
}
