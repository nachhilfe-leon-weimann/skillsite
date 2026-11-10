import { beforeEach, describe, expect, test } from "vitest";

import { IDLE_TIMEOUT_MS, type PortalSession } from "../model/session";
import { createAuthService, type AuthService } from "./auth-service";
import {
  ADMIN,
  BASE_URL,
  CLIENT,
  FakeSkillforge,
  TUTOR,
} from "./fake-skillforge";
import type { AuthOutcome } from "./log";
import { MemorySessionStore } from "./session-store";
import { createSkillforgeAuthApi } from "./skillforge";
import { createLoginThrottle } from "./throttle";

const TOKEN = "/api/v1/auth/token";
const ME = "/api/v1/auth/me";
const REVOKE = "/api/v1/auth/revoke";
const START = Date.UTC(2026, 10, 10, 9, 0, 0);

let skillforge: FakeSkillforge;
let clock: number;
let store: MemorySessionStore;
let logs: { outcome: AuthOutcome; context: Record<string, unknown> }[];
let auth: AuthService;

beforeEach(() => {
  skillforge = new FakeSkillforge();
  clock = START;
  const now = () => clock;
  store = new MemorySessionStore({ now });
  logs = [];
  auth = createAuthService({
    api: createSkillforgeAuthApi(
      { baseUrl: BASE_URL, clientId: CLIENT.id, clientSecret: CLIENT.secret },
      skillforge.fetch,
    ),
    store,
    throttle: createLoginThrottle({ now }),
    refreshes: new Map(),
    serviceToken: {},
    now,
    log: (outcome, context = {}) => logs.push({ outcome, context }),
  });
});

const loginAs = (email: string, password: string) =>
  auth.login({ email, password }, "shared");

async function loggedInAdmin(): Promise<PortalSession> {
  const result = await loginAs(ADMIN.email, ADMIN.password);
  if (!result.ok) throw new Error(`login failed: ${result.failure}`);
  const session = store.get(result.sessionId);
  if (!session) throw new Error("no session stored");
  return session;
}

describe("login", () => {
  test("an admin with the right password gets a portal session with a fresh random ID", async () => {
    const result = await loginAs(ADMIN.email, ADMIN.password);

    expect(result).toEqual({
      ok: true,
      sessionId: expect.stringMatching(/^[\w-]{43}$/),
      // The cookie lives exactly as long as the SkillForge session (AH-11).
      maxAgeSeconds: skillforge.refreshTtlSeconds,
    });
    const session = result.ok ? store.get(result.sessionId) : undefined;
    expect(session).toMatchObject({
      userId: ADMIN.userId,
      partyId: ADMIN.partyId,
      roles: ["admin"],
      accessToken: expect.stringMatching(/^sf_at_/),
      refreshToken: expect.stringMatching(/^sf_rt_/),
      accessExpiresAt: START + skillforge.accessTtlSeconds * 1000,
      refreshExpiresAt: START + skillforge.refreshTtlSeconds * 1000,
      lastSeenAt: START,
    });
    expect(skillforge.calls.map((call) => call.path)).toEqual([TOKEN, ME]);
    expect(skillforge.grants("password")).toBe(1);
    expect(logs).toEqual([
      { outcome: "login_succeeded", context: { user_id: ADMIN.userId } },
    ]);
  });

  test("two logins never share a session ID", async () => {
    const first = await loginAs(ADMIN.email, ADMIN.password);
    const second = await loginAs(ADMIN.email, ADMIN.password);
    expect(first.ok && second.ok && first.sessionId !== second.sessionId).toBe(
      true,
    );
  });

  test.each([
    ["a wrong password", ADMIN.email, "wrong-password"],
    ["an unknown address", "nobody@example.com", ADMIN.password],
  ])(
    "%s gets the one wrong-credentials answer and no session",
    async (_, email, password) => {
      expect(await loginAs(email, password)).toEqual({
        ok: false,
        failure: "invalid_credentials",
      });
      expect(store.size).toBe(0);
    },
  );

  test("a form without a password never reaches SkillForge", async () => {
    expect(await loginAs(ADMIN.email, "")).toEqual({
      ok: false,
      failure: "invalid_credentials",
    });
    expect(skillforge.calls).toEqual([]);
  });

  test("a non-admin gets no portal session, and the SkillForge session it opened is revoked at once (AH-9)", async () => {
    expect(await loginAs(TUTOR.email, TUTOR.password)).toEqual({
      ok: false,
      failure: "not_admin",
    });

    expect(store.size).toBe(0);
    // The revoke runs on the portal's own client_credentials token.
    expect(skillforge.grants("client_credentials")).toBe(1);
    expect(skillforge.count(REVOKE)).toBe(1);
    expect(skillforge.isRevoked(skillforge.lastRefreshToken ?? "")).toBe(true);
    expect(logs.map((line) => line.outcome)).toEqual(["login_not_admin"]);
  });

  test("SkillForge unreachable is its own answer and does not count against the throttle", async () => {
    skillforge.down = true;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(await loginAs(ADMIN.email, ADMIN.password)).toEqual({
        ok: false,
        failure: "unreachable",
      });
    }
    skillforge.down = false;
    expect((await loginAs(ADMIN.email, ADMIN.password)).ok).toBe(true);
  });

  test("a client SkillForge refuses reads as not configured", async () => {
    auth = createAuthService({
      api: createSkillforgeAuthApi(
        { baseUrl: BASE_URL, clientId: CLIENT.id, clientSecret: "wrong" },
        skillforge.fetch,
      ),
      store,
      throttle: createLoginThrottle(),
      refreshes: new Map(),
      serviceToken: {},
      log: () => {},
    });
    expect(await loginAs(ADMIN.email, ADMIN.password)).toEqual({
      ok: false,
      failure: "not_configured",
    });
  });
});

describe("throttle", () => {
  test("the 11th failed login within 15 minutes never reaches SkillForge", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await loginAs(ADMIN.email, "wrong-password")).ok).toBe(false);
    }
    const callsBefore = skillforge.calls.length;

    // Even the right password is refused now.
    expect(await loginAs(ADMIN.email, ADMIN.password)).toEqual({
      ok: false,
      failure: "throttled",
    });
    expect(skillforge.calls.length).toBe(callsBefore);
    expect(logs.at(-1)?.outcome).toBe("login_throttled");

    // After the window the next attempt goes through again.
    clock += 15 * 60 * 1000;
    expect((await loginAs(ADMIN.email, ADMIN.password)).ok).toBe(true);
  });

  test("a successful login clears the count", async () => {
    for (let attempt = 0; attempt < 9; attempt += 1) {
      await loginAs(ADMIN.email, "wrong-password");
    }
    expect((await loginAs(ADMIN.email, ADMIN.password)).ok).toBe(true);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(await loginAs(ADMIN.email, "wrong-password")).toEqual({
        ok: false,
        failure: "invalid_credentials",
      });
    }
  });

  test("a non-admin login counts as a failure: it cannot reset the throttle", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await loginAs(TUTOR.email, TUTOR.password);
    }
    expect((await loginAs(ADMIN.email, ADMIN.password)).ok).toBe(false);
  });
});

describe("requests", () => {
  test("a live session is handed out without calling SkillForge, and its idle clock restarts", async () => {
    const session = await loggedInAdmin();
    const callsBefore = skillforge.calls.length;
    clock += 60 * 1000;

    const result = await auth.resolve(session.id);

    expect(result).toEqual({
      status: "active",
      session: { ...session, lastSeenAt: clock },
    });
    expect(skillforge.calls.length).toBe(callsBefore);
  });

  test("an unknown session ID is no session", async () => {
    expect(await auth.resolve("forged")).toEqual({ status: "ended" });
  });

  test("an access token with less than 60 seconds left is refreshed and rotated", async () => {
    const session = await loggedInAdmin();
    clock = session.accessExpiresAt - 59 * 1000;

    const result = await auth.resolve(session.id);

    expect(skillforge.grants("refresh_token")).toBe(1);
    expect(result.status).toBe("active");
    const renewed = store.get(session.id);
    expect(renewed?.refreshToken).not.toBe(session.refreshToken);
    expect(renewed?.accessExpiresAt).toBe(
      clock + skillforge.accessTtlSeconds * 1000,
    );
    // A refresh never moves the session's end later.
    expect(renewed?.refreshExpiresAt).toBe(session.refreshExpiresAt);
  });

  test("two concurrent requests with an expiring access token cause exactly one refresh", async () => {
    const session = await loggedInAdmin();
    clock = session.accessExpiresAt - 30 * 1000;
    skillforge.holdRefreshes = true;

    const first = auth.resolve(session.id);
    const second = auth.resolve(session.id);
    await waitFor(() => skillforge.heldRefreshes() === 1);
    skillforge.releaseRefreshes();
    const results = await Promise.all([first, second]);

    expect(skillforge.grants("refresh_token")).toBe(1);
    expect(results.map((result) => result.status)).toEqual([
      "active",
      "active",
    ]);
    const tokens = results.map((result) =>
      result.status === "active" ? result.session.accessToken : null,
    );
    expect(tokens[0]).toBe(tokens[1]);
    expect(tokens[0]).not.toBe(session.accessToken);
  });

  test("invalid_grant on refresh ends the portal session; the next request finds none", async () => {
    const session = await loggedInAdmin();
    skillforge.revokeSession(session.refreshToken);
    clock = session.accessExpiresAt;

    expect(await auth.resolve(session.id)).toEqual({ status: "ended" });
    expect(store.get(session.id)).toBeUndefined();
    expect(logs.at(-1)).toEqual({
      outcome: "session_ended",
      context: { user_id: ADMIN.userId, reason: "invalid_grant" },
    });

    expect(await auth.resolve(session.id)).toEqual({ status: "ended" });
    expect(skillforge.grants("refresh_token")).toBe(1);
  });

  test("SkillForge unreachable during a refresh keeps the session", async () => {
    const session = await loggedInAdmin();
    clock = session.accessExpiresAt;
    skillforge.down = true;

    expect(await auth.resolve(session.id)).toEqual({ status: "unreachable" });
    expect(store.get(session.id)).toEqual(session);

    skillforge.down = false;
    expect((await auth.resolve(session.id)).status).toBe("active");
  });

  test("a refresh that finds the account no admin any more ends the session (AH-9)", async () => {
    const admin = { ...ADMIN, roles: ["admin"] };
    skillforge.accounts = [admin];
    const session = await loggedInAdmin();
    // The admin role is taken away; the next refresh's token carries the new roles.
    admin.roles = ["tutor"];
    clock = session.accessExpiresAt;

    expect(await auth.resolve(session.id)).toEqual({ status: "ended" });
    expect(store.get(session.id)).toBeUndefined();
    expect(skillforge.isRevoked(skillforge.lastRefreshToken ?? "")).toBe(true);
  });

  test("8 hours without a request end the session and revoke its SkillForge session (AH-11)", async () => {
    const session = await loggedInAdmin();
    clock += IDLE_TIMEOUT_MS - 1;
    // Just under: still live, and the request restarts the idle clock.
    expect((await auth.resolve(session.id)).status).toBe("active");

    const renewed = store.get(session.id);
    clock += IDLE_TIMEOUT_MS;
    expect(await auth.resolve(session.id)).toEqual({ status: "ended" });
    expect(store.get(session.id)).toBeUndefined();
    expect(skillforge.isRevoked(renewed?.refreshToken ?? "")).toBe(true);
    expect(logs.at(-1)).toEqual({
      outcome: "session_ended",
      context: { user_id: ADMIN.userId, reason: "idle" },
    });
  });

  test("the session ends at its refresh token's expiry, however active it is (AH-11)", async () => {
    skillforge.refreshTtlSeconds = 2 * 60 * 60;
    const session = await loggedInAdmin();
    for (let hour = 0; hour < 2; hour += 1) {
      clock += 60 * 60 * 1000 - 1;
      expect((await auth.resolve(session.id)).status).toBe("active");
    }
    clock = session.refreshExpiresAt;
    expect(await auth.resolve(session.id)).toEqual({ status: "ended" });
  });
});

describe("logout", () => {
  test("logout revokes the SkillForge session and deletes the portal session", async () => {
    const session = await loggedInAdmin();

    await auth.logout(session.id);

    expect(skillforge.isRevoked(session.refreshToken)).toBe(true);
    expect(store.get(session.id)).toBeUndefined();
    expect(logs.at(-1)).toEqual({
      outcome: "logout",
      context: { user_id: ADMIN.userId, revoked: true },
    });
  });

  test("a failed revoke still ends the portal session and is logged", async () => {
    const session = await loggedInAdmin();
    skillforge.revokeFails = true;

    await auth.logout(session.id);

    expect(store.get(session.id)).toBeUndefined();
    expect(await auth.resolve(session.id)).toEqual({ status: "ended" });
    expect(logs.slice(-2)).toEqual([
      {
        outcome: "revoke_failed",
        context: { user_id: ADMIN.userId, cause: "unreachable" },
      },
      { outcome: "logout", context: { user_id: ADMIN.userId, revoked: false } },
    ]);
  });

  test("the portal's own token is fetched once and reused", async () => {
    const first = await loggedInAdmin();
    const second = await loggedInAdmin();
    await auth.logout(first.id);
    await auth.logout(second.id);
    expect(skillforge.grants("client_credentials")).toBe(1);
  });

  test("a refresh that outlives a logout revokes the session it renewed", async () => {
    const session = await loggedInAdmin();
    clock = session.accessExpiresAt;
    skillforge.holdRefreshes = true;

    const request = auth.resolve(session.id);
    await waitFor(() => skillforge.heldRefreshes() === 1);
    // The logout's own revoke fails, so the refresh still goes through at SkillForge.
    skillforge.revokeFails = true;
    await auth.logout(session.id);
    skillforge.revokeFails = false;
    skillforge.releaseRefreshes();

    expect(await request).toEqual({ status: "ended" });
    expect(store.get(session.id)).toBeUndefined();
    expect(skillforge.lastRefreshToken).not.toBe(session.refreshToken);
    expect(skillforge.isRevoked(skillforge.lastRefreshToken ?? "")).toBe(true);
  });
});

test("no log line holds a token, a password or an e-mail address", async () => {
  const session = await loggedInAdmin();
  await loginAs(ADMIN.email, "wrong-password");
  await loginAs(TUTOR.email, TUTOR.password);
  clock = session.accessExpiresAt;
  await auth.resolve(session.id);
  skillforge.revokeFails = true;
  await auth.logout(session.id);

  const text = JSON.stringify(logs);
  for (const secret of [
    "sf_at_",
    "sf_rt_",
    CLIENT.secret,
    ADMIN.password,
    TUTOR.password,
    "wrong-password",
    "@example.com",
  ]) {
    expect(text).not.toContain(secret);
  }
});

/** Waits for a condition the fake reaches asynchronously (a held refresh), without a fixed delay. */
async function waitFor(condition: () => boolean): Promise<void> {
  for (let tick = 0; tick < 100 && !condition(); tick += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  if (!condition()) throw new Error("condition not reached");
}
