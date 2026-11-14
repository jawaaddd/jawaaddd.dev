"use client";

import { useEffect, useRef } from "react";
import type { SiteLink } from "@/lib/site";
import { SiteLinkAnchor } from "@/components/SiteLinkAnchor/SiteLinkAnchor";
import styles from "./MobileMenu.module.css";

const DESKTOP_QUERY = "(min-width: 640px)";

type Props = {
  links: SiteLink[];
  /** Names the menu's navigation landmark. */
  label: string;
  /** A last row that runs a server action instead of linking (Sign out). */
  action?: { label: string; run: () => Promise<void> };
};

export function MobileMenu({ links, label, action }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => dialogRef.current?.close();

  // The sheet only exists on mobile; close it if the viewport grows past the breakpoint.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => query.matches && dialogRef.current?.close();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        Menu
      </button>

      <dialog
        ref={dialogRef}
        className={styles.sheet}
        aria-labelledby="mobile-menu-title"
        // A click that lands on the dialog element itself is a click on the dimmed backdrop.
        onClick={(event) => event.target === event.currentTarget && close()}
      >
        <div className={styles.header}>
          <h2 id="mobile-menu-title" className={styles.title}>
            Menu
          </h2>
          <button type="button" className={styles.close} onClick={close}>
            Close <span aria-hidden="true">×</span>
          </button>
        </div>

        <nav aria-label={label}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <SiteLinkAnchor link={link} className={styles.row} onClick={close}>
                  <span className={styles.rowLabel}>{link.label}</span>
                  {link.note && <span className={styles.rowNote}>{link.note}</span>}
                </SiteLinkAnchor>
              </li>
            ))}
            {action && (
              <li>
                <form action={action.run}>
                  <button type="submit" className={styles.row}>
                    <span className={styles.rowLabel}>{action.label}</span>
                  </button>
                </form>
              </li>
            )}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
