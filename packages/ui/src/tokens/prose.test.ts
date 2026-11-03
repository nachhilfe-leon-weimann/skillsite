import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { expect, test } from "vitest";

const require = createRequire(import.meta.url);
const themeCss = readFileSync(
  new URL("../../styles/tokens.css", import.meta.url),
  "utf8",
);
const tailwindTheme = readFileSync(
  require.resolve("tailwindcss/theme.css"),
  "utf8",
);

/** The value of a custom property declared in a stylesheet. */
function value(css: string, name: string) {
  return new RegExp(`^\\s*--${name}:\\s*([^;]+);`, "m").exec(css)?.[1];
}

/** Each prose token is one of Tailwind's default sizes, value for value. */
const proseTokens: Record<string, string> = {
  "prose-h2": "2xl",
  "prose-h3": "lg",
  "prose-sm": "sm",
  "prose-xs": "xs",
};

/** UI role sizes that keep one of Tailwind's default sizes (C4), value for value. */
const uiTokens: Record<string, string> = {
  "accordion-icon": "xl",
  "button-sm": "sm",
  note: "sm",
  "skip-link": "sm",
  tag: "xs",
};

for (const [prose, size] of Object.entries({ ...proseTokens, ...uiTokens })) {
  test(`--text-${prose} is Tailwind's text-${size}`, () => {
    expect(value(themeCss, `text-${prose}`)).toBe(
      value(tailwindTheme, `text-${size}`),
    );
    expect(value(themeCss, `text-${prose}--line-height`)).toBe(
      value(tailwindTheme, `text-${size}--line-height`),
    );
  });
}

test("--text-prose-body is the body size with leading-7", () => {
  expect(value(themeCss, "text-prose-body")).toBe("1rem");
  // leading-7 = calc(var(--spacing) * 7) = 7 * 0.25rem
  expect(value(tailwindTheme, "spacing")).toBe("0.25rem");
  expect(value(themeCss, "text-prose-body--line-height")).toBe("1.75rem");
});
