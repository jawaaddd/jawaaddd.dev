import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/Admin/AdminNav";
import { SignInForm } from "@/components/Admin/SignInForm";
import styles from "@/components/Admin/Admin.module.css";
import { isSignedIn } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <AdminNav />
      <main className={`container ${styles.page}`}>
        <div className={styles.signIn}>
          <header className={styles.signInHeader}>
            <h1 className={styles.heading}>Sign in</h1>
            <p className={styles.intro}>Only I can post here.</p>
          </header>
          <Suspense fallback={null}>
            <SignInOrSkip />
          </Suspense>
        </div>
      </main>
    </>
  );
}

/** Already signed in: straight to the posts. */
async function SignInOrSkip() {
  if (await isSignedIn()) redirect("/admin/posts");
  return <SignInForm />;
}
