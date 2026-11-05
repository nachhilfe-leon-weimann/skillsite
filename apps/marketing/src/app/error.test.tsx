import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, expect, test, vi } from "vitest";

import ErrorPage from "./error";

afterEach(cleanup);

test("“Nochmal versuchen” on a page error retries the failed segment once", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  // Next passes both: `retry` re-fetches and re-renders the segment, `reset` only re-renders it.
  const retry = vi.fn();
  const reset = vi.fn();
  render(
    <ErrorPage
      {...({ error: new Error("page failed"), retry, reset } as ComponentProps<
        typeof ErrorPage
      >)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Nochmal versuchen" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(reset).not.toHaveBeenCalled();
});
