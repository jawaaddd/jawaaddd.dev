import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Element } from "hast";
import { UploadedImage } from "@/components/UploadedImage/UploadedImage";
import { isExternalLink, resolveImage, type PostImages } from "@/lib/markdown";
import styles from "./Markdown.module.css";

type Props = { source: string; images: PostImages };

const IMAGE_SIZES = "(min-width: 640px) 643px, 100vw";

// The "Footnotes" label is for screen readers only, one level below the post title.
const FOOTNOTE_OPTIONS = {
  footnoteLabelTagName: "h2", // rendered as an h3 by the heading components below
  footnoteLabelProperties: { className: ["visually-hidden"] },
};

/**
 * A blogpost or project body. Raw HTML in the file is left out entirely and unsafe
 * URLs (javascript: and the like) are dropped. The post title is the page's only
 * top-level heading, so `#` and `##` both render as the first level below it.
 */
export function Markdown({ source, images }: Props) {
  const components: Components = {
    h1: heading("h3", styles.h2),
    h2: heading("h3", styles.h2),
    h3: heading("h4", styles.h3),
    h4: heading("h5", styles.h3),
    h5: heading("h6", styles.h3),
    h6: heading("h6", styles.h3),

    a: ({ href, children }) =>
      isExternalLink(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <a href={href}>{children}</a>
      ),

    // A paragraph holding only images becomes one figure per image, captioned
    // with the image's title: ![Alt text](grid.png "Caption").
    p: ({ node, children }) => {
      const figures = node && standaloneImages(node);
      if (!figures) return <p>{children}</p>;
      return figures.map(({ src, alt, title }, i) => {
        const path = resolveImage(src, images);
        if (!path) return null;
        return (
          <figure key={i} className={styles.figure}>
            <UploadedImage path={path} alt={alt} sizes={IMAGE_SIZES} className={styles.image} />
            {title && <figcaption>{title}</figcaption>}
          </figure>
        );
      });
    },

    // An image in the middle of text: shown inline, without a caption.
    img: ({ src, alt }) => {
      const path = resolveImage(typeof src === "string" ? src : undefined, images);
      return path ? (
        <UploadedImage path={path} alt={alt ?? ""} sizes={IMAGE_SIZES} className={styles.image} />
      ) : null;
    },

    // Long lines scroll sideways; tabIndex lets keyboard users scroll them.
    pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
    table: ({ children }) => (
      <div className={styles.tableScroll} tabIndex={0}>
        <table>{children}</table>
      </div>
    ),
  };

  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={FOOTNOTE_OPTIONS}
        components={components}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

/**
 * A heading shifted below the post title. Keeps a class it already has (the
 * visually hidden footnotes label), otherwise takes the heading style.
 */
function heading(Tag: "h3" | "h4" | "h5" | "h6", style: string) {
  return function Heading({ className, id, children }: React.ComponentProps<"h2">) {
    return (
      <Tag className={className ?? style} id={id}>
        {children}
      </Tag>
    );
  };
}

type ImageRef = { src: string | undefined; alt: string; title: string | undefined };

/** The images in a paragraph that contains nothing else (besides whitespace), or null. */
function standaloneImages(paragraph: Element): ImageRef[] | null {
  const refs: ImageRef[] = [];
  for (const child of paragraph.children) {
    if (child.type === "text" && !child.value.trim()) continue;
    if (child.type !== "element" || child.tagName !== "img") return null;
    const { src, alt, title } = child.properties;
    refs.push({
      src: typeof src === "string" ? src : undefined,
      alt: typeof alt === "string" ? alt : "",
      title: typeof title === "string" ? title : undefined,
    });
  }
  return refs.length > 0 ? refs : null;
}
