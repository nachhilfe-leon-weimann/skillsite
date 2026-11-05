import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";

import type { AvailabilityResponse, SubmitResult } from "../model/config";
import { requestBooking } from "../server/actions";
import { Booker } from "./booker";

vi.mock("../server/actions", () => ({ requestBooking: vi.fn() }));

const sendBooking = vi.mocked(requestBooking);
const track = vi.fn();

/** One free day, 25 November 2026 (outside the 14-day withdrawal period), at 10:00. */
const freeDay: AvailabilityResponse = {
  status: "ok",
  timeZone: "Europe/Berlin",
  days: [
    {
      date: "2026-11-25",
      slots: [{ time: "10:00", start: "2026-11-25T10:00:00.000+01:00" }],
    },
  ],
};

function answerAvailability(body: AvailabilityResponse) {
  const fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

beforeAll(() => {
  // jsdom has no layout: the step panel's height animation observes nothing.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-05T09:00:00Z"));
  window.umami = { track };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete window.umami;
  sendBooking.mockReset();
  track.mockReset();
});

function renderBooker(
  event: "nachhilfe" | "kennenlernen",
  initialSubject?: string,
) {
  render(
    <Booker
      event={event}
      title="Titel"
      subtitle="Untertitel"
      initialSubject={initialSubject}
      renderedToday="2026-11-05"
    />,
  );
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: false }), {
    target: { value },
  });

async function fillLessonForm() {
  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  type("Vorname", "Max");
  type("Nachname", "Mustermann");
  type("E-Mail", "max@example.test");
  fireEvent.click(screen.getByRole("radio", { name: "Discord" }));
  fireEvent.click(screen.getByRole("radio", { name: /Mathematik/ }));
}

test("a lesson is booked from a free time to the confirmation", async () => {
  answerAvailability(freeDay);
  let confirm!: (result: SubmitResult) => void;
  sendBooking.mockReturnValueOnce(
    new Promise((resolve) => {
      confirm = resolve;
    }),
  );
  renderBooker("nachhilfe");

  await fillLessonForm();
  // The side panel names the chosen slot and its price.
  const aside = within(screen.getByRole("complementary"));
  expect(aside.getByText("Mi., 25. November – 10:00 Uhr")).toBeDefined();
  expect(aside.getByText(/^30,00/).textContent).toBe("30,00\u00a0€");
  fireEvent.click(
    screen.getByRole("button", { name: "Zahlungspflichtig buchen" }),
  );

  expect(
    await screen.findByRole("heading", { name: "Termin wird gebucht …" }),
  ).toBeDefined();
  expect(sendBooking).toHaveBeenCalledOnce();
  expect(sendBooking.mock.calls[0]?.[0]).toMatchObject({
    event: "nachhilfe",
    slot: "2026-11-25T10:00:00.000+01:00",
    duration: 60,
    values: {
      firstName: "Max",
      lastName: "Mustermann",
      email: "max@example.test",
      location: "discord-video",
      subject: "Mathematik",
    },
    agreements: { termsAccepted: true, earlyPerformanceRequested: false },
  });

  confirm({ ok: true });
  expect(
    await screen.findByRole("heading", { name: "Termin gebucht!" }),
  ).toBeDefined();
  expect(track.mock.calls.map(([name]) => name)).toEqual([
    "booking-started",
    "slot-selected",
    "booking-confirmed",
  ]);
});

test("a booking whose request fails can be sent again", async () => {
  answerAvailability(freeDay);
  sendBooking
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: true });
  renderBooker("nachhilfe");

  await fillLessonForm();
  fireEvent.click(
    screen.getByRole("button", { name: "Zahlungspflichtig buchen" }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "Das hat nicht ganz geklappt",
    }),
  ).toBeDefined();
  expect(
    screen.getByText(
      "Die Buchung hat nicht geklappt. Bitte versuch es erneut oder schreib mir direkt.",
    ),
  ).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Erneut senden" }));
  expect(
    await screen.findByRole("heading", { name: "Termin gebucht!" }),
  ).toBeDefined();
  expect(sendBooking).toHaveBeenCalledTimes(2);
});

test("a slot taken in the meantime leads back to freshly loaded times", async () => {
  const fetch = answerAvailability(freeDay);
  sendBooking.mockResolvedValueOnce({
    ok: false,
    reason: "slot_taken",
    error: "Dieser Termin ist leider schon vergeben.",
  });
  renderBooker("nachhilfe");

  await fillLessonForm();
  fireEvent.click(
    screen.getByRole("button", { name: "Zahlungspflichtig buchen" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Anderen Termin wählen" }),
  );
  expect(
    await screen.findByRole("button", { name: "10:00 Uhr" }),
  ).toBeDefined();
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("a subject passed in from the contact link is already chosen in the form", async () => {
  answerAvailability(freeDay);
  renderBooker("kennenlernen", "Mathematik");

  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  expect(
    screen
      .getByRole("button", { name: /Mathematik/ })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    screen
      .getByRole("button", { name: /Informatik/ })
      .getAttribute("aria-pressed"),
  ).toBe("false");
});

test("without online booking the visitor is sent to the contact page", async () => {
  answerAvailability({
    status: "unconfigured",
    timeZone: "Europe/Berlin",
    days: [],
  });
  renderBooker("kennenlernen");

  await waitFor(() =>
    expect(
      screen.getByRole("heading", {
        name: "Online-Terminwahl gerade nicht verfügbar",
      }),
    ).toBeDefined(),
  );
  expect(
    screen.getByRole("link", { name: "Direkt anfragen" }).getAttribute("href"),
  ).toBe("/kontakt");
});
