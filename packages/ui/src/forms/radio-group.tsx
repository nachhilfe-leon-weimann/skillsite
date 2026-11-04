"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useId, useRef } from "react";

import { cn } from "../utils/cn";

/** One choice of a radio group or a set of choice chips. */
export type ChoiceOption = {
  value: string;
  label: string;
  /** A second line under a row's label; it describes the option, not names it. */
  hint?: string;
  /** A glyph shown on a chip. */
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

/** The keys Radix's roving focus moves by (no orientation is set). */
const NAV_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

/**
 * Radix moves focus for a navigation key in a timer it sets during the keydown,
 * and checks the radio it focuses only if an arrow key is still down then. A
 * quick press, a second key before the first focus, or Home/End would leave
 * focus on an unchecked radio. So each navigation key counts as pending in its
 * group until a timer set after Radix's has run (from a microtask after the
 * keydown, so it runs after that focus move). A radio focused while a key is
 * pending is checked at once, unless Radix's own click did; the timer then
 * checks the focused radio if it still is not.
 */
const pendingNavigation = new WeakMap<Element, number>();

function checkUnchecked(radio: Element | null, group: Element) {
  if (
    radio instanceof HTMLButtonElement &&
    radio.getAttribute("role") === "radio" &&
    group.contains(radio) &&
    radio.getAttribute("aria-checked") !== "true" &&
    !radio.disabled
  )
    radio.click();
}

function navigate(group: Element) {
  pendingNavigation.set(group, (pendingNavigation.get(group) ?? 0) + 1);
  queueMicrotask(() =>
    setTimeout(() => {
      pendingNavigation.set(group, (pendingNavigation.get(group) ?? 1) - 1);
      checkUnchecked(document.activeElement, group);
    }),
  );
}

type RadioGroupRootProps = {
  /** The checked option's value; `""` checks none (an optional group may start empty). */
  value: string;
  /** Called with the newly checked value; never with `""`, never for the checked one. */
  onChange: (value: string) => void;
  /** Announced as required; validation stays with the consumer. */
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * A radio group on Radix: one tab stop; the arrow keys, Home/End and
 * PageUp/PageDown move focus and selection together over the enabled radios;
 * Space and Enter check the focused one. Checking the checked radio again keeps
 * it checked. Render `RadioGroupItem`s inside; `RadioGroup` and `ChoiceChips`
 * style it.
 */
export function RadioGroupRoot({
  value,
  onChange,
  required,
  disabled,
  className,
  children,
  ...props
}: RadioGroupRootProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      // Announced only; Radix's `required` would add native validation to
      // its hidden inputs inside a form.
      aria-required={required || undefined}
      {...props}
      // Radix makes the group itself focusable, for Tab to enter it. The gaps
      // between the radios let the pointer through, so a press there focuses
      // nothing and Tab then starts from it, as before; the radios take it.
      // Inside a form Radix adds an invisible native radio after each radio,
      // for native submission, which this group does not use (no name).
      // Rendered, they shifted the antialiasing of the radios' corners.
      className={cn("pointer-events-none [&>input]:hidden", className)}
    >
      {children}
    </RadioGroupPrimitive.Root>
  );
}

type RadioGroupItemProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
  children: React.ReactNode;
};

/**
 * One radio of a `RadioGroupRoot`: a button with `role="radio"`. Only radios
 * take the pointer inside the group.
 */
export function RadioGroupItem({
  value,
  className,
  ...props
}: RadioGroupItemProps) {
  // Radix's own click on this radio while it takes focus, if it made one.
  const clickedRef = useRef(false);
  return (
    <RadioGroupPrimitive.Item
      value={value}
      {...props}
      className={cn("pointer-events-auto", className)}
      onKeyDown={(event) => {
        const group = event.currentTarget.closest("[role=radiogroup]");
        if (
          group &&
          NAV_KEYS.has(event.key) &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey
        )
          navigate(group);
        if (event.key === "Enter") {
          // Radix ignores Enter; it checked a choice before, and still does.
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      onFocus={(event) => {
        const radio = event.currentTarget;
        const group = radio.closest("[role=radiogroup]");
        if (!group || !pendingNavigation.get(group)) return;
        clickedRef.current = false;
        queueMicrotask(() => {
          if (!clickedRef.current && document.activeElement === radio)
            checkUnchecked(radio, group);
        });
      }}
      onClick={() => {
        clickedRef.current = true;
      }}
    />
  );
}

type RadioGroupProps = {
  /** The visible label above the rows; it names the group. */
  label: string;
  options: ChoiceOption[];
  /** The checked option's value; `""` checks none. */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Single choice as selectable rows (two columns from `sm`), with optional hints. */
export function RadioGroup({
  label,
  options,
  value,
  onChange,
  required,
  disabled,
  className,
}: RadioGroupProps) {
  const id = useId();
  const labelId = `${id}-label`;
  return (
    <div className={className}>
      <p id={labelId} className="mb-1.5 text-small font-semibold text-ink">
        {label}
      </p>
      <RadioGroupRoot
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-labelledby={labelId}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((option, index) => {
          const active = value === option.value;
          const hintId = option.hint ? `${id}-hint-${index}` : undefined;
          return (
            <RadioGroupItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              aria-describedby={hintId}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-small font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                active
                  ? "border-coral bg-accent-tint-8 text-ink"
                  : "border-line bg-bg text-ink enabled:hover:border-coral",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-coral" : "border-line",
                )}
              >
                {active ? (
                  <span className="size-2 rounded-full bg-coral" />
                ) : null}
              </span>
              <span className="min-w-0">
                {option.label}
                {option.hint ? (
                  <span
                    id={hintId}
                    aria-hidden
                    className="block text-caption font-normal text-ink-soft"
                  >
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </RadioGroupItem>
          );
        })}
      </RadioGroupRoot>
    </div>
  );
}
