import { connection } from "next/server";
import { Suspense } from "react";
import { Home } from "@/components/Home/Home";
import { OpenPost } from "@/components/PostModal/OpenPost";
import { postMetadata } from "@/lib/postMetadata";

export async function generateMetadata({ params }: PageProps<"/post/[slug]">) {
  await connection();
  return postMetadata((await params).slug);
}

/**
 * A post's own URL, loaded directly (a shared link or a refresh): the feed with
 * the post open over it. Closing replaces the URL with the home page.
 */
export default function PostPage({ params }: PageProps<"/post/[slug]">) {
  return (
    <>
      <Home />
      <Suspense fallback={null}>
        <OpenPost params={params} dismiss="home" />
      </Suspense>
    </>
  );
}
