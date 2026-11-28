/**
 * /agb shows the AGB tree (spec `docs/specs/documents.md`, A1b): the text of
 * the page's `<article>` is the text of `getDocument("agb")`, block by block,
 * so the renderer neither drops nor adds a word. Unlike the wording fixture
 * next to it, this test stays for good.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import {
  documentTextLines,
  getDocument,
  type Form,
} from "@skillsite/documents";
import { visibleTextLines } from "@/test/visible-text";

import AgbPage from "./page";

const agb = getDocument("agb");
const article = () => {
  const found = new DOMParser()
    .parseFromString(renderToStaticMarkup(<AgbPage />), "text/html")
    .querySelector("article");
  if (!found) throw new Error("/agb renders no <article>");
  return found;
};

/** Every form in a tree's body, nested ones included. */
function formsIn(value: unknown): Form[] {
  if (Array.isArray(value)) return value.flatMap(formsIn);
  if (value === null || typeof value !== "object") return [];
  const node = value as { type?: unknown; children?: unknown };
  return node.type === "form" ? [node as Form] : formsIn(node.children);
}

test("the article of /agb shows the AGB's text, block by block", () => {
  expect(visibleTextLines(article().outerHTML)).toEqual(
    documentTextLines(agb.body),
  );
});

test("the withdrawal form's first line, the provider's address, is plain text without a link", () => {
  const [form] = formsIn(agb.body);
  const first = form?.children[0];
  expect(first?.type).toBe("formLine");
  const lines = [...article().querySelectorAll("p")].filter(
    (p) => p.textContent === (first?.type === "formLine" ? first.text : null),
  );
  expect(lines).toHaveLength(1);
  expect(lines[0]?.querySelector("a")).toBeNull();
});

test("the hero title keeps its soft hyphen, so a phone breaks it as Geschäfts-/bedingungen", () => {
  const h1 = new DOMParser()
    .parseFromString(renderToStaticMarkup(<AgbPage />), "text/html")
    .querySelector("h1");
  expect(h1?.textContent).toBe("Allgemeine Geschäfts\u00ADbedingungen");
});
