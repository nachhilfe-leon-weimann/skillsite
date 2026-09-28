"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";

import { cn } from "../../utils/cn";
import { look } from "../look";

const options = ["Mathe", "Physik", "Informatik"];

export function RadixRadioGroup() {
  return (
    <RadioGroup.Root
      defaultValue="Mathe"
      aria-label="Fach"
      className="flex flex-col gap-3"
    >
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-3 text-body text-ink"
        >
          <RadioGroup.Item
            value={option}
            className={cn(look.radio, "data-[state=checked]:border-coral")}
          >
            <RadioGroup.Indicator
              className={cn(look.radioDot, "data-[state=checked]:animate-fade")}
            />
          </RadioGroup.Item>
          {option}
        </label>
      ))}
    </RadioGroup.Root>
  );
}
