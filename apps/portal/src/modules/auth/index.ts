/**
 * Client-safe entry of the auth module, kept light on purpose: the proxy and the Playwright smoke test import it,
 * and nothing here reaches the module's server code. Everything that does - the session check, and the login form
 * and logout button, which post to the module's server actions - enters through `@/modules/auth/server`.
 */
export { sessionCookieName } from "./model/session-cookie";
