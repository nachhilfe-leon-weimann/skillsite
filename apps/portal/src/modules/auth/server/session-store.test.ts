import { expect, test } from "vitest";

import { IDLE_TIMEOUT_MS, type PortalSession } from "../model/session";
import { authState } from "./runtime";
import { MemorySessionStore } from "./session-store";

const START = Date.UTC(2026, 10, 10, 9, 0, 0);

function session(id: string, overrides: Partial<PortalSession> = {}) {
  return {
    id,
    accessToken: `sf_at_synthetic_${id}`,
    accessExpiresAt: START + 15 * 60 * 1000,
    refreshToken: `sf_rt_synthetic_${id}`,
    refreshExpiresAt: START + 30 * 24 * 60 * 60 * 1000,
    userId: "00000000-0000-4000-8000-000000000001",
    partyId: null,
    roles: ["admin"],
    rolesVerified: true,
    lastSeenAt: START,
    ...overrides,
  } satisfies PortalSession;
}

test("a session is kept, replaced and deleted by its ID", () => {
  const store = new MemorySessionStore({ now: () => START });
  store.set(session("a"));
  store.set(session("a", { lastSeenAt: START + 1 }));
  expect(store.get("a")?.lastSeenAt).toBe(START + 1);
  expect(store.size).toBe(1);
  store.delete("a");
  expect(store.get("a")).toBeUndefined();
});

test("a session past its refresh token's expiry is dropped when read", () => {
  let clock = START;
  const store = new MemorySessionStore({ now: () => clock });
  store.set(session("a"));
  clock = session("a").refreshExpiresAt;
  expect(store.get("a")).toBeUndefined();
  expect(store.size).toBe(0);
});

test("at its bound the store drops ended sessions first, then the one idle the longest", () => {
  let clock = START;
  const store = new MemorySessionStore({ maxSessions: 3, now: () => clock });
  store.set(session("idle"));
  clock += IDLE_TIMEOUT_MS;
  store.set(session("older", { lastSeenAt: clock }));
  store.set(session("newer", { lastSeenAt: clock }));

  store.set(session("fourth", { lastSeenAt: clock }));
  expect(store.size).toBe(3);
  expect(store.get("idle")).toBeUndefined();

  store.set(session("fifth", { lastSeenAt: clock }));
  expect(store.size).toBe(3);
  expect(store.get("older")).toBeUndefined();
  expect(store.get("newer")).toBeDefined();
});

test("every server bundle shares one store: the state lives on globalThis under a registered symbol", () => {
  const key = Symbol.for("skillsite.portal.auth-state");
  const state = authState();
  expect((globalThis as Record<symbol, unknown>)[key]).toBe(state);
  expect(authState().store).toBe(state.store);
});
