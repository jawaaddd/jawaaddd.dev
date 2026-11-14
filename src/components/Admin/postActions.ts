"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { publishedAtFor } from "@/lib/dates";
import {
  createPost,
  deletePost,
  getPostById,
  isNote,
  isSlugTaken,
  POST_TYPES,
  uniqueSlug,
  updatePost,
  type EditablePost,
  type PostImageFile,
  type PostRecord,
  type PostStatus,
  type PostType,
} from "@/lib/posts";
import {
  excerptFromMarkdown,
  hasPostErrors,
  POST_LIMITS,
  validatePost,
  type PostErrors,
} from "@/lib/postInput";
import { removeUploads, saveImage, UploadError } from "@/lib/uploads";

export type SaveResult =
  | { status: "saved"; id: number; postStatus: PostStatus }
  | { status: "invalid"; errors: PostErrors }
  | { status: "failed"; message: string };

/**
 * Creates or updates a post from the composer. The form sends:
 * id (when editing), type, status, title, slug, body, excerpt, caption, date;
 * new files as photo, tileImage and images (the Markdown's images, by name);
 * and keepPhoto, keepTileImage, keepImages for files the post already has.
 */
export async function savePost(form: FormData): Promise<SaveResult> {
  await requireAdmin();

  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const file = (name: string) => {
    const value = form.get(name);
    return value instanceof File && value.size > 0 ? value : null;
  };

  const type = text("type") as PostType;
  const status: PostStatus = text("status") === "published" ? "published" : "draft";
  if (!POST_TYPES.includes(type)) return { status: "failed", message: "Pick a post type." };

  let existing: EditablePost | null = null;
  if (form.has("id")) {
    existing = getPostById(Number(text("id")));
    if (!existing) return { status: "failed", message: "This post was deleted." };
    if (family(existing.type) !== family(type))
      return { status: "failed", message: "A post can't change to that type." };
  }

  const wide = type === "blogpost" || type === "project";
  const photo = file("photo");
  const keepPhoto = text("keepPhoto") === "1" && !!existing?.imagePath;
  const fields = {
    type,
    title: wide ? text("title").trim() : "",
    slug: wide ? text("slug").trim() : "",
    body: type === "photo" ? "" : wide ? text("body") : text("body").trim(),
    excerpt: wide ? text("excerpt").trim() : "",
    caption: type === "photo" ? text("caption").trim() : "",
    date: text("date"),
    hasImage: !!photo || keepPhoto,
  };

  const errors = validatePost(fields);
  if (wide && Buffer.byteLength(fields.body) > POST_LIMITS.markdownBytes)
    errors.body = "That file is over 1 MB.";
  if (wide && !errors.slug && isSlugTaken(fields.slug, existing?.id))
    errors.slug = "Another post already uses this link name.";
  if (hasPostErrors(errors)) return { status: "invalid", errors };

  // Store new files first; if anything below fails, they're removed again.
  const written: string[] = [];
  const store = async (upload: File) => {
    const stored = await saveImage(upload, POST_LIMITS.imageBytes);
    written.push(stored);
    return stored;
  };

  try {
    let imagePath: string | null = null;
    let images: PostImageFile[] = [];

    if (type === "photo") {
      imagePath = photo ? await store(photo) : existing!.imagePath;
    } else if (type === "project") {
      const tile = file("tileImage");
      if (tile) imagePath = await store(tile);
      else if (text("keepTileImage") === "1") imagePath = existing?.imagePath ?? null;
    }

    if (wide) {
      // The Markdown refers to images by the names they were uploaded under. A new file
      // with the same name as a kept one replaces it.
      const uploads = form
        .getAll("images")
        .filter((v): v is File => v instanceof File && v.size > 0);
      const newNames = new Set(uploads.map(imageName));
      const keep = new Set(form.getAll("keepImages").map(String));
      images = (existing?.images ?? []).filter(
        (image) => keep.has(image.filename) && !newNames.has(image.filename),
      );
      for (const upload of uploads) {
        const filename = imageName(upload);
        images = images.filter((image) => image.filename !== filename);
        images.push({ filename, path: await store(upload) });
      }
    }

    const record: PostRecord = {
      type,
      status,
      slug: wide ? fields.slug : (existing?.slug ?? uniqueSlug(`${type}-${fields.date}`)),
      title: wide ? fields.title : null,
      body: fields.body || null,
      excerpt: wide ? fields.excerpt || excerptFromMarkdown(fields.body) || null : null,
      imagePath,
      caption: fields.caption || null,
      publishedAt: publishedAtFor(fields.date, existing?.publishedAt),
    };

    let id: number;
    if (existing) {
      id = existing.id;
      updatePost(id, record, images);
      // Files the post no longer uses.
      const used = new Set([imagePath, ...images.map((image) => image.path)]);
      await removeUploads(
        [existing.imagePath, ...existing.images.map((image) => image.path)].filter(
          (old): old is string => !!old && !used.has(old),
        ),
      );
    } else {
      id = createPost(record, images);
    }

    revalidatePath("/", "layout");
    return { status: "saved", id, postStatus: status };
  } catch (error) {
    await removeUploads(written);
    if (error instanceof UploadError) return { status: "failed", message: error.message };
    console.error("[admin] saving a post failed", error);
    return { status: "failed", message: "The post couldn't be saved. Try again." };
  }
}

export async function removePost(id: number): Promise<{ ok: boolean }> {
  await requireAdmin();
  const post = getPostById(id);
  if (!post || !deletePost(id)) return { ok: false };
  await removeUploads(
    [post.imagePath, ...post.images.map((image) => image.path)].filter(
      (path): path is string => !!path,
    ),
  );
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Types a post can switch between: they share the same fields. */
const family = (type: PostType) =>
  type === "photo" ? "photo" : isNote(type) ? "note" : "markdown";

/** The name the Markdown refers to an image by: only ever a lookup key, never a path on disk. */
const imageName = (upload: File) => upload.name.split(/[\\/]/).pop()!.slice(0, 200);
