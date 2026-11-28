import { expect, test } from "vitest";

import { disallowedPaths, indexablePaths } from "@/lib/routes";
import { pageTitle, titledPaths } from "./page-titles";

test("every page of the site is reported with its tab title", () => {
  const pages = [...indexablePaths, ...disallowedPaths].sort();
  expect([...titledPaths].sort()).toEqual(pages);
  for (const path of pages) expect(pageTitle(path), path).toBeTruthy();
});

test("a page is named as its browser tab names it", () => {
  expect(pageTitle("/")).toBe(
    "Online-Nachhilfe für Mathe, Informatik und Physik",
  );
  expect(pageTitle("/zahlung")).toBe(
    "Rechnung bezahlen – Nachhilfe Leon Weimann",
  );
  expect(pageTitle("/nicht-da")).toBe(undefined);
});
