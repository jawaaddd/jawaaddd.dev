import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/Admin/AdminNav";
import { BackupNow } from "@/components/Admin/BackupNow";
import styles from "@/components/Admin/Admin.module.css";
import backupStyles from "@/components/Admin/Backups.module.css";
import { requireAdmin } from "@/lib/auth";
import { listBackups, type BackupKind } from "@/lib/backup";
import { formatDate, formatTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Backups" };

const KIND_LABELS: Record<BackupKind, string> = {
  daily: "Daily",
  monthly: "Monthly",
  manual: "Manual",
};

export default function BackupsPage() {
  return (
    <>
      <AdminNav links />
      <main className={`container ${styles.page}`}>
        <header className={styles.titleRow}>
          <h1 className={styles.heading}>Backups</h1>
          <BackupNow />
        </header>
        <p className={backupStyles.intro}>
          Copies of the database, with every post’s text and settings. One is saved before your
          first change each day (the last 7 are kept) and one each month (the last 6). Images aren’t
          included; Railway’s volume backups cover those.
        </p>
        <Suspense fallback={null}>
          <Backups />
        </Suspense>
      </main>
    </>
  );
}

async function Backups() {
  await requireAdmin();
  const backups = await listBackups();
  if (backups.length === 0) {
    return (
      <p className={backupStyles.empty}>
        No backups yet. The first is saved before your next change.
      </p>
    );
  }

  return (
    <table className={backupStyles.table}>
      <thead>
        <tr>
          <th scope="col">Saved</th>
          <th scope="col">Kind</th>
          <th scope="col">Size</th>
          <th scope="col">
            <span className="visually-hidden">Download</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {backups.map((backup) => (
          <tr key={backup.name}>
            <td>
              {formatDate(backup.createdAt)}
              <span className={backupStyles.time}>{formatTime(backup.createdAt)}</span>
            </td>
            <td>{KIND_LABELS[backup.kind]}</td>
            <td className={backupStyles.size}>{formatSize(backup.bytes)}</td>
            <td className={backupStyles.download}>
              <a href={`/admin/backups/${backup.name}`} download>
                Download
                <span className="visually-hidden">
                  {" "}
                  the {KIND_LABELS[backup.kind].toLowerCase()} backup from{" "}
                  {formatDate(backup.createdAt)}, {formatTime(backup.createdAt)}
                </span>
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
