"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./Toast.module.css";

const DURATION_MS = 4000;

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** Shows a message in the small dark popup above the footer. */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // `id` changes on every call so repeating the same message restarts the timer.
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const nextId = useRef(0);
  const regionRef = useRef<HTMLDivElement>(null);

  const show = useCallback<ShowToast>((message) => {
    // The region is a popover so it renders in the top layer. Re-showing it moves it
    // above anything opened since (like a modal <dialog>), which would otherwise cover it.
    const region = regionRef.current;
    if (region?.matches(":popover-open")) region.hidePopover();
    region?.showPopover();
    setToast({ message, id: nextId.current++ });
  }, []);

  useEffect(() => {
    regionRef.current?.showPopover();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* The live region stays shown and mounted so screen readers announce each new message. */}
      <div
        ref={regionRef}
        popover="manual"
        role="status"
        aria-live="polite"
        className={styles.region}
      >
        {toast && (
          <p key={toast.id} className={styles.toast}>
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
