/**
 * Core of the structured outcome logs. Each domain logs one line per outcome, greppable by its tag:
 *
 *   [<domain>] <outcome> {"key":"value",...}
 *
 * The domains decide what goes into a context - never a token, a password, an e-mail address or a client IP
 * (admin helper spec, _Rules_); this core only writes the line.
 */

export type LogLevel = "info" | "warn" | "error";

/** A domain's log: one line per outcome, at the level the domain assigns it. */
export function createLogger<O extends string>(
  domain: string,
  levels: Record<O, LogLevel>,
): (outcome: O, context?: Record<string, unknown>) => void {
  return (outcome, context = {}) => {
    // JSON keeps every value on one line, so no value can forge a log entry.
    console[levels[outcome]](
      `[${domain}] ${outcome} ${JSON.stringify(context)}`,
    );
  };
}
