import assert from "node:assert/strict";
import { test } from "vitest";

import { buildPaypalUrl, parsePaymentRequest } from "./invoice-link.ts";

/** The shape sevDesk prints on an invoice. */
const SEVDESK = { re: "RE-1840", betrag: "90,00 EUR" };

test("accepts the amount exactly as sevDesk writes it", () => {
  assert.deepEqual(parsePaymentRequest(SEVDESK), {
    ok: true,
    invoice: "RE-1840",
    amount: "90.00",
  });
});

test("accepts the amount spellings an invoice template can produce", () => {
  const accepted: Array<[string, string]> = [
    ["90,00 EUR", "90.00"],
    // German formatting often glues the currency on with a non-breaking space.
    ["90,00 EUR", "90.00"],
    ["90,00EUR", "90.00"],
    ["90,00 eur", "90.00"],
    ["90,00 €", "90.00"],
    ["90,00", "90.00"],
    ["90.00 EUR", "90.00"],
    ["1.234,56 EUR", "1234.56"],
    ["1,234.56 EUR", "1234.56"],
    ["90 EUR", "90.00"],
    ["  90,00 EUR  ", "90.00"],
    ["0,01 EUR", "0.01"],
    ["5000,00 EUR", "5000.00"],
  ];

  for (const [betrag, amount] of accepted) {
    assert.deepEqual(
      parsePaymentRequest({ ...SEVDESK, betrag }),
      { ok: true, invoice: "RE-1840", amount },
      `expected ${betrag} to parse as ${amount}`,
    );
  }
});

test("rejects an amount that is not an unambiguous euro figure", () => {
  const rejected = [
    // Ambiguous: German thousands or English decimals? Never guess money.
    "1.234",
    "1,234",
    "90,000",
    "90,0",
    "90,005",
    "0,00",
    "-90,00",
    "+90,00",
    "5000,01",
    "9e3",
    "0x5a",
    "90,00 USD",
    "90,00 CHF",
    "neunzig",
    "",
    "   ",
    "90,00 EUR; rm -rf /",
    "90,00 EUR EUR",
    "EUR 90,00",
    "90,00 EUR<script>",
  ];

  for (const betrag of rejected) {
    assert.deepEqual(
      parsePaymentRequest({ ...SEVDESK, betrag }),
      { ok: false, reason: "amount" },
      `expected ${JSON.stringify(betrag)} to be rejected`,
    );
  }
});

test("rejects an invoice number that is not an invoice number", () => {
  const rejected = [
    "",
    "   ",
    "-RE-1840",
    "RE 1840",
    "RE#1840",
    "RE-1840?x=1",
    "https://evil.example/RE-1840",
    "RE-1840&amount=1",
    "<script>alert(1)</script>",
    "R".repeat(33),
  ];

  for (const re of rejected) {
    assert.deepEqual(
      parsePaymentRequest({ ...SEVDESK, re }),
      { ok: false, reason: "invoice" },
      `expected ${JSON.stringify(re)} to be rejected`,
    );
  }
});

test("accepts invoice numbers sevDesk may number differently", () => {
  for (const re of ["RE-1840", "1840", "2026-RE-0007", "RE_1840", "RE.1840"]) {
    const result = parsePaymentRequest({ ...SEVDESK, re });
    assert.equal(result.ok, true, `expected ${re} to be accepted`);
    assert.equal(result.ok && result.invoice, re);
  }
});

test("reports a missing parameter apart from a malformed one", () => {
  const missing = { ok: false, reason: "missing" } as const;

  assert.deepEqual(parsePaymentRequest({}), missing);
  assert.deepEqual(parsePaymentRequest({ re: "RE-1840" }), missing);
  assert.deepEqual(parsePaymentRequest({ betrag: "90,00 EUR" }), missing);
  assert.deepEqual(
    parsePaymentRequest({ re: undefined, betrag: undefined }),
    missing,
  );
});

test("rejects a repeated parameter instead of picking one", () => {
  // `?re=RE-1840&re=RE-1841` arrives as an array; guessing which one is meant
  // would put an amount on the wrong invoice.
  assert.deepEqual(
    parsePaymentRequest({ re: ["RE-1840", "RE-1841"], betrag: "90,00 EUR" }),
    { ok: false, reason: "invoice" },
  );
  assert.deepEqual(
    parsePaymentRequest({ re: "RE-1840", betrag: ["90,00 EUR", "10,00 EUR"] }),
    { ok: false, reason: "amount" },
  );
});

test("reads the link the way a browser hands it over", () => {
  // Guards the decoding contract the sevDesk template actually produces:
  // a percent-encoded comma, a space as %20, +, or a non-breaking space.
  for (const query of [
    "?re=RE-1840&betrag=90%2C00%20EUR",
    "?re=RE-1840&betrag=90,00+EUR",
    "?re=RE-1840&betrag=90%2C00%C2%A0EUR",
  ]) {
    const params = new URL(`https://nachhilfe.leonweimann.de/zahlung${query}`)
      .searchParams;

    assert.deepEqual(
      parsePaymentRequest(Object.fromEntries(params)),
      { ok: true, invoice: "RE-1840", amount: "90.00" },
      `expected ${query} to reach PayPal`,
    );
  }
});

test("builds the checkout link against our own PayPal account", () => {
  const url = new URL(buildPaypalUrl({ invoice: "RE-1840", amount: "90.00" }));

  assert.equal(url.origin, "https://www.paypal.com");
  assert.equal(url.pathname, "/cgi-bin/webscr");
  assert.equal(url.searchParams.get("cmd"), "_xclick");
  assert.equal(url.searchParams.get("business"), "rechnung@leonweimann.de");
  assert.equal(url.searchParams.get("currency_code"), "EUR");
  assert.equal(url.searchParams.get("amount"), "90.00");
  assert.equal(url.searchParams.get("invoice"), "RE-1840");
  assert.equal(url.searchParams.get("item_name"), "Online-Nachhilfe");
  assert.equal(url.searchParams.get("no_shipping"), "1");
  assert.equal(url.searchParams.get("no_note"), "1");
});

test("the invoice number is the only part of the link input controls", () => {
  const url = new URL(
    buildPaypalUrl({ invoice: "2026-RE-0007", amount: "1234.56" }),
  );

  assert.equal(url.searchParams.get("invoice"), "2026-RE-0007");
  assert.equal(url.searchParams.get("amount"), "1234.56");
  assert.equal(url.searchParams.get("business"), "rechnung@leonweimann.de");
});
