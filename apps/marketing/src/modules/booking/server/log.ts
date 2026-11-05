/**
 * Structured booking log. Every attempt that reaches the server action ends in
 * exactly one outcome line, so the container log always answers "what happened
 * to this booking?":
 *
 *   [booking] <outcome> {"event":"nachhilfe","slot":"...","attendee":"ma***@example.com",...}
 *
 * Privacy: the only personal detail is the masked e-mail, kept so a wrongly
 * blocked customer can be recognised and contacted. No names, phone numbers,
 * notes or IP addresses.
 */

export type BookingOutcome =
  /** Cal.com confirmed the booking. */
  | "created"
  /** An anti-spam layer stopped the attempt - may be a real customer. */
  | "blocked"
  | "rate_limited"
  /** Server-side validation failed although the form validates the same schema. */
  | "rejected"
  | "slot_taken"
  /** Cal.com was unreachable, unconfigured or answered with an error. */
  | "failed";

const LEVEL = {
  created: "info",
  slot_taken: "info",
  blocked: "warn",
  rate_limited: "warn",
  rejected: "warn",
  failed: "error",
} as const satisfies Record<BookingOutcome, "info" | "warn" | "error">;

/** Longest untrusted string copied into a log line. */
const MAX_LOGGED_LENGTH = 64;

export function logBooking(
  outcome: BookingOutcome,
  context: Record<string, unknown>,
): void {
  // JSON keeps untrusted values on one line, so input can't forge log entries.
  console[LEVEL[outcome]](`[booking] ${outcome} ${JSON.stringify(context)}`);
}

/** Bounded copy of an untrusted value for logging; `undefined` if not a string. */
function loggable(value: unknown): string | undefined {
  return typeof value === "string"
    ? value.slice(0, MAX_LOGGED_LENGTH)
    : undefined;
}

/** `test.kunde@example.com` -> `te***@example.com`. */
export function maskEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const email = value.trim();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return undefined;
  return loggable(`${email.slice(0, Math.min(2, at))}***${email.slice(at)}`);
}

/**
 * Log context identifying an attempt. Takes the raw, untrusted submission -
 * outcomes are logged before validation too - so nothing about its shape is
 * assumed and absent or malformed parts are simply left out.
 */
export function describeAttempt(submission: unknown): Record<string, unknown> {
  if (typeof submission !== "object" || submission === null) return {};
  const { event, slot, duration, values, fillDurationMs, honeypot } =
    submission as Record<string, unknown>;
  const email =
    typeof values === "object" && values !== null
      ? (values as Record<string, unknown>).email
      : undefined;

  const context: Record<string, unknown> = {
    event: loggable(event),
    slot: loggable(slot),
    duration: typeof duration === "number" ? duration : undefined,
    attendee: maskEmail(email),
    fillDurationMs:
      typeof fillDurationMs === "number" ? fillDurationMs : undefined,
    // Only ever non-empty on a blocked attempt; its content tells a customer's
    // autofill ("Muster GmbH") from a bot.
    honeypot: loggable(honeypot) || undefined,
  };
  for (const key of Object.keys(context)) {
    if (context[key] === undefined) delete context[key];
  }
  return context;
}
