import { describe, expect, it } from "vitest";
import { LIMITS, validateContact } from "./contact";
import { rateLimiter } from "./rateLimit";

const valid = { name: "Ada", email: "ada@example.com", message: "Hello!" };

describe("validateContact", () => {
  it("accepts a complete message and trims it", () => {
    const { fields, errors } = validateContact({ ...valid, name: "  Ada  " });
    expect(errors).toEqual({});
    expect(fields.name).toBe("Ada");
  });

  it("says what to fix for each empty field, in the design's words", () => {
    const { errors } = validateContact({ name: " ", email: "", message: "\n" });
    expect(errors).toEqual({
      name: "Enter your name.",
      email: "Enter a valid email address, like name@example.com.",
      message: "Write a message before sending.",
    });
  });

  it("rejects malformed email addresses", () => {
    for (const email of ["ada", "ada@", "ada@example", "a da@example.com", "@example.com"]) {
      expect(validateContact({ ...valid, email }).errors.email).toBeDefined();
    }
  });

  it("caps the length of every field", () => {
    const long = (n: number) => "x".repeat(n + 1);
    expect(validateContact({ ...valid, name: long(LIMITS.name) }).errors.name).toMatch(/under/);
    expect(validateContact({ ...valid, message: long(LIMITS.message) }).errors.message).toBe(
      "Keep your message under 5,000 characters.",
    );
  });
});

describe("rateLimiter", () => {
  it("allows up to the limit per key within the window, then resets", () => {
    const limiter = rateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.attempt("a", 0)).toBe(true);
    expect(limiter.attempt("a", 10)).toBe(true);
    expect(limiter.attempt("a", 20)).toBe(false);
    expect(limiter.attempt("b", 20)).toBe(true);
    expect(limiter.attempt("a", 1000)).toBe(true);
  });
});
