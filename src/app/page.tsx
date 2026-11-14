import Link from "next/link";
import { Suspense } from "react";
import { Feed } from "@/components/Feed/Feed";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <section className={styles.intro}>
        <div className={`container ${styles.introInner}`}>
          <p className={styles.introText}>{site.description}</p>
          <Link href="/about" className="text-link">
            More about me →
          </Link>
        </div>
      </section>

      <section className={styles.feed} aria-labelledby="feed-heading">
        <div className="container">
          <h1 id="feed-heading" className={styles.feedHeading}>
            My Feed
          </h1>
          <Suspense>
            <Feed />
          </Suspense>
        </div>
      </section>
    </>
  );
}
