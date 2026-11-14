import { MarkdownView, type MarkdownImageRenderer } from "@/components/Markdown/MarkdownView";
import { withoutLeadingTitle } from "@/lib/postInput";
import { isNote, type Post, type PostType } from "@/lib/postTypes";
import styles from "./PostModal.module.css";

export type ModalVariant = "wide" | "note" | "photo";

export const modalVariant = (type: PostType): ModalVariant =>
  type === "photo" ? "photo" : isNote(type) ? "note" : "wide";

/** Draws the post's own image (a photo, or a project's tile image) from `post.imagePath`. */
export type PostImageRenderer = (
  imagePath: string,
  alt: string,
  sizes: string,
  className: string,
) => React.ReactNode;

type Props = {
  post: Post;
  renderImage: PostImageRenderer;
  renderMarkdownImage: MarkdownImageRenderer;
};

/**
 * What an opened post shows under its header. Shared by the post modal and the
 * admin preview, which draw images differently (stored uploads vs. local files).
 */
export function PostBody({ post, renderImage, renderMarkdownImage }: Props) {
  const variant = modalVariant(post.type);

  if (variant === "note") return <p className={styles.noteText}>{post.body}</p>;

  if (variant === "photo") {
    return (
      <figure className={styles.figure}>
        {post.imagePath &&
          renderImage(
            post.imagePath,
            post.caption ?? "",
            "(min-width: 640px) 878px, 100vw",
            styles.image,
          )}
        {post.caption && <figcaption className={styles.caption}>{post.caption}</figcaption>}
      </figure>
    );
  }

  return (
    <>
      {post.type === "project" &&
        post.imagePath &&
        renderImage(post.imagePath, "", "(min-width: 640px) 643px, 100vw", styles.image)}
      {/* The file's leading "# Title" is already the header's title. */}
      {post.body && (
        <MarkdownView source={withoutLeadingTitle(post.body)} renderImage={renderMarkdownImage} />
      )}
    </>
  );
}
