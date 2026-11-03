/**
 * Design ratchet: counts patterns that bypass the design system and keeps the counts from rising.
 * `node scripts/design-ratchet.mjs`           check against design-ratchet.json (fails on any difference)
 * `node scripts/design-ratchet.mjs --update`  write lowered counts back; a rise is refused -
 *                                              exceptions go into `allow` with a reason
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TSX = /\.(tsx|ts|mts)$/;
const TSX_OR_CSS = /\.(tsx|ts|mts|css)$/;
const APP_TSX = /^apps\/[^/]+\/src\/.*\.tsx$/;

export const PATTERNS = [
  { name: "arbitrary-text", regex: /(?<![\w-])text-\[/g, files: TSX_OR_CSS },
  {
    name: "raw-text-size",
    regex: /(?<![\w-])text-(xs|sm|base|lg|xl|2xl)(?![\w-])/g,
    files: TSX,
  },
  { name: "color-mix", regex: /color-mix\(/g, files: TSX },
  { name: "arbitrary-shadow", regex: /(?<![\w-])shadow-\[/g, files: TSX },
  {
    name: "arbitrary-radius",
    regex: /(?<![\w-])rounded(-[a-z]{1,2})?-\[/g,
    files: TSX,
  },
  {
    name: "clamp-spacing",
    regex:
      /(?<![\w-])-?(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[clamp\(/g,
    files: TSX,
  },
  {
    name: "hex-color",
    regex: /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w])/g,
    files: TSX,
  },
  { name: "raw-button", regex: /<button(?![\w-])/g, files: APP_TSX },
  { name: "inline-style", regex: /style=\{\{/g, files: TSX },
];

const SKIP = /(\.stories\.tsx|\.test\.(ts|tsx|mts|mjs))$/;

export function countPatterns(files, allow) {
  const counts = Object.fromEntries(PATTERNS.map((p) => [p.name, 0]));
  for (const { path: file, content } of files) {
    if (SKIP.test(file)) continue;
    for (const pattern of PATTERNS) {
      if (!pattern.files.test(file)) continue;
      if ((allow[pattern.name] ?? []).some((entry) => entry.file === file))
        continue;
      counts[pattern.name] += content.match(pattern.regex)?.length ?? 0;
    }
  }
  return counts;
}

export function compare(counts, baseline) {
  const names = [
    ...new Set([...Object.keys(counts), ...Object.keys(baseline)]),
  ];
  return {
    raised: names.filter((n) => (counts[n] ?? 0) > (baseline[n] ?? 0)),
    lowered: names.filter((n) => (counts[n] ?? 0) < (baseline[n] ?? 0)),
  };
}

function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const baselineFile = path.join(root, "design-ratchet.json");
  const files = globSync(
    [
      "apps/*/src/**/*.{ts,tsx,mts,css}",
      "packages/ui/src/**/*.{ts,tsx,mts,css}",
    ],
    { cwd: root },
  ).map((file) => ({
    path: file,
    content: readFileSync(path.join(root, file), "utf8"),
  }));
  const baseline = JSON.parse(readFileSync(baselineFile, "utf8"));
  const counts = countPatterns(files, baseline.allow ?? {});
  const { raised, lowered } = compare(counts, baseline.counts);

  for (const name of raised)
    console.error(
      `raised  ${name}: ${baseline.counts[name] ?? 0} -> ${counts[name]}`,
    );
  for (const name of lowered)
    console.error(
      `lowered ${name}: ${baseline.counts[name]} -> ${counts[name]}`,
    );

  if (process.argv.includes("--update")) {
    if (raised.length) {
      console.error(
        "A pattern count rose: refusing to update - use the design-system component or token " +
          "instead, or add an allow-list entry with a reason.",
      );
      process.exit(1);
    }
    writeFileSync(
      baselineFile,
      `${JSON.stringify({ ...baseline, counts }, null, 2)}\n`,
    );
    return;
  }
  if (raised.length) {
    console.error(
      "A pattern count rose: use the design-system component or token instead.",
    );
    process.exit(1);
  }
  if (lowered.length) {
    console.error(
      "A count dropped - run `just ratchet-update` and commit design-ratchet.json.",
    );
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
