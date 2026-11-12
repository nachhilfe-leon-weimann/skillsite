import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

// next/font's @font-face rules follow the import order: imported after the global
// stylesheet they move to the end of the built CSS (the C5 font spike).
test("the root layout imports the brand fonts before the global stylesheet", () => {
  const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
  const fonts = source.indexOf('from "@skillsite/ui/shell/fonts";');
  const globals = source.indexOf('import "./globals.css";');
  expect(fonts, "the fonts import").toBeGreaterThan(-1);
  expect(globals, "the globals.css import").toBeGreaterThan(-1);
  expect(fonts, "fonts before globals.css").toBeLessThan(globals);
});
