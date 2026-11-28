/**
 * Core of the structured outcome logs (booking, payment, withdrawal). Each
 * domain logs one line per outcome, greppable by its tag:
 *
 *   [<domain>] <outcome> {"key":"value",...}
 *
 * The domains decide what goes into a context; this core only writes the line
 * and bounds untrusted values.
 */

export type LogLevel = "info" | "warn" | "error";

/** Longest untrusted string copied into a log line. */
const MAX_LOGGED_LENGTH = 64;

/** A domain's log: one line per outcome, at the level the domain assigns it. */
export function createLogger<O extends string>(
  domain: string,
  levels: Record<O, LogLevel>,
): (outcome: O, context: Record<string, unknown>) => void {
  return (outcome, context) => {
    // JSON keeps untrusted values on one line, so input can't forge log entries.
    console[levels[outcome]](
      `[${domain}] ${outcome} ${JSON.stringify(context)}`,
    );
  };
}

/** Bounded copy of an untrusted value for logging; `undefined` if not a string. */
export function loggable(value: unknown): string | undefined {
  return typeof value === "string"
    ? value.slice(0, MAX_LOGGED_LENGTH)
    : undefined;
}

/**
 * The one personal detail an outcome line may carry: a masked e-mail, so a
 * wrongly blocked person can be recognised. `test.kunde@example.com` ->
 * `te***@example.com`; `undefined` for anything that is no address.
 */
export function maskEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const email = value.trim();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return undefined;
  return loggable(`${email.slice(0, Math.min(2, at))}***${email.slice(at)}`);
}

/** The context without its `undefined` entries, in their original order. */
export function compact(
  context: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined),
  );
}
