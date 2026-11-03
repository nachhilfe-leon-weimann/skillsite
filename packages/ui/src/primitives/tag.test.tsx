import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Tag } from "./tag";

afterEach(cleanup);

test("Tag tones are named by role: accent by default, inverse, outline", () => {
  render(
    <>
      <Tag>Neu</Tag>
      <Tag tone="inverse">Abitur</Tag>
      <Tag tone="outline">Oberstufe</Tag>
    </>,
  );
  expect(screen.getByText("Neu").className).toContain("text-coral");
  expect(screen.getByText("Abitur").className).toContain("bg-navy text-white");
  expect(screen.getByText("Oberstufe").className).toContain(
    "border border-line text-ink-soft",
  );
});
