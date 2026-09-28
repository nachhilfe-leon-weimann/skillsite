"use client";

import { Label, Radio, RadioGroup } from "react-aria-components";

import { cn } from "../../utils/cn";
import { look } from "../look";

const options = ["Mathe", "Physik", "Informatik"];

export function RacRadioGroup() {
  return (
    <RadioGroup defaultValue="Mathe" className="flex flex-col gap-3">
      <Label className="sr-only">Fach</Label>
      {options.map((option) => (
        <Radio
          key={option}
          value={option}
          className="group flex cursor-pointer items-center gap-3 text-body text-ink outline-none"
        >
          {({ isSelected }) => (
            <>
              <span
                className={cn(
                  look.radio,
                  "group-data-focus-visible:outline-3 group-data-focus-visible:outline-offset-3 group-data-focus-visible:outline-accent",
                  isSelected && "border-coral",
                )}
              >
                {isSelected ? (
                  <span className={cn(look.radioDot, "animate-fade")} />
                ) : null}
              </span>
              {option}
            </>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
}
