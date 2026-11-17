"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/Toast/Toast";
import {
  hasErrors,
  LIMITS,
  validateContact,
  type ContactErrors,
  type ContactFields,
} from "@/lib/contact";
import form from "@/components/Form/Form.module.css";
import { sendContactMessage } from "./actions";
import styles from "./ContactForm.module.css";

const EMPTY: ContactFields = { name: "", email: "", message: "" };
const FIELD_ORDER = ["name", "email", "message"] as const;

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const id = useId();

  const focusFirstError = (errors: ContactErrors) => {
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const local = validateContact(values);
    setErrors(local.errors);
    if (hasErrors(local.errors)) {
      focusFirstError(local.errors);
      return;
    }

    const website = new FormData(event.currentTarget).get("website");
    startTransition(async () => {
      let result;
      try {
        result = await sendContactMessage({ ...values, website });
      } catch {
        result = {
          status: "failed",
          message: "Your message couldn't be sent. Try again, or email me directly.",
        } as const;
      }
      if (result.status === "sent") {
        setValues(EMPTY);
        toast("Message sent. Thanks for reaching out.");
      } else if (result.status === "invalid") {
        setErrors(result.errors);
        focusFirstError(result.errors);
      } else {
        setFormError(result.message);
      }
    });
  };

  const field = (name: keyof ContactFields) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    maxLength: LIMITS[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    className: form.input,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((values) => ({ ...values, [name]: event.target.value }));
      // A fixed field stops showing its error right away.
      if (errors[name]) setErrors((errors) => ({ ...errors, [name]: undefined }));
    },
  });

  const error = (name: keyof ContactFields) =>
    errors[name] && (
      <p id={`${id}-${name}-error`} className={form.error}>
        {errors[name]}
      </p>
    );

  return (
    <form ref={formRef} className={styles.form} onSubmit={submit} noValidate>
      <div className={form.field}>
        <label htmlFor={`${id}-name`} className={form.label}>
          Name
        </label>
        <input type="text" autoComplete="name" placeholder="I should call you..." {...field("name")} />
        {error("name")}
      </div>

      <div className={form.field}>
        <label htmlFor={`${id}-email`} className={form.label}>
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          {...field("email")}
        />
        {error("email")}
      </div>

      <div className={form.field}>
        <label htmlFor={`${id}-message`} className={form.label}>
          Message
        </label>
        <textarea
          placeholder="What's up?"
          {...field("message")}
          className={`${form.input} ${styles.message}`}
        />
        {error("message")}
      </div>

      {/* Honeypot: invisible and skipped by keyboard and screen readers, so only bots fill it. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {formError && (
        <p className={form.error} role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className={form.primary} aria-disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
