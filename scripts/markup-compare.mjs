/**
 * The markup comparison of `docs/specs/documents.md` ("Rules of the arc"): PR evidence that a change leaves every
 * prerendered page's `<head>` and DOM as they are on the base. Not a lasting test, so `just check` does not run it.
 *
 * `node scripts/markup-compare.mjs [--base <ref>] [--out <dir>] [--no-build] [--keep]`
 *
 * - Builds the base ref (default `origin/main`) in a temporary worktree and the current checkout, each fresh
 *   (`turbo --force`) and with `CAL_API_KEY=` (no booking key reaches either build).
 * - Normalises every prerendered page of `apps/marketing/.next/server/app/` (`normalizeHtml`) and every prerendered
 *   route body (manifest, robots, sitemap, icons), then diffs the two sides with `git diff --no-index`.
 * - Exits 1 on any difference or on a page that only one side has.
 *
 * `--no-build` reuses both builds (the worktree needs `--keep` from the previous run); `--keep` leaves the
 * worktree for that. `--out` defaults to `<tmpdir>/skillsite-markup-compare`.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_OUTPUT = path.join("apps", "marketing", ".next", "server", "app");

/** Elements without a closing tag: they open no level. */
const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/** A start or end tag, with quoted attribute values that may hold `>`. */
const TAG =
  /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>/g;

/** Route bodies that are text; any other body (an icon) is compared by its hash. */
const TEXT_BODY = /\.(?:webmanifest|txt|xml|json)\.body$/;

/**
 * One prerendered page as one element per line, indented by depth, texts as JSON strings:
 *
 * 1. From `<html>` on, so `<head>`, `<body>` and the attributes of `<html>` count.
 * 2. `<script>` elements other than JSON-LD structured data and HTML comments are removed; hashed `/_next/static/…` URLs (plain and URL-encoded, as
 *    in `/_next/image?url=…`) become a placeholder.
 * 3. Adjacent text nodes merge (React separates them with `<!-- -->`) and whitespace collapses to one space.
 *
 * @param {string} html
 * @returns {string}
 */
export function normalizeHtml(html) {
  const start = html.search(/<html[\s>]/i);
  const source = (start === -1 ? html : html.slice(start))
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (script, attributes) =>
      // Structured data is page content, not a hashed bundle: it stays.
      /type=["']?application\/ld\+json/i.test(attributes) ? script : "",
    )
    .replace(/\/_next\/static\/[^"'\s,)]+/g, "/_next/static/…")
    .replace(/%2F_next%2Fstatic%2F[^&"'\s,)]+/g, "%2F_next%2Fstatic%2F…");

  const lines = [];
  let depth = 0;
  let text = "";
  const flushText = () => {
    const collapsed = text.replace(/\s+/g, " ");
    if (collapsed)
      lines.push(`${"  ".repeat(depth)}${JSON.stringify(collapsed)}`);
    text = "";
  };

  let last = 0;
  for (const match of source.matchAll(TAG)) {
    text += source.slice(last, match.index);
    last = match.index + match[0].length;
    flushText();
    const tag = match[0].replace(/\s+/g, " ");
    const name = /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(tag)[1].toLowerCase();
    if (tag.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      lines.push(`${"  ".repeat(depth)}${tag}`);
    } else {
      lines.push(`${"  ".repeat(depth)}${tag}`);
      if (!VOID.has(name) && !tag.endsWith("/>")) depth++;
    }
  }
  text += source.slice(last);
  flushText();
  return `${lines.join("\n")}\n`;
}

/**
 * Every prerendered page and route body of a build, by its path below `server/app`, normalised for the diff.
 *
 * @param {string} appOutput absolute path of `.next/server/app`
 * @returns {Map<string, string>}
 */
export function prerendered(appOutput) {
  const pages = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith(".html"))
        pages.set(
          path.relative(appOutput, file),
          normalizeHtml(readFileSync(file, "utf8")),
        );
      else if (TEXT_BODY.test(entry.name))
        pages.set(path.relative(appOutput, file), readFileSync(file, "utf8"));
      else if (entry.name.endsWith(".body"))
        pages.set(
          path.relative(appOutput, file),
          `sha256 ${createHash("sha256").update(readFileSync(file)).digest("hex")}\n`,
        );
    }
  };
  walk(appOutput);
  return pages;
}

function run(command, args, cwd) {
  console.log(`$ ${[command, ...args].join(" ")}  (${cwd})`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CAL_API_KEY: "" },
  });
  if (result.status !== 0) {
    console.error(`markup-compare: ${command} ${args.join(" ")} failed`);
    process.exit(2);
  }
}

function git(args, cwd = repoRoot) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(2);
  }
  return result.stdout.trim();
}

function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at === -1 ? fallback : process.argv[at + 1];
}

function main() {
  const base = option("--base", "origin/main");
  const out = path.resolve(
    option("--out", path.join(os.tmpdir(), "skillsite-markup-compare")),
  );
  const build = !process.argv.includes("--no-build");
  const keep = process.argv.includes("--keep");
  const worktree = path.join(out, "base-worktree");
  const commit = git(["rev-parse", "--verify", `${base}^{commit}`]);

  if (build) {
    if (existsSync(worktree)) git(["worktree", "remove", "--force", worktree]);
    mkdirSync(out, { recursive: true });
    git(["worktree", "add", "--detach", worktree, commit]);
    run("pnpm", ["install", "--frozen-lockfile"], worktree);
    // `--force`: a fresh build on both sides, not outputs replayed from turbo's cache.
    run("pnpm", ["build", "--force"], worktree);
    run("pnpm", ["build", "--force"], repoRoot);
  }

  const outputs = {
    base: path.join(worktree, APP_OUTPUT),
    head: path.join(repoRoot, APP_OUTPUT),
  };
  for (const output of Object.values(outputs)) {
    if (!existsSync(output)) {
      console.error(
        `markup-compare: no build at ${output}; run without --no-build (and with --keep to reuse it later)`,
      );
      process.exit(2);
    }
  }
  const sides = {
    base: prerendered(outputs.base),
    head: prerendered(outputs.head),
  };
  for (const [side, pages] of Object.entries(sides)) {
    rmSync(path.join(out, side), { recursive: true, force: true });
    for (const [page, content] of pages) {
      const file = path.join(out, side, `${page}.txt`);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
  }
  if (!keep) git(["worktree", "remove", "--force", worktree]);

  const only = (a, b) =>
    [...sides[a].keys()].filter((page) => !sides[b].has(page));
  const onlyBase = only("base", "head");
  const onlyHead = only("head", "base");
  const differing = [...sides.base.keys()].filter(
    (page) =>
      sides.head.has(page) && sides.head.get(page) !== sides.base.get(page),
  );

  if (differing.length > 0)
    spawnSync(
      "git",
      [
        "diff",
        "--no-index",
        "--no-color",
        path.join(out, "base"),
        path.join(out, "head"),
      ],
      { stdio: "inherit" },
    );
  const compared = sides.base.size - onlyBase.length;
  console.log(
    `markup-compare: ${base} (${commit.slice(0, 7)}) against the working tree: ${compared} pages compared, ${differing.length} differ`,
  );
  for (const page of onlyBase) console.log(`  only on ${base}: ${page}`);
  for (const page of onlyHead) console.log(`  only on the branch: ${page}`);
  for (const page of differing) console.log(`  differs: ${page}`);
  console.log(`  normalised pages: ${out}/{base,head}`);
  process.exit(
    differing.length + onlyBase.length + onlyHead.length > 0 ? 1 : 0,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
