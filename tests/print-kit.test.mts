/**
 * The print kit (`packages/print-kit`) keeps its own copies of the brand's colours and logo, so that it carries no
 * dependency on the rest of the workspace (docs/specs/documents.md, E-02). These tests keep the copies equal to the
 * web's originals, and the kit free of the business's data, which reaches it only as arguments.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

import {
  brand,
  domains,
  provider,
} from "../packages/documents/src/provider.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const kit = path.join(root, "packages/print-kit");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

type Rgba = [number, number, number, number];

/** `#rrggbb`, `rgb(r, g, b)` or `rgba(r, g, b, a)` as CSS writes them. */
function cssColour(value: string): Rgba | undefined {
  const hex = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex)
    return [...hex.slice(1).map((pair) => parseInt(pair, 16)), 1] as Rgba;
  const fn = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (fn)
    return [Number(fn[1]), Number(fn[2]), Number(fn[3]), Number(fn[4] ?? 1)];
  return undefined;
}

/** The light theme's literal colours: every `:root` block of tokens.css, by custom property name. */
function webColours(): Map<string, Rgba> {
  const css = read("packages/ui/styles/tokens.css");
  const colours = new Map<string, Rgba>();
  for (const [, block] of css.matchAll(/^:root \{([^}]*)\}/gm)) {
    for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      const colour = cssColour(value.trim());
      if (colour) colours.set(name, colour);
    }
  }
  return colours;
}

/** Every binding of tokens.typ, which holds one `#let <name> = rgb(...)` per line and nothing else. */
function printColours(): Map<string, Rgba> {
  const source = read("packages/print-kit/src/tokens.typ");
  const colours = new Map<string, Rgba>();
  for (const line of source.split("\n").filter((l) => l.startsWith("#let"))) {
    const match = line.match(/^#let ([\w-]+) = rgb\((.+)\)$/);
    assert.ok(match, `tokens.typ: not a colour binding: ${line}`);
    const [, name, args] = match;
    const hex = args.match(/^"(#[0-9a-f]{6})"$/i);
    const parts = args.match(/^(\d+), (\d+), (\d+), (\d+)%$/);
    assert.ok(
      hex || parts,
      `tokens.typ: write ${name} as rgb("#rrggbb") or rgb(r, g, b, a%)`,
    );
    colours.set(
      name,
      hex
        ? cssColour(hex[1])!
        : [
            Number(parts![1]),
            Number(parts![2]),
            Number(parts![3]),
            Number(parts![4]) / 100,
          ],
    );
  }
  return colours;
}

test("every print colour except logo-ink is the web's light value of the same name", () => {
  const web = webColours();
  const print = printColours();

  assert.ok(print.has("logo-ink"));
  assert.ok(print.size > 1);
  for (const [name, colour] of print) {
    if (name === "logo-ink") continue;
    assert.ok(web.has(name), `tokens.css has no light colour --${name}`);
    assert.deepEqual(colour, web.get(name), `--${name}`);
  }
});

test("the print logo is the web logo, byte for byte", () => {
  const kitLogo = readFileSync(path.join(kit, "assets/logo-icon.png"));
  const webLogo = readFileSync(
    path.join(root, "apps/marketing/public/logo-icon.png"),
  );
  assert.ok(kitLogo.equals(webLogo));
});

test("the print kit holds none of the business's data", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return entry.name === ".cache" || entry.name === "node_modules"
          ? []
          : files(file);
      }
      return /\.(ttf|png)$/.test(entry.name) ? [] : [file];
    });
  const data = [
    brand.name,
    brand.tagline,
    provider.businessName,
    provider.ownerName,
    provider.street,
    provider.email,
    provider.phone,
    ...Object.values(domains),
  ];

  const sources = files(kit);
  assert.ok(sources.some((file) => file.endsWith("lib.typ")));
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const value of data) {
      assert.ok(
        !text.includes(value),
        `${path.relative(root, file)} contains "${value}"`,
      );
    }
  }
});
