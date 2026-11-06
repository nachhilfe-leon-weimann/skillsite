import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { ErrorState } from "./error-state";

afterEach(cleanup);

test("the error page says that something went wrong", () => {
  render(<ErrorState onRetry={() => {}} />);
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Da ist etwas schiefgelaufen.",
    }),
  ).toBeDefined();
});

test("“Nochmal versuchen” retries once per click", () => {
  const onRetry = vi.fn();
  render(<ErrorState onRetry={onRetry} />);
  fireEvent.click(screen.getByRole("button", { name: "Nochmal versuchen" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test("“Kontakt aufnehmen” leads to the contact page", () => {
  render(<ErrorState onRetry={() => {}} />);
  expect(
    screen
      .getByRole("link", { name: "Kontakt aufnehmen" })
      .getAttribute("href"),
  ).toBe("/kontakt");
});
