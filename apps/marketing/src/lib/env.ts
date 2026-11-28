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
const optional = <T extends z.ZodMiniType<string>>(schema: T) =>
  z.pipe(
    z.transform((value: unknown) => (value === "" ? undefined : value)),
    z.optional(schema),
  );

/** No whitespace: a value pasted with a line break or a space would fail far from its cause. */
const token = z.string().check(
  z.regex(/^\S+$/, {
    error: "it must not contain whitespace.",
  }),
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
  /** SkillForge's origin, without `/api/v1`, as in the portal. */
  SKILLFORGE_API_URL: optional(
    z.string().check(
      z.regex(/^https?:\/\/[^\s/?#]+\/?$/, {
        error:
          "it must be an http(s) origin without a path, such as http://localhost:8000.",
      }),
    ),
  ),
  /** The site's client ID at SkillForge, for the payment lookup. */
  SKILLFORGE_CLIENT_ID: optional(token),
  /** The site's client secret at SkillForge; never logged, never sent to the browser. */
  SKILLFORGE_CLIENT_SECRET: optional(token),
});

/** The variables the app reads; every other variable is dropped. */
const VARIABLES = [
  "CAL_API_KEY",
  "SKILLFORGE_API_URL",
  "SKILLFORGE_CLIENT_ID",
  "SKILLFORGE_CLIENT_SECRET",
] as const;

/** The SkillForge connection of the payment lookup: all three or none. */
const SKILLFORGE_VARIABLES = [
  "SKILLFORGE_API_URL",
  "SKILLFORGE_CLIENT_ID",
  "SKILLFORGE_CLIENT_SECRET",
] as const;

export type ServerEnv = {
  CAL_API_KEY?: string;
  SKILLFORGE_API_URL?: string;
  SKILLFORGE_CLIENT_ID?: string;
  SKILLFORGE_CLIENT_SECRET?: string;
};

function malformed(issues: readonly z.core.$ZodIssue[]): EnvError {
  return new EnvError(
    issues
      .map(
        (issue) =>
          `${String(issue.path[0])} is set but malformed: ${issue.message}`,
      )
      .join(" "),
  );
}

/**
 * Parse the runtime variables. Throws `EnvError` naming the variable and its
 * rule, never the value. The SkillForge connection is all three variables or
 * none: none runs the payment lookup unconfigured, part of them is a mistake.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(
    Object.fromEntries(VARIABLES.map((name) => [name, source[name]])),
  );
  if (!result.success) throw malformed(result.error.issues);

  // An absent variable is a missing key, not one holding `undefined`.
  const env: ServerEnv = Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined),
  );
  const present = SKILLFORGE_VARIABLES.filter((name) => name in env);
  if (present.length > 0 && present.length < SKILLFORGE_VARIABLES.length) {
    const missing = SKILLFORGE_VARIABLES.filter((name) => !(name in env));
    throw new EnvError(
      `${missing.join(", ")} missing: set SKILLFORGE_API_URL, SKILLFORGE_CLIENT_ID and SKILLFORGE_CLIENT_SECRET together, or none of them to run the payment lookup unconfigured.`,
    );
  }
  return env;
}

let parsed: ServerEnv | undefined;

/** The runtime variables, parsed once; the only accessor for them. */
export function serverEnv(): ServerEnv {
  parsed ??= parseServerEnv();
  return parsed;
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
