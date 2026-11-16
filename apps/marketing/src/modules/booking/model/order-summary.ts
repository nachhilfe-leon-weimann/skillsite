import { bookerText } from "@/content/booking";
import { bookingEvents, type BookingEventKey } from "./config";
import { isFieldEmpty, isMultiValue, type FieldValue } from "./fields";
import { durationLabel, formatSlotPrice } from "./pricing";

/** One line of the order summary: what it names and its value. */
export type OrderSummaryRow = { label: string; value: string };

/** The labels of a field's chosen options, joined; the raw value when none matches. */
function chosenLabels(
  options: { value: string; label: string }[] | undefined,
  value: FieldValue,
): string {
  const chosen = isMultiValue(value) ? value : [value];
  return chosen
    .map(
      (entry) =>
        options?.find((option) => option.value === entry)?.label ?? entry,
    )
    .join(", ");
}

/**
 * The essential terms of a booking as the order summary above the submit
 * button lists them: the summary fields that are filled, the slot, its length
 * and its price. Length and price come from the helpers the side panel uses.
 * A free event has no price row.
 */
export function orderSummaryRows(
  event: BookingEventKey,
  {
    slotLabel,
    duration,
    values,
  }: {
    slotLabel: string;
    duration: number;
    values: Record<string, FieldValue>;
  },
): OrderSummaryRow[] {
  const config = bookingEvents[event];
  const text = bookerText.form.orderSummary;
  const rows: OrderSummaryRow[] = [];

  for (const field of config.fields) {
    const value = values[field.key];
    if (!field.inSummary || value === undefined || isFieldEmpty(value)) {
      continue;
    }
    rows.push({
      label: field.shortLabel ?? field.label,
      value: chosenLabels(field.options, value),
    });
  }

  rows.push({ label: text.slot, value: slotLabel });
  rows.push({
    label: bookerText.durationLabel,
    value: durationLabel(config, duration),
  });
  const price = formatSlotPrice(config, duration);
  if (price) rows.push({ label: text.total, value: price });
  return rows;
}
