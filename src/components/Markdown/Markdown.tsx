import { UploadedImage } from "@/components/UploadedImage/UploadedImage";
import { resolveImage, type PostImages } from "@/lib/markdown";
import { MarkdownView } from "./MarkdownView";

type Props = { source: string; images: PostImages };

const IMAGE_SIZES = "(min-width: 640px) 643px, 100vw";

/** A published post's body, with its images served from the uploads volume. */
export function Markdown({ source, images }: Props) {
  return (
    <MarkdownView
      source={source}
      renderImage={(src, alt, className) => {
        const path = resolveImage(src, images);
        return path ? (
          <UploadedImage path={path} alt={alt} sizes={IMAGE_SIZES} className={className} />
        ) : null;
      }}
    />
  );
}
