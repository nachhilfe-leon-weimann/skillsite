import * as z from "zod/mini";

import {
  createSkillforgeClient,
  type components,
  type SkillforgeClient,
} from "@skillsite/api-client";

/**
 * SkillForge's auth endpoints as the BFF uses them: the token endpoint (form-encoded, the client authenticated by
 * HTTP Basic), `/auth/me` and `/auth/revoke`. Every call goes through `@skillsite/api-client` and the `fetch` the
 * caller passes in, so tests run without a network. Results are values, never thrown: a network error, a timeout,
 * a redirect and a 5xx are `unreachable`, a success whose body breaks the contract is `invalid_response` (fail
 * closed: nothing of it is used), every other refusal names SkillForge's error `code`.
 */

/** Where SkillForge is and how the portal's client authenticates there. */
export type SkillforgeConnection = {
  /** SkillForge's origin, without `/api/v1`. */
  baseUrl: string;
  clientId: string;
  clientSecret: string;
};

/** The tokens of a successful grant; `refresh*` only for a person's grants. */
export type TokenSet = {
  accessToken: string;
  /** Seconds. */
  expiresIn: number;
  refreshToken?: string;
  /** Seconds until the session ends for good. */
  refreshExpiresIn?: number;
};

/** A refusal: `invalid_grant` is the person's credentials or refresh token, `rejected` anything else SkillForge said. */
export type CallFailure =
  | { ok: false; error: "unreachable" }
  | { ok: false; error: "invalid_response" }
  | { ok: false; error: "invalid_grant" }
  | { ok: false; error: "rejected"; status: number; code?: string };

export type TokenResult = { ok: true; tokens: TokenSet } | CallFailure;

/** What `/auth/me` says about a person, as far as the BFF relies on it (`meResponse` checks it at runtime). */
export type Me = {
  principal_type: string;
  user_id: string | null;
  party_id: string | null;
  /** Kept as strings: a role a newer SkillForge adds must not break the admin check. */
  roles: string[];
};
export type MeResult = { ok: true; me: Me } | CallFailure;

export type RevokeResult = { ok: true } | CallFailure;

export type SkillforgeAuthApi = {
  passwordGrant(username: string, password: string): Promise<TokenResult>;
  refreshGrant(refreshToken: string): Promise<TokenResult>;
  clientCredentials(): Promise<TokenResult>;
  me(accessToken: string): Promise<MeResult>;
  /** Ends the SkillForge session of `refreshToken`, authorized by the portal's own `client_credentials` token. */
  revoke(refreshToken: string, serviceToken: string): Promise<RevokeResult>;
};

/** How long a call to SkillForge may take before it counts as unreachable. */
export const SKILLFORGE_TIMEOUT_MS = 10_000;

/** A machine code from SkillForge's error body: safe to log, never a sentence. */
const ERROR_CODE = /^[a-z_]{1,64}$/;

type TokenForm = components["schemas"]["Body_auth_create_token"];

/**
 * The parts of a token response the BFF relies on, checked at runtime: a lifetime that is not a positive whole
 * number of seconds would silently disable refresh and expiry, so it refuses the response instead.
 */
const tokenResponse = z.object({
  access_token: z.string().check(z.minLength(1)),
  expires_in: z.int().check(z.positive()),
  refresh_token: z.optional(z.nullable(z.string().check(z.minLength(1)))),
  refresh_expires_in: z.optional(z.nullable(z.int().check(z.positive()))),
});

/** The parts of `/auth/me` the admin gate relies on. */
const meResponse = z.object({
  principal_type: z.string(),
  user_id: z.nullable(z.string().check(z.minLength(1))),
  party_id: z.nullable(z.string()),
  roles: z.array(z.string()),
});

const INVALID_RESPONSE = { ok: false, error: "invalid_response" } as const;

function errorCode(error: unknown): string | undefined {
  const code =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>).code
      : undefined;
  return typeof code === "string" && ERROR_CODE.test(code) ? code : undefined;
}

function failure(status: number, error: unknown): CallFailure {
  if (status >= 500) return { ok: false, error: "unreachable" };
  const code = errorCode(error);
  if (code === "invalid_grant") return { ok: false, error: "invalid_grant" };
  return { ok: false, error: "rejected", status, code };
}

/** Runs one call; a thrown fetch (network error, timeout) is `unreachable`. */
async function attempt<T>(
  call: () => Promise<T>,
): Promise<T | { ok: false; error: "unreachable" }> {
  try {
    return await call();
  } catch {
    return { ok: false, error: "unreachable" };
  }
}

/**
 * HTTP Basic client authentication. SkillForge decodes the pair as it is, without the form-decoding RFC 6749,
 * section 2.3.1 asks for; its IDs and secrets (`token_urlsafe`) contain nothing that encoding would change.
 */
function basicAuth({ clientId, clientSecret }: SkillforgeConnection): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}

export function createSkillforgeAuthApi(
  connection: SkillforgeConnection,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): SkillforgeAuthApi {
  const client: SkillforgeClient = createSkillforgeClient({
    baseUrl: connection.baseUrl,
    fetch,
  });
  // Every call is fresh: nothing of an auth exchange may come from a cache. A redirect is an error, never
  // followed: fetch would send the form - a password, a refresh token - on to wherever it points.
  const init = () =>
    ({
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(SKILLFORGE_TIMEOUT_MS),
    }) as const;

  async function token(form: TokenForm): Promise<TokenResult> {
    return attempt(async () => {
      const { data, error, response } = await client.POST(
        "/api/v1/auth/token",
        {
          ...init(),
          body: form,
          bodySerializer: (body) =>
            new URLSearchParams(
              Object.entries(body).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            ),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: basicAuth(connection),
          },
        },
      );
      if (!data) return failure(response.status, error);
      const parsed = tokenResponse.safeParse(data);
      if (!parsed.success) return INVALID_RESPONSE;
      return {
        ok: true,
        tokens: {
          accessToken: parsed.data.access_token,
          expiresIn: parsed.data.expires_in,
          refreshToken: parsed.data.refresh_token ?? undefined,
          refreshExpiresIn: parsed.data.refresh_expires_in ?? undefined,
        },
      };
    });
  }

  return {
    passwordGrant: (username, password) =>
      token({ grant_type: "password", username, password }),
    refreshGrant: (refreshToken) =>
      token({ grant_type: "refresh_token", refresh_token: refreshToken }),
    clientCredentials: () => token({ grant_type: "client_credentials" }),

    me: (accessToken) =>
      attempt(async () => {
        const { data, error, response } = await client.GET("/api/v1/auth/me", {
          ...init(),
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!data) return failure(response.status, error);
        const parsed = meResponse.safeParse(data);
        return parsed.success
          ? { ok: true as const, me: parsed.data }
          : INVALID_RESPONSE;
      }),

    revoke: (refreshToken, serviceToken) =>
      attempt(async () => {
        const { error, response } = await client.POST("/api/v1/auth/revoke", {
          ...init(),
          body: { refresh_token: refreshToken },
          headers: { Authorization: `Bearer ${serviceToken}` },
        });
        return response.ok
          ? { ok: true as const }
          : failure(response.status, error);
      }),
  };
}
