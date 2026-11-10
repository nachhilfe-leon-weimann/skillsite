/**
 * The session cookie's name. It carries only a random session ID (AH-5); the session itself stays on the server.
 *
 * Production builds use the `__Host-` prefix: the browser then accepts the cookie only with `Secure`, `Path=/` and
 * no `Domain`, so no subdomain can set or shadow it. `Secure` needs HTTPS, which `next dev` does not serve - there
 * the cookie goes without the prefix (admin helper spec, SS3).
 */
export function sessionCookieName(production: boolean): string {
  return production ? "__Host-session" : "session";
}
