import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { cn } from "./cn";

test("the later of two conflicting utilities wins", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("falsy inputs are dropped", () => {
  expect(cn("a", false, undefined, null, "b")).toBe("a b");
});

test("a type-scale size and a text colour both survive", () => {
  expect(cn("text-eyebrow text-coral")).toBe("text-eyebrow text-coral");
  expect(cn("text-lead", "text-ink-soft")).toBe("text-lead text-ink-soft");
  expect(cn("text-ink-soft text-small")).toBe("text-ink-soft text-small");
});

test("two font sizes conflict, scale tokens and Tailwind sizes alike", () => {
  expect(cn("text-eyebrow text-lead")).toBe("text-lead");
  expect(cn("text-sm text-small")).toBe("text-small");
  expect(cn("text-h4 text-base")).toBe("text-base");
});

test("the card shadow conflicts with shadows, not with shadow colours", () => {
  expect(cn("shadow-card shadow-none")).toBe("shadow-none");
  expect(cn("shadow-card shadow-coral/20")).toBe("shadow-card shadow-coral/20");
});

test("the coral gradient is a background image, not a background colour", () => {
  expect(cn("bg-coral-gradient bg-navy")).toBe("bg-coral-gradient bg-navy");
  expect(cn("bg-coral-gradient bg-none")).toBe("bg-none");
});

test("motion tokens conflict within their group", () => {
  expect(cn("duration-quick duration-200")).toBe("duration-200");
  expect(cn("duration-base duration-slow")).toBe("duration-slow");
  expect(cn("ease-flow ease-out")).toBe("ease-out");
  expect(cn("animate-rise animate-none")).toBe("animate-none");
});

test("section paddings conflict with spacing utilities", () => {
  expect(cn("py-section py-4")).toBe("py-4");
  expect(cn("py-section py-section-sm")).toBe("py-section-sm");
  expect(cn("pt-section py-section")).toBe("py-section");
  expect(cn("pb-section pb-0")).toBe("pb-0");
  expect(cn("pb-section pb-section-sm")).toBe("pb-section-sm");
});

test("the page width conflicts with max-width utilities", () => {
  expect(cn("max-w-page max-w-none")).toBe("max-w-none");
});

test("fluid spacings conflict with the spacing utilities of their side", () => {
  expect(cn("p-panel p-4")).toBe("p-4");
  expect(cn("gap-split gap-4")).toBe("gap-4");
  expect(cn("gap-x-panel-booker-main gap-x-2")).toBe("gap-x-2");
  expect(cn("p-panel px-4")).toBe("p-panel px-4");
});

test("stacking tokens conflict with z utilities", () => {
  expect(cn("z-sticky z-10")).toBe("z-10");
  expect(cn("z-raised z-overlay")).toBe("z-overlay");
});

test("role sizes are font sizes and colour tokens are colours", () => {
  expect(cn("text-button text-ink")).toBe("text-button text-ink");
  expect(cn("text-digit-lg text-coral")).toBe("text-digit-lg text-coral");
  expect(cn("text-on-accent-90 text-small")).toBe(
    "text-on-accent-90 text-small",
  );
  expect(cn("bg-accent-tint-14 bg-surface")).toBe("bg-surface");
});

// Drift guard: every token and utility of the theme must be known to `cn`.
// styles/theme.css is the entry file; its parts are read in its @import order.
const stylesDir = new URL("../../styles/", import.meta.url);
const themeParts = [
  ...readFileSync(new URL("theme.css", stylesDir), "utf8").matchAll(
    /^@import "\.\/([a-z-]+\.css)";$/gm,
  ),
].map((match) => match[1]!);
const themeCss = themeParts
  .map((part) => readFileSync(new URL(part, stylesDir), "utf8"))
  .join("\n");

test("theme.css imports its parts in a fixed order", () => {
  expect(themeParts).toEqual([
    "tokens.css",
    "base.css",
    "components.css",
    "motion.css",
  ]);
});

/** Every custom property declared inside an `@theme` block (brace depth aware). */
const themeTokens = [...themeCss.matchAll(/@theme\b[^{]*\{/g)].flatMap(
  (match) => {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < themeCss.length) {
      if (themeCss[end] === "{") depth++;
      if (themeCss[end] === "}") depth--;
      end++;
    }
    const body = themeCss.slice(match.index + match[0].length, end - 1);
    return [...body.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]!);
  },
);

/** For each utility namespace: a Tailwind utility that must override the token. */
const namespaceConflicts: Record<string, [prefix: string, winner: string]> = {
  color: ["bg", "bg-white"],
  font: ["font", "font-mono"],
  radius: ["rounded", "rounded-none"],
  shadow: ["shadow", "shadow-none"],
  container: ["max-w", "max-w-none"],
  spacing: ["p", "p-4"],
  "z-index": ["z", "z-10"],
  text: ["text", "text-sm"],
  ease: ["ease", "ease-linear"],
  "transition-duration": ["duration", "duration-200"],
  animate: ["animate", "animate-none"],
};

/** Namespaces that generate no utility: plain variables for CSS. */
const plainNamespaces = ["reveal", "default-transition"];

/**
 * Tailwind namespaces that share a prefix with a registered one but are not
 * registered in `cn`: a token there must not pass as, say, a `--font-*` token.
 */
const unregisteredNamespaces = [
  "font-weight",
  "text-shadow",
  "inset-shadow",
  "drop-shadow",
  "tracking",
  "leading",
  "breakpoint",
  "blur",
  "perspective",
  "aspect",
];

/** The namespace of a token: the longest matching one (`--font-weight-x` is font-weight). */
function namespaceOf(token: string) {
  return [
    ...Object.keys(namespaceConflicts),
    ...plainNamespaces,
    ...unregisteredNamespaces,
  ]
    .filter((namespace) => token.startsWith(`--${namespace}-`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Token names of one namespace, e.g. `--text-lead` -> `lead` (skips `--text-lead--line-height`). */
function tokens(namespace: string): string[] {
  return themeTokens
    .filter((token) => namespaceOf(token) === namespace)
    .map((token) => token.slice(namespace.length + 3))
    .filter((name) => !name.includes("--"));
}

test("every @theme token belongs to a registered or a plain namespace", () => {
  const known = [...Object.keys(namespaceConflicts), ...plainNamespaces];
  const unknown = themeTokens.filter(
    (token) => !known.includes(namespaceOf(token) ?? ""),
  );
  expect(unknown).toEqual([]);
  for (const namespace of plainNamespaces) {
    expect(tokens(namespace).length, namespace).toBeGreaterThan(0);
  }
});

for (const [namespace, [prefix, winner]] of Object.entries(
  namespaceConflicts,
)) {
  test(`every --${namespace}-* token is registered in cn`, () => {
    const names = tokens(namespace);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(cn(`${prefix}-${name}`, winner), `${prefix}-${name}`).toBe(winner);
    }
  });
}

test("no colour token is read as a font size", () => {
  for (const name of tokens("color")) {
    expect(cn(`text-${name} text-small`), name).toBe(`text-${name} text-small`);
  }
});

/** For each @utility: a class it must conflict with, or null when it has no conflicting group. */
const utilityConflicts: Record<string, string | null> = {
  "bg-coral-gradient": "bg-none",
  "py-section": "py-4",
  "py-section-sm": "py-4",
  "pt-section": "pt-4",
  "pb-section": "pb-4",
  "pb-section-sm": "pb-4",
  "hyphens-heading": "hyphens-none",
  "no-scrollbar": null,
  lift: null,
};

test("every @utility of theme.css is registered in cn", () => {
  const utilities = [...themeCss.matchAll(/^@utility ([a-z0-9-]+)/gm)].map(
    (match) => match[1]!,
  );
  expect(utilities.sort()).toEqual(Object.keys(utilityConflicts).sort());
  for (const [utility, winner] of Object.entries(utilityConflicts)) {
    if (winner) expect(cn(utility, winner), utility).toBe(winner);
  }
});
