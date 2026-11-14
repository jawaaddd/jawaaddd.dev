import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/Admin/AdminNav";
import { PostList, type PostListItem } from "@/components/Admin/PostList";
import styles from "@/components/Admin/Admin.module.css";
import form from "@/components/Form/Form.module.css";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { listAllPosts, TYPE_LABELS } from "@/lib/posts";

export const metadata: Metadata = { title: "Posts" };

export default function PostsPage() {
  return (
    <>
      <AdminNav links />
      <main className={`container ${styles.page}`}>
        <header className={styles.titleRow}>
          <h1 className={styles.heading}>Posts</h1>
          <Link href="/admin/posts/new" className={form.primary}>
            New post
          </Link>
        </header>
        <Suspense fallback={null}>
          <Posts />
        </Suspense>
      </main>
    </>
  );
}

async function Posts() {
  await requireAdmin();
  const posts: PostListItem[] = listAllPosts().map((post) => {
    const text = post.title ?? post.body ?? post.caption ?? "";
    return {
      id: post.id,
      label: TYPE_LABELS[post.type],
      text: text.replace(/\s+/g, " ").trim() || "Untitled",
      search: [post.title, post.body, post.caption].join(" ").toLowerCase(),
      date: post.publishedAt ? formatDate(post.publishedAt) : "",
      published: post.status === "published",
    };
  });
  return <PostList posts={posts} />;
}
