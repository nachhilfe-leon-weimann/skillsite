import { bookingEvents, calUsername, type BookingSubmission } from "./config";
import { isFieldEmpty, isMultiValue, type FieldValue } from "./fields";
import { agbEffectiveDate } from "@/content/agb";
import { toE164 } from "./validation";

const asString = (value: FieldValue | undefined): string =>
  value == null ? "" : isMultiValue(value) ? value.join(", ") : value;

/**
 * Build the Cal.com v2 `/bookings` body from a submission, driven entirely by
 * each field's target. Keeping this here means neither the form nor the action
 * knows the Cal wire-format.
 */
export function buildCalBookingBody(
  submission: BookingSubmission,
): Record<string, unknown> {
  const config = bookingEvents[submission.event];
  const { values } = submission;

  const bookingFieldsResponses: Record<string, unknown> = {};
  const attendee: Record<string, unknown> = {
    timeZone: "Europe/Berlin",
    language: "de",
  };
  let firstName = "";
  let lastName = "";
  let location: Record<string, unknown> | undefined;

  for (const field of config.fields) {
    const value = values[field.key];
    switch (field.target.to) {
      case "attendeeName":
        if (field.target.part === "first") firstName = asString(value).trim();
        else lastName = asString(value).trim();
        break;
      case "attendee":
        if (field.target.field === "email") {
          attendee.email = asString(value).trim();
        } else {
          attendee.phoneNumber = toE164(asString(value));
        }
        break;
      case "bookingField":
        // Skip empty optional fields; always send required ones.
        if (!isFieldEmpty(value) || field.required) {
          bookingFieldsResponses[field.target.slug] =
            field.multiple && isMultiValue(value)
              ? value
              : asString(value).trim();
        }
        break;
      case "location":
        location = { type: "integration", integration: asString(value) };
        break;
    }
  }

  attendee.name = `${firstName} ${lastName}`.trim();
  bookingFieldsResponses.name = { firstName, lastName };

  const paidAgreements =
    submission.event === "nachhilfe" && submission.agreements
      ? submission.agreements
      : null;
  if (paidAgreements) {
    bookingFieldsResponses["policies-accepted"] = true;
  }

  const body: Record<string, unknown> = {
    start: submission.slot,
    eventTypeSlug: config.calEventSlug,
    username: calUsername,
    attendee,
    bookingFieldsResponses,
  };
  if (paidAgreements) {
    body.metadata = {
      termsAccepted: String(paidAgreements.termsAccepted),
      earlyPerformanceRequested: String(
        paidAgreements.earlyPerformanceRequested,
      ),
      agbVersion: agbEffectiveDate.toISOString().slice(0, 10),
    };
  }
  if (config.durations && submission.duration) {
    body.lengthInMinutes = submission.duration;
  }
  if (location) body.location = location;
  return body;
}
