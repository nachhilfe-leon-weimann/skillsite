import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Card } from "./card";
import { CheckList } from "./check-list";
import { InfoRow } from "./info-row";
import { Pill } from "./pill";

// The check marks observe their element; jsdom has no IntersectionObserver.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("Pill is a rounded label with a tone and a size, and no display of its own", () => {
  render(
    <>
      <Pill tone="inverse" size="sm">
        Discord
      </Pill>
      <Pill as="div" tone="muted" size="doc" className="inline-flex">
        Datenschutz
      </Pill>
    </>,
  );
  expect(screen.getByText("Discord").className).toBe(
    "rounded-full border border-overlay-25 text-white px-3.5 py-1.5 text-small font-semibold",
  );
  const badge = screen.getByText("Datenschutz");
  expect(badge.tagName).toBe("DIV");
  expect(badge.className).toBe(
    "rounded-full border border-line bg-surface-2 text-ink-soft px-3 py-1 text-prose-sm inline-flex",
  );
});

test("CheckList renders each item behind a check mark, in two sizes and tones", () => {
  render(
    <>
      <CheckList items={["Vorbereitung"]} className="mt-2" />
      <CheckList items={["Bildschirm teilen"]} size="sm" tone="inverse" />
    </>,
  );
  const item = screen.getByText("Vorbereitung");
  expect(item.className).toBe("text-body text-ink");
  expect(item.parentElement?.className).toBe("flex items-start gap-3");
  expect(item.previousElementSibling?.getAttribute("class")).toBe(
    "mt-0.5 shrink-0 size-5 text-coral",
  );
  expect(item.parentElement?.parentElement?.className).toBe(
    "flex flex-col gap-3.5 mt-2",
  );
  const small = screen.getByText("Bildschirm teilen");
  expect(small.className).toBe("text-small");
  expect(small.parentElement?.className).toBe(
    "flex items-start gap-2.5 text-on-navy",
  );
  expect(small.previousElementSibling?.getAttribute("class")).toBe(
    "mt-0.5 shrink-0 size-4.5 text-coral-light",
  );
});

test("InfoRow puts the icon in its badge next to the value", () => {
  render(
    <>
      <InfoRow icon="☎">Telefon</InfoRow>
      <Card
        asChild
        surface="inset"
        className="mx-auto mb-5 max-w-xs p-3.5 text-left"
      >
        <InfoRow variant="summary" icon="◷" label="Dein Termin">
          Montag, 10:00 Uhr
        </InfoRow>
      </Card>
      <InfoRow variant="doc" icon="✉" label="Kontakt" className="p-3">
        mail@example.com
      </InfoRow>
    </>,
  );
  const inverse = screen.getByText("Telefon");
  expect(inverse.className).toBe("text-small");
  expect(inverse.parentElement?.className).toBe(
    "flex items-center gap-3 text-on-navy",
  );
  expect(screen.getByText("☎").className).toBe(
    "flex items-center justify-center size-8 rounded-lg bg-overlay-8 text-accent-blue shrink-0",
  );
  expect(screen.getByText("Dein Termin").tagName).toBe("P");
  expect(screen.getByText("Montag, 10:00 Uhr").className).toBe(
    "font-heading font-bold text-ink",
  );
  // The booking confirmation (no scenario renders it): card and row are one element.
  const summary =
    screen.getByText("Montag, 10:00 Uhr").parentElement!.parentElement!;
  expect(summary.className.split(" ").sort().join(" ")).toBe(
    "bg-bg border border-line flex gap-3 items-center max-w-xs mb-5 mx-auto p-3.5 rounded-2xl text-left",
  );
  expect(screen.getByText("◷").className).toBe(
    "flex items-center justify-center size-9 rounded-lg bg-accent-tint-12 text-coral shrink-0",
  );
  const doc = screen.getByText("mail@example.com");
  expect(doc.className).toBe("truncate text-prose-sm font-medium text-ink");
  expect(doc.parentElement?.parentElement?.className).toBe(
    "flex items-center gap-3 p-3",
  );
  expect(screen.getByText("✉").className).toBe(
    "grid place-items-center size-9 rounded-md bg-surface-2 text-ink-soft shrink-0",
  );
});
