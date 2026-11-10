import "server-only";

/**
 * Server entry of the auth module: the admin session of a request, and the login form and logout button for the
 * server pages that render them (both post to the module's server actions). Every SkillForge call of the portal is
 * server code behind this entry; client components reach the module through its server actions only.
 */
export {
  requireAdminSession,
  SkillforgeUnavailableError,
  type AdminSession,
} from "./server/session";
export { authConfigured } from "./server/runtime";
export { LoginForm } from "./components/login-form";
export { LogoutButton } from "./components/logout-button";
