"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { useId } from "react";

import { cn } from "../utils/cn";
import {
  RadioGroupItem,
  RadioGroupRoot,
  type ChoiceOption,
} from "./radio-group";

type ChoiceChipsProps = {
  /** The visible label above the chips; it names the group. */
  label: string;
  options: ChoiceOption[];
  /**
   * Announced as required on single choice; ARIA has no required state for a
   * group of toggles (browsers ignored it there). Validation stays with the consumer.
   */
  required?: boolean;
  disabled?: boolean;
  className?: string;
} & (
  | {
      /** Several chips, each an independent pressed toggle. */
      multiple: true;
      /** The pressed values, in the order they were pressed. */
      value: string[];
      onChange: (value: string[]) => void;
    }
  | {
      /** One chip, as a radio group: one tab stop, arrows move the choice. */
      multiple?: false;
      /** The checked value; `""` checks none (an optional group may start empty). */
      value: string;
      onChange: (value: string) => void;
    }
);

const chipClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-small font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    active
      ? "border-coral bg-coral text-white"
      : "border-line bg-bg text-ink enabled:hover:border-coral",
  );

function ChipContent({
  option,
  active,
}: {
  option: ChoiceOption;
  active: boolean;
}) {
  const Icon = option.icon;
  return (
    <>
      {Icon ? (
        <span
          aria-hidden
          className={cn(
            "text-chip-icon",
            active ? "text-on-accent-75" : "text-coral",
          )}
        >
          <Icon className="size-5" />
        </span>
      ) : null}
      {option.label}
    </>
  );
}

/**
 * Pill choices. Single choice is a radio group (`RadioGroupRoot`): one tab stop,
 * the arrow keys move the choice, and activating the checked chip keeps it.
 * `multiple` makes each chip an independent pressed toggle on Radix ToggleGroup;
 * every chip stays a tab stop and the value lists the pressed chips in the
 * order they were pressed.
 */
export function ChoiceChips(props: ChoiceChipsProps) {
  const { label, options, required, disabled, className } = props;
  const labelId = `${useId()}-label`;
  const groupClass = "flex flex-wrap gap-2";

  return (
    <div className={className}>
      <p id={labelId} className="mb-1.5 text-small font-semibold text-ink">
        {label}
      </p>
      {props.multiple ? (
        <ToggleGroupPrimitive.Root
          type="multiple"
          // Independent toggles, each a tab stop, as before; not a toolbar.
          rovingFocus={false}
          role="group"
          value={props.value}
          onValueChange={props.onChange}
          disabled={disabled}
          aria-labelledby={labelId}
          className={groupClass}
        >
          {options.map((option) => {
            const active = props.value.includes(option.value);
            return (
              <ToggleGroupPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={chipClass(active)}
              >
                <ChipContent option={option} active={active} />
              </ToggleGroupPrimitive.Item>
            );
          })}
        </ToggleGroupPrimitive.Root>
      ) : (
        <RadioGroupRoot
          value={props.value}
          onChange={props.onChange}
          required={required}
          disabled={disabled}
          aria-labelledby={labelId}
          className={groupClass}
        >
          {options.map((option) => {
            const active = props.value === option.value;
            return (
              <RadioGroupItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={chipClass(active)}
              >
                <ChipContent option={option} active={active} />
              </RadioGroupItem>
            );
          })}
        </RadioGroupRoot>
      )}
    </div>
  );
}
