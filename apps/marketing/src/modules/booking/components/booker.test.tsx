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

const earlyStart = () =>
  screen.getByRole("checkbox", { name: /Ich verlange ausdrücklich/ });
const submitButton = () =>
  screen.getByRole("button", { name: "Zahlungspflichtig buchen" });
const openItems = () =>
  screen.getByText("Bitte noch ausfüllen oder bestätigen:", { exact: false });

/** Every field and the express request. */
async function fillLessonForm() {
  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  type("Vorname", "Max");
  type("Nachname", "Mustermann");
  type("E-Mail", "max@example.test");
  fireEvent.click(screen.getByRole("radio", { name: "Discord" }));
  fireEvent.click(screen.getByRole("radio", { name: /Mathematik/ }));
  fireEvent.click(earlyStart());
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
    agreements: { termsAccepted: true, earlyPerformanceRequested: true },
  });
  // The server's time-trap reads how long the form was open; a send without it
  // would count as too fast.
  const sent = sendBooking.mock.calls[0]?.[0];
  expect(sent?.fillDurationMs).toEqual(expect.any(Number));
  expect(sent?.fillDurationMs).toBeGreaterThanOrEqual(0);
  expect(sent).not.toHaveProperty("formLoadedAt");

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

test("a paid lesson beyond the 14-day withdrawal period still needs the express request to start early", async () => {
  // The free day lies 20 days after today: the request is asked for anyway.
  answerAvailability(freeDay);
  renderBooker("nachhilfe");

  await fillLessonForm();
  fireEvent.click(earlyStart());
  const checkbox = earlyStart() as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
  expect(checkbox.required).toBe(true);
  expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  expect(openItems().textContent).toBe(
    "Bitte noch ausfüllen oder bestätigen: Widerrufshinweis",
  );

  fireEvent.click(checkbox);
  expect((submitButton() as HTMLButtonElement).disabled).toBe(false);
});

test("a paid lesson's form preselects Microsoft Teams", async () => {
  answerAvailability(freeDay);
  renderBooker("nachhilfe");

  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  const checkedIn = (name: string) =>
    within(screen.getByRole("radiogroup", { name }))
      .queryAllByRole("radio", { checked: true })
      .map((radio) => radio.textContent);
  expect(checkedIn("Plattform")).toEqual(["Microsoft Teams"]);
});

test("the order summary with subject, slot, length and price sits in one line right before the submit button", async () => {
  answerAvailability(freeDay);
  renderBooker("nachhilfe");

  await fillLessonForm();
  expect(submitButton().previousElementSibling?.textContent).toBe(
    "Mathematik · Mi., 25. November – 10:00 Uhr · 60 Minuten · 30,00\u00a0€",
  );
});

test("the side panel lists the chosen subject, the length, the price and the payment under the slot", async () => {
  answerAvailability(freeDay);
  renderBooker("nachhilfe");

  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  const aside = within(screen.getByRole("complementary"));
  // Before a subject is chosen, only the length.
  expect(aside.getByText("60 Minuten", { selector: "p" })).toBeDefined();

  fireEvent.click(screen.getByRole("radio", { name: /Physik/ }));
  const card = aside.getByText("Dein Termin").parentElement!;
  expect([...card.children].map((line) => line.textContent)).toEqual([
    "Dein Termin",
    "Mi., 25. November – 10:00 Uhr",
    "Physik · 60 Minuten",
    "30,00\u00a0€",
    "Zahlung per Rechnung (PayPal oder Überweisung)",
  ]);
});

test("the side panel drops the subject when the visitor goes back to choose another time", async () => {
  answerAvailability(freeDay);
  renderBooker("nachhilfe");

  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  fireEvent.click(screen.getByRole("radio", { name: /Physik/ }));
  fireEvent.click(screen.getByRole("button", { name: /zurück/i }));
  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  const aside = within(screen.getByRole("complementary"));
  expect(aside.queryByText(/Physik/)).toBeNull();
});

test("the legal note links the terms, the withdrawal information and the privacy policy", async () => {
  answerAvailability(freeDay);
  renderBooker("nachhilfe");

  await fillLessonForm();
  const href = (name: string) =>
    screen.getByRole("link", { name }).getAttribute("href");
  expect(href("AGB")).toBe("/agb");
  expect(href("Widerrufsbelehrung")).toBe("/agb#widerruf");
  expect(href("Datenschutzerklärung")).toBe("/datenschutz");
});

test("the free first meeting asks for no early start and shows no order summary", async () => {
  answerAvailability(freeDay);
  renderBooker("kennenlernen");

  fireEvent.click(await screen.findByRole("button", { name: "10:00 Uhr" }));
  expect(screen.getByText("Deine Daten")).toBeDefined();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByText(/ · /)).toBeNull();
  expect(screen.queryByText(/Zahlung per Rechnung/)).toBeNull();
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
  const failed = await screen.findByRole("heading", {
    name: "Das hat nicht ganz geklappt",
  });
  expect(
    within(failed.parentElement!).getByText(
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
