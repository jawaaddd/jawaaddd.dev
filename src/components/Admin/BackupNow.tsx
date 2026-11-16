"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import form from "@/components/Form/Form.module.css";
import { useToast } from "@/components/Toast/Toast";
import { createBackup } from "./backupActions";

export function BackupNow() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  return (
    <button
      type="button"
      className={form.primary}
      aria-disabled={pending}
      onClick={() => {
        if (pending) return;
        startTransition(async () => {
          const { ok } = await createBackup();
          toast(ok ? "Backup saved" : "Couldn't save a backup");
          if (ok) router.refresh();
        });
      }}
    >
      {pending ? "Backing up…" : "Back up now"}
    </button>
  );
}
