import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

// The analytics host may only appear where the server reports to it and where
// the privacy policy names it; no page loads a tracker in the visitor's browser.
const SRC = path.resolve(import.meta.dirname, "..");
const ANALYTICS_HOST = "insights.leonweimann.de";
const MAY_NAME_THE_HOST = ["lib/analytics/umami.ts", "content/privacy.ts"];

const sourceFiles = readdirSync(SRC, { recursive: true, encoding: "utf8" })
  .filter((file) => /\.(?:ts|tsx|mts)$/.test(file))
  .filter((file) => !/\.test\.(?:ts|tsx|mts)$/.test(file))
  .map((file) => file.split(path.sep).join("/"));

test("no page loads an analytics script in the visitor's browser", () => {
  expect(sourceFiles).toContain("app/layout.tsx");
  for (const file of sourceFiles) {
    const source = readFileSync(path.join(SRC, file), "utf8");
    expect(source, file).not.toMatch(/from "next\/script"/);
    expect(source, file).not.toMatch(/window\.umami|script\.js/);
    if (!MAY_NAME_THE_HOST.includes(file)) {
      expect(source, file).not.toContain(ANALYTICS_HOST);
    }
  }
});

test("the analytics sender stays on the server", () => {
  for (const file of ["lib/analytics/umami.ts", "lib/analytics/send.ts"]) {
    const source = readFileSync(path.join(SRC, file), "utf8");
    expect(source, file).toMatch(/^import "server-only";/);
  }
});
