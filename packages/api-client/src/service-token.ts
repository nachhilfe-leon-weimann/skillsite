import type { SkillforgeClient } from "./index";

/**
 * A server's own `client_credentials` token for SkillForge: fetched once, reused until shortly before it expires,
 * and shared between concurrent callers. Failures are values, never thrown: whatever stops a token from being
 * issued (a refusal, a body that breaks the contract, a network error, a timeout) is `null`, so the caller fails
 * closed.
 */

/** A token is replaced once less than this is left of it. */
export const SERVICE_TOKEN_MARGIN_MS = 60 * 1000;

/** How long the token request may take before it counts as failed. */
export const SERVICE_TOKEN_TIMEOUT_MS = 10_000;

export type ClientCredentials = { clientId: string; clientSecret: string };

export type ServiceTokenSource = {
  /** The cached token, or a fresh one; `null` when SkillForge did not issue one. */
  token(): Promise<string | null>;
  /** Drops the cached token, e.g. after SkillForge refused it. */
  invalidate(): void;
};

/**
 * HTTP Basic client authentication. SkillForge decodes the pair as it is, without the form-decoding RFC 6749,
 * section 2.3.1 asks for; its IDs and secrets (`token_urlsafe`) contain nothing that encoding would change.
 */
function basicAuth({ clientId, clientSecret }: ClientCredentials): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}

type IssuedToken = { value: string; expiresInMs: number };

/** One request to the token endpoint; `null` for anything but a `200` with a usable token. */
async function requestToken(
  client: SkillforgeClient,
  credentials: ClientCredentials,
): Promise<IssuedToken | null> {
  try {
    const { data, response } = await client.POST("/api/v1/auth/token", {
      // Every call is fresh, and a redirect is an error, never followed: fetch would send the credentials on.
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(SERVICE_TOKEN_TIMEOUT_MS),
      body: { grant_type: "client_credentials" },
      bodySerializer: () =>
        new URLSearchParams({ grant_type: "client_credentials" }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuth(credentials),
      },
    });
    if (response.status !== 200 || !data) return null;
    // A lifetime that is not a positive whole number of seconds would silently disable expiry: refuse it.
    const { access_token: value, expires_in: seconds } = data as {
      access_token?: unknown;
      expires_in?: unknown;
    };
    if (typeof value !== "string" || value === "") return null;
    if (typeof seconds !== "number" || !Number.isInteger(seconds)) return null;
    if (seconds <= 0) return null;
    return { value, expiresInMs: seconds * 1000 };
  } catch {
    return null;
  }
}

export function createServiceTokenSource(options: {
  client: SkillforgeClient;
  credentials: ClientCredentials;
  /** Milliseconds since the epoch; a seam for tests. */
  now?: () => number;
}): ServiceTokenSource {
  const { client, credentials, now = Date.now } = options;
  let cached: { value: string; expiresAt: number } | undefined;
  let pending: Promise<string | null> | undefined;
  /** Bumped by `invalidate`, so a fetch that was already running does not cache a token it was meant to drop. */
  let generation = 0;

  return {
    token() {
      if (cached && cached.expiresAt - now() > SERVICE_TOKEN_MARGIN_MS) {
        return Promise.resolve(cached.value);
      }
      const started = generation;
      pending ??= requestToken(client, credentials)
        .then((issued) => {
          if (!issued) return null;
          if (started === generation) {
            cached = {
              value: issued.value,
              expiresAt: now() + issued.expiresInMs,
            };
          }
          return issued.value;
        })
        .finally(() => {
          pending = undefined;
        });
      return pending;
    },
    invalidate() {
      generation += 1;
      cached = undefined;
    },
  };
}
