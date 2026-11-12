import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isProduction } from "@/lib/env";
import { routes } from "@/lib/routes";

import { sessionCookieName } from "../model/session-cookie";
import type { SessionResult } from "./auth-service";
import { authService } from "./runtime";

/** What server code learns about the admin of a request. The tokens stay inside the auth module. */
export type AdminSession = {
  userId: string;
  partyId: string | null;
  roles: readonly string[];
};

/** SkillForge did not answer; the session is kept and the page shows an error (admin helper spec, SS3). */
export class SkillforgeUnavailableError extends Error {
  constructor() {
    super("SkillForge is unreachable");
    this.name = "SkillforgeUnavailableError";
  }
}

/** The request's session, resolved once per request: the layout and the page share one lookup and one refresh. */
const currentSession = cache(async (): Promise<SessionResult> => {
  // The cookie first: reading it makes every page behind this dynamic. A build without the SkillForge variables
  // must never prerender the admin area as a redirect to /login.
  const id = (await cookies()).get(sessionCookieName(isProduction()))?.value;
  const service = authService();
  if (!id || !service) return { status: "ended" };
  return service.resolve(id);
});

/**
 * The admin of this request, for the `(admin)` layout, its pages and every server function behind them. Without a
 * live admin session it redirects to `/login`; when SkillForge is unreachable it throws
 * `SkillforgeUnavailableError` and keeps the session. Layouts do not re-render on client navigation, so a page or a
 * server function that relies on the session calls this itself, not only its layout.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const result = await currentSession();
  if (result.status === "ended") redirect(routes.login);
  if (result.status === "unreachable") throw new SkillforgeUnavailableError();
  const { userId, partyId, roles } = result.session;
  return { userId, partyId, roles };
}
