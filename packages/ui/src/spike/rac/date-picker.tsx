"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
} from "react-aria-components";

import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

export function RacDatePicker() {
  return (
    <I18nProvider locale="de-DE">
      {/* de-DE alone shows "1.10.2026" (Intl default); DIN 5008 wants leading zeros. */}
      <DatePicker shouldForceLeadingZeros className="w-64">
        <Label className="text-small font-semibold text-ink">Datum</Label>
        <Group className={cn(look.input, "mt-1.5 flex items-center")}>
          <DateInput data-spike="date-value" className="flex flex-1">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded px-0.5 tabular-nums outline-none data-focused:bg-surface-2 data-placeholder:text-ink-soft"
              />
            )}
          </DateInput>
          <Button aria-label="Kalender öffnen" className="text-ink-soft">
            <CalendarDays aria-hidden className="size-4" />
          </Button>
        </Group>
        <Popover
          offset={8}
          placement="bottom start"
          className={cn(look.panel, "p-4", motion)}
        >
          <Dialog className="outline-none">
            <Calendar>
              <header className="mb-3 flex items-center justify-between">
                <Button slot="previous" className="text-ink-soft">
                  <ChevronLeft aria-hidden className="size-4" />
                </Button>
                <Heading className={look.caption} />
                <Button slot="next" className="text-ink-soft">
                  <ChevronRight aria-hidden className="size-4" />
                </Button>
              </header>
              <CalendarGrid weekdayStyle="short">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className={look.weekday}>
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => (
                    <CalendarCell
                      date={date}
                      className={cn(
                        look.day,
                        "data-outside-month:invisible data-selected:bg-coral-gradient data-selected:font-semibold data-selected:text-white",
                      )}
                    />
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </DatePicker>
    </I18nProvider>
  );
}
