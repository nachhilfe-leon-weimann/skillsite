import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { legalPdfData } from "./data";

/*
 * The inputs of the legal PDFs and their fingerprint. `just legal-pdfs` (legal-pdf/build.mjs) records the
 * fingerprint in the build stamp; build-stamp.test.ts recomputes it, so a text change without a rebuild fails.
 * Node only: never import this from app code.
 */

/** `apps/marketing`, the root `public/` and `legal-pdf/` hang off. */
export const appDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

/** The Typst sources, fonts and build script of the PDFs. */
export const legalPdfDir = path.join(appDir, "legal-pdf");

/** What the build writes into `legal-pdf/`: not an input. */
const generatedDir = "generated";
export const buildStampFile = "build-stamp.json";

/** The data file the Typst documents read, as `just legal-pdfs` writes it. */
export function legalPdfDataJson(): string {
  return `${JSON.stringify(legalPdfData(), null, 2)}\n`;
}

/** Every input file below `legal-pdf/`, relative and sorted, without the build's own output and dotfiles. */
export function legalPdfSourceFiles(): string[] {
  return readdirSync(legalPdfDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(legalPdfDir, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/"),
    )
    .filter(
      (file) =>
        file !== buildStampFile &&
        !file.startsWith(`${generatedDir}/`) &&
        !file.split("/").some((part) => part.startsWith(".")),
    )
    .sort();
}

/** The fingerprint of the PDFs' inputs: every source file and the generated data. */
export function legalPdfSourceHash(): string {
  const hash = createHash("sha256");
  for (const file of legalPdfSourceFiles()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(path.join(legalPdfDir, file)));
    hash.update("\0");
  }
  hash.update(`${generatedDir}/data.json\0${legalPdfDataJson()}`);
  return hash.digest("hex");
}

/** The SHA-256 of a file, e.g. a built PDF. */
export function fileHash(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** A path under `public/` (e.g. `/rechtliches/agb.pdf`) on disk. */
export function publicFile(sitePath: string): string {
  return path.join(appDir, "public", ...sitePath.split("/").filter(Boolean));
}

/** What `just legal-pdfs` records about a build in `legal-pdf/build-stamp.json`. */
export interface LegalPdfBuildStamp {
  /** The fingerprint of the inputs the PDFs were built from (`legalPdfSourceHash`). */
  sources: string;
  /** The AGB's effective date the PDFs print. */
  effectiveDate: string;
  /** The Typst version that built them; informational. */
  typst: string;
  /** The SHA-256 of each PDF by its site path. */
  pdfs: Record<string, string>;
}

export function readBuildStamp(): LegalPdfBuildStamp {
  return JSON.parse(
    readFileSync(path.join(legalPdfDir, buildStampFile), "utf8"),
  ) as LegalPdfBuildStamp;
}
