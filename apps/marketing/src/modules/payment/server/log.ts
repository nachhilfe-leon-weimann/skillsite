/**
 * Structured payment-link log. Every call of the invoice payment link ends in
 * exactly one outcome line, so the container log always answers "did this
 * customer reach PayPal?":
 *
 *   [payment] redirected {"invoice":"RE-1840","amount":"90.00"}
 *   [payment] unavailable {"invoice":"RE-1840"}
 *   [payment] rejected {"reason":"invoice","re":"RE/1840","betrag":"90,00 EUR"}
 *
 * Privacy: an invoice number and an amount, nothing about the person - the link
 * carries no name, no e-mail and no IP address, and no SkillForge token.
 */

import { compact, createLogger, loggable } from "@/lib/log";

export type PaymentOutcome =
  /** The customer was sent to PayPal's checkout. */
  | "redirected"
  /** SkillForge says the invoice is paid by transfer only. */
  | "blocked"
  /** SkillForge says nothing is left to pay. */
  | "paid"
  /** SkillForge knows no payable invoice under the number. */
  | "not_payable"
  /** SkillForge is unconfigured, unreachable or answered off its contract. */
  | "unavailable"
  /** The link was unusable - an error page was shown instead. */
  | "rejected";

export const logPayment = createLogger<PaymentOutcome>("payment", {
  redirected: "info",
  blocked: "info",
  paid: "info",
  not_payable: "warn",
  unavailable: "error",
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
