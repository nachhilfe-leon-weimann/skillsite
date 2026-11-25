/**
 * Structured payment-link log. Every call of the invoice payment link ends in
 * exactly one outcome line, so the container log always answers "did this
 * customer reach PayPal?":
 *
 *   [payment] redirected {"invoice":"RE-1840","amount":"90.00"}
 *   [payment] unavailable {"invoice":"RE-1840"}
 *   [payment] rejected {"reason":"invoice","length":7,"link":true}
 *
 * Privacy: an invoice number and an amount, nothing about the person - no
 * name, no e-mail, no IP address and no SkillForge token. A rejected number is
 * whatever a visitor typed into the field, so it is never logged, only its
 * shape.
 */

import { createLogger } from "@/lib/log";

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
 * Log context for a rejected number: its shape, never its text. `re` may be
 * anything a visitor typed - a name, an e-mail address, an IBAN - so only its
 * length is kept (0 unless it arrived once, as a string). `link` marks a
 * request that carried `betrag`, which only our invoice links do: a run of
 * those points at a broken sevDesk template. Takes untrusted input, so nothing
 * about its shape is assumed.
 */
export function describeRejectedLink(input: unknown): {
  length: number;
  link: boolean;
} {
  if (typeof input !== "object" || input === null) {
    return { length: 0, link: false };
  }
  const { re, betrag } = input as Record<string, unknown>;

  return {
    length: typeof re === "string" ? re.length : 0,
    link: betrag !== undefined,
  };
}
