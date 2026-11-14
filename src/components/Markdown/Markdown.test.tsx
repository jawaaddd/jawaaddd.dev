import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "./Markdown";

const render = (source: string) =>
  renderToStaticMarkup(<Markdown source={source} images={new Map()} />);

describe("Markdown", () => {
  it("never renders raw HTML from the file", () => {
    const html = render('Hello <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
  });

  it("drops javascript: links", () => {
    const html = render("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("renders # and ## one level below the post title, ### one below that", () => {
    const html = render("# One\n\n## Two\n\n### Three");
    expect(html).toMatch(/<h3[^>]*>One<\/h3>/);
    expect(html).toMatch(/<h3[^>]*>Two<\/h3>/);
    expect(html).toMatch(/<h4[^>]*>Three<\/h4>/);
    expect(html).not.toMatch(/<h[12][ >]/);
  });

  it("opens external links in a new tab and keeps internal ones in place", () => {
    const html = render("[GitHub](https://github.com/jawaaddd) and [About](/about)");
    expect(html).toContain(
      '<a href="https://github.com/jawaaddd" target="_blank" rel="noopener noreferrer">GitHub</a>',
    );
    expect(html).toContain('<a href="/about">About</a>');
  });

  it("makes code blocks keyboard-scrollable", () => {
    expect(render("```\nconst a = 1;\n```")).toContain('<pre tabindex="0"><code>');
  });

  it("supports GitHub-flavored Markdown", () => {
    const html = render("~~old~~\n\n| a | b |\n| - | - |\n| 1 | 2 |");
    expect(html).toContain("<del>old</del>");
    expect(html).toContain("<table>");
  });

  it("leaves out images that weren't uploaded", () => {
    const html = render('![Alt](missing.png "Caption")');
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<figure");
  });
});

describe("Markdown footnotes", () => {
  it("labels the footnotes for screen readers only, below the post title's level", () => {
    const html = renderToStaticMarkup(
      <Markdown source={"Text.[^1]\n\n[^1]: Note."} images={new Map()} />,
    );
    expect(html).toMatch(/<h3 class="visually-hidden" id="footnote-label">Footnotes<\/h3>/);
  });
});
