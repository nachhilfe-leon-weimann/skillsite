import "server-only";

import * as z from "zod/mini";

/**
 * The app's runtime environment, read in one place. `instrumentation.ts`
 * parses it once at server start, so a malformed variable stops the server
 * there; nothing is parsed at import time, so `next build` and the tests run
 * without any variable set. The portal reads no variable yet; the SkillForge
 * connection adds its rules here (admin helper spec, SS3).
 */

/** A variable that is present but breaks its rule. The message never holds the value. */
export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

/** The variables the portal reads; every other variable is dropped. */
const serverEnvSchema = z.object({});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Parse the runtime variables. Throws `EnvError` naming the variable and its
 * rule, never the value.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
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
  return result.data;
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
