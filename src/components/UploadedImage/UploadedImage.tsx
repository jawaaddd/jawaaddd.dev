import Image from "next/image";
import { mediaUrl } from "@/lib/posts";
import { imageSize } from "@/lib/uploads";

type Props = { path: string; alt: string; sizes: string; className?: string };

/**
 * An image from uploads/ at its natural aspect ratio (read from the file), so
 * nothing shifts when it loads. Renders nothing if the file is missing.
 */
export async function UploadedImage({ path, alt, sizes, className }: Props) {
  const size = await imageSize(path);
  if (!size) return null;
  return (
    <Image
      src={mediaUrl(path)}
      alt={alt}
      width={size.width}
      height={size.height}
      sizes={sizes}
      className={className}
    />
  );
}
