import assert from "node:assert/strict";
import { test } from "vitest";

import { numberedSections } from "./numbered-sections";

const registry = numberedSections([
  { id: "first", label: "First", title: "The first section" },
  { id: "second", label: "Second", title: "The second section" },
]);

test("sections are numbered from 1 in their order", () => {
  assert.equal(registry.number("first"), 1);
  assert.equal(registry.number("second"), 2);
});

test("a heading is the section's number and its title", () => {
  assert.equal(registry.heading("first"), "1. The first section");
  assert.equal(registry.heading("second"), "2. The second section");
});

test("an unknown section has no number and no heading", () => {
  assert.equal(registry.number("missing"), 0);
  assert.equal(registry.heading("missing"), "");
});

test("the registry hands the sections on unchanged, for the page navigation", () => {
  const sections = [{ id: "only", label: "Only", title: "Only section" }];
  assert.equal(numberedSections(sections).sections, sections);
});
