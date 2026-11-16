"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { backupNow } from "@/lib/backup";

export async function createBackup(): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await backupNow();
  } catch (error) {
    console.error("[backup] manual backup failed", error);
    return { ok: false };
  }
  revalidatePath("/admin/backups");
  return { ok: true };
}
