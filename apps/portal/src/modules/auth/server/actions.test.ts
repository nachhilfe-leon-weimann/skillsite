import { beforeEach, expect, test, vi } from "vitest";

import { createAuthService, type AuthService } from "./auth-service";
import {
  ADMIN,
  BASE_URL,
  CLIENT,
  FakeCookieJar,
  FakeSkillforge,
  RedirectSignal,
} from "./fake-skillforge";
import { MemorySessionStore } from "./session-store";
import { createSkillforgeAuthApi } from "./skillforge";
import { createLoginThrottle } from "./throttle";

const jar = vi.hoisted(() => ({ current: undefined as unknown }));
const service = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("next/headers", () => ({ cookies: async () => jar.current }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));
vi.mock("./runtime", () => ({ authService: () => service.current }));

const { login, logout } = await import("./actions");

let skillforge: FakeSkillforge;
let store: MemorySessionStore;
let cookieJar: FakeCookieJar;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  skillforge = new FakeSkillforge();
  store = new MemorySessionStore();
  cookieJar = new FakeCookieJar();
  jar.current = cookieJar;
  service.current = createAuthService({
    api: createSkillforgeAuthApi(
      { baseUrl: BASE_URL, clientId: CLIENT.id, clientSecret: CLIENT.secret },
      skillforge.fetch,
    ),
    store,
    throttle: createLoginThrottle(),
    refreshes: new Map(),
    serviceToken: {},
  });
});

function form(email: string, password: string): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

test("a successful login sets only the session ID cookie, with its attributes, and goes to the start page", async () => {
  await expect(
    login(undefined, form(ADMIN.email, ADMIN.password)),
  ).rejects.toEqual(new RedirectSignal("/"));

  expect(cookieJar.writes).toEqual([
    {
      // Tests run outside a production build: no `__Host-` prefix and no `Secure` there.
      name: "session",
      value: expect.stringMatching(/^[\w-]{43}$/),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        maxAge: skillforge.refreshTtlSeconds,
      },
    },
  ]);
  expect(store.get(cookieJar.writes[0]!.value)?.userId).toBe(ADMIN.userId);
});

test("a failed login sets no cookie and hands the reason to the form", async () => {
  expect(await login(undefined, form(ADMIN.email, "wrong-password"))).toEqual({
    failure: "invalid_credentials",
  });
  expect(cookieJar.writes).toEqual([]);
});

test("a login without the SkillForge variables says the portal is not configured", async () => {
  service.current = null;
  expect(await login(undefined, form(ADMIN.email, ADMIN.password))).toEqual({
    failure: "not_configured",
  });
});

test("a new login ends the session the browser still held", async () => {
  const first = await (service.current as AuthService).login(
    { email: ADMIN.email, password: ADMIN.password },
    "shared",
  );
  if (!first.ok) throw new Error(first.failure);
  const previous = store.get(first.sessionId)!;
  cookieJar = new FakeCookieJar({ session: first.sessionId });
  jar.current = cookieJar;

  await expect(
    login(undefined, form(ADMIN.email, ADMIN.password)),
  ).rejects.toEqual(new RedirectSignal("/"));

  expect(store.get(first.sessionId)).toBeUndefined();
  expect(skillforge.isRevoked(previous.refreshToken)).toBe(true);
  expect(cookieJar.writes[0]?.value).not.toBe(first.sessionId);
});

test("logout revokes, deletes the session and clears the cookie", async () => {
  await expect(
    login(undefined, form(ADMIN.email, ADMIN.password)),
  ).rejects.toBeInstanceOf(RedirectSignal);
  const id = cookieJar.writes[0]!.value;
  const refreshToken = store.get(id)!.refreshToken;

  await expect(logout()).rejects.toEqual(new RedirectSignal("/login"));

  expect(skillforge.isRevoked(refreshToken)).toBe(true);
  expect(store.get(id)).toBeUndefined();
  expect(cookieJar.writes.at(-1)).toEqual({
    name: "session",
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 0,
    },
  });
});

test("logout clears the session and the cookie even when the revoke fails", async () => {
  await expect(
    login(undefined, form(ADMIN.email, ADMIN.password)),
  ).rejects.toBeInstanceOf(RedirectSignal);
  const id = cookieJar.writes[0]!.value;
  skillforge.down = true;

  await expect(logout()).rejects.toEqual(new RedirectSignal("/login"));

  expect(store.get(id)).toBeUndefined();
  expect(cookieJar.writes.at(-1)?.options).toMatchObject({ maxAge: 0 });
  expect(console.error).toHaveBeenCalledWith(
    expect.stringMatching(/^\[auth\] revoke_failed /),
  );
});
