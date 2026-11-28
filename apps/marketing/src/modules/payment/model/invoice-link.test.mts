import assert from "node:assert/strict";
import { test } from "vitest";

import {
  buildPaypalUrl,
  formatPaypalAmount,
  parseInvoiceNumber,
} from "./invoice-link.ts";

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

test("only the number and the amount vary, the recipient stays ours", () => {
  const url = new URL(
    buildPaypalUrl({ invoice: "2026-RE-0007", amount: "1234.56" }),
  );

  assert.equal(url.searchParams.get("invoice"), "2026-RE-0007");
  assert.equal(url.searchParams.get("amount"), "1234.56");
  assert.equal(url.searchParams.get("business"), "rechnung@leonweimann.de");
});

test("reads the invoice number a visitor types, in any case", () => {
  assert.deepEqual(parseInvoiceNumber(" re-1001 "), {
    ok: true,
    invoice: "RE-1001",
  });
  assert.deepEqual(parseInvoiceNumber("RE-1001"), {
    ok: true,
    invoice: "RE-1001",
  });
  assert.deepEqual(parseInvoiceNumber("R".repeat(32)), {
    ok: true,
    invoice: "R".repeat(32),
  });
  // Numbers sevDesk may print differently stay valid.
  for (const re of ["1840", "2026-RE-0007", "RE_1840", "RE.1840"]) {
    assert.deepEqual(parseInvoiceNumber(re), { ok: true, invoice: re });
  }
});

test("rejects an invoice number that cannot be a path segment", () => {
  // The number becomes a path segment of SkillForge's route, so `/` is out.
  for (const re of [
    "RE/1001",
    ["RE-1", "RE-2"],
    "R".repeat(33),
    "-RE-1001",
    "RE 1001",
    "RE%2F1001",
    "../RE-1001",
    "RE-1001?x=1",
    "RE#1001",
    "RE-1001&amount=1",
    "https://evil.example/RE-1001",
    "<script>alert(1)</script>",
  ]) {
    assert.deepEqual(
      parseInvoiceNumber(re),
      { ok: false, reason: "invoice" },
      `expected ${JSON.stringify(re)} to be rejected`,
    );
  }
});

test("reports an absent or empty invoice number as missing", () => {
  for (const re of [undefined, "", "   "]) {
    assert.deepEqual(
      parseInvoiceNumber(re),
      { ok: false, reason: "missing" },
      `expected ${JSON.stringify(re)} to be missing`,
    );
  }
});

test("formats cents in PayPal's notation without float drift", () => {
  const cases: Array<[number, string]> = [
    [2250, "22.50"],
    [9000, "90.00"],
    [1, "0.01"],
    [10, "0.10"],
    [99, "0.99"],
    [123456, "1234.56"],
    [500_000, "5000.00"],
  ];
  for (const [cents, amount] of cases) {
    assert.equal(formatPaypalAmount(cents), amount, `${cents} cents`);
  }
});

test("refuses to format a sum that is not whole cents", () => {
  for (const cents of [-1, 0.5, 22.505, Number.NaN, Infinity]) {
    assert.throws(() => formatPaypalAmount(cents), RangeError, `${cents}`);
  }
});
