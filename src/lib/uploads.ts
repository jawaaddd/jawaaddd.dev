import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dataDir } from "./db/connection";

export const uploadsDir = () => path.join(dataDir(), "uploads");

/** Absolute path for a stored upload, or null if `relative` would escape uploads/. */
export function resolveUpload(relative: string | string[]): string | null {
  const root = uploadsDir();
  const file = path.resolve(root, ...[relative].flat());
  return file.startsWith(root + path.sep) ? file : null;
}

export type ImageSize = { width: number; height: number };

// Uploaded files never change in place (new uploads get new names), so sizes can be remembered.
const sizes = new Map<string, ImageSize | null>();

/** Pixel size of an uploaded image, read from its header. Null if it's missing or unreadable. */
export async function imageSize(relative: string): Promise<ImageSize | null> {
  if (sizes.has(relative)) return sizes.get(relative)!;
  const file = resolveUpload(relative);
  let size: ImageSize | null = null;
  if (file) {
    try {
      const { width, height, orientation } = await sharp(file).metadata();
      // EXIF orientations 5–8 are rotated a quarter turn, which swaps the displayed sides.
      size = orientation && orientation >= 5 ? { width: height, height: width } : { width, height };
    } catch {
      size = null;
    }
  }
  sizes.set(relative, size);
  return size;
}

// ---------- Saving uploads ----------

/** A problem with one uploaded file, worded for the person who uploaded it. */
export class UploadError extends Error {}

/**
 * Stores an uploaded image under a random name and returns its path under
 * uploads/. The bytes decide the format (not the name or the browser's claim),
 * and the image is re-encoded upright without metadata, so phone photos don't
 * publish their GPS location.
 */
export async function saveImage(file: File, maxBytes: number): Promise<string> {
  const name = path.basename(file.name).slice(0, 100) || "The image";
  if (file.size > maxBytes) {
    throw new UploadError(`${name} is over ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }
  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  let ext: string;
  try {
    const { format, compression } = await sharp(input).metadata();
    const image = sharp(input, { animated: true }).rotate();
    if (format === "jpeg") [output, ext] = [await image.jpeg({ quality: 90 }).toBuffer(), "jpg"];
    else if (format === "png") [output, ext] = [await image.png().toBuffer(), "png"];
    else if (format === "webp")
      [output, ext] = [await image.webp({ quality: 90 }).toBuffer(), "webp"];
    else if (format === "gif") [output, ext] = [await image.gif().toBuffer(), "gif"];
    else if (format === "heif" && compression === "av1")
      [output, ext] = [await image.avif({ quality: 70 }).toBuffer(), "avif"];
    else throw new UploadError();
  } catch {
    throw new UploadError(`${name} isn't a JPEG, PNG, WebP, GIF or AVIF image.`);
  }

  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const relative = `${dir}/${randomUUID()}.${ext}`;
  await fs.mkdir(path.join(uploadsDir(), dir), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), relative), output);
  return relative;
}

/** Deletes stored uploads. Best effort: a file that's already gone is fine. */
export async function removeUploads(paths: Iterable<string>): Promise<void> {
  await Promise.all(
    [...paths].map(async (relative) => {
      const file = resolveUpload(relative);
      sizes.delete(relative);
      if (file) await fs.rm(file, { force: true }).catch(() => {});
    }),
  );
}
