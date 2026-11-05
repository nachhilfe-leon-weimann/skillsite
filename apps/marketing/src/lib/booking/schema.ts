import { z } from "zod/mini";

import {
  bookingEvents,
  startsWithinWithdrawalPeriod,
  type BookingEventKey,
  type BookingSubmission,
} from "@/lib/booking/config";
import { EMAIL_RE, PHONE_RE, type FieldDef } from "@/lib/booking/fields";

/**
 * The booking validation as zod schemas, derived from the field declarations in
 * `config.ts`. One source for both sides: the form validates live through
 * `validateBookingValues`, the server action re-runs the same rules through
 * `checkBookingSubmission` before anything reaches Cal.com. `zod/mini`, as
 * these schemas ship to the browser with the form.
 */

/**
 * A submission whose shape no form produces: `values` missing, or a field value
 * that is neither text nor a selection. The action answers it with its generic
 * failure. The message names the shape, never a submitted value.
 */
export class MalformedSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MalformedSubmissionError";
  }
}

const FORMATS: Record<NonNullable<FieldDef["format"]>, RegExp> = {
  email: EMAIL_RE,
  phone: PHONE_RE,
};

/** Hands `schema` what `prepare` makes of the raw input. */
const preprocess = <Schema extends z.ZodMiniType>(
  prepare: (value: unknown) => unknown,
  schema: Schema,
) => z.pipe(z.transform(prepare), schema);

/** Text and selections are the only value shapes a form produces. */
function assertValueShape(field: FieldDef) {
  return (value: unknown) => {
    if (value == null || typeof value === "string" || Array.isArray(value)) {
      return value;
    }
    throw new MalformedSubmissionError(
      `Field ${field.key} holds a ${typeof value}, not text or a selection.`,
    );
  };
}

/**
 * The rules of one field. Empty is a missing value, a blank string or an empty
 * selection; it passes only on an optional field. A filled value is text or a
 * selection either way: `maxLength` bounds the raw text, `format` checks the
 * trimmed text (a selection never matches a format), and `options` is the
 * whitelist every selected entry must be part of - arbitrary values never reach
 * Cal.com.
 */
export function fieldValueSchema(field: FieldDef) {
  const offered = field.options
    ? new Set(field.options.map((option) => option.value))
    : null;
  const isOffered = (entry: unknown) =>
    offered === null || offered.has(entry as string);

  const empty = z.union([
    z.null(),
    z.undefined(),
    z.string().check(z.refine((value) => value.trim() === "")),
    z.array(z.unknown()).check(z.length(0)),
  ]);

  const textChecks: z.core.$ZodCheck<string>[] = [
    z.refine((value: string) => value.trim() !== ""),
  ];
  if (field.maxLength) textChecks.push(z.maxLength(field.maxLength));
  if (field.format) {
    const format = FORMATS[field.format];
    textChecks.push(z.refine((value: string) => format.test(value.trim())));
  }
  textChecks.push(z.refine(isOffered));
  const text = z.string().check(...textChecks);

  const selection = z.array(field.options ? z.string() : z.unknown()).check(
    z.minLength(1),
    z.refine(() => !field.format),
    z.refine((entries) => entries.every(isOffered)),
  );

  const filled = z.union([text, selection]);
  return preprocess(
    assertValueShape(field),
    field.required ? filled : z.union([empty, filled]),
  );
}

/** Reads every declared field, as the form state holds them; other keys are ignored. */
function declaredValues(fields: FieldDef[]) {
  return (values: unknown) => {
    if (values == null) {
      throw new MalformedSubmissionError("The submission carries no values.");
    }
    const source = values as Record<string, unknown>;
    return Object.fromEntries(
      fields.map((field) => [field.key, source[field.key]]),
    );
  };
}

function valuesSchemaFor(event: BookingEventKey) {
  const { fields } = bookingEvents[event];
  return preprocess(
    declaredValues(fields),
    z.object(
      Object.fromEntries(
        fields.map((field) => [field.key, fieldValueSchema(field)]),
      ),
    ),
  );
}

const valuesSchemas = {
  kennenlernen: valuesSchemaFor("kennenlernen"),
  nachhilfe: valuesSchemaFor("nachhilfe"),
} satisfies Record<BookingEventKey, unknown>;

/** The values of one event's form, keyed by `FieldDef.key`. */
export function bookingValuesSchema(event: BookingEventKey) {
  return valuesSchemas[event];
}

/** Labels of the invalid fields, in declaration order (`shortLabel ?? label`). */
function fieldLabels(event: BookingEventKey, invalid: ReadonlySet<unknown>) {
  return bookingEvents[event].fields
    .filter((field) => invalid.has(field.key))
    .map((field) => field.shortLabel ?? field.label);
}

/**
 * Labels of the fields that are missing or invalid - an empty array means valid.
 * Throws `MalformedSubmissionError` for a shape no form produces.
 */
export function invalidFieldLabels(
  event: BookingEventKey,
  values: unknown,
): string[] {
  const result = bookingValuesSchema(event).safeParse(values);
  if (result.success) return [];
  return fieldLabels(
    event,
    new Set(result.error.issues.map((issue) => issue.path[0])),
  );
}

/** The legal confirmations, read as truthy flags whatever was sent. */
const agreementsSchema = preprocess(
  (agreements) => {
    const flags = agreements as
      | { termsAccepted?: unknown; earlyPerformanceRequested?: unknown }
      | null
      | undefined;
    return {
      termsAccepted: Boolean(flags?.termsAccepted),
      earlyPerformanceRequested: Boolean(flags?.earlyPerformanceRequested),
    };
  },
  z.object({
    termsAccepted: z.boolean(),
    earlyPerformanceRequested: z.boolean(),
  }),
);

/**
 * What the server action checks before a submission may reach Cal.com, in its
 * order: an offered event with a chosen slot, then the event's fields, then the
 * terms for a paid lesson. The withdrawal notice depends on the clock, so
 * `checkBookingSubmission` adds it. Everything else (`duration`, the anti-spam
 * fields, unknown keys) passes through untouched.
 */
export const bookingSubmissionSchema = z
  .looseObject({
    event: z.custom<BookingEventKey>((event) =>
      Object.hasOwn(bookingEvents, event as PropertyKey),
    ),
    slot: z.custom<string>((slot) => Boolean(slot)),
    agreements: agreementsSchema,
  })
  // Checks run only once event and slot passed, so the event's fields are known.
  .check(
    z.superRefine((submission, ctx) => {
      const values = bookingValuesSchema(submission.event).safeParse(
        submission.values,
      );
      if (values.success) return;
      for (const issue of values.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: ["values", ...issue.path],
          message: issue.message,
        });
      }
    }),
    z.superRefine((submission, ctx) => {
      if (
        submission.event === "nachhilfe" &&
        !submission.agreements.termsAccepted
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["agreements", "termsAccepted"],
          message: "A paid lesson needs the accepted terms.",
        });
      }
    }),
  );

/** Why the action turns a submission down, as its log line's `check` names it. */
export type BookingIssue =
  | { check: "slot" }
  | { check: "fields"; fields: string[] }
  | { check: "terms" }
  | { check: "withdrawal_notice" };

/**
 * The first reason to turn a submission down, or `null` when it may go to
 * Cal.com. Throws `MalformedSubmissionError` for a shape no form produces.
 */
export function checkBookingSubmission(
  submission: BookingSubmission,
  now: number = Date.now(),
): BookingIssue | null {
  const result = bookingSubmissionSchema.safeParse(submission);

  if (!result.success) {
    const { issues } = result.error;
    switch (issues[0]?.path[0]) {
      case "values":
        return {
          check: "fields",
          fields: fieldLabels(
            submission.event,
            new Set(
              issues
                .filter((issue) => issue.path[0] === "values")
                .map((issue) => issue.path[1]),
            ),
          ),
        };
      case "agreements":
        return { check: "terms" };
      default:
        return { check: "slot" };
    }
  }

  const { event, slot, agreements } = result.data;
  if (
    event === "nachhilfe" &&
    startsWithinWithdrawalPeriod(slot, now) &&
    !agreements.earlyPerformanceRequested
  ) {
    return { check: "withdrawal_notice" };
  }
  return null;
}
