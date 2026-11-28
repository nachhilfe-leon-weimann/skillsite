/**
 * The registry (E-04): every node type is declared once, and the schema the
 * build and `getDocument` validate with rejects what it does not declare.
 */
import { expect, test } from "vitest";

import {
  documentTreeSchema,
  lineText,
  nodeSchemas,
  nodeTypes,
} from "./index.ts";

/** One valid node of every registered type. */
const samples = {
  section: {
    type: "section",
    id: "a",
    number: 1,
    title: "A",
    heading: "1. A",
    navLabel: "A",
    children: [
      {
        type: "paragraph",
        weight: "regular",
        children: [{ type: "text", value: "x" }],
      },
    ],
  },
  subsection: {
    type: "subsection",
    title: "T",
    children: [{ type: "contactAddress", lines: ["x"] }],
  },
  group: {
    type: "group",
    title: "T",
    children: [{ type: "contactAddress", lines: ["x"] }],
  },
  paragraph: {
    type: "paragraph",
    weight: "medium",
    children: [{ type: "text", value: "x" }],
  },
  list: { type: "list", items: [[{ type: "text", value: "x" }]] },
  legalBasis: {
    type: "legalBasis",
    label: "L:",
    children: [{ type: "text", value: "x" }],
  },
  providerLink: {
    type: "providerLink",
    href: "https://example.org/p",
    text: "x",
  },
  linkList: {
    type: "linkList",
    links: [
      {
        type: "link",
        kind: "external",
        href: "https://example.org",
        text: "x",
      },
    ],
  },
  detailGrid: {
    type: "detailGrid",
    children: [
      {
        type: "detailList",
        title: "T",
        items: [[{ type: "text", value: "x" }]],
      },
    ],
  },
  detailList: {
    type: "detailList",
    title: "T",
    items: [[{ type: "text", value: "x" }]],
  },
  entry: {
    type: "entry",
    children: [{ type: "contactAddress", lines: ["x"] }],
  },
  contactAddress: { type: "contactAddress", lines: ["x"] },
  panel: {
    type: "panel",
    children: [{ type: "contactAddress", lines: ["x"] }],
  },
  form: {
    type: "form",
    children: [
      { type: "field", label: "x" },
      { type: "formNote", text: "x" },
    ],
  },
  formLine: { type: "formLine", text: "x" },
  field: { type: "field", label: "x" },
  signature: { type: "signature", label: "x" },
  formNote: { type: "formNote", text: "x" },
  text: { type: "text", value: "x" },
  break: { type: "break" },
  link: { type: "link", kind: "route", href: "/preise", text: "x" },
};

test("every registered node type is declared under its own name", () => {
  expect(Object.keys(samples).sort()).toEqual([...nodeTypes].sort());
  for (const type of nodeTypes) {
    expect(nodeSchemas[type].parse(samples[type])).toMatchObject({ type });
  }
});

test("no text holds a line end: only a break ends a line", () => {
  expect(lineText.safeParse("Ein Satz.").success).toBe(true);
  expect(lineText.safeParse("Ein\nSatz.").success).toBe(false);
  expect(lineText.safeParse("Ein\r\nSatz.").success).toBe(false);
  expect(
    nodeSchemas.text.safeParse({ type: "text", value: "a\nb" }).success,
  ).toBe(false);
});

test("a form's note is its last line", () => {
  const form = (children: unknown[]) =>
    nodeSchemas.form.safeParse({ type: "form", children });
  expect(
    form([
      { type: "field", label: "x" },
      { type: "formNote", text: "x" },
    ]).success,
  ).toBe(true);
  expect(
    form([
      { type: "formNote", text: "x" },
      { type: "field", label: "x" },
    ]).success,
  ).toBe(false);
});

const tree = (body: unknown[], overrides: Record<string, unknown> = {}) => ({
  slug: "test",
  meta: {
    title: "T",
    version: "1",
    effectiveDate: "2026-07-14",
    effectiveDateLabel: "Juli 2026",
    targets: ["pdf"],
    sections: { numbered: true, nav: true },
  },
  labels: { effectiveDate: "Stand", contact: "Kontakt", page: "Seite" },
  nav: [{ id: "a", label: "A" }],
  body,
  ...overrides,
});

test("a document tree of registered nodes passes", () => {
  expect(documentTreeSchema.safeParse(tree([samples.section])).success).toBe(
    true,
  );
});

test("a node type outside the registry fails the tree", () => {
  const result = documentTreeSchema.safeParse(
    tree([{ ...samples.section, children: [{ type: "table", rows: [] }] }]),
  );
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.path).toEqual([
    "body",
    0,
    "children",
    0,
    "type",
  ]);
});

test("numbers, headings, navigation and anchor targets must agree with the sections", () => {
  const fails = (body: unknown[], overrides?: Record<string, unknown>) =>
    documentTreeSchema.safeParse(tree(body, overrides)).success === false;

  expect(fails([{ ...samples.section, number: 2 }])).toBe(true);
  expect(fails([{ ...samples.section, heading: "A" }])).toBe(true);
  expect(fails([samples.section], { nav: [] })).toBe(true);
  expect(
    fails([
      {
        ...samples.section,
        children: [
          {
            type: "paragraph",
            weight: "regular",
            children: [
              {
                type: "link",
                kind: "anchor",
                href: "#fehlt",
                text: "Abschnitt 9",
              },
            ],
          },
        ],
      },
    ]),
  ).toBe(true);
  expect(fails([samples.section, samples.paragraph])).toBe(true);
});
