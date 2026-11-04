"use client";

import { useRef } from "react";
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
  // Radix also restores the first rendered state through `onCheckedChange`
  // when the surrounding form resets; only the switch's own click asks for a
  // change. Radix calls `onCheckedChange` synchronously within that click.
  const clicked = useRef(false);
  return (
    // Radix's `Root` adds a hidden native checkbox after the button inside a
    // form and re-sends the click from it. Built from its provider and trigger
    // (exact version pin), the switch stays a single button, as before.
    <SwitchPrimitive.unstable_Provider
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => {
        if (!clicked.current) return;
        clicked.current = false;
        onCheckedChange?.(next);
      }}
    >
      <SwitchPrimitive.unstable_Trigger
        onClick={() => {
          clicked.current = true;
        }}
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
