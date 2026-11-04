import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useEffect, useState } from "react";

import { Calendar } from "./calendar";

afterEach(cleanup);

type HarnessProps = {
  month?: string;
  selected?: string | null;
  selectable?: string[];
  busy?: boolean;
  today?: string;
  startMonth?: string;
  endMonth?: string;
  /** Show the month the calendar asks for (a parent that follows it). */
  followMonth?: boolean;
  onMonthChange?: (month: string) => void;
  onSelect?: (date: string) => void;
};

/** A parent that owns month and selection, as the booking widget does. */
function Harness({
  month: initialMonth = "2026-11",
  selected: initialSelected = null,
  selectable = [],
  busy = false,
  today = "2026-11-04",
  startMonth = "2026-11",
  endMonth = "2027-02",
  followMonth = true,
  onMonthChange,
  onSelect,
}: HarnessProps) {
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState(initialSelected);
  return (
    <Calendar
      month={month}
      onMonthChange={(next) => {
        onMonthChange?.(next);
        if (followMonth) setMonth(next);
      }}
      startMonth={startMonth}
      endMonth={endMonth}
      selected={selected}
      onSelect={(date) => {
        onSelect?.(date);
        setSelected(date);
      }}
      isSelectable={(date) => selectable.includes(date)}
      busy={busy}
      today={today}
      timeZone="Europe/Berlin"
      locale="de-DE"
      weekStartsOn={1}
      previousMonthLabel="Vorheriger Monat"
      nextMonthLabel="Nächster Monat"
    />
  );
}

const day = (name: string | RegExp) => screen.getByRole("button", { name });
const dayButtons = () =>
  within(screen.getByRole("grid")).queryAllByRole("button");
const tabStops = () => dayButtons().filter((button) => button.tabIndex === 0);
const key = (target: Element, name: string, init: object = {}) =>
  fireEvent.keyDown(target, { key: name, ...init });

describe("semantics", () => {
  test("the grid is named by its month; weekdays read in full", () => {
    render(<Harness />);
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeTruthy();
    const caption = screen.getByText("November 2026");
    expect(caption.tagName).toBe("STRONG");
    expect(caption.getAttribute("role")).toBeNull();
    expect(caption.getAttribute("aria-live")).toBeNull();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Mo",
      "Di",
      "Mi",
      "Do",
      "Fr",
      "Sa",
      "So",
    ]);
    expect(headers.map((header) => header.getAttribute("aria-label"))).toEqual([
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
      "Sonntag",
    ]);
  });

  test("a day is labelled with its full date, today and the selection", () => {
    render(
      <Harness
        selected="2026-11-12"
        selectable={["2026-11-12", "2026-11-19"]}
      />,
    );
    const today = day("Heute, Mittwoch, 4. November 2026");
    expect(today.textContent).toBe("4");
    expect(today.querySelector("span[aria-hidden]")).toBeTruthy();
    const selected = day("Donnerstag, 12. November 2026, ausgewählt");
    expect(
      selected.closest("[role=gridcell]")!.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      day("Donnerstag, 19. November 2026")
        .closest("[role=gridcell]")!
        .hasAttribute("aria-selected"),
    ).toBe(false);
  });

  test("unavailable days are aria-disabled, never natively disabled", () => {
    render(<Harness selectable={["2026-11-12"]} />);
    for (const button of dayButtons()) {
      expect(button.hasAttribute("disabled")).toBe(false);
      const available = button.getAttribute("aria-label")!.includes("12.");
      expect(button.getAttribute("aria-disabled")).toBe(
        available ? null : "true",
      );
    }
  });

  test("while busy every day is aria-disabled and pulses; the grid is busy", () => {
    render(<Harness busy selectable={["2026-11-12"]} />);
    expect(screen.getByRole("grid").getAttribute("aria-busy")).toBe("true");
    for (const button of dayButtons()) {
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.className).toContain("animate-pulse");
    }
  });

  test("the month buttons are named and disabled at the bounds", () => {
    const onMonthChange = vi.fn();
    render(<Harness onMonthChange={onMonthChange} />);
    const previous = screen.getByRole("button", { name: "Vorheriger Monat" });
    const next = screen.getByRole("button", { name: "Nächster Monat" });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(next);
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-12");
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByRole("grid", { name: "Februar 2027" })).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(true);
    expect((previous as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(previous);
    expect(onMonthChange.mock.calls.map(([month]) => month)).toEqual([
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-01",
    ]);
  });
});

describe("one tab stop", () => {
  test.each([
    ["sparse days", { selectable: ["2026-11-12", "2026-11-19"] }],
    ["no available day", { selectable: [] }],
    ["loading", { busy: true, selectable: ["2026-11-12"] }],
    ["a later month without today", { month: "2026-12", selectable: [] }],
  ] satisfies [string, HarnessProps][])("%s", (_, props) => {
    render(<Harness {...props} />);
    expect(tabStops()).toHaveLength(1);
  });

  test("the selected day holds it, else today, else the 1st", () => {
    const { unmount } = render(
      <Harness selected="2026-11-12" selectable={["2026-11-12"]} />,
    );
    expect(tabStops()[0]!.textContent).toBe("12");
    unmount();
    render(<Harness />);
    expect(tabStops()[0]!.textContent).toBe("4");
    cleanup();
    render(<Harness month="2027-01" />);
    expect(tabStops()[0]!.textContent).toBe("1");
  });
});

describe("keyboard", () => {
  test("arrows, Home and End move focus within the month and select nothing", () => {
    const onSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <Harness
        selectable={["2026-11-05", "2026-11-12"]}
        onSelect={onSelect}
        onMonthChange={onMonthChange}
      />,
    );
    const start = day(/ 4\. November/);
    act(() => start.focus());
    const moves: [string, number][] = [
      ["ArrowRight", 5],
      ["ArrowDown", 12],
      ["Home", 9],
      ["End", 15],
      ["ArrowUp", 8],
      ["ArrowLeft", 7],
    ];
    for (const [name, expected] of moves) {
      key(document.activeElement!, name);
      expect(document.activeElement!.textContent, name).toBe(String(expected));
    }
    expect(onSelect).not.toHaveBeenCalled();
    expect(onMonthChange).not.toHaveBeenCalled();
    expect(tabStops()).toHaveLength(1);
  });

  test("keys that leave the month ask the parent for it, and focus the day there", () => {
    const onMonthChange = vi.fn();
    render(<Harness onMonthChange={onMonthChange} />);
    act(() => day(/ 30\. November/).focus());
    key(document.activeElement!, "ArrowRight");
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-12");
    expect(document.activeElement!.getAttribute("aria-label")).toBe(
      "Dienstag, 1. Dezember 2026",
    );
    key(document.activeElement!, "PageDown");
    expect(onMonthChange).toHaveBeenLastCalledWith("2027-01");
    expect(document.activeElement!.getAttribute("aria-label")).toBe(
      "Freitag, 1. Januar 2027",
    );
    key(document.activeElement!, "ArrowLeft");
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-12");
    expect(document.activeElement!.getAttribute("aria-label")).toBe(
      "Donnerstag, 31. Dezember 2026",
    );
    key(document.activeElement!, "PageUp", { shiftKey: true });
    // A year back is clamped to the first month's first day.
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-11");
    expect(document.activeElement!.getAttribute("aria-label")).toBe(
      "Sonntag, 1. November 2026",
    );
  });

  test("the calendar shows only the month its parent gives it", () => {
    const onMonthChange = vi.fn();
    render(<Harness followMonth={false} onMonthChange={onMonthChange} />);
    act(() => day(/ 4\. November/).focus());
    key(document.activeElement!, "PageDown");
    fireEvent.click(screen.getByRole("button", { name: "Nächster Monat" }));
    expect(onMonthChange.mock.calls).toEqual([["2026-12"], ["2026-12"]]);
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeTruthy();
  });

  test("the bounds hold without asking for a month", () => {
    const onMonthChange = vi.fn();
    const { unmount } = render(<Harness onMonthChange={onMonthChange} />);
    act(() => day(/ 1\. November/).focus());
    for (const name of ["ArrowLeft", "ArrowUp", "PageUp", "Home"]) {
      key(document.activeElement!, name);
      expect(document.activeElement!.textContent, name).toBe("1");
    }
    unmount();
    render(<Harness month="2027-02" onMonthChange={onMonthChange} />);
    act(() => day(/ 28\. Februar/).focus());
    for (const name of ["ArrowRight", "ArrowDown", "PageDown", "End"]) {
      key(document.activeElement!, name);
      expect(document.activeElement!.textContent, name).toBe("28");
    }
    act(() => day(/ 10\. Februar/).focus());
    key(document.activeElement!, "PageDown");
    expect(document.activeElement!.textContent).toBe("28");
    expect(onMonthChange).not.toHaveBeenCalled();
  });
});

describe("selection", () => {
  test("only a selectable day can be picked", () => {
    const onSelect = vi.fn();
    render(<Harness selectable={["2026-11-12"]} onSelect={onSelect} />);
    fireEvent.click(day(/ 11\. November/));
    fireEvent.click(day(/ 4\. November/));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(day(/ 12\. November/));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("2026-11-12");
    // Picking the selected day again keeps it.
    fireEvent.click(day(/ 12\. November/));
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-12");
    expect(day("Donnerstag, 12. November 2026, ausgewählt")).toBeTruthy();
  });

  test("nothing can be picked while busy", () => {
    const onSelect = vi.fn();
    render(<Harness busy selectable={["2026-11-12"]} onSelect={onSelect} />);
    fireEvent.click(day(/ 12\. November/));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("focus across loading", () => {
  /** A parent that loads each month it is asked for; `answer` ends the load. */
  const control = { answer: () => {} };
  function Loading({ answers }: { answers: Record<string, string[]> }) {
    const [month, setMonth] = useState("2026-11");
    const [busy, setBusy] = useState(false);
    useEffect(() => {
      control.answer = () => setBusy(false);
    });
    return (
      <Calendar
        month={month}
        onMonthChange={(next) => {
          setMonth(next);
          setBusy(true);
        }}
        startMonth="2026-11"
        endMonth="2027-02"
        selected={null}
        onSelect={() => {}}
        isSelectable={(date) =>
          !busy && (answers[date.slice(0, 7)] ?? []).includes(date)
        }
        busy={busy}
        today="2026-11-04"
        timeZone="Europe/Berlin"
        locale="de-DE"
        weekStartsOn={1}
        previousMonthLabel="Vorheriger Monat"
        nextMonthLabel="Nächster Monat"
      />
    );
  }

  test("the requested day keeps focus, also when it turns out unavailable", () => {
    render(<Loading answers={{ "2026-12": ["2026-12-20"] }} />);
    act(() => day(/ 4\. November/).focus());
    key(document.activeElement!, "PageDown");
    const requested = document.activeElement!;
    expect(requested.getAttribute("aria-label")).toBe(
      "Freitag, 4. Dezember 2026",
    );
    expect(screen.getByRole("grid").getAttribute("aria-busy")).toBe("true");
    expect(tabStops()).toHaveLength(1);
    act(() => control.answer());
    expect(document.activeElement).toBe(requested);
    expect(screen.getByRole("grid").getAttribute("aria-busy")).toBe("false");
    expect(day(/ 4\. Dezember/)).toBe(requested);
    expect(requested.getAttribute("aria-disabled")).toBe("true");
    expect(day(/ 20\. Dezember/).getAttribute("aria-disabled")).toBeNull();
    expect(tabStops()).toHaveLength(1);
  });

  test("an answer while the grid holds focus keeps the same day focused", () => {
    // Re-render with new props while a day holds focus.
    const props = {
      month: "2026-11",
      onMonthChange: () => {},
      startMonth: "2026-11",
      endMonth: "2027-02",
      onSelect: () => {},
      today: "2026-11-04",
      timeZone: "Europe/Berlin",
      locale: "de-DE",
      weekStartsOn: 1,
      previousMonthLabel: "Vorheriger Monat",
      nextMonthLabel: "Nächster Monat",
    } as const;
    const { rerender } = render(
      <Calendar {...props} selected={null} busy isSelectable={() => false} />,
    );
    const focused = day(/ 9\. November/);
    act(() => focused.focus());
    rerender(
      <Calendar
        {...props}
        selected="2026-11-20"
        busy={false}
        isSelectable={(date) => date === "2026-11-20"}
      />,
    );
    expect(document.activeElement).toBe(focused);
    expect(day(/ 9\. November/)).toBe(focused);
    expect(day(/ 20\. November 2026, ausgewählt/)).toBeTruthy();
  });
});

describe("dates in any host time zone", () => {
  const zones = [
    ["Europe/Berlin", -60],
    ["America/Los_Angeles", 480],
    ["Pacific/Auckland", -780],
    ["UTC", 0],
  ] as const;
  const original = process.env.TZ;
  afterEach(() => {
    process.env.TZ = original;
  });

  /** The visible day numbers per row, "" for an empty cell. */
  const rows = () =>
    within(screen.getByRole("grid"))
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("gridcell")
          .map((cell) => cell.textContent),
      );

  describe.each(zones)("host %s", (zone, januaryOffset) => {
    test("the host zone is in effect", () => {
      process.env.TZ = zone;
      expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(januaryOffset);
    });

    test.each([
      ["2026-03", "2026-03-29", "Sonntag, 29. März 2026", 6, 31, 6],
      ["2026-10", "2026-10-25", "Sonntag, 25. Oktober 2026", 3, 31, 5],
      ["2028-02", "2028-02-29", "Dienstag, 29. Februar 2028", 1, 29, 5],
      ["2026-12", "2026-12-31", "Donnerstag, 31. Dezember 2026", 1, 31, 5],
    ])(
      "%s: %s stays the same day",
      (month, date, label, leading, days, weeks) => {
        process.env.TZ = zone;
        const onSelect = vi.fn();
        render(
          <Harness
            month={month}
            startMonth={month}
            endMonth="2028-12"
            today="2026-11-04"
            selectable={[date]}
            onSelect={onSelect}
          />,
        );
        expect(dayButtons()).toHaveLength(days);
        const shown = rows();
        expect(shown).toHaveLength(weeks);
        expect(shown[0]!.slice(0, leading)).toEqual(Array(leading).fill(""));
        expect(shown[0]![leading]).toBe("1");
        const button = day(label);
        expect(button.textContent).toBe(date.slice(8).replace(/^0/, ""));
        expect(
          button.closest("[role=gridcell]")!.getAttribute("data-day"),
        ).toBe(date);
        fireEvent.click(button);
        expect(onSelect).toHaveBeenCalledExactlyOnceWith(date);
        expect(day(`${label}, ausgewählt`)).toBe(button);
      },
    );

    test("the year rolls over by keyboard", () => {
      process.env.TZ = zone;
      const onMonthChange = vi.fn();
      render(
        <Harness
          month="2026-12"
          startMonth="2026-11"
          onMonthChange={onMonthChange}
        />,
      );
      act(() => day(/ 31\. Dezember/).focus());
      key(document.activeElement!, "ArrowRight");
      expect(onMonthChange).toHaveBeenLastCalledWith("2027-01");
      expect(document.activeElement!.getAttribute("aria-label")).toBe(
        "Freitag, 1. Januar 2027",
      );
      key(document.activeElement!, "ArrowUp");
      expect(onMonthChange).toHaveBeenLastCalledWith("2026-12");
      expect(document.activeElement!.getAttribute("aria-label")).toBe(
        "Freitag, 25. Dezember 2026",
      );
    });

    test("today is the given day, not the host's", () => {
      process.env.TZ = zone;
      render(
        <Harness month="2026-03" startMonth="2026-03" today="2026-03-29" />,
      );
      expect(day("Heute, Sonntag, 29. März 2026")).toBeTruthy();
      expect(screen.getAllByRole("button", { name: /^Heute/ })).toHaveLength(1);
    });
  });
});
