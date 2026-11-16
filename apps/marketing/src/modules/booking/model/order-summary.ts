import { bookingEvents, type BookingEventKey } from "./config";
import { isFieldEmpty, isMultiValue, type FieldValue } from "./fields";
import { durationLabel, formatSlotPrice } from "./pricing";

/** Joins the parts of a summary line. */
const SEPARATOR = " · ";

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
 * The chosen labels of the event's summary fields (`inSummary`), in field
 * order; a field left empty is left out.
 */
export function summaryChoices(
  event: BookingEventKey,
  values: Record<string, FieldValue>,
): string[] {
  return bookingEvents[event].fields.flatMap((field) => {
    const value = values[field.key];
    return field.inSummary && value !== undefined && !isFieldEmpty(value)
      ? [chosenLabels(field.options, value)]
      : [];
  });
}

/** The side panel's line under the chosen slot: the summary choices and the length. */
export function slotDetailsLine(
  event: BookingEventKey,
  { choices, duration }: { choices: string[]; duration: number },
): string {
  return [...choices, durationLabel(bookingEvents[event], duration)].join(
    SEPARATOR,
  );
}

/**
 * The order summary in one line right above the submit button: the summary
 * choices, the slot, its length and its price. Length and price come from the
 * helpers the side panel uses; a free event has no price part.
 */
export function orderSummaryLine(
  event: BookingEventKey,
  {
    choices,
    slotLabel,
    duration,
  }: { choices: string[]; slotLabel: string; duration: number },
): string {
  const config = bookingEvents[event];
  return [
    ...choices,
    slotLabel,
    durationLabel(config, duration),
    formatSlotPrice(config, duration),
  ]
    .filter((part): part is string => Boolean(part))
    .join(SEPARATOR);
}
