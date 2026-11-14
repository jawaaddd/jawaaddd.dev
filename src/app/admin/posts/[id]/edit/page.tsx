import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/Admin/AdminNav";
import { Composer, type ComposerPost } from "@/components/Admin/Composer";
import styles from "@/components/Admin/Admin.module.css";
import { requireAdmin } from "@/lib/auth";
import { dateInputValue } from "@/lib/dates";
import { getPostById, mediaUrl } from "@/lib/posts";

export const metadata: Metadata = { title: "Edit post" };

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  return (
    <>
      <AdminNav links />
      <main className={`container ${styles.page}`}>
        <Suspense fallback={<h1 className={styles.heading}>Edit post</h1>}>
          <EditPost params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const post = /^\d+$/.test(id) ? getPostById(Number(id)) : null;
  if (!post) notFound();

  const today = dateInputValue(new Date());
  const initial: ComposerPost = {
    id: post.id,
    type: post.type,
    published: post.status === "published",
    title: post.title ?? "",
    slug: post.slug,
    body: post.body ?? "",
    excerpt: post.excerpt ?? "",
    caption: post.caption ?? "",
    date: post.publishedAt ? dateInputValue(post.publishedAt) : today,
    image: post.imagePath
      ? { name: post.imagePath.split("/").pop()!, url: mediaUrl(post.imagePath) }
      : null,
    images: post.images.map((image) => ({ name: image.filename, url: mediaUrl(image.path) })),
  };

  return (
    <>
      <header className={styles.titleRow}>
        <h1 className={styles.heading}>Edit post</h1>
        {initial.published && (
          <Link href={`/post/${post.slug}`} className={styles.viewPost}>
            View post <span aria-hidden="true">→</span>
          </Link>
        )}
      </header>
      <Composer post={initial} today={today} />
    </>
  );
}
