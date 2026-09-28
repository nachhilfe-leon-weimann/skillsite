"use client";

/**
 * Radix Primitives have no combobox. This is the common substitute: a Radix
 * Popover around `cmdk` (a third-party command list built on Radix parts).
 */
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

const subjects = ["Mathe", "Physik", "Informatik", "Chemie", "Deutsch"];

export function RadixCombobox() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>();
  const labelId = useId();
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <span id={labelId} className="block text-small font-semibold text-ink">
        Fach
      </span>
      <Popover.Trigger
        role="combobox"
        aria-expanded={open}
        aria-labelledby={labelId}
        className={cn(look.trigger, "mt-1.5 w-64 justify-between")}
      >
        {value ?? "Fach wählen"}
        <ChevronDown aria-hidden className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          aria-labelledby={labelId}
          className={cn(look.panel, "w-64", motion)}
        >
          <Command label="Fach">
            <Command.Input
              placeholder="Fach suchen"
              className={cn(look.input, "mb-1.5")}
            />
            <Command.List>
              <Command.Empty className="px-3 py-2 text-small text-ink-soft">
                Kein Fach gefunden.
              </Command.Empty>
              {subjects.map((subject) => (
                <Command.Item
                  key={subject}
                  value={subject}
                  onSelect={() => {
                    setValue(subject);
                    setOpen(false);
                  }}
                  className={cn(
                    look.item,
                    "data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink",
                  )}
                >
                  {subject}
                  {value === subject ? (
                    <Check aria-hidden className="size-4 text-coral" />
                  ) : null}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
