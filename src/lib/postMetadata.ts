import type { Metadata } from "next";
import { formatDate } from "./dates";
import { getPublishedPost, isNote, mediaUrl, TYPE_LABELS } from "./posts";

const DESCRIPTION_LENGTH = 160;

function truncate(text: string, length: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= length ? flat : `${flat.slice(0, length - 1).trimEnd()}…`;
}

/** Title, description and Open Graph tags for /post/[slug]. */
export function postMetadata(slug: string): Metadata {
  const post = getPublishedPost(slug);
  if (!post) return {};

  const title = post.title ?? `${TYPE_LABELS[post.type]}, ${formatDate(post.publishedAt)}`;
  const source = post.excerpt ?? (isNote(post.type) ? post.body : post.caption);
  const description = source ? truncate(source, DESCRIPTION_LENGTH) : undefined;
  const image = (post.type === "photo" || post.type === "project") && post.imagePath;

  return {
    title,
    description,
    alternates: { canonical: `/post/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/post/${post.slug}`,
      publishedTime: post.publishedAt,
      images: image ? [mediaUrl(image)] : undefined,
    },
  };
}
