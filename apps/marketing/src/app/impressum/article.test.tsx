/**
 * /impressum shows the Impressum's tree (spec `docs/specs/documents.md`, A2):
 * the text of the page's `<article>` is the text of `getDocument("impressum")`,
 * block by block, so the renderer neither drops nor adds a word. Unlike the
 * wording fixture next to it, this test stays for good.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { documentTextLines, getDocument } from "@skillsite/documents";
import { visibleTextLines } from "@/test/visible-text";

import ImpressumPage from "./page";

const impressum = getDocument("impressum");
const page = () =>
  new DOMParser().parseFromString(
    renderToStaticMarkup(<ImpressumPage />),
    "text/html",
  );

test("the article of /impressum shows the Impressum's text, block by block", () => {
  const article = page().querySelector("article");
  if (!article) throw new Error("/impressum renders no <article>");
  expect(visibleTextLines(article.outerHTML)).toEqual(
    documentTextLines(impressum.body),
  );
});

test("/impressum shows no date and no section navigation, although its frontmatter has a date", () => {
  const text = visibleTextLines(page().body.outerHTML);
  expect(text).not.toContain(impressum.labels.effectiveDate);
  expect(text.join(" ")).not.toContain(impressum.meta.effectiveDateLabel);
  expect(page().querySelector("nav, aside")).toBeNull();
});
