// Contact form rules, shared by the form (instant feedback) and the server action (the real check).

export type ContactFields = { name: string; email: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;

export const LIMITS = { name: 100, email: 254, message: 5000 } as const;

// Deliberately loose: something@something.something, no spaces. The mail service does the rest.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trims the fields and returns what's wrong with each, worded as what to fix. */
export function validateContact(input: ContactFields): {
  fields: ContactFields;
  errors: ContactErrors;
} {
  const fields = {
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
  };
  const errors: ContactErrors = {};

  if (!fields.name) errors.name = "Enter your name.";
  else if (fields.name.length > LIMITS.name)
    errors.name = `Keep your name under ${LIMITS.name} characters.`;

  if (!EMAIL.test(fields.email) || fields.email.length > LIMITS.email)
    errors.email = "Enter a valid email address, like name@example.com.";

  if (!fields.message) errors.message = "Write a message before sending.";
  else if (fields.message.length > LIMITS.message)
    errors.message = `Keep your message under ${LIMITS.message.toLocaleString("en-US")} characters.`;

  return { fields, errors };
}

export const hasErrors = (errors: ContactErrors) => Object.values(errors).some(Boolean);
