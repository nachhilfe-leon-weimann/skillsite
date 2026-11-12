import { NextResponse, type NextRequest } from "next/server";

import { isProduction } from "@/lib/env";
import { publicRoutes, routes } from "@/lib/routes";
import { sessionCookieName } from "@/modules/auth";

/**
 * The optimistic check: a request without a session cookie never reaches a protected route and lands on `/login`
 * instead. It does not validate the cookie - the `(admin)` layout does that on every request (admin helper spec,
 * SS3) - so a forged cookie gets past this check, never past the layout.
 */
export function proxy(request: NextRequest) {
  if (publicRoutes.includes(request.nextUrl.pathname))
    return NextResponse.next();
  if (request.cookies.has(sessionCookieName(isProduction()))) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(routes.login, request.url));
}

export const config = {
  // Skip Next's own assets and every file (a last path segment with a dot): `public/`, the favicon. The matcher
  // must be a literal for Next to read it at build time.
  matcher: ["/((?!_next/|.*\\.[^/]*$).*)"],
};
