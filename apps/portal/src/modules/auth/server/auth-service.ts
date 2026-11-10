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

function credential(value: unknown, maxLength: number): string | null {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength
    ? value
    : null;
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

  async function refresh(session: PortalSession): Promise<SessionResult> {
    const result = await api.refreshGrant(session.refreshToken);
    if (!result.ok) {
      if (result.error === "invalid_grant") {
        // The BFF contract: `invalid_grant` on refresh ends the portal session.
        store.delete(session.id);
        log("session_ended", {
          user_id: session.userId,
          reason: "invalid_grant",
        });
        return { status: "ended" };
      }
      // A network error keeps the session (admin helper spec, SS3).
      log("refresh_error", { user_id: session.userId, ...cause(result) });
      return { status: "unreachable" };
    }

    const tokens = result.tokens;
    if (!tokens.refreshToken) {
      // The presented refresh token is spent; without its successor the session cannot go on.
      store.delete(session.id);
      log("session_ended", {
        user_id: session.userId,
        reason: "no_refresh_token",
      });
      return { status: "ended" };
    }
    const at = now();
    const renewed: PortalSession = {
      ...session,
      ...sessionTokens(
        { ...tokens, refreshToken: tokens.refreshToken },
        at,
        session.refreshExpiresAt,
      ),
    };

    // Follow a role change: the admin area stays open to admins only (AH-9).
    const me = await api.me(tokens.accessToken);
    const gone = !store.get(session.id);
    if (gone || (me.ok && !isAdmin(me.me.roles))) {
      // Logged out while the refresh ran, or no admin any more: end the session the refresh just renewed.
      store.delete(session.id);
      await revoke(tokens.refreshToken, session.userId);
      log("session_ended", {
        user_id: session.userId,
        reason: gone ? "logged_out" : "not_admin",
      });
      return { status: "ended" };
    }
    if (!me.ok) {
      // Keep the new tokens - the old refresh token is spent - but this request cannot go on.
      store.set(renewed);
      log("refresh_error", { user_id: session.userId, ...cause(me) });
      return { status: "unreachable" };
    }

    const fresh: PortalSession = {
      ...renewed,
      roles: me.me.roles,
      partyId: me.me.party_id,
    };
    store.set(fresh);
    log("refreshed", { user_id: session.userId });
    return { status: "active", session: fresh };
  }

  /** One refresh per session at a time: a second caller waits for the first one's result. */
  function refreshOnce(session: PortalSession): Promise<SessionResult> {
    let pending = refreshes.get(session.id);
    if (!pending) {
      pending = refresh(session).finally(() => refreshes.delete(session.id));
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

      const username = credential(email, MAX_EMAIL_LENGTH);
      const secret = credential(password, MAX_PASSWORD_LENGTH);
      if (!username || !secret) {
        log("login_failed", { reason: "invalid_input" });
        return { ok: false, failure: "invalid_credentials" };
      }

      const grant = await api.passwordGrant(username.trim(), secret);
      if (!grant.ok) {
        if (grant.error === "invalid_grant") {
          log("login_failed", { reason: "invalid_credentials" });
          return { ok: false, failure: "invalid_credentials" };
        }
        // The credentials were not tested: the attempt does not count.
        throttle.forgive(ticket);
        log("login_error", cause(grant));
        return {
          ok: false,
          failure:
            grant.error === "unreachable" ? "unreachable" : "not_configured",
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
          failure:
            me.error === "unreachable" ? "unreachable" : "not_configured",
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

      const at = now();
      const session: PortalSession = {
        id: nextSessionId(),
        ...sessionTokens({ ...tokens, refreshToken }, at),
        userId,
        partyId,
        roles,
        lastSeenAt: at,
      };
      store.set(session);
      throttle.clear(ticket);
      log("login_succeeded", { user_id: userId });
      return {
        ok: true,
        sessionId: session.id,
        maxAgeSeconds: (session.refreshExpiresAt - at) / 1000,
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

      if (needsRefresh(session, now())) {
        const refreshed = await refreshOnce(session);
        if (refreshed.status !== "active") return refreshed;
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
