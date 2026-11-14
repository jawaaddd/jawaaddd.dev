"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import form from "@/components/Form/Form.module.css";
import { useToast } from "@/components/Toast/Toast";
import { resolveImage } from "@/lib/markdown";
import {
  charCount,
  excerptFromMarkdown,
  hasPostErrors,
  IMAGE_TYPES,
  markdownImageRefs,
  POST_LIMITS,
  slugify,
  titleFromMarkdown,
  validatePost,
  type PostErrors,
  type PostFields,
} from "@/lib/postInput";
import { isNote, NOTE_TYPES, TYPE_LABELS, type NoteType, type PostType } from "@/lib/postTypes";
import { DropZone } from "./DropZone";
import { PostPreview } from "./PostPreview";
import { savePost } from "./postActions";
import styles from "./Composer.module.css";

/** A file the post has or will have. Stored files have a URL and no `file`. */
type Attachment = { name: string; url: string; file?: File };

/** The post being edited, as the edit page loads it. */
export type ComposerPost = {
  id: number;
  type: PostType;
  published: boolean;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  caption: string;
  date: string;
  /** The photo, or a project's tile image. */
  image: Attachment | null;
  /** The Markdown's images. */
  images: Attachment[];
};

type Choice = "blogpost" | "project" | "note" | "photo";
const CHOICES: { value: Choice; label: string }[] = [
  { value: "blogpost", label: "Blogpost" },
  { value: "project", label: "Project" },
  { value: "note", label: "Note" },
  { value: "photo", label: "Photo" },
];

const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
// Uploads go through a server action capped at 50 MB per request (next.config.ts).
const MAX_REQUEST_BYTES = 48 * 1024 * 1024;

const choiceOf = (type: PostType): Choice => (isNote(type) ? "note" : type);
const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function Composer({ post, today }: { post?: ComposerPost; today: string }) {
  const editing = !!post;
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState<"published" | "draft" | null>(null);

  const [type, setType] = useState<PostType>(post?.type ?? "blogpost");
  const [noteKind, setNoteKind] = useState<NoteType>(post && isNote(post.type) ? post.type : "til");
  const choice = choiceOf(type);
  const wide = choice === "blogpost" || choice === "project";

  // Blogpost and project
  const [markdown, setMarkdown] = useState<{ name: string; size: number; text: string } | null>(
    post && !isNote(post.type) && post.body
      ? { name: "Current file", size: new Blob([post.body]).size, text: post.body }
      : null,
  );
  const [images, setImages] = useState<Attachment[]>(post?.images ?? []);
  const [title, setTitle] = useState(post?.title ?? "");
  // Title and link name follow the file until they're typed in by hand.
  const [titleTyped, setTitleTyped] = useState(
    !!post && post.title !== titleFromMarkdown(post.body),
  );
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTyped, setSlugTyped] = useState(editing);
  const [excerpt, setExcerpt] = useState(
    post && post.excerpt !== excerptFromMarkdown(post.body) ? post.excerpt : "",
  );

  // Notes
  const [noteText, setNoteText] = useState(post && isNote(post.type) ? post.body : "");

  // Photo, or a project's tile image
  const [photo, setPhoto] = useState<Attachment | null>(post?.type === "photo" ? post.image : null);
  const [tileImage, setTileImage] = useState<Attachment | null>(
    post?.type === "project" ? post.image : null,
  );
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [date, setDate] = useState(post?.date ?? today);

  const [errors, setErrors] = useState<PostErrors & { images?: string; tileImage?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Local files are previewed through object URLs; free them when the page goes away.
  const objectUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const attach = (file: File): Attachment => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return { name: file.name, url, file };
  };

  const clearError = (key: keyof typeof errors) =>
    errors[key] && setErrors((errors) => ({ ...errors, [key]: undefined }));

  // ---------- Field changes ----------

  const chooseMarkdown = async ([file]: File[]) => {
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      return setErrors((e) => ({ ...e, body: "Choose a Markdown file (.md)." }));
    }
    if (file.size > POST_LIMITS.markdownBytes) {
      return setErrors((e) => ({ ...e, body: "That file is over 1 MB." }));
    }
    const text = await file.text();
    setMarkdown({ name: file.name, size: file.size, text });
    clearError("body");
    if (!titleTyped) {
      const fileTitle = titleFromMarkdown(text);
      setTitle(fileTitle);
      if (!slugTyped) setSlug(slugify(fileTitle));
    }
  };

  const addImages = (files: File[]) => {
    const tooBig = files.find((file) => file.size > POST_LIMITS.imageBytes);
    if (tooBig) return setErrors((e) => ({ ...e, images: `${tooBig.name} is over 15 MB.` }));
    // A new file replaces an attached one with the same name.
    const names = new Set(files.map((file) => file.name));
    setImages((images) => [
      ...images.filter((image) => !names.has(image.name)),
      ...files.map(attach),
    ]);
    clearError("images");
  };

  const chooseImage = ([file]: File[], key: "image" | "tileImage") => {
    if (file.size > POST_LIMITS.imageBytes) {
      return setErrors((e) => ({ ...e, [key]: `${file.name} is over 15 MB.` }));
    }
    (key === "image" ? setPhoto : setTileImage)(attach(file));
    clearError(key);
  };

  const changeTitle = (value: string) => {
    setTitle(value);
    setTitleTyped(true);
    if (!slugTyped) setSlug(slugify(value));
    clearError("title");
  };

  // ---------- Saving ----------

  const fields: PostFields = {
    type,
    title: title.trim(),
    slug: slug.trim(),
    body: wide ? (markdown?.text ?? "") : noteText.trim(),
    excerpt: excerpt.trim(),
    caption: caption.trim(),
    date,
    hasImage: !!photo,
  };

  const save = (status: "published" | "draft") => {
    if (pending) return;
    const found: typeof errors = validatePost(fields);
    if (hasPostErrors(found)) {
      setErrors(found);
      focusFirstError(found);
      return;
    }

    const data = new FormData();
    if (post) data.set("id", String(post.id));
    for (const [key, value] of Object.entries({ ...fields, status })) data.set(key, String(value));
    let uploadBytes = 0;
    const addFile = (name: string, attachment: Attachment | null, keepField: string) => {
      if (attachment?.file) {
        data.append(name, attachment.file, attachment.name);
        uploadBytes += attachment.file.size;
      } else if (attachment) {
        data.set(keepField, "1");
      }
    };
    if (choice === "photo") addFile("photo", photo, "keepPhoto");
    if (choice === "project") addFile("tileImage", tileImage, "keepTileImage");
    if (wide) {
      for (const image of images) {
        if (image.file) {
          data.append("images", image.file, image.name);
          uploadBytes += image.file.size;
        } else {
          data.append("keepImages", image.name);
        }
      }
    }
    if (uploadBytes > MAX_REQUEST_BYTES) {
      setFormError(
        "These files add up to more than 48 MB. Save with fewer images, then add the rest.",
      );
      return;
    }

    setFormError(null);
    setSubmitting(status);
    startTransition(async () => {
      try {
        const result = await savePost(data);
        if (result.status === "saved") {
          toast(
            status === "draft"
              ? post?.published
                ? "Post moved to drafts"
                : "Draft saved"
              : post?.published
                ? "Changes saved"
                : "Post published",
          );
          router.push("/admin/posts");
        } else if (result.status === "invalid") {
          setErrors(result.errors);
          focusFirstError(result.errors);
        } else {
          setFormError(result.message);
        }
      } catch {
        setFormError("The post couldn't be saved. Check your connection and try again.");
      } finally {
        setSubmitting(null);
      }
    });
  };

  const focusFirstError = (found: typeof errors) => {
    const order = [
      "body",
      "images",
      "tileImage",
      "image",
      "title",
      "slug",
      "excerpt",
      "caption",
      "date",
    ] as const;
    const first = order.find((key) => found[key]);
    if (first) document.getElementById(`${id}-${first}`)?.focus();
  };

  // ---------- Preview ----------

  const imageUrls = new Map(images.map((image) => [image.name, image.url]));
  const missingImages = markdown
    ? markdownImageRefs(markdown.text).filter((ref) => !resolveImage(ref, imageUrls))
    : [];
  const previewDate = `${date || today}T17:00:00Z`; // noon in New York, so the day reads right
  const preview = {
    id: post?.id ?? 0,
    type,
    slug,
    title: wide ? fields.title : null,
    excerpt: wide ? fields.excerpt || excerptFromMarkdown(fields.body) : null,
    text: isNote(type) ? noteText : null,
    body: choice === "photo" ? null : wide ? fields.body : noteText,
    imagePath:
      choice === "photo"
        ? (photo?.url ?? null)
        : choice === "project"
          ? (tileImage?.url ?? null)
          : null,
    caption: choice === "photo" ? fields.caption : null,
    publishedAt: previewDate,
  };

  // ---------- Form ----------

  const fieldProps = (key: keyof PostErrors) => ({
    id: `${id}-${key}`,
    className: form.input,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-error` : `${id}-${key}-hint`,
  });
  const fieldError = (key: keyof typeof errors) =>
    errors[key] && (
      <p id={`${id}-${key}-error`} className={form.error}>
        {errors[key]}
      </p>
    );
  const hint = (key: keyof PostErrors, text: React.ReactNode) => (
    <p id={`${id}-${key}-hint`} className={form.hint}>
      {text}
    </p>
  );
  const noteCount = charCount(noteText.trim());

  return (
    <div className={styles.columns}>
      <form className={styles.form} noValidate onSubmit={(event) => event.preventDefault()}>
        <div className={form.field} role="group" aria-labelledby={`${id}-type-label`}>
          <span id={`${id}-type-label`} className={form.label}>
            Type
          </span>
          <div className={form.toggles}>
            {CHOICES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={form.toggle}
                aria-pressed={choice === option.value}
                // A saved post can only switch to a type with the same fields.
                disabled={editing && !sameFields(choiceOf(post.type), option.value)}
                onClick={() => {
                  setType(option.value === "note" ? noteKind : option.value);
                  setErrors({});
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {choice === "note" && (
          <div className={form.field} role="group" aria-labelledby={`${id}-kind-label`}>
            <span id={`${id}-kind-label`} className={form.label}>
              Kind
            </span>
            <div className={form.toggles}>
              {NOTE_TYPES.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={form.toggle}
                  aria-pressed={type === kind}
                  onClick={() => {
                    setNoteKind(kind);
                    setType(kind);
                  }}
                >
                  {TYPE_LABELS[kind]}
                </button>
              ))}
            </div>
          </div>
        )}

        {wide && (
          <>
            <DropZone
              id={`${id}-body`}
              label="Markdown file"
              prompt="Drop a .md file here"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              onFiles={chooseMarkdown}
              attached={markdown && `${markdown.name} · ${formatSize(markdown.size)}`}
              onRemove={editing ? undefined : () => setMarkdown(null)}
              error={errors.body}
            />

            <DropZone
              id={`${id}-images`}
              label="Images used in the post"
              prompt="Drop the images the file refers to"
              accept={IMAGE_ACCEPT}
              multiple
              onFiles={addImages}
              attached={images.length > 0 ? images.map((image) => image.name).join(", ") : null}
              onRemove={() => setImages([])}
              hint={
                missingImages.length > 0 && (
                  <p className={form.hint}>Not uploaded yet: {missingImages.join(", ")}</p>
                )
              }
              error={errors.images}
            />

            {choice === "project" && (
              <DropZone
                id={`${id}-tileImage`}
                label="Tile image"
                prompt="Drop an image here"
                accept={IMAGE_ACCEPT}
                onFiles={(files) => chooseImage(files, "tileImage")}
                attached={tileImage?.name}
                onRemove={() => setTileImage(null)}
                hint={
                  <p className={form.hint}>
                    Optional. Shown on the tile and at the top of the post.
                  </p>
                }
                error={errors.tileImage}
              />
            )}

            <div className={form.field}>
              <label htmlFor={`${id}-title`} className={form.label}>
                Title
              </label>
              <input
                type="text"
                maxLength={POST_LIMITS.title}
                value={title}
                onChange={(event) => changeTitle(event.target.value)}
                {...fieldProps("title")}
              />
              {hint("title", "Filled in from the first heading in the file.")}
              {fieldError("title")}
            </div>

            <div className={form.field}>
              <label htmlFor={`${id}-slug`} className={form.label}>
                Link name
              </label>
              <input
                type="text"
                maxLength={POST_LIMITS.slug}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugTyped(true);
                  clearError("slug");
                }}
                {...fieldProps("slug")}
              />
              {hint(
                "slug",
                editing && post.published
                  ? "Used in the post's shareable address. Changing it breaks links already shared."
                  : "Used in the post's shareable address.",
              )}
              {fieldError("slug")}
            </div>

            {editing && (
              <div className={form.field}>
                <label htmlFor={`${id}-excerpt`} className={form.label}>
                  Excerpt
                </label>
                <textarea
                  maxLength={POST_LIMITS.excerpt}
                  placeholder={excerptFromMarkdown(fields.body)}
                  value={excerpt}
                  onChange={(event) => {
                    setExcerpt(event.target.value);
                    clearError("excerpt");
                  }}
                  {...fieldProps("excerpt")}
                  className={`${form.input} ${styles.excerpt}`}
                />
                {hint("excerpt", "Shown on the tile. Leave it empty to use the first paragraph.")}
                {fieldError("excerpt")}
              </div>
            )}
          </>
        )}

        {choice === "note" && (
          <div className={form.field}>
            <label htmlFor={`${id}-body`} className={form.label}>
              Text
            </label>
            <textarea
              value={noteText}
              onChange={(event) => {
                setNoteText(event.target.value);
                clearError("body");
              }}
              {...fieldProps("body")}
              aria-describedby={`${id}-body-hint${errors.body ? ` ${id}-body-error` : ""}`}
              className={`${form.input} ${styles.noteText}`}
            />
            <p
              id={`${id}-body-hint`}
              className={noteCount > POST_LIMITS.note ? form.error : form.hint}
            >
              {noteCount} of {POST_LIMITS.note} characters
            </p>
            {fieldError("body")}
          </div>
        )}

        {choice === "photo" && (
          <>
            <DropZone
              id={`${id}-image`}
              label="Photo"
              prompt="Drop an image here"
              accept={IMAGE_ACCEPT}
              onFiles={(files) => chooseImage(files, "image")}
              attached={photo?.name}
              onRemove={() => setPhoto(null)}
              error={errors.image}
            />
            <div className={form.field}>
              <label htmlFor={`${id}-caption`} className={form.label}>
                Caption
              </label>
              <input
                type="text"
                maxLength={POST_LIMITS.caption}
                value={caption}
                onChange={(event) => {
                  setCaption(event.target.value);
                  clearError("caption");
                }}
                {...fieldProps("caption")}
              />
              {fieldError("caption")}
            </div>
          </>
        )}

        <div className={form.field}>
          <label htmlFor={`${id}-date`} className={form.label}>
            Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              clearError("date");
            }}
            {...fieldProps("date")}
          />
          {!editing && hint("date", "Defaults to today.")}
          {fieldError("date")}
        </div>

        {formError && (
          <p className={form.error} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={form.primary}
            aria-disabled={pending}
            onClick={() => save("published")}
          >
            {submitting === "published" ? "Saving…" : post?.published ? "Save changes" : "Publish"}
          </button>
          <button
            type="button"
            className={form.secondary}
            aria-disabled={pending}
            onClick={() => save("draft")}
          >
            {submitting === "draft" ? "Saving…" : post?.published ? "Unpublish" : "Save draft"}
          </button>
        </div>
      </form>

      <PostPreview post={preview} images={imageUrls} />
    </div>
  );
}

/** Blogposts and projects share fields, so a saved one can switch between them. */
const sameFields = (a: Choice, b: Choice) =>
  a === b || ((a === "blogpost" || a === "project") && (b === "blogpost" || b === "project"));
