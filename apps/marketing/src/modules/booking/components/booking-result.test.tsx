import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { BookingEventKey, SubmitFailureReason } from "../model/config";
import { BookingResult } from "./booking-result";

afterEach(cleanup);

const summary = "Di., 10. November – 10:00 Uhr";
const events: BookingEventKey[] = ["kennenlernen", "nachhilfe"];

function renderResult(props: Partial<ComponentProps<typeof BookingResult>>) {
  const onRetry = vi.fn();
  const onChooseAnother = vi.fn();
  render(
    <BookingResult
      phase="failed"
      summary={summary}
      event="nachhilfe"
      error={null}
      onRetry={onRetry}
      onChooseAnother={onChooseAnother}
      {...props}
    />,
  );
  return { onRetry, onChooseAnother };
}

const heading = () => screen.getByRole("heading").textContent;
const buttons = () =>
  screen.queryAllByRole("button").map((button) => button.textContent);
const failure = (reason: SubmitFailureReason) => ({
  message: `Server text for ${reason}.`,
  reason,
});

describe.each(events)("%s", (event) => {
  test("while Cal.com confirms, the booker says it is booking and offers nothing to click", () => {
    renderResult({ event, phase: "pending" });
    expect(heading()).toBe("Termin wird gebucht …");
    const status = screen.getByText(
      "Einen Moment – die Buchung wird bestätigt.",
    );
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(buttons()).toEqual([]);
  });

  test("a confirmed booking shows the booked slot", () => {
    renderResult({ event, phase: "confirmed" });
    expect(heading()).toBe("Termin gebucht!");
    expect(screen.getByText("Dein Termin")).toBeDefined();
    expect(screen.getByText(summary)).toBeDefined();
  });

  test.each(["rate_limited", "blocked"] as const)(
    "a %s failure offers the direct contact instead of a retry",
    (reason) => {
      renderResult({ event, error: failure(reason) });
      expect(heading()).toBe(
        reason === "blocked" ? "Termin nicht gebucht" : "Zu viele Anfragen",
      );
      expect(screen.getByText(`Server text for ${reason}.`)).toBeDefined();
      expect(
        screen
          .getByRole("link", { name: "Direkt anfragen" })
          .getAttribute("href"),
      ).toBe("/kontakt");
      expect(buttons()).toEqual([]);
    },
  );

  test("a slot taken in the meantime leads back to the calendar", () => {
    const { onChooseAnother, onRetry } = renderResult({
      event,
      error: failure("slot_taken"),
    });
    expect(heading()).toBe("Termin schon vergeben");
    expect(buttons()).toEqual(["Anderen Termin wählen"]);
    fireEvent.click(
      screen.getByRole("button", { name: "Anderen Termin wählen" }),
    );
    expect(onChooseAnother).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  test.each(["generic", "too_fast", "validation"] as const)(
    "a %s failure offers to send again or to choose another slot",
    (reason) => {
      const { onRetry, onChooseAnother } = renderResult({
        event,
        error: failure(reason),
      });
      expect(heading()).toBe("Das hat nicht ganz geklappt");
      expect(screen.getByText(`Server text for ${reason}.`)).toBeDefined();
      expect(buttons()).toEqual(["Erneut senden", "Anderen Termin wählen"]);
      fireEvent.click(screen.getByRole("button", { name: "Erneut senden" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
      fireEvent.click(
        screen.getByRole("button", { name: "Anderen Termin wählen" }),
      );
      expect(onChooseAnother).toHaveBeenCalledTimes(1);
    },
  );

  test("a failure without a message from the server still explains itself", () => {
    renderResult({ event, error: null });
    expect(
      screen.getByText(
        "Die Buchung hat nicht geklappt. Bitte versuch es erneut oder schreib mir direkt.",
      ),
    ).toBeDefined();
  });
});

test("after the first meeting is booked, the visitor learns to expect a call and is done", () => {
  const { onChooseAnother } = renderResult({
    event: "kennenlernen",
    phase: "confirmed",
  });
  expect(
    screen.getByText(
      "Ich rufe dich zum vereinbarten Termin an. Die Bestätigung kommt per E-Mail.",
    ),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
  expect(onChooseAnother).toHaveBeenCalledTimes(1);
});

test("after a lesson is booked, the visitor can book another one", () => {
  const { onChooseAnother } = renderResult({
    event: "nachhilfe",
    phase: "confirmed",
  });
  expect(
    screen.getByText(
      "Die Terminbestätigung kommt per E-Mail. Die Einwahl richtet sich nach der gewählten Plattform.",
    ),
  ).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", { name: "Weiteren Termin buchen" }),
  );
  expect(onChooseAnother).toHaveBeenCalledTimes(1);
});
