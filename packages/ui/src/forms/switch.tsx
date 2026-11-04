"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "../utils/cn";

type SwitchProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/**
 * Accessible on/off toggle on Radix Switch: a native `button` with
 * `role="switch"` and `aria-checked`. A click, Space, Enter or its `<label>`
 * toggles it once. Controlled: `checked` is the state and `onCheckedChange`
 * asks for the other one. Name it by a `<label htmlFor={id}>`, `aria-label`
 * or `aria-labelledby`. It is not a form field: it submits no value, never
 * submits its form and keeps its state on a form reset.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  ...props
}: SwitchProps) {
  return (
    // Radix's `Root` adds a hidden native checkbox after the button inside a
    // form and re-sends the click from it. Built from its provider and trigger,
    // the switch stays a single button, as before. The provider gets no
    // `onCheckedChange`: Radix's own toggle and its form reset listener reach
    // its no-op default, and only the switch's click asks for the other state,
    // also when an ancestor prevented that click's default.
    <SwitchPrimitive.unstable_Provider checked={checked} disabled={disabled}>
      <SwitchPrimitive.unstable_Trigger
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-quick ease-soft",
          checked ? "bg-coral" : "bg-line",
          disabled && "cursor-not-allowed opacity-60",
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform duration-quick ease-soft",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </SwitchPrimitive.unstable_Trigger>
    </SwitchPrimitive.unstable_Provider>
  );
}
