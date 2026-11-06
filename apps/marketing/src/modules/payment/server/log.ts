/**
 * Structured payment-link log. Every call of the invoice payment link ends in
 * exactly one outcome line, so the container log always answers "did this
 * customer reach PayPal?":
 *
 *   [payment] redirected {"invoice":"RE-1840","amount":"90.00"}
 *   [payment] rejected {"reason":"amount","re":"RE-1840","betrag":"90,00 USD"}
 *
 * Privacy: an invoice number and an amount, nothing about the person - the link
 * carries no name, no e-mail and no IP address.
 */

export type PaymentOutcome =
  /** The customer was sent to PayPal's checkout. */
  | "redirected"
  /** The link was unusable - an error page was shown instead. */
  | "rejected";

const LEVEL = {
  redirected: "info",
  rejected: "warn",
} as const satisfies Record<PaymentOutcome, "info" | "warn">;

/** Longest untrusted string copied into a log line. */
const MAX_LOGGED_LENGTH = 64;

export function logPayment(
  outcome: PaymentOutcome,
  context: Record<string, unknown>,
): void {
  // JSON keeps untrusted values on one line, so input can't forge log entries.
  console[LEVEL[outcome]](`[payment] ${outcome} ${JSON.stringify(context)}`);
}

/** Bounded copy of an untrusted value for logging; `undefined` if not a string. */
function loggable(value: unknown): string | undefined {
  return typeof value === "string"
    ? value.slice(0, MAX_LOGGED_LENGTH)
    : undefined;
}

/**
 * Log context for a rejected link: the raw parameters as they arrived, so a
 * broken sevDesk template is recognisable from the log alone. Takes untrusted
 * input, so nothing about its shape is assumed and unreadable parts are left
 * out.
 */
export function describeLink(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null) return {};
  const { re, betrag } = input as Record<string, unknown>;

  const context: Record<string, unknown> = {
    re: loggable(re),
    betrag: loggable(betrag),
  };
  for (const key of Object.keys(context)) {
    if (context[key] === undefined) delete context[key];
  }
  return context;
}
