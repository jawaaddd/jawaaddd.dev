import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { mediaUrl, TYPE_LABELS, type FeedPost } from "@/lib/postTypes";
import styles from "./Tile.module.css";

// Image widths at the largest grid size (1120px container); the browser picks a smaller file below that.
const PHOTO_SIZES = "(min-width: 1024px) 262px, (min-width: 640px) 33vw, 50vw";
const PROJECT_SIZES = "(min-width: 1024px) 214px, 25vw";

type Props = {
  post: FeedPost;
  /**
   * The admin preview of a post that isn't saved yet: a plain box rather than a
   * link, and `post.imagePath` is a ready-to-use URL (often a local file).
   */
  preview?: boolean;
};

export function Tile({ post, preview = false }: Props) {
  switch (post.type) {
    case "blogpost":
    case "project":
      return <WideTile post={post} preview={preview} />;
    case "photo":
      return <PhotoTile post={post} preview={preview} />;
    default:
      return <NoteTile post={post} preview={preview} />;
  }
}

type TileLinkProps = Props & { className: string; children: React.ReactNode };

function TileLink({ post, preview, className, children }: TileLinkProps) {
  if (preview) return <div className={`${styles.tile} ${className}`}>{children}</div>;
  return (
    <Link href={`/post/${post.slug}`} scroll={false} className={`${styles.tile} ${className}`}>
      {children}
    </Link>
  );
}

type TileImageProps = { imagePath: string; preview: boolean; sizes: string; className?: string };

function TileImage({ imagePath, preview, sizes, className }: TileImageProps) {
  if (preview) {
    // eslint-disable-next-line @next/next/no-img-element -- local files can't go through the optimizer
    return <img src={imagePath} alt="" className={`${styles.fill} ${className ?? ""}`} />;
  }
  return <Image src={mediaUrl(imagePath)} alt="" fill sizes={sizes} className={className} />;
}

const Label = ({ post }: { post: FeedPost }) => (
  <span className={styles.label}>{TYPE_LABELS[post.type]}</span>
);

const TileDate = ({ post, className = styles.date }: { post: FeedPost; className?: string }) => (
  <time dateTime={post.publishedAt} className={className}>
    {formatDate(post.publishedAt)}
  </time>
);

function WideTile({ post, preview }: Required<Props>) {
  return (
    <TileLink post={post} preview={preview} className={styles.wide}>
      <div className={styles.body}>
        <div className={styles.text}>
          <Label post={post} />
          <h2 className={styles.title}>{post.title}</h2>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        </div>
        <TileDate post={post} />
      </div>
      {post.type === "project" && post.imagePath && (
        <div className={styles.projectImage}>
          <TileImage imagePath={post.imagePath} preview={preview} sizes={PROJECT_SIZES} />
        </div>
      )}
    </TileLink>
  );
}

function NoteTile({ post, preview }: Required<Props>) {
  return (
    <TileLink post={post} preview={preview} className={styles.note}>
      <div className={styles.text}>
        <Label post={post} />
        <p className={styles.noteText}>{post.text}</p>
      </div>
      <TileDate post={post} />
    </TileLink>
  );
}

function PhotoTile({ post, preview }: Required<Props>) {
  return (
    <TileLink post={post} preview={preview} className={styles.photo}>
      {post.imagePath && (
        <TileImage
          imagePath={post.imagePath}
          preview={preview}
          sizes={PHOTO_SIZES}
          className={styles.photoImage}
        />
      )}
      <Label post={post} />
      <div className={styles.meta}>
        {post.caption && <p className={styles.caption}>{post.caption}</p>}
        <TileDate post={post} className={styles.photoDate} />
      </div>
    </TileLink>
  );
}
