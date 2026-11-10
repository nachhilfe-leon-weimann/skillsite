import { serverEnv } from "@/lib/env";

import {
  createAuthService,
  type AuthService,
  type AuthState,
} from "./auth-service";
import { MemorySessionStore } from "./session-store";
import { createSkillforgeAuthApi } from "./skillforge";
import { createLoginThrottle } from "./throttle";

/**
 * The process's auth state, on `globalThis` under a `Symbol.for` key: Next bundles server code more than once (the
 * pages, the server actions, the proxy), each with its own module scope, and `next dev` re-evaluates modules on a
 * reload. A module-scoped store would split the sessions between them; the global one is the same everywhere.
 */
const STATE_KEY = Symbol.for("skillsite.portal.auth-state");

type GlobalWithAuthState = typeof globalThis & { [STATE_KEY]?: AuthState };

export function authState(): AuthState {
  const global = globalThis as GlobalWithAuthState;
  global[STATE_KEY] ??= {
    store: new MemorySessionStore(),
    throttle: createLoginThrottle(),
    refreshes: new Map(),
    serviceToken: {},
  };
  return global[STATE_KEY];
}

/** The auth service on the shared state; `null` while the SkillForge variables are not set. */
export function authService(): AuthService | null {
  const env = serverEnv();
  if (
    !env.SKILLFORGE_API_URL ||
    !env.SKILLFORGE_CLIENT_ID ||
    !env.SKILLFORGE_CLIENT_SECRET
  ) {
    return null;
  }
  return createAuthService({
    ...authState(),
    api: createSkillforgeAuthApi({
      baseUrl: env.SKILLFORGE_API_URL,
      clientId: env.SKILLFORGE_CLIENT_ID,
      clientSecret: env.SKILLFORGE_CLIENT_SECRET,
    }),
  });
}

/** Whether the portal can log anyone in: the SkillForge variables are set. */
export function authConfigured(): boolean {
  return authService() !== null;
}
