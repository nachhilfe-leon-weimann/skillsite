/**
 * Reads the invoice number of a payment link and builds the PayPal checkout
 * URL for an invoice SkillForge confirmed.
 *
 * Pure so the rules are unit-testable, and deliberately the
 * only place that knows the payment destination: recipient, currency and item
 * name are constants here, so a link can never send a customer to another
 * account. The number and SkillForge's open amount decide the reference and
 * the sum, nothing else; an amount in the link (`betrag`) is never read.
 */

/** PayPal's hosted-button endpoint; a plain redirect, no API credentials. */
const PAYPAL_CHECKOUT_URL = "https://www.paypal.com/cgi-bin/webscr";

/** Our billing account - the only possible destination. */
const PAYPAL_RECIPIENT = "rechnung@leonweimann.de";

const PAYMENT_CURRENCY = "EUR";

/** What the customer sees as the line item in PayPal's checkout. */
const PAYMENT_ITEM_NAME = "Online-Nachhilfe";

/**
 * An invoice number to look up. Upper-case and without `/`: it becomes a path
 * segment of SkillForge's payment route, and sevDesk numbers read `RE-%NUMBER`.
 */
const LOOKUP_INVOICE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,31}$/;

/** Plausible bounds for a tutoring invoice, in cents. */
export const AMOUNT_LIMITS = { min: 1, max: 500_000 } as const;

export type PaymentRequest = {
  /** Invoice number, used as PayPal's payment reference. */
  invoice: string;
  /** Amount in PayPal's notation, e.g. `90.00`. */
  amount: string;
};

/** A query parameter as Next hands it over: absent, once, or repeated. */
type QueryValue = string | string[] | undefined;

export type InvoiceNumberResult =
  { ok: true; invoice: string } | { ok: false; reason: "missing" | "invoice" };

/**
 * PayPal's notation for a sum of whole cents: `2250` -> `22.50`. Integer
 * arithmetic only, so no float error can move the amount by a cent; anything
 * but a non-negative whole number of cents is a programming error.
 */
export function formatPaypalAmount(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError(`not a whole, non-negative number of cents: ${cents}`);
  }
  const euros = Math.trunc(cents / 100);
  const rest = cents % 100;
  return `${euros}.${String(rest).padStart(2, "0")}`;
}

/**
 * Validate the `re` parameter of `/zahlung`: trimmed and upper-cased, as a
 * visitor may type `re-1001`. A repeated parameter is malformed - guessing
 * which number is meant could show another invoice's state.
 */
export function parseInvoiceNumber(re: QueryValue): InvoiceNumberResult {
  if (re === undefined) return { ok: false, reason: "missing" };
  if (typeof re !== "string") return { ok: false, reason: "invoice" };

  const invoice = re.trim().toUpperCase();
  if (invoice === "") return { ok: false, reason: "missing" };
  if (!LOOKUP_INVOICE_PATTERN.test(invoice)) {
    return { ok: false, reason: "invoice" };
  }
  return { ok: true, invoice };
}

/** The checkout URL for a validated request - always our own account. */
export function buildPaypalUrl({ invoice, amount }: PaymentRequest): string {
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_RECIPIENT,
    currency_code: PAYMENT_CURRENCY,
    amount,
    invoice,
    item_name: PAYMENT_ITEM_NAME,
    // The customer pays an invoice; no address and no message needed.
    no_shipping: "1",
    no_note: "1",
  });
  return `${PAYPAL_CHECKOUT_URL}?${params}`;
}
