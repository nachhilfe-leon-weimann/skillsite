import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { DESKTOP_NAV_QUERY } from "./breakpoints";

const globalsCss = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("the JS navbar query and the header height use the CSS nav breakpoint", () => {
  const token = /--breakpoint-nav:\s*([^;]+);/.exec(globalsCss)?.[1];
  expect(token).toBe("67.5rem");
  expect(DESKTOP_NAV_QUERY).toBe(`(min-width: ${token})`);
  expect(globalsCss).toContain(`@media (width >= ${token})`);
});
