import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { mediaUrl, TYPE_LABELS, type FeedPost } from "@/lib/posts";
import styles from "./Tile.module.css";

// Image widths at the largest grid size (1120px container); the browser picks a smaller file below that.
const PHOTO_SIZES = "(min-width: 1024px) 262px, (min-width: 640px) 33vw, 50vw";
const PROJECT_SIZES = "(min-width: 1024px) 214px, 25vw";

export function Tile({ post }: { post: FeedPost }) {
  switch (post.type) {
    case "blogpost":
    case "project":
      return <WideTile post={post} />;
    case "photo":
      return <PhotoTile post={post} />;
    default:
      return <NoteTile post={post} />;
  }
}

type TileLinkProps = { post: FeedPost; className: string; children: React.ReactNode };

function TileLink({ post, className, children }: TileLinkProps) {
  return (
    <Link href={`/post/${post.slug}`} scroll={false} className={`${styles.tile} ${className}`}>
      {children}
    </Link>
  );
}

const Label = ({ post }: { post: FeedPost }) => (
  <span className={styles.label}>{TYPE_LABELS[post.type]}</span>
);

const TileDate = ({ post, className = styles.date }: { post: FeedPost; className?: string }) => (
  <time dateTime={post.publishedAt} className={className}>
    {formatDate(post.publishedAt)}
  </time>
);

function WideTile({ post }: { post: FeedPost }) {
  return (
    <TileLink post={post} className={styles.wide}>
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
          <Image src={mediaUrl(post.imagePath)} alt="" fill sizes={PROJECT_SIZES} />
        </div>
      )}
    </TileLink>
  );
}

function NoteTile({ post }: { post: FeedPost }) {
  return (
    <TileLink post={post} className={styles.note}>
      <div className={styles.text}>
        <Label post={post} />
        <p className={styles.noteText}>{post.text}</p>
      </div>
      <TileDate post={post} />
    </TileLink>
  );
}

function PhotoTile({ post }: { post: FeedPost }) {
  return (
    <TileLink post={post} className={styles.photo}>
      {post.imagePath && (
        <Image
          src={mediaUrl(post.imagePath)}
          alt=""
          fill
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
