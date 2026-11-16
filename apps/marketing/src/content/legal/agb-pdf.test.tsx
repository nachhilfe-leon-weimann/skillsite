import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { agbSections } from "@/content/agb";
import { AgbProse, agbPage } from "@/content/legal/agb";
import { legalPdfData } from "@/lib/legal-pdf/data";
import { legalPdfDir } from "@/lib/legal-pdf/sources";
import { typstParagraphs } from "@/lib/legal-pdf/typst-text";

/*
 * The PDFs (legal-pdf/*.typ) carry the same wording as /agb, paragraph by paragraph. A text change on one side only
 * fails here; after fixing the other side, `just legal-pdfs` rebuilds the PDFs (build-stamp.test.ts checks that).
 */

afterEach(cleanup);

/** One paragraph as a reader sees it: whitespace collapsed, soft hyphens gone. */
const normalize = (text: string) =>
  text.replace(/­/g, "").replace(/\s+/g, " ").trim();

/** The elements that hold a paragraph of /agb's prose: headings, paragraphs, list and table cells. */
const BLOCKS = "h2, h3, h4, p, li, dt, dd, th, td";

/** The paragraphs of /agb's prose in order, the innermost block of each text; no text may sit outside a block. */
function siteParagraphs(scope?: string): string[] {
  const { container } = render(<AgbProse />);
  const root = scope ? container.querySelector(scope) : container;
  if (!root) throw new Error(`No ${scope} in the AGB`);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    if (node.textContent?.trim() && !node.parentElement?.closest(BLOCKS))
      throw new Error(
        `"${node.textContent.trim()}" sits outside ${BLOCKS}: extend BLOCKS`,
      );
  return [...root.querySelectorAll(BLOCKS)]
    .filter((element) => !element.querySelector(BLOCKS))
    .map((element) => normalize(element.textContent ?? ""))
    .filter(Boolean);
}

function pdfParagraphs(document: string): string[] {
  return typstParagraphs(
    document,
    (file) => readFileSync(path.join(legalPdfDir, file), "utf8"),
    legalPdfData(),
  ).map(normalize);
}

/** Lines /agb shows that the PDFs leave out on purpose. */
const siteOnly = {
  /** The link to the withdrawal PDF below the model form. */
  formPdfLink: agbPage.formPdf.label,
  /** The withdrawal PDF has its own title instead of the AGB's section heading. */
  withdrawalHeading: agbSections.heading("widerruf"),
};

/**
 * Lines the PDFs show that /agb leaves out: none among the compared paragraphs. The PDF-only text is the template's
 * (title, subtitle, "Stand", footer), which the reader never sees, and the address `#web-link` prints after a
 * linked word, which the reader drops.
 */
const pdfOnly: string[] = [];

const without = (paragraphs: string[], drop: string[]) =>
  paragraphs.filter((paragraph) => !drop.includes(paragraph));

const fix =
  "Change the same paragraph in apps/marketing/legal-pdf/ (agb.typ or parts/withdrawal-*.typ), then run `just legal-pdfs`";

describe("the legal PDFs say what /agb says", () => {
  test("the AGB PDF has every paragraph of /agb, in order, and no other", () => {
    expect(without(pdfParagraphs("agb.typ"), pdfOnly), fix).toEqual(
      without(siteParagraphs(), [siteOnly.formPdfLink]),
    );
  });

  test("the withdrawal PDF has every paragraph of the withdrawal section, in order, and no other", () => {
    expect(
      without(pdfParagraphs("widerrufsbelehrung.typ"), pdfOnly),
      fix,
    ).toEqual(
      without(siteParagraphs("#widerruf"), [
        siteOnly.formPdfLink,
        siteOnly.withdrawalHeading,
      ]),
    );
  });

  test("the lines left out on purpose are still on /agb", () => {
    const paragraphs = siteParagraphs();
    for (const line of Object.values(siteOnly))
      expect(paragraphs).toContain(line);
  });
});
