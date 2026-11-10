/**
 * The session cookie. It carries only a random session ID (AH-5); the session itself, with SkillForge's tokens,
 * stays on the server.
 *
 * Production builds use the `__Host-` prefix: the browser then accepts the cookie only with `Secure`, `Path=/` and
 * no `Domain`, so no subdomain can set or shadow it. `Secure` needs HTTPS, which `next dev` does not serve - there
 * the cookie goes without the prefix and without `Secure` (admin helper spec, SS3).
 */
export function sessionCookieName(production: boolean): string {
  return production ? "__Host-session" : "session";
}

/** The attributes the portal sets the cookie with, in the shape of Next's `cookies().set`. */
export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  secure: boolean;
  /** Seconds; 0 deletes the cookie. */
  maxAge: number;
};

/**
 * The cookie's attributes for a session that ends for good in `maxAgeSeconds` (its refresh token's expiry): the
 * cookie never outlives the session (AH-11). Script cannot read it (`HttpOnly`), and cross-site requests other than
 * top-level navigations do not carry it (`SameSite=Lax`).
 */
export function sessionCookieOptions(
  production: boolean,
  maxAgeSeconds: number,
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: production,
    maxAge: Math.max(0, Math.floor(maxAgeSeconds)),
  };
}

/**
 * The attributes that delete the cookie. They repeat `Secure` and `Path=/`: the browser ignores a `Set-Cookie` for
 * a `__Host-` name without them, so a bare delete would leave the cookie in place.
 */
export function clearedSessionCookieOptions(
  production: boolean,
): SessionCookieOptions {
  return sessionCookieOptions(production, 0);
}
