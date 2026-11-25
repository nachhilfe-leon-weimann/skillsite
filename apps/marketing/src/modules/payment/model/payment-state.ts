/**
 * Maps SkillForge's answer for one invoice to what `/zahlung` shows. Pure, so
 * every row of the contract table is unit-testable; the call itself lives in
 * `server/lookup.ts`. It fails closed: only an open, PayPal-allowed invoice
 * with a plausible whole-cent amount ever becomes a redirect.
 */
import {
  AMOUNT_LIMITS,
  formatPaypalAmount,
  type PaymentRequest,
} from "./invoice-link";

/** The lookup's outcome, reduced to what the page may use - no personal data. */
export type PaymentLookup =
  | { kind: "open"; amountCents: number; paypal: "allowed" | "blocked" }
  | { kind: "paid" }
  | { kind: "not_payable" }
  | { kind: "unavailable" };

export type PaymentPageState =
  | { kind: "redirect"; request: PaymentRequest }
  | {
      kind: "blocked" | "paid" | "not_payable" | "unavailable";
      invoice: string;
    };

export function toPageState(
  invoice: string,
  lookup: PaymentLookup,
): PaymentPageState {
  if (lookup.kind !== "open") return { kind: lookup.kind, invoice };

  const { amountCents, paypal } = lookup;
  // A negative or fractional sum is off the contract: fail closed.
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    return { kind: "unavailable", invoice };
  }
  // The contract treats an open invoice with nothing left to pay as paid.
  if (amountCents === 0) return { kind: "paid", invoice };
  // Transfer only, whatever the sum: the page never reaches PayPal.
  if (paypal === "blocked") return { kind: "blocked", invoice };
  // Only an explicit `allowed` may reach PayPal; any other flag fails closed.
  if (paypal !== "allowed") return { kind: "unavailable", invoice };
  if (amountCents < AMOUNT_LIMITS.min || amountCents > AMOUNT_LIMITS.max) {
    return { kind: "unavailable", invoice };
  }
  return {
    kind: "redirect",
    request: { invoice, amount: formatPaypalAmount(amountCents) },
  };
}
