/**
 * The reference text of a tree, which the wording tests of the pages and the
 * PDFs compare with: one line per block, whitespace as a browser shows it.
 */
import { expect, test } from "vitest";

import { labels } from "./labels.ts";
import { parse } from "./parse/fixtures.ts";
import { provider } from "./provider.ts";
import type { BodyBlock } from "./schema/index.ts";
import { documentTextLines } from "./text.ts";

test("every block of a document reads as its own lines, in source order", () => {
  const tree = parse(`Vorab ein Satz.

## Erster Abschnitt :anchor{#erster}

Ein Satz
über zwei Zeilen, mit [einem Link](/preise) und :ref[zweiter].

Zeile eins\\
Zeile zwei

**Fett gesetzt.**

- ein Punkt
- ein zweiter

:::legal-basis
Art. 6 Abs. 1 lit. b DSGVO.
:::

::provider-link[Datenschutzerklärung des Beispiels]{href="https://example.org/privacy"}

:::link-list
- [Beispiel A](https://example.org/a)
- [Beispiel B](https://example.org/b)
:::

::::detail-grid
:::detail-list[Angaben]
- Datum
:::
::::

:::entry
Ein Eintrag.
:::

::contact-address

## Zweiter Abschnitt :anchor{#zweiter}

::::::group[Eine Gruppe]
:::::panel
::::subsection[Ein Formular]
:::form
::form-line[An :value[provider.businessName]:]
::field[Name (\\*)]
::signature[Unterschrift]
::form-note[(\\*) Streichen.]
:::
::::
:::::
::::::
`);

  expect(documentTextLines(tree.body)).toEqual([
    "Vorab ein Satz.",
    "1. Erster Abschnitt",
    `Ein Satz über zwei Zeilen, mit einem Link und ${labels.sectionRef} 2.`,
    "Zeile eins",
    "Zeile zwei",
    "Fett gesetzt.",
    "ein Punkt",
    "ein zweiter",
    `${labels.legalBasis} Art. 6 Abs. 1 lit. b DSGVO.`,
    "Datenschutzerklärung des Beispiels",
    "Beispiel A",
    "Beispiel B",
    "Angaben",
    "Datum",
    "Ein Eintrag.",
    provider.businessName,
    provider.ownerName,
    provider.street,
    provider.city,
    provider.country,
    "2. Zweiter Abschnitt",
    "Eine Gruppe",
    "Ein Formular",
    `An ${provider.businessName}:`,
    "Name (*)",
    "Unterschrift",
    "(*) Streichen.",
  ]);
});

test("ASCII whitespace collapses as a browser collapses it, while U+00A0 and U+00AD stay", () => {
  const body: BodyBlock[] = [
    {
      type: "paragraph",
      weight: "regular",
      children: [
        { type: "text", value: "  zwei  Leerzeichen\tund ein Tab " },
        { type: "link", kind: "route", href: "/preise", text: "Link" },
        { type: "text", value: " § 13 Ge­schäft " },
      ],
    },
  ];
  expect(documentTextLines(body)).toEqual([
    "zwei Leerzeichen und ein Tab Link § 13 Ge­schäft ",
  ]);
});
