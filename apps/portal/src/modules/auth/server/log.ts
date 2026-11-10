import { createLogger } from "@/lib/log";

/**
 * The auth log: one line per outcome, `[auth] <outcome> {...}`. A person is named by SkillForge's `user_id` only;
 * never a token, a password, an e-mail address or a client IP (admin helper spec, _Rules_).
 */
export type AuthOutcome =
  | "login_succeeded"
  /** Wrong credentials, or a form without them; counts against the throttle. */
  | "login_failed"
  | "login_throttled"
  /** The credentials were right, but the account is no admin (AH-9); its SkillForge session is revoked. */
  | "login_not_admin"
  /** SkillForge was unreachable or refused the portal's client; the credentials were not tested. */
  | "login_error"
  | "refreshed"
  /** A refresh did not go through; the session stays (SkillForge unreachable or refusing the client). */
  | "refresh_error"
  | "session_ended"
  | "logout"
  /** A SkillForge session could not be revoked; the portal session ends anyway. */
  | "revoke_failed";

export const logAuth = createLogger<AuthOutcome>("auth", {
  login_succeeded: "info",
  login_failed: "warn",
  login_throttled: "warn",
  login_not_admin: "warn",
  login_error: "error",
  refreshed: "info",
  refresh_error: "error",
  session_ended: "info",
  logout: "info",
  revoke_failed: "error",
});

export type AuthLog = typeof logAuth;
