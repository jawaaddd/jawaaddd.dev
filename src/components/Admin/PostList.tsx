"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import form from "@/components/Form/Form.module.css";
import { useToast } from "@/components/Toast/Toast";
import { removePost } from "./postActions";
import styles from "./PostList.module.css";

export type PostListItem = {
  id: number;
  label: string;
  /** Title, note text or caption, on one line. */
  text: string;
  /** Lowercased title, body and caption, for the search box. */
  search: string;
  date: string;
  published: boolean;
};

export function PostList({ posts }: { posts: PostListItem[] }) {
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<PostListItem | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const toast = useToast();

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = posts.filter((post) => terms.every((term) => post.search.includes(term)));

  const askToDelete = (post: PostListItem) => {
    setDeleting(post);
    dialogRef.current?.showModal();
    // Start on Cancel, so pressing Enter right away never deletes.
    cancelRef.current?.focus();
  };

  const confirmDelete = () => {
    if (!deleting || pending) return;
    startTransition(async () => {
      const { ok } = await removePost(deleting.id);
      dialogRef.current?.close();
      toast(ok ? "Post deleted" : "Couldn't delete the post");
      router.refresh();
    });
  };

  return (
    <>
      <input
        type="search"
        aria-label="Search posts"
        placeholder="Search posts by title or text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={`${form.input} ${styles.search}`}
      />
      <p className="visually-hidden" role="status">
        {terms.length > 0 &&
          `${shown.length} ${shown.length === 1 ? "post matches" : "posts match"}`}
      </p>

      {shown.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.type}>
                Type
              </th>
              <th scope="col">Post</th>
              <th scope="col" className={styles.date}>
                Date
              </th>
              <th scope="col" className={styles.status}>
                Status
              </th>
              <th scope="col" className={styles.actions}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((post) => (
              <tr key={post.id}>
                <td className={styles.type}>{post.label}</td>
                <td className={styles.text}>{post.text}</td>
                <td className={styles.date}>{post.date}</td>
                <td className={styles.status} data-draft={!post.published || undefined}>
                  {post.published ? "Published" : "Draft"}
                </td>
                <td className={styles.actions}>
                  <Link href={`/admin/posts/${post.id}/edit`} className={styles.edit}>
                    Edit<span className="visually-hidden"> “{post.text}”</span>
                  </Link>
                  <button type="button" className={styles.delete} onClick={() => askToDelete(post)}>
                    Delete<span className="visually-hidden"> “{post.text}”</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.empty}>
          {posts.length === 0 ? "No posts yet." : `No posts match “${query.trim()}”.`}
        </p>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="delete-title"
        onClose={() => setDeleting(null)}
        // A click on the dialog element itself is a click on the dimmed backdrop.
        onClick={(event) => event.target === event.currentTarget && dialogRef.current?.close()}
      >
        <h2 id="delete-title" className={styles.dialogTitle}>
          Delete this post?
        </h2>
        <p className={styles.dialogText}>
          “{deleting?.text}” and its images will be removed from the site. This can’t be undone.
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.confirmDelete}
            aria-disabled={pending}
            onClick={confirmDelete}
          >
            {pending ? "Deleting…" : "Delete post"}
          </button>
          <button
            ref={cancelRef}
            type="button"
            className={form.secondary}
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
        </div>
      </dialog>
    </>
  );
}
