import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { agbEffectiveDate } from "@/content/agb";
import { legalContact } from "@/content/legal-contact";
import { printedAddress } from "@/lib/routes";
import { legalPdfDocuments } from "./data";
import {
  fileHash,
  legalPdfDir,
  legalPdfSourceFiles,
  legalPdfSourceHash,
  publicFile,
  readBuildStamp,
} from "./sources";

/** Every Typst source below `legal-pdf/` with its text. */
const typstSources = () =>
  legalPdfSourceFiles()
    .filter((file) => file.endsWith(".typ"))
    .map(
      (file) =>
        [file, readFileSync(path.join(legalPdfDir, file), "utf8")] as const,
    );

const rebuild =
  "Run `just legal-pdfs` (needs Typst) and commit the PDFs and legal-pdf/build-stamp.json.";

describe("the legal PDFs are built from the current sources", () => {
  test("the build stamp matches the Typst sources, fonts and generated data", () => {
    expect(
      readBuildStamp().sources,
      `The AGB text, its data or legal-pdf/ changed since the PDFs were built. ${rebuild}`,
    ).toBe(legalPdfSourceHash());
  });

  test("the PDFs in public/ are the ones the build stamp records", () => {
    const { pdfs } = readBuildStamp();
    expect(Object.keys(pdfs).sort()).toEqual(
      legalPdfDocuments.map(({ output }) => output).sort(),
    );
    for (const { output } of legalPdfDocuments)
      expect(
        fileHash(publicFile(output)),
        `public${output} is not the built PDF. ${rebuild}`,
      ).toBe(pdfs[output]);
  });

  test("the PDFs carry the AGB's effective date", () => {
    expect(readBuildStamp().effectiveDate, rebuild).toBe(
      agbEffectiveDate.toISOString().slice(0, 10),
    );
  });

  test("no Typst source writes a date of its own", () => {
    const date =
      /\d{4}-\d{2}-\d{2}|\d{1,2}\.\s*\d{1,2}\.\s*\d{2,4}|\d{1,2}\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/;
    for (const [file, source] of typstSources())
      expect(
        source,
        `${file} hard-codes a date: read it from agb.effectiveDateLabel`,
      ).not.toMatch(date);
  });

  test("no Typst source copies the contact data or the site's address", () => {
    for (const [file, source] of typstSources())
      // Not the country: "Deutschland" is also a word of the AGB text.
      for (const value of [
        legalContact.businessName,
        legalContact.ownerName,
        legalContact.street,
        legalContact.city,
        legalContact.email,
        legalContact.phone,
        printedAddress(""),
      ])
        expect(
          source,
          `${file} hard-codes "${value}": read it from #provider or #site`,
        ).not.toContain(value);
  });
});
