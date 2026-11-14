"use client";

import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef } from "react";
import { useToast } from "@/components/Toast/Toast";
import styles from "./PostModal.module.css";

export type ModalVariant = "wide" | "note" | "photo";

type Props = {
  variant: ModalVariant;
  /**
   * How closing leaves the post. "back" when it was opened from the feed (the
   * previous history entry is the feed); "home" when the post URL was loaded directly.
   */
  dismiss: "back" | "home";
  label: string;
  date: React.ReactNode;
  title?: string | null;
  /** Accessible name when there's no title (notes, photos). */
  ariaLabel: string;
  sharePath: string;
  children: React.ReactNode;
};

/**
 * The post modal: a native <dialog> opened with showModal(), which traps focus,
 * makes the page behind inert and handles Escape. Every way of closing it ends in
 * the dialog's "close" event, which is where the URL goes back to the feed.
 */
export function ModalShell({
  variant,
  dismiss,
  label,
  date,
  title,
  ariaLabel,
  sharePath,
  children,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    // Focus the dialog itself rather than its first button, so screen readers start at the title.
    dialog.focus();

    const onClose = () => {
      // "close" fires asynchronously; ignore one that arrives after the dialog was reopened
      // (React Strict Mode remounts components in development).
      if (dialog.open) return;
      if (dismiss === "back") router.back();
      else router.replace("/", { scroll: false });
    };
    dialog.addEventListener("close", onClose);

    return () => {
      dialog.removeEventListener("close", onClose);
      // Unmounting while open (the browser's Back button already left the post). Closing
      // before the dialog leaves the DOM returns focus to the tile that opened it.
      if (dialog.open) dialog.close();
    };
  }, [dismiss, router]);

  const close = () => dialogRef.current?.close();

  const share = async () => {
    try {
      await navigator.clipboard.writeText(new URL(sharePath, window.location.origin).href);
      toast("Link copied");
    } catch {
      toast("Couldn't copy the link");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modal} ${styles[variant]}`}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      tabIndex={-1}
      // A click on the dialog element itself (not its content) is a click on the dimmed backdrop.
      onClick={(event) => event.target === event.currentTarget && close()}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.metaRow}>
            <p className={styles.meta}>
              <span className={styles.label}>{label}</span>
              {date}
            </p>
            <button type="button" className={styles.close} onClick={close}>
              Close <span aria-hidden="true">×</span>
            </button>
          </div>
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
        </header>

        <div className={styles.body}>{children}</div>

        <footer className={styles.footer}>
          <button type="button" className={styles.share} onClick={share}>
            Share
          </button>
        </footer>
      </div>
    </dialog>
  );
}
