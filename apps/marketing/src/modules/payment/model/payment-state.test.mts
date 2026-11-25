import assert from "node:assert/strict";
import { test } from "vitest";

import { toPageState, type PaymentLookup } from "./payment-state.ts";

const INVOICE = "RE-1001";

test("an open invoice PayPal may take redirects with the open amount", () => {
  assert.deepEqual(
    toPageState(INVOICE, {
      kind: "open",
      amountCents: 2250,
      paypal: "allowed",
    }),
    { kind: "redirect", request: { invoice: INVOICE, amount: "22.50" } },
  );
});

test("an open invoice paid by transfer only never redirects", () => {
  assert.deepEqual(
    toPageState(INVOICE, {
      kind: "open",
      amountCents: 2250,
      paypal: "blocked",
    }),
    { kind: "blocked", invoice: INVOICE },
  );
});

test("an open invoice with nothing left to pay is paid", () => {
  for (const paypal of ["allowed", "blocked"] as const) {
    assert.deepEqual(
      toPageState(INVOICE, { kind: "open", amountCents: 0, paypal }),
      { kind: "paid", invoice: INVOICE },
    );
  }
});

test("an amount PayPal must not be asked for is unavailable", () => {
  // Above AMOUNT_LIMITS.max, negative, or not whole cents: off the contract,
  // so the page fails closed instead of redirecting.
  for (const amountCents of [500_001, -1, 22.5, Number.NaN]) {
    assert.deepEqual(
      toPageState(INVOICE, { kind: "open", amountCents, paypal: "allowed" }),
      { kind: "unavailable", invoice: INVOICE },
      `expected ${amountCents} cents to be unavailable`,
    );
  }
});

test("the bounds themselves still redirect", () => {
  for (const [amountCents, amount] of [
    [1, "0.01"],
    [500_000, "5000.00"],
  ] as const) {
    assert.deepEqual(
      toPageState(INVOICE, { kind: "open", amountCents, paypal: "allowed" }),
      { kind: "redirect", request: { invoice: INVOICE, amount } },
    );
  }
});

test("paid, not payable and unavailable keep their kind with the invoice", () => {
  for (const kind of ["paid", "not_payable", "unavailable"] as const) {
    assert.deepEqual(toPageState(INVOICE, { kind }), {
      kind,
      invoice: INVOICE,
    });
  }
});

test("an open invoice whose PayPal flag is neither value never redirects", () => {
  // The gate in front of PayPal must fail closed if the contract grows a value
  // or a body slips through untyped: only `allowed` may redirect.
  for (const paypal of [undefined, "ALLOWED", "review", ""]) {
    const lookup = {
      kind: "open",
      amountCents: 2250,
      paypal,
    } as unknown as PaymentLookup;
    assert.deepEqual(
      toPageState(INVOICE, lookup),
      { kind: "unavailable", invoice: INVOICE },
      `expected paypal ${JSON.stringify(paypal)} to be unavailable`,
    );
  }
});
