/**
 * The page fields of a web document: the schema requires them for a `web`
 * target, and `webMeta` hands them to a page with their type.
 */
import { expect, test } from "vitest";

import { webMeta, type DocumentMeta } from "./index.ts";

const meta: DocumentMeta = {
  title: "Testbedingungen",
  shortTitle: "Test",
  badge: "Probe",
  lead: "Ein Lead.",
  description: "Eine Beschreibung.",
  version: "1",
  effectiveDate: "2026-07-14",
  effectiveDateLabel: "Juli 2026",
  targets: ["web", "pdf"],
  sections: { numbered: true, nav: true },
};

test("a web document's meta carries the fields of its page", () => {
  expect(webMeta(meta)).toBe(meta);
});

test("a document without a web target, or without a page field, is no web document", () => {
  expect(() => webMeta({ ...meta, targets: ["pdf"] })).toThrow(
    '"Testbedingungen" is no web document: targets pdf',
  );
  expect(() => webMeta({ ...meta, lead: undefined })).toThrow(
    '"Testbedingungen" is no web document: targets web, pdf; missing lead',
  );
});
