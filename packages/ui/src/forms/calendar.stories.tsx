import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Calendar } from "./calendar";
import { Button } from "../primitives/button";

const meta = {
  title: "Forms/Calendar",
  component: Calendar,
  // Each story renders its own controlled example below.
  args: {
    month: "2026-11",
    onMonthChange: () => {},
    startMonth: "2026-11",
    endMonth: "2027-02",
    selected: null,
    onSelect: () => {},
    isSelectable: () => false,
    today: "2026-11-04",
    timeZone: "Europe/Berlin",
    locale: "de-DE",
    weekStartsOn: 1,
    previousMonthLabel: "Vorheriger Monat",
    nextMonthLabel: "Nächster Monat",
  },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A fixed today, so the story looks the same on every day. */
const today = "2026-11-04";

/** Sparse days: every Tuesday and Thursday from today on. */
function sparse(date: string) {
  const [year = NaN, month = NaN, day = NaN] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return date >= today && (weekday === 2 || weekday === 4);
}

/**
 * The calendar in a booking-like parent: it owns month and selection, between
 * two buttons, with a status line. `load` keeps each requested month busy for
 * a moment, as an availability request would.
 */
function Example({
  selectable = sparse,
  busy: alwaysBusy = false,
  load = false,
  initialSelected = null,
}: {
  selectable?: (date: string) => boolean;
  busy?: boolean;
  load?: boolean;
  initialSelected?: string | null;
}) {
  const [month, setMonth] = useState("2026-11");
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [requests, setRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [loading, month]);
  const busy = alwaysBusy || loading;

  return (
    <div className="flex max-w-xl flex-col items-start gap-4 p-6">
      <Button type="button" variant="outline">
        Davor
      </Button>
      <div className="w-full max-w-lg">
        <Calendar
          month={month}
          onMonthChange={(next) => {
            setMonth(next);
            setSelected(null);
            setRequests((list) => [...list, next]);
            if (load) setLoading(true);
          }}
          startMonth="2026-11"
          endMonth="2027-02"
          selected={selected}
          onSelect={setSelected}
          isSelectable={selectable}
          busy={busy}
          today={today}
          timeZone="Europe/Berlin"
          locale="de-DE"
          weekStartsOn={1}
          previousMonthLabel="Vorheriger Monat"
          nextMonthLabel="Nächster Monat"
        />
      </div>
      <Button type="button" variant="outline">
        Danach
      </Button>
      <p role="status" className="text-small">
        Auswahl: {selected ?? "keine"}, Monate: {requests.join(" ") || "-"}
        {busy ? ", lädt" : ""}
      </p>
    </div>
  );
}

// Free days on Tuesdays and Thursdays; the first one is selected.
export const Default: Story = {
  render: () => <Example initialSelected="2026-11-05" />,
};

// No free day in any month: every day stays focusable and disabled for picking.
export const NoAvailableDays: Story = {
  render: () => <Example selectable={() => false} />,
};

// Availability not loaded yet: the days pulse and none can be picked.
export const Loading: Story = { render: () => <Example busy /> };

// Each month change loads for 600 ms before its free days show.
export const LoadOnMonthChange: Story = {
  render: () => <Example load />,
};
