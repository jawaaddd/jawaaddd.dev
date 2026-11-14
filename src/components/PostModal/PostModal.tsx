import { UploadedImage } from "@/components/UploadedImage/UploadedImage";
import { formatDate } from "@/lib/dates";
import { resolveImage } from "@/lib/markdown";
import { getPostImages, TYPE_LABELS, type Post } from "@/lib/posts";
import { ModalShell } from "./ModalShell";
import { modalVariant, PostBody } from "./PostBody";

type Props = { post: Post; dismiss: "back" | "home" };

const MARKDOWN_IMAGE_SIZES = "(min-width: 640px) 643px, 100vw";

export async function PostModal({ post, dismiss }: Props) {
  const label = TYPE_LABELS[post.type];
  const date = formatDate(post.publishedAt);
  const variant = modalVariant(post.type);
  const images = variant === "wide" ? getPostImages(post.id) : new Map<string, string>();

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
      <PostBody
        post={post}
        renderImage={(path, alt, sizes, className) => (
          <UploadedImage path={path} alt={alt} sizes={sizes} className={className} />
        )}
        renderMarkdownImage={(src, alt, className) => {
          const path = resolveImage(src, images);
          return path ? (
            <UploadedImage
              path={path}
              alt={alt}
              sizes={MARKDOWN_IMAGE_SIZES}
              className={className}
            />
          ) : null;
        }}
      />
    </ModalShell>
  );
}
