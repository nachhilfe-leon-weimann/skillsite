"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";

import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

const subjects = ["Mathe", "Physik", "Informatik", "Chemie", "Deutsch"];

export function RacCombobox() {
  return (
    <ComboBox className="w-64">
      <Label className="text-small font-semibold text-ink">Fach</Label>
      <div className="relative mt-1.5">
        <Input placeholder="Fach suchen" className={cn(look.input, "pr-10")} />
        <Button className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft">
          <ChevronDown aria-hidden className="size-4" />
        </Button>
      </div>
      <Popover offset={8} className={cn(look.panel, "w-64", motion)}>
        <ListBox
          className="outline-none"
          renderEmptyState={() => (
            <p className="px-3 py-2 text-small text-ink-soft">
              Kein Fach gefunden.
            </p>
          )}
        >
          {subjects.map((subject) => (
            <ListBoxItem
              key={subject}
              id={subject}
              textValue={subject}
              className={cn(
                look.item,
                "data-focused:bg-surface-2 data-focused:text-ink",
              )}
            >
              {({ isSelected }) => (
                <>
                  {subject}
                  {isSelected ? (
                    <Check aria-hidden className="size-4 text-coral" />
                  ) : null}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
