/**
 * "Errors stop the build, each with the file and line" (spec
 * `docs/specs/documents.md`, Rules of the arc): one synthetic document per
 * error class. `build.test.ts` proves that such an error ends the build
 * with a non-zero exit code.
 */
import { describe, expect, test } from "vitest";

import {
  BODY,
  errorOf,
  FILE,
  inSection,
  parseDocuments,
  parseError,
  partialFiles,
  SECTION_BODY,
  source,
} from "./fixtures.ts";

describe("an unknown node type stops the build at its line", () => {
  test.each([
    ["a quote", "> Zitat", "a quote (>) is not used in a document"],
    [
      "a code block",
      "```\ncode\n```",
      "a code block is not used in a document",
    ],
    [
      "a table",
      "| a | b |\n| - | - |\n| 1 | 2 |",
      "a table is not used in a document",
    ],
    [
      "a horizontal rule",
      "Text\n\n---\n\nText",
      "a horizontal rule is not used in a document",
    ],
    ["HTML", "<div>Text</div>", "HTML is not used in a document"],
    [
      "italic text",
      "Ein *betontes* Wort.",
      "italic text is not used in a document",
    ],
    ["inline code", "Ein `Wort`.", "inline code is not used in a document"],
    [
      "an image",
      "![Bild](https://example.org/a.png)",
      "an image is not used in a document",
    ],
    [
      "a numbered list",
      "1. eins\n2. zwei",
      "a numbered list is not used in a document",
    ],
    [
      "bold text inside a sentence",
      "Ein **fettes** Wort.",
      "bold text covers a whole paragraph",
    ],
  ])("%s", (_, content, reason) => {
    const lineOffset = content.startsWith("Text\n\n") ? 2 : 0;
    expect(parseError(inSection(content))).toContain(
      `${FILE}:${SECTION_BODY + lineOffset}: ${reason}`,
    );
  });

  test("a heading other than a section heading", () => {
    expect(parseError("# Titel")).toBe(
      `${FILE}:${BODY}: the document title comes from the frontmatter; a section heading is ## Title :anchor{#id}`,
    );
    expect(parseError(inSection("### Unterabschnitt"))).toBe(
      `${FILE}:${SECTION_BODY}: a heading below ## is a subsection: ::::subsection[Title]`,
    );
  });
});

test("an unknown placeholder stops the build at its line", () => {
  expect(parseError(inSection("Fax: :value[provider.fax]"))).toMatch(
    new RegExp(
      `^${FILE}:${SECTION_BODY}: unknown placeholder "provider\\.fax"; known: provider\\.businessName, `,
    ),
  );
});

test("an unknown directive stops the build at its line", () => {
  expect(parseError(inSection("::kontakt"))).toBe(
    `${FILE}:${SECTION_BODY}: unknown directive ::kontakt`,
  );
  expect(parseError(inSection(":::hinweis\nText\n:::"))).toBe(
    `${FILE}:${SECTION_BODY}: unknown directive :::hinweis`,
  );
  expect(parseError(inSection("Ein :wort[mit Label]."))).toBe(
    `${FILE}:${SECTION_BODY}: unknown directive :wort`,
  );
});

test("a reference to a missing section stops the build at its line", () => {
  expect(parseError(inSection("Siehe :ref[nirgends]."))).toBe(
    `${FILE}:${SECTION_BODY}: no section has the id "nirgends"`,
  );
});

describe("a missing or malformed frontmatter field stops the build at its line", () => {
  // Line 1 is the opening `---`; the fields follow in the order of `source()`.
  test("a document without frontmatter", () => {
    expect(
      errorOf(() =>
        parseDocuments(
          [{ file: FILE, source: "## A :anchor{#a}\n\nText\n" }],
          new Map(),
        ),
      ),
    ).toBe(
      `${FILE}:1: a document starts with its frontmatter, between two \`---\` lines`,
    );
  });

  test("a missing field", () => {
    expect(parseError(inSection("Text"), { fields: { version: null } })).toBe(
      `${FILE}:1: frontmatter field "version" is missing`,
    );
  });

  test("an effective date that is no ISO date", () => {
    expect(
      parseError(inSection("Text"), {
        fields: { effectiveDate: "2026-02-30" },
      }),
    ).toBe(
      `${FILE}:8: frontmatter field "effectiveDate": effectiveDate is an ISO date, YYYY-MM-DD`,
    );
  });

  test("an unknown target", () => {
    expect(
      parseError(inSection("Text"), { fields: { targets: "[web, print]" } }),
    ).toMatch(new RegExp(`^${FILE}:9: frontmatter field "targets\\.1": `));
  });

  test("a web target without its page fields", () => {
    expect(parseError(inSection("Text"), { fields: { lead: null } })).toBe(
      `${FILE}:1: frontmatter field "lead": lead is required for a web target`,
    );
  });

  test("a section setting that is no boolean", () => {
    expect(
      parseError(inSection("Text"), {
        fields: { sections: "\n  numbered: ja\n  nav: true" },
      }),
    ).toMatch(
      new RegExp(`^${FILE}:11: frontmatter field "sections\\.numbered": `),
    );
  });

  test("an unknown field, such as a misspelt one", () => {
    expect(
      parseError(inSection("Text"), { fields: { efectiveDate: "2026-07-14" } }),
    ).toBe(`${FILE}:13: unknown frontmatter field "efectiveDate"`);
  });

  test("an unknown field inside a group, at its own line and with its path", () => {
    expect(
      parseError(inSection("Text"), {
        fields: { sections: "\n  numbered: true\n  nav: true\n  extra: 1" },
      }),
    ).toBe(`${FILE}:13: unknown frontmatter field "sections.extra"`);
  });

  test("a field written twice", () => {
    const message = parseError(inSection("Text"), {
      fields: { version: "2026-07-14\nversion: 2026-07-15" },
    });
    expect(message).toMatch(new RegExp(`^${FILE}:8: frontmatter: `));
    // Only the prefix names a place: yaml counts lines from the YAML text, not the file.
    expect(message).not.toContain("at line");
  });

  test.each([
    ["an unresolved alias", { title: "*a" }, 2],
    ["a resolved alias", { title: "&x Titel", shortTitle: "*x" }, 2],
  ])("%s", (_, fields, line) => {
    expect(parseError(inSection("Text"), { fields })).toBe(
      `${FILE}:${line}: frontmatter: anchors and aliases (\`&name\`, \`*name\`) are not allowed`,
    );
  });
});

describe("a tree that fails the schema stops the build at the node's line", () => {
  test("a section id that is no slug", () => {
    const fields = { sections: "\n  numbered: true\n  nav: false" };
    expect(
      parseError("## Abschnitt :anchor{#Mein_Abschnitt}\n\nText\n", { fields }),
    ).toBe(
      `${FILE}:${BODY}: the tree fails the schema at body.0.id: a section id is lowercase letters and digits, joined by single hyphens`,
    );
  });

  test("a link without text", () => {
    expect(parseError(inSection("Ein Satz.\n[](https://example.org)"))).toBe(
      `${FILE}:${SECTION_BODY + 1}: the tree fails the schema at body.0.children.0.children.1.text: text is empty`,
    );
  });

  test("a provider link that is no https: address", () => {
    expect(
      parseError(
        inSection('::provider-link[Anbieter]{href="http://example.org"}'),
      ),
    ).toBe(
      `${FILE}:${SECTION_BODY}: the tree fails the schema at body.0.children.0.href: an external link is an https: address`,
    );
  });
});

describe("a partial stops the build at the include", () => {
  test("when it is missing", () => {
    expect(parseError(inSection('::include{src="fehlt"}'))).toBe(
      `${FILE}:${SECTION_BODY}: no partial "fehlt" in content/partials/ (fehlt.md)`,
    );
  });

  test("when it is included twice", () => {
    expect(
      parseError(inSection('::include{src="teil"}\n\n::include{src="teil"}'), {
        partials: { teil: "Ein Satz.\n" },
      }),
    ).toBe(
      `${FILE}:${SECTION_BODY + 2}: partial "teil" is included twice; first at ${FILE}:${SECTION_BODY}`,
    );
  });

  test("when it includes itself", () => {
    expect(
      parseError(inSection('::include{src="teil"}'), {
        partials: { teil: 'Ein Satz.\n\n::include{src="teil"}\n' },
      }),
    ).toBe(
      `content/partials/teil.md:3: partial "teil" includes itself: teil -> teil`,
    );
  });

  test("when it includes itself through another partial", () => {
    expect(
      parseError(inSection('::include{src="a"}'), {
        partials: {
          a: '::include{src="b"}\n',
          b: 'Text\n\n::include{src="a"}\n',
        },
      }),
    ).toBe(`content/partials/b.md:3: partial "a" includes itself: a -> b -> a`);
  });

  test("when it carries frontmatter", () => {
    expect(
      parseError(inSection('::include{src="teil"}'), {
        partials: { teil: "---\nversion: 1\n---\n\nText\n" },
      }),
    ).toBe(
      "content/partials/teil.md:1: a partial has no frontmatter: the documents that include it set version and effectiveDate",
    );
  });

  test("and an error inside the partial names the partial's file and line", () => {
    expect(
      parseError(inSection('::include{src="teil"}'), {
        partials: { teil: "Erster Satz.\n\n> Zitat\n" },
      }),
    ).toBe("content/partials/teil.md:3: a quote (>) is not used in a document");
  });
});

test("two documents that include the same partial with another version or date stop the build", () => {
  const partials = partialFiles({ teil: "Ein Satz.\n" });
  const document = (file: string, fields: Record<string, string> = {}) => ({
    file,
    source: source(inSection('::include{src="teil"}'), fields),
  });

  expect(() =>
    parseDocuments(
      [document("content/a.md"), document("content/b.md")],
      partials,
    ),
  ).not.toThrow();
  expect(
    errorOf(() =>
      parseDocuments(
        [
          document("content/a.md"),
          document("content/b.md", { version: "2026-08-01" }),
        ],
        partials,
      ),
    ),
  ).toBe(
    `content/b.md:${SECTION_BODY}: partial "teil" is also included by content/a.md, which has version 2026-07-14 and effectiveDate 2026-07-14; this document has 2026-08-01 and 2026-07-14`,
  );
  expect(
    errorOf(() =>
      parseDocuments(
        [
          document("content/a.md"),
          document("content/b.md", { effectiveDate: "2026-08-01" }),
        ],
        partials,
      ),
    ),
  ).toContain(
    `content/b.md:${SECTION_BODY}: partial "teil" is also included by content/a.md`,
  );
});
