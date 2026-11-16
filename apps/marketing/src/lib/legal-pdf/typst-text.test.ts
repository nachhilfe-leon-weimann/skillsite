import { expect, test } from "vitest";

import { typstParagraphs } from "./typst-text";

const data = {
  provider: { email: "kontakt@example.com" },
  site: { prices: "example.com/preise" },
};

function read(files: Record<string, string>) {
  return (file: string) => {
    const source = files[file];
    if (source === undefined) throw new Error(`no ${file}`);
    return source;
  };
}

test("reads paragraphs, headings, data, includes and wrappers as the PDF prints their text", () => {
  const files = {
    "doc.typ": [
      "// a comment",
      '#import "template.typ": *',
      "#show: legal-document.with(",
      '  title: "Titel",',
      ")",
      "",
      "= Abschnitt",
      "",
      "Schreiben Sie an",
      "#provider.email.",
      "",
      "Siehe #web-link(site.prices)[Preise] und (\\*) *fett*.",
      "",
      "#v(1em)",
      '#notice-box(breakable: false, include "parts/part.typ")',
    ].join("\n"),
    "parts/part.typ": [
      '#import "../template.typ": *',
      "",
      "#box-title[Formular]",
      "",
      "#set par(justify: false)",
      "",
      "– Datum #fill-line",
      "",
      "#write-line",
    ].join("\n"),
  };
  expect(typstParagraphs("doc.typ", read(files), data)).toEqual([
    "Abschnitt",
    "Schreiben Sie an kontakt@example.com.",
    "Siehe Preise und (*) fett.",
    "Formular",
    "– Datum",
  ]);
});

test("refuses markup it cannot read instead of dropping its text", () => {
  expect(() =>
    typstParagraphs(
      "doc.typ",
      read({ "doc.typ": "Text #emph[wichtig]" }),
      data,
    ),
  ).toThrow(/Unsupported Typst markup "#emph"/);
  expect(() =>
    typstParagraphs("doc.typ", read({ "doc.typ": "An #provider.phone" }), data),
  ).toThrow(/#provider.phone names no text/);
});
