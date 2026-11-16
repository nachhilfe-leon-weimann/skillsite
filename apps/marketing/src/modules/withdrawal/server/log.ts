/**
 * Structured withdrawal log. Every attempt that reaches the server action ends
 * in exactly one outcome line:
 *
 *   [withdrawal] <outcome> {"consumer":"ma***@example.com","fillDurationMs":41200,...}
 *
 * Privacy: the only personal detail is the masked e-mail, kept so a wrongly
 * blocked person can be recognised. No names, no contract or free text, no IP
 * addresses, no token.
 */

import { compact, createLogger, maskEmail } from "@/lib/log";

export type WithdrawalOutcome =
  /** Graph accepted the acknowledgement (202) and the notice. */
  | "sent"
  /** Graph accepted the acknowledgement, but the notice was refused or left unknown. */
  | "sent_without_notice"
  /** The acknowledgement may have gone out: timeout, lost connection, 5xx. */
  | "unknown"
  /** Nothing was sent: the token or Graph refused the request, or a bug stopped it. */
  | "failed"
  /** The Graph variables are not all set: nothing was sent. */
  | "unconfigured"
  /** An anti-spam signal stopped the attempt - may be a real person. */
  | "blocked"
  | "rate_limited"
  /** The overall limit refused a valid declaration: the function is down for everyone. */
  | "unavailable"
  /** Server-side validation failed although the form validates the same schema. */
  | "rejected";

export const logWithdrawal = createLogger<WithdrawalOutcome>("withdrawal", {
  sent: "info",
  sent_without_notice: "error",
  unknown: "error",
  failed: "error",
  unconfigured: "error",
  unavailable: "error",
  blocked: "warn",
  rate_limited: "warn",
  rejected: "warn",
});

/**
 * Log context identifying an attempt, from the raw, untrusted submission:
 * nothing about its shape is assumed. The honeypot's content is never kept -
 * it may be what autofill wrote, a real person's data.
 */
export function describeAttempt(submission: unknown): Record<string, unknown> {
  if (typeof submission !== "object" || submission === null) return {};
  const { values, fillDurationMs, honeypot } = submission as Record<
    string,
    unknown
  >;
  const email =
    typeof values === "object" && values !== null
      ? (values as Record<string, unknown>).email
      : undefined;
  return compact({
    consumer: maskEmail(email),
    fillDurationMs:
      typeof fillDurationMs === "number" ? fillDurationMs : undefined,
    honeypotFilled:
      typeof honeypot === "string" && honeypot !== "" ? true : undefined,
  });
}
