"use client";

import { bookerText } from "@/content/booking";
import type { BookingSlot } from "../model/config";
import { formatDateLabel } from "../model/dates";

/** The free times of the selected day, one button each. */
export function TimeSlots({
  selectedDate,
  slots,
  onPick,
}: {
  selectedDate: string;
  slots: BookingSlot[];
  onPick: (slot: BookingSlot) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Empty h-9 row mirrors the calendar's month-nav height so the slots
          line up with the day grid beside them. */}
      <div className="mb-4 flex h-9 items-center">
        <p className="text-small font-semibold text-ink">
          {bookerText.calendar.slotsHeading}
        </p>
      </div>
      <p className="mb-2 text-caption text-ink-soft">
        {formatDateLabel(selectedDate)}
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            onClick={() => onPick(slot)}
            className="rounded-lg border border-coral px-3 py-2.5 text-center text-small font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
          >
            {slot.time}
            {bookerText.timeSuffix}
          </button>
        ))}
      </div>
    </div>
  );
}
