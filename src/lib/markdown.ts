/** Uploaded images for one post: the name the Markdown uses → the file's path under uploads/. */
export type PostImages = ReadonlyMap<string, string>;

/**
 * The uploaded file a Markdown image reference points to, or null. References
 * match the names the images were uploaded under, so `![](grid.png)`,
 * `![](./grid.png)` and `![](images/grid.png)` all find "grid.png".
 */
export function resolveImage(src: string | undefined, images: PostImages): string | null {
  if (!src || /^[a-z][a-z\d+.-]*:/i.test(src) || src.startsWith("//")) return null;
  let name: string;
  try {
    name = decodeURIComponent(src.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  name = name.replace(/^\.\//, "");
  return images.get(name) ?? images.get(name.split("/").pop()!) ?? null;
}

/** Whether a link leaves the site (and so opens in a new tab). */
export const isExternalLink = (href: string | undefined) => !!href && /^https?:\/\//i.test(href);
