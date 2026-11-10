import "server-only";

/**
 * Server entry of the auth module: the admin session of a request. Every SkillForge call of the portal is server
 * code behind this entry; client components reach the module through its server actions only.
 */
export {
  requireAdminSession,
  SkillforgeUnavailableError,
  type AdminSession,
} from "./server/session";
export { authConfigured } from "./server/runtime";
