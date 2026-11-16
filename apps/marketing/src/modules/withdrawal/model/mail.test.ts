import assert from "node:assert/strict";
import { test } from "vitest";

import { legalContact } from "@/content/legal-contact";
import { acknowledgementMail, formatReceivedAt, noticeMail } from "./mail";

// Synthetic data only.
const declaration = {
  name: "Erika Beispiel",
  email: "erika@example.com",
  contract: "Gebuchter Termin am 24.11.2026",
  note: "Zweite Zeile\nder Ergänzung",
};

test("the date and time of receipt is German time, winter and summer", () => {
  assert.equal(
    formatReceivedAt(new Date("2026-11-16T21:41:05Z")),
    "16.11.2026, 22:41:05 MEZ",
  );
  assert.equal(
    formatReceivedAt(new Date("2026-07-01T21:41:05Z")),
    "01.07.2026, 23:41:05 MESZ",
  );
});

test("the acknowledgement carries the whole declaration, its receipt and the provider", () => {
  const mail = acknowledgementMail(declaration, "16.11.2026, 22:41:05 MEZ");
  assert.equal(mail.subject, "Eingangsbestätigung Ihres Widerrufs");
  for (const part of [
    "Eingang: 16.11.2026, 22:41:05 MEZ",
    "Hiermit widerrufe ich den folgenden Vertrag.",
    "Name: Erika Beispiel",
    "E-Mail-Adresse für die Eingangsbestätigung: erika@example.com",
    "Gebuchter Termin am 24.11.2026",
    "Zweite Zeile\nder Ergänzung",
    legalContact.businessName,
    legalContact.street,
    legalContact.city,
    legalContact.email,
  ]) {
    assert.ok(mail.body.includes(part), `missing: ${part}`);
  }
});

test("an empty note is shown as a dash", () => {
  const mail = acknowledgementMail(
    { ...declaration, note: "" },
    "16.11.2026, 22:41:05 MEZ",
  );
  assert.ok(mail.body.includes("Ergänzung:\n–"));
});

test("the notice names the consumer in a one-line subject and carries the same content", () => {
  const notice = noticeMail(
    { ...declaration, name: "Erika\r\nBcc: x@example.com" },
    "16.11.2026, 22:41:05 MEZ",
    "sent",
  );
  assert.equal(notice.subject, "Neuer Widerruf: Erika Bcc: x@example.com");
  assert.ok(notice.body.includes("Eingang: 16.11.2026, 22:41:05 MEZ"));
  assert.ok(notice.body.includes("Gebuchter Termin am 24.11.2026"));
  assert.ok(notice.body.includes("wurde an die angegebene Adresse gesendet"));

  const unsure = noticeMail(declaration, "16.11.2026, 22:41:05 MEZ", "unknown");
  assert.ok(unsure.body.includes("ist unklar"));
});
