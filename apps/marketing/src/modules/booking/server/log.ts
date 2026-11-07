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
  message?: string;
};

/** Anything that reads as an e-mail address or a phone number. */
const CONTACT_PATTERNS = [/\S+@\S+/g, /\+?\d[\d\s()/.-]{4,}\d/g];

/** Words of a sent value worth scrubbing on their own: Cal.com may echo a part. */
const MIN_SCRUBBED_LENGTH = 3;

/** The personal values of a booking request: the attendee and the form's answers. */
function personalValues(sent: unknown): string[] {
  const { attendee, bookingFieldsResponses } = (sent ?? {}) as Record<
    string,
    unknown
  >;
  const { name, email, phoneNumber } = (attendee ?? {}) as Record<
    string,
    unknown
  >;
  const values: string[] = [];
  const collect = (value: unknown) => {
    if (typeof value === "string") values.push(value);
    else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(collect);
    }
  };
  [name, email, phoneNumber, bookingFieldsResponses].forEach(collect);
  // Longest first, so a whole value goes before the words it contains.
  return [
    ...new Set(
      values.flatMap((value) => [value.trim(), ...value.split(/\s+/)]),
    ),
  ]
    .filter((value) => value.length >= MIN_SCRUBBED_LENGTH)
    .sort((a, b) => b.length - a.length);
}

/** A pattern matching `value` literally, in any case. */
const literally = (value: string) =>
  new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");

function scrub(text: string, personal: string[]): string {
  return [...personal.map(literally), ...CONTACT_PATTERNS].reduce(
    (result, pattern) => result.replace(pattern, "[redacted]"),
    text,
  );
}

/**
 * The loggable part of a Cal.com error response. Cal.com may echo the request
 * in its error, so only its status, its error code and its message are kept,
 * each scrubbed of every personal value the request `sent` and of anything that
 * reads as an e-mail address or a phone number, then bounded. A body that is
 * not JSON (a proxy's error page) leaves only the status.
 */
export function redactCalError(
  status: number,
  body: string,
  sent: unknown,
): CalErrorSummary {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return { status };
  }
  const { error, message } = (json ?? {}) as Record<string, unknown>;
  const nested =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const text = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((entry) => typeof entry === "string").join("; ")
      : value;

  const personal = personalValues(sent);
  const safe = (value: unknown) => {
    const raw = text(value);
    return typeof raw === "string" && raw !== ""
      ? loggable(scrub(raw, personal))
      : undefined;
  };
  return compact({
    status,
    code: safe(nested.code ?? error),
    message: safe(nested.message ?? message),
  }) as CalErrorSummary;
}
