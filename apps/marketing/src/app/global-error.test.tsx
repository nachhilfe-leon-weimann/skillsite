import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

import GlobalError from "./global-error";

// next/font only runs inside the Next build; the classes stand in for its output.
vi.mock("@skillsite/ui/shell/fonts", () => ({
  fontVariables: "mock-bricolage mock-hanken",
}));

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
    <GlobalError error={new Error("layout failed")} reset={() => {}} />,
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

test("a root layout error shows the error page", () => {
  const { body } = renderDocument();
  expect(body.querySelector("main h1")?.textContent).toBe(
    "Da ist etwas schiefgelaufen.",
  );
});
