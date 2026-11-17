import { site } from "./site";

type Email = { subject: string; text: string; replyTo: string };

/**
 * Sends an email to Jawad through Resend. Without RESEND_API_KEY (local
 * development) it logs the email instead. The variables are described in Admin.md.
 */
export async function sendEmail({ subject, text, replyTo }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || site.email;

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not set; not sending.\nTo: ${to}\nReply-To: ${replyTo}\nSubject: ${subject}\n\n${text}`,
    );
    return;
  }

  const from = process.env.CONTACT_FROM_EMAIL;
  if (!from) throw new Error("CONTACT_FROM_EMAIL must be set to send email");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
  }
}
