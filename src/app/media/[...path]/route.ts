import fs from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { resolveUpload } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** Serves uploaded images from the data volume. Upload filenames are unique, so they cache forever. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[...path]">) {
  // Null for anything that resolves outside uploads/ (e.g. "..").
  const file = resolveUpload((await ctx.params).path);
  const type = file && CONTENT_TYPES[path.extname(file).toLowerCase()];
  if (!file || !type) return notFound();

  try {
    const body = await fs.readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}

const notFound = () => new Response("Not found", { status: 404 });
