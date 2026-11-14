import Image from "next/image";
import { formatDate } from "@/lib/dates";
import { isNote, mediaUrl, TYPE_LABELS, type Post } from "@/lib/posts";
import { imageSize } from "@/lib/uploads";
import { ModalShell, type ModalVariant } from "./ModalShell";
import styles from "./PostModal.module.css";

type Props = { post: Post; dismiss: "back" | "home" };

export async function PostModal({ post, dismiss }: Props) {
  const label = TYPE_LABELS[post.type];
  const date = formatDate(post.publishedAt);
  const variant: ModalVariant =
    post.type === "photo" ? "photo" : isNote(post.type) ? "note" : "wide";

  return (
    <ModalShell
      variant={variant}
      dismiss={dismiss}
      label={label}
      date={<time dateTime={post.publishedAt}>{date}</time>}
      title={variant === "wide" ? post.title : null}
      ariaLabel={`${label}, ${date}`}
      sharePath={`/post/${post.slug}`}
    >
      {variant === "note" && <p className={styles.noteText}>{post.body}</p>}

      {variant === "photo" && (
        <figure className={styles.figure}>
          {post.imagePath && (
            <PostImage
              path={post.imagePath}
              alt={post.caption ?? ""}
              sizes="(min-width: 640px) 878px, 100vw"
            />
          )}
          {post.caption && <figcaption className={styles.caption}>{post.caption}</figcaption>}
        </figure>
      )}

      {variant === "wide" && (
        <>
          {post.type === "project" && post.imagePath && (
            <PostImage path={post.imagePath} alt="" sizes="(min-width: 640px) 643px, 100vw" />
          )}
          {/* Plain paragraphs until Markdown rendering lands in phase 5. */}
          {post.body
            ?.split(/\n\s*\n/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </>
      )}
    </ModalShell>
  );
}

/** A full-width image at its natural aspect ratio, so nothing shifts when it loads. */
async function PostImage({ path, alt, sizes }: { path: string; alt: string; sizes: string }) {
  const size = await imageSize(path);
  if (!size) return null;
  return (
    <Image
      src={mediaUrl(path)}
      alt={alt}
      width={size.width}
      height={size.height}
      sizes={sizes}
      className={styles.image}
    />
  );
}
