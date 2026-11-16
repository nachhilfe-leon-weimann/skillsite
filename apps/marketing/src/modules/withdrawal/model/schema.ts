import * as z from "zod/mini";

import {
  withdrawalFields,
  type WithdrawalDeclaration,
  type WithdrawalFieldDef,
  type WithdrawalFieldKey,
} from "./config";
import { multiLine, singleLine } from "./text";

/**
 * The withdrawal validation as zod schemas, derived from the field
 * declarations in `config.ts`. One source for both sides: the form validates
 * before its review step, the server action re-runs the same rules before
 * anything is sent. `zod/mini`, as these schemas ship to the browser.
 */

/** The `email` format: one `@`, a dot in the domain, no whitespace. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A name is no address: nothing that a mail client turns into a link. */
const LINK_LIKE = /:\/\/|www\.|https?:/i;

function fieldSchema(field: WithdrawalFieldDef) {
  const clean = field.kind === "textarea" ? multiLine : singleLine;
  const checks: z.core.$ZodCheck<string>[] = [z.maxLength(field.maxLength)];
  if (field.required) checks.push(z.minLength(1));
  if (field.kind === "email") {
    checks.push(z.refine((value: string) => EMAIL_RE.test(value)));
  }
  if (field.key === "name") {
    checks.push(z.refine((value: string) => !LINK_LIKE.test(value)));
  }
  return z.pipe(
    z.transform((value: unknown) => {
      if (typeof value === "string") return clean(value);
      // An absent optional field is empty; any other shape fails below.
      return !field.required && value == null ? "" : value;
    }),
    z.string().check(...checks),
  );
}

/** The form's values, cleaned (`text.ts`) and checked; unknown keys are dropped. */
export const withdrawalValuesSchema = z.object(
  Object.fromEntries(
    withdrawalFields.map((field) => [field.key, fieldSchema(field)]),
  ) as Record<WithdrawalFieldKey, ReturnType<typeof fieldSchema>>,
);

export type WithdrawalCheck =
  | { ok: true; declaration: WithdrawalDeclaration }
  | { ok: false; fields: WithdrawalFieldKey[] };

const fieldKeys = new Set<unknown>(withdrawalFields.map((field) => field.key));

/**
 * Check untrusted values: the cleaned declaration, or the fields to correct in
 * form order. Never throws; a value of the wrong shape is an invalid field.
 */
export function checkWithdrawalValues(values: unknown): WithdrawalCheck {
  const result = withdrawalValuesSchema.safeParse(
    typeof values === "object" && values !== null ? values : {},
  );
  if (result.success) return { ok: true, declaration: result.data };
  const invalid = new Set(
    result.error.issues
      .map((issue) => issue.path[0])
      .filter((key) => fieldKeys.has(key)),
  );
  return {
    ok: false,
    fields: withdrawalFields
      .map((field) => field.key)
      .filter((key) => invalid.has(key)),
  };
}
