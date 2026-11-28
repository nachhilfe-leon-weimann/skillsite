import assert from "node:assert/strict";
import { test } from "vitest";

import {
  orderSummaryLine,
  slotDetailsLine,
  summaryChoices,
} from "./order-summary";

const slotLabel = "Mi., 25. November – 10:00 Uhr";

test("the summary choices are the chosen subject's label, nothing else", () => {
  assert.deepEqual(
    summaryChoices("nachhilfe", {
      firstName: "Testa",
      subject: "Physik",
      location: "discord-video",
    }),
    ["Physik"],
  );
  assert.deepEqual(summaryChoices("nachhilfe", { subject: "" }), []);
});

test("the order summary line names the subject, the slot, its length and the total price", () => {
  assert.equal(
    orderSummaryLine("nachhilfe", {
      choices: ["Physik"],
      slotLabel,
      duration: 90,
    }),
    `Physik · ${slotLabel} · 90 Minuten · 45,00\u00a0€`,
  );
});

test("a subject not yet chosen is left out of the order summary line", () => {
  assert.equal(
    orderSummaryLine("nachhilfe", { choices: [], slotLabel, duration: 45 }),
    `${slotLabel} · 45 Minuten · 22,50\u00a0€`,
  );
});

test("the side panel's slot line names the choices and the length", () => {
  assert.equal(
    slotDetailsLine("nachhilfe", { choices: ["Physik"], duration: 60 }),
    "Physik · 60 Minuten",
  );
  assert.equal(
    slotDetailsLine("nachhilfe", { choices: [], duration: 45 }),
    "45 Minuten",
  );
});
