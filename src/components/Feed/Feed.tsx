import { connection } from "next/server";
import { listFeed } from "@/lib/posts";
import { FeedGrid } from "./FeedGrid";
import { FeedTiles } from "./FeedTiles";
import styles from "./Feed.module.css";

export async function Feed() {
  // Posts live on the data volume, which only exists at request time (not during the build).
  await connection();
  const { posts, next } = listFeed();

  if (posts.length === 0) {
    return <p className={styles.empty}>Nothing here yet.</p>;
  }

  return (
    <FeedGrid next={next}>
      <FeedTiles posts={posts} />
    </FeedGrid>
  );
}
