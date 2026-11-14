import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getPublishedPost } from "@/lib/posts";
import { MISSING_POST_PARAM } from "@/lib/routes";
import { PostModal } from "./PostModal";

type Props = { params: Promise<{ slug: string }>; dismiss: "back" | "home" };

/** Looks up the post for /post/[slug]; unknown slugs and drafts go back to the feed with a notice. */
export async function OpenPost({ params, dismiss }: Props) {
  await connection();
  const post = getPublishedPost((await params).slug);
  if (!post) redirect(`/?${MISSING_POST_PARAM}=1`);
  return <PostModal post={post} dismiss={dismiss} />;
}
