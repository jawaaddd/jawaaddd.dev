"use client";

import { useEffect, useRef } from "react";
import { navLinks } from "@/lib/site";
import { SiteLinkAnchor } from "@/components/SiteLinkAnchor/SiteLinkAnchor";
import styles from "./MobileMenu.module.css";

const DESKTOP_QUERY = "(min-width: 640px)";

export function MobileMenu() {
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

        <nav aria-label="Main">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <SiteLinkAnchor link={link} className={styles.row} onClick={close}>
                  <span className={styles.rowLabel}>{link.label}</span>
                  {link.note && <span className={styles.rowNote}>{link.note}</span>}
                </SiteLinkAnchor>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
