/**
 * The build writes the trees and the versions, and an error in a document
 * stops it with its file and line and a non-zero exit code.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";

import { buildDocuments } from "./build.ts";
import { inSection, SECTION_BODY, source } from "./parse/fixtures.ts";
import { documentsFileSchema } from "./schema/index.ts";

let root: string;
const contentDir = () => path.join(root, "content");
const outDir = () => path.join(root, "dist");
const write = (file: string, text: string) => {
  const target = path.join(contentDir(), file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
};
const output = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(outDir(), file), "utf8"));

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "documents-build-"));
  mkdirSync(contentDir());
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

test("with no documents, the build writes empty trees and versions", () => {
  buildDocuments({ contentDir: contentDir(), outDir: outDir() });
  expect(output("documents.json")).toEqual({});
  expect(output("meta.json")).toEqual({});
});

test("the build writes every document's tree, keyed by slug, and its version and dates", () => {
  write("partials/teil.md", "Ein Satz aus dem Teil.\n");
  write("eins.md", source(inSection('::include{src="teil"}')));
  write("zwei.md", source(inSection("Text."), { version: "v2" }));

  buildDocuments({ contentDir: contentDir(), outDir: outDir() });

  const documents = documentsFileSchema.parse(output("documents.json"));
  expect(Object.keys(documents)).toEqual(["eins", "zwei"]);
  expect(JSON.stringify(documents.eins?.body)).toContain(
    "Ein Satz aus dem Teil.",
  );
  expect(output("meta.json")).toEqual({
    eins: {
      version: "2026-07-14",
      effectiveDate: "2026-07-14",
      effectiveDateLabel: "Juli 2026",
    },
    zwei: {
      version: "v2",
      effectiveDate: "2026-07-14",
      effectiveDateLabel: "Juli 2026",
    },
  });
});

test("an error in a document stops the build with its file and line and exit code 1", () => {
  write("kaputt.md", source(inSection("::contact-adress")));

  const run = spawnSync(
    process.execPath,
    [
      path.join(import.meta.dirname, "build.ts"),
      "--content",
      contentDir(),
      "--out",
      outDir(),
    ],
    { encoding: "utf8" },
  );

  expect(run.status).toBe(1);
  expect(run.stderr.trim()).toBe(
    `content/kaputt.md:${SECTION_BODY}: unknown directive ::contact-adress`,
  );
});
