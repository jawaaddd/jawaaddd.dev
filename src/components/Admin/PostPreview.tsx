import { Tile } from "@/components/Feed/Tile";
import { modalVariant, PostBody } from "@/components/PostModal/PostBody";
import modal from "@/components/PostModal/PostModal.module.css";
import { formatDate } from "@/lib/dates";
import { resolveImage, type PostImages } from "@/lib/markdown";
import { TYPE_LABELS, type Post } from "@/lib/postTypes";
import styles from "./Composer.module.css";

type Props = {
  /** `imagePath` is a URL here: a local file being uploaded, or the stored image. */
  post: Post;
  /** The Markdown's images: name used in the file → URL. */
  images: PostImages;
};

/**
 * The tile and the opened post as they'll look once published, drawn from the
 * form's current state. Only a picture: nothing in it can be clicked or focused.
 */
export function PostPreview({ post, images }: Props) {
  const variant = modalVariant(post.type);
  const label = TYPE_LABELS[post.type];

  return (
    <section className={styles.preview} aria-labelledby="preview-title">
      <header className={styles.previewHeader}>
        <h2 id="preview-title" className={styles.previewTitle}>
          Preview
        </h2>
        <p className={styles.previewIntro}>
          Updates as you type or upload. Nothing is public until you publish.
        </p>
      </header>

      <div className={styles.previewPart} inert>
        <h3 className={styles.previewLabel}>In the feed</h3>
        <div className={`${styles.tileFrame} ${variant === "wide" ? styles.wideTile : ""}`}>
          <Tile post={post} preview />
        </div>
      </div>

      <div className={styles.previewPart} inert>
        <h3 className={styles.previewLabel}>Opened</h3>
        <div className={`${styles.opened} ${variant === "note" ? styles.openedNote : ""}`}>
          <div className={styles.openedHeader}>
            <div className={modal.metaRow}>
              <p className={modal.meta}>
                <span className={modal.label}>{label}</span>
                {formatDate(post.publishedAt)}
              </p>
              <span className={styles.openedClose}>
                Close <span aria-hidden="true">×</span>
              </span>
            </div>
            {variant === "wide" && post.title && <p className={modal.title}>{post.title}</p>}
          </div>
          <div className={styles.openedBody}>
            <PostBody
              post={post}
              renderImage={(src, alt, _sizes, className) => (
                // eslint-disable-next-line @next/next/no-img-element -- local files can't go through the optimizer
                <img src={src} alt={alt} className={className} />
              )}
              renderMarkdownImage={(src, alt, className) => {
                const url = resolveImage(src, images);
                // eslint-disable-next-line @next/next/no-img-element -- as above
                return url ? <img src={url} alt={alt} className={className} /> : null;
              }}
            />
          </div>
          <div className={styles.openedFooter}>
            <span className={styles.openedShare}>Share</span>
          </div>
        </div>
      </div>
    </section>
  );
}
