/**
 * /datenschutz shows the privacy policy's tree (spec `docs/specs/documents.md`,
 * A2): the text of the page's `<article>` is the text of
 * `getDocument("datenschutz")`, block by block, so the renderer neither drops
 * nor adds a word. Unlike the wording fixture next to it, this test stays for
 * good.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { documentTextLines, getDocument } from "@skillsite/documents";
import { visibleTextLines } from "@/test/visible-text";

import DatenschutzPage from "./page";

const privacy = getDocument("datenschutz");
const article = () => {
  const found = new DOMParser()
    .parseFromString(renderToStaticMarkup(<DatenschutzPage />), "text/html")
    .querySelector("article");
  if (!found) throw new Error("/datenschutz renders no <article>");
  return found;
};

test("the article of /datenschutz shows the privacy policy's text, block by block", () => {
  expect(visibleTextLines(article().outerHTML)).toEqual(
    documentTextLines(privacy.body),
  );
});

test("every section reference jumps to the section whose number it names", () => {
  const page = article();
  const references = [...page.querySelectorAll('a[href^="#"]')];
  expect(references.length).toBeGreaterThan(0);
  for (const reference of references) {
    const id = reference.getAttribute("href")!.slice(1);
    const heading = page.querySelector(`section[id="${id}"] > h2`);
    const number = reference.textContent?.match(/^Abschnitt (\d+)$/)?.[1];
    expect(number, reference.outerHTML).toBeDefined();
    expect(heading?.textContent).toMatch(new RegExp(`^${number}\\. `));
  }
});

test("the hero title keeps its soft hyphen, so a phone breaks it as Datenschutz-/erklärung", () => {
  const h1 = new DOMParser()
    .parseFromString(renderToStaticMarkup(<DatenschutzPage />), "text/html")
    .querySelector("h1");
  expect(h1?.textContent).toBe("Datenschutz\u00ADerklärung");
});
