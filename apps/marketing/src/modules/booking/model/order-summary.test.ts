import assert from "node:assert/strict";
import { test } from "vitest";

import { orderSummaryRows } from "./order-summary";

const slotLabel = "Mi., 25. November – 10:00 Uhr";

test("the order summary names the subject, the slot, its length and the total price", () => {
  assert.deepEqual(
    orderSummaryRows("nachhilfe", {
      slotLabel,
      duration: 90,
      values: { subject: "Physik", location: "discord-video" },
    }),
    [
      { label: "Fach", value: "Physik" },
      { label: "Termin", value: slotLabel },
      { label: "Dauer", value: "90 Minuten" },
      { label: "Gesamtpreis", value: "45,00 €" },
    ],
  );
});

test("a subject not yet chosen is left out of the order summary", () => {
  const rows = orderSummaryRows("nachhilfe", {
    slotLabel,
    duration: 45,
    values: { subject: "" },
  });
  assert.deepEqual(
    rows.map((row) => row.label),
    ["Termin", "Dauer", "Gesamtpreis"],
  );
  assert.equal(rows.at(-1)?.value, "22,50 €");
});
