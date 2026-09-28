import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { brandColors } from "./colors";

const themeCss = readFileSync(
  new URL("../../styles/tokens.css", import.meta.url),
  "utf8",
);

/** The value of `--name` in the first block whose selector is `selector`. */
function rawToken(selector: string, name: string) {
  const start = themeCss.indexOf(`${selector} {`);
  const block = themeCss.slice(start, themeCss.indexOf("}", start));
  return new RegExp(`--${name}:\\s*([^;]+);`).exec(block)?.[1];
}

test("brandColors mirror the raw tokens of tokens.css", () => {
  expect(brandColors.bg).toBe(rawToken(":root", "bg"));
  expect(brandColors.bgDark).toBe(rawToken('[data-theme="dark"]', "bg"));
  expect(brandColors.surface).toBe(rawToken(":root", "surface"));
  expect(brandColors.ink).toBe(rawToken(":root", "ink"));
  expect(brandColors.inkSoft).toBe(rawToken(":root", "ink-soft"));
  expect(brandColors.navy).toBe(rawToken(":root", "navy"));
  expect(brandColors.coral).toBe(rawToken(":root", "coral"));
});
