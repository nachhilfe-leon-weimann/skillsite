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
});

export type ServerEnv = { CAL_API_KEY?: string };

/**
 * Parse the runtime variables. Throws `EnvError` naming the variable and its
 * rule, never the value.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse({ CAL_API_KEY: source.CAL_API_KEY });
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
