import { connection } from "next/server";
import { Suspense } from "react";
import { OpenPost } from "@/components/PostModal/OpenPost";
import { postMetadata } from "@/lib/postMetadata";

export async function generateMetadata({ params }: PageProps<"/post/[slug]">) {
  await connection();
  return postMetadata((await params).slug);
}

/** A post opened from the feed: shown over it, and closing goes back in history. */
export default function InterceptedPost({ params }: PageProps<"/post/[slug]">) {
  return (
    <Suspense fallback={null}>
      <OpenPost params={params} dismiss="back" />
    </Suspense>
  );
}
