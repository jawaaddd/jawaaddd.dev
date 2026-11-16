"use server";

import { headers } from "next/headers";
import { hasErrors, validateContact, type ContactErrors } from "@/lib/contact";
import { sendEmail } from "@/lib/email";
import { rateLimiter } from "@/lib/rateLimit";

export type ContactResult =
  | { status: "sent" }
  | { status: "invalid"; errors: ContactErrors }
  | { status: "failed"; message: string };

// Five messages per visitor per hour is plenty for a person and stops a flood.
const limiter = rateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

export async function sendContactMessage(input: {
  name: unknown;
  email: unknown;
  message: unknown;
  /** Honeypot: hidden from people, so only bots fill it in. */
  website: unknown;
}): Promise<ContactResult> {
  const text = (value: unknown) => (typeof value === "string" ? value : "");

  // Pretend a bot's message went through so it has no reason to retry.
  if (text(input.website)) return { status: "sent" };

  const { fields, errors } = validateContact({
    name: text(input.name),
    email: text(input.email),
    message: text(input.message),
  });
  if (hasErrors(errors)) return { status: "invalid", errors };

  // Railway's proxy sets X-Real-IP to the visitor's address. X-Forwarded-For can carry
  // whatever the visitor sent, which would let them dodge the limit.
  const ip = (await headers()).get("x-real-ip") || "unknown";
  if (!limiter.attempt(ip)) {
    return {
      status: "failed",
      message: "That's a lot of messages. Try again in an hour, or email me directly.",
    };
  }

  try {
    await sendEmail({
      // Line breaks in a name have no business in a subject line.
      subject: `Message from ${fields.name.replace(/\s+/g, " ")} via jawaaddd.dev`,
      text: `${fields.message}\n\n— ${fields.name} <${fields.email}>`,
      replyTo: fields.email,
    });
  } catch (error) {
    console.error("[contact] sending failed", error);
    return {
      status: "failed",
      message: "Your message couldn't be sent. Try again, or email me directly.",
    };
  }
  return { status: "sent" };
}
