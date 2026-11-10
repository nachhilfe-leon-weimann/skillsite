/**
 * A portal session: the BFF's own session, with a SkillForge `user_session` behind it. It lives only on the server
 * (AH-5); the browser holds its random ID in the session cookie and nothing else.
 */
export type PortalSession = {
  /** The random session ID the cookie carries. */
  readonly id: string;
  readonly accessToken: string;
  /** Epoch milliseconds. */
  readonly accessExpiresAt: number;
  readonly refreshToken: string;
  /** Epoch milliseconds: the SkillForge session ends for good here; refreshing does not extend it. */
  readonly refreshExpiresAt: number;
  readonly userId: string;
  readonly partyId: string | null;
  readonly roles: readonly string[];
  /** Epoch milliseconds of the last request that used the session. */
  readonly lastSeenAt: number;
};

/** The role that opens the admin area (AH-9). */
export const ADMIN_ROLE = "admin";

/** A session without a request for this long ends (AH-11). */
export const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

/** The access token is refreshed once less than this is left of it (admin helper spec, SS3). */
export const REFRESH_MARGIN_MS = 60 * 1000;

/** Why a session ended without a logout. */
export type SessionEnd = "expired" | "idle";

/**
 * Whether a session has ended at `now`, and why: at its refresh token's expiry or after `IDLE_TIMEOUT_MS` without a
 * request, whichever comes first (AH-11).
 */
export function sessionEnd(
  session: PortalSession,
  now: number,
): SessionEnd | null {
  if (now >= session.refreshExpiresAt) return "expired";
  if (now - session.lastSeenAt >= IDLE_TIMEOUT_MS) return "idle";
  return null;
}

/** Whether the access token has less than `REFRESH_MARGIN_MS` left at `now`. */
export function needsRefresh(session: PortalSession, now: number): boolean {
  return session.accessExpiresAt - now < REFRESH_MARGIN_MS;
}

/** Whether the roles open the admin area (AH-9). */
export function isAdmin(roles: readonly string[]): boolean {
  return roles.includes(ADMIN_ROLE);
}

/** Why a login failed; the login form shows one message per reason. */
export type LoginFailure =
  /** Every wrong-credential case: SkillForge's `invalid_grant` has one body for all of them. */
  | "invalid_credentials"
  | "throttled"
  | "not_admin"
  /** The SkillForge variables are missing, or SkillForge refused the portal's client. */
  | "not_configured"
  | "unreachable";

/** What the login action hands back to the form; `undefined` before the first attempt. */
export type LoginState = { failure: LoginFailure } | undefined;
