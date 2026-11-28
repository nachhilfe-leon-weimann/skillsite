/**
 * Text, line ends, links, placeholders and dates (spec
 * `docs/specs/documents.md`, "Rules of the arc" and "Node types").
 */
import { describe, expect, test } from "vitest";

import { brand, domains, provider } from "../provider.ts";
import {
  blocksOf,
  FILE,
  inSection,
  parse,
  parseError,
  SECTION_BODY,
} from "./fixtures.ts";
import { effectiveDateLabel } from "./frontmatter.ts";

const paragraphOf = (content: string) => {
  const [block] = blocksOf(parse(inSection(content)));
  if (block?.type !== "paragraph")
    throw new Error(`expected a paragraph, got ${block?.type}`);
  return block;
};

describe("line ends are not text", () => {
  test("a two-line paragraph is one text joined by a single space", () => {
    expect(paragraphOf("Erster Satz.\nZweiter Satz.").children).toEqual([
      { type: "text", value: "Erster Satz. Zweiter Satz." },
    ]);
  });

  test("the spaces around a soft line ending become that one space", () => {
    expect(paragraphOf("Erster Satz. \n   Zweiter Satz.").children).toEqual([
      { type: "text", value: "Erster Satz. Zweiter Satz." },
    ]);
  });

  test("a line ending next to a placeholder or a link is one space too", () => {
    expect(
      paragraphOf(
        "An\n:value[provider.businessName]\n[mit Link](/preise)\nEnde.",
      ).children,
    ).toEqual([
      { type: "text", value: `An ${provider.businessName} ` },
      { type: "link", kind: "route", href: "/preise", text: "mit Link" },
      { type: "text", value: " Ende." },
    ]);
  });

  test("a backslash at the line end is a break: text, break, text", () => {
    expect(paragraphOf("a\\\nb").children).toEqual([
      { type: "text", value: "a" },
      { type: "break" },
      { type: "text", value: "b" },
    ]);
  });

  test("a break of trailing spaces fails, as the source cannot show it", () => {
    expect(parseError(inSection("a  \nb"))).toBe(
      `${FILE}:${SECTION_BODY}: a line break is a backslash at the end of the line, not trailing spaces`,
    );
  });

  test("characters stay as written: U+00AD, U+00A0, typographic quotes and escapes", () => {
    expect(
      paragraphOf("Geschäfts­bedingungen, § 13 BGB, „Anbieter“ und (\\*).")
        .children,
    ).toEqual([
      {
        type: "text",
        value: "Geschäfts­bedingungen, § 13 BGB, „Anbieter“ und (*).",
      },
    ]);
  });
});

describe("paragraph weight", () => {
  test("a paragraph entirely in bold has weight medium", () => {
    expect(paragraphOf("**Ein Anbieter, Stadt**")).toEqual({
      type: "paragraph",
      weight: "medium",
      children: [{ type: "text", value: "Ein Anbieter, Stadt" }],
    });
  });

  test("any other paragraph has weight regular", () => {
    expect(paragraphOf("Ein Satz.").weight).toBe("regular");
  });
});

describe("links get their kind from the source", () => {
  test("a site path is a route, an https: address external", () => {
    expect(
      paragraphOf("[Preise](/preise) und [Beispiel](https://example.org/a)")
        .children,
    ).toEqual([
      { type: "link", kind: "route", href: "/preise", text: "Preise" },
      { type: "text", value: " und " },
      {
        type: "link",
        kind: "external",
        href: "https://example.org/a",
        text: "Beispiel",
      },
    ]);
  });

  test(":mailto and :tel link the provider data as it is written", () => {
    expect(
      paragraphOf(":mailto[provider.email] :tel[provider.phone]").children,
    ).toEqual([
      {
        type: "link",
        kind: "mailto",
        href: `mailto:${provider.email}`,
        text: provider.email,
      },
      { type: "text", value: " " },
      {
        type: "link",
        kind: "tel",
        href: `tel:${provider.phone}`,
        text: provider.phone,
      },
    ]);
  });

  test("a section reference reads “Abschnitt N” and links to the section", () => {
    const tree = parse(
      "## A :anchor{#a}\n\nSiehe :ref[b].\n\n## B :anchor{#b}\n\nText.\n",
    );
    expect(blocksOf(tree)[0]).toEqual({
      type: "paragraph",
      weight: "regular",
      children: [
        { type: "text", value: "Siehe " },
        { type: "link", kind: "anchor", href: "#b", text: "Abschnitt 2" },
        { type: "text", value: "." },
      ],
    });
  });

  test("a section reference in an unnumbered document fails", () => {
    expect(
      parseError("## A :anchor{#a}\n\nSiehe :ref[a].\n", {
        fields: { sections: "\n  numbered: false\n  nav: false" },
      }),
    ).toMatch(
      /:\d+: :ref needs numbered sections \(sections\.numbered: true\)$/,
    );
  });

  test.each([
    [
      "[E-Mail](mailto:a@example.org)",
      "an e-mail link shows its address: [a@b](mailto:a@b) or a bare a@b; for E-12 data it is :mailto[key], such as :mailto[provider.email]",
    ],
    [
      "[Telefon](tel:+491234)",
      "a phone link is :tel[key], such as :tel[provider.phone]",
    ],
    ["[Abschnitt](#a)", "a link to a section is :ref[id]"],
    [
      "[Alt](http://example.org)",
      "a link goes to a route (/preise) or an https: address",
    ],
    [
      "[Relativ](preise)",
      "a link goes to a route (/preise) or an https: address",
    ],
    ['[Mit Titel](/preise "Titel")', "a link takes no title"],
    ["[**Fett**](/preise)", "bold text covers a whole paragraph: **…**"],
  ])("%s fails at its line", (content, reason) => {
    expect(parseError(inSection(content))).toBe(
      `${FILE}:${SECTION_BODY}: ${reason}`,
    );
  });

  test(":mailto with a key that holds no e-mail address fails", () => {
    expect(parseError(inSection(":mailto[provider.phone]"))).toBe(
      `${FILE}:${SECTION_BODY}: :mailto needs an e-mail address, and "provider.phone" holds none`,
    );
  });
});

describe("placeholders", () => {
  test(":value resolves the shared data and the document's date", () => {
    expect(
      paragraphOf(
        ":value[provider.street], :value[domains.site], :value[domains.analytics], :value[brand.name], :value[document.effectiveDate]",
      ).children,
    ).toEqual([
      {
        type: "text",
        value: `${provider.street}, ${domains.site}, ${domains.analytics}, ${brand.name}, Juli 2026`,
      },
    ]);
  });
});

describe("effective date", () => {
  test("2026-07-14 is labelled “Juli 2026”", () => {
    expect(effectiveDateLabel("2026-07-14")).toBe("Juli 2026");
    expect(parse(inSection("Text")).meta).toMatchObject({
      effectiveDate: "2026-07-14",
      effectiveDateLabel: "Juli 2026",
    });
  });

  test("the label names the month of the date, on its first and its last day too", () => {
    expect(effectiveDateLabel("2026-01-01")).toBe("Januar 2026");
    expect(effectiveDateLabel("2026-12-31")).toBe("Dezember 2026");
  });

  test("the version stays a string, even when it looks like a date", () => {
    expect(typeof parse(inSection("Text")).meta.version).toBe("string");
  });
});

describe("the document", () => {
  test("carries its slug, the frontmatter and the labels around the text", () => {
    const tree = parse(inSection("Text"));
    expect(tree.slug).toBe("test");
    expect(tree.meta).toEqual({
      title: "Testbedingungen",
      shortTitle: "Test",
      badge: "Probe",
      lead: "Ein Lead.",
      description: "Eine Beschreibung.",
      version: "2026-07-14",
      effectiveDate: "2026-07-14",
      targets: ["web", "pdf"],
      sections: { numbered: true, nav: true },
      effectiveDateLabel: "Juli 2026",
    });
    expect(tree.labels).toEqual({
      effectiveDate: "Stand",
      contact: "Kontakt",
      page: "Seite",
    });
  });

  test("a pdf-only document needs no page fields", () => {
    const fields = {
      targets: "[pdf]",
      shortTitle: null,
      badge: null,
      lead: null,
      description: null,
    };
    expect(parse(inSection("Text"), { fields }).meta).not.toHaveProperty(
      "lead",
    );
  });

  test("an unnumbered document without navigation keeps bare headings and no nav", () => {
    const tree = parse("## Angaben :anchor{#angaben}\n\nText.\n", {
      fields: { sections: "\n  numbered: false\n  nav: false" },
    });
    expect(tree.nav).toEqual([]);
    expect(tree.body[0]).toMatchObject({
      id: "angaben",
      number: null,
      heading: "Angaben",
    });
  });
});
