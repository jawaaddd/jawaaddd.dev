import { describe, expect, it } from "vitest";
import { isExternalLink, resolveImage } from "./markdown";

const images = new Map([
  ["grid.png", "posts/1/grid.png"],
  ["my photo.jpg", "posts/1/my-photo.jpg"],
]);

describe("resolveImage", () => {
  it("finds an image by the name it was uploaded under", () => {
    expect(resolveImage("grid.png", images)).toBe("posts/1/grid.png");
  });

  it("ignores a leading ./ and folders in the reference", () => {
    expect(resolveImage("./grid.png", images)).toBe("posts/1/grid.png");
    expect(resolveImage("images/grid.png", images)).toBe("posts/1/grid.png");
  });

  it("decodes escaped names and drops query strings and fragments", () => {
    expect(resolveImage("my%20photo.jpg", images)).toBe("posts/1/my-photo.jpg");
    expect(resolveImage("grid.png?v=2#top", images)).toBe("posts/1/grid.png");
  });

  it("returns null for unknown, remote or malformed references", () => {
    expect(resolveImage("missing.png", images)).toBeNull();
    expect(resolveImage("https://example.com/grid.png", images)).toBeNull();
    expect(resolveImage("//example.com/grid.png", images)).toBeNull();
    expect(resolveImage("data:image/png;base64,AAAA", images)).toBeNull();
    expect(resolveImage("%E0%A4%A", images)).toBeNull();
    expect(resolveImage(undefined, images)).toBeNull();
  });
});

describe("isExternalLink", () => {
  it("is true only for http(s) URLs", () => {
    expect(isExternalLink("https://github.com/jawaaddd")).toBe(true);
    expect(isExternalLink("http://example.com")).toBe(true);
    expect(isExternalLink("/about")).toBe(false);
    expect(isExternalLink("#section")).toBe(false);
    expect(isExternalLink("mailto:someone@example.com")).toBe(false);
    expect(isExternalLink(undefined)).toBe(false);
  });
});
