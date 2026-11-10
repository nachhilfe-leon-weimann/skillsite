"use client";

import { useActionState, useState } from "react";

import { Field, Input } from "@skillsite/ui/forms/field";
import { Button } from "@skillsite/ui/primitives/button";
import { Text } from "@skillsite/ui/typography/text";
import { loginForm } from "@/content/login";

import { login } from "../server/actions";

/**
 * The login form. It posts to the `login` server action, which works before hydration too; a failure comes back as
 * a reason and is announced in the alert region. The e-mail field is controlled, so it keeps its value when React
 * resets the form after a failed attempt; the password does not.
 */
export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [email, setEmail] = useState("");
  const failure = state ? loginForm.failures[state.failure] : null;

  return (
    <form action={action} className="mt-8 flex max-w-sm flex-col gap-5">
      <Field label={loginForm.email} htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label={loginForm.password} htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
        />
      </Field>
      <Text role="alert" size="small" className="font-semibold text-coral">
        {failure}
      </Text>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? loginForm.submitting : loginForm.submit}
      </Button>
    </form>
  );
}
