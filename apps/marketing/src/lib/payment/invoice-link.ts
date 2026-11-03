/**
 * Turns the two values an invoice link carries - invoice number and amount -
 * into a PayPal checkout URL.
 *
 * Pure so the rules are unit-testable, and deliberately the
 * only place that knows the payment destination: recipient, currency and item
 * name are constants here, so a link can never send a customer to another
 * account. Input decides the amount and the reference, nothing else.
 */

/** PayPal's hosted-button endpoint; a plain redirect, no API credentials. */
const PAYPAL_CHECKOUT_URL = "https://www.paypal.com/cgi-bin/webscr";

/** Our billing account - the only possible destination. */
const PAYPAL_RECIPIENT = "rechnung@leonweimann.de";

const PAYMENT_CURRENCY = "EUR";

/** What the customer sees as the line item in PayPal's checkout. */
const PAYMENT_ITEM_NAME = "Online-Nachhilfe";

/** Invoice numbers are short identifiers, never free text or a URL. */
const INVOICE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\-/]{0,31}$/;

/** `90,00 EUR`, `90,00 €`, `90,00` - the currency suffix is optional. */
const CURRENCY_SUFFIX = /\s*(?:EUR|€)$/i;

/**
 * Accepted euro figures. Each alternative pins where the decimal separator is,
 * so an ambiguous `1.234` (German thousands or English decimals?) matches none
 * of them and is rejected rather than guessed.
 */
const AMOUNT_PATTERNS = [
  /^\d{1,3}(?:\.\d{3})+,\d{2}$/, // 1.234,56
  /^\d+,\d{2}$/, // 90,00
  /^\d{1,3}(?:,\d{3})+\.\d{2}$/, // 1,234.56
  /^\d+\.\d{2}$/, // 90.00
  /^\d+$/, // 90
];

/** Plausible bounds for a tutoring invoice, in cents. */
const AMOUNT_LIMITS = { min: 1, max: 500_000 } as const;

export type PaymentRequest = {
  /** Invoice number, used as PayPal's payment reference. */
  invoice: string;
  /** Amount in PayPal's notation, e.g. `90.00`. */
  amount: string;
};

/** Which part of the link was unusable - kept for the log line. */
export type PaymentRejection = "missing" | "invoice" | "amount";

export type ParsedPaymentRequest =
  ({ ok: true } & PaymentRequest) | { ok: false; reason: PaymentRejection };

/** A query parameter as Next hands it over: absent, once, or repeated. */
type QueryValue = string | string[] | undefined;

/**
 * Normalise an amount written for humans into PayPal's `90.00`, or `null` if it
 * is not an unambiguous euro figure within plausible bounds.
 */
function normalizeAmount(rawAmount: string): string | null {
  const figure = rawAmount.trim().replace(CURRENCY_SUFFIX, "");
  if (!AMOUNT_PATTERNS.some((pattern) => pattern.test(figure))) return null;

  // In an accepted figure the last separator is always the decimal one; any
  // earlier separator groups thousands and carries no value.
  const decimalPoint = Math.max(
    figure.lastIndexOf(","),
    figure.lastIndexOf("."),
  );
  const decimal =
    decimalPoint === -1
      ? `${figure}.00`
      : `${figure.slice(0, decimalPoint).replace(/[.,]/g, "")}.${figure.slice(decimalPoint + 1)}`;

  // Rounding to whole cents removes the float error before anything is
  // compared or printed, so the amount can't drift by a cent.
  const cents = Math.round(Number(decimal) * 100);
  if (cents < AMOUNT_LIMITS.min || cents > AMOUNT_LIMITS.max) return null;
  return (cents / 100).toFixed(2);
}

/**
 * Validate the `re` and `betrag` parameters of a payment link. A repeated
 * parameter counts as malformed: guessing which value is meant would put an
 * amount on the wrong invoice.
 */
export function parsePaymentRequest(input: {
  re?: QueryValue;
  betrag?: QueryValue;
}): ParsedPaymentRequest {
  const { re, betrag } = input;
  if (re === undefined || betrag === undefined) {
    return { ok: false, reason: "missing" };
  }

  if (typeof re !== "string") return { ok: false, reason: "invoice" };
  const invoice = re.trim();
  if (!INVOICE_PATTERN.test(invoice)) return { ok: false, reason: "invoice" };

  if (typeof betrag !== "string") return { ok: false, reason: "amount" };
  const amount = normalizeAmount(betrag);
  if (amount === null) return { ok: false, reason: "amount" };

  return { ok: true, invoice, amount };
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
