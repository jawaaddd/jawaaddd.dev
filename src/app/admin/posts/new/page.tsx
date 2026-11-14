import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/Admin/AdminNav";
import { Composer } from "@/components/Admin/Composer";
import styles from "@/components/Admin/Admin.module.css";
import { requireAdmin } from "@/lib/auth";
import { dateInputValue } from "@/lib/dates";

export const metadata: Metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <>
      <AdminNav links />
      <main className={`container ${styles.page}`}>
        <h1 className={styles.heading}>New post</h1>
        <Suspense fallback={null}>
          <NewPost />
        </Suspense>
      </main>
    </>
  );
}

async function NewPost() {
  await requireAdmin();
  return <Composer today={dateInputValue(new Date())} />;
}
