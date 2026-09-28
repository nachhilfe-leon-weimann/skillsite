import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Reveal } from "../motion/reveal";
import { Card } from "./card";

// Reveal's in-view path observes its element; jsdom has no IntersectionObserver.
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

test("the default card is the raised surface with its radius first", () => {
  render(<Card className="p-6">Karte</Card>);
  expect(screen.getByText("Karte").className).toBe(
    "rounded-2xl border border-line bg-surface shadow-card p-6",
  );
});

test("each surface is its own set of border, background and shadow", () => {
  render(
    <>
      <Card surface="flat">flat</Card>
      <Card surface="inset">inset</Card>
      <Card surface="subtle">subtle</Card>
      <Card surface="doc" radius="xl">
        doc
      </Card>
      <Card surface="frame" radius="3xl">
        frame
      </Card>
      <Card surface="glass">glass</Card>
    </>,
  );
  const classes = (text: string) => screen.getByText(text).className;
  expect(classes("flat")).toBe("rounded-2xl border border-line bg-surface");
  expect(classes("inset")).toBe("rounded-2xl border border-line bg-bg");
  expect(classes("subtle")).toBe("rounded-2xl border border-line bg-surface-2");
  expect(classes("doc")).toBe("rounded-xl border border-line bg-surface-2/60");
  expect(classes("frame")).toBe("rounded-3xl border border-line shadow-card");
  expect(classes("glass")).toBe(
    "rounded-2xl border border-overlay-12 bg-overlay-8",
  );
});

test("tones replace the surface: inverse is navy, accent is the coral gradient", () => {
  render(
    <>
      <Card tone="inverse" surface="inset" radius="callout">
        navy
      </Card>
      <Card tone="accent" lift="sm" className="shadow-glow-md">
        coral
      </Card>
    </>,
  );
  expect(screen.getByText("navy").className).toBe(
    "bg-navy shadow-card rounded-callout",
  );
  expect(screen.getByText("coral").className).toBe(
    "bg-coral-gradient text-white rounded-2xl lift [--lift:-0.25rem] shadow-glow-md",
  );
});

test("a lifting card on the default tone also takes the coral hover border", () => {
  render(
    <Card asChild lift="md" className="group p-6">
      <a href="/faecher">Fächer</a>
    </Card>,
  );
  const link = screen.getByRole("link", { name: "Fächer" });
  expect(link.getAttribute("href")).toBe("/faecher");
  expect(link.className).toBe(
    "rounded-2xl lift [--lift:-0.375rem] border border-line bg-surface shadow-card hover:border-coral group p-6",
  );
});

test("Reveal as={Card} is one element with the reveal and the card classes", () => {
  render(
    <Reveal as={Card} surface="inset" variant="rise-soft" className="p-6">
      Schritt
    </Reveal>,
  );
  const card = screen.getByText("Schritt");
  expect(card.tagName).toBe("DIV");
  expect(card.parentElement?.tagName).toBe("DIV");
  expect(card.parentElement?.className).toBe("");
  expect(card.className).toBe(
    "rounded-2xl border border-line bg-bg reveal p-6",
  );
  expect(card.dataset.reveal).toBe("rise-soft");
});
