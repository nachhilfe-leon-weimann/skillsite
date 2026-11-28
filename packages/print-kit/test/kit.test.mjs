/**
 * The kit typesets: the specimen, which uses every primitive, compiles through the pinned runner as PDF/A-2a and
 * PDF/UA-1 with the kit's own fonts only and gives the same bytes twice. What the eye sees reaches the tagged PDF
 * too (the logo's and a checkbox's alternative text), and a title never ends a page without its block. The kit
 * also stays self-contained, so another repository can take it over as it is.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const kitDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = mkdtempSync(path.join(os.tmpdir(), "print-kit-"));
after(() => rmSync(out, { recursive: true, force: true }));

/** Runs the kit's Typst runner in the kit directory. */
function typst(args, input) {
  return spawnSync(
    process.execPath,
    [path.join(kitDir, "bin", "typst.mjs"), ...args],
    {
      cwd: kitDir,
      encoding: "utf8",
      input,
    },
  );
}

/** The arguments of every compile: the kit is the root, its fonts are the only ones. */
const COMPILE = [
  "compile",
  "--root",
  ".",
  "--font-path",
  "fonts",
  "--ignore-system-fonts",
];

function compileSpecimen(name) {
  const file = path.join(out, name);
  const result = typst([
    ...COMPILE,
    "--pdf-standard",
    "a-2a,ua-1",
    "examples/specimen.typ",
    file,
  ]);
  assert.equal(result.status, 0, result.stderr);
  return readFileSync(file);
}

/** A PDF's plain objects, then each deflated stream (content streams, object streams) as latin1 text. */
function pdfText(pdf) {
  const text = pdf.toString("latin1");
  const parts = [text];
  for (const match of text.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length;
    const end = text.indexOf("endstream", start);
    try {
      parts.push(inflateSync(pdf.subarray(start, end)).toString("latin1"));
    } catch {
      // Not a deflated stream (an image or a font program).
    }
  }
  return parts.join("\n");
}

/** The PostScript names of the fonts a PDF embeds (subset prefix removed). */
function embeddedFonts(pdf) {
  const names = new Set();
  for (const match of pdfText(pdf).matchAll(
    /\/BaseFont\s*\/(?:[A-Z]{6}\+)?([^\s/<>[\]()]+)/g,
  )) {
    names.add(match[1]);
  }
  return [...names].sort();
}

/** The alternative texts of a tagged PDF's Figure structure elements. */
function figureAlts(pdf) {
  return [
    ...pdfText(pdf).matchAll(
      /\/Type\/StructElem\/S\/Figure\b[^\n]*?\/Alt\(([^)]*)\)/g,
    ),
  ].map((match) => match[1]);
}

/** Compiles Typst `source` (read from stdin, with the kit as root) as PDF/A-2a and PDF/UA-1. */
function compileTagged(name, source) {
  const file = path.join(out, name);
  const result = typst(
    [...COMPILE, "--pdf-standard", "a-2a,ua-1", "-", file],
    source,
  );
  assert.equal(result.status, 0, result.stderr);
  return readFileSync(file);
}

/** Evaluates `expression` in the context of the Typst document `source`; returns the parsed JSON. */
function evaluate(source, expression) {
  const result = typst(
    [
      "eval",
      "--root",
      ".",
      "--font-path",
      "fonts",
      "--ignore-system-fonts",
      expression,
      "--in",
      "-",
    ],
    source,
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("the specimen compiles as PDF/A-2a and PDF/UA-1 and embeds only the kit's fonts", () => {
  const pdf = compileSpecimen("specimen.pdf");

  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(embeddedFonts(pdf), [
    "BricolageGrotesque-Bold",
    "BricolageGrotesque-ExtraBold",
    "HankenGrotesk-Bold",
    "HankenGrotesk-Medium",
    "HankenGrotesk-Regular",
  ]);
});

test("two builds of the specimen give the same bytes", () => {
  assert.ok(compileSpecimen("first.pdf").equals(compileSpecimen("second.pdf")));
});

test("a letterhead without a required argument fails with the argument's name", () => {
  const args = {
    brand: '"B"',
    tagline: '"T"',
    domain: '"example.org"',
    title: '"X"',
    labels: '(page: "P")',
  };
  const source = (omit) => {
    const given = Object.entries(args)
      .filter(([name]) => name !== omit)
      .map(([name, value]) => `${name}: ${value}`)
      .join(", ");
    return `#import "/lib.typ": letterhead
#show: letterhead.with(${given})
Text.`;
  };

  for (const name of Object.keys(args)) {
    const missing = typst(
      [...COMPILE, "-", path.join(out, `missing-${name}.pdf`)],
      source(name),
    );
    assert.notEqual(missing.status, 0, name);
    assert.match(
      missing.stderr,
      new RegExp(`print-kit: letterhead needs \`${name}\``),
    );
  }

  const complete = typst(
    [...COMPILE, "-", path.join(out, "complete.pdf")],
    source(null),
  );
  assert.equal(complete.status, 0, complete.stderr);
});

test("a heading and a group title stay on the page of the block after them", () => {
  // Each case starts a page and pushes its title down by 1 mm more than the case before, up to the full height of
  // a following page's text area (245 mm), so some cases put the title at the very end of a page.
  const cases = Array.from({ length: 26 }, (_, i) => 220 + i).flatMap((mm) => [
    { id: `h${mm}`, mm, title: "== Abschnitt" },
    { id: `e${mm}`, mm, title: "#eyebrow[Gruppe]" },
  ]);
  const body = cases.map(
    ({ id, mm, title }) => `#pagebreak()
#v(${mm}mm)
${title} <${id}-title>
#par[Ein Absatz unter dem Titel.] <${id}-next>`,
  );
  const pages = cases.map(
    ({ id }) =>
      `"${id}": (${["title", "next"].map((part) => `locate(<${id}-${part}>).page()`).join(", ")})`,
  );
  const source = `#import "/lib.typ": eyebrow, letterhead
#show: letterhead.with(brand: "B", tagline: "T", domain: "example.org", title: "X", labels: (page: "P"))
${body.join("\n")}
#context [#metadata((${pages.join(", ")})) <result>]`;

  const [result] = evaluate(source, "query(<result>).map(it => it.value)");
  for (const { id } of cases) {
    const [title, next] = result[id];
    assert.equal(
      title,
      next,
      `${id}: the title is on page ${title}, the next block on page ${next}`,
    );
  }
  // The control: in some cases of each kind the title moved over to the next page with its block, past the page
  // the case's space filled (each case starts a page after the previous case's last one).
  for (const kind of ["h", "e"]) {
    const movedOver = cases.filter(
      ({ id }, index) =>
        id.startsWith(kind) &&
        result[id][0] > (index === 0 ? 1 : result[cases[index - 1].id][1]) + 1,
    );
    assert.ok(movedOver.length > 0, `no ${kind} case reached the page end`);
  }
});

test("the logo reaches the tagged PDF once, as a Figure with the brand as its alternative text", () => {
  const alts = figureAlts(compileSpecimen("figures.pdf"));
  assert.equal(
    alts.filter((alt) => alt === "Beispielmarke").length,
    1,
    alts.join(", "),
  );
});

test("a checkbox's state is in the tagged PDF, as the alternative text of the box", () => {
  const source = (checked) => `#import "/lib.typ": checkbox
#set document(title: "X", date: datetime(year: 2026, month: 1, day: 1))
#set text(lang: "en")
#checkbox(checked: ${checked}, states: (checked: "ticked", unchecked: "empty"))[Option]`;

  for (const [checked, alt] of [
    [true, "ticked"],
    [false, "empty"],
  ]) {
    const pdf = compileTagged(`checkbox-${checked}.pdf`, source(checked));
    assert.deepEqual(figureAlts(pdf), [alt]);
    // The box and the tick are the Figure's content, not an artifact a screen reader skips.
    assert.doesNotMatch(pdfText(pdf), /\/Artifact\b/);
  }

  const missing = typst(
    [...COMPILE, "-", path.join(out, "checkbox-states.pdf")],
    `#import "/lib.typ": checkbox
#checkbox[Option]`,
  );
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /print-kit: checkbox needs `states`/);
});

test("package.json depends on no workspace package", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(kitDir, "package.json"), "utf8"),
  );
  const fields = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
    "bundleDependencies",
    "bundledDependencies",
  ];
  for (const field of fields) {
    const entries = manifest[field] ?? {};
    const pairs = Array.isArray(entries)
      ? entries.map((name) => [name, ""])
      : Object.entries(entries);
    for (const [name, version] of pairs) {
      assert.doesNotMatch(name, /^@skillsite\//, `${field}: ${name}`);
      assert.doesNotMatch(
        String(version),
        /^workspace:/,
        `${field}: ${name}@${version}`,
      );
    }
  }
});

test("every Typst file loads only files inside the kit", () => {
  const typFiles = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory())
        return entry.name.startsWith(".") ? [] : typFiles(file);
      return entry.name.endsWith(".typ") ? [file] : [];
    });

  const files = typFiles(kitDir);
  assert.ok(files.length >= 6, files.join(", "));
  for (const file of files) {
    for (const [, target] of readFileSync(file, "utf8").matchAll(
      /(?:#import|image\()\s*"([^"]+)"/g,
    )) {
      const resolved = target.startsWith("/")
        ? path.join(kitDir, target)
        : path.resolve(path.dirname(file), target);
      assert.ok(
        resolved.startsWith(kitDir + path.sep),
        `${path.relative(kitDir, file)} loads ${target}`,
      );
    }
  }
});
