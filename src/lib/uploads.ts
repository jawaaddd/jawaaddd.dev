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
