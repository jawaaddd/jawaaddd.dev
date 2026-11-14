"use server";

import { listFeed, type FeedCursor } from "@/lib/posts";
import { FeedTiles } from "./FeedTiles";

export type OlderPosts = { tiles: React.ReactNode; count: number; next: FeedCursor | null };

/** The page of tiles after `cursor`, rendered on the server. */
export async function loadOlderPosts(cursor: FeedCursor): Promise<OlderPosts> {
  // This is a public endpoint: only accept a well-formed cursor.
  if (
    typeof cursor?.publishedAt !== "string" ||
    Number.isNaN(Date.parse(cursor.publishedAt)) ||
    !Number.isSafeInteger(cursor.id)
  ) {
    throw new Error("Invalid feed cursor");
  }

  const { posts, next } = listFeed({
    after: { publishedAt: cursor.publishedAt, id: cursor.id },
  });
  return { tiles: <FeedTiles posts={posts} />, count: posts.length, next };
}
