import Link from "next/link";
import type { ComponentProps } from "react";
import type { SiteLink } from "@/lib/site";

type Props = Omit<ComponentProps<"a">, "href"> & { link: SiteLink };

/** Renders a SiteLink as a client-side route, or a plain anchor for files and other sites. */
export function SiteLinkAnchor({ link, children, ...rest }: Props) {
  const content = children ?? link.label;

  if (link.href.startsWith("/") && !link.newTab) {
    return (
      <Link href={link.href} {...rest}>
        {content}
      </Link>
    );
  }

  const newTab = link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a href={link.href} {...newTab} {...rest}>
      {content}
    </a>
  );
}
