import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

const layout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

// next/font's @font-face rules follow the import order: imported after the global
// stylesheet they move to the end of the built CSS (the C5 font spike).
test("the brand fonts are imported before the global stylesheet", () => {
  const fonts = layout.indexOf('from "@skillsite/ui/shell/fonts";');
  const globals = layout.indexOf('import "./globals.css";');
  expect(fonts, "the fonts import").toBeGreaterThan(-1);
  expect(globals, "the globals.css import").toBeGreaterThan(-1);
  expect(fonts, "fonts before globals.css").toBeLessThan(globals);
});
