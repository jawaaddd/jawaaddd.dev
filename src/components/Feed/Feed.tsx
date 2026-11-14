import { connection } from "next/server";
import { listFeed } from "@/lib/posts";
import { Tile } from "./Tile";
import styles from "./Feed.module.css";

export async function Feed() {
  // Posts live on the data volume, which only exists at request time (not during the build).
  await connection();
  const { posts } = listFeed();

  if (posts.length === 0) {
    return <p className={styles.empty}>Nothing here yet.</p>;
  }

  return (
    <div className={styles.gridArea}>
      <ul className={styles.grid}>
        {posts.map((post) => (
          <li
            key={post.id}
            className={
              post.type === "blogpost" || post.type === "project" ? styles.wide : undefined
            }
          >
            <Tile post={post} />
          </li>
        ))}
      </ul>
    </div>
  );
}
