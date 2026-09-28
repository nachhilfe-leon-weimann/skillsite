"use client";

import { createContext, useContext, useId } from "react";

import { cn } from "../utils/cn";

const controlClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-body text-ink transition-[border-color,box-shadow] placeholder:text-ink-soft focus:border-coral focus:outline-none focus:shadow-focus";

/** What a Field tells its control: the lines that describe it, and its state. */
type FieldState = {
  describedBy?: string;
  invalid?: true;
  required?: true;
};

const FieldContext = createContext<FieldState>({});

type FieldProps = {
  label: string;
  htmlFor?: string;
  /** A short note after the label, e.g. "(optional)". */
  hint?: string;
  /** A help line below the control, announced with it. */
  description?: React.ReactNode;
  /** An error line below the control; marks the control invalid and is announced with it. */
  error?: React.ReactNode;
  /** Marks the control required; the label shows a marker that assistive technology skips. */
  required?: boolean;
  children: React.ReactNode;
};

/**
 * Label + control (+ description, error). The `Input`/`Textarea` inside take
 * `aria-describedby`, `aria-invalid` and `required` from the Field unless they
 * set them themselves. Without the slots, nothing is added.
 */
export function Field({
  label,
  htmlFor,
  hint,
  description,
  error,
  required,
  children,
}: FieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-small font-semibold text-ink"
      >
        {label}
        {required ? (
          <span aria-hidden className="ml-1 text-coral">
            *
          </span>
        ) : null}
        {hint ? (
          <span className="ml-1 font-normal text-ink-soft">{hint}</span>
        ) : null}
      </label>
      <FieldContext
        value={{
          describedBy,
          invalid: error ? true : undefined,
          required: required ? true : undefined,
        }}
      >
        {children}
      </FieldContext>
      {description ? (
        <p id={descriptionId} className="mt-1.5 text-caption text-ink-soft">
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="mt-1.5 text-caption font-semibold text-coral"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The Field's state, where the control does not set it itself. */
function useFieldProps<
  T extends {
    "aria-describedby"?: string;
    "aria-invalid"?: React.AriaAttributes["aria-invalid"];
    required?: boolean;
  },
>(props: T) {
  const field = useContext(FieldContext);
  return {
    ...props,
    "aria-describedby": props["aria-describedby"] ?? field.describedBy,
    "aria-invalid": props["aria-invalid"] ?? field.invalid,
    required: props.required ?? field.required,
  };
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input className={cn(controlClass, className)} {...useFieldProps(props)} />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClass, "resize-y", className)}
      {...useFieldProps(props)}
    />
  );
}
