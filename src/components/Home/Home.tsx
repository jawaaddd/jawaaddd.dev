import Link from "next/link";
import { Suspense } from "react";
import { Feed } from "@/components/Feed/Feed";
import { FeedFilterButtons, FeedFilterProvider } from "@/components/Feed/FeedFilter";
import { site } from "@/lib/site";
import { MissingPostNotice } from "./MissingPostNotice";
import styles from "./Home.module.css";

/** The intro and feed. Rendered at / and behind an open post at /post/[slug]. */
export function Home() {
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
        <FeedFilterProvider>
          <div className="container">
            <div className={styles.feedHeader}>
              <h1 id="feed-heading" className={styles.feedHeading}>
                My Feed
              </h1>
              <FeedFilterButtons />
            </div>
            <Suspense>
              <Feed />
            </Suspense>
          </div>
        </FeedFilterProvider>
      </section>

      <Suspense>
        <MissingPostNotice />
      </Suspense>
    </>
  );
}
