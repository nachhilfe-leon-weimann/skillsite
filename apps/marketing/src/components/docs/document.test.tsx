/**
 * The web renderer of the document trees (spec `docs/specs/documents.md`,
 * E-04): it covers every registered node type, and a page shows exactly the
 * text of the tree it renders. Synthetic trees only; the legal pages have their
 * own tests next to them.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import {
  documentTextLines,
  nodeTypes,
  type BodyBlock,
  type FlowBlock,
  type Inline,
  type NodeType,
} from "@skillsite/documents";
import { visibleTextLines } from "@/test/visible-text";

import { DocumentBody, renderers } from "./document";

const text = (value: string): Inline => ({ type: "text", value });
const paragraph = (
  value: string,
  weight: "regular" | "medium" = "regular",
): FlowBlock => ({ type: "paragraph", weight, children: [text(value)] });

/** A body with one node of every registered type and one link of every kind. */
const body: BodyBlock[] = [
  paragraph("Ein Satz vor dem ersten Abschnitt."),
  {
    type: "section",
    id: "erster",
    number: 1,
    title: "Erster",
    heading: "1. Erster",
    navLabel: "Erster",
    children: [
      {
        type: "paragraph",
        weight: "regular",
        children: [
          text("Siehe "),
          {
            type: "link",
            kind: "anchor",
            href: "#zweiter",
            text: "Abschnitt 2",
          },
          text(", "),
          { type: "link", kind: "route", href: "/preise", text: "die Preise" },
          text(" und "),
          {
            type: "link",
            kind: "external",
            href: "https://example.org/a",
            text: "ein Beispiel",
          },
          text("."),
          { type: "break" },
          text("Post an "),
          {
            type: "link",
            kind: "mailto",
            href: "mailto:post@example.org",
            text: "post@example.org",
          },
          text(", Telefon "),
          {
            type: "link",
            kind: "tel",
            href: "tel:+49 30 1234567",
            text: "+49 30 1234567",
          },
        ],
      },
      paragraph("Fett gesetzt.", "medium"),
      { type: "list", items: [[text("ein Punkt")], [text("ein zweiter")]] },
      {
        type: "legalBasis",
        label: "Grundlage:",
        children: [text("Art. 1 eines Beispiels.")],
      },
      {
        type: "providerLink",
        href: "https://example.org/privacy",
        text: "Hinweise des Beispiels",
      },
      {
        type: "linkList",
        links: [
          {
            type: "link",
            kind: "external",
            href: "https://example.org/b",
            text: "Beispiel B",
          },
        ],
      },
      {
        type: "detailGrid",
        children: [
          { type: "detailList", title: "Angaben", items: [[text("Datum")]] },
        ],
      },
      { type: "entry", children: [paragraph("Ein Eintrag.")] },
      {
        type: "contactAddress",
        lines: ["Musterfirma", "Erika Muster", "Musterweg 1", "12345 Muster"],
      },
      paragraph("Nach der Anschrift."),
    ],
  },
  {
    type: "section",
    id: "zweiter",
    number: 2,
    title: "Zweiter",
    heading: "2. Zweiter",
    navLabel: "Zweiter",
    children: [
      {
        type: "group",
        title: "Eine Gruppe",
        children: [
          {
            type: "panel",
            children: [
              {
                type: "subsection",
                title: "Ein Formular",
                children: [
                  {
                    type: "form",
                    children: [
                      { type: "formLine", text: "An die Musterfirma:" },
                      { type: "field", label: "Name (*)" },
                      { type: "signature", label: "Unterschrift" },
                      { type: "formNote", text: "(*) Streichen." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const page = () =>
  new DOMParser().parseFromString(
    renderToStaticMarkup(
      <article>
        <DocumentBody body={body} />
      </article>,
    ),
    "text/html",
  );

/** Every node type in a body, nested ones included. */
function typesIn(value: unknown): NodeType[] {
  if (Array.isArray(value)) return value.flatMap(typesIn);
  if (value === null || typeof value !== "object") return [];
  const node = value as Record<string, unknown>;
  const own = typeof node.type === "string" ? [node.type as NodeType] : [];
  return [...own, ...Object.values(node).flatMap(typesIn)];
}

test("the renderer map has one renderer for every registered node type", () => {
  expect(Object.keys(renderers).sort()).toEqual([...nodeTypes].sort());
  // The synthetic body holds every type, so the tests below reach every renderer.
  expect([...new Set(typesIn(body))].sort()).toEqual([...nodeTypes].sort());
});

test("a rendered body shows exactly the text of its tree, block by block", () => {
  const article = page().querySelector("article")!;
  expect(visibleTextLines(article.outerHTML)).toEqual(documentTextLines(body));
});

test("every link is a text link to its target", () => {
  const links = [...page().querySelectorAll("p a")].map((link) => [
    link.getAttribute("href"),
    link.textContent,
  ]);
  expect(links).toEqual([
    ["#zweiter", "Abschnitt 2"],
    ["/preise", "die Preise"],
    ["https://example.org/a", "ein Beispiel"],
    ["mailto:post@example.org", "post@example.org"],
    ["tel:+49 30 1234567", "+49 30 1234567"],
    ["https://example.org/privacy", "Hinweise des Beispiels"],
  ]);
});

test("a paragraph right after the contact address keeps its distance (mt-6), no other paragraph does", () => {
  const spaced = [...page().querySelectorAll("p.mt-6")].map(
    (p) => p.textContent,
  );
  expect(spaced).toEqual(["Nach der Anschrift."]);
});

test("a medium paragraph is set in font-medium", () => {
  const medium = [
    ...page().querySelectorAll("p.text-prose-body.font-medium"),
  ].map((p) => p.textContent);
  expect(medium).toEqual(["Fett gesetzt."]);
});
