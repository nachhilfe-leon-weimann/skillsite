/**
 * The directives of the Markdown dialect (spec `docs/specs/documents.md`,
 * "Node types and their source") and the directive guard (E-18).
 */
import { describe, expect, test } from "vitest";

import { labels } from "../labels.ts";
import { provider } from "../provider.ts";
import { nodeTypes, type DocumentTree } from "../schema/index.ts";
import {
  blocksOf,
  FILE,
  inSection,
  parse,
  parseError,
  SECTION_BODY,
} from "./fixtures.ts";

/** Every node in a tree, nested ones included, in document order. */
function nodesIn(value: unknown): Array<{ type: string; kind?: string }> {
  if (Array.isArray(value)) return value.flatMap(nodesIn);
  if (value === null || typeof value !== "object") return [];
  const node = value as { type?: unknown };
  const own = typeof node.type === "string" ? [node as { type: string }] : [];
  return [...own, ...Object.values(value).flatMap(nodesIn)];
}

const nodesOf = (tree: DocumentTree, type: string) =>
  nodesIn(tree.body).filter((node) => node.type === type);

describe("the directive guard (E-18)", () => {
  test.each([
    "16:00 Uhr",
    "1:2:3",
    "Hinweis:Text",
    "10:30–12:00 Uhr",
    "Kontakt:Ärger",
  ])("the prose %s stays text, colons and all", (prose) => {
    expect(blocksOf(parse(inSection(`Am Montag ${prose} bitte.`)))).toEqual([
      {
        type: "paragraph",
        weight: "regular",
        children: [{ type: "text", value: `Am Montag ${prose} bitte.` }],
      },
    ]);
  });

  test.each([
    ["::contact-adress", "unknown directive ::contact-adress"],
    [":::panle\nText\n:::", "unknown directive :::panle"],
    ["Schreiben Sie an :mailtoo[x].", "unknown directive :mailtoo"],
    ["Um 16:00[Uhr].", "unknown directive :00"],
  ])("the misspelt %s fails with its file and line", (content, reason) => {
    expect(parseError(inSection(content))).toBe(
      `${FILE}:${SECTION_BODY}: ${reason}`,
    );
  });

  test("a known name in the wrong form fails and names the right one", () => {
    expect(parseError(inSection("::subsection[Titel]"))).toBe(
      `${FILE}:${SECTION_BODY}: ::subsection is written :::subsection`,
    );
    expect(parseError(inSection(":::form-line[Text]\n:::"))).toBe(
      `${FILE}:${SECTION_BODY}: :::form-line is written ::form-line`,
    );
  });

  test("a known text directive without its key fails", () => {
    expect(parseError(inSection("Zeit:value bitte."))).toBe(
      `${FILE}:${SECTION_BODY}: :value needs a key: :value[provider.email]`,
    );
  });

  test("an attribute value without quotes fails", () => {
    expect(
      parseError(
        inSection("::provider-link[Anbieter]{href=https://example.org}"),
      ),
    ).toBe(
      `${FILE}:${SECTION_BODY}: quote the attribute values of ::provider-link: key="value"`,
    );
  });

  test("a quoted attribute value may have spaces around its =", () => {
    const quoted = (attributes: string) =>
      blocksOf(parse(inSection(`::provider-link[Anbieter]{${attributes}}`)));
    const tight = quoted('href="https://example.org"');
    expect(quoted('href= "https://example.org"')).toEqual(tight);
    expect(quoted('href = "https://example.org"')).toEqual(tight);
    expect(
      parseError(
        inSection("::provider-link[Anbieter]{href= https://example.org}"),
      ),
    ).toBe(
      `${FILE}:${SECTION_BODY}: quote the attribute values of ::provider-link: key="value"`,
    );
  });

  test("an attribute a directive does not take fails", () => {
    expect(parseError(inSection('::contact-address{tone="leise"}'))).toBe(
      `${FILE}:${SECTION_BODY}: ::contact-address takes no attribute tone`,
    );
    expect(parseError(inSection(":::panel{.box}\nText\n:::"))).toBe(
      `${FILE}:${SECTION_BODY}: :::panel takes no attribute .class`,
    );
  });
});

describe("an e-mail address that is no E-12 data is written out", () => {
  const mailto = {
    type: "link",
    kind: "mailto",
    href: "mailto:stelle@example.org",
    text: "stelle@example.org",
  };

  test.each([
    [
      "as a Markdown link",
      "E-Mail: [stelle@example.org](mailto:stelle@example.org)",
    ],
    ["as a bare address, which GFM links", "E-Mail: stelle@example.org"],
  ])("%s", (_, content) => {
    expect(blocksOf(parse(inSection(content)))).toEqual([
      {
        type: "paragraph",
        weight: "regular",
        children: [{ type: "text", value: "E-Mail: " }, mailto],
      },
    ]);
  });

  test("an address of E-12 data fails and names its placeholder", () => {
    const reason =
      "an e-mail link to E-12 data is :mailto[key], here :mailto[provider.email]";
    expect(
      parseError(
        inSection(`E-Mail: [${provider.email}](mailto:${provider.email})`),
      ),
    ).toBe(`${FILE}:${SECTION_BODY}: ${reason}`);
    expect(parseError(inSection(`E-Mail: ${provider.email}`))).toBe(
      `${FILE}:${SECTION_BODY}: ${reason}`,
    );
  });

  test("an e-mail link whose text is not its address fails", () => {
    expect(
      parseError(inSection("[Schreiben Sie uns](mailto:stelle@example.org)")),
    ).toBe(
      `${FILE}:${SECTION_BODY}: an e-mail link shows its address: [a@b](mailto:a@b) or a bare a@b; for E-12 data it is :mailto[key], such as :mailto[provider.email]`,
    );
  });
});

describe("container fences", () => {
  test("an inner fence with as many colons as its container fails at the inner one", () => {
    // remark closes the outer container at the inner `:::`, and the rest leaks out as text.
    expect(
      parseError(
        inSection(
          ":::entry\n:::legal-basis\nArt. 6 DSGVO.\n:::\nMehr Text.\n:::",
        ),
      ),
    ).toBe(
      `${FILE}:${SECTION_BODY + 1}: :::legal-basis is never closed: close it with a line of 3 colons, and give every container fence more colons than the ones nested inside it`,
    );
  });

  test("a container that is never closed fails at its opening fence", () => {
    expect(parseError(inSection("::::subsection[Titel]\nText"))).toBe(
      `${FILE}:${SECTION_BODY}: :::subsection is never closed: close it with a line of 4 colons, and give every container fence more colons than the ones nested inside it`,
    );
  });

  test("a stray closing fence fails at its line", () => {
    expect(parseError(inSection("Text.\n:::"))).toMatch(
      new RegExp(`^${FILE}:${SECTION_BODY + 1}: stray \`::\``),
    );
  });

  test("a leaf directive that does not stand alone on its line fails", () => {
    expect(parseError(inSection("Text ::field[Datum]"))).toMatch(
      new RegExp(`^${FILE}:${SECTION_BODY}: stray \`::\``),
    );
  });
});

describe("a directive outside its place fails at its line", () => {
  // [source, line of the fault below the first line, reason]
  test.each([
    ["::field[Datum]", 0, "::field stands inside a :::form"],
    [
      ":::detail-list[Titel]\n- a\n:::",
      0,
      ":::detail-list stands inside a ::::detail-grid",
    ],
    [
      ":::form\nText\n:::",
      1,
      "a :::form holds only ::form-line, ::field, ::signature and ::form-note lines",
    ],
    [
      ":::form\n::form-note[Hinweis]\n::field[Datum]\n:::",
      1,
      "::form-note is the last line of a form, and a form has one at most",
    ],
    [
      "::::detail-grid\nText\n::::",
      1,
      "a ::::detail-grid holds only :::detail-list[Title] blocks",
    ],
    [
      ":::legal-basis\nEins.\n\nZwei.\n:::",
      0,
      ":::legal-basis holds one paragraph",
    ],
    [
      ":::link-list\n- [A](https://example.org) und mehr\n:::",
      1,
      "an item of a :::link-list is exactly one link: - [Discord](https://…)",
    ],
    [
      "::::subsection[Titel]\n## Abschnitt :anchor{#b}\n::::",
      1,
      "a section heading (##) stands at the top level, outside every directive",
    ],
    [
      "Text :anchor{#x}",
      0,
      ":anchor ends a section heading: ## Title :anchor{#id}",
    ],
    [
      ":::subsection\nText\n:::",
      0,
      ":::subsection needs a label: :::subsection[…]",
    ],
    [":::entry[Titel]\nText\n:::", 0, ":::entry takes no label"],
    [
      "::provider-link[Anbieter]",
      0,
      '::provider-link needs the attribute href="…"',
    ],
  ])("%s", (content, lineOffset, reason) => {
    expect(parseError(inSection(content))).toBe(
      `${FILE}:${SECTION_BODY + lineOffset}: ${reason}`,
    );
  });

  test("a section heading needs its anchor", () => {
    expect(parseError("## Abschnitt\n\nText\n")).toMatch(
      /: a section heading ends with its anchor/,
    );
  });

  test("two sections with one id", () => {
    expect(
      parseError("## A :anchor{#a}\n\nText\n\n## B :anchor{#a}\n\nText\n"),
    ).toMatch(
      /:\d+: two sections have the id "a"; the first is at content\/test\.md:\d+$/,
    );
  });
});

describe("every directive form of the registry parses", () => {
  // One synthetic document with every directive, every node type and every link kind.
  const body = `Vorab ein Satz vor dem ersten Abschnitt.

## Erster Abschnitt :anchor{#erster nav="Erster"}

Siehe :ref[zweiter], [die Preise](/preise) und [ein Beispiel](https://example.org/datenschutz).

**Ein Absatz ganz in Fett.**

- ein Punkt
- ein Punkt mit :mailto[provider.email]\\
  und einer zweiten Zeile

:::legal-basis
Art. 6 Abs. 1 lit. b DSGVO; Telefon :tel[provider.phone].
:::

::provider-link[Datenschutzerklärung des Beispiels]{href="https://example.org/privacy"}

:::link-list
- [Beispiel A](https://example.org/a)
- [Beispiel B](https://example.org/b)
:::

::::detail-grid
:::detail-list[Gespeicherte Angaben]
- Datum
- Uhrzeit
:::

:::detail-list[Zweck]
- Betrieb
:::
::::

:::entry
**Ein Anbieter, Stadt**

Ein Satz über den Anbieter.

::provider-link[Datenschutzerklärung des Anbieters]{href="https://example.org/anbieter"}
:::

::contact-address

## Zweiter Abschnitt :anchor{#zweiter}

::::::group[Eine Gruppe]
:::::subsection[Ein Unterabschnitt]
Ein Satz.
:::::

:::::panel
::::subsection[Im Kasten]
Ein Satz im Kasten.
::::
:::::

::::subsection[Ein Formular]
:::form
::form-line[An :value[provider.businessName], E-Mail: :value[provider.email]:]
::field[Name (\\*)]
::signature[Unterschrift]
::field[Datum]
::form-note[(\\*) Unzutreffendes streichen.]
:::
::::
::::::
`;
  const tree: DocumentTree = parse(body);

  test("into a tree that holds every registered node type", () => {
    const types = new Set(nodesIn(tree.body).map((node) => node.type));
    expect([...types].sort()).toEqual([...nodeTypes].sort());
  });

  test("with every link kind", () => {
    const kinds = new Set(nodesOf(tree, "link").map((link) => link.kind));
    expect([...kinds].sort()).toEqual([
      "anchor",
      "external",
      "mailto",
      "route",
      "tel",
    ]);
  });

  test("with blocks before the first section at the top level", () => {
    expect(tree.body[0]).toEqual({
      type: "paragraph",
      weight: "regular",
      children: [
        { type: "text", value: "Vorab ein Satz vor dem ersten Abschnitt." },
      ],
    });
  });

  test("with numbered sections, their headings and the navigation", () => {
    const sections = tree.body.filter((block) => block.type === "section");
    expect(
      sections.map(({ id, number, title, heading, navLabel }) => ({
        id,
        number,
        title,
        heading,
        navLabel,
      })),
    ).toEqual([
      {
        id: "erster",
        number: 1,
        title: "Erster Abschnitt",
        heading: "1. Erster Abschnitt",
        navLabel: "Erster",
      },
      {
        id: "zweiter",
        number: 2,
        title: "Zweiter Abschnitt",
        heading: "2. Zweiter Abschnitt",
        navLabel: "Zweiter Abschnitt",
      },
    ]);
    expect(tree.nav).toEqual([
      { id: "erster", label: "Erster" },
      { id: "zweiter", label: "Zweiter Abschnitt" },
    ]);
  });

  test("with the labels and the provider data resolved", () => {
    const [, first] = tree.body;
    const blocks = first?.type === "section" ? first.children : [];
    expect(blocks.find((block) => block.type === "legalBasis")).toMatchObject({
      label: labels.legalBasis,
    });
    expect(blocks.find((block) => block.type === "contactAddress")).toEqual({
      type: "contactAddress",
      lines: [
        provider.businessName,
        provider.ownerName,
        provider.street,
        provider.city,
        provider.country,
      ],
    });
    expect(blocks[0]).toMatchObject({
      children: [
        { type: "text", value: "Siehe " },
        {
          type: "link",
          kind: "anchor",
          href: "#zweiter",
          text: `${labels.sectionRef} 2`,
        },
        { type: "text", value: ", " },
        { type: "link", kind: "route", href: "/preise", text: "die Preise" },
        { type: "text", value: " und " },
        {
          type: "link",
          kind: "external",
          href: "https://example.org/datenschutz",
          text: "ein Beispiel",
        },
        { type: "text", value: "." },
      ],
    });
    expect(tree.labels).toEqual({
      effectiveDate: labels.effectiveDate,
      contact: labels.contact,
      page: labels.page,
    });
  });

  test("with the form's lines in source order, as plain text", () => {
    expect(nodesOf(tree, "form")).toEqual([
      {
        type: "form",
        children: [
          {
            type: "formLine",
            text: `An ${provider.businessName}, E-Mail: ${provider.email}:`,
          },
          { type: "field", label: "Name (*)" },
          { type: "signature", label: "Unterschrift" },
          { type: "field", label: "Datum" },
          { type: "formNote", text: "(*) Unzutreffendes streichen." },
        ],
      },
    ]);
  });

  test("and a container fence needs more colons than every fence inside it", () => {
    // The same group with one colon fewer on its fence than the subsection inside.
    expect(
      parseError(
        inSection(
          ":::::group[Gruppe]\n:::::subsection[Titel]\nText\n:::::\n:::::",
        ),
      ),
    ).toMatch(
      new RegExp(`^${FILE}:${SECTION_BODY + 1}: :::subsection is never closed`),
    );
  });
});
