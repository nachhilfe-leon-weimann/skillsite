"use client";

/**
 * Radix Primitives have no date picker. This is the common substitute: a Radix
 * Popover around `react-day-picker` (third-party calendar, date-fns locales).
 * The text input and its parsing are hand-built with date-fns.
 */
import * as Popover from "@radix-ui/react-popover";
import { format, isValid, parse } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useId, useState } from "react";
import { DayPicker } from "react-day-picker";
import { de as dayPickerDe } from "react-day-picker/locale";

import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

const PATTERN = "dd.MM.yyyy";

export function RadixDatePicker() {
  const [date, setDate] = useState<Date>();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const pick = (next: Date | undefined) => {
    setDate(next);
    setText(next ? format(next, PATTERN, { locale: de }) : "");
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <label
        htmlFor={inputId}
        className="block text-small font-semibold text-ink"
      >
        Datum
      </label>
      <div className="mt-1.5 flex w-64 items-center gap-2">
        <input
          id={inputId}
          data-spike="date-value"
          placeholder="TT.MM.JJJJ"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            const parsed = parse(event.target.value, PATTERN, new Date(), {
              locale: de,
            });
            setDate(isValid(parsed) ? parsed : undefined);
          }}
          className={look.input}
        />
        <Popover.Trigger aria-label="Kalender öffnen" className={look.trigger}>
          <CalendarDays aria-hidden className="size-4" />
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          aria-label="Kalender"
          // Let the calendar focus the selected day instead of the first button.
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(look.panel, "p-4", motion)}
        >
          <DayPicker
            mode="single"
            autoFocus
            locale={dayPickerDe}
            selected={date}
            defaultMonth={date}
            onSelect={(next) => {
              pick(next);
              setOpen(false);
            }}
            classNames={{
              month_caption: cn(look.caption, "mb-3"),
              nav: "absolute right-4 top-4 flex gap-1",
              weekday: look.weekday,
              day: "rounded-full",
              day_button: look.day,
              selected: look.daySelected,
              today: "text-coral",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
