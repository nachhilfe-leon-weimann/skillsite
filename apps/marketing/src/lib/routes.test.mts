import assert from "node:assert/strict";
import { test } from "vitest";

import { disallowedPaths, indexablePaths, routes } from "@/lib/routes";

test("the payment link is disallowed and never offered to search engines", () => {
  // robots.txt and sitemap.xml must not contradict each other: submitting a
  // blocked URL is exactly what Search Console reports as an error.
  assert.ok(disallowedPaths.includes(routes.payment));
  assert.ok(!indexablePaths.includes(routes.payment));
});

test("no path is both disallowed and indexable", () => {
  for (const path of disallowedPaths) {
    assert.ok(
      !indexablePaths.includes(path),
      `${path} is disallowed and in the sitemap`,
    );
  }
});

test("public pages are in the sitemap, once and without a hash anchor", () => {
  for (const path of [routes.home, routes.subjects, routes.pricing]) {
    assert.ok(indexablePaths.includes(path), `${path} is missing`);
  }
  // `/faecher` and `/faecher#faq` are one page.
  assert.ok(!indexablePaths.some((path) => path.includes("#")));
  assert.equal(new Set(indexablePaths).size, indexablePaths.length);
});
