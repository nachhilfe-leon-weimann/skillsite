import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import type { WithdrawalResult } from "../model/config";
import { submitWithdrawal } from "../server/actions";
import { WithdrawalForm } from "./withdrawal-form";

vi.mock("../server/actions", () => ({ submitWithdrawal: vi.fn() }));

const send = vi.mocked(submitWithdrawal);

afterEach(() => {
  cleanup();
  send.mockReset();
});

// Synthetic data only.
const entries = {
  name: "Erika Beispiel",
  email: "erika@example.com",
  contract: "Gebuchter Termin am 24.11.2026",
};

function fill(values: Partial<typeof entries> = entries) {
  const labels = {
    name: "Name",
    email: "E-Mail-Adresse für die Eingangsbestätigung",
    contract: "Welchen Vertrag möchten Sie widerrufen?",
  };
  for (const [key, value] of Object.entries(values)) {
    fireEvent.change(
      screen.getByLabelText(labels[key as keyof typeof labels], {
        exact: false,
      }),
      { target: { value } },
    );
  }
}

const withdraw = () =>
  fireEvent.click(screen.getByRole("button", { name: "Vertrag widerrufen" }));
const confirm = () =>
  fireEvent.click(screen.getByRole("button", { name: "Widerruf bestätigen" }));

/** Renders the form, fills it and reaches the review step. */
function reachReview() {
  render(<WithdrawalForm />);
  fill();
  withdraw();
}

test("missing details keep the form open, name what to correct and send nothing", () => {
  render(<WithdrawalForm />);
  fill({ name: "Erika Beispiel" });
  withdraw();

  expect(screen.getByRole("alert").textContent).toBe(
    "Bitte prüfen Sie die markierten Angaben.",
  );
  expect(
    screen.getByLabelText("E-Mail-Adresse für die Eingangsbestätigung", {
      exact: false,
    }),
  ).toHaveProperty("ariaInvalid", "true");
  expect(document.activeElement?.id).toBe("withdrawal-email");
  expect(screen.queryByRole("button", { name: "Widerruf bestätigen" })).toBe(
    null,
  );
  expect(send).not.toHaveBeenCalled();
});

test("'Vertrag widerrufen' leads to a review of the declaration with 'Widerruf bestätigen'", () => {
  reachReview();

  const title = screen.getByRole("heading", {
    name: "Bitte prüfen Sie Ihre Angaben",
  });
  expect(document.activeElement).toBe(title);
  expect(
    screen.getByText("Hiermit widerrufe ich den folgenden Vertrag."),
  ).toBeTruthy();
  for (const value of Object.values(entries)) {
    expect(screen.getByText(value)).toBeTruthy();
  }
  expect(
    screen.getByRole("button", { name: "Widerruf bestätigen" }),
  ).toBeTruthy();
  // Reviewing sends nothing yet.
  expect(send).not.toHaveBeenCalled();
});

test("the way back keeps the details for editing", () => {
  reachReview();
  fireEvent.click(screen.getByRole("button", { name: "Angaben ändern" }));
  expect(screen.getByLabelText("Name", { exact: false })).toHaveProperty(
    "value",
    entries.name,
  );
});

test("a confirmed withdrawal shows its receipt once the action reports it sent", async () => {
  send.mockResolvedValue({
    outcome: "sent",
    receivedAt: "16.11.2026, 22:41:05 MEZ",
  });
  reachReview();
  confirm();

  await screen.findByRole("heading", { name: "Widerruf eingegangen" });
  expect(
    screen.getAllByText(/16\.11\.2026, 22:41:05 MEZ/).length,
  ).toBeGreaterThan(0);
  expect(screen.getByRole("status").textContent).toContain(
    "Widerruf eingegangen",
  );
  expect(send).toHaveBeenCalledExactlyOnceWith({
    values: { ...entries, note: "" },
    honeypot: "",
    fillDurationMs: expect.any(Number),
  });
});

test.each<[string, WithdrawalResult, string]>([
  ["not sent", { outcome: "not_sent" }, "Keine Eingangsbestätigung"],
  ["unknown", { outcome: "unknown" }, "Übermittlung nicht bestätigt"],
  [
    "rate limited",
    { outcome: "rejected", reason: "rate_limited" },
    "Zu viele Anfragen",
  ],
  [
    "blocked",
    { outcome: "rejected", reason: "blocked" },
    "Widerruf nicht übermittelt",
  ],
])(
  "%s: no success is claimed, the e-mail address is offered instead",
  async (_case, result, title) => {
    send.mockResolvedValue(result);
    reachReview();
    confirm();

    await screen.findByRole("heading", { name: title });
    expect(screen.queryByText("Widerruf eingegangen")).toBe(null);
    expect(
      screen.getByRole("link", { name: "nachhilfe@leonweimann.de" }),
    ).toHaveProperty(
      "href",
      "mailto:nachhilfe@leonweimann.de?subject=Widerruf",
    );
  },
);

test("a request that breaks is reported as unknown, never as sent", async () => {
  send.mockRejectedValue(new Error("offline"));
  reachReview();
  confirm();
  await screen.findByRole("heading", { name: "Übermittlung nicht bestätigt" });
});

test("too fast for the time trap: confirming again sends once more", async () => {
  send
    .mockResolvedValueOnce({ outcome: "rejected", reason: "too_fast" })
    .mockResolvedValueOnce({
      outcome: "sent",
      receivedAt: "16.11.2026, 22:41:05 MEZ",
    });
  reachReview();
  confirm();

  fireEvent.click(
    await screen.findByRole("button", { name: "Widerruf erneut bestätigen" }),
  );
  await screen.findByRole("heading", { name: "Widerruf eingegangen" });
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
});
