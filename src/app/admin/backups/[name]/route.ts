import fs from "node:fs/promises";
import { isSignedIn } from "@/lib/auth";
import { backupPath } from "@/lib/backup";

/** Downloads one database copy from DATA_DIR/backups. */
export async function GET(_request: Request, { params }: RouteContext<"/admin/backups/[name]">) {
  if (!(await isSignedIn()))
    return new Response(null, { status: 303, headers: { Location: "/admin" } });

  const { name } = await params;
  const file = backupPath(name);
  const data = file && (await fs.readFile(file).catch(() => null));
  if (!data) return new Response("No such backup.", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
    },
  });
}
