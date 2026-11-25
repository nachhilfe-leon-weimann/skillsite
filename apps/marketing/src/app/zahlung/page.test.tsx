import { cleanup, render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { PaymentLookup } from "@/modules/payment";
import { logPayment, lookupInvoice } from "@/modules/payment/server";

import PaymentPage, { dynamic } from "./page";

vi.mock("next/navigation", () => ({
  // Like Next's own `redirect`, it ends the render by throwing.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

// No SkillForge here: the lookup is stubbed, the log line is recorded.
vi.mock("@/modules/payment/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/payment/server")>()),
  lookupInvoice: vi.fn(),
  logPayment: vi.fn(),
}));

const OPEN: PaymentLookup = {
  kind: "open",
  amountCents: 2250,
  paypal: "allowed",
};

beforeEach(() => {
  vi.mocked(lookupInvoice).mockReset();
  vi.mocked(logPayment).mockReset();
  vi.mocked(redirect).mockClear();
});
afterEach(cleanup);

function requestPage(params: Record<string, string | string[]>) {
  return PaymentPage({ searchParams: Promise.resolve(params) });
}

async function renderPage(params: Record<string, string | string[]>) {
  render(await requestPage(params));
}

/** The PayPal URL the page redirected to, after it threw like Next does. */
async function redirectedTo(params: Record<string, string | string[]>) {
  await expect(requestPage(params)).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledTimes(1);
  return new URL(vi.mocked(redirect).mock.calls[0]![0]);
}

function title() {
  return screen.getByRole("heading", { level: 1 }).textContent;
}

function expectContactWays() {
  expect(
    screen.getByRole("link", { name: "E-Mail schreiben" }).getAttribute("href"),
  ).toBe("mailto:nachhilfe@leonweimann.de");
  expect(
    screen.getByRole("link", { name: "Über WhatsApp melden" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Alle Kontaktwege" }).getAttribute("href"),
  ).toBe("/kontakt");
}

test("the page is rendered per request, never from a cache", () => {
  expect(dynamic).toBe("force-dynamic");
});

test("without an invoice number, the page asks for one", async () => {
  await renderPage({});

  expect(title()).toBe("Rechnung online bezahlen");
  expect(screen.getByText("Gib deine Rechnungsnummer ein.")).toBeTruthy();
  expect(
    screen.getByRole("textbox", { name: "Rechnungsnummer" }).closest("form"),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Weiter zu PayPal" })).toBeTruthy();
  expect(lookupInvoice).not.toHaveBeenCalled();
  // Not a payment request yet: no outcome to log.
  expect(logPayment).not.toHaveBeenCalled();
});

test("an empty invoice number shows the field again", async () => {
  await renderPage({ re: "  " });

  expect(title()).toBe("Rechnung online bezahlen");
  expect(lookupInvoice).not.toHaveBeenCalled();
});

test("a malformed number keeps today's page and logs `rejected`", async () => {
  await renderPage({ re: "RE/1840", betrag: "90,00 EUR" });

  expect(title()).toBe("Dieser Zahlungslink führt nicht weiter.");
  expect(
    screen.getByText(
      "Vermutlich ist der Link aus der Rechnung unterwegs abgeschnitten worden. Schreib mir kurz mit deiner Rechnungsnummer – du bekommst sofort einen neuen Link.",
    ),
  ).toBeTruthy();
  expectContactWays();
  expect(lookupInvoice).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledTimes(1);
  expect(logPayment).toHaveBeenCalledWith("rejected", {
    reason: "invoice",
    re: "RE/1840",
    betrag: "90,00 EUR",
  });
});

test("a repeated number is malformed, not guessed", async () => {
  await renderPage({ re: ["RE-1001", "RE-1002"] });

  expect(title()).toBe("Dieser Zahlungslink führt nicht weiter.");
  expect(lookupInvoice).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledWith("rejected", { reason: "invoice" });
});

test("an open invoice goes to PayPal with SkillForge's amount", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue(OPEN);

  const url = await redirectedTo({ re: " re-1001 " });

  expect(lookupInvoice).toHaveBeenCalledWith("RE-1001");
  expect(url.origin + url.pathname).toBe(
    "https://www.paypal.com/cgi-bin/webscr",
  );
  expect(url.searchParams.get("amount")).toBe("22.50");
  expect(url.searchParams.get("invoice")).toBe("RE-1001");
  expect(logPayment).toHaveBeenCalledTimes(1);
  expect(logPayment).toHaveBeenCalledWith("redirected", {
    invoice: "RE-1001",
    amount: "22.50",
  });
  // The line is written before `redirect` ends the render.
  expect(vi.mocked(logPayment).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(redirect).mock.invocationCallOrder[0]!,
  );
});

test("`betrag` in an old link changes nothing", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue(OPEN);
  const without = await redirectedTo({ re: "RE-1001" });

  for (const betrag of ["999", "90,00 EUR", "abc"]) {
    vi.mocked(redirect).mockClear();
    const withAmount = await redirectedTo({ re: "RE-1001", betrag });
    expect(withAmount.href).toBe(without.href);
  }
  expect(lookupInvoice).toHaveBeenCalledTimes(4);
  for (const [invoice] of vi.mocked(lookupInvoice).mock.calls) {
    expect(invoice).toBe("RE-1001");
  }
});

test("a blocked customer is asked to pay by transfer", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue({
    kind: "open",
    amountCents: 2250,
    paypal: "blocked",
  });

  await renderPage({ re: "RE-1002" });

  expect(title()).toBe("Bitte per Überweisung zahlen.");
  expect(
    screen.getByText(
      "Nutze den GiroCode oder die Bankdaten auf der Rechnung, Verwendungszweck: RE-1002.",
    ),
  ).toBeTruthy();
  expectContactWays();
  expect(redirect).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledTimes(1);
  expect(logPayment).toHaveBeenCalledWith("blocked", { invoice: "RE-1002" });
});

test("a paid invoice says so, without a lead", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue({ kind: "paid" });

  await renderPage({ re: "RE-1003" });

  expect(title()).toBe("Diese Rechnung ist schon bezahlt. Danke!");
  expect(document.querySelector(".text-lead")).toBeNull();
  expectContactWays();
  expect(redirect).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledTimes(1);
  expect(logPayment).toHaveBeenCalledWith("paid", { invoice: "RE-1003" });
});

test("an unknown invoice offers the field again, before the contact ways", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue({ kind: "not_payable" });

  await renderPage({ re: "RE-1004" });

  expect(title()).toBe("Diese Rechnung finde ich nicht.");
  expect(
    screen.getByText(
      "Prüf die Nummer auf deiner Rechnung oder schreib mir kurz.",
    ),
  ).toBeTruthy();
  expectContactWays();
  const field = screen.getByRole("textbox", { name: "Rechnungsnummer" });
  const eMail = screen.getByRole("link", { name: "E-Mail schreiben" });
  expect(
    field.compareDocumentPosition(eMail) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(redirect).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledTimes(1);
  expect(logPayment).toHaveBeenCalledWith("not_payable", {
    invoice: "RE-1004",
  });
});

test("an unreachable SkillForge never redirects", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue({ kind: "unavailable" });

  await renderPage({ re: "RE-1005" });

  expect(title()).toBe("Die Zahlung ist gerade nicht erreichbar.");
  expect(
    screen.getByText(
      "Versuch es gleich noch einmal oder überweise mit dem GiroCode auf deiner Rechnung.",
    ),
  ).toBeTruthy();
  expectContactWays();
  expect(redirect).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledTimes(1);
  expect(logPayment).toHaveBeenCalledWith("unavailable", {
    invoice: "RE-1005",
  });
});

test("an open amount off the contract fails closed", async () => {
  vi.mocked(lookupInvoice).mockResolvedValue({
    kind: "open",
    amountCents: 22.5,
    paypal: "allowed",
  });

  await renderPage({ re: "RE-1001" });

  expect(title()).toBe("Die Zahlung ist gerade nicht erreichbar.");
  expect(redirect).not.toHaveBeenCalled();
  expect(logPayment).toHaveBeenCalledWith("unavailable", {
    invoice: "RE-1001",
  });
});
