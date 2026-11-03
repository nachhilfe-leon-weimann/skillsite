import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { IconBadge } from "./icon-badge";
import { IconButton } from "./icon-button";

afterEach(cleanup);

test("IconButton is a round bordered button with a size, a surface and hover feedback", () => {
  render(
    <>
      <IconButton aria-label="Zurück" size="sm" className="shrink-0" />
      <IconButton aria-label="Weiter" size="lg" surface="inset" />
    </>,
  );
  const back = screen.getByRole("button", { name: "Zurück" });
  expect(back.getAttribute("type")).toBe("button");
  expect(back.className).toBe(
    "flex items-center justify-center rounded-full border border-line text-ink size-9 bg-surface transition-colors hover:border-ink shrink-0",
  );
  expect(screen.getByRole("button", { name: "Weiter" }).className).toBe(
    "flex items-center justify-center rounded-full border border-line text-ink size-11 bg-bg transition-colors hover:border-ink",
  );
});

test("only an IconButton with a disabled prop carries the disabled look", () => {
  render(
    <IconButton aria-label="Vorheriger Monat" size="sm" disabled={false} />,
  );
  expect(
    screen.getByRole("button", { name: "Vorheriger Monat" }).className,
  ).toBe(
    "flex items-center justify-center rounded-full border border-line text-ink size-9 bg-surface transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40",
  );
});

test("IconButton forwards onClick, and disabled blocks it", () => {
  const onClick = vi.fn();
  render(
    <>
      <IconButton aria-label="Weiter" onClick={onClick} />
      <IconButton aria-label="Zurück" onClick={onClick} disabled />
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  fireEvent.click(screen.getByRole("button", { name: "Zurück" }));
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("a className display wins over the base flex (the menu toggle)", () => {
  render(<IconButton aria-label="Menü" hover="none" className="inline-flex" />);
  expect(screen.getByRole("button", { name: "Menü" }).className).toBe(
    "items-center justify-center rounded-full border border-line text-ink size-10 bg-surface inline-flex",
  );
});

test("IconBadge centres its icon at a measured size, shape and tone", () => {
  render(
    <>
      <IconBadge>Standard</IconBadge>
      <IconBadge as="div" size="14" shape="full" tone="accent-16">
        Zustand
      </IconBadge>
      <IconBadge size="8" shape="lg" tone="inverse" className="shrink-0">
        Navy
      </IconBadge>
      <IconBadge layout="grid" size="9" shape="md" tone="muted">
        Raster
      </IconBadge>
      <IconBadge size="9" shape="lg" tone="accent-12" className="shrink-0">
        Termin
      </IconBadge>
    </>,
  );
  const badge = screen.getByText("Standard");
  expect(badge.tagName).toBe("SPAN");
  expect(badge.className).toBe(
    "flex items-center justify-center size-10 rounded-xl bg-accent-tint-14 text-coral",
  );
  const state = screen.getByText("Zustand");
  expect(state.tagName).toBe("DIV");
  expect(state.className).toBe(
    "flex items-center justify-center size-14 rounded-full bg-accent-tint-16",
  );
  expect(screen.getByText("Navy").className).toBe(
    "flex items-center justify-center size-8 rounded-lg bg-overlay-8 text-accent-blue shrink-0",
  );
  expect(screen.getByText("Raster").className).toBe(
    "grid place-items-center size-9 rounded-md bg-surface-2 text-ink-soft",
  );
  // The booking confirmation's badge (no scenario renders it).
  expect(screen.getByText("Termin").className).toBe(
    "flex items-center justify-center size-9 rounded-lg bg-accent-tint-12 text-coral shrink-0",
  );
});
