import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { CenteredState } from "./centered-state";
import { StatusPage } from "./status-page";

afterEach(cleanup);

test("CenteredState: icon circle, an h3 title, then the message", () => {
  render(
    <CenteredState icon={<svg data-testid="icon" />} title="Termin gebucht!">
      <p>Die Bestätigung kommt per E-Mail.</p>
    </CenteredState>,
  );
  const heading = screen.getByRole("heading", {
    level: 3,
    name: "Termin gebucht!",
  });
  expect(heading.className).toBe(
    "font-heading text-balance hyphens-heading text-h4 mb-2",
  );
  const circle = screen.getByTestId("icon").parentElement!;
  expect(circle.tagName).toBe("DIV");
  expect(circle.className).toBe(
    "flex items-center justify-center size-14 rounded-full bg-accent-tint-16 mx-auto mb-4",
  );
  expect(circle.parentElement?.className).toBe(
    "m-auto max-w-sm text-center motion-safe:animate-rise [--reveal-travel:6px] motion-safe:[animation-delay:80ms]",
  );
  expect(heading.nextElementSibling?.textContent).toBe(
    "Die Bestätigung kommt per E-Mail.",
  );
});

test("StatusPage: eyebrow, h1, lead, actions, then the extra lines", () => {
  render(
    <StatusPage
      eyebrow="Fehler 404"
      title="Seite nicht gefunden."
      lead="Diese Seite gibt es nicht."
      actions={<a href="/">Zur Startseite</a>}
    >
      <p>Alle Kontaktwege</p>
    </StatusPage>,
  );
  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Seite nicht gefunden.",
  });
  const page = heading.parentElement!;
  expect(page.className).toBe(
    "mx-auto w-full max-w-page px-6 flex min-h-[60vh] flex-col items-center justify-center py-section text-center",
  );
  expect([...page.children].map((child) => child.textContent?.trim())).toEqual([
    "Fehler 404",
    "Seite nicht gefunden.",
    "Diese Seite gibt es nicht.",
    "Zur Startseite",
    "Alle Kontaktwege",
  ]);
  expect(screen.getByText("Diese Seite gibt es nicht.").className).toBe(
    "text-lead text-ink-soft mt-4 max-w-measure-34",
  );
  expect(screen.getByRole("link").parentElement?.className).toBe(
    "mt-8 flex flex-wrap justify-center gap-3.5",
  );
});
