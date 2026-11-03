import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { CardGrid } from "./card-grid";
import { Split } from "./split";

afterEach(cleanup);

test("Split is a two-column grid: align, gap, then the column ratio", () => {
  render(
    <>
      <Split>Standard</Split>
      <Split align="stretch" gap="5" ratio="1.25/1">
        Kontakt
      </Split>
    </>,
  );
  expect(screen.getByText("Standard").className).toBe(
    "grid items-center gap-split lg:grid-cols-2",
  );
  expect(screen.getByText("Kontakt").className).toBe(
    "grid items-stretch gap-5 lg:grid-cols-[1.25fr_1fr]",
  );
});

test("CardGrid is a card grid: gap, then the columns per breakpoint", () => {
  render(
    <>
      <CardGrid>Drei</CardGrid>
      <CardGrid gap="4" columns="sm-2">
        Zwei
      </CardGrid>
      <CardGrid columns="sm-2-lg-3" className="gap-6">
        Mehr
      </CardGrid>
    </>,
  );
  expect(screen.getByText("Drei").className).toBe("grid gap-5 sm:grid-cols-3");
  expect(screen.getByText("Zwei").className).toBe("grid gap-4 sm:grid-cols-2");
  expect(screen.getByText("Mehr").className).toBe(
    "grid sm:grid-cols-2 lg:grid-cols-3 gap-6",
  );
});
