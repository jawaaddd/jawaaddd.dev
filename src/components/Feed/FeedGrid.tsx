"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/Toast/Toast";
import type { FeedCursor } from "@/lib/posts";
import { loadOlderPosts } from "./actions";
import styles from "./Feed.module.css";

type Page = { key: string; tiles: React.ReactNode };

/**
 * The tile grid plus "Older posts", which appends the next page to the same
 * grid (so it packs in with the tiles above) and moves focus to its first tile.
 */
export function FeedGrid({
  next,
  children,
}: {
  next: FeedCursor | null;
  children: React.ReactNode;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [cursor, setCursor] = useState(next);
  const [announcement, setAnnouncement] = useState("");
  const [pending, startTransition] = useTransition();
  const gridRef = useRef<HTMLUListElement>(null);
  const toast = useToast();
  // Index of the first tile of a page that just loaded, until it has been focused.
  const focusFrom = useRef<number | null>(null);

  // Move focus to the first new tile the filter hasn't faded. If they're all faded and
  // "Older posts" is gone, fall back to the last tile that can still be reached.
  useEffect(() => {
    const grid = gridRef.current;
    if (focusFrom.current === null || !grid) return;
    const from = focusFrom.current;
    focusFrom.current = null;
    const items = Array.from(grid.children) as HTMLElement[];
    const reachable = (item: HTMLElement) => !item.inert;
    const target = items.slice(from).find(reachable) ?? (cursor ? null : items.findLast(reachable));
    target?.querySelector("a")?.focus();
  }, [pages, cursor]);

  const loadMore = () => {
    if (!cursor || pending) return;
    startTransition(async () => {
      try {
        const older = await loadOlderPosts(cursor);
        focusFrom.current = gridRef.current?.children.length ?? 0;
        setPages((pages) => [
          ...pages,
          { key: `${cursor.publishedAt}-${cursor.id}`, tiles: older.tiles },
        ]);
        setCursor(older.next);
        setAnnouncement(`Loaded ${older.count} older ${older.count === 1 ? "post" : "posts"}.`);
      } catch {
        toast("Couldn't load older posts");
      }
    });
  };

  return (
    <div className={styles.gridArea}>
      <ul ref={gridRef} className={styles.grid}>
        {children}
        {pages.map((page) => (
          <Fragment key={page.key}>{page.tiles}</Fragment>
        ))}
      </ul>

      {cursor && (
        <button
          type="button"
          className={`text-link ${styles.older}`}
          aria-busy={pending}
          onClick={loadMore}
        >
          {pending ? "Loading…" : "Older posts →"}
        </button>
      )}

      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </div>
  );
}
