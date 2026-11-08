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

import { compact, createLogger, loggable } from "@/lib/log";

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

export const logBooking = createLogger<BookingOutcome>("booking", {
  created: "info",
  slot_taken: "info",
  blocked: "warn",
  rate_limited: "warn",
  rejected: "warn",
  failed: "error",
});

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

  return compact({
    event: loggable(event),
    slot: loggable(slot),
    duration: typeof duration === "number" ? duration : undefined,
    attendee: maskEmail(email),
    fillDurationMs:
      typeof fillDurationMs === "number" ? fillDurationMs : undefined,
    // Only ever non-empty on a blocked attempt; its content tells a customer's
    // autofill ("Muster GmbH") from a bot.
    honeypot: loggable(honeypot) || undefined,
  });
}

/** What a failed Cal.com booking request leaves in the outcome line. */
export type CalErrorSummary = {
  status: number;
  /** Cal.com's error code, such as `BadRequestException`. */
  code?: string;
};

/** A machine code: no spaces, so never a sentence - at most one token. */
const CAL_ERROR_CODE = /^[A-Za-z0-9_.-]{1,64}$/;

/**
 * The loggable part of a Cal.com error response: its HTTP status and Cal.com's
 * error code (`error.code`, or a plain `error` string), the code only when it is
 * a plain code. Cal.com's free-text message is never kept: it may echo what was
 * sent, and no scrubbing can be sure to catch every personal detail in it.
 */
export function redactCalError(status: number, body: string): CalErrorSummary {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return { status };
  }
  const error =
    typeof json === "object" && json !== null
      ? (json as Record<string, unknown>).error
      : undefined;
  const code =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>).code
      : error;
  return typeof code === "string" && CAL_ERROR_CODE.test(code)
    ? { status, code }
    : { status };
}
