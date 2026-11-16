"use client";

import type { Ref } from "react";

import { Field, Input, Textarea } from "@skillsite/ui/forms/field";
import { Button } from "@skillsite/ui/primitives/button";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { withdrawalText } from "@/content/withdrawal";
import {
  withdrawalFields,
  type WithdrawalFieldKey,
  type WithdrawalValues,
} from "../model/config";

const fieldId = (key: WithdrawalFieldKey) => `withdrawal-${key}`;

type WithdrawalEditProps = {
  values: WithdrawalValues;
  onChange: (key: WithdrawalFieldKey, value: string) => void;
  honeypot: string;
  onHoneypotChange: (value: string) => void;
  /** Fields to correct; empty until the visitor tried to go on. */
  invalidFields: readonly WithdrawalFieldKey[];
  titleRef?: Ref<HTMLHeadingElement>;
  /** Go on to the review; returns the fields still to correct. */
  onSubmit: () => WithdrawalFieldKey[];
};

/** Step 1: the declaration's details, declared once in `withdrawalFields`. */
export function WithdrawalEdit({
  values,
  onChange,
  honeypot,
  onHoneypotChange,
  invalidFields,
  titleRef,
  onSubmit,
}: WithdrawalEditProps) {
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const [firstInvalid] = onSubmit();
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Heading
        as="h3"
        size="h4"
        ref={titleRef}
        tabIndex={-1}
        className="outline-none"
      >
        {withdrawalText.formTitle}
      </Heading>

      {/* Honeypot: off-screen, invisible to humans; bots fill it and the
          withdrawal is refused visibly. Name and label stay meaningless to
          autofill, and the data attributes opt out of password managers. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-2500 top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor="withdrawal-hp">{withdrawalText.honeypotLabel}</label>
        <input
          id="withdrawal-hp"
          name="withdrawal-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          value={honeypot}
          onChange={(event) => onHoneypotChange(event.target.value)}
        />
      </div>

      {invalidFields.length > 0 ? (
        <Text role="alert" size="small" className="font-semibold text-coral">
          {withdrawalText.invalid}
        </Text>
      ) : null}

      {withdrawalFields.map((field) => {
        const shared = {
          id: fieldId(field.key),
          name: field.key,
          value: values[field.key],
          placeholder: field.placeholder,
          autoComplete: field.autoComplete,
          maxLength: field.maxLength,
          onChange: (
            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => onChange(field.key, event.target.value),
        };
        return (
          <Field
            key={field.key}
            label={field.label}
            htmlFor={shared.id}
            hint={field.hint}
            description={field.description}
            error={invalidFields.includes(field.key) ? field.error : undefined}
            required={field.required}
          >
            {field.kind === "textarea" ? (
              <Textarea {...shared} rows={field.required ? 3 : 4} />
            ) : (
              <Input
                {...shared}
                type={field.kind}
                spellCheck={field.kind === "email" ? false : undefined}
              />
            )}
          </Field>
        );
      })}

      <Button type="submit" className="self-start">
        {withdrawalText.submit}
      </Button>
    </form>
  );
}
