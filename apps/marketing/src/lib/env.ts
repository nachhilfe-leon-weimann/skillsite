import "server-only";

import * as z from "zod/mini";

/**
 * The app's runtime environment, read in one place. `instrumentation.ts`
 * parses it once at server start, so a malformed variable stops the server
 * there; nothing is parsed at import time, so `next build` and the tests run
 * without any variable set.
 */

/** A variable that is present but breaks its rule. The message never holds the value. */
export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

/** Absent or empty: an unset variable, as `process.env.X || null` read it before. */
const optional = (schema: z.ZodMiniString) =>
  z.pipe(
    z.transform((value) => (value === "" ? undefined : value)),
    z.optional(schema),
  );

/** A Microsoft Entra ID: tenant or application (client) ID. */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const guid = (what: string) =>
  optional(
    z.string().check(
      z.regex(GUID, {
        error: `it must be the ${what} as Entra shows it (a GUID). Set it, or leave it empty to run the withdrawal function unconfigured.`,
      }),
    ),
  );

const serverEnvSchema = z.object({
  /** Cal.com API key; without it the booking runs "unconfigured". */
  CAL_API_KEY: optional(
    z.string().check(
      z.regex(/^cal_live_\S*$/, {
        error:
          'it must start with "cal_live_" and contain no whitespace. Set a valid key, or leave it empty to run the booking unconfigured.',
      }),
    ),
  ),
  /**
   * Microsoft Graph app-only credentials of the withdrawal mail
   * (`docs/withdrawal-mail.md`). The withdrawal function sends only when all
   * four withdrawal variables are set; otherwise it runs "unconfigured".
   */
  GRAPH_TENANT_ID: guid("Directory (tenant) ID"),
  GRAPH_CLIENT_ID: guid("Application (client) ID"),
  GRAPH_CLIENT_SECRET: optional(
    z.string().check(
      z.regex(/^\S+$/, {
        error:
          "it must contain no whitespace. Set the client secret's value, or leave it empty to run the withdrawal function unconfigured.",
      }),
    ),
  ),
  /** The mailbox that sends the acknowledgement and receives the notice. */
  WITHDRAWAL_MAILBOX: optional(
    z.string().check(
      z.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
        error:
          "it must be one e-mail address. Set it, or leave it empty to run the withdrawal function unconfigured.",
      }),
    ),
  ),
});

/** The variables `parseServerEnv` reads; every one is optional. */
const SERVER_ENV_KEYS = [
  "CAL_API_KEY",
  "GRAPH_TENANT_ID",
  "GRAPH_CLIENT_ID",
  "GRAPH_CLIENT_SECRET",
  "WITHDRAWAL_MAILBOX",
] as const;

export type ServerEnv = Partial<
  Record<(typeof SERVER_ENV_KEYS)[number], string>
>;

/**
 * Parse the runtime variables. Throws `EnvError` naming the variable and its
 * rule, never the value.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(
    Object.fromEntries(SERVER_ENV_KEYS.map((key) => [key, source[key]])),
  );
  if (!result.success) {
    throw new EnvError(
      result.error.issues
        .map(
          (issue) =>
            `${String(issue.path[0])} is set but malformed: ${issue.message}`,
        )
        .join(" "),
    );
  }
  // An absent variable is a missing key, not one holding `undefined`.
  return Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined),
  );
}

let parsed: ServerEnv | undefined;

/** The runtime variables, parsed once; the only accessor for them. */
export function serverEnv(): ServerEnv {
  parsed ??= parseServerEnv();
  return parsed;
}

/** What the withdrawal function needs to send mail through Microsoft Graph. */
export type WithdrawalMailConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  /** Sender of the acknowledgement and recipient of the notice. */
  mailbox: string;
};

/**
 * The withdrawal mail settings, or `null` - the function is then
 * "unconfigured" - unless all four variables are set.
 */
export function withdrawalMailConfig(
  env: ServerEnv = serverEnv(),
): WithdrawalMailConfig | null {
  const {
    GRAPH_TENANT_ID: tenantId,
    GRAPH_CLIENT_ID: clientId,
    GRAPH_CLIENT_SECRET: clientSecret,
    WITHDRAWAL_MAILBOX: mailbox,
  } = env;
  if (!tenantId || !clientId || !clientSecret || !mailbox) return null;
  return { tenantId, clientId, clientSecret, mailbox };
}

/**
 * The released version, inlined at build time by `next.config.ts` (the literal
 * member access is what Next replaces); `"unknown"` for a build without one.
 */
export function appVersion(): string {
  return process.env.APP_VERSION ?? "unknown";
}

/** Whether this is a production build (`next build`), inlined at build time. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
