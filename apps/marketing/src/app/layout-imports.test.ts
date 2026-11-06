import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

// next/font's @font-face rules follow the import order: imported after the global
// stylesheet they move to the end of the built CSS (the C5 font spike). Both
// documents import them: the root layout, and global-error.tsx in its place.
test.each(["layout.tsx", "global-error.tsx"])(
  "%s imports the brand fonts before the global stylesheet",
  (file) => {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    const fonts = source.indexOf('from "@skillsite/ui/shell/fonts";');
    const globals = source.indexOf('import "./globals.css";');
    expect(fonts, "the fonts import").toBeGreaterThan(-1);
    expect(globals, "the globals.css import").toBeGreaterThan(-1);
    expect(fonts, "fonts before globals.css").toBeLessThan(globals);
  },
);
