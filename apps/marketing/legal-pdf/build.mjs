/**
 * Builds the legal PDFs into `public/` (`just legal-pdfs`): writes the data the Typst documents read
 * (`generated/data.json`, from the site's content modules), compiles every document with the vendored fonts only,
 * and records the build in `build-stamp.json`, which src/lib/legal-pdf/build-stamp.test.ts checks.
 * Needs Typst (https://typst.app) on the PATH; CI and the Docker image never run it, they ship the committed PDFs.
 */
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runnerImport } from "vite";

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Loads a module of the app (TypeScript, `@/` imports) the way Vitest does. */
async function importApp(file) {
  const { module } = await runnerImport(path.join(appDir, file), {
    configFile: false,
    root: appDir,
    logLevel: "warn",
    resolve: { tsconfigPaths: true },
  });
  return module;
}

function typst(...args) {
  return execFileSync("typst", args, { encoding: "utf8" }).trim();
}

let typstVersion;
try {
  typstVersion = typst("--version");
} catch {
  console.error(
    "[legal-pdfs] Typst is not installed: get it from https://typst.app (e.g. `brew install typst`).",
  );
  process.exit(1);
}

const { legalPdfDocuments, agbEffectiveDay } = await importApp(
  "src/lib/legal-pdf/data.ts",
);
const {
  buildStampFile,
  fileHash,
  legalPdfDataJson,
  legalPdfDir,
  legalPdfSourceHash,
  publicFile,
  typstCompileArgs,
} = await importApp("src/lib/legal-pdf/sources.ts");

mkdirSync(path.join(legalPdfDir, "generated"), { recursive: true });
writeFileSync(
  path.join(legalPdfDir, "generated", "data.json"),
  legalPdfDataJson(),
);

const pdfs = {};
for (const { source, output } of legalPdfDocuments) {
  const target = publicFile(output);
  mkdirSync(path.dirname(target), { recursive: true });
  typst(...typstCompileArgs(source, target));
  // The image runs as a non-root user: a file only its owner may read would be missing on the site.
  chmodSync(target, 0o644);
  pdfs[output] = fileHash(target);
  console.log(`[legal-pdfs] ${source} -> public${output}`);
}

const stamp = {
  sources: legalPdfSourceHash(),
  effectiveDate: agbEffectiveDay,
  typst: typstVersion,
  pdfs,
};
writeFileSync(
  path.join(legalPdfDir, buildStampFile),
  `${JSON.stringify(stamp, null, 2)}\n`,
);
console.log(`[legal-pdfs] recorded ${buildStampFile}`);
