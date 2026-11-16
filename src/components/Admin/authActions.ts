"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfigError, endSession, passwordMatches, startSession } from "@/lib/auth";
import { rateLimiter } from "@/lib/rateLimit";

export type SignInState = { error: string | null };

// Enough for a few typos; slows password guessing to a crawl.
const limiter = rateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const configError = authConfigError();
  if (configError) return { error: configError };

  const password = formData.get("password");
  if (typeof password !== "string" || !password) return { error: "Enter your password." };

  // Railway's proxy sets X-Real-IP to the visitor's address. X-Forwarded-For can carry
  // whatever the visitor sent, which would let them dodge the limit.
  const ip = (await headers()).get("x-real-ip") || "unknown";
  if (!limiter.attempt(ip)) return { error: "Too many attempts. Try again in 15 minutes." };

  if (!passwordMatches(password)) return { error: "That password isn't right." };

  await startSession();
  redirect("/admin/posts");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/admin");
}
