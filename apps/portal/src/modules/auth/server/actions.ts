"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isProduction } from "@/lib/env";
import { routes } from "@/lib/routes";

import type { LoginState } from "../model/session";
import {
  clearedSessionCookieOptions,
  sessionCookieName,
  sessionCookieOptions,
} from "../model/session-cookie";
import { logAuth } from "./log";
import { authService } from "./runtime";
import { throttleClient } from "./throttle";

/**
 * Log in with e-mail and password (the login form's `useActionState` action). On success the browser gets a new
 * session cookie - a fresh random ID, never one it brought along - and lands on the start page; otherwise the form
 * shows the failure's message.
 */
export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const service = authService();
  if (!service) {
    logAuth("login_error", { cause: "not_configured" });
    return { failure: "not_configured" };
  }

  const result = await service.login(
    { email: formData.get("email"), password: formData.get("password") },
    throttleClient(),
  );
  if (!result.ok) return { failure: result.failure };

  const jar = await cookies();
  const production = isProduction();
  const name = sessionCookieName(production);
  // A session this browser still held ends with the new login.
  const previous = jar.get(name)?.value;
  if (previous) await service.logout(previous);
  jar.set(
    name,
    result.sessionId,
    sessionCookieOptions(production, result.maxAgeSeconds),
  );
  // Outside any try: `redirect` throws to navigate.
  redirect(routes.home);
}

/**
 * Log out: revoke the SkillForge session, delete the portal session and the cookie, back to `/login`. A failed
 * revoke still ends the portal session; it is logged.
 */
export async function logout(): Promise<void> {
  const jar = await cookies();
  const production = isProduction();
  const name = sessionCookieName(production);
  const id = jar.get(name)?.value;
  try {
    if (id) await authService()?.logout(id);
  } finally {
    jar.set(name, "", clearedSessionCookieOptions(production));
  }
  redirect(routes.login);
}
