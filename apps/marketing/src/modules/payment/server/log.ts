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

import { compact, createLogger, loggable } from "@/lib/log";

export type PaymentOutcome =
  /** The customer was sent to PayPal's checkout. */
  | "redirected"
  /** The link was unusable - an error page was shown instead. */
  | "rejected";

export const logPayment = createLogger<PaymentOutcome>("payment", {
  redirected: "info",
  rejected: "warn",
});

/**
 * Log context for a rejected link: the raw parameters as they arrived, so a
 * broken sevDesk template is recognisable from the log alone. Takes untrusted
 * input, so nothing about its shape is assumed and unreadable parts are left
 * out.
 */
export function describeLink(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null) return {};
  const { re, betrag } = input as Record<string, unknown>;

  return compact({ re: loggable(re), betrag: loggable(betrag) });
}
