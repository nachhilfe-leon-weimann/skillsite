/**
 * The kit typesets: the specimen, which uses every primitive, compiles through the pinned runner as PDF/A-2a and
 * PDF/UA-1 with the kit's own fonts only and gives the same bytes twice. The kit also stays self-contained, so
 * another repository can take it over as it is.
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

/** The PostScript names of the fonts a PDF embeds (subset prefix removed), from its plain and deflated objects. */
function embeddedFonts(pdf) {
  const names = new Set();
  const collect = (bytes) => {
    for (const match of bytes
      .toString("latin1")
      .matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([^\s/<>[\]()]+)/g)) {
      names.add(match[1]);
    }
  };
  collect(pdf);
  const text = pdf.toString("latin1");
  for (const match of text.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length;
    const end = text.indexOf("endstream", start);
    try {
      collect(inflateSync(pdf.subarray(start, end)));
    } catch {
      // Not a deflated stream (an image or a font program); it names no font.
    }
  }
  return [...names].sort();
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
  const source = (labels) =>
    `#import "/lib.typ": letterhead
#show: letterhead.with(brand: "B", tagline: "T", domain: "example.org", title: "X"${labels})
Text.`;

  const missing = typst(
    [...COMPILE, "-", path.join(out, "missing.pdf")],
    source(""),
  );
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /print-kit: letterhead needs `labels`/);

  const complete = typst(
    [...COMPILE, "-", path.join(out, "complete.pdf")],
    source(`, labels: (page: "P")`),
  );
  assert.equal(complete.status, 0, complete.stderr);
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
