import { describe, expect, it } from "vitest";
import {
  charCount,
  excerptFromMarkdown,
  isDateInput,
  markdownImageRefs,
  slugify,
  titleFromMarkdown,
  validatePost,
  withoutLeadingTitle,
  type PostFields,
} from "./postInput";

const md = `# A feed grid that *packs* itself

![The grid](grid.png "Caption")

The feed mixes **notes**, photos and [longer posts](https://example.com) in one grid.
It wraps onto a second line.

## The problem

Second paragraph.`;

describe("titleFromMarkdown", () => {
  it("takes the first heading as plain text", () => {
    expect(titleFromMarkdown(md)).toBe("A feed grid that packs itself");
  });

  it("ignores headings inside code blocks", () => {
    expect(titleFromMarkdown("```md\n# Not this\n```\n\n## This one ##")).toBe("This one");
  });

  it("is empty without a heading", () => {
    expect(titleFromMarkdown("Just a paragraph.")).toBe("");
  });
});

describe("excerptFromMarkdown", () => {
  it("takes the first paragraph, joined and without markup", () => {
    expect(excerptFromMarkdown(md)).toBe(
      "The feed mixes notes, photos and longer posts in one grid. It wraps onto a second line.",
    );
  });

  it("skips lists, quotes and code", () => {
    const source = "- a list\n- of things\n\n> a quote\n\n```\ncode\n```\n\nThe words.";
    expect(excerptFromMarkdown(source)).toBe("The words.");
  });

  it("keeps underscores inside words", () => {
    expect(excerptFromMarkdown("Set grid_auto_flow and _this_ too.")).toBe(
      "Set grid_auto_flow and this too.",
    );
  });

  it("shortens long paragraphs at a word", () => {
    const excerpt = excerptFromMarkdown("word ".repeat(100), 40);
    expect(excerpt.length).toBeLessThanOrEqual(40);
    expect(excerpt).toMatch(/word…$/);
  });
});

describe("withoutLeadingTitle", () => {
  it("drops a first-line h1", () => {
    expect(withoutLeadingTitle("\n# Title\n\nBody").trim()).toBe("Body");
  });

  it("leaves other openings alone", () => {
    expect(withoutLeadingTitle("## Section\n\nBody")).toBe("## Section\n\nBody");
    expect(withoutLeadingTitle("Body\n\n# Later")).toBe("Body\n\n# Later");
  });
});

describe("markdownImageRefs", () => {
  it("lists local images once, skipping remote ones and code", () => {
    const source =
      '![a](grid.png "t") ![b](./holes.png)\n![c](https://x.com/a.png)\n![d](grid.png)\n```\n![e](no.png)\n```';
    expect(markdownImageRefs(source)).toEqual(["grid.png", "./holes.png"]);
  });
});

describe("slugify", () => {
  it.each([
    ["A feed grid that packs itself!", "a-feed-grid-that-packs-itself"],
    ["Don't panic: café edition", "dont-panic-cafe-edition"],
    ["  --Spaces--  ", "spaces"],
  ])("%s → %s", (input, slug) => {
    expect(slugify(input)).toBe(slug);
  });

  it("cuts long titles at a word", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(/^word(-word)*$/);
  });
});

describe("validatePost", () => {
  const base: PostFields = {
    type: "blogpost",
    title: "Title",
    slug: "title",
    body: "# Title\n\nBody",
    excerpt: "",
    caption: "",
    date: "2026-11-14",
    hasImage: false,
  };

  it("accepts a complete blogpost", () => {
    expect(validatePost(base)).toEqual({});
  });

  it("needs a file, title and a clean link name", () => {
    expect(validatePost({ ...base, body: " ", title: "", slug: "Not OK" })).toEqual({
      body: "Add a Markdown file.",
      title: "Enter a title.",
      slug: "Use lowercase letters, numbers and dashes, like my-first-post.",
    });
  });

  it("counts note characters the way people do", () => {
    const note = { ...base, type: "til" as const };
    expect(validatePost({ ...note, body: "😀".repeat(280) })).toEqual({});
    expect(validatePost({ ...note, body: "a".repeat(281) }).body).toBe(
      "Keep it to 280 characters.",
    );
    expect(charCount("😀")).toBe(1);
  });

  it("needs a photo for photo posts", () => {
    expect(validatePost({ ...base, type: "photo" }).image).toBe("Add a photo.");
  });

  it("rejects impossible dates", () => {
    expect(isDateInput("2026-02-30")).toBe(false);
    expect(validatePost({ ...base, date: "" }).date).toBe("Pick a date.");
  });
});
