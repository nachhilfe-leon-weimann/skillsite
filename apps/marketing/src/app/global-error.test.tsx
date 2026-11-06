import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

import { brandColors } from "@skillsite/ui/tokens/colors";

import { ErrorState } from "./_components/error-state";
import GlobalError from "./global-error";

// next/font only runs inside the Next build; the classes stand in for its output.
vi.mock("@skillsite/ui/shell/fonts", () => ({
  fontVariables: "mock-bricolage mock-hanken",
}));

// The real ErrorState, observed: the document cannot go into a Testing Library
// container (an <html> inside a <div>), so the retry is read from its props.
vi.mock("./_components/error-state", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./_components/error-state")>();
  return { ...original, ErrorState: vi.fn(original.ErrorState) };
});

// next-themes reads the system preference; jsdom has no matchMedia.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});

/** The document global-error.tsx renders, parsed as a browser would. */
function renderDocument() {
  const markup = renderToStaticMarkup(
    <GlobalError error={new Error("layout failed")} retry={() => {}} />,
  );
  return new DOMParser().parseFromString(markup, "text/html");
}

test("a root layout error renders a German document with the brand fonts", () => {
  const { documentElement } = renderDocument();
  expect(documentElement.lang).toBe("de");
  expect(documentElement.className).toBe("mock-bricolage mock-hanken");
});

test("a root layout error keeps the site's page frame", () => {
  const { body } = renderDocument();
  expect(body.className).toBe("flex min-h-dvh flex-col");
  expect(body.querySelector("main#main")).not.toBeNull();
});

test("a root layout error names the tab after the error", () => {
  const document = renderDocument();
  expect(document.head.querySelector("title")?.textContent).toBe(
    "Ein Fehler ist aufgetreten – Nachhilfe Leon Weimann",
  );
});

test("a root layout error keeps the phone layout and the browser bar colours", () => {
  const { head } = renderDocument();
  const viewports = head.querySelectorAll('meta[name="viewport"]');
  expect(viewports).toHaveLength(1);
  expect(viewports[0]?.getAttribute("content")).toBe(
    "width=device-width, initial-scale=1, viewport-fit=cover",
  );
  const themeColors = [...head.querySelectorAll('meta[name="theme-color"]')];
  expect(
    themeColors.map((meta) => [
      meta.getAttribute("media"),
      meta.getAttribute("content"),
    ]),
  ).toEqual([
    ["(prefers-color-scheme: light)", brandColors.bg],
    ["(prefers-color-scheme: dark)", brandColors.bgDark],
  ]);
});

test("a root layout error shows the error page", () => {
  const { body } = renderDocument();
  expect(body.querySelector("main h1")?.textContent).toBe(
    "Da ist etwas schiefgelaufen.",
  );
});

test("“Nochmal versuchen” on a root layout error retries the layout once", () => {
  // Next passes both: `retry` re-fetches and re-renders the layout, `reset` only re-renders it.
  const retry = vi.fn();
  const reset = vi.fn();
  renderToStaticMarkup(
    <GlobalError
      {...({
        error: new Error("layout failed"),
        retry,
        reset,
      } as ComponentProps<typeof GlobalError>)}
    />,
  );
  // The button calls `onRetry` once per click (error-state.test.tsx).
  vi.mocked(ErrorState).mock.lastCall?.[0].onRetry();
  expect(retry).toHaveBeenCalledTimes(1);
  expect(reset).not.toHaveBeenCalled();
});
