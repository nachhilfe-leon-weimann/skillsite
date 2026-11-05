import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, expect, test, vi } from "vitest";

import ErrorPage from "./error";

afterEach(cleanup);

test("“Nochmal versuchen” on a page error retries the failed segment once", () => {
  const error = new Error("page failed");
  // Only the boundary's own log of the error stays silent; React warnings still surface.
  const log = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (args.length !== 1 || args[0] !== error) log(...args);
  });
  // Next passes both: `retry` re-fetches and re-renders the segment, `reset` only re-renders it.
  const retry = vi.fn();
  const reset = vi.fn();
  render(
    <ErrorPage
      {...({ error, retry, reset } as ComponentProps<typeof ErrorPage>)}
    />,
  );
  expect(console.error).toHaveBeenCalledWith(error);
  fireEvent.click(screen.getByRole("button", { name: "Nochmal versuchen" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(reset).not.toHaveBeenCalled();
});
