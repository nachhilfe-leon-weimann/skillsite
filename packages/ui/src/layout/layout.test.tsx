import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Container } from "./container";
import { PageHeader } from "./page-header";
import { Section } from "./section";

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

test("Container has the page width by default and named narrower sizes", () => {
  render(
    <>
      <Container>Seite</Container>
      <Container size="faq">FAQ</Container>
      <Container size="testimonials">Stimmen</Container>
    </>,
  );
  expect(screen.getByText("Seite").className).toBe(
    "mx-auto w-full max-w-page px-6",
  );
  expect(screen.getByText("FAQ").className).toBe("mx-auto max-w-205 px-6");
  expect(screen.getByText("Stimmen").className).toBe("mx-auto max-w-220 px-6");
});

test("Section wraps its content in a Container with the section rhythm", () => {
  render(
    <>
      <Section id="faq" surface>
        Inhalt
      </Section>
      <Section spacing="sm">Kompakt</Section>
    </>,
  );
  const content = screen.getByText("Inhalt");
  expect(content.className).toBe("mx-auto w-full max-w-page px-6 py-section");
  expect(content.parentElement?.tagName).toBe("SECTION");
  expect(content.parentElement?.className).toBe(
    "border-y border-line bg-surface",
  );
  expect(screen.getByText("Kompakt").className).toBe(
    "mx-auto w-full max-w-page px-6 py-section-sm",
  );
});

test("the page variant is the route's h1 intro inside a Container", () => {
  render(<PageHeader eyebrow="Fächer" title="Titel" lead="Einleitung" />);
  const heading = screen.getByRole("heading", { level: 1, name: "Titel" });
  const container = heading.parentElement!.parentElement!;
  expect(container.className).toBe(
    "mx-auto w-full max-w-page px-6 pt-page-top pb-page-header-bottom",
  );
  expect(screen.getByText("Einleitung").parentElement?.className).toContain(
    "mt-5",
  );
});

test("the section variant is an h2 intro, revealed in view", () => {
  render(
    <PageHeader
      variant="section"
      eyebrow="Ablauf"
      title="So läuft es"
      lead="Kurz erklärt"
      size="h3"
      className="mb-6"
    />,
  );
  const heading = screen.getByRole("heading", {
    level: 2,
    name: "So läuft es",
  });
  expect(heading.className).toContain("text-h3");
  const wrapper = heading.parentElement!.parentElement!;
  expect(wrapper.tagName).toBe("DIV");
  expect(wrapper.className).toBe("mb-6");
  expect(heading.parentElement?.className).toContain("reveal");
  expect(screen.getByText("Kurz erklärt").parentElement?.className).toContain(
    "mt-4",
  );
});
