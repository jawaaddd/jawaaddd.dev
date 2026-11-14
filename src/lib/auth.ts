/**
 * Admin sign-in. One password, stored only as a scrypt hash in
 * ADMIN_PASSWORD_HASH. A signed-in browser holds a cookie with an expiry time
 * and an HMAC of it, keyed by SESSION_SECRET plus the password hash, so
 * changing either signs every browser out.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const COOKIE = "admin_session";
const SESSION_DAYS = 30;
const MIN_SECRET_LENGTH = 32;

// ---------- Password hashes ----------

/** "scrypt:<salt>:<hash>", both base64url. Contains no "$", so .env files leave it alone. */
export function hashPassword(password: string, salt = randomBytes(16)): string {
  const hash = scryptSync(password.normalize("NFC"), salt, 64);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password.normalize("NFC"), Buffer.from(salt, "base64url"), 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---------- Session tokens ----------

/** "<expiry ms>.<signature>" */
export function signSession(expiresAt: number, key: string): string {
  return `${expiresAt}.${signature(String(expiresAt), key)}`;
}

export function verifySession(token: string, key: string, now = Date.now()): boolean {
  const [expiry, sig] = token.split(".");
  const expiresAt = Number(expiry);
  if (!sig || !Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  const expected = Buffer.from(signature(expiry, key));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const signature = (value: string, key: string) =>
  createHmac("sha256", key).update(value).digest("base64url");

// ---------- Configuration ----------

/** Why sign-in can't work on this server, or null if it's set up. */
export function authConfigError(): string | null {
  if (!process.env.ADMIN_PASSWORD_HASH?.startsWith("scrypt:"))
    return "Sign-in isn't set up: ADMIN_PASSWORD_HASH is missing. See Admin.md.";
  if ((process.env.SESSION_SECRET ?? "").length < MIN_SECRET_LENGTH)
    return `Sign-in isn't set up: SESSION_SECRET needs at least ${MIN_SECRET_LENGTH} characters. See Admin.md.`;
  return null;
}

const sessionKey = () =>
  authConfigError() ? null : `${process.env.SESSION_SECRET}\n${process.env.ADMIN_PASSWORD_HASH}`;

export function passwordMatches(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  return !authConfigError() && !!hash && verifyPassword(password, hash);
}

// ---------- The cookie ----------

export async function isSignedIn(): Promise<boolean> {
  const key = sessionKey();
  const token = (await cookies()).get(COOKIE)?.value;
  // Prefetches can render with the cookie but no request; the expiry check needs a real one.
  await connection();
  return !!key && !!token && verifySession(token, key);
}

/** For every admin page and action: sends anyone who isn't signed in to the sign-in page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) redirect("/admin");
}

export async function startSession(): Promise<void> {
  const key = sessionKey();
  if (!key) throw new Error("Sign-in isn't configured");
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  (await cookies()).set(COOKIE, signSession(Date.now() + maxAge * 1000, key), {
    httpOnly: true,
    // Browsers accept secure cookies on http://localhost, so this holds for local production runs too.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
