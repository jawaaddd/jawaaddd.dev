import { Markdown } from "@/components/Markdown/Markdown";
import { UploadedImage } from "@/components/UploadedImage/UploadedImage";
import { formatDate } from "@/lib/dates";
import { getPostImages, isNote, TYPE_LABELS, type Post } from "@/lib/posts";
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
            <UploadedImage
              path={post.imagePath}
              alt={post.caption ?? ""}
              sizes="(min-width: 640px) 878px, 100vw"
              className={styles.image}
            />
          )}
          {post.caption && <figcaption className={styles.caption}>{post.caption}</figcaption>}
        </figure>
      )}

      {variant === "wide" && (
        <>
          {post.type === "project" && post.imagePath && (
            <UploadedImage
              path={post.imagePath}
              alt=""
              sizes="(min-width: 640px) 643px, 100vw"
              className={styles.image}
            />
          )}
          {post.body && <Markdown source={post.body} images={getPostImages(post.id)} />}
        </>
      )}
    </ModalShell>
  );
}
