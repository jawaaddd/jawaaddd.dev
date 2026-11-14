"use client";

import { useActionState, useEffect, useRef } from "react";
import form from "@/components/Form/Form.module.css";
import { signIn } from "./authActions";
import styles from "./Admin.module.css";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, { error: null });
  const inputRef = useRef<HTMLInputElement>(null);

  // After a wrong password, put the cursor back in the (now cleared) field.
  useEffect(() => {
    if (state.error) inputRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className={styles.signInForm} noValidate>
      {/* Lets password managers file the password under a name. */}
      <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />

      <div className={form.field}>
        <label htmlFor="password" className={form.label}>
          Password
        </label>
        <input
          ref={inputRef}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          className={form.input}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
        />
        {state.error && (
          <p id="password-error" className={form.error} role="alert">
            {state.error}
          </p>
        )}
      </div>

      <button type="submit" className={form.primary} aria-disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
