"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/Toast/Toast";
import { MISSING_POST_PARAM } from "@/lib/routes";

/** Shows the "doesn't exist" popup after /post/[slug] redirects here, then tidies the URL. */
export function MissingPostNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const missing = searchParams.has(MISSING_POST_PARAM);

  useEffect(() => {
    if (!missing) return;
    toast("Sorry, that post doesn't exist :(");
    router.replace(pathname, { scroll: false });
  }, [missing, pathname, router, toast]);

  return null;
}
