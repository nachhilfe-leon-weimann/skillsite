import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { TimeSlots } from "./time-slots";

afterEach(cleanup);

const slots = [
  { time: "10:00", start: "2026-11-10T10:00:00.000+01:00" },
  { time: "14:30", start: "2026-11-10T14:30:00.000+01:00" },
];

test("the free times of the chosen day are listed under its date", () => {
  render(
    <TimeSlots selectedDate="2026-11-10" slots={slots} onPick={() => {}} />,
  );
  expect(screen.getByText("Freie Uhrzeiten")).toBeDefined();
  expect(screen.getByText("Di., 10. November")).toBeDefined();
  expect(
    screen.getAllByRole("button").map((button) => button.textContent),
  ).toEqual(["10:00 Uhr", "14:30 Uhr"]);
});

test("picking a time hands on exactly that slot", () => {
  const onPick = vi.fn();
  render(<TimeSlots selectedDate="2026-11-10" slots={slots} onPick={onPick} />);
  fireEvent.click(screen.getByRole("button", { name: "14:30 Uhr" }));
  expect(onPick).toHaveBeenCalledExactlyOnceWith(slots[1]);
});
