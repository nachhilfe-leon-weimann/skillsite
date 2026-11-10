/**
 * A test double of SkillForge's auth endpoints, answering through an injected `fetch`: no network, synthetic
 * accounts and tokens only. It follows SkillForge's contract where the BFF relies on it - HTTP Basic client auth,
 * form-encoded grants, one `invalid_grant` body, refresh rotation, `/auth/revoke` needing the client's own token -
 * and records every call. Used by the auth module's tests only.
 */

export const CLIENT = { id: "portal-test", secret: "sf_live_synthetic" };
export const BASE_URL = "http://skillforge.test";

export type FakeAccount = {
  email: string;
  password: string;
  userId: string;
  partyId: string;
  roles: string[];
};

export const ADMIN: FakeAccount = {
  email: "admin@example.com",
  password: "synthetic-admin-password",
  userId: "00000000-0000-4000-8000-000000000001",
  partyId: "00000000-0000-4000-8000-0000000000a1",
  roles: ["admin"],
};

export const TUTOR: FakeAccount = {
  email: "tutor@example.com",
  password: "synthetic-tutor-password",
  userId: "00000000-0000-4000-8000-000000000002",
  partyId: "00000000-0000-4000-8000-0000000000a2",
  roles: ["tutor"],
};

export type Call = { method: string; path: string; grant?: string };

type Session = { account: FakeAccount; revoked: boolean };

const json = (status: number, body: unknown) => Response.json(body, { status });
const INVALID_GRANT = {
  code: "invalid_grant",
  detail: "Invalid credentials or refresh token",
};

export class FakeSkillforge {
  readonly calls: Call[] = [];
  accounts: FakeAccount[] = [ADMIN, TUTOR];
  accessTtlSeconds = 900;
  refreshTtlSeconds = 30 * 24 * 60 * 60;
  /** Every request fails like a network error. */
  down = false;
  /** `/auth/revoke` answers 500. */
  revokeFails = false;
  /** Holds every refresh until `releaseRefreshes()`, so a test can send concurrent requests. */
  holdRefreshes = false;

  /** The refresh token issued last. */
  lastRefreshToken: string | undefined;

  readonly #sessions = new Map<string, Session>();
  readonly #access = new Map<string, FakeAccount | "client">();
  readonly #held: (() => void)[] = [];
  #counter = 0;

  readonly fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const call: Call = { method: request.method, path: url.pathname };
    this.calls.push(call);
    if (this.down) throw new TypeError("fetch failed");

    if (request.method === "POST" && url.pathname === "/api/v1/auth/token") {
      if (
        request.headers.get("content-type") !==
        "application/x-www-form-urlencoded"
      ) {
        return json(422, { code: "validation_error" });
      }
      if (
        request.headers.get("authorization") !==
        `Basic ${btoa(`${CLIENT.id}:${CLIENT.secret}`)}`
      ) {
        return json(401, { code: "invalid_client" });
      }
      const form = new URLSearchParams(await request.text());
      call.grant = form.get("grant_type") ?? undefined;
      return this.#token(form);
    }
    if (request.method === "GET" && url.pathname === "/api/v1/auth/me") {
      const bearer = this.#bearer(request);
      if (!bearer) return json(401, { code: "unauthorized" });
      return json(
        200,
        bearer === "client"
          ? {
              principal_type: "application",
              client_id: CLIENT.id,
              scopes: ["auth:users:login"],
              user_id: null,
              party_id: null,
              roles: [],
            }
          : {
              principal_type: "user",
              client_id: CLIENT.id,
              scopes: ["account:self"],
              user_id: bearer.userId,
              party_id: bearer.partyId,
              roles: bearer.roles,
            },
      );
    }
    if (request.method === "POST" && url.pathname === "/api/v1/auth/revoke") {
      if (this.revokeFails) return json(500, { code: "internal_error" });
      if (this.#bearer(request) !== "client") {
        return json(403, { code: "forbidden" });
      }
      const { refresh_token: token } = (await request.json()) as {
        refresh_token: string;
      };
      const session = this.#sessions.get(token);
      if (session) session.revoked = true;
      return new Response(null, { status: 204 });
    }
    return json(404, { code: "not_found" });
  };

  /** Calls to the token endpoint with this grant. */
  grants(grant: string): number {
    return this.calls.filter((call) => call.grant === grant).length;
  }

  /** Calls to this path. */
  count(path: string): number {
    return this.calls.filter((call) => call.path === path).length;
  }

  /** Whether the SkillForge session of this refresh token was revoked. */
  isRevoked(refreshToken: string): boolean {
    return this.#sessions.get(refreshToken)?.revoked ?? false;
  }

  /** Ends the SkillForge session of this refresh token, as an admin would. */
  revokeSession(refreshToken: string): void {
    const session = this.#sessions.get(refreshToken);
    if (session) session.revoked = true;
  }

  releaseRefreshes(): void {
    this.holdRefreshes = false;
    for (const release of this.#held.splice(0)) release();
  }

  /** How many refreshes are waiting for `releaseRefreshes()`. */
  heldRefreshes(): number {
    return this.#held.length;
  }

  #bearer(request: Request): FakeAccount | "client" | undefined {
    const header = request.headers.get("authorization") ?? "";
    return header.startsWith("Bearer ")
      ? this.#access.get(header.slice("Bearer ".length))
      : undefined;
  }

  #issue(subject: FakeAccount | "client") {
    this.#counter += 1;
    const accessToken = `sf_at_synthetic_${this.#counter}`;
    this.#access.set(accessToken, subject);
    return accessToken;
  }

  #personTokens(account: FakeAccount) {
    const accessToken = this.#issue(account);
    const refreshToken = `sf_rt_synthetic_${this.#counter}`;
    this.#sessions.set(refreshToken, { account, revoked: false });
    this.lastRefreshToken = refreshToken;
    return json(200, {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: this.accessTtlSeconds,
      scope: "account:self",
      refresh_token: refreshToken,
      refresh_expires_in: this.refreshTtlSeconds,
    });
  }

  async #token(form: URLSearchParams): Promise<Response> {
    switch (form.get("grant_type")) {
      case "client_credentials":
        return json(200, {
          access_token: this.#issue("client"),
          token_type: "bearer",
          expires_in: this.accessTtlSeconds,
          scope: "auth:users:login",
        });
      case "password": {
        const account = this.accounts.find(
          (candidate) =>
            candidate.email === form.get("username") &&
            candidate.password === form.get("password"),
        );
        return account ? this.#personTokens(account) : json(400, INVALID_GRANT);
      }
      case "refresh_token": {
        if (this.holdRefreshes) {
          await new Promise<void>((release) => this.#held.push(release));
        }
        const token = form.get("refresh_token") ?? "";
        const session = this.#sessions.get(token);
        if (!session || session.revoked) return json(400, INVALID_GRANT);
        // Rotation: the presented token stops working.
        session.revoked = true;
        return this.#personTokens(session.account);
      }
      default:
        return json(400, { code: "unsupported_grant_type" });
    }
  }
}

/** A cookie jar in the shape of the `cookies()` store the auth module uses, recording every write. */
export class FakeCookieJar {
  readonly writes: { name: string; value: string; options: unknown }[] = [];
  readonly #values = new Map<string, string>();

  constructor(initial: Record<string, string> = {}) {
    for (const [name, value] of Object.entries(initial)) {
      this.#values.set(name, value);
    }
  }

  get(name: string) {
    const value = this.#values.get(name);
    return value === undefined ? undefined : { name, value };
  }

  set(name: string, value: string, options: unknown) {
    this.writes.push({ name, value, options });
    this.#values.set(name, value);
  }
}

/** What `redirect()` throws in the tests, standing in for Next's control-flow error. */
export class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`redirect to ${url}`);
  }
}
