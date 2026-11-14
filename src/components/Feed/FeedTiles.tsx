import type { FeedPost } from "@/lib/posts";
import { FeedItem } from "./FeedFilter";
import { Tile } from "./Tile";

/** Grid cells for a page of posts. Blogposts and projects span two columns. */
export function FeedTiles({ posts }: { posts: FeedPost[] }) {
  return posts.map((post) => (
    <FeedItem
      key={post.id}
      type={post.type}
      wide={post.type === "blogpost" || post.type === "project"}
    >
      <Tile post={post} />
    </FeedItem>
  ));
}
