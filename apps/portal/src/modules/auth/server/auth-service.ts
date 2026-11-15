import { randomBytes } from "node:crypto";

import {
  isAdmin,
  needsRefresh,
  sessionEnd,
  type LoginFailure,
  type PortalSession,
} from "../model/session";
import { logAuth, type AuthLog } from "./log";
import {
  invalidateServiceToken,
  serviceToken,
  type ServiceTokenCache,
} from "./service-token";
import type { SessionStore } from "./session-store";
import type { CallFailure, SkillforgeAuthApi, TokenSet } from "./skillforge";
import type { LoginThrottle } from "./throttle";

/**
 * The BFF's auth logic, following SkillForge's BFF contract: login, the session on every request (refresh, idle
 * and absolute expiry, the admin gate) and logout. Framework-free: the Next glue (`session.ts`, `actions.ts`) reads
 * and writes the cookie, this module only sees session IDs. Every dependency is passed in, so tests drive it with a
 * fetch stub and a clock of their own.
 */

/** State shared by every request of the process (`runtime.ts` keeps it on `globalThis`). */
export type AuthState = {
  store: SessionStore;
  throttle: LoginThrottle;
  /** Refreshes in flight, per session ID: concurrent requests share one (single-flight). */
  refreshes: Map<string, Promise<SessionResult>>;
  serviceToken: ServiceTokenCache;
};

export type AuthDeps = AuthState & {
  api: SkillforgeAuthApi;
  now?: () => number;
  newSessionId?: () => string;
  log?: AuthLog;
};

export type LoginResult =
  | { ok: true; sessionId: string; maxAgeSeconds: number }
  | { ok: false; failure: LoginFailure };

/** A session on a request: active (possibly refreshed), ended (log in again) or kept but unusable right now. */
export type SessionResult =
  | { status: "active"; session: PortalSession }
  | { status: "ended" }
  | { status: "unreachable" };

export type AuthService = {
  login(
    credentials: { email: unknown; password: unknown },
    client: string,
  ): Promise<LoginResult>;
  resolve(sessionId: string): Promise<SessionResult>;
  logout(sessionId: string): Promise<void>;
};

/** SkillForge's limits on the password grant's fields. */
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

/** A random session ID: 32 bytes, base64url. */
export function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

/** What a failed call leaves in a log line: never a body, only the kind of failure, the status and the code. */
function cause(failure: CallFailure): Record<string, unknown> {
  return failure.error === "rejected"
    ? { cause: "rejected", status: failure.status, code: failure.code }
    : { cause: failure.error };
}

/** A form value within SkillForge's limits; `trim` for the e-mail, never for a password. */
function credential(
  value: unknown,
  maxLength: number,
  trim: boolean,
): string | null {
  if (typeof value !== "string") return null;
  const candidate = trim ? value.trim() : value;
  return candidate.length > 0 && candidate.length <= maxLength
    ? candidate
    : null;
}

/** SkillForge refused the portal's client, not the person: the codes that say nothing about the credentials. */
const CLIENT_FAULTS = new Set(["invalid_client", "unauthorized_client"]);

/**
 * Whether a failed password grant says nothing about the person's input: SkillForge unreachable, its answer broken,
 * or the portal's client refused. Only these are forgiven by the throttle; every other refusal counts, including
 * `invalid_scope`, which SkillForge answers only after it verified the password.
 */
function notTheUsers(failure: CallFailure): boolean {
  return (
    failure.error === "unreachable" ||
    failure.error === "invalid_response" ||
    (failure.error === "rejected" && CLIENT_FAULTS.has(failure.code ?? ""))
  );
}

export function createAuthService({
  api,
  store,
  throttle,
  refreshes,
  serviceToken: serviceTokenCache,
  now = Date.now,
  newSessionId: nextSessionId = newSessionId,
  log = logAuth,
}: AuthDeps): AuthService {
  /** Ends a SkillForge session with the portal's own token; a failure is logged, never thrown. */
  async function revoke(
    refreshToken: string,
    userId: string | null,
  ): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = await serviceToken(api, serviceTokenCache, now);
      if (!token) {
        log("revoke_failed", { user_id: userId, cause: "no_service_token" });
        return false;
      }
      const result = await api.revoke(refreshToken, token);
      if (result.ok) return true;
      // A cached token SkillForge no longer accepts (a restart with a new key): fetch a new one, once.
      if (result.error === "rejected" && result.status === 401) {
        invalidateServiceToken(serviceTokenCache);
        if (attempt === 0) continue;
      }
      log("revoke_failed", { user_id: userId, ...cause(result) });
      return false;
    }
    return false;
  }

  /** The session with `lastSeenAt` moved to now, re-read so a concurrent refresh's tokens are never overwritten. */
  function touch(id: string): PortalSession | undefined {
    const latest = store.get(id);
    if (!latest) return undefined;
    const seen = { ...latest, lastSeenAt: now() };
    store.set(seen);
    return seen;
  }

  /**
   * Brings a session up to date before a request uses it: refreshes the tokens when the access token runs out, then
   * reads the roles from `/auth/me` - after every refresh, and on the next request after a check that failed.
   */
  async function renew(session: PortalSession): Promise<SessionResult> {
    let current = session;
    const refreshing = needsRefresh(session, now());
    if (refreshing) {
      // Before the call: the session's end is computed from a time no later than SkillForge's.
      const at = now();
      const result = await api.refreshGrant(session.refreshToken);
      if (!result.ok) {
        if (result.error === "invalid_grant") {
          // The BFF contract: `invalid_grant` on refresh ends the portal session.
          return end(session, "invalid_grant");
        }
        if (result.error === "invalid_response") {
          // SkillForge may have rotated the token, but the answer cannot be trusted: fail closed.
          return end(session, "invalid_response");
        }
        // A network error keeps the session (admin helper spec, SS3).
        log("refresh_error", { user_id: session.userId, ...cause(result) });
        return { status: "unreachable" };
      }

      const tokens = result.tokens;
      if (!tokens.refreshToken) {
        // The presented refresh token is spent; without its successor the session cannot go on.
        return end(session, "no_refresh_token");
      }
      current = {
        ...session,
        ...sessionTokens(
          { ...tokens, refreshToken: tokens.refreshToken },
          at,
          session.refreshExpiresAt,
        ),
        rolesVerified: false,
      };
    }

    // Follow a role change: the admin area stays open to admins only (AH-9).
    const me = await api.me(current.accessToken);
    const gone = !store.get(session.id);
    if (gone || (me.ok && !isAdmin(me.me.roles))) {
      // Logged out meanwhile, or no admin any more: end the session and revoke what it holds now.
      store.delete(session.id);
      await revoke(current.refreshToken, session.userId);
      log("session_ended", {
        user_id: session.userId,
        reason: gone ? "logged_out" : "not_admin",
      });
      return { status: "ended" };
    }
    if (!me.ok) {
      // Keep the new tokens - the old refresh token is spent - but unverified: this request cannot go on, and the
      // next one checks the roles again.
      store.set(current);
      log("refresh_error", { user_id: session.userId, ...cause(me) });
      return { status: "unreachable" };
    }

    const fresh: PortalSession = {
      ...current,
      roles: me.me.roles,
      partyId: me.me.party_id,
      rolesVerified: true,
    };
    store.set(fresh);
    if (refreshing) log("refreshed", { user_id: session.userId });
    return { status: "active", session: fresh };
  }

  /** Deletes a session that cannot go on and logs why. */
  function end(session: PortalSession, reason: string): SessionResult {
    store.delete(session.id);
    log("session_ended", { user_id: session.userId, reason });
    return { status: "ended" };
  }

  /** One renewal per session at a time: a second caller waits for the first one's result (single-flight). */
  function renewOnce(session: PortalSession): Promise<SessionResult> {
    let pending = refreshes.get(session.id);
    if (!pending) {
      pending = renew(session).finally(() => refreshes.delete(session.id));
      refreshes.set(session.id, pending);
    }
    return pending;
  }

  return {
    async login({ email, password }, client) {
      const ticket = throttle.begin(client);
      if (!ticket) {
        log("login_throttled");
        return { ok: false, failure: "throttled" };
      }

      const username = credential(email, MAX_EMAIL_LENGTH, true);
      const secret = credential(password, MAX_PASSWORD_LENGTH, false);
      if (!username || !secret) {
        log("login_failed", { reason: "invalid_input" });
        return { ok: false, failure: "invalid_credentials" };
      }

      // Before the call: the session's end is computed from a time no later than SkillForge's.
      const at = now();
      const grant = await api.passwordGrant(username, secret);
      if (!grant.ok) {
        if (grant.error === "invalid_grant") {
          log("login_failed", { reason: "invalid_credentials" });
          return { ok: false, failure: "invalid_credentials" };
        }
        if (notTheUsers(grant)) {
          // The credentials were not tested, or SkillForge refused the portal itself: the attempt does not count.
          throttle.forgive(ticket);
          log("login_error", cause(grant));
          return {
            ok: false,
            failure:
              grant.error === "rejected" ? "not_configured" : "unreachable",
          };
        }
        // Any other refusal counts against the throttle. `invalid_scope` comes only after a verified password:
        // the client's ceiling does not fit the account.
        log("login_failed", { reason: "rejected", ...cause(grant) });
        return {
          ok: false,
          failure:
            grant.error === "rejected" && grant.code === "invalid_scope"
              ? "not_configured"
              : "invalid_credentials",
        };
      }

      const tokens = grant.tokens;
      if (!tokens.refreshToken || tokens.refreshExpiresIn === undefined) {
        throttle.forgive(ticket);
        log("login_error", { cause: "no_refresh_token" });
        return { ok: false, failure: "not_configured" };
      }
      const refreshToken = tokens.refreshToken;

      const me = await api.me(tokens.accessToken);
      if (!me.ok) {
        throttle.forgive(ticket);
        await revoke(refreshToken, null);
        log("login_error", cause(me));
        return {
          ok: false,
          failure: me.error === "rejected" ? "not_configured" : "unreachable",
        };
      }
      const { user_id: userId, party_id: partyId, roles } = me.me;
      if (!userId || !isAdmin(roles)) {
        // AH-9: no portal session, and the SkillForge session it opened ends at once. The attempt still counts:
        // a non-admin account must not be a way to reset the throttle.
        await revoke(refreshToken, userId);
        log("login_not_admin", { user_id: userId });
        return { ok: false, failure: "not_admin" };
      }

      const session: PortalSession = {
        id: nextSessionId(),
        ...sessionTokens({ ...tokens, refreshToken }, at),
        userId,
        partyId,
        roles,
        rolesVerified: true,
        lastSeenAt: now(),
      };
      store.set(session);
      throttle.clear(ticket);
      log("login_succeeded", { user_id: userId });
      return {
        ok: true,
        sessionId: session.id,
        // Counted from now: the cookie never outlives the session.
        maxAgeSeconds: (session.refreshExpiresAt - now()) / 1000,
      };
    },

    async resolve(sessionId) {
      const session = store.get(sessionId);
      if (!session) return { status: "ended" };

      const end = sessionEnd(session, now());
      if (end) {
        store.delete(sessionId);
        log("session_ended", { user_id: session.userId, reason: end });
        // An idle session's SkillForge session is still alive; one past its expiry is not.
        if (end === "idle") await revoke(session.refreshToken, session.userId);
        return { status: "ended" };
      }

      if (needsRefresh(session, now()) || !session.rolesVerified) {
        const renewed = await renewOnce(session);
        if (renewed.status !== "active") return renewed;
      }
      const seen = touch(sessionId);
      return seen ? { status: "active", session: seen } : { status: "ended" };
    },

    async logout(sessionId) {
      const session = store.get(sessionId);
      // Delete first: a refresh still in flight then finds the session gone and revokes what it renewed.
      store.delete(sessionId);
      if (!session) return;
      const revoked = await revoke(session.refreshToken, session.userId);
      log("logout", { user_id: session.userId, revoked });
    },
  };
}

/** The token part of a session from a grant at `at`; a refresh never moves the session's end later. */
function sessionTokens(
  tokens: TokenSet & { refreshToken: string },
  at: number,
  previousEnd = Infinity,
): Pick<
  PortalSession,
  "accessToken" | "accessExpiresAt" | "refreshToken" | "refreshExpiresAt"
> {
  const refreshEnd =
    tokens.refreshExpiresIn === undefined
      ? previousEnd
      : at + tokens.refreshExpiresIn * 1000;
  return {
    accessToken: tokens.accessToken,
    accessExpiresAt: at + tokens.expiresIn * 1000,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: Math.min(refreshEnd, previousEnd),
  };
}
