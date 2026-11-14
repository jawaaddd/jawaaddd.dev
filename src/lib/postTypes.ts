/**
 * Post types and the shapes components render. No database access here, so
 * client components (the admin preview) can use it too.
 */

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

export const NOTE_TYPES = ["til", "thought", "idea"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const isNote = (type: PostType): type is NoteType =>
  type === "til" || type === "thought" || type === "idea";

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

/** Everything needed to show one post opened. */
export type Post = FeedPost & { body: string | null };

/** Public URL for a file stored under uploads/ on the data volume. */
export const mediaUrl = (imagePath: string) => `/media/${imagePath}`;
