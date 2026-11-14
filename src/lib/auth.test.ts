import { describe, expect, it } from "vitest";
import { hashPassword, signSession, verifyPassword, verifySession } from "./auth";

describe("password hashes", () => {
  const stored = hashPassword("correct horse");

  it("accepts the password and nothing else", () => {
    expect(verifyPassword("correct horse", stored)).toBe(true);
    expect(verifyPassword("correct horse ", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("salts every hash", () => {
    expect(hashPassword("correct horse")).not.toBe(stored);
  });

  it("rejects malformed hashes", () => {
    expect(verifyPassword("x", "plaintext")).toBe(false);
    expect(verifyPassword("x", "scrypt::")).toBe(false);
  });
});

describe("session tokens", () => {
  const key = "k".repeat(40);
  const now = 1_800_000_000_000;

  it("accepts its own unexpired token", () => {
    expect(verifySession(signSession(now + 1000, key), key, now)).toBe(true);
  });

  it("rejects expired, forged and re-keyed tokens", () => {
    expect(verifySession(signSession(now - 1, key), key, now)).toBe(false);
    const [, sig] = signSession(now + 1000, key).split(".");
    expect(verifySession(`${now + 999_999}.${sig}`, key, now)).toBe(false);
    expect(verifySession(signSession(now + 1000, key), "other".repeat(10), now)).toBe(false);
    expect(verifySession("garbage", key, now)).toBe(false);
  });
});
