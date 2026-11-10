import { beforeEach, expect, test, vi } from "vitest";

import { createAuthService } from "./auth-service";
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

const { requireAdminSession, SkillforgeUnavailableError } =
  await import("./session");

let skillforge: FakeSkillforge;
let clock: number;
let store: MemorySessionStore;

beforeEach(() => {
  skillforge = new FakeSkillforge();
  clock = Date.UTC(2026, 10, 10, 9, 0, 0);
  const now = () => clock;
  store = new MemorySessionStore({ now });
  service.current = createAuthService({
    api: createSkillforgeAuthApi(
      { baseUrl: BASE_URL, clientId: CLIENT.id, clientSecret: CLIENT.secret },
      skillforge.fetch,
    ),
    store,
    throttle: createLoginThrottle({ now }),
    refreshes: new Map(),
    serviceToken: {},
    now,
    log: () => {},
  });
});

async function adminCookie(): Promise<string> {
  const result = await (
    service.current as ReturnType<typeof createAuthService>
  ).login({ email: ADMIN.email, password: ADMIN.password }, "shared");
  if (!result.ok) throw new Error(result.failure);
  // Tests run outside a production build: the cookie goes without its prefix.
  jar.current = new FakeCookieJar({ session: result.sessionId });
  return result.sessionId;
}

test("a live admin session hands out who is logged in, never a token", async () => {
  await adminCookie();
  const session = await requireAdminSession();
  expect(session).toEqual({
    userId: ADMIN.userId,
    partyId: ADMIN.partyId,
    roles: ["admin"],
  });
  expect(JSON.stringify(session)).not.toMatch(/sf_(at|rt)_/);
});

test("without a session cookie the request lands on /login", async () => {
  jar.current = new FakeCookieJar();
  await expect(requireAdminSession()).rejects.toEqual(
    new RedirectSignal("/login"),
  );
});

test("after invalid_grant on refresh the next request lands on /login", async () => {
  const id = await adminCookie();
  skillforge.revokeSession(store.get(id)?.refreshToken ?? "");
  clock = (store.get(id)?.accessExpiresAt ?? 0) + 1;

  await expect(requireAdminSession()).rejects.toEqual(
    new RedirectSignal("/login"),
  );
  await expect(requireAdminSession()).rejects.toEqual(
    new RedirectSignal("/login"),
  );
});

test("SkillForge unreachable keeps the session and shows an error instead of /login", async () => {
  const id = await adminCookie();
  clock = (store.get(id)?.accessExpiresAt ?? 0) + 1;
  skillforge.down = true;

  await expect(requireAdminSession()).rejects.toBeInstanceOf(
    SkillforgeUnavailableError,
  );
  expect(store.get(id)).toBeDefined();
});

test("an unconfigured portal has no sessions", async () => {
  await adminCookie();
  service.current = null;
  await expect(requireAdminSession()).rejects.toEqual(
    new RedirectSignal("/login"),
  );
});

test("the admin area reads the cookie even unconfigured, so a build never prerenders it as a redirect", async () => {
  // Reading the cookie is what makes Next render the page per request; `next build` runs without the variables.
  const cookieJar = new FakeCookieJar();
  const read = vi.spyOn(cookieJar, "get");
  jar.current = cookieJar;
  service.current = null;

  await expect(requireAdminSession()).rejects.toBeInstanceOf(RedirectSignal);
  expect(read).toHaveBeenCalled();
});
