import type { SkillforgeAuthApi } from "./skillforge";

/**
 * The portal's own `client_credentials` token, which `/auth/revoke` needs (BFF contract). It is fetched once and
 * reused until shortly before it expires; concurrent callers share one fetch.
 */

/** A token is replaced once less than this is left of it. */
export const SERVICE_TOKEN_MARGIN_MS = 60 * 1000;

/** The cache's state; it lives with the rest of the auth state (`runtime.ts`). */
export type ServiceTokenCache = {
  token?: { value: string; expiresAt: number };
  pending?: Promise<string | null>;
};

/** The cached token, or a fresh one; `null` when SkillForge did not issue one. */
export function serviceToken(
  api: SkillforgeAuthApi,
  cache: ServiceTokenCache,
  now: () => number,
): Promise<string | null> {
  const cached = cache.token;
  if (cached && cached.expiresAt - now() > SERVICE_TOKEN_MARGIN_MS) {
    return Promise.resolve(cached.value);
  }
  cache.pending ??= api
    .clientCredentials()
    .then((result) => {
      if (!result.ok) return null;
      cache.token = {
        value: result.tokens.accessToken,
        expiresAt: now() + result.tokens.expiresIn * 1000,
      };
      return result.tokens.accessToken;
    })
    .finally(() => {
      cache.pending = undefined;
    });
  return cache.pending;
}

/** Drops the cached token, e.g. after SkillForge refused it. */
export function invalidateServiceToken(cache: ServiceTokenCache): void {
  cache.token = undefined;
}
