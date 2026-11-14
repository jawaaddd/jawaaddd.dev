"use client";

import { createContext, useContext, useId, useState } from "react";
import type { PostType } from "@/lib/posts";
import styles from "./Feed.module.css";

/** The post types the feed can be filtered to. Both can be on at once; neither means everything shows. */
const FILTERS = [
  { type: "project", label: "Projects" },
  { type: "blogpost", label: "Blogposts" },
] as const satisfies readonly { type: PostType; label: string }[];

type FilterType = (typeof FILTERS)[number]["type"];

type FilterState = {
  selected: ReadonlySet<FilterType>;
  setSelected: (selected: ReadonlySet<FilterType>) => void;
};

const FilterContext = createContext<FilterState | null>(null);

function useFilter() {
  const state = useContext(FilterContext);
  if (!state) throw new Error("Feed filter components must be inside <FeedFilterProvider>");
  return state;
}

export function FeedFilterProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<ReadonlySet<FilterType>>(new Set());
  return <FilterContext value={{ selected, setSelected }}>{children}</FilterContext>;
}

/** "Filter by:" Projects, Blogposts, None. */
export function FeedFilterButtons() {
  const { selected, setSelected } = useFilter();
  const labelId = useId();

  const toggle = (type: FilterType) => {
    const next = new Set(selected);
    if (!next.delete(type)) next.add(type);
    setSelected(next);
  };

  return (
    <div className={styles.filter} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={styles.filterLabel}>
        Filter by:
      </span>
      {FILTERS.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          className={styles.filterButton}
          aria-pressed={selected.has(type)}
          onClick={() => toggle(type)}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        className={styles.filterButton}
        aria-pressed={selected.size === 0}
        onClick={() => setSelected(new Set())}
      >
        None
      </button>
    </div>
  );
}

/**
 * One grid cell. A tile the filter excludes stays in place but fades, and is
 * inert: it can't be clicked, focused or reached by a screen reader.
 */
export function FeedItem({
  type,
  wide,
  children,
}: {
  type: PostType;
  wide: boolean;
  children: React.ReactNode;
}) {
  const { selected } = useFilter();
  const faded = selected.size > 0 && !selected.has(type as FilterType);
  return (
    <li
      className={`${styles.item} ${wide ? styles.wide : ""} ${faded ? styles.faded : ""}`}
      inert={faded}
    >
      {children}
    </li>
  );
}
