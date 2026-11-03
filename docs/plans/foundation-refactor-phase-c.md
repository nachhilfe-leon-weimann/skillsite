# Foundation Refactor - Phase C (Design system in `@skillsite/ui`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking. **Each task is one slice = one branch = one PR.** Phase B is not merged yet: the slices form one
> linear stack on top of it (see _Execution order_). **This plan is written in waves.** Wave 1 fixed the
> skeleton of all of phase C and detailed C1-C3 (Tasks 1-3, implemented). Wave 2 (this version) details C4 and C5,
> split into the PR-sized Tasks 4a-4c and 5a-5c, written against the code after C3 (943fb6e) and dry-run end to
> end. Wave 3 splits C6 into PR-sized tasks and details C7. A task that still reads "_Detailed steps: wave 3_" is
> not ready to implement.
>
> **Paths.** Commands use two placeholders the controller fills in each dispatch: `<worktree>` is the absolute path
> of the task's worktree, `<scratch>` the absolute path of the task's scratch dir
> (`.superpowers/sdd/<plan-workspace>/scratch/taskN/`, gitignored). The agent harness keeps no shell variables,
> functions or working directory between commands, so every command block starts with
> `source <scratch>/toolkit.sh` (it sets `WORKTREE`, `SCRATCH`, `BASE`, `serve` and `stop`; _Verification
> toolkit_) and names directories explicitly.

**Goal:** Make `@skillsite/ui` the design system of the spec's target shape - grouped modules and styles with an
explicit export map (C1), variants on CVA with role names and `Button asChild` (C2), every design value a named
token (C3), one typography API (C4), layout and shell in the package (C5), primitives for the hand-built duplicates
(C6) - without changing a rendered pixel, then run the headless-widget spike that gates C8 (C7).

**Architecture:** C1-C6 are refactors, proven identical by measurement, not by eye. C1 and C2 keep every element,
attribute and text node of the server-rendered HTML and the built CSS byte-identical (_Verification toolkit_:
HTML snapshot); C2 also compares computed styles, because four of its buttons render only after interaction. C3
renames classes by design, so it proves three things: the rendered HTML equals the old one with the class map
applied; every old/new class pair computes the same style in every forced state (class probe); and every element of
72 page states - all routes, 390 and 1280 px, light and dark, open menus, the booker calendar and form - computes the
same style, also under forced `:hover`/`:focus`/`:focus-visible`/`:active` (computed-style comparison). Every token
is defined with the exact CSS expression its arbitrary class compiled to, so no value can drift. `cn` stays the one
class merger, and the drift test in `utils/cn.test.ts` fails for any `@theme` namespace or token it does not know.
C4 and C5 unify and move components: their HTML is proven equal to the old one after sorting class tokens (CVA and
moved components may order the same classes differently) and, in C5c, masking the hashed font class names - with
the slice's map applied where a class or a tag is renamed - and computed styles are compared as in C3; the one
deliberate DOM change (a heading level on `/faecher`) is its own `fix:` PR.

**Tech Stack:** pnpm 12.4.2 + Turborepo 2.11.2, Node 26, Next.js 16.3.5 (Turbopack build, Lightning CSS minifier),
React 19.3.0, TypeScript 7.0.2, Tailwind CSS 4.3.3, tailwind-merge 3.7.0, Vitest 5.0.2 (node + jsdom), Playwright
1.63 (Chromium), Storybook 10.6.0; new in C2: `class-variance-authority` 0.7.1, `@radix-ui/react-slot` 1.3.3.

**Spec:** [`docs/specs/foundation-refactor.md`](../specs/foundation-refactor.md) - phase C. Read _Target shape_
(including **Tokens**), _Rules of the refactor_, _Rules for implementing agents_ and decisions **E-06**, **E-07**,
**E-08**, **E-11**, **E-13**, **E-17**, **E-21**, **V2**, **V4**, **V8** before starting any task.

## Global Constraints

- English in code, comments, identifiers, specs and commits; German only in visible content.
- C1-C6 are refactors: PR titles use `refactor:`, `build:`, `chore:` or `test:`, never `fix:` or `feat:`. Nothing a
  visitor sees changes - no pixel, text, `<head>` entry or behaviour. Where a unification would move a pixel, keep
  the old value as a named variant or token; no rounding (that is phase E). If a slice cannot stay identical, stop
  and report. The one exception is Task 4c, the `/faecher` heading-level fix: a `fix(a11y):` PR of its own
  (_Decisions_), which changes three tags and nothing visible.
- Every task proves identity with the _Verification toolkit_ below and puts the numbers in its PR body.
- Visible text is never edited; bulk edits over German files only with UTF-8-safe tools (`perl -CSD -pi -e ...`).
- Every new theme token or utility is registered in `cn` (`packages/ui/src/utils/cn.ts`) with a test; the drift
  test fails otherwise. Never raise a `design-ratchet.json` count; when one drops, run `just ratchet-update`.
- `@skillsite/ui` imports nothing from an app. Stories and tests are never exported; a new module gets its export
  in `packages/ui/package.json` in the same commit (`exports.test.ts` enforces it from Task 1 on).
- `just check` green before every commit. Commit with the task's PR title as the message: plain, **no trailer of
  any kind**. Never name the maintainer (write "the maintainer"). Push, PR and merge follow the rules file of the
  run; never change repo settings, rulesets, the GitHub App or Dokploy.
- Tick the slice's acceptance boxes in the spec in the same PR. The C7 box is ticked only after the maintainer
  has chosen.
- Scratch output (snapshots, logs, scripts, before-trees) goes only to `<scratch>`, never into the repo.

### Verification toolkit

Everything here lives in `<scratch>`; nothing is committed. Measured on this tree: two runs of each script against
the same build report no difference, and a deliberate change (one accent tint 14 -> 15 %, the `hover:` wash
`overlay-10` 10 -> 11 %, a font size +0.01rem, a shadow blur +1px) is reported on every element it touches, in
every state - forced `:hover` does reach Tailwind's `@media (hover: hover)` rules.

**`toolkit.sh`** - write it once per task, in its first step, before any change (it records `BASE`, the commit the
task starts from):

```bash
cat > <scratch>/toolkit.sh <<EOF
WORKTREE=<worktree>
SCRATCH=<scratch>
BASE=$(git -C <worktree> rev-parse HEAD)
EOF
cat >> <scratch>/toolkit.sh <<'EOF'
# serve <tree> <port>: run the production build of <tree> on <port>. Always stops the
# port first: a `next start` that outlived a rebuild serves the new files with the old
# manifests (measured: missing CSS, HTTP 500), and a second `next start` on a busy port
# fails silently. CAL_API_KEY is pinned empty so every tree renders the booker's
# "unconfigured" state (a key in a copied .env would otherwise change /termin).
serve() {
  kill $(lsof -ti tcp:"$2") 2>/dev/null; sleep 1
  (cd "$1/apps/marketing" && CAL_API_KEY= pnpm start -p "$2" > "$SCRATCH/server-$2.log" 2>&1 &)
  until curl -sf "localhost:$2/health" > /dev/null; do sleep 1; done
}
stop() { kill $(lsof -ti tcp:"$1") 2>/dev/null; }
EOF
```

`before` runs on port 3110, `after` on 3111 (`just smoke` uses 3100). If `serve` does not return within a minute,
read `$SCRATCH/server-<port>.log`. `next start` does not override a variable that is already set, even when empty
(checked in `@next/env` 16.3.5), so `CAL_API_KEY=` wins over any `.env`.

**Before tree** (Tasks 2 and 3 run both builds at once):

```bash
source <scratch>/toolkit.sh
git -C "$WORKTREE" worktree add --detach "$SCRATCH/before" "$BASE"
cd "$SCRATCH/before" && pnpm install --frozen-lockfile && just build
# when the task is done:
#   git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

**HTML snapshot** - `<scratch>/snapshot-html.mjs`. One line per element (tag and sorted attributes) and per text
node for 14 URLs (every route, `/zahlung` valid and invalid, a 404), hashed `/_next/static/` names masked, script
tags left out (they follow the chunking, not the markup) except structured data (`application/ld+json`, kept from
wave 2 on: it is content), plus the served stylesheets as `_styles.css`. Usage:
`node "$SCRATCH/snapshot-html.mjs" <tree> http://localhost:<port> "$SCRATCH/html-<name>"`, then
`diff -r "$SCRATCH/html-before" "$SCRATCH/html-after"`.

```js
// Snapshot the server-rendered HTML of every route as one line per element/text node
// (hashes aside, JSON-LD kept), plus the stylesheets the pages load (_styles.css).
// Usage: node snapshot-html.mjs <repo-root> <base-url> <out-dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const [root, baseUrl, outDir] = process.argv.slice(2);
const { JSDOM } = createRequire(path.join(root, "packages/ui/package.json"))(
  "jsdom",
);

const ROUTES = [
  "/",
  "/faecher",
  "/ablauf",
  "/preise",
  "/ueber-mich",
  "/kontakt",
  "/termin",
  "/online-lernen",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/zahlung?re=RE-1840&betrag=90,00%20EUR",
  "/zahlung?re=x&betrag=abc",
  "/gibt-es-nicht",
];
// Hashed build artefacts: chunk and media file names (plain and URL-encoded).
const unhash = (value) =>
  value.replace(/(_next(?:\/|%2F)static(?:\/|%2F))[^"'\s,&)]+/g, "$1*");
// Script tags and script preloads differ with chunking, not with markup. Structured
// data (JSON-LD) is content, not a chunk: it stays in the snapshot (from C4 on).
const skip = (el) =>
  (el.tagName === "SCRIPT" &&
    el.getAttribute("type") !== "application/ld+json") ||
  (el.tagName === "LINK" &&
    (el.getAttribute("as") === "script" ||
      el.getAttribute("rel") === "modulepreload"));

mkdirSync(outDir, { recursive: true });
const stylesheets = [];
for (const route of ROUTES) {
  // Never follow redirects: the valid /zahlung query redirects to the payment provider.
  const response = await fetch(baseUrl + route, { redirect: "manual" });
  const html = await response.text();
  const { document } = new JSDOM(html).window;
  const lines = [
    `status ${response.status} ${response.headers.get("location") ?? ""}`,
  ];
  const walk = (node, depth) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const text = child.textContent.replace(/\s+/g, " ").trim();
        if (text) lines.push(`${"  ".repeat(depth)}"${text}"`);
      } else if (child.nodeType === 1 && !skip(child)) {
        const attrs = [...child.attributes]
          .map((a) => `${a.name}="${unhash(a.value)}"`)
          .sort();
        lines.push(
          `${"  ".repeat(depth)}<${child.tagName.toLowerCase()} ${attrs.join(" ")}>`,
        );
        walk(child, depth + 1);
      }
    }
  };
  walk(document, 0);
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute("href");
    if (!stylesheets.includes(href)) stylesheets.push(href);
  }
  const name =
    route === "/" ? "index" : route.slice(1).replace(/[^a-z0-9-]+/gi, "_");
  writeFileSync(path.join(outDir, `${name}.txt`), lines.join("\n") + "\n");
  console.log(`${route}: ${lines.length} lines`);
}
// Built CSS, in the order first loaded. Read the served files: .next/static keeps
// chunks of earlier builds, so a glob over it can pick a stale one.
const css = [];
for (const href of stylesheets)
  css.push(await (await fetch(baseUrl + href)).text());
writeFileSync(path.join(outDir, "_styles.css"), css.join("\n"));
console.log(`${stylesheets.length} stylesheet(s)`);
```

**Computed-style comparison** - `<scratch>/compare-computed.mjs`. Opens every scenario in both builds side by
side - 13 routes at 390 and 1280 px (the booker shows its "unconfigured" notice there); the `/termin` and `/kontakt`
booker with the availability API stubbed (two open days: one preselected, one "available, not selected"), once at
the calendar and once filled up to the form; the open mobile menu at 390 px; the open "Online lernen" dropdown at
1280 px - light and dark, reduced motion (reveals and counters at their end state). It compares the computed value
of every standard CSS property of every element, then forces `:hover`, `:focus`, `:focus-visible` and `:active` on
each interactive element and compares its subtree again. Custom properties are ignored on purpose (new tokens add
variables; only the properties they feed render). Usage:
`node "$SCRATCH/compare-computed.mjs" <tree> http://localhost:3110 http://localhost:3111 [scenario-regex]`. A full
run takes about 5 minutes: **run it with a 600000 ms timeout or in the background**. It prints
`72 page states, 20374 elements, 14768 forced pseudo-states compared.` (on this tree) and ends with
`No differences.` or a list of `element: property: before -> after` and exit code 1. Two options (wave 2), both
off by default: `HEADING_LEVELS=ignore` counts `h1`-`h6` as one tag in the element paths (for a heading-level fix,
whose tag change the HTML diff pins); `EXPECT=<file.json>` lists allowed differences (`tool: "computed"`), each of
which must occur at least once.

```js
// Compare the computed styles of every element between two running builds
// (before/after), per route and scenario, at 390px and 1280px, light and dark,
// including forced :hover/:focus/:focus-visible/:active on every interactive
// element. Reduced motion, so reveals and counters sit at their end state.
// Usage: node compare-computed.mjs <repo-root> <before-url> <after-url> [scenario-filter]
// (the optional filter is a regular expression on the scenario names below).
// Environment (both optional, for slices with a deliberate non-visual change):
//   HEADING_LEVELS=ignore  h1-h6 count as one tag in element paths (a heading level
//                          fix keeps every computed value; the HTML diff pins the tag)
//   EXPECT=<file.json>     [{ "tool": "computed", "path": "<regex>", "property": "...",
//                          "before": "...", "after": "..." }]: differences that are
//                          allowed; each entry must match at least once, or the run
//                          fails (entries with "tool": "probe" are for probe-classes)
// Exit code 1 and a list of differences when anything differs.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const [root, beforeUrl, afterUrl, filter = ""] = process.argv.slice(2);
const HEADING_LEVELS = process.env.HEADING_LEVELS === "ignore";
const EXPECTED = (
  process.env.EXPECT ? JSON.parse(readFileSync(process.env.EXPECT, "utf8")) : []
)
  .filter((entry) => entry.tool === "computed")
  .map((entry) => ({ ...entry, path: new RegExp(entry.path), seen: 0 }));
const { chromium } = createRequire(
  path.join(root, "apps/marketing/package.json"),
)("@playwright/test");

/**
 * Two bookable days (the last two of the requested month), one slot at 10:00 each:
 * the booker preselects one, so the other shows the "available, not selected" look.
 */
async function stubAvailability(page) {
  await page.route(/\/api\/booking\/availability\?/, (route) => {
    const url = new URL(route.request().url());
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = (d) =>
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return route.fulfill({
      json: {
        status: "ok",
        timeZone: "Europe/Berlin",
        days: [lastDay - 1, lastDay].map((d) => ({
          date: day(d),
          slots: [{ time: "10:00", start: `${day(d)}T10:00:00.000+02:00` }],
        })),
      },
    });
  });
}

const ROUTES = [
  "/",
  "/faecher",
  "/ablauf",
  "/preise",
  "/ueber-mich",
  "/kontakt",
  "/termin",
  "/online-lernen",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/zahlung?re=x&betrag=abc",
  "/gibt-es-nicht",
];
/** Scenarios: a route, the widths it applies to, and what to do before measuring. */
const SCENARIOS = [
  ...ROUTES.map((route) => ({ name: route, route, widths: [390, 1280] })),
  // The route scenarios above run without a Cal.com key: the booker shows its
  // "unconfigured" notice. These stub the availability API instead.
  ...["/termin", "/kontakt"].map((route) => ({
    name: `${route} booker calendar`,
    route,
    widths: [390, 1280],
    stub: true,
    act: async (page) =>
      page.getByRole("button", { name: "10:00" }).first().waitFor(),
  })),
  {
    name: "/termin booker form",
    route: "/termin",
    widths: [390, 1280],
    stub: true,
    act: async (page) => {
      await page.getByRole("button", { name: "10:00" }).first().click();
      await page.getByRole("radio", { name: "Discord" }).click();
      await page.getByRole("radio", { name: /Mathe/ }).click();
    },
  },
  {
    name: "/kontakt booker form",
    route: "/kontakt",
    widths: [390, 1280],
    stub: true,
    act: async (page) => {
      await page.getByRole("button", { name: "10:00" }).first().click();
      await page.getByRole("button", { name: /Mathe/, pressed: false }).click();
    },
  },
  {
    name: "/ mobile menu open",
    route: "/",
    widths: [390],
    act: async (page) => page.getByRole("button", { name: "Menü" }).click(),
  },
  {
    name: "/ platform dropdown open",
    route: "/",
    widths: [1280],
    act: async (page) =>
      page
        .getByRole("banner")
        .getByRole("button", { name: "Online lernen" })
        .click(),
  },
];
const STATEFUL =
  'a, button, input, textarea, select, [tabindex], [role="radio"], [class*="hover:"], [class*="focus"], [class*="active:"], .group, .lift';
const STATES = ["hover", "focus", "focus-visible", "active"];

/**
 * Computed style of an element and its descendants, one string per element.
 * Custom properties are left out (new tokens add variables by design; only the
 * standard properties they feed decide what renders), and so are elements that
 * differ with chunking rather than markup (head, scripts).
 */
function subtreeStyles(headingLevels) {
  const skip = new Set([
    "HEAD",
    "SCRIPT",
    "LINK",
    "STYLE",
    "TEMPLATE",
    "NOSCRIPT",
  ]);
  const out = [];
  const tag = (el) =>
    headingLevels && /^H[1-6]$/.test(el.tagName)
      ? "h#"
      : el.tagName.toLowerCase();
  const visit = (el, where) => {
    const cs = getComputedStyle(el);
    const props = [];
    for (let i = 0; i < cs.length; i++) {
      if (!cs[i].startsWith("--"))
        props.push(`${cs[i]}: ${cs.getPropertyValue(cs[i])}`);
    }
    out.push([where, props.sort().join("; ")]);
    [...el.children]
      .filter((child) => !skip.has(child.tagName))
      .forEach((child, i) => visit(child, `${where}>${tag(child)}:${i}`));
  };
  visit(this, tag(this));
  return out;
}

async function open(browser, baseUrl, scenario, width, scheme) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: scheme,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  // No network beyond the local server (e.g. the Umami script).
  await context.route(
    /^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/,
    (route) => route.fulfill({ status: 204, body: "" }),
  );
  if (scenario.stub) await stubAvailability(page);
  await page.goto(baseUrl + scenario.route, { waitUntil: "networkidle" });
  if (scenario.act) await scenario.act(page);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { context, page };
}

async function measure(page) {
  const all = await page.evaluate(
    `(${subtreeStyles.toString()}).call(document.documentElement, ${HEADING_LEVELS})`,
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root: doc } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: doc.nodeId,
    selector: STATEFUL,
  });
  const states = [];
  for (const [index, nodeId] of nodeIds.entries()) {
    const { object } = await cdp.send("DOM.resolveNode", { nodeId });
    for (const state of STATES) {
      await cdp.send("CSS.forcePseudoState", {
        nodeId,
        forcedPseudoClasses: [state],
      });
      const { result } = await cdp.send("Runtime.callFunctionOn", {
        objectId: object.objectId,
        functionDeclaration: subtreeStyles.toString(),
        arguments: [{ value: HEADING_LEVELS }],
        returnByValue: true,
      });
      states.push([`interactive#${index}:${state}`, result.value]);
      await cdp.send("CSS.forcePseudoState", {
        nodeId,
        forcedPseudoClasses: [],
      });
    }
  }
  return { all, states };
}

/** Report every element whose computed style differs, property by property. */
function diffLists(label, before, after, report) {
  if (before.length !== after.length) {
    report.push(
      `${label}: ${before.length} vs ${after.length} elements (structure differs)`,
    );
    return;
  }
  for (let i = 0; i < before.length; i++) {
    const [where, a] = before[i];
    const [whereAfter, b] = after[i];
    if (where !== whereAfter) {
      report.push(`${label}: element ${i} is ${where} vs ${whereAfter}`);
      return;
    }
    if (a === b) continue;
    const pa = new Map(a.split("; ").map((p) => p.split(/: (.*)/s)));
    const pb = new Map(b.split("; ").map((p) => p.split(/: (.*)/s)));
    const props = [...new Set([...pa.keys(), ...pb.keys()])]
      .filter((k) => pa.get(k) !== pb.get(k))
      .filter((k) => {
        const allowed = EXPECTED.find(
          (e) =>
            e.path.test(where) &&
            e.property === k &&
            e.before === pa.get(k) &&
            e.after === pb.get(k),
        );
        if (allowed) allowed.seen++;
        return !allowed;
      });
    if (!props.length) continue;
    report.push(
      `${label} ${where}: ${props.map((k) => `${k}: ${pa.get(k)} -> ${pb.get(k)}`).join(" | ")}`,
    );
  }
}

const browser = await chromium.launch();
const report = [];
let pages = 0;
let elements = 0;
let forced = 0;
for (const scenario of SCENARIOS.filter((s) =>
  new RegExp(filter).test(s.name),
)) {
  for (const width of scenario.widths) {
    for (const scheme of ["light", "dark"]) {
      const label = `${scenario.name} @${width} ${scheme}`;
      const before = await open(browser, beforeUrl, scenario, width, scheme);
      const after = await open(browser, afterUrl, scenario, width, scheme);
      const a = await measure(before.page);
      const b = await measure(after.page);
      diffLists(label, a.all, b.all, report);
      if (a.states.length !== b.states.length) {
        report.push(
          `${label}: ${a.states.length} vs ${b.states.length} forced states`,
        );
      } else {
        a.states.forEach(([name, list], i) =>
          diffLists(`${label} ${name}`, list, b.states[i][1], report),
        );
      }
      pages++;
      elements += a.all.length;
      forced += a.states.length;
      await before.context.close();
      await after.context.close();
      process.stdout.write(
        `${label}: ${a.all.length} elements, ${a.states.length} forced states\n`,
      );
    }
  }
}
await browser.close();
console.log(
  `\n${pages} page states, ${elements} elements, ${forced} forced pseudo-states compared.`,
);
for (const entry of EXPECTED) {
  if (entry.seen)
    console.log(
      `expected: ${entry.property} ${entry.before} -> ${entry.after} at ${entry.path} (${entry.seen}x)`,
    );
  else
    report.push(
      `expected difference never seen: ${entry.path} ${entry.property}`,
    );
}
if (report.length) {
  console.log(`${report.length} differences:\n${report.join("\n")}`);
  process.exit(1);
}
console.log("No differences.");
```

**Class probe** - `<scratch>/probe-classes.mjs`, for slices that rename classes. For every `[from, to]` class-list
pair of the slice's map (entries that are source code - imports, JSX - are skipped) it renders one element with
the old classes in the before build and one with the new classes in the after build (inside `main` of `/`), and
compares their computed styles at 390 and 1280 px, light and dark, plain and with each of the four states forced.
This covers replacements whose element no scenario renders (the booking confirmation, the rate-limited state,
`error.tsx`). Usage: `node "$SCRATCH/probe-classes.mjs" <tree> http://localhost:3110 http://localhost:3111
<map.mjs>` (about a minute); `EXPECT=<file.json>` with `tool: "probe"` entries as above. It ends with
`No differences.` or the differing pairs and exit code 1.

```js
// Class probe: for every pair of a class map, render one element with the old
// classes in the before build and one with the new classes in the after build, and
// compare their computed styles - at 390 and 1280px, light and dark, plain and with
// :hover, :focus, :focus-visible and :active forced. Covers every replacement,
// including the ones whose element only renders in a state no scenario reaches.
// Usage: node probe-classes.mjs <repo-root> <before-url> <after-url> <map.mjs>
// EXPECT=<file.json> (optional) allows differences, as in compare-computed.mjs; here
// an entry with "tool": "probe" matches its "path" regex against `from -> to`.
// Exit code 1 and a list of differences when anything differs.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [root, beforeUrl, afterUrl, mapFile] = process.argv.slice(2);
const EXPECTED = (
  process.env.EXPECT ? JSON.parse(readFileSync(process.env.EXPECT, "utf8")) : []
)
  .filter((entry) => entry.tool === "probe")
  .map((entry) => ({ ...entry, path: new RegExp(entry.path), seen: 0 }));
const { REPLACEMENTS } = await import(
  pathToFileURL(path.resolve(mapFile)).href
);
const { chromium } = createRequire(
  path.join(root, "apps/marketing/package.json"),
)("@playwright/test");

/** Distinct [from, to] class-list pairs; source-code entries (imports, JSX) are skipped. */
const isClassList = (text) => /^[^<>"'{}=;\n]+$/.test(text);
const pairs = [
  ...new Map(
    REPLACEMENTS.filter(
      ([, from, to]) => isClassList(from) && isClassList(to),
    ).map(([, from, to]) => [`${from} ${to}`, [from, to]]),
  ).values(),
];
const STATES = [[], ["hover"], ["focus"], ["focus-visible"], ["active"]];

/** Computed styles (standard properties) of every probe, per forced state. */
async function probe(browser, baseUrl, classLists, width, scheme) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: scheme,
    reducedMotion: "reduce",
  });
  await context.route(
    /^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/,
    (route) => route.fulfill({ status: 204, body: "" }),
  );
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.evaluate((lists) => {
    const host = document.createElement("div");
    lists.forEach((classes, i) => {
      const element = document.createElement("div");
      element.id = `probe-${i}`;
      element.className = classes;
      element.textContent = "Probe";
      host.append(element);
    });
    document.querySelector("main").append(host);
  }, classLists);
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root: doc } = await cdp.send("DOM.getDocument", { depth: 0 });
  const result = [];
  for (let i = 0; i < classLists.length; i++) {
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: doc.nodeId,
      selector: `#probe-${i}`,
    });
    const states = [];
    for (const forced of STATES) {
      await cdp.send("CSS.forcePseudoState", {
        nodeId,
        forcedPseudoClasses: forced,
      });
      states.push(
        await page.evaluate((id) => {
          const cs = getComputedStyle(document.getElementById(id));
          const props = [];
          for (let j = 0; j < cs.length; j++) {
            if (!cs[j].startsWith("--"))
              props.push(`${cs[j]}: ${cs.getPropertyValue(cs[j])}`);
          }
          return props.sort().join("; ");
        }, `probe-${i}`),
      );
    }
    await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
    result.push(states);
  }
  await context.close();
  return result;
}

const browser = await chromium.launch();
const report = [];
for (const width of [390, 1280]) {
  for (const scheme of ["light", "dark"]) {
    const before = await probe(
      browser,
      beforeUrl,
      pairs.map(([from]) => from),
      width,
      scheme,
    );
    const after = await probe(
      browser,
      afterUrl,
      pairs.map(([, to]) => to),
      width,
      scheme,
    );
    pairs.forEach(([from, to], i) => {
      STATES.forEach((forced, s) => {
        if (before[i][s] === after[i][s]) return;
        const a = new Map(
          before[i][s].split("; ").map((p) => p.split(/: (.*)/s)),
        );
        const b = new Map(
          after[i][s].split("; ").map((p) => p.split(/: (.*)/s)),
        );
        const props = [...new Set([...a.keys(), ...b.keys()])]
          .filter((k) => a.get(k) !== b.get(k))
          .filter((k) => {
            const allowed = EXPECTED.find(
              (e) =>
                e.path.test(`${from} -> ${to}`) &&
                e.property === k &&
                e.before === a.get(k) &&
                e.after === b.get(k),
            );
            if (allowed) allowed.seen++;
            return !allowed;
          });
        if (!props.length) return;
        report.push(
          `@${width} ${scheme} :${forced[0] ?? "none"} "${from}" -> "${to}": ` +
            props.map((k) => `${k}: ${a.get(k)} -> ${b.get(k)}`).join(" | "),
        );
      });
    });
    console.log(
      `@${width} ${scheme}: ${pairs.length} pairs x ${STATES.length} states`,
    );
  }
}
await browser.close();
for (const entry of EXPECTED) {
  if (entry.seen)
    console.log(
      `expected: ${entry.property} ${entry.before} -> ${entry.after} at ${entry.path} (${entry.seen}x)`,
    );
  else
    report.push(
      `expected difference never seen: ${entry.path} ${entry.property}`,
    );
}
if (report.length) {
  console.log(`${report.length} differences:\n${report.join("\n")}`);
  process.exit(1);
}
console.log("No differences.");
```

**Expected HTML** - `<scratch>/expect-html.mjs`, for slices that rename classes or tags: writes the before snapshot
with the map applied (longest entries first, so a context entry wins over a bare value; an entry matches whole
tokens only and can be limited to named snapshot files), so the after snapshot is compared exactly, not filtered.
Usage: `node "$SCRATCH/expect-html.mjs" <map.mjs> "$SCRATCH/html-before" "$SCRATCH/html-expected"`, then normalise
both sides and `diff -r -x _styles.css` them - it must print nothing (the built CSS changes by design; the
computed-style tools cover it).

```js
// Build the expected "after" HTML snapshot of a slice that renames classes or tags:
// the before snapshot with the slice's map applied, so the real after snapshot can
// be diffed against it exactly. The map module exports REPLACEMENTS as
// [file, from, to, count, snapshots?] entries; `snapshots` (optional) limits an
// entry to those snapshot files, e.g. ["faecher.txt"]. An entry only matches whole
// tokens: `from` must start and end at a line edge, a space or a quote, so
// "text-sm" does not touch "focus:text-sm".
// Usage: node expect-html.mjs <map.mjs> <before-dir> <out-dir>
// then:  normalise both sides (normalize-snapshot.mjs) and diff -r -x _styles.css
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [mapFile, beforeDir, outDir] = process.argv.slice(2);
const { REPLACEMENTS } = await import(
  pathToFileURL(path.resolve(mapFile)).href
);
// Longest first: a context entry ("mt-1 text-[0.92rem]") wins over a bare value.
const map = [...REPLACEMENTS].sort((a, b) => b[1].length - a[1].length);
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(beforeDir)) {
  if (name === "_styles.css") continue; // the built CSS changes by design
  let text = readFileSync(path.join(beforeDir, name), "utf8");
  for (const [, from, to, , snapshots] of map) {
    if (snapshots && !snapshots.includes(name)) continue;
    const token = new RegExp(`(^|[ "])${escape(from)}(?=[ "]|$)`, "gm");
    text = text.replace(token, (_, edge) => edge + to);
  }
  writeFileSync(path.join(outDir, name), text);
}
console.log(`expected snapshot written to ${outDir}`);
```

**Normalised snapshot** - `<scratch>/normalize-snapshot.mjs` (wave 2): sorts the tokens of every class attribute
(CVA and moved components may emit the same classes in another order, which renders the same) and masks the hashed
next/font class names (they change when the font calls move). Usage:
`node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-<name>" "$SCRATCH/html-<name>-n"`.

```js
// Normalise an HTML snapshot (snapshot-html.mjs output) for slices that reorder
// classes or move next/font calls: the tokens of every class attribute are sorted,
// and the hashed next/font class names are masked - in the page files and in
// _styles.css. Usage: node normalize-snapshot.mjs <in-dir> <out-dir>
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [inDir, outDir] = process.argv.slice(2);
/** `bricolage_grotesque_1b97ba4b-module__NjNj1a__variable` -> `bricolage_grotesque_#-module__#__variable` */
const maskFonts = (text) =>
  text.replace(
    /(bricolage_grotesque|hanken_grotesk)_[0-9a-f]+-module__[A-Za-z0-9_-]+?__/g,
    "$1_#-module__#__",
  );
const sortClasses = (text) =>
  text.replace(
    / class="([^"]*)"/g,
    (_, list) => ` class="${list.split(" ").filter(Boolean).sort().join(" ")}"`,
  );

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(inDir)) {
  const text = maskFonts(readFileSync(path.join(inDir, name), "utf8"));
  writeFileSync(
    path.join(outDir, name),
    name === "_styles.css" ? text : sortClasses(text),
  );
}
console.log(`normalised snapshot written to ${outDir}`);
```

**Apply a map** - `<scratch>/apply-map.mjs` (wave 2): the codemod for map-driven slices; it applies the source
entries of a map (`[file, from, to, count, snapshots?]`; `(html)` entries only describe rendered HTML) as plain
substring replacements - the per-file counts are the guard - and refuses to write anything when a count differs. Usage: `node "$SCRATCH/apply-map.mjs" "$SCRATCH/<map.mjs>"` from the
worktree root.

```js
// Apply a slice's map (REPLACEMENTS of [file, from, to, count, snapshots?]) to the
// sources. Entries whose file is "(html)" only describe rendered HTML and are
// skipped. It replaces substrings, not whole tokens: a bare "text-sm" would also
// hit "text-small". The expected counts are the guard - give an entry enough
// context to be unique, and the script refuses to write anything when a count
// differs (the code moved; re-measure, do not guess).
// Usage (repo root): node <scratch>/apply-map.mjs <scratch>/<map.mjs>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { REPLACEMENTS } = await import(
  pathToFileURL(path.resolve(process.argv[2])).href
);

const files = new Map();
const errors = [];
for (const [file, from, to, expected] of REPLACEMENTS) {
  if (file === "(html)") continue;
  const source = files.get(file) ?? readFileSync(file, "utf8");
  const count = source.split(from).length - 1;
  if (count !== expected)
    errors.push(`${file}: "${from}" found ${count}x, expected ${expected}x`);
  files.set(file, source.split(from).join(to));
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
for (const [file, source] of files) writeFileSync(file, source);
console.log(`${files.size} files rewritten`);
```

Known properties of the pipeline (measured, so nobody is surprised):

- `next build` minifies with Lightning CSS: `bg-white/8` ships as `#ffffff14` with a
  `@supports (color:color-mix(...))` override to `color-mix(in oklab, var(--color-white) 8%, transparent)`;
  `bg-[color-mix(in_srgb,var(--coral)_14%,transparent)]` ships as `var(--coral)` plus the same kind of override.
  Chromium applies the override, so the computed value is the `color-mix(...)`, and its serialisation depends on
  the colour space (`in srgb` vs `in oklab`). A token therefore copies the exact expression and colour space.
- The app's `@source "../../../../packages/ui/src"` also scans tests and stories, so a class name that only
  appears in a test still generates a (never applied) CSS rule. It does not touch computed styles, but it does
  change the built CSS - a C4/C5 test uses class names that already exist.
- Tailwind resolves the `@import`s of `theme.css` itself: `@theme`, `@utility`, `@layer base` and `@custom-variant`
  work from the imported parts, and the built CSS stays byte-identical as long as the parts keep the source order
  (measured in the C1 dry run).
- Turborepo shares its cache between worktrees; a build of an unchanged tree is replayed from the cache. A change
  in `packages/ui` does invalidate the app build (checked with `turbo run build --dry=json`).
- next/font: the `@font-face` rules follow the import order of the module that calls it. Imported after
  `./globals.css`, they move from the top to the end of the CSS chunk; imported before it, the chunk keeps its order
  (the font spike, wave 2). The hashed class names change with the calling file's path.
- Preflight gives `h1`-`h6` the same computed styles (size and weight inherit, no margins), so a heading's level
  can change without a visible change.

## Review Focus

1. **A story, test or old flat path that still resolves** (E-07). The wildcard `"./*": "./src/*.tsx"` resolves
   `@skillsite/ui/button.stories` today. Task 1's `exports.test.ts` asserts that the export map equals the set of
   modules and that `*.stories`, `*.test` and the old flat paths fail with "not defined by exports".
2. **CVA reordering classes.** tailwind-merge keeps the later of two conflicting classes, so base -> variant ->
   size -> `className` is load-bearing. Task 2's `button.test.tsx` pins the exact class string of a
   variant + size + `className` combination; the HTML snapshot of all routes must stay identical.
3. **`asChild` losing an attribute, the client navigation or the look of a button nobody renders on load.** The
   HTML snapshot sees server HTML only and cannot tell `Link` from `<a>`; four of the 23 converted buttons render
   only after interaction (two in the mobile menu; the booker's unavailable notice and its rate-limited/blocked
   state) and `app/error.tsx` never renders in a build. Task 2 therefore adds `c2-check-links.mjs` (every
   `<Button asChild>` wraps `<a>` for exactly the 5 external hrefs and `Link` for the 18 routes; it fails when one
   is swapped - checked) and the computed-style comparison (mobile menu open, unconfigured notice) next to the
   snapshot and the `asChild` component test.
4. **A token or namespace forgotten in `cn`** (the B1 bug class). Task 3 rewrites the drift guard: every `@theme`
   token must fall into a registered or plain namespace by longest prefix (so `--font-weight-*` cannot pass as
   `--font-*`; checked by adding one), every token of each namespace must lose against a Tailwind utility of its
   group, and no colour token may be read as a font size. `brandColors` (TS) and the prose tokens are held to
   `tokens.css` and Tailwind's defaults by their own tests.
5. **An equal value with a different computed value** - a colour mixed in another colour space, a size token that
   also sets a line height, a shadow whose colour is wrapped differently, a state no page shows on load. Task 3 runs
   a positive control (a tint and a `hover:` wash nudged: both tools must flag them), the class probe over all 105
   distinct pairs in every forced state, and the computed-style comparison of 72 page states.

Wave 2 (C4, C5):

6. **A legal paragraph that changes size.** `ProseP` sets `font-size: 1rem` where the old doc paragraph inherited
   it. Task 4a's computed-style comparison covers every paragraph of `/agb`, `/datenschutz` and `/impressum`.
7. **An allowed difference that hides a real one.** Task 4b allows exactly one computed difference (a dot's
   `flex-shrink`), pinned to one element path, one property and both values; an expectation that never matches
   fails the run. Task 4c ignores heading levels only in the computed comparison and runs it once without the flag;
   its HTML diff pins the three changed tags.
8. **Font output that drifts when the calls move.** Task 5c masks only the hashed font class names and first
   proves that every raw difference carries one; the font module is imported ahead of `globals.css` (the spike
   showed the rules move otherwise).
9. **A stale import after a move.** `exports.test.ts` (an export for every module, none for a deleted one), the
   type check and a `grep` for the old paths in Tasks 5a and 5c.

## Decisions taken while planning

Given by the controller for this phase (not reopened):

- Phase C runs automatically through C1-C6 and the C7 spike and stops at the C7 gate: the maintainer picks Radix
  Primitives or React Aria Components. C8 and C9 get only the section _After the gate_ here.
- Waves: wave 1 detailed C1-C3; wave 2 details C4 and C5 (Tasks 4a-5c); wave 3 (C6 split into PR-sized tasks,
  C7) is written later against the then-current code - each wave a docs PR in the stack.
- Pixel-identical proof: built CSS and the text/class/attribute content of the built HTML (C1, C2); computed
  styles where classes legitimately change (C3 onwards) and where server HTML cannot see a state (C2). Exact
  scripts in the _Verification toolkit_.
- Drift guard: C3 makes the set of `@theme` namespaces a known list and registers every new namespace in `cn`
  with its conflict test. C1 moves `utils.ts`/`utils.test.ts` to `utils/cn.ts`/`utils/cn.test.ts`; the test then
  reads the theme through `styles/theme.css` and its imported parts.
- **styles/ split in C1 (controller ruling):** `packages/ui/styles/theme.css` becomes the entry file that imports
  `tokens.css`, `base.css`, `components.css` and `motion.css` in a fixed order (move only; built CSS
  byte-identical). The app's `@import "@skillsite/ui/styles/theme.css"` does not change.
- Ratchet: C3 drops `color-mix(`, `text-[`, `shadow-[`, `rounded-[`, `-[clamp(` and hex to the allow-listed rest.
- E-09 carry-over: Escape in the desktop "Online lernen" dropdown does not return focus to its trigger
  (`apps/marketing/src/components/layout/navbar.tsx`). It belongs to C8 (one dismiss logic); this plan records it
  in the spec's C8 technique and in _After the gate_. C1-C6 do not fix it.
- Order: C1 -> C2 -> C3 -> C4 -> C5 -> C6 -> C7 as one linear stack on `fix/a11y` (#155); every slice touches
  `packages/ui`, so none runs in parallel (E-17). D1 is not part of this plan.
- C5 font spike is an explicit decision branch; wave 2 ran it (Task 5c: yes, the package owns the fonts).
- C2 codemod names are the spec's, verbatim; variant maps are carried over 1:1 in the order base -> variant ->
  size -> `className`.
- Each task ticks its slice's boxes; the C7 spike ticks nothing.

Rulings by the planner (from the spec and the code; stated in the PR bodies):

- **C1 groups for files the target shape does not list:** `accordion` -> `primitives/`, `check-mark` (the glyph)
  -> `primitives/`, `utils.ts` -> `utils/cn.ts`; `hooks/` keeps its paths. C3 adds `tokens/colors.ts` (TS mirror of
  brand colours) - a group the target shape does not list either.
- **C1 styles parts follow the existing sections in source order:** `tokens.css` (dark variant, raw values,
  `@theme` mapping, motion tokens), `base.css` (`@layer base`), `components.css` (the class recipes: gradient,
  section rhythm, hyphenation, scrollbar - the spec's "components" layer of shared CSS), `motion.css` (`lift`,
  keyframes, `.check-draw`, `.reveal`). Keeping the source order is what keeps the built CSS byte-identical and the
  unlayered motion rules in their cascade order.
- **C1 splits `typography.tsx` verbatim** into `typography/heading.tsx` (`Heading`, `HeadingSize`),
  `typography/text.tsx` (`Text`, `TextSize`, `TextTone`, `Address`), `typography/lead.tsx` (`Lead`) and
  `typography/prose.tsx` (`H1`-`H3`, `P`, `Small`, `Muted`, `InlineLink`), so the import paths are final from C1 on
  and C4 edits these files in place.
- **C1 export map:** every module is listed by name (no `*` pattern for modules); the stylesheet folder keeps
  `"./styles/*"` (it holds CSS only).
- **C2 converts the four class-map components** to CVA: `Button`, `Tag`, `Text`, `Heading`. `Select` keeps its
  multi-part tone record (one class per slot; CVA would not simplify it) but its tone key follows E-08:
  `on-navy` -> `inverse`. The app's `Logo` keeps its ternaries; `onDark` becomes `tone="inverse"`. `Eyebrow` gets
  its variants in C4.
- **C2 `LinkButton` call sites:** LinkButton's own rule decides per href, applied statically: internal hrefs
  become `<Button asChild ...><Link href=...>`, `mailto:`/`https:` hrefs `<Button asChild ...><a href=...>`;
  `target` and `rel` move to the `<a>` (they are not button attributes); everything else stays on `Button` and
  reaches the element through `Slot`.
- **C3 token names** are role names chosen by the planner (see Task 3); values are the old ones 1:1. Two roles
  with the same value today get two tokens (they may diverge in phase E); a role used with two values gets two.
  The stacking tokens are named by layer: `z-raised` (10, a local lift above siblings) and `z-dropdown` (20, the
  Select panel) are two roles even where both sit inside a positioned parent.
- **C3 white washes** use `color-mix(in oklab, var(--color-white) N%, transparent)` - exactly what Tailwind's
  `white/N` compiles to; coral tints keep `in srgb`. Switching the colour space changes the computed value.
- **C3 role sizes** are size-only `--text-*` tokens (no `--line-height`), so each compiles to a bare `font-size`
  like its arbitrary class did.
- **C3 prose tokens** (`prose-h2`, `prose-h3`, `prose-body`, `prose-sm`, `prose-xs`) are defined and tested
  against Tailwind's `theme.css`; C4 applies them with the Prose module. `raw-text-size` therefore stays at 21 in
  C3 and drops in C4.
- **C3 semantic roles** (`--accent`, `--accent-2`, `--on-accent`, `--inverse`, `--on-inverse`,
  `--on-inverse-soft`, `--on-inverse-muted`) are added as aliases and utilities; existing hue-named utilities keep
  working and are not renamed in C3. New tokens are defined on the roles (`accent-tint-*` on `--accent`).
- **C3 TS hex:** `theme-color` (layout), the manifest and the WhatsApp QR code read `brandColors` from
  `@skillsite/ui/tokens/colors`. The Open Graph image keeps its literals (see _Open points_), allow-listed.
- **Not in C3** (not in the spec's list, not counted by the ratchet; listed so nobody "fixes" them in passing):
  4 `leading-[..]` and 5 `tracking-[..]`, other arbitrary lengths (`h-[1.05em]`, `mt-[0.7rem]`,
  `underline-offset-[3px]`, `border-[1.5px]`, grid templates, `[--lift:..]`, `[--reveal-travel:6px]`,
  `[animation-delay:80ms]`), opacity modifiers other than white (`bg-ink/40`, 2x `bg-surface-2/60`,
  `text-ink-soft/50`, `bg-black/45`), the Tailwind default `shadow` on `Switch`, `max-w-205/220/230` (C5: 205 and 220
  become `Container` sizes in Task 5a; 230 and the `max-w-220` quote card are not page containers - C6/D5), the app
  stylesheet's `z-index: 5` (iOS toolbar tint), the dead `--maxw` and `--blue` (D6).

Rulings by the planner, wave 2 (C4, C5):

- **C4 in three PRs:** 4a moves the legal pages onto a Prose module (one check: the three legal pages), 4b builds
  the one typography API and migrates the hand-built eyebrows, headings and raw sizes, 4c fixes the `/faecher`
  heading outline. The spec lists the outline under C4; because it changes screen-reader behaviour - a bug under
  E-09 - and `CLAUDE.md` wants each bug in its own `fix:` PR, it is `fix(a11y): ...`, and 4a/4b stay refactors
  without DOM changes.
- **Tone vocabulary:** `Text`/`Heading` tones are `default | muted | inverse | inverse-soft | inherit`; C2's
  `inverse-muted` (`text-on-navy-soft`) is renamed `inverse-soft`, the C3 role `--on-inverse-soft` it is. `Eyebrow`
  tones are `accent | muted | inverse-accent | inverse-muted | on-accent` (`--on-inverse-muted` = on-navy-muted;
  `inverse-accent` = the blue label on navy). `Heading` defaults to `inherit` (it takes the parent's colour today).
  White headings on navy (`/ablauf`, the booker) keep `className="text-white"`: white is not `--on-inverse`.
- **Role sizes for Tailwind defaults:** the last raw sizes become tokens with Tailwind's value and line height -
  `button-sm`, `note` (fine print: `Text size="note"`), `skip-link`, `tag`, `accordion-icon` - named by role like
  C3's; `raw-text-size` reaches 0 without an allow-list.
- **Raw headings** become `Heading` with a role `size` (`card-title`, `card-title-sm`, `step-title` = token +
  bold) and `wrap="normal"` (they never had `text-balance`/`hyphens-heading`).
- **C5 in three PRs:** 5a layout (Container, Section, PageHeader), 5b grids (Split, CardGrid), 5c shell (theme,
  logo, fonts, Storybook fonts) - each with a check of a few lines.
- **Container sizes use the existing classes** (`page` = `w-full max-w-page px-6`, `faq` = `max-w-205 px-6`,
  `testimonials` = `max-w-220 px-6`): a new utility would change the built CSS, which C5's acceptance forbids. They
  are the two hand-built page columns (`mx-auto max-w-<n> px-6` on a plain `div`); `/preise`'s
  `mx-auto max-w-230` (no gutter, inside a Container) and the `/ueber-mich` quote card (`max-w-220` on a card) are
  not page containers and stay (C6/D5). `Section` gets `spacing: default | sm`, but the
  ten `<Container className="py-section-sm">` blocks stay: they have no `<section>` element, adding one changes the
  DOM (D5).
- **One `PageHeader`:** `variant: page | section` carries the two sets of wrapper, element, reveal trigger and
  spacing; `SectionHeader` is removed.
- **Split and CardGrid** variants are the measured values, named by value (`ratio="1.15/0.85"`,
  `columns="sm-2-lg-3"`), adopted wherever the DOM stays the same (7 splits, 9 card grids).
- **Fonts:** the spike answered yes - the package owns the `next/font` calls (`shell/fonts.ts`); the app imports the
  module before `./globals.css`.
- **Logo** takes `name`, `tagline`, `src`; navbar and footer pass `content/site`'s `brand`. The footer-only
  `social-links.tsx` moves into `footer.tsx`, so `components/layout` keeps navbar, footer and the iOS tint.
- **`next-themes`** moves from the app to the package with the provider and the toggle.

## Open points for the maintainer

The plan takes the conservative option in each case; none blocks a task.

1. **Tone for muted text on inverse surfaces.** E-08 names `tone: default | muted | inverse | accent`, but `Text`
   has a fifth colour today, `on-navy-soft` (#b9c8db, used 4 times). C2 named it `inverse-muted` (value
   unchanged); wave 2 renames it `inverse-soft` (point 7).
2. **Select tone name.** E-08 does not list `Select`; the plan renames its `on-navy` tone to `inverse` under the
   same rule. `Text`'s `inherit` tone stays (it sets no colour).
3. **Token names of C3** (tints by percent, `overlay-*` for white washes, `on-accent-*` for text on coral, role
   sizes, fluid spacings by role) are the planner's proposal. A rename is a codemod over the same table.
4. **Open Graph image colours stay literal.** Reading them from `brandColors` renders a byte-identical image, but
   Next derives the `og:image`/`twitter:image` URL hash from the file (measured: `?a20751a4992edc7d` ->
   `?745246771e923f94`), which changes `<head>` on every page. The plan allow-lists the file instead; moving them
   later is a one-line decision.
5. **QR code fill spelling.** `whatsapp-qr.tsx` passes `#13283F`; the token mirrors `styles/tokens.css` (`#13283f`). The
   SVG `fill` attribute on `/kontakt` changes case; the colour (computed `fill`) is identical. The plan accepts it
   and lists it as the one expected non-class HTML difference of C3.
6. **Spec wording:** C2's "Text/Heading tones follow the tone vocabulary" - `Heading` has no tone today; it gets
   one in C4. C2 renames only the existing `Text` tones.

Wave 2 (each with the conservative default taken):

7. **Tone names.** `Text`'s `inverse-muted` becomes `inverse-soft`, and `Eyebrow` uses `inverse-accent`,
   `inverse-muted`, `on-accent` (see the rulings). This settles point 1 in favour of the C3 role names; rename again
   if other names are wanted.
8. **White on navy.** Headings in `text-white` on navy keep the class; whether they should be `--on-inverse`
   (`#eaf1fa`) is a phase E question (a visible change).
9. **The booker's "Buchung" dot** gains the component's `shrink-0` (`flex-shrink` 1 -> 0). The eyebrow spans the
   aside's content width (at least 222px, measured) and its content is 88px, so the dot never shrinks; its used box
   is compared unchanged. The one computed difference of C4, allowed and pinned in Task 4b.
10. **Other outline findings** of the audit (the Teams box on `/online-lernen` and the booker title on `/kontakt`)
    do not skip a level and are not in the spec; they stay.
11. **Split/CardGrid and Container size names** are by value and by role (`faq`, `testimonials`); rename if
    wanted.
12. **Storybook fonts** come from Google's font CDN in the workbench (next/font's Vite plugin); the apps keep
    self-hosting them.
13. **Left for C6/D5:** the ten `Container className="py-section-sm"` blocks, the hand-built section intros, the
    other grids named in Task 5b, `/preise`'s inner `mx-auto max-w-230` column (no gutter, inside a Container) and
    the `/ueber-mich` quote card (`max-w-220` on a navy card) - neither is a page container.

## Execution order

Phase B (#152 -> #155) is open and unmerged. Phase C stacks on its tip, one branch per task, each PR based on the
previous branch:

```
fix/a11y (#155)
  -> docs/phase-c-plan               Task 0  docs: add the phase C plan
    -> refactor/ui-groups            Task 1  C1
      -> refactor/ui-variants        Task 2  C2
        -> refactor/ui-tokens        Task 3  C3
          -> docs/phase-c-plan-wave-2          docs: detail phase C tasks C4 and C5
            -> refactor/ui-prose               Task 4a C4  refactor(ui): move the legal pages onto a prose module
              -> refactor/ui-typography        Task 4b C4  refactor(ui): one typography API for headings, text and eyebrows
                -> fix/faecher-outline         Task 4c C4  fix(a11y): let the subject cards on /faecher follow the page heading
                  -> refactor/ui-layout        Task 5a C5  refactor(ui): move container, section and page header into the package
                    -> refactor/ui-grids       Task 5b C5  refactor(ui): add the Split and CardGrid layouts
                      -> refactor/ui-shell     Task 5c C5  refactor(ui): move theme, logo and fonts into the package
                        -> docs/phase-c-plan-wave-3   docs: detail phase C slices C6 and C7
                          -> refactor/ui-<primitive> ... Task 6a.. C6 (one PR each)
                            -> spike/headless-widgets    Task 7  C7 (draft, never merged; gate)
```

Each PR body starts with "Stacked on #N - merge after it." and "Part of #139.". After a squash merge, rebase the
rest of the chain with `git rebase --onto origin/main <merged-branch> <next-branch>`, run `just check`, and
`git push --force-with-lease`.

## File map

| File                                                                                         | Task | Responsibility                          |
| -------------------------------------------------------------------------------------------- | ---- | --------------------------------------- |
| `docs/plans/foundation-refactor-phase-c.md`, spec C8 technique, phase-B plan "After phase B" | 0    | this plan, E-09 carry-over              |
| `packages/ui/src/{primitives,typography,forms,overlays,layout,motion,utils}/`                | 1    | grouped modules (moved verbatim)        |
| `packages/ui/styles/{theme,tokens,base,components,motion}.css`                               | 1    | styles split along its sections         |
| `packages/ui/package.json` (`exports`), `packages/ui/src/exports.test.ts`                    | 1    | explicit export map and its guard       |
| 39 files under `apps/marketing/src` (imports only)                                           | 1    | grouped import paths                    |
| `packages/ui/src/primitives/{button,tag}.tsx`, `typography/{heading,text}.tsx` (+ tests)     | 2    | CVA variants, role names, `asChild`     |
| `packages/ui/src/forms/select.tsx`, `apps/marketing/.../layout/logo.tsx`, `footer.tsx`       | 2    | `inverse` tone, `Logo tone`             |
| 12 files under `apps/marketing/src` (`LinkButton` -> `Button asChild`), stories              | 2    | one button API                          |
| `packages/ui/styles/tokens.css`, `styles/base.css` (focus ring)                              | 3    | raw, semantic and `@theme` tokens       |
| `packages/ui/src/utils/cn.ts`, `utils/cn.test.ts`                                            | 3    | registration and drift guard            |
| `packages/ui/src/tokens/colors.ts` (+ `colors.test.ts`), `tokens/prose.test.ts`              | 3    | TS colour mirror, prose parity          |
| 36 files under `apps/marketing/src` and `packages/ui/src` (classes), `design-ratchet.json`   | 3    | token classes, lowered counts           |
| `packages/ui/src/typography/prose.tsx` (+ test), doc components, the three legal pages       | 4a   | Prose module on the prose tokens        |
| `packages/ui/src/typography/{heading,text,eyebrow}.tsx`, role size tokens, 12 app files      | 4b   | one typography API, hand-built copies   |
| `apps/marketing/src/components/sections/subject-cards.tsx`, `e2e/a11y.spec.ts`               | 4c   | `/faecher` heading outline (fix)        |
| `packages/ui/src/layout/{container,section,page-header}.tsx`, 17 app files                   | 5a   | layout parts in the package             |
| `packages/ui/src/layout/{split,card-grid}.tsx`, 10 app files                                 | 5b   | two-column and card grids               |
| `packages/ui/src/shell/*`, `app/layout.tsx`, navbar, footer, Storybook preview               | 5c   | theme, logo, fonts in the package       |
| `packages/ui/src/{primitives,layout,motion,forms}/*`, their app call sites                   | 6    | primitives from the duplicates (wave 3) |
| Storybook spike stories (spike branch only)                                                  | 7    | Radix vs React Aria comparison (wave 3) |
| `CLAUDE.md`                                                                                  | 1-3  | layout line, variant rule, token rule   |

---

### Task 0: The phase C plan (docs PR)

**Branch:** `docs/phase-c-plan` from `fix/a11y`. **PR title:** `docs: add the phase C plan`.

**Files:**

- Create: `docs/plans/foundation-refactor-phase-c.md` (this file)
- Modify: `docs/specs/foundation-refactor.md` (C8 _Technique_: the E-09 carry-over)
- Modify: `docs/plans/foundation-refactor-phase-b.md` (_After phase B_: C1 is groups/exports, not CVA; the `cn` path)

- [ ] **Step 1: Record the E-09 carry-over.** In the spec's C8 _Technique_, replace the closing "the booker
      calendar grid gets grid semantics and arrow keys." with "the booker calendar grid gets grid semantics and
      arrow keys; Escape in the navbar "Online lernen" dropdown returns focus to its trigger (today focus drops to
      `<body>` once the panel hides)."
- [ ] **Step 2: Correct the phase-B plan.** In _After phase B_, "starts with C1 (CVA + Slot)" becomes "starts with
      C1 (groups and explicit exports; CVA + Slot is C2)", and "registered in `packages/ui/src/utils.ts`" becomes
      "registered in `packages/ui/src/utils/cn.ts` (its path after C1)".
- [ ] **Step 3: Format and check.** `pnpm format`, then `just static-checks`. Expected: green.
- [ ] **Step 4: Commit** `docs: add the phase C plan` (plan, spec, phase-B plan).

PR body: "Stacked on #155 - merge after it.", "Part of #139.", a summary (the plan's waves, the toolkit, the two
doc corrections), _How to check_: "Nothing visible; read the plan, the C8 clause in the spec and the corrected
lines in the phase-B plan."

---

### Task 1: Groups and explicit exports (spec C1)

**Branch:** `refactor/ui-groups` from `docs/phase-c-plan`. **PR title:**
`refactor(ui): group the package and export each module explicitly`.

**Files:**

- Move (`git mv`, content unchanged) in `packages/ui/src/`:
  - to `primitives/`: `accordion.tsx`, `button.tsx`, `button.test.tsx`, `button.stories.tsx`, `card.tsx`,
    `card.stories.tsx`, `check-mark.tsx`, `tag.tsx`
  - to `typography/`: `eyebrow.tsx`, `typography.test.tsx`, `typography.stories.tsx`
  - to `forms/`: `field.tsx`, `select.tsx`, `select.test.tsx`, `switch.tsx`
  - to `overlays/`: `dialog.tsx`; to `layout/`: `section-header.tsx`
  - to `motion/`: `reveal.tsx`, `count-up.tsx`, `animated-check-mark.tsx`
  - `utils.ts` -> `utils/cn.ts`, `utils.test.ts` -> `utils/cn.test.ts`; `hooks/*` stay
- Split: `packages/ui/src/typography.tsx` -> `typography/heading.tsx`, `text.tsx`, `lead.tsx`, `prose.tsx`
- Split: `packages/ui/styles/theme.css` -> entry file + `tokens.css`, `base.css`, `components.css`, `motion.css`
- Create: `packages/ui/src/exports.test.ts`
- Modify: `packages/ui/package.json` (`exports`)
- Modify: 39 files under `apps/marketing/src` (import specifiers only)
- Modify: `CLAUDE.md` (_Layout_), `docs/specs/foundation-refactor.md` (the `utils.ts` link, C1 boxes)

**Interfaces:**

- Produces - every later task imports exactly these paths:

| Old specifier                       | New specifier                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@skillsite/ui/accordion`           | `@skillsite/ui/primitives/accordion`                                                                 |
| `@skillsite/ui/button`              | `@skillsite/ui/primitives/button`                                                                    |
| `@skillsite/ui/card`                | `@skillsite/ui/primitives/card`                                                                      |
| `@skillsite/ui/tag`                 | `@skillsite/ui/primitives/tag`                                                                       |
| (not imported by the app)           | `@skillsite/ui/primitives/check-mark`                                                                |
| `@skillsite/ui/eyebrow`             | `@skillsite/ui/typography/eyebrow`                                                                   |
| `@skillsite/ui/typography`          | `.../typography/heading` (`Heading`, `HeadingSize`)                                                  |
|                                     | `.../typography/text` (`Text`, `TextSize`, `TextTone`, `Address`)                                    |
|                                     | `.../typography/lead` (`Lead`)                                                                       |
|                                     | `.../typography/prose` (`H1`, `H2`, `H3`, `P`, `Small`, `Muted`, `InlineLink`)                       |
| `@skillsite/ui/field`               | `@skillsite/ui/forms/field`                                                                          |
| `@skillsite/ui/select`              | `@skillsite/ui/forms/select`                                                                         |
| (not imported by the app)           | `@skillsite/ui/forms/switch`, `@skillsite/ui/overlays/dialog`                                        |
| `@skillsite/ui/section-header`      | `@skillsite/ui/layout/section-header`                                                                |
| `@skillsite/ui/reveal`              | `@skillsite/ui/motion/reveal`                                                                        |
| `@skillsite/ui/count-up`            | `@skillsite/ui/motion/count-up`                                                                      |
| `@skillsite/ui/animated-check-mark` | `@skillsite/ui/motion/animated-check-mark`                                                           |
| `@skillsite/ui/utils`               | `@skillsite/ui/utils/cn`                                                                             |
| `@skillsite/ui/hooks/<name>`        | unchanged (`use-body-scroll-lock`, `use-count-up`, `use-hydrated`, `use-in-view`, `use-media-query`) |
| `@skillsite/ui/styles/theme.css`    | unchanged (now imports `tokens.css`, `base.css`, `components.css`, `motion.css`)                     |

- Produces: `cn` in `packages/ui/src/utils/cn.ts`; its test `packages/ui/src/utils/cn.test.ts` reads the theme as
  `styles/theme.css`'s parts in `@import` order. Raw tokens and the `@theme` blocks live in
  `packages/ui/styles/tokens.css`, the base layer in `styles/base.css`, the `@utility` recipes in
  `styles/components.css` and `styles/motion.css`. `exports.test.ts` requires an export for every non-story,
  non-test module under `src/` - a later task that adds a module adds its export in the same commit.

**Background (measured on this tree).** `packages/ui/package.json` exports `"./*": "./src/*.tsx"`, so
`require.resolve("@skillsite/ui/button.stories")` resolves to the story. The app imports 12 flat module paths, 4 of
the 5 hooks and `typography` (22 import lines, all single-line). `theme.css` (459 lines) has these sections in this
order: header, `@custom-variant dark`, raw `:root`/dark tokens, `@theme inline`, motion `@theme`, `@layer base`,
the `@utility` recipes `bg-coral-gradient` ... `no-scrollbar`, `@utility lift`, keyframes, `.check-draw`,
`.reveal`. A dry run of this task on the phase-B tip gave: built CSS byte-identical (same chunk
`06rdialik264u.css`) with the styles split, the HTML snapshot of all 14 URLs identical, static checks, build and
tests green (`@skillsite/ui` 5 files / 29 tests), Storybook built with the same six story ids.

- [ ] **Step 1: Toolkit and before state.** Write `<scratch>/toolkit.sh` and the four toolkit scripts
      (_Verification toolkit_), then:

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3110
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3110 "$SCRATCH/html-before"
stop 3110
```

Expected: 14 route lines and `1 stylesheet(s)`.

- [ ] **Step 2: Write the failing test.** Create `packages/ui/src/exports.test.ts`:

```ts
import { globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const { exports } = JSON.parse(
  readFileSync(`${packageRoot}/package.json`, "utf8"),
) as { exports: Record<string, string> };
const require = createRequire(import.meta.url);

/** The public API: every module of src/ that is neither a story nor a test. */
const modules = globSync("src/**/*.{ts,tsx}", { cwd: packageRoot })
  .filter((file) => !/\.(stories|test)\.tsx?$/.test(file))
  .map((file) => `./${file}`)
  .sort();

/** Module exports: everything but the stylesheet folder. */
const moduleExports = Object.entries(exports).filter(
  ([subpath]) => subpath !== "./styles/*",
);

test("every module is exported, and only modules are", () => {
  expect(moduleExports.map(([, target]) => target).sort()).toEqual(modules);
});

test("each export path names its group and file", () => {
  for (const [subpath, target] of moduleExports) {
    expect(target.replace(/\.tsx?$/, ""), subpath).toBe(
      `./src/${subpath.slice(2)}`,
    );
  }
});

test("an exported module resolves", () => {
  expect(require.resolve("@skillsite/ui/primitives/button")).toMatch(
    /src\/primitives\/button\.tsx$/,
  );
});

test("stories, tests and ungrouped paths do not resolve", () => {
  for (const specifier of [
    "@skillsite/ui/primitives/button.stories",
    "@skillsite/ui/primitives/button.test",
    "@skillsite/ui/button",
    "@skillsite/ui/src/primitives/button.tsx",
  ]) {
    expect(() => require.resolve(specifier), specifier).toThrow(
      /not defined by "exports"/,
    );
  }
});
```

- [ ] **Step 3: Run it to see it fail.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/exports.test.ts
```

Expected: 3 failed, 1 passed - "every module is exported" (received `['./src/*.tsx', …]`), "an exported module
resolves" and "stories, tests and ungrouped paths do not resolve" (got "Cannot find module", not "not defined by
exports"). "each export path names its group and file" passes.

- [ ] **Step 4: Move the files.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE/packages/ui/src"
mkdir -p primitives typography forms overlays layout motion utils
git mv accordion.tsx button.tsx button.test.tsx button.stories.tsx card.tsx card.stories.tsx check-mark.tsx tag.tsx primitives/
git mv eyebrow.tsx typography.test.tsx typography.stories.tsx typography/
git mv field.tsx select.tsx select.test.tsx switch.tsx forms/
git mv dialog.tsx overlays/
git mv section-header.tsx layout/
git mv reveal.tsx count-up.tsx animated-check-mark.tsx motion/
git mv utils.ts utils/cn.ts
git mv utils.test.ts utils/cn.test.ts
```

- [ ] **Step 5: Split `typography.tsx`.** Save as `<scratch>/c1-split-typography.mjs`, then run
      `source <scratch>/toolkit.sh; cd "$WORKTREE" && node "$SCRATCH/c1-split-typography.mjs" && git add -A packages/ui/src`:

```js
// C1: split packages/ui/src/typography.tsx into typography/{heading,text,lead,prose}.tsx.
// Code moves verbatim (found by markers, not line numbers); only the imports are new.
// Usage (repo root): node <this file>
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const dir = "packages/ui/src";
const source = readFileSync(`${dir}/typography.tsx`, "utf8");

/** The source from `start` (inclusive) to `end` (exclusive; end of file if omitted). */
function between(start, end) {
  const from = source.indexOf(start);
  const to = end ? source.indexOf(end, from) : source.length;
  if (from < 0 || to < 0)
    throw new Error(`marker not found: ${start} / ${end}`);
  return `${source.slice(from, to).trimEnd()}\n`;
}

const RULE =
  "/* ----------------------------------------------------------------------------\n";
const HEADINGS = `${RULE} * Headings (site)`;
const BODY = `${RULE} * Body text (site)`;
const LEAD = "/** Intro paragraph";
const PROSE = `${RULE} * Prose / legal documents`;
const ADDRESS = "export function Address(";
const INLINE_LINK = "type InlineLinkProps";
const CN = 'import { cn } from "../utils/cn";\n\n';

mkdirSync(`${dir}/typography`, { recursive: true });
writeFileSync(`${dir}/typography/heading.tsx`, CN + between(HEADINGS, BODY));
writeFileSync(
  `${dir}/typography/text.tsx`,
  `${CN}${between(BODY, LEAD)}\n${between(ADDRESS, INLINE_LINK)}`,
);
writeFileSync(
  `${dir}/typography/lead.tsx`,
  `import { Text } from "./text";\n\n${between(LEAD, PROSE)}`,
);
writeFileSync(
  `${dir}/typography/prose.tsx`,
  `${CN}${between(PROSE, ADDRESS)}\n${between(INLINE_LINK)}`,
);
rmSync(`${dir}/typography.tsx`);
console.log("typography.tsx -> typography/{heading,text,lead,prose}.tsx");
```

Expected: `heading.tsx` holds `HeadingSize`, `headingSizeClass`, `Heading`; `text.tsx` holds `TextSize`,
`TextTone`, the two class maps, `Text` and `Address`; `lead.tsx` holds `Lead`; `prose.tsx` holds `Variant`,
`ProseHeadingProps`, `H1`, `H2`, `H3`, `P`, `Small`, `Muted`, `InlineLinkProps`, `InlineLink`. No line of code
changes.

- [ ] **Step 6: Point the package's own imports at the new places.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE/packages/ui/src"
perl -CSD -pi -e 's#from "\./utils"#from "../utils/cn"#; s#from "\./hooks/#from "../hooks/#' primitives/*.tsx typography/*.tsx forms/*.tsx overlays/*.tsx layout/*.tsx motion/*.tsx
perl -CSD -pi -e 's#from "\./check-mark"#from "../primitives/check-mark"#' motion/animated-check-mark.tsx
perl -CSD -pi -e 's#from "\./eyebrow"#from "../typography/eyebrow"#; s#from "\./reveal"#from "../motion/reveal"#; s#import \{ Heading, type HeadingSize, Lead \} from "\./typography";#import { Heading, type HeadingSize } from "../typography/heading";\nimport { Lead } from "../typography/lead";#' layout/section-header.tsx
perl -CSD -pi -e 's#from "\./eyebrow"#from "../typography/eyebrow"#' primitives/card.stories.tsx
perl -CSD -pi -e 's#import \{ Heading, Lead, Text \} from "\./typography";#import { Heading } from "./heading";\nimport { Lead } from "./lead";\nimport { Text } from "./text";#' typography/typography.stories.tsx
perl -CSD -pi -e 's#import \{ Lead, Text \} from "\./typography";#import { Lead } from "./lead";\nimport { Text } from "./text";#' typography/typography.test.tsx
perl -CSD -pi -e 's#from "\./utils"#from "./cn"#; s#`utils\.test\.ts` fails#`cn.test.ts` fails#' utils/cn.test.ts utils/cn.ts
grep -rn 'from "\./\(utils\|typography\|reveal\|check-mark\|hooks/\)' "$WORKTREE/packages/ui/src"
```

Expected: the final `grep` prints nothing. (`typography/typography.test.tsx` keeps `from "./eyebrow"` - correct
after the move, so `eyebrow` is not in the pattern; `hooks/use-count-up.ts` keeps `./use-in-view`.)

- [ ] **Step 7: Split `theme.css` into its parts.** Save as `<scratch>/c1-split-styles.mjs`, then run
      `source <scratch>/toolkit.sh; cd "$WORKTREE" && node "$SCRATCH/c1-split-styles.mjs" && pnpm format`:

```js
// C1: split packages/ui/styles/theme.css into tokens, base, components and motion
// along its existing sections, in source order. theme.css stays the entry file and
// imports the parts in that order. Rules move verbatim (found by markers).
// Usage (repo root): node <this file>
import { readFileSync, writeFileSync } from "node:fs";

const dir = "packages/ui/styles";
const source = readFileSync(`${dir}/theme.css`, "utf8");

/** The source from `start` (inclusive) to `end` (exclusive; end of file if omitted). */
function between(start, end) {
  const from = source.indexOf(start);
  const to = end ? source.indexOf(end, from) : source.length;
  if (from < 0 || to < 0)
    throw new Error(`marker not found: ${start} / ${end}`);
  return `${source.slice(from, to).trimEnd()}\n`;
}

const RULE =
  "/* ---------------------------------------------------------------------------\n";
const TOKENS = "/* Dark mode is driven by";
const BASE = `${RULE}   Base layer`;
const COMPONENTS = "/* Reusable coral accent gradient";
const MOTION = "/* Shared hover-lift";

const PARTS = {
  tokens: [
    "Design tokens: dark variant, raw values, theme mapping, motion tokens.",
    between(TOKENS, BASE),
  ],
  base: [
    "Base layer: element defaults, focus ring, cursor, reduced motion.",
    between(BASE, COMPONENTS),
  ],
  components: [
    "Class recipes (@utility): gradient, section rhythm, hyphenation, scrollbar.",
    between(COMPONENTS, MOTION),
  ],
  motion: [
    "Motion: lift, keyframes, .check-draw and .reveal.",
    between(MOTION),
  ],
};

for (const [name, [summary, body]] of Object.entries(PARTS)) {
  writeFileSync(
    `${dir}/${name}.css`,
    `/* ${summary} Part of theme.css. */\n\n${body}`,
  );
}

writeFileSync(
  `${dir}/theme.css`,
  `${between("/* ----", TOKENS)
    .trimEnd()
    .replace(
      "   importing app must also register this package's sources via `@source`.",
      "   importing app must also register this package's sources via `@source`.\n   The parts are imported in this fixed order: it is the order of the rules\n   in the built CSS (the unlayered rules of motion.css cascade by it).",
    )}\n\n${Object.keys(PARTS)
    .map((name) => `@import "./${name}.css";`)
    .join("\n")}\n`,
);
console.log("theme.css -> tokens.css, base.css, components.css, motion.css");
```

Expected: `theme.css` is the header comment plus

```css
@import "./tokens.css";
@import "./base.css";
@import "./components.css";
@import "./motion.css";
```

and `wc -l packages/ui/styles/*.css` reads 180 tokens, 64 base, 42 components, 172 motion, 12 theme. Every rule
moved verbatim, in its old order.

- [ ] **Step 8: The drift test reads the parts.** In `packages/ui/src/utils/cn.test.ts`, replace

```ts
// Drift guard: every token and utility of theme.css must be known to `cn`.
const themeCss = readFileSync(
  new URL("../styles/theme.css", import.meta.url),
  "utf8",
);
```

with

```ts
// Drift guard: every token and utility of the theme must be known to `cn`.
// styles/theme.css is the entry file; its parts are read in its @import order.
const stylesDir = new URL("../../styles/", import.meta.url);
const themeParts = [
  ...readFileSync(new URL("theme.css", stylesDir), "utf8").matchAll(
    /^@import "\.\/([a-z-]+\.css)";$/gm,
  ),
].map((match) => match[1]!);
const themeCss = themeParts
  .map((part) => readFileSync(new URL(part, stylesDir), "utf8"))
  .join("\n");

test("theme.css imports its parts in a fixed order", () => {
  expect(themeParts).toEqual([
    "tokens.css",
    "base.css",
    "components.css",
    "motion.css",
  ]);
});
```

The rest of the file stays as it is (its `tokens()` and `@utility` checks run on the joined parts).

- [ ] **Step 9: The explicit export map.** In `packages/ui/package.json`, replace the `exports` object with:

```json
  "exports": {
    "./styles/*": "./styles/*",
    "./utils/cn": "./src/utils/cn.ts",
    "./hooks/use-body-scroll-lock": "./src/hooks/use-body-scroll-lock.ts",
    "./hooks/use-count-up": "./src/hooks/use-count-up.ts",
    "./hooks/use-hydrated": "./src/hooks/use-hydrated.ts",
    "./hooks/use-in-view": "./src/hooks/use-in-view.ts",
    "./hooks/use-media-query": "./src/hooks/use-media-query.ts",
    "./primitives/accordion": "./src/primitives/accordion.tsx",
    "./primitives/button": "./src/primitives/button.tsx",
    "./primitives/card": "./src/primitives/card.tsx",
    "./primitives/check-mark": "./src/primitives/check-mark.tsx",
    "./primitives/tag": "./src/primitives/tag.tsx",
    "./typography/eyebrow": "./src/typography/eyebrow.tsx",
    "./typography/heading": "./src/typography/heading.tsx",
    "./typography/lead": "./src/typography/lead.tsx",
    "./typography/prose": "./src/typography/prose.tsx",
    "./typography/text": "./src/typography/text.tsx",
    "./forms/field": "./src/forms/field.tsx",
    "./forms/select": "./src/forms/select.tsx",
    "./forms/switch": "./src/forms/switch.tsx",
    "./overlays/dialog": "./src/overlays/dialog.tsx",
    "./layout/section-header": "./src/layout/section-header.tsx",
    "./motion/animated-check-mark": "./src/motion/animated-check-mark.tsx",
    "./motion/count-up": "./src/motion/count-up.tsx",
    "./motion/reveal": "./src/motion/reveal.tsx"
  },
```

- [ ] **Step 10: Run the package tests.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run
```

Expected: PASS, 5 files, 29 tests (24 before, 4 in `exports.test.ts`, 1 "theme.css imports its parts in a fixed
order").

- [ ] **Step 11: Rewrite the app imports.** Save as `<scratch>/c1-imports.mjs`:

```js
// C1 codemod: rewrite `@skillsite/ui/<file>` imports in apps/*/src to the grouped paths.
// Usage (repo root): node <this file>
import { globSync, readFileSync, writeFileSync } from "node:fs";

const MOVED = {
  accordion: "primitives/accordion",
  "animated-check-mark": "motion/animated-check-mark",
  button: "primitives/button",
  card: "primitives/card",
  "count-up": "motion/count-up",
  eyebrow: "typography/eyebrow",
  field: "forms/field",
  reveal: "motion/reveal",
  "section-header": "layout/section-header",
  select: "forms/select",
  tag: "primitives/tag",
  utils: "utils/cn",
};
// `typography.tsx` is split: each export goes to its own module.
const TYPOGRAPHY = {
  Heading: "heading",
  HeadingSize: "heading",
  Text: "text",
  TextSize: "text",
  TextTone: "text",
  Address: "text",
  Lead: "lead",
  H1: "prose",
  H2: "prose",
  H3: "prose",
  P: "prose",
  Small: "prose",
  Muted: "prose",
  InlineLink: "prose",
};

let changed = 0;
for (const file of globSync("apps/*/src/**/*.{ts,tsx,mts}")) {
  const before = readFileSync(file, "utf8");
  let after = before.replace(
    /from "@skillsite\/ui\/([a-z-]+)"/g,
    (match, name) =>
      MOVED[name] ? `from "@skillsite/ui/${MOVED[name]}"` : match,
  );
  after = after.replace(
    /import \{([^}]*)\} from "@skillsite\/ui\/typography";/g,
    (_, list) => {
      const groups = new Map();
      for (const raw of list
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)) {
        const name = raw.replace(/^type\s+/, "");
        const target = TYPOGRAPHY[name];
        if (!target)
          throw new Error(`${file}: unknown typography export ${name}`);
        groups.set(target, [...(groups.get(target) ?? []), raw]);
      }
      return [...groups]
        .map(
          ([target, names]) =>
            `import { ${names.join(", ")} } from "@skillsite/ui/typography/${target}";`,
        )
        .join("\n");
    },
  );
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}
console.log(`rewrote ${changed} files`);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/c1-imports.mjs" && pnpm format
grep -rnE '"@skillsite/ui/(accordion|animated-check-mark|button|card|count-up|eyebrow|field|reveal|section-header|select|tag|typography|utils)"' "$WORKTREE/apps"
```

Expected: `rewrote 39 files`; the `grep` prints nothing. Afterwards the app imports `typography/heading` 14x,
`typography/text` 16x, `typography/lead` 4x, `typography/prose` 5x, `utils/cn` 19x.

- [ ] **Step 12: Documentation.**
  - `CLAUDE.md`, _Layout_: replace the line
    `packages/ui/           @skillsite/ui - tokens (styles/theme.css), primitives, hooks, Storybook` with
    `packages/ui/           @skillsite/ui - src/<group>/<name> exported as @skillsite/ui/<group>/<name>; styles/theme.css imports tokens, base, components, motion; Storybook`.
  - `docs/specs/foundation-refactor.md`, _Problem statement_: the link `[`utils.ts`](../../packages/ui/src/utils.ts)`
    becomes `[`utils.ts`](../../packages/ui/src/utils/cn.ts)` (the text keeps describing the audited state).
- [ ] **Step 13: Prove the result identical.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just static-checks && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
stop 3111
diff -r "$SCRATCH/html-before" "$SCRATCH/html-after" && echo IDENTICAL
cd "$WORKTREE" && pnpm --filter @skillsite/ui build-storybook --output-dir "$SCRATCH/storybook"
node -e 'console.log(Object.keys(require(process.argv[1]).entries).join(" "))' "$SCRATCH/storybook/index.json"
```

Expected: `IDENTICAL` (HTML of all 14 URLs and `_styles.css`, the served CSS: the styles split changed no byte);
the story ids
`primitives-button--primary primitives-button--variants primitives-button--sizes primitives-button--as-link primitives-card--basic primitives-typography--type-scale`.
Any `diff` output is a finding: stop and report.

- [ ] **Step 14: Tick spec C1** (both boxes), run `just check`, commit
      `refactor(ui): group the package and export each module explicitly`.

PR body: Summary (groups, split typography module, styles split into tokens/base/components/motion behind the
unchanged `theme.css` entry, explicit exports, 39 app files rewritten, docs lines); _Evidence_: `exports.test.ts`
red -> green, `diff -r` of the HTML snapshots empty (14 URLs + CSS), Storybook ids unchanged; _Deviations from the
plan_; _How to check_: nothing visible - open `/`, `/termin` and `/datenschutz` at 390 and 1280 px, light and
dark, and `pnpm storybook` (three story groups as before); try `import "@skillsite/ui/primitives/button.stories"`
in an app file - the build fails to resolve it.

---

### Task 2: CVA, Slot and role names (spec C2)

**Branch:** `refactor/ui-variants` from `refactor/ui-groups`. **PR title:**
`refactor(ui): build the variants on CVA with role names and give Button asChild`.

**Files:**

- Modify: `packages/ui/package.json` (dependencies), `pnpm-lock.yaml`
- Modify: `packages/ui/src/primitives/button.tsx`, `button.test.tsx`, `button.stories.tsx`, `card.stories.tsx`
- Modify: `packages/ui/src/primitives/tag.tsx`; Create: `packages/ui/src/primitives/tag.test.tsx`
- Modify: `packages/ui/src/typography/heading.tsx`, `text.tsx`, `typography.test.tsx`
- Modify: `packages/ui/src/forms/select.tsx` (tone key)
- Modify: `apps/marketing/src/components/layout/logo.tsx`, `footer.tsx`
- Modify: the 12 files with `LinkButton` (below), `faecher/page.tsx`, `ablauf/page.tsx`, `preise/page.tsx`,
  `cta-section.tsx`, `booker.tsx` (variant and tone names)
- Modify: `CLAUDE.md` (_Conventions_), `docs/specs/foundation-refactor.md` (C2 box)

**Interfaces:**

- Consumes: the module paths of Task 1.
- Produces (Task 3 and later rely on these):
  - `Button` in `@skillsite/ui/primitives/button`: props of `<button>` plus
    `variant?: "primary" | "secondary" | "outline" | "inverse" | "ghost"` (default `primary`),
    `size?: "sm" | "md" | "lg"` (default `md`) and `asChild?: boolean`. `LinkButton` and `buttonClasses` no longer
    exist; a link that looks like a button is `<Button asChild ...><Link href=...>...</Link></Button>` (or `<a>`
    for `mailto:`/`https:`).
  - `Tag({ tone?: "accent" | "inverse" | "outline" })`, default `accent`.
  - `Text({ size?: TextSize, tone?: "default" | "muted" | "inverse" | "inverse-muted" | "inherit", as? })`;
    `TextSize`/`TextTone` stay exported. `Heading({ size?: HeadingSize, as? })`; `HeadingSize` stays exported.
  - `Select({ tone?: "default" | "inverse" })`; `Logo({ tone?: "default" | "inverse" })` in the app.
  - Class strings: `cn(xVariants({ ... }), className)` - identical to the old `cn(base, variant, size, className)`.

**Background (measured).** 23 `LinkButton` elements in 12 files; 5 have an external href (the two on
`/zahlung`: `contactDetails.eMail.href` = `mailto:…`, `contactDetails.whatsapp.href` = `https://wa.me/…`;
`but.officialInfo.href` on `/preise`; `discordInvite` twice on `/online-lernen`), the other 18 point to routes
(`routes.*`, `primaryCta.href` = `routes.firstMeeting`, `item.href` of `primaryNav`/`platformNav`,
`CtaSection`'s default `cta` - no caller passes another). Four render only after interaction: the two in the
mobile menu, the booker's unavailable notice (`booker.tsx`, "Direkt anfragen" - with no Cal.com key it is what
`/termin` and `/kontakt` show after hydration) and its rate-limited/blocked state; `app/error.tsx` never renders in
a build. Renames: Button `navy` 1x (`/faecher`), `white` 2x (`/ablauf`, CTA section); Text `on-navy-soft` 4x
(`/preise` 2x, `/ablauf`, booker aside), Select `on-navy` 1x (booker), `Logo onDark` 1x (footer); `Tag` is only
used with its default tone. A dry run of this task gave: HTML snapshot of all 14 URLs and the built CSS identical;
computed styles identical over 72 page states / 20,374 elements / 14,768 forced states; the link check
`23 Button asChild: 18 <Link>, 5 <a>` (and it fails when one `<a>` is swapped for `<Link>`); `just check` green
(48 smoke tests).

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the four toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

Expected: 14 route lines and `1 stylesheet(s)`. Leave 3110 running.

- [ ] **Step 2: Add the dependencies.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm add --filter @skillsite/ui class-variance-authority@^0.7.1 @radix-ui/react-slot@^1.3.3
cd "$WORKTREE" && pnpm install --frozen-lockfile
```

Expected: `packages/ui/package.json` gains both under `dependencies`. The lockfile also re-resolves the peer suffix
of `@skillsite/ui`'s `next` devDependency (it now lists `@playwright/test`); that is pnpm's deduplication - keep it.

- [ ] **Step 3: Write the failing tests.** Replace `packages/ui/src/primitives/button.test.tsx` with:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Button } from "./button";

afterEach(cleanup);

test("a button renders as a button with the primary look by default", () => {
  render(<Button>Termin buchen</Button>);
  const button = screen.getByRole("button", { name: "Termin buchen" });
  expect(button.className).toContain("bg-coral-gradient");
});

test("asChild renders the child element with the button's classes", () => {
  render(
    <Button asChild variant="outline" size="lg" className="mt-6">
      <a href="/termin">Termin</a>
    </Button>,
  );
  const link = screen.getByRole("link", { name: "Termin" });
  expect(link.getAttribute("href")).toBe("/termin");
  expect(screen.queryByRole("button")).toBeNull();
  expect(link.className).toBe(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60 border-[1.5px] border-line bg-transparent text-ink hover:border-ink px-6 py-3 text-[1.05rem] mt-6",
  );
});

test("the class order is base, variant, size, then className", () => {
  render(
    <Button variant="secondary" size="sm" className="px-4">
      Mehr
    </Button>,
  );
  expect(screen.getByRole("button", { name: "Mehr" }).className).toBe(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60 bg-navy text-white hover:opacity-90 py-1.5 text-sm px-4",
  );
});
```

Create `packages/ui/src/primitives/tag.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Tag } from "./tag";

afterEach(cleanup);

test("Tag tones are named by role: accent by default, inverse, outline", () => {
  render(
    <>
      <Tag>Neu</Tag>
      <Tag tone="inverse">Abitur</Tag>
      <Tag tone="outline">Oberstufe</Tag>
    </>,
  );
  expect(screen.getByText("Neu").className).toContain("text-coral");
  expect(screen.getByText("Abitur").className).toContain("bg-navy text-white");
  expect(screen.getByText("Oberstufe").className).toContain(
    "border border-line text-ink-soft",
  );
});
```

Append to `packages/ui/src/typography/typography.test.tsx`:

```tsx
test("Text tones on inverse surfaces are named by role", () => {
  render(
    <>
      <Text tone="inverse">Hell</Text>
      <Text tone="inverse-muted">Gedämpft</Text>
    </>,
  );
  expect(screen.getByText("Hell").className).toBe("text-body text-on-navy");
  expect(screen.getByText("Gedämpft").className).toBe(
    "text-body text-on-navy-soft",
  );
});
```

- [ ] **Step 4: Run them to see them fail.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/primitives src/typography
```

Expected: FAIL - "asChild renders the child element" (no link role), "the class order" (no `bg-navy`), the Tag
test (no `bg-navy`) and the Text tone test (`text-body` only); the default-look test passes.

- [ ] **Step 5: `Button` on CVA with `asChild`.** Replace `packages/ui/src/primitives/button.tsx` with:

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline cursor-pointer lift disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-coral-gradient text-white shadow-[0_14px_30px_-12px_var(--coral)] [--lift:-0.125rem]",
        secondary: "bg-navy text-white hover:opacity-90",
        outline:
          "border-[1.5px] border-line bg-transparent text-ink hover:border-ink",
        inverse:
          "bg-white text-navy shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)] [--lift:-0.125rem]",
        ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
      },
      size: {
        sm: "px-3.5 py-1.5 text-sm",
        md: "px-5 py-2.5 text-[1rem]",
        lg: "px-6 py-3 text-[1.05rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (e.g. a `Link` or an `<a>`) with the button's look instead of a `<button>`. */
    asChild?: boolean;
  };

export function Button({
  variant,
  size,
  asChild = false,
  className,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

- [ ] **Step 6: `Tag`, `Heading`, `Text` on CVA.** Replace `packages/ui/src/primitives/tag.tsx` with:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const tagVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        accent:
          "bg-[color-mix(in_srgb,var(--coral)_14%,transparent)] text-coral",
        inverse: "bg-navy text-white",
        outline: "border border-line text-ink-soft",
      },
    },
    defaultVariants: { tone: "accent" },
  },
);

type TagProps = React.ComponentProps<"span"> & VariantProps<typeof tagVariants>;

/** Small status pill (e.g. "Sehr gefragt", "Neu"). */
export function Tag({ tone, className, ...props }: TagProps) {
  return <span className={cn(tagVariants({ tone }), className)} {...props} />;
}
```

Replace `packages/ui/src/typography/heading.tsx` with:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Headings (site)
 *
 * `size` maps to one class from the type scale (size + line-height + tracking +
 * weight live in globals `@theme`). Colour is inherited from the parent, so the
 * same heading works on light and navy surfaces.
   ------------------------------------------------------------------------- */
const headingVariants = cva("font-heading text-balance hyphens-heading", {
  variants: {
    size: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
      title: "text-title",
    },
  },
  defaultVariants: { size: "h2" },
});

export type HeadingSize = NonNullable<
  VariantProps<typeof headingVariants>["size"]
>;

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  };

export function Heading({
  as: Tag = "h2",
  size,
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag className={cn(headingVariants({ size }), className)} {...props} />
  );
}
```

Replace `packages/ui/src/typography/text.tsx` with (the `size` keys come before `tone`, as the old `cn` call
ordered them):

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Body text (site)
   ------------------------------------------------------------------------- */
const textVariants = cva("", {
  variants: {
    size: {
      lead: "text-lead",
      body: "text-body",
      small: "text-small",
      caption: "text-caption",
    },
    tone: {
      default: "text-ink",
      muted: "text-ink-soft",
      inverse: "text-on-navy",
      "inverse-muted": "text-on-navy-soft",
      inherit: "",
    },
  },
  defaultVariants: { size: "body", tone: "default" },
});

export type TextSize = NonNullable<VariantProps<typeof textVariants>["size"]>;
export type TextTone = NonNullable<VariantProps<typeof textVariants>["tone"]>;

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div";
  };

export function Text({
  as: Tag = "p",
  size,
  tone,
  className,
  ...props
}: TextProps) {
  return (
    <Tag className={cn(textVariants({ size, tone }), className)} {...props} />
  );
}

export function Address({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <address
      className={cn("text-body not-italic text-ink", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 7: Run the package tests.**
      `source <scratch>/toolkit.sh; cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run` - expected:
      PASS, 6 files, 31 tests.
- [ ] **Step 8: `LinkButton` call sites to `Button asChild`.** Save as `<scratch>/c2-link-button.mjs`:

```js
// C2 codemod: <LinkButton href=... {...rest}>children</LinkButton>
//   -> <Button asChild {...rest}><Link href=...>children</Link></Button>          (internal href)
//   -> <Button asChild {...rest}><a href=... target rel>children</a></Button>     (http:, https:, mailto:, tel:)
// The external decision is LinkButton's own rule, applied to each href's value (listed below).
// Usage (repo root): node <this file>; then `pnpm format`.
import { globSync, readFileSync, writeFileSync } from "node:fs";

/** href expressions whose value is external (checked against apps/marketing/src/content). */
const EXTERNAL = new Set([
  "{contactDetails.eMail.href}", // mailto:
  "{contactDetails.whatsapp.href}", // https://wa.me/...
  "{but.officialInfo.href}", // https://familienportal.de/...
  "{discordInvite}", // https://discord.com/...
]);
/** Anchor-only attributes: they go on the <a>, not on Button. */
const ANCHOR_ONLY = new Set(["target", "rel"]);

/** Read the attributes of a JSX opening tag starting at `i` (just after the tag name). */
function readAttributes(source, i) {
  const attributes = [];
  for (;;) {
    while (/\s/.test(source[i])) i++;
    if (source[i] === ">") return { attributes, end: i + 1 };
    const name = /^[\w:-]+/.exec(source.slice(i))[0];
    i += name.length;
    if (source[i] !== "=") {
      attributes.push({ name, text: name });
      continue;
    }
    i++;
    let value;
    if (source[i] === '"') {
      const close = source.indexOf('"', i + 1);
      value = source.slice(i, close + 1);
    } else {
      let depth = 0;
      let j = i;
      do {
        if (source[j] === "{") depth++;
        if (source[j] === "}") depth--;
        j++;
      } while (depth > 0);
      value = source.slice(i, j);
    }
    i += value.length;
    attributes.push({ name, value, text: `${name}=${value}` });
  }
}

let total = 0;
for (const file of globSync("apps/*/src/**/*.tsx")) {
  let source = readFileSync(file, "utf8");
  if (!source.includes("<LinkButton")) continue;
  let internal = false;
  for (let start; (start = source.indexOf("<LinkButton")) !== -1;) {
    const { attributes, end } = readAttributes(
      source,
      start + "<LinkButton".length,
    );
    const close = source.indexOf("</LinkButton>", end);
    const children = source.slice(end, close);
    const href = attributes.find((a) => a.name === "href");
    const external = EXTERNAL.has(href.value);
    internal ||= !external;
    const onButton = attributes.filter(
      (a) => a.name !== "href" && !ANCHOR_ONLY.has(a.name),
    );
    const onAnchor = [
      href,
      ...attributes.filter((a) => ANCHOR_ONLY.has(a.name)),
    ];
    const tag = external ? "a" : "Link";
    const replacement =
      `<Button asChild ${onButton.map((a) => a.text).join(" ")}>` +
      `<${tag} ${onAnchor.map((a) => a.text).join(" ")}>${children}</${tag}></Button>`;
    source =
      source.slice(0, start) +
      replacement +
      source.slice(close + "</LinkButton>".length);
    total++;
  }
  // Imports: LinkButton -> Button; next/link where an internal link was written.
  source = source.replace(
    /import \{([^}]*)\} from "@skillsite\/ui\/primitives\/button";/,
    (_, list) => {
      const names = new Set(
        list
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
      names.delete("LinkButton");
      names.add("Button");
      return `import { ${[...names].sort().join(", ")} } from "@skillsite/ui/primitives/button";`;
    },
  );
  if (internal && !/import Link from "next\/link";/.test(source)) {
    // After a leading "use client" directive, which must stay the first statement.
    source = source.replace(
      /^("use client";\n\n)?/,
      (directive) => `${directive}import Link from "next/link";\n`,
    );
  }
  writeFileSync(file, source);
}
console.log(`converted ${total} LinkButton elements`);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/c2-link-button.mjs" && pnpm format
grep -rn "LinkButton\|buttonClasses" "$WORKTREE/apps" "$WORKTREE/packages"
head -3 "$WORKTREE/apps/marketing/src/app/error.tsx" "$WORKTREE/apps/marketing/src/components/booking/booker.tsx"
```

Expected: `converted 23 LinkButton elements`; the `grep` prints nothing; both `head` outputs still start with
`"use client";`. In `preise/page.tsx`, the `aria-label` stays on `Button` and `target`/`rel` move to the `<a>`.

- [ ] **Step 9: Check the link children.** Save as `<scratch>/c2-check-links.mjs` and run it
      (`source <scratch>/toolkit.sh; cd "$WORKTREE" && node "$SCRATCH/c2-check-links.mjs"`):

```js
// C2 check: every `<Button asChild>` in the apps wraps `<a>` for exactly the external
// hrefs (LinkButton's old rule: http(s):, mailto:, tel:) and `<Link>` for every route.
// Usage (repo root): node <this file>
import { globSync, readFileSync } from "node:fs";

/** href expressions whose value is external (checked against apps/marketing/src/content). */
const EXTERNAL = new Set([
  "{contactDetails.eMail.href}", // mailto:
  "{contactDetails.whatsapp.href}", // https://wa.me/...
  "{but.officialInfo.href}", // https://familienportal.de/...
  "{discordInvite}", // https://discord.com/...
]);

const errors = [];
const found = { a: 0, Link: 0 };
let buttons = 0;
for (const file of globSync("apps/*/src/**/*.tsx").sort()) {
  const source = readFileSync(file, "utf8");
  buttons += source.match(/<Button\s+asChild\b/g)?.length ?? 0;
  for (const match of source.matchAll(
    /<Button\s+asChild\b[\s\S]*?<(Link|a)\b([\s\S]*?)>/g,
  )) {
    const [, tag, attributes] = match;
    const href = /\bhref=(\{[^}]*\}|"[^"]*")/.exec(attributes)?.[1];
    found[tag]++;
    if (tag === "a" && !EXTERNAL.has(href))
      errors.push(`${file}: <a href=${href}> is not an external href`);
    if (tag === "Link" && EXTERNAL.has(href))
      errors.push(`${file}: <Link href=${href}> points outside the site`);
  }
}
console.log(`${buttons} Button asChild: ${found.Link} <Link>, ${found.a} <a>`);
if (errors.length || buttons !== found.Link + found.a) {
  console.error(errors.join("\n") || "a Button asChild without a Link/a child");
  process.exit(1);
}
```

Expected: `23 Button asChild: 18 <Link>, 5 <a>` and exit code 0.

- [ ] **Step 10: Codemod the names.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE"
perl -CSD -pi -e 's/variant="navy"/variant="secondary"/g; s/variant="white"/variant="inverse"/g; s/tone="on-navy-soft"/tone="inverse-muted"/g; s/tone="on-navy"/tone="inverse"/g; s/<Logo onDark \/>/<Logo tone="inverse" \/>/g; s/<Tag tone="navy">/<Tag tone="inverse">/g' $(grep -rlE 'variant="(navy|white)"|tone="on-navy|Logo onDark|Tag tone="navy"' apps/marketing/src packages/ui/src)
perl -CSD -0pi -e 's/type SelectTone = "default" \| "on-navy";/type SelectTone = "default" | "inverse";/; s/\n  "on-navy": \{\n    trigger:/\n  inverse: {\n    trigger:/' packages/ui/src/forms/select.tsx
perl -CSD -0pi -e 's/  onDark\?: boolean;/  \/** `inverse` on navy surfaces (footer). *\/\n  tone?: "default" | "inverse";/; s/  onDark = false,/  tone = "default",/; s/onDark \? "text-white" : "text-ink"/tone === "inverse" ? "text-white" : "text-ink"/; s/onDark \? "text-on-navy-soft" : "text-ink-soft"/tone === "inverse" ? "text-on-navy-soft" : "text-ink-soft"/' apps/marketing/src/components/layout/logo.tsx
grep -rnE 'variant="(navy|white)"|tone="(on-navy|navy)|"on-navy":|onDark' "$WORKTREE/apps/marketing/src" "$WORKTREE/packages/ui/src"
```

Expected: the final `grep` prints nothing. (It looks for the old prop values and the old Select key only; the
class names `text-on-navy`/`text-on-navy-soft` stay everywhere.) The `Select` in `booker.tsx` now passes
`tone="inverse"`.

- [ ] **Step 11: Stories.** In `packages/ui/src/primitives/button.stories.tsx`: import `{ Button }` only; the
      `variant` control options become `["primary", "secondary", "outline", "inverse", "ghost"]`; the `Variants`
      story's "Navy" button becomes `variant="secondary"` labelled `Secondary` and the "White" one
      `variant="inverse"` labelled `Inverse`; `AsLink` renders:

```tsx
<Button asChild variant={args.variant}>
  <a href="https://example.com">Externer Link</a>
</Button>
```

- [ ] **Step 12: Convention line.** `CLAUDE.md`, _Conventions_, after the bullet about building pages from
      `@skillsite/ui` components, add:

```markdown
- Variants are CVA maps named by role (`variant: primary | secondary | inverse | outline | ghost`,
  `tone: default | muted | inverse | ...`); a link styled as a button is `<Button asChild><Link …/></Button>`.
```

- [ ] **Step 13: Prove the result identical** (the `compare-computed` line needs a 600000 ms timeout or a
      background run).

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just static-checks && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
diff -r "$SCRATCH/html-before" "$SCRATCH/html-after" && echo IDENTICAL
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -2 "$SCRATCH/computed.txt"
cd "$WORKTREE" && pnpm --filter @skillsite/ui build-storybook --output-dir "$SCRATCH/storybook"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `IDENTICAL` - every element, attribute (sorted) and text node of the 14 URLs and the built CSS;
`72 page states, 20374 elements, 14768 forced pseudo-states compared.` and `No differences.` (this covers the
mobile-menu buttons and the booker's "Direkt anfragen" link); Storybook builds. Any difference is a finding: stop
and report.

- [ ] **Step 14: Tick spec C2**, run `just check`, commit
      `refactor(ui): build the variants on CVA with role names and give Button asChild`.

PR body: Summary (CVA for Button/Tag/Text/Heading, `Slot`, `LinkButton`/`buttonClasses` removed, role names per
E-08 incl. `inverse-muted` and the Select tone - see _Open points_ 1, 2), _Evidence_ (tests red -> green, HTML and
CSS identical, computed styles identical incl. the mobile menu and the unconfigured booker, link check 18/5),
_Deviations from the plan_, _How to check_: nothing visible - hover and click the header CTA, the "Online lernen"
dropdown items and the mobile-menu CTA (client navigation, no full reload), the external buttons on
`/online-lernen` (Discord opens in a new tab) and `/preise` (Familienportal), `/faecher` (navy button), `/ablauf`
and any page's CTA section (white button), footer logo; 390 and 1280 px, light and dark.

---

### Task 3: Token layer (spec C3)

**Branch:** `refactor/ui-tokens` from `refactor/ui-variants`. **PR title:**
`refactor(ui): name every design value as a token`.

**Files:**

- Modify: `packages/ui/styles/tokens.css`, `packages/ui/styles/base.css`
- Modify: `packages/ui/src/utils/cn.ts`, `packages/ui/src/utils/cn.test.ts`
- Create: `packages/ui/src/tokens/colors.ts`, `tokens/colors.test.ts`, `tokens/prose.test.ts`
- Modify: `packages/ui/package.json` (export `./tokens/colors`)
- Modify (classes; 36 files, map in Step 8): 29 under `apps/marketing/src`, 7 under `packages/ui/src`
- Modify: `apps/marketing/src/app/layout.tsx`, `app/manifest.ts`, `components/sections/whatsapp-qr.tsx` (hex)
- Modify: `packages/ui/src/primitives/button.test.tsx` (expected class string)
- Modify: `design-ratchet.json`, `CLAUDE.md` (_Conventions_), `docs/specs/foundation-refactor.md` (C3 box)

**Interfaces:**

- Consumes: Task 1's paths (`utils/cn.ts`, `utils/cn.test.ts`, `styles/tokens.css`, `styles/base.css`), Task 2's
  `Button`/`Tag`/`Select` class maps.
- Produces - token utilities later tasks use instead of arbitrary values:
  - colours: `accent`, `accent-2`, `on-accent`, `inverse`, `on-inverse`, `on-inverse-soft`, `on-inverse-muted`;
    `accent-tint-{8,11,12,14,16,35,45}`; `overlay-{6,7,8,10,12,14,15,20,22,25,35,40}`; `on-accent-{75,85,90}`;
    `glass`; `inverse-raised`; `syntax-string`
  - `shadow-{glow-sm,glow-md,glow-lg,raised,popover-inverse,logo,focus}`; `rounded-{callout,stat,caret}`;
    `max-w-measure-{12,13,14,15,16,18,24,26,30,32,34,38,40,42}`; `z-{raised,dropdown,sticky,overlay}`
  - spacing names (`p-*`, `m-*`, `gap-*`, ...): `split`, `split-about`, `split-hero`, `hero-top`, `hero-bottom`,
    `page-top`, `page-header-bottom`, `intro-bottom`, `footer`, `doc`, `panel`, `panel-contact`, `panel-timeline`,
    `panel-quote`, `panel-pricing`, `panel-cta`, `panel-booker`, `panel-booker-main`
  - role sizes (`text-*`, font size only): `accordion`, `button`, `button-lg`, `callout`, `card-body`, `card-link`,
    `card-title`, `card-title-sm`, `chip-icon`, `code`, `digit-lg`, `digit-md`, `digit-sm`, `footnote`,
    `icon-badge`, `logo`, `logo-tagline`, `month`, `price`, `price-badge`, `price-unit`, `quote`, `quote-lg`,
    `quote-source`, `stat`, `stat-sm`, `stat-label`, `stat-label-sm`, `step-title`
  - prose sizes for C4: `prose-h2`, `prose-h3`, `prose-body`, `prose-sm`, `prose-xs`
  - CSS variables: `--accent`, `--accent-2`, `--on-accent`, `--inverse`, `--on-inverse`, `--on-inverse-soft`,
    `--on-inverse-muted`, `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-color`
  - `brandColors` in `@skillsite/ui/tokens/colors`: `{ bg, bgDark, surface, ink, inkSoft, navy, coral }`
  - `<scratch>/c3-map.mjs` shape `[file, from, to, count]` - wave 2 reuses the toolkit's `expect-html.mjs` (whole
    tokens, with `normalize-snapshot.mjs`) and
    `probe-classes.mjs` with its own map
  - `design-ratchet.json` counts: `arbitrary-text` 0, `color-mix` 0, `arbitrary-shadow` 0, `arbitrary-radius` 0,
    `clamp-spacing` 0, `hex-color` 0; `raw-text-size` 21, `raw-button` 13, `inline-style` 16 unchanged.

**Background (measured on this tree; counts from `node scripts/design-ratchet.mjs` and a per-occurrence listing).**
Ratchet counts before: `arbitrary-text` 32 (31 sizes + `text-[#8FD49B]`), `color-mix` 13 (coral 8, 11, 12, 14 x4,
16, 22 (focus ring), 35, 45 %; `var(--bg)` 84 % in the navbar; `#ffffff` 7 % in `var(--navy)` for the Select
panel), `arbitrary-shadow` 7, `arbitrary-radius` 3 (14px, 18px, 1px), `clamp-spacing` 24 (16 distinct values),
`hex-color` 12 (+2 allow-listed in `layout.tsx`). White alphas: 27 `white/*` classes in 15 steps (6, 7, 8, 10,
12, 14, 15, 20, 22, 25, 35, 40 on fills/lines/ring; 75, 85, 90 on text). Reading widths: 24 `max-w-[..em]`, 14
values. z-index: `z-10` 3x, `z-20`, `z-50`, `z-100` 2x (one `focus:`). Tailwind 4.3.3 supports a `--z-index-*`
theme namespace. Three values map to two tokens each (`text-[1.4rem]`, `text-[1.05rem]`, `text-[0.92rem]`); their
map entries carry context so they are unique in the source and in the rendered classes. Some replaced classes only
render in states no route shows on load: the "available, not selected" calendar day (`border-accent-tint-45
bg-accent-tint-11`), the booking confirmation (`bg-accent-tint-12`), `error.tsx` (`max-w-measure-34`) - the class
probe covers them. A dry run of this task gave: expected HTML = after HTML (only the QR `fill` spelling outside
class attributes, _Open points_ 5); class probe over 105 distinct pairs - no differences; `compare-computed` over
72 page states, 20,374 elements and 14,768 forced pseudo-states - no differences; the manifest and the Open Graph
image byte-identical; the positive control flagged both nudged tokens (the `hover:` one only under forced
`:hover`); `just check` green.

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the four toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

Leave 3110 running.

- [ ] **Step 2: Write the failing tests.** Replace `packages/ui/src/utils/cn.test.ts` with:

```ts
import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { cn } from "./cn";

test("the later of two conflicting utilities wins", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("falsy inputs are dropped", () => {
  expect(cn("a", false, undefined, null, "b")).toBe("a b");
});

test("a type-scale size and a text colour both survive", () => {
  expect(cn("text-eyebrow text-coral")).toBe("text-eyebrow text-coral");
  expect(cn("text-lead", "text-ink-soft")).toBe("text-lead text-ink-soft");
  expect(cn("text-ink-soft text-small")).toBe("text-ink-soft text-small");
});

test("two font sizes conflict, scale tokens and Tailwind sizes alike", () => {
  expect(cn("text-eyebrow text-lead")).toBe("text-lead");
  expect(cn("text-sm text-small")).toBe("text-small");
  expect(cn("text-h4 text-base")).toBe("text-base");
});

test("the card shadow conflicts with shadows, not with shadow colours", () => {
  expect(cn("shadow-card shadow-none")).toBe("shadow-none");
  expect(cn("shadow-card shadow-coral/20")).toBe("shadow-card shadow-coral/20");
});

test("the coral gradient is a background image, not a background colour", () => {
  expect(cn("bg-coral-gradient bg-navy")).toBe("bg-coral-gradient bg-navy");
  expect(cn("bg-coral-gradient bg-none")).toBe("bg-none");
});

test("motion tokens conflict within their group", () => {
  expect(cn("duration-quick duration-200")).toBe("duration-200");
  expect(cn("duration-base duration-slow")).toBe("duration-slow");
  expect(cn("ease-flow ease-out")).toBe("ease-out");
  expect(cn("animate-rise animate-none")).toBe("animate-none");
});

test("section paddings conflict with spacing utilities", () => {
  expect(cn("py-section py-4")).toBe("py-4");
  expect(cn("py-section py-section-sm")).toBe("py-section-sm");
  expect(cn("pt-section py-section")).toBe("py-section");
  expect(cn("pb-section pb-0")).toBe("pb-0");
  expect(cn("pb-section pb-section-sm")).toBe("pb-section-sm");
});

test("the page width conflicts with max-width utilities", () => {
  expect(cn("max-w-page max-w-none")).toBe("max-w-none");
});

test("fluid spacings conflict with the spacing utilities of their side", () => {
  expect(cn("p-panel p-4")).toBe("p-4");
  expect(cn("gap-split gap-4")).toBe("gap-4");
  expect(cn("gap-x-panel-booker-main gap-x-2")).toBe("gap-x-2");
  expect(cn("p-panel px-4")).toBe("p-panel px-4");
});

test("stacking tokens conflict with z utilities", () => {
  expect(cn("z-sticky z-10")).toBe("z-10");
  expect(cn("z-raised z-overlay")).toBe("z-overlay");
});

test("role sizes are font sizes and colour tokens are colours", () => {
  expect(cn("text-button text-ink")).toBe("text-button text-ink");
  expect(cn("text-digit-lg text-coral")).toBe("text-digit-lg text-coral");
  expect(cn("text-on-accent-90 text-small")).toBe(
    "text-on-accent-90 text-small",
  );
  expect(cn("bg-accent-tint-14 bg-surface")).toBe("bg-surface");
});

// Drift guard: every token and utility of the theme must be known to `cn`.
// styles/theme.css is the entry file; its parts are read in its @import order.
const stylesDir = new URL("../../styles/", import.meta.url);
const themeParts = [
  ...readFileSync(new URL("theme.css", stylesDir), "utf8").matchAll(
    /^@import "\.\/([a-z-]+\.css)";$/gm,
  ),
].map((match) => match[1]!);
const themeCss = themeParts
  .map((part) => readFileSync(new URL(part, stylesDir), "utf8"))
  .join("\n");

test("theme.css imports its parts in a fixed order", () => {
  expect(themeParts).toEqual([
    "tokens.css",
    "base.css",
    "components.css",
    "motion.css",
  ]);
});

/** Every custom property declared inside an `@theme` block (brace depth aware). */
const themeTokens = [...themeCss.matchAll(/@theme\b[^{]*\{/g)].flatMap(
  (match) => {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < themeCss.length) {
      if (themeCss[end] === "{") depth++;
      if (themeCss[end] === "}") depth--;
      end++;
    }
    const body = themeCss.slice(match.index + match[0].length, end - 1);
    return [...body.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]!);
  },
);

/** For each utility namespace: a Tailwind utility that must override the token. */
const namespaceConflicts: Record<string, [prefix: string, winner: string]> = {
  color: ["bg", "bg-white"],
  font: ["font", "font-mono"],
  radius: ["rounded", "rounded-none"],
  shadow: ["shadow", "shadow-none"],
  container: ["max-w", "max-w-none"],
  spacing: ["p", "p-4"],
  "z-index": ["z", "z-10"],
  text: ["text", "text-sm"],
  ease: ["ease", "ease-linear"],
  "transition-duration": ["duration", "duration-200"],
  animate: ["animate", "animate-none"],
};

/** Namespaces that generate no utility: plain variables for CSS. */
const plainNamespaces = ["reveal", "default-transition"];

/**
 * Tailwind namespaces that share a prefix with a registered one but are not
 * registered in `cn`: a token there must not pass as, say, a `--font-*` token.
 */
const unregisteredNamespaces = [
  "font-weight",
  "text-shadow",
  "inset-shadow",
  "drop-shadow",
  "tracking",
  "leading",
  "breakpoint",
  "blur",
  "perspective",
  "aspect",
];

/** The namespace of a token: the longest matching one (`--font-weight-x` is font-weight). */
function namespaceOf(token: string) {
  return [
    ...Object.keys(namespaceConflicts),
    ...plainNamespaces,
    ...unregisteredNamespaces,
  ]
    .filter((namespace) => token.startsWith(`--${namespace}-`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Token names of one namespace, e.g. `--text-lead` -> `lead` (skips `--text-lead--line-height`). */
function tokens(namespace: string): string[] {
  return themeTokens
    .filter((token) => namespaceOf(token) === namespace)
    .map((token) => token.slice(namespace.length + 3))
    .filter((name) => !name.includes("--"));
}

test("every @theme token belongs to a registered or a plain namespace", () => {
  const known = [...Object.keys(namespaceConflicts), ...plainNamespaces];
  const unknown = themeTokens.filter(
    (token) => !known.includes(namespaceOf(token) ?? ""),
  );
  expect(unknown).toEqual([]);
  for (const namespace of plainNamespaces) {
    expect(tokens(namespace).length, namespace).toBeGreaterThan(0);
  }
});

for (const [namespace, [prefix, winner]] of Object.entries(
  namespaceConflicts,
)) {
  test(`every --${namespace}-* token is registered in cn`, () => {
    const names = tokens(namespace);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(cn(`${prefix}-${name}`, winner), `${prefix}-${name}`).toBe(winner);
    }
  });
}

test("no colour token is read as a font size", () => {
  for (const name of tokens("color")) {
    expect(cn(`text-${name} text-small`), name).toBe(`text-${name} text-small`);
  }
});

/** For each @utility: a class it must conflict with, or null when it has no conflicting group. */
const utilityConflicts: Record<string, string | null> = {
  "bg-coral-gradient": "bg-none",
  "py-section": "py-4",
  "py-section-sm": "py-4",
  "pt-section": "pt-4",
  "pb-section": "pb-4",
  "pb-section-sm": "pb-4",
  "hyphens-heading": "hyphens-none",
  "no-scrollbar": null,
  lift: null,
};

test("every @utility of theme.css is registered in cn", () => {
  const utilities = [...themeCss.matchAll(/^@utility ([a-z0-9-]+)/gm)].map(
    (match) => match[1]!,
  );
  expect(utilities.sort()).toEqual(Object.keys(utilityConflicts).sort());
  for (const [utility, winner] of Object.entries(utilityConflicts)) {
    if (winner) expect(cn(utility, winner), utility).toBe(winner);
  }
});
```

Create `packages/ui/src/tokens/colors.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { brandColors } from "./colors";

const themeCss = readFileSync(
  new URL("../../styles/tokens.css", import.meta.url),
  "utf8",
);

/** The value of `--name` in the first block whose selector is `selector`. */
function rawToken(selector: string, name: string) {
  const start = themeCss.indexOf(`${selector} {`);
  const block = themeCss.slice(start, themeCss.indexOf("}", start));
  return new RegExp(`--${name}:\\s*([^;]+);`).exec(block)?.[1];
}

test("brandColors mirror the raw tokens of tokens.css", () => {
  expect(brandColors.bg).toBe(rawToken(":root", "bg"));
  expect(brandColors.bgDark).toBe(rawToken('[data-theme="dark"]', "bg"));
  expect(brandColors.surface).toBe(rawToken(":root", "surface"));
  expect(brandColors.ink).toBe(rawToken(":root", "ink"));
  expect(brandColors.inkSoft).toBe(rawToken(":root", "ink-soft"));
  expect(brandColors.navy).toBe(rawToken(":root", "navy"));
  expect(brandColors.coral).toBe(rawToken(":root", "coral"));
});
```

Create `packages/ui/src/tokens/prose.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { expect, test } from "vitest";

const require = createRequire(import.meta.url);
const themeCss = readFileSync(
  new URL("../../styles/tokens.css", import.meta.url),
  "utf8",
);
const tailwindTheme = readFileSync(
  require.resolve("tailwindcss/theme.css"),
  "utf8",
);

/** The value of a custom property declared in a stylesheet. */
function value(css: string, name: string) {
  return new RegExp(`^\\s*--${name}:\\s*([^;]+);`, "m").exec(css)?.[1];
}

/** Each prose token is one of Tailwind's default sizes, value for value. */
const proseTokens: Record<string, string> = {
  "prose-h2": "2xl",
  "prose-h3": "lg",
  "prose-sm": "sm",
  "prose-xs": "xs",
};

for (const [prose, size] of Object.entries(proseTokens)) {
  test(`--text-${prose} is Tailwind's text-${size}`, () => {
    expect(value(themeCss, `text-${prose}`)).toBe(
      value(tailwindTheme, `text-${size}`),
    );
    expect(value(themeCss, `text-${prose}--line-height`)).toBe(
      value(tailwindTheme, `text-${size}--line-height`),
    );
  });
}

test("--text-prose-body is the body size with leading-7", () => {
  expect(value(themeCss, "text-prose-body")).toBe("1rem");
  // leading-7 = calc(var(--spacing) * 7) = 7 * 0.25rem
  expect(value(tailwindTheme, "spacing")).toBe("0.25rem");
  expect(value(themeCss, "text-prose-body--line-height")).toBe("1.75rem");
});
```

- [ ] **Step 3: Run them to see them fail.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/utils src/tokens
```

Expected: FAIL - `colors.test.ts` (cannot resolve `./colors`), all prose tests (`undefined`), "fluid spacings
conflict", "stacking tokens", "role sizes are font sizes" (`text-button` read as a colour), and the drift tests
for `--spacing-*` and `--z-index-*` (no tokens yet). "theme.css imports its parts" and "every @theme token belongs
to a registered or a plain namespace" pass already.

- [ ] **Step 4: The token layer.** Edit `packages/ui/styles/tokens.css` (a-g) and `packages/ui/styles/base.css`
      (h), then `pnpm format` (it wraps the three `--color-on-accent-*` lines):

  a) In the first `:root` block, after `--blue: #4f7cc4;`, add:

```text

  /* Shades for navy surfaces (theme-independent). */
  --on-navy: #eaf1fa;
  --on-navy-soft: #b9c8db;
  --on-navy-muted: #8298ae;
  --accent-blue: #9fc0ff;
  --coral-light: #ff8a5c;
```

b) After the closing brace of the `[data-theme="dark"]` block, add:

```text

/* ---------------------------------------------------------------------------
   Semantic roles. New code names the role, not the hue; the hue names above
   keep working during the refactor. Same values, so nothing renders differently.
--------------------------------------------------------------------------- */
:root {
  --accent: var(--coral);
  --accent-2: var(--coral-2);
  --on-accent: #ffffff;
  --inverse: var(--navy);
  --on-inverse: var(--on-navy);
  --on-inverse-soft: var(--on-navy-soft);
  --on-inverse-muted: var(--on-navy-muted);

  /* Keyboard focus ring (base :focus-visible outline). */
  --focus-ring-width: 3px;
  --focus-ring-offset: 3px;
  --focus-ring-color: var(--accent);
}
```

c) In `@theme inline`, after `--radius-3xl: 28px;`, add:

```text
  /* Radii off the scale, named by their one use. */
  --radius-callout: 14px;
  --radius-stat: 18px;
  --radius-caret: 1px;
```

d) After `--shadow-card: var(--shadow);`, add:

```text
  /* Coral glows under accent surfaces, by size. */
  --shadow-glow-sm: 0 14px 30px -12px var(--accent);
  --shadow-glow-md: 0 22px 44px -22px var(--accent);
  --shadow-glow-lg: 0 30px 60px -30px var(--accent);
  --shadow-raised: 0 12px 28px -12px rgba(0, 0, 0, 0.4);
  --shadow-popover-inverse: 0 24px 50px -18px rgba(0, 0, 0, 0.6);
  --shadow-logo: 0 5px 14px -5px rgba(16, 29, 45, 0.5);
  /* Focus ring of form controls. */
  --shadow-focus: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
```

e) After `--container-page: 1280px;`, add:

```text

  /* Reading widths (line lengths), in em of the element's own font size. */
  --container-measure-12: 12em;
  --container-measure-13: 13em;
  --container-measure-14: 14em;
  --container-measure-15: 15em;
  --container-measure-16: 16em;
  --container-measure-18: 18em;
  --container-measure-24: 24em;
  --container-measure-26: 26em;
  --container-measure-30: 30em;
  --container-measure-32: 32em;
  --container-measure-34: 34em;
  --container-measure-38: 38em;
  --container-measure-40: 40em;
  --container-measure-42: 42em;

  /* Fluid spacings: split-layout gaps, page blocks and panel paddings. */
  --spacing-split: clamp(1.75rem, 4vw, 3.5rem);
  --spacing-split-about: clamp(2rem, 5vw, 3.5rem);
  --spacing-split-hero: clamp(2rem, 5vw, 4rem);
  --spacing-hero-top: clamp(2.5rem, 7vw, 5.25rem);
  --spacing-hero-bottom: clamp(3rem, 6vw, 4.5rem);
  --spacing-page-top: clamp(2.5rem, 6vw, 4.5rem);
  --spacing-page-header-bottom: clamp(1.25rem, 3vw, 2rem);
  --spacing-intro-bottom: clamp(1.75rem, 4vw, 2.5rem);
  --spacing-footer: clamp(40px, 5vw, 56px);
  --spacing-doc: clamp(40px, 6vw, 72px);
  --spacing-panel: clamp(1.75rem, 4vw, 2.5rem);
  --spacing-panel-contact: clamp(1.75rem, 3.5vw, 2.5rem);
  --spacing-panel-timeline: clamp(1.5rem, 4vw, 2.25rem);
  --spacing-panel-quote: clamp(1.75rem, 4vw, 2.75rem);
  --spacing-panel-pricing: clamp(2rem, 4vw, 2.75rem);
  --spacing-panel-cta: clamp(2.5rem, 6vw, 4.5rem);
  --spacing-panel-booker: clamp(1.5rem, 3vw, 2.25rem);
  --spacing-panel-booker-main: clamp(1.25rem, 2.5vw, 2rem);

  /* Stacking order. */
  --z-index-raised: 10;
  --z-index-dropdown: 20;
  --z-index-sticky: 50;
  --z-index-overlay: 100;
```

f) Replace the five hex lines under `/* Accent shades for navy surfaces (theme-independent). */` with:

```text
  --color-on-navy: var(--on-navy);
  --color-on-navy-soft: var(--on-navy-soft);
  --color-on-navy-muted: var(--on-navy-muted);
  --color-accent-blue: var(--accent-blue);
  --color-coral-light: var(--coral-light);

  /* Semantic roles (see :root above). */
  --color-accent: var(--accent);
  --color-accent-2: var(--accent-2);
  --color-on-accent: var(--on-accent);
  --color-inverse: var(--inverse);
  --color-on-inverse: var(--on-inverse);
  --color-on-inverse-soft: var(--on-inverse-soft);
  --color-on-inverse-muted: var(--on-inverse-muted);

  /* Accent tints: the accent over transparent, by percent. */
  --color-accent-tint-8: color-mix(in srgb, var(--accent) 8%, transparent);
  --color-accent-tint-11: color-mix(in srgb, var(--accent) 11%, transparent);
  --color-accent-tint-12: color-mix(in srgb, var(--accent) 12%, transparent);
  --color-accent-tint-14: color-mix(in srgb, var(--accent) 14%, transparent);
  --color-accent-tint-16: color-mix(in srgb, var(--accent) 16%, transparent);
  --color-accent-tint-35: color-mix(in srgb, var(--accent) 35%, transparent);
  --color-accent-tint-45: color-mix(in srgb, var(--accent) 45%, transparent);

  /* White washes on navy and coral surfaces (fills, lines, rings), by percent. */
  --color-overlay-6: color-mix(in oklab, var(--color-white) 6%, transparent);
  --color-overlay-7: color-mix(in oklab, var(--color-white) 7%, transparent);
  --color-overlay-8: color-mix(in oklab, var(--color-white) 8%, transparent);
  --color-overlay-10: color-mix(in oklab, var(--color-white) 10%, transparent);
  --color-overlay-12: color-mix(in oklab, var(--color-white) 12%, transparent);
  --color-overlay-14: color-mix(in oklab, var(--color-white) 14%, transparent);
  --color-overlay-15: color-mix(in oklab, var(--color-white) 15%, transparent);
  --color-overlay-20: color-mix(in oklab, var(--color-white) 20%, transparent);
  --color-overlay-22: color-mix(in oklab, var(--color-white) 22%, transparent);
  --color-overlay-25: color-mix(in oklab, var(--color-white) 25%, transparent);
  --color-overlay-35: color-mix(in oklab, var(--color-white) 35%, transparent);
  --color-overlay-40: color-mix(in oklab, var(--color-white) 40%, transparent);

  /* Text on the accent surface, by opacity. */
  --color-on-accent-75: color-mix(in oklab, var(--color-white) 75%, transparent);
  --color-on-accent-85: color-mix(in oklab, var(--color-white) 85%, transparent);
  --color-on-accent-90: color-mix(in oklab, var(--color-white) 90%, transparent);

  /* Surfaces. */
  --color-glass: color-mix(in srgb, var(--bg) 84%, transparent);
  --color-inverse-raised: color-mix(in srgb, #ffffff 7%, var(--inverse));

  /* Syntax colour of strings in the code mock-up. */
  --color-syntax-string: #8fd49b;
```

g) After `--text-caption--line-height: 1.45;` (the last line of `@theme inline`), add:

```text

  /* Role sizes outside the scale: font size only, line height and weight stay
     with the element (so each renders exactly as its old arbitrary size). */
  --text-accordion: 1.08rem;
  --text-button: 1rem;
  --text-button-lg: 1.05rem;
  --text-callout: 0.84rem;
  --text-card-body: 0.96rem;
  --text-card-link: 0.95rem;
  --text-card-title: 1.4rem;
  --text-card-title-sm: 1.12rem;
  --text-chip-icon: 0.95em;
  --text-code: 0.86rem;
  --text-digit-lg: 2.4rem;
  --text-digit-md: 2.2rem;
  --text-digit-sm: 2rem;
  --text-footnote: 0.82rem;
  --text-icon-badge: 1.4rem;
  --text-logo: 1.04rem;
  --text-logo-tagline: 0.71rem;
  --text-month: 1.05rem;
  --text-price: clamp(3.6rem, 8vw, 5.2rem);
  --text-price-badge: 1.6rem;
  --text-price-unit: 1.1rem;
  --text-quote: clamp(1.3rem, 2.6vw, 1.9rem);
  --text-quote-lg: clamp(1.5rem, 3vw, 2.15rem);
  --text-quote-source: 0.92rem;
  --text-stat: clamp(1.9rem, 3.5vw, 2.6rem);
  --text-stat-sm: 1.5rem;
  --text-stat-label: 0.92rem;
  --text-stat-label-sm: 0.78rem;
  --text-step-title: 1.2rem;

  /* Legal pages: Tailwind's default sizes, named (prose-h2 = text-2xl,
     prose-h3 = text-lg, prose-sm = text-sm, prose-xs = text-xs; prose-body = the
     body size with leading-7). */
  --text-prose-h2: 1.5rem;
  --text-prose-h2--line-height: calc(2 / 1.5);
  --text-prose-h3: 1.125rem;
  --text-prose-h3--line-height: calc(1.75 / 1.125);
  --text-prose-body: 1rem;
  --text-prose-body--line-height: 1.75rem;
  --text-prose-sm: 0.875rem;
  --text-prose-sm--line-height: calc(1.25 / 0.875);
  --text-prose-xs: 0.75rem;
  --text-prose-xs--line-height: calc(1 / 0.75);
```

h) In `packages/ui/styles/base.css`, the `:focus-visible` rule becomes:

```text
  :focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
```

- [ ] **Step 5: The TS colour mirror.** Create `packages/ui/src/tokens/colors.ts`:

```ts
/**
 * Brand colours for runtimes that cannot read CSS variables: the theme-color
 * meta tags, the web app manifest and the QR code. Each mirrors a raw token of
 * `styles/tokens.css`; `colors.test.ts` keeps them equal.
 */
export const brandColors = {
  /** `--bg`, light */
  bg: "#faf6f0",
  /** `--bg`, dark */
  bgDark: "#0c1825",
  /** `--surface`, light */
  surface: "#ffffff",
  /** `--ink`, light */
  ink: "#16293d",
  /** `--ink-soft`, light */
  inkSoft: "#55677a",
  /** `--navy`, light */
  navy: "#13283f",
  /** `--coral` */
  coral: "#ff6a45",
} as const;
```

In `packages/ui/package.json`, add `"./tokens/colors": "./src/tokens/colors.ts"` as the last entry of `exports`.
(`ink`, `inkSoft` and `coral` serve the Open Graph image once _Open points_ 4 is decided; the test keeps them
honest meanwhile.)

- [ ] **Step 6: Register the tokens in `cn`.** Replace `packages/ui/src/utils/cn.ts` with:

```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge that knows the theme of `styles/theme.css`. Without this it
 * reads unknown names as colours (`text-eyebrow` as a text colour, `bg-coral-gradient`
 * as a background colour) and drops them next to a real colour. Every token and
 * `@utility` of theme.css is listed here; `cn.test.ts` fails when one is missing.
 * Colour tokens need no entry: tailwind-merge takes any unknown `bg-*`/`text-*`/
 * `border-*`/`ring-*` name for a colour, which is what they are.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "title",
        "eyebrow",
        "lead",
        "body",
        "small",
        "caption",
        // Role sizes outside the scale
        "accordion",
        "button",
        "button-lg",
        "callout",
        "card-body",
        "card-link",
        "card-title",
        "card-title-sm",
        "chip-icon",
        "code",
        "digit-lg",
        "digit-md",
        "digit-sm",
        "footnote",
        "icon-badge",
        "logo",
        "logo-tagline",
        "month",
        "price",
        "price-badge",
        "price-unit",
        "quote",
        "quote-lg",
        "quote-source",
        "stat",
        "stat-sm",
        "stat-label",
        "stat-label-sm",
        "step-title",
        // Legal pages
        "prose-h2",
        "prose-h3",
        "prose-body",
        "prose-sm",
        "prose-xs",
      ],
      shadow: [
        "card",
        "glow-sm",
        "glow-md",
        "glow-lg",
        "raised",
        "popover-inverse",
        "logo",
        "focus",
      ],
      radius: ["callout", "stat", "caret"],
      ease: ["flow", "soft"],
      animate: ["rise", "fade", "fade-down", "draw", "rise-soft", "settle"],
      container: [
        "page",
        "measure-12",
        "measure-13",
        "measure-14",
        "measure-15",
        "measure-16",
        "measure-18",
        "measure-24",
        "measure-26",
        "measure-30",
        "measure-32",
        "measure-34",
        "measure-38",
        "measure-40",
        "measure-42",
      ],
      spacing: [
        "split",
        "split-about",
        "split-hero",
        "hero-top",
        "hero-bottom",
        "page-top",
        "page-header-bottom",
        "intro-bottom",
        "footer",
        "doc",
        "panel",
        "panel-contact",
        "panel-timeline",
        "panel-quote",
        "panel-pricing",
        "panel-cta",
        "panel-booker",
        "panel-booker-main",
      ],
    },
    classGroups: {
      duration: [{ duration: ["quick", "base", "slow", "flow", "settle"] }],
      z: [{ z: ["raised", "dropdown", "sticky", "overlay"] }],
      py: [{ py: ["section", "section-sm"] }],
      pt: [{ pt: ["section"] }],
      pb: [{ pb: ["section", "section-sm"] }],
      "bg-image": [{ bg: ["coral-gradient"] }],
      hyphens: [{ hyphens: ["heading"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Run the package tests.**
      `source <scratch>/toolkit.sh; cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run` - expected:
      PASS, 8 files, 47 tests. If a drift test fails for a token, register it in the matching group - do not
      loosen the test.
- [ ] **Step 8: Replace the arbitrary values by token classes.** Save the class map as `<scratch>/c3-map.mjs`
      (the toolkit's `expect-html.mjs` and `probe-classes.mjs` read it too):

```js
// C3 class map: every arbitrary design value and the token class that replaces it.
// Each entry: [file, from, to, expected count in that file]. Where one value maps to
// two tokens (text-[1.4rem], text-[1.05rem], text-[0.92rem]) the entry carries enough
// context to be unique - in the source and in the rendered class attributes.
// Used by c3-classes.mjs (the codemod) and the toolkit's expect-html.mjs and
// probe-classes.mjs.
export const A = "apps/marketing/src/";
export const U = "packages/ui/src/";
// prettier-ignore
export const REPLACEMENTS = [
  // Accent tints (color-mix)
  [A + "app/online-lernen/page.tsx", "bg-[color-mix(in_srgb,var(--coral)_14%,transparent)]", "bg-accent-tint-14", 1],
  [A + "components/booking/booker.tsx", "bg-[color-mix(in_srgb,var(--coral)_16%,transparent)]", "bg-accent-tint-16", 1],
  [A + "components/booking/booker.tsx", "border-[color-mix(in_srgb,var(--coral)_45%,transparent)]", "border-accent-tint-45", 1],
  [A + "components/booking/booker.tsx", "bg-[color-mix(in_srgb,var(--coral)_11%,transparent)]", "bg-accent-tint-11", 1],
  [A + "components/booking/booker.tsx", "bg-[color-mix(in_srgb,var(--coral)_12%,transparent)]", "bg-accent-tint-12", 1],
  [A + "components/booking/fields/radio-field.tsx", "bg-[color-mix(in_srgb,var(--coral)_8%,transparent)]", "bg-accent-tint-8", 1],
  [A + "components/sections/benefit-grid.tsx", "bg-[color-mix(in_srgb,var(--coral)_14%,transparent)]", "bg-accent-tint-14", 1],
  [A + "components/sections/lesson-timeline.tsx", "bg-[color-mix(in_srgb,var(--coral)_14%,transparent)]", "bg-accent-tint-14", 1],
  [A + "components/sections/lesson-timeline.tsx", "bg-[color-mix(in_srgb,var(--coral)_35%,transparent)]", "bg-accent-tint-35", 1],
  [U + "primitives/tag.tsx", "bg-[color-mix(in_srgb,var(--coral)_14%,transparent)]", "bg-accent-tint-14", 1],
  // Other colour mixes
  [A + "components/layout/navbar.tsx", "bg-[color-mix(in_srgb,var(--bg)_84%,transparent)]", "bg-glass", 1],
  [U + "forms/select.tsx", "bg-[color-mix(in_srgb,#ffffff_7%,var(--navy))]", "bg-inverse-raised", 1],
  // Shadows
  [U + "forms/field.tsx", "focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--coral)_22%,transparent)]", "focus:shadow-focus", 1],
  [U + "primitives/button.tsx", "shadow-[0_14px_30px_-12px_var(--coral)]", "shadow-glow-sm", 1],
  [U + "primitives/button.tsx", "shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)]", "shadow-raised", 1],
  [A + "app/kontakt/page.tsx", "shadow-[0_22px_44px_-22px_var(--coral)]", "shadow-glow-md", 1],
  [A + "components/sections/cta-section.tsx", "shadow-[0_30px_60px_-30px_var(--coral)]", "shadow-glow-lg", 1],
  [U + "forms/select.tsx", "shadow-[0_24px_50px_-18px_rgba(0,0,0,0.6)]", "shadow-popover-inverse", 1],
  [A + "components/layout/logo.tsx", "shadow-[0_5px_14px_-5px_rgba(16,29,45,0.5)]", "shadow-logo", 1],
  // Radii
  [A + "app/page.tsx", "rounded-[14px]", "rounded-callout", 1],
  [A + "components/sections/stat-grid.tsx", "rounded-[18px]", "rounded-stat", 1],
  [A + "components/sections/code-typewriter.tsx", "rounded-[1px]", "rounded-caret", 1],
  // Fluid spacings
  [A + "app/ablauf/page.tsx", "gap-[clamp(1.75rem,4vw,3.5rem)]", "gap-split", 1],
  [A + "app/faecher/page.tsx", "gap-[clamp(1.75rem,4vw,3.5rem)]", "gap-split", 1],
  [A + "app/online-lernen/page.tsx", "gap-[clamp(1.75rem,4vw,3.5rem)]", "gap-split", 1],
  [A + "app/ueber-mich/page.tsx", "gap-[clamp(1.75rem,4vw,3.5rem)]", "gap-split", 1],
  [A + "app/ueber-mich/page.tsx", "gap-[clamp(2rem,5vw,3.5rem)]", "gap-split-about", 1],
  [A + "app/page.tsx", "gap-[clamp(2rem,5vw,4rem)]", "gap-split-hero", 1],
  [A + "app/page.tsx", "pt-[clamp(2.5rem,7vw,5.25rem)]", "pt-hero-top", 1],
  [A + "app/page.tsx", "pb-[clamp(3rem,6vw,4.5rem)]", "pb-hero-bottom", 1],
  [A + "components/layout/page-header.tsx", "pt-[clamp(2.5rem,6vw,4.5rem)]", "pt-page-top", 1],
  [A + "app/ueber-mich/page.tsx", "py-[clamp(2.5rem,6vw,4.5rem)]", "py-page-top", 1],
  [A + "components/layout/page-header.tsx", "pb-[clamp(1.25rem,3vw,2rem)]", "pb-page-header-bottom", 1],
  [A + "app/kontakt/page.tsx", "mb-[clamp(1.75rem,4vw,2.5rem)]", "mb-intro-bottom", 1],
  [A + "components/layout/footer.tsx", "py-[clamp(40px,5vw,56px)]", "py-footer", 1],
  [A + "components/docs/doc-components.tsx", "py-[clamp(40px,6vw,72px)]", "py-doc", 1],
  [A + "app/ablauf/page.tsx", "p-[clamp(1.75rem,4vw,2.5rem)]", "p-panel", 1],
  [A + "app/kontakt/page.tsx", "p-[clamp(1.75rem,3.5vw,2.5rem)]", "p-panel-contact", 1],
  [A + "app/online-lernen/page.tsx", "p-[clamp(1.5rem,4vw,2.25rem)]", "p-panel-timeline", 1],
  [A + "app/ueber-mich/page.tsx", "p-[clamp(1.75rem,4vw,2.75rem)]", "p-panel-quote", 1],
  [A + "app/preise/page.tsx", "p-[clamp(2rem,4vw,2.75rem)]", "p-panel-pricing", 2],
  [A + "components/sections/cta-section.tsx", "p-[clamp(2.5rem,6vw,4.5rem)]", "p-panel-cta", 1],
  [A + "components/booking/booker.tsx", "p-[clamp(1.5rem,3vw,2.25rem)]", "p-panel-booker", 1],
  [A + "components/booking/booker.tsx", "p-[clamp(1.25rem,2.5vw,2rem)]", "p-panel-booker-main", 1],
  [A + "components/booking/booker.tsx", "gap-x-[clamp(1.25rem,2.5vw,2rem)]", "gap-x-panel-booker-main", 1],
  // Reading widths
  [A + "app/ablauf/page.tsx", "max-w-[13em]", "max-w-measure-13", 1],
  [A + "app/ablauf/page.tsx", "max-w-[32em]", "max-w-measure-32", 1],
  [A + "app/error.tsx", "max-w-[34em]", "max-w-measure-34", 1],
  [A + "app/faecher/page.tsx", "max-w-[14em]", "max-w-measure-14", 1],
  [A + "app/kontakt/page.tsx", "max-w-[24em]", "max-w-measure-24", 1],
  [A + "app/kontakt/page.tsx", "max-w-[12em]", "max-w-measure-12", 1],
  [A + "app/kontakt/page.tsx", "max-w-[40em]", "max-w-measure-40", 1],
  [A + "app/not-found.tsx", "max-w-[34em]", "max-w-measure-34", 1],
  [A + "app/online-lernen/page.tsx", "max-w-[15em]", "max-w-measure-15", 1],
  [A + "app/online-lernen/page.tsx", "max-w-[42em]", "max-w-measure-42", 1],
  [A + "app/online-lernen/page.tsx", "max-w-[16em]", "max-w-measure-16", 1],
  [A + "app/page.tsx", "max-w-[30em]", "max-w-measure-30", 1],
  [A + "app/page.tsx", "max-w-[16em]", "max-w-measure-16", 1],
  [A + "app/preise/page.tsx", "max-w-[12em]", "max-w-measure-12", 1],
  [A + "app/preise/page.tsx", "max-w-[18em]", "max-w-measure-18", 1],
  [A + "app/preise/page.tsx", "max-w-[38em]", "max-w-measure-38", 1],
  [A + "app/termin/page.tsx", "max-w-[14em]", "max-w-measure-14", 1],
  [A + "app/ueber-mich/page.tsx", "max-w-[30em]", "max-w-measure-30", 1],
  [A + "app/zahlung/page.tsx", "max-w-[34em]", "max-w-measure-34", 1],
  [A + "components/layout/footer.tsx", "max-w-[26em]", "max-w-measure-26", 1],
  [A + "components/layout/page-header.tsx", "max-w-[34em]", "max-w-measure-34", 1],
  [A + "components/sections/cta-section.tsx", "max-w-[14em]", "max-w-measure-14", 1],
  [A + "components/sections/cta-section.tsx", "max-w-[30em]", "max-w-measure-30", 1],
  [U + "layout/section-header.tsx", "max-w-[34em]", "max-w-measure-34", 1],
  // Stacking order (with context: "z-10" is also a prefix of "z-100")
  [A + "app/layout.tsx", "focus:z-100", "focus:z-overlay", 1],
  [A + "components/layout/navbar.tsx", "sticky top-0 z-50", "sticky top-0 z-sticky", 1],
  [A + "components/layout/navbar.tsx", "top-full z-10", "top-full z-raised", 1],
  [A + "components/layout/theme-toggle.tsx", "relative z-10", "relative z-raised", 1],
  [U + "overlays/dialog.tsx", "inset-0 z-100", "inset-0 z-overlay", 1],
  [U + "overlays/dialog.tsx", "relative z-10", "relative z-raised", 1],
  [U + "forms/select.tsx", "top-full z-20", "top-full z-dropdown", 1],
  // White washes
  [A + "app/ablauf/page.tsx", "border-white/25", "border-overlay-25", 2],
  [A + "app/kontakt/page.tsx", "text-white/90", "text-on-accent-90", 2],
  [A + "app/kontakt/page.tsx", "border-white/35", "border-overlay-35", 1],
  [A + "app/kontakt/page.tsx", "bg-white/20", "bg-overlay-20", 1],
  [A + "app/kontakt/page.tsx", "text-white/85", "text-on-accent-85", 1],
  [A + "components/booking/booker.tsx", "border-white/12", "border-overlay-12", 1],
  [A + "components/booking/booker.tsx", "bg-white/8", "bg-overlay-8", 2],
  [A + "components/booking/fields/chips-field.tsx", "text-white/75", "text-on-accent-75", 1],
  [A + "components/layout/footer.tsx", "border-white/15", "border-overlay-15", 1],
  [A + "components/layout/theme-toggle.tsx", "focus-visible:ring-white/40", "focus-visible:ring-overlay-40", 1],
  [A + "components/layout/theme-toggle.tsx", "border-white/15", "border-overlay-15", 1],
  [A + "components/layout/theme-toggle.tsx", "bg-white/[0.07]", "bg-overlay-7", 1],
  [A + "components/layout/theme-toggle.tsx", "bg-white/20", "bg-overlay-20", 1],
  [A + "components/sections/cta-section.tsx", "text-white/90", "text-on-accent-90", 2],
  [A + "components/sections/cta-section.tsx", "text-white/85", "text-on-accent-85", 1],
  [U + "forms/select.tsx", "border-white/12", "border-overlay-12", 1],
  [U + "forms/select.tsx", "bg-white/[0.06]", "bg-overlay-6", 1],
  [U + "forms/select.tsx", "hover:border-white/22", "hover:border-overlay-22", 1],
  [U + "forms/select.tsx", "hover:bg-white/[0.1]", "hover:bg-overlay-10", 1],
  [U + "forms/select.tsx", "bg-white/8", "bg-overlay-8", 3],
  [U + "forms/select.tsx", "border-white/14", "border-overlay-14", 1],
  // Role type sizes
  [A + "app/faecher/page.tsx", "text-[1.4rem]", "text-icon-badge", 1],
  [A + "app/online-lernen/page.tsx", "text-[2.2rem]", "text-digit-md", 1],
  [A + "app/page.tsx", "text-[1.6rem]", "text-price-badge", 1],
  [A + "app/page.tsx", "text-[0.84rem]", "text-callout", 1],
  [A + "app/preise/page.tsx", "text-[clamp(3.6rem,8vw,5.2rem)]", "text-price", 1],
  [A + "app/preise/page.tsx", "text-[1.1rem]", "text-price-unit", 1],
  [A + "app/preise/page.tsx", "text-[2rem]", "text-digit-sm", 1],
  [A + "app/ueber-mich/page.tsx", "text-[clamp(1.3rem,2.6vw,1.9rem)]", "text-quote", 1],
  [A + "app/ueber-mich/page.tsx", "text-[2rem]", "text-digit-sm", 1],
  [A + "components/booking/booker.tsx", "font-heading text-[1.05rem] text-ink", "font-heading text-month text-ink", 1],
  [A + "components/booking/fields/chips-field.tsx", "text-[0.95em]", "text-chip-icon", 1],
  [A + "components/layout/logo.tsx", "text-[1.04rem]", "text-logo", 1],
  [A + "components/layout/logo.tsx", "text-[0.71rem]", "text-logo-tagline", 1],
  [A + "components/sections/benefit-grid.tsx", "text-[1.12rem]", "text-card-title-sm", 1],
  [A + "components/sections/benefit-grid.tsx", "text-[0.96rem]", "text-card-body", 1],
  [A + "components/sections/code-typewriter.tsx", "text-[#8FD49B]", "text-syntax-string", 1],
  [A + "components/sections/code-typewriter.tsx", "text-[0.86rem]", "text-code", 1],
  [A + "components/sections/stat-grid.tsx", "text-[clamp(1.9rem,3.5vw,2.6rem)]", "text-stat", 1],
  [A + "components/sections/stat-grid.tsx", "text-[1.5rem]", "text-stat-sm", 1],
  [A + "components/sections/stat-grid.tsx", "mt-1 text-[0.92rem]", "mt-1 text-stat-label", 1],
  [A + "components/sections/stat-grid.tsx", "text-[0.78rem]", "text-stat-label-sm", 1],
  [A + "components/sections/step-grid.tsx", "text-[2.4rem]", "text-digit-lg", 1],
  [A + "components/sections/step-grid.tsx", "text-[1.2rem]", "text-step-title", 1],
  [A + "components/sections/subject-cards.tsx", "text-[1.4rem] font-bold text-coral", "text-icon-badge font-bold text-coral", 1],
  [A + "components/sections/subject-cards.tsx", "text-[1.4rem] font-bold text-ink", "text-card-title font-bold text-ink", 1],
  [A + "components/sections/subject-cards.tsx", "text-[0.95rem]", "text-card-link", 1],
  [A + "components/sections/testimonials.tsx", "text-[clamp(1.5rem,3vw,2.15rem)]", "text-quote-lg", 1],
  [A + "components/sections/testimonials.tsx", "text-[0.92rem] text-ink-soft", "text-quote-source text-ink-soft", 1],
  [A + "components/sections/testimonials.tsx", "text-[0.82rem]", "text-footnote", 1],
  [U + "primitives/accordion.tsx", "text-[1.08rem]", "text-accordion", 1],
  [U + "primitives/button.tsx", "text-[1rem]", "text-button", 1],
  [U + "primitives/button.tsx", "py-3 text-[1.05rem]", "py-3 text-button-lg", 1],
];
```

and the codemod as `<scratch>/c3-classes.mjs`. It refuses to write anything when an expected count differs (the
code moved - re-measure, do not guess):

```js
// C3 codemod: replace every arbitrary design value by its token class (map: c3-map.mjs).
// It refuses to write anything when an expected count differs - the code moved;
// re-measure, do not guess.
// Usage (repo root): node <scratch>/c3-classes.mjs
import { readFileSync, writeFileSync } from "node:fs";

import { REPLACEMENTS } from "./c3-map.mjs";

const files = new Map();
const errors = [];
for (const [file, from, to, expected] of REPLACEMENTS) {
  const source = files.get(file) ?? readFileSync(file, "utf8");
  const count = source.split(from).length - 1;
  if (count !== expected)
    errors.push(`${file}: "${from}" found ${count}x, expected ${expected}x`);
  files.set(file, source.split(from).join(to));
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
for (const [file, source] of files) writeFileSync(file, source);
console.log(`${REPLACEMENTS.length} replacements in ${files.size} files`);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/c3-classes.mjs"
perl -pi -e 's/px-6 py-3 text-\[1\.05rem\] mt-6/px-6 py-3 text-button-lg mt-6/' "$WORKTREE/packages/ui/src/primitives/button.test.tsx"
```

Expected: `129 replacements in 36 files`. The `perl` line updates the expected class string of "asChild renders
the child element" (the class names changed by design; their order did not).

- [ ] **Step 9: Hex values from the TS mirror.**
  - `apps/marketing/src/app/layout.tsx`: add `import { brandColors } from "@skillsite/ui/tokens/colors";` after the
    `cn` import; the two `themeColor` colours become `brandColors.bg` and `brandColors.bgDark`.
  - `apps/marketing/src/app/manifest.ts`: add the same import after the `brand` import;
    `background_color: brandColors.bg`, `theme_color: brandColors.bg`.
  - `apps/marketing/src/components/sections/whatsapp-qr.tsx`: add the import after the `qrcode.react` import (blank
    line between); `bgColor={brandColors.surface} fgColor={brandColors.navy}`.
  - `apps/marketing/src/app/opengraph-image.tsx` stays unchanged (_Open points_ 4).
- [ ] **Step 10: Ratchet.** In `design-ratchet.json`, replace the `allow` object with:

```json
  "allow": {
    "hex-color": [
      {
        "file": "apps/marketing/src/app/opengraph-image.tsx",
        "reason": "Satori cannot read CSS variables, and Next derives the og:image URL hash from this file: moving its colours changes <head> on every page"
      },
      {
        "file": "packages/ui/src/tokens/colors.ts",
        "reason": "the TS mirror of styles/tokens.css for runtimes without CSS variables (theme-color, manifest, QR code); colors.test.ts keeps it equal"
      }
    ]
  },
```

Run `source <scratch>/toolkit.sh; cd "$WORKTREE" && just ratchet-update`. Expected output:
`lowered arbitrary-text: 32 -> 0`, `color-mix: 13 -> 0`, `arbitrary-shadow: 7 -> 0`, `arbitrary-radius: 3 -> 0`,
`clamp-spacing: 24 -> 0`, `hex-color: 12 -> 0`; the file's `counts` then read 0, 21, 0, 0, 0, 0, 0, 13, 16 (in its
key order). Any count other than these: stop and report.

- [ ] **Step 11: Convention line.** `CLAUDE.md`, _Conventions_, after the ratchet bullet, add:

```markdown
- Design values are tokens in `packages/ui/styles/tokens.css` (raw values -> semantic roles -> `@theme`). A new
  value gets a token and its `cn` registration (`packages/ui/src/utils/cn.ts`; the drift test enforces it), never
  an arbitrary class.
```

- [ ] **Step 12: Static checks and tests.**
      `source <scratch>/toolkit.sh; cd "$WORKTREE" && pnpm format && just static-checks && just test`. Expected:
      green; `@skillsite/ui` 8 files / 47 tests.
- [ ] **Step 13: Positive control.** Prove both computed-style tools see a one-step change, also behind `hover:`,
      before trusting their silence (the `compare-computed` line needs a 600000 ms timeout or a background run):

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && cp packages/ui/styles/tokens.css "$SCRATCH/tokens.css.bak"
perl -pi -e 's/(--color-accent-tint-14: color-mix\(in srgb, var\(--accent\)) 14%/$1 15%/; s/(--color-overlay-10: color-mix\(in oklab, var\(--color-white\)) 10%/$1 11%/' packages/ui/styles/tokens.css
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 '^/termin$|^/online-lernen$' > "$SCRATCH/control-computed.txt"
grep -o "background-color: [^|]*->[^|]*" "$SCRATCH/control-computed.txt" | sort | uniq -c
node "$SCRATCH/probe-classes.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 "$SCRATCH/c3-map.mjs" | grep -c ' -> '
cp "$SCRATCH/tokens.css.bak" "$WORKTREE/packages/ui/styles/tokens.css"
```

Expected: `compare-computed` exits 1 with 36 lines `color(srgb 1 0.415686 0.270588 / 0.14) -> ... / 0.15)` and 4
lines `oklab(... / 0.1) -> oklab(... / 0.11)` (the Select trigger under forced `:hover` on `/termin`); the probe
reports 24 differing pair/state lines (`bg-accent-tint-14` in all 5 states and `hover:bg-overlay-10` under
`:hover`, each at 2 widths x 2 schemes). The last line restores `tokens.css`.

- [ ] **Step 14: Prove the result identical** (the `compare-computed` line needs a 600000 ms timeout or a
      background run). This step uses wave 1's `expect-html.mjs`, saved as `<scratch>/expect-html-c3.mjs`: it
      replaces substrings (so `bg-white/8` also maps `hover:bg-white/8`, which the C3 map relies on) and carries
      C3's QR `fill` case. The toolkit's wave-2 version matches whole tokens and would not reproduce this result.

```js
// Build the expected "after" HTML snapshot of a class-renaming slice: the before
// snapshot with the slice's class map applied, so the real after snapshot can be
// diffed against it exactly. The map module exports REPLACEMENTS as
// [file, from, to, count] entries (C3: c3-map.mjs).
// Usage: node expect-html.mjs <map.mjs> <before-dir> <out-dir>
// then:  diff -r -x _styles.css <out-dir> <after-dir>   (must print nothing)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [mapFile, beforeDir, outDir] = process.argv.slice(2);
const { REPLACEMENTS } = await import(
  pathToFileURL(path.resolve(mapFile)).href
);
// Longest first: a context entry ("mt-1 text-[0.92rem]") wins over a bare value.
const map = [...REPLACEMENTS].sort((a, b) => b[1].length - a[1].length);

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(beforeDir)) {
  if (name === "_styles.css") continue; // the built CSS changes by design
  let text = readFileSync(path.join(beforeDir, name), "utf8");
  for (const [, from, to] of map) text = text.split(from).join(to);
  // C3's one expected change outside class attributes: the QR code's fill
  // attribute is now spelled like the token (#13283F -> #13283f), same colour.
  text = text.split('fill="#13283F"').join('fill="#13283f"');
  writeFileSync(path.join(outDir, name), text);
}
console.log(`expected snapshot written to ${outDir}`);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
node "$SCRATCH/expect-html-c3.mjs" "$SCRATCH/c3-map.mjs" "$SCRATCH/html-before" "$SCRATCH/html-expected"
diff -r -x _styles.css "$SCRATCH/html-expected" "$SCRATCH/html-after" && echo AS-EXPECTED
node "$SCRATCH/probe-classes.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 "$SCRATCH/c3-map.mjs" | tail -1
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -2 "$SCRATCH/computed.txt"
curl -s localhost:3110/manifest.webmanifest | shasum; curl -s localhost:3111/manifest.webmanifest | shasum
curl -s localhost:3110/opengraph-image | shasum; curl -s localhost:3111/opengraph-image | shasum
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `AS-EXPECTED` (the after HTML is the before HTML with the class map applied plus the QR `fill` case -
nothing else changed); the probe ends `No differences.`; `compare-computed` prints
`72 page states, 20374 elements, 14768 forced pseudo-states compared.` and `No differences.`; both manifest hashes
equal, both Open Graph image hashes equal. Anything else is a finding: stop and report with the output.

- [ ] **Step 15: Tick spec C3**, run `just check`, commit `refactor(ui): name every design value as a token`.

PR body: Summary (three token layers, the token families with counts, `cn` + drift guard, `brandColors`, prose
tokens for C4, ratchet 32/13/7/3/24/12 -> 0); _Evidence_ (tests red -> green; the positive control incl. the
`hover:` token; expected-HTML diff empty; class probe 105 pairs; `compare-computed` totals; manifest and OG image
hashes); _Deviations from the spec_, stated plainly: (1) the spec says "hex values in TS read from tokens where the
runtime allows it" - Satori would allow it, but the Open Graph image keeps its literals because Next derives the
`og:image` URL hash from the file and every page's `<head>` would change (allow-listed; _Open points_ 4); (2) the QR
code's `fill` attribute changes case `#13283F` -> `#13283f`, same colour (_Open points_ 5); (3) `Text`'s fifth tone
is named `inverse-muted`, outside E-08's four (_Open points_ 1); (4) the stacking tokens are named by layer -
`z-raised` (10) and `z-dropdown` (20) are separate roles although both are "above the neighbours"; _Deviations from
the plan_; _How to check_: nothing visible - `/`, `/preise`, `/kontakt` (coral card, booker aside), `/termin` -> a
day -> a slot -> the form (radio and chip selected, focus a field: coral ring), `/online-lernen` (timeline tint),
the footer's theme toggle (Tab: white ring), the mobile menu at 390 px (glass header); light and dark, 390 and
1280 px.

---

### Task 4a: The legal pages on a Prose module (spec C4, part 1)

**Branch:** `refactor/ui-prose` from `docs/phase-c-plan-wave-2`. **PR title:**
`refactor(ui): move the legal pages onto a prose module`.

**Files:**

- Modify: `packages/ui/src/typography/prose.tsx`; Create: `packages/ui/src/typography/prose.test.tsx`
- Modify: `packages/ui/src/typography/typography.test.tsx` (the one-API test)
- Modify: `apps/marketing/src/components/docs/doc-components.tsx`, `doc-section-nav.tsx`,
  `apps/marketing/src/app/{agb,datenschutz,impressum}/page.tsx`
- Modify: `design-ratchet.json`

**Interfaces:**

- Consumes: `Heading` (`@skillsite/ui/typography/heading`), the prose tokens of Task 3 (`text-prose-h2`,
  `text-prose-h3`, `text-prose-body`, `text-prose-sm`, `text-prose-xs`).
- Produces: `@skillsite/ui/typography/prose` exports exactly `ProseH2`, `ProseH3`, `ProseP` (each
  `React.HTMLAttributes` of its element) and `InlineLink({ variant?: "site" | "doc" })`. `H1`, `H2`, `H3`, `P`,
  `Small` and `Muted` no longer exist; a legal page title is `<Heading as="h1" size="h1">`.
- Produces: the toolkit's `apply-map.mjs`/`expect-html.mjs` map format with `(html)` and snapshot-limited entries
  (Tasks 4b and later reuse it).

**Background (measured on 943fb6e).** `prose.tsx` holds `H1`/`H2`/`H3`/`P` with a `site`/`doc` variant, `Small`,
`Muted` and `InlineLink`. Only the `doc` variants are rendered (doc components and the three legal pages:
`<P variant="doc">` 27x in `agb`, 48x in `datenschutz`, 2x in `impressum`); `Small` and `Muted` are imported
nowhere; `InlineLink` is used with `site` (booking form) and `doc`. `raw-text-size` is 21, 14 of them here:
`text-sm` 8x and `text-xs` 1x in `doc-components.tsx`, `text-sm`/`text-xs` 1x each in `doc-section-nav.tsx`, the
`text-2xl`/`text-lg` of the doc `H2`/`H3` in `prose.tsx`, and the redundant `className="text-lg"` on `DocSubSection`'s
`H3`. `ProseP` renders `text-prose-body` (1rem, line height 1.75rem) where the doc `P` set only `leading-7` and
inherited its size - an explicit 1rem that the computed-style comparison of the three legal pages must (and does)
show as unchanged. A dry run of this task gave: expected HTML (map applied, classes sorted) = after HTML; class
probe 5 pairs, no differences; `compare-computed` 72 page states / 20,374 elements / 14,768 forced states, no
differences; ratchet `raw-text-size` 21 -> 7.

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the toolkit scripts
      (`snapshot-html.mjs`, `normalize-snapshot.mjs`, `compare-computed.mjs`, `probe-classes.mjs`,
      `expect-html.mjs`, `apply-map.mjs`; _Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

Expected: 14 route lines and `1 stylesheet(s)`. Leave 3110 running.

- [ ] **Step 2: Write the failing tests.** Create `packages/ui/src/typography/prose.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import * as prose from "./prose";
import { InlineLink, ProseH2, ProseH3, ProseP } from "./prose";

afterEach(cleanup);

test("the prose module exports only the legal-text API", () => {
  expect(Object.keys(prose).sort()).toEqual([
    "InlineLink",
    "ProseH2",
    "ProseH3",
    "ProseP",
  ]);
});

test("prose headings and paragraphs render on the prose tokens", () => {
  render(
    <>
      <ProseH2>Geltungsbereich</ProseH2>
      <ProseH3>Vertragsschluss</ProseH3>
      <ProseP className="mt-6">Absatz</ProseP>
    </>,
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Geltungsbereich" })
      .className,
  ).toBe(
    "font-heading hyphens-heading text-prose-h2 font-bold tracking-tight text-ink",
  );
  expect(
    screen.getByRole("heading", { level: 3, name: "Vertragsschluss" })
      .className,
  ).toBe("font-heading hyphens-heading text-prose-h3 font-bold text-ink");
  expect(screen.getByText("Absatz").className).toBe(
    "text-prose-body text-ink mt-6",
  );
});

test("an inline link keeps its site and doc underline offsets", () => {
  render(
    <>
      <InlineLink href="/agb">AGB</InlineLink>
      <InlineLink variant="doc" href="/datenschutz">
        Datenschutz
      </InlineLink>
    </>,
  );
  expect(screen.getByRole("link", { name: "AGB" }).className).toContain(
    "underline-offset-4",
  );
  expect(screen.getByRole("link", { name: "Datenschutz" }).className).toContain(
    "underline-offset-[3px]",
  );
});
```

In `packages/ui/src/typography/typography.test.tsx`, replace the three imports
`import { Eyebrow } from "./eyebrow";`, `import { Lead } from "./lead";`, `import { Text } from "./text";` with:

```tsx
import * as eyebrow from "./eyebrow";
import { Eyebrow } from "./eyebrow";
import * as heading from "./heading";
import * as lead from "./lead";
import { Lead } from "./lead";
import * as prose from "./prose";
import * as text from "./text";
import { Text } from "./text";
```

and append:

```tsx
test("the typography group exports one API", () => {
  expect(
    [eyebrow, heading, lead, prose, text].flatMap(Object.keys).sort(),
  ).toEqual([
    "Address",
    "Eyebrow",
    "Heading",
    "InlineLink",
    "Lead",
    "ProseH2",
    "ProseH3",
    "ProseP",
    "Text",
  ]);
});
```

- [ ] **Step 3: Run them to see them fail.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/typography
```

Expected: FAIL - "the prose module exports only the legal-text API", "prose headings and paragraphs render on
the prose tokens" and "the typography group exports one API" (`H1`, `H2`, `H3`, `Muted`, `P`, `Small` are still
exported); "an inline link keeps its site and doc underline offsets" passes.

- [ ] **Step 4: The Prose module.** Replace `packages/ui/src/typography/prose.tsx` with:

```tsx
import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Prose: long legal text (AGB, Datenschutz, Impressum) on the prose tokens -
 * Tailwind's default sizes, named (styles/tokens.css). The page title is a
 * regular `Heading as="h1" size="h1"`.
   ------------------------------------------------------------------------- */
export function ProseH2({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-heading hyphens-heading text-prose-h2 font-bold tracking-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function ProseH3({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-heading hyphens-heading text-prose-h3 font-bold text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function ProseP({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-prose-body text-ink", className)} {...props} />;
}

type InlineLinkProps = React.ComponentProps<"a"> & {
  /** `doc` in legal text (tighter underline), `site` elsewhere. */
  variant?: "site" | "doc";
};

export function InlineLink({
  className,
  variant = "site",
  ...props
}: InlineLinkProps) {
  return (
    <a
      className={cn(
        "font-medium text-coral underline transition-colors hover:text-coral-2",
        variant === "doc" ? "underline-offset-[3px]" : "underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}
```

Run the command of Step 3 again. Expected: PASS.

- [ ] **Step 5: The legal pages onto it.** Save the map as `<scratch>/c4a-map.mjs` (`apply-map.mjs` applies its
      source entries, `expect-html.mjs` its snapshot entries):

```js
// C4a map: the legal pages onto the Prose module and the prose tokens.
// Each entry: [file, from, to, count in that file, snapshots?]. apply-map.mjs applies
// the source entries; expect-html.mjs applies the entries that carry snapshot files
// (the rendered classes), longest first.
export const A = "apps/marketing/src/";
const LEGAL = ["agb.txt", "datenschutz.txt", "impressum.txt"];
const DOCS = A + "components/docs/doc-components.tsx";
const NAV = A + "components/docs/doc-section-nav.tsx";

// prettier-ignore
export const REPLACEMENTS = [
  // Components: the doc variants of H1/H2/H3/P become Heading and the Prose module.
  [DOCS, 'import { H1, H2, H3, InlineLink } from "@skillsite/ui/typography/prose";', 'import { Heading } from "@skillsite/ui/typography/heading";\nimport { InlineLink, ProseH2, ProseH3 } from "@skillsite/ui/typography/prose";', 1],
  [DOCS, '<H1 variant="doc" className="mt-5">', '<Heading as="h1" size="h1" className="mt-5">', 1],
  [DOCS, "</H1>", "</Heading>", 1],
  [DOCS, '<H2 variant="doc" className="max-w-3xl">', '<ProseH2 className="max-w-3xl">', 1],
  [DOCS, "</H2>", "</ProseH2>", 1],
  [DOCS, '<H3 variant="doc" className="text-lg">', "<ProseH3>", 1],
  [DOCS, "</H3>", "</ProseH3>", 1],
  ...["app/agb/page.tsx", "app/datenschutz/page.tsx", "app/impressum/page.tsx"].flatMap((page, i) => [
    [A + page, 'import { InlineLink, P } from "@skillsite/ui/typography/prose";', 'import { InlineLink, ProseP } from "@skillsite/ui/typography/prose";', 1],
    [A + page, '<P variant="doc"', "<ProseP", [27, 48, 2][i]],
    [A + page, "</P>", "</ProseP>", [27, 48, 2][i]],
  ]),
  // Tailwind default sizes -> prose tokens (same values).
  [DOCS, "text-sm", "text-prose-sm", 8, LEGAL],
  [DOCS, "text-xs", "text-prose-xs", 1, LEGAL],
  [NAV, "text-sm", "text-prose-sm", 1, LEGAL],
  [NAV, "text-xs", "text-prose-xs", 1, LEGAL],
  // Rendered HTML only: the old component output and the new one.
  ["(html)", "text-2xl", "text-prose-h2", 0, LEGAL],
  ["(html)", "text-lg", "text-prose-h3", 0, LEGAL],
  ["(html)", "text-ink leading-7", "text-prose-body text-ink", 0, LEGAL],
];
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/apply-map.mjs" "$SCRATCH/c4a-map.mjs" && pnpm format
grep -rnE '<(P|H1|H2|H3) variant' "$WORKTREE/apps/marketing/src"
grep -rnE '\btext-(xs|sm|lg|2xl)\b' "$WORKTREE/apps/marketing/src/components/docs" "$WORKTREE/packages/ui/src/typography"
```

Expected: `5 files rewritten`; both `grep`s print nothing (`InlineLink variant="doc"` stays - it is the doc
underline).

- [ ] **Step 6: Ratchet and checks.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just ratchet-update && just static-checks && pnpm --filter @skillsite/ui exec vitest run
```

Expected: `lowered raw-text-size: 21 -> 7`; green; `@skillsite/ui` 9 files / 51 tests.

- [ ] **Step 7: Prove the result identical** (the `compare-computed` line needs a 600000 ms timeout or a
      background run).

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
node "$SCRATCH/expect-html.mjs" "$SCRATCH/c4a-map.mjs" "$SCRATCH/html-before" "$SCRATCH/html-expected"
node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-expected" "$SCRATCH/html-expected-n"
node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-after" "$SCRATCH/html-after-n"
diff -r -x _styles.css "$SCRATCH/html-expected-n" "$SCRATCH/html-after-n" && echo AS-EXPECTED
node "$SCRATCH/probe-classes.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 "$SCRATCH/c4a-map.mjs" | tail -1
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -2 "$SCRATCH/computed.txt"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `AS-EXPECTED`; the probe ends `No differences.` (5 pairs); `compare-computed` prints
`72 page states, 20374 elements, 14768 forced pseudo-states compared.` and `No differences.` (this includes every
`ProseP` on `/agb`, `/datenschutz` and `/impressum`: the explicit 1rem computes to the inherited 16px). Anything
else is a finding: stop and report.

- [ ] **Step 8: Commit.** `just check`, then commit `refactor(ui): move the legal pages onto a prose module`. The
      C4 box is ticked in Task 4b.

PR body: Summary (Prose module `ProseH2`/`ProseH3`/`ProseP`/`InlineLink` on the prose tokens, site variants and
`Small`/`Muted` removed, doc title on `Heading`, legal pages and doc components migrated, `raw-text-size`
21 -> 7); _What changes for a visitor_: nothing - expected-HTML diff empty, class probe 5 pairs, `compare-computed`
72 page states; _Deviations from the plan_; _How to check_: `/agb`, `/datenschutz`, `/impressum` at 390 and
1280 px, light and dark - headings, paragraphs, the fact boxes of the hero, the "Auf dieser Seite" navigation, the
legal-basis boxes and the doc links look as before.

---

### Task 4b: One typography API (spec C4, part 2)

**Branch:** `refactor/ui-typography` from `refactor/ui-prose`. **PR title:**
`refactor(ui): one typography API for headings, text and eyebrows`.

**Files:**

- Modify: `packages/ui/src/typography/heading.tsx`, `text.tsx`, `eyebrow.tsx`, `typography.test.tsx`
- Modify: `packages/ui/styles/tokens.css`, `packages/ui/src/utils/cn.ts`, `packages/ui/src/tokens/prose.test.ts`
- Modify: `packages/ui/src/primitives/{button,tag,accordion}.tsx`, `primitives/button.test.tsx`,
  `packages/ui/src/forms/select.tsx`
- Modify: `apps/marketing/src/app/{layout,kontakt/page,ablauf/page,preise/page}.tsx`,
  `components/sections/{cta-section,subject-cards,benefit-grid,step-grid}.tsx`, `components/layout/footer.tsx`,
  `components/booking/{booker,booking-form}.tsx`
- Modify: `design-ratchet.json`, `docs/specs/foundation-refactor.md` (C4 box)

**Interfaces:**

- Consumes: Task 4a's typography modules and map format.
- Produces (Task 5 and wave 3 rely on these):
  - `Heading({ as?, size?, tone?, wrap? })` - `size`: `display | h1 | h2 | h3 | h4 | title` (the scale) and
    `card-title | card-title-sm | step-title` (role size + bold); `tone`: `inherit` (default) `| default | muted |
inverse | inverse-soft`; `wrap`: `balance` (default: `text-balance hyphens-heading`) `| normal`. Class order:
    `font-heading`, wrap, size, tone, `className` - the scale headings render exactly as before.
  - `Text({ as?, size?, tone? })` - `size`: `lead | body | small | caption | note`; `tone`: `default | muted |
inverse | inverse-soft | inherit`. The C2 tone `inverse-muted` (`text-on-navy-soft`) is renamed `inverse-soft`.
  - `Eyebrow({ as?: "span" | "p", dot?: boolean, tone? })` - `tone`: `accent` (default, coral) `| muted |
inverse-accent | inverse-muted | on-accent`; `dot` (default `true`) adds the leading dot and the inline-flex row.
  - Role size tokens `text-accordion-icon`, `text-button-sm`, `text-note`, `text-skip-link`, `text-tag`
    (Tailwind's `text-xl`/`text-sm`/`text-sm`/`text-sm`/`text-xs`, size and line height).
  - `raw-text-size` 0.

**Background (measured on the tree after Task 4a).** Eight hand-built eyebrows (`text-eyebrow uppercase <colour>`):
`kontakt/page.tsx` 3 (two through `sideLabelClass`, one on the WhatsApp card), `ablauf/page.tsx`,
`cta-section.tsx`, `footer.tsx`, `booker.tsx` 3 - plus the label inside `Select`. One of them (booker "Buchung")
has the dot, but without `shrink-0`; the component's dot has it, so that dot's computed `flex-shrink` goes 1 -> 0 -
the one allowed difference of this task (`c4b-expect.json`). It moves nothing: the booker `<aside>` is
`flex flex-col`, so the eyebrow is stretched to the aside's content width - measured 222px at 320px, 292px in the
390 run and 248px in the 1280 run (the `@2xl` 20rem column, its narrowest) - while its content (dot, gap, text) is
88px, so the dot never has to shrink; and `compare-computed` compares the dot's used width and height, only
`flex-shrink` is allowed through. Three raw headings (`subject-cards.tsx`, `benefit-grid.tsx`, `step-grid.tsx`) are
`<h3 className="... font-heading text-<role> font-bold text-ink">` without `text-balance`/`hyphens-heading`, so
they become `Heading wrap="normal"`. The seven raw sizes left: `button.tsx` `sm` (no route renders it), `tag.tsx`,
the accordion's "+" icon, the skip link, `booking-form.tsx` 2x, `preise/page.tsx` 1x. `Text ... className="text-sm"`
renders `text-ink-soft text-sm` (cn drops `text-body`), which is `Text size="note"`. A dry run of this task gave:
expected HTML = after HTML; class probe 7 pairs, one expected difference (20x), no other; `compare-computed` 72 page
states, one expected difference (24x), no other; `raw-text-size` 7 -> 0; `just check` green.

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the six toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

- [ ] **Step 2: Write the failing tests.** Replace `packages/ui/src/typography/typography.test.tsx` with:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import * as eyebrow from "./eyebrow";
import { Eyebrow } from "./eyebrow";
import * as heading from "./heading";
import { Heading } from "./heading";
import * as lead from "./lead";
import { Lead } from "./lead";
import * as prose from "./prose";
import * as text from "./text";
import { Text } from "./text";

afterEach(cleanup);

test("Lead keeps its size next to its muted tone", () => {
  render(<Lead>Einleitung</Lead>);
  expect(screen.getByText("Einleitung").className).toMatch(/\btext-lead\b/);
});

test("Text keeps small and caption sizes next to a tone", () => {
  render(
    <>
      <Text size="small" tone="muted">
        Klein
      </Text>
      <Text size="caption" tone="muted">
        Fußnote
      </Text>
    </>,
  );
  expect(screen.getByText("Klein").className).toMatch(/\btext-small\b/);
  expect(screen.getByText("Fußnote").className).toMatch(/\btext-caption\b/);
});

test("Eyebrow keeps its size next to its coral colour", () => {
  render(<Eyebrow>Fächer</Eyebrow>);
  const eyebrow = screen.getByText("Fächer");
  expect(eyebrow.className).toMatch(/\btext-eyebrow\b/);
  expect(eyebrow.className).toMatch(/\btext-coral\b/);
});

test("Text tones on inverse surfaces are named by role", () => {
  render(
    <>
      <Text tone="inverse">Hell</Text>
      <Text tone="inverse-soft">Gedämpft</Text>
    </>,
  );
  expect(screen.getByText("Hell").className).toBe("text-body text-on-navy");
  expect(screen.getByText("Gedämpft").className).toBe(
    "text-body text-on-navy-soft",
  );
});

test("the typography group exports one API", () => {
  expect(
    [eyebrow, heading, lead, prose, text].flatMap(Object.keys).sort(),
  ).toEqual([
    "Address",
    "Eyebrow",
    "Heading",
    "InlineLink",
    "Lead",
    "ProseH2",
    "ProseH3",
    "ProseP",
    "Text",
  ]);
});

test("a scale heading keeps its classes in their order", () => {
  render(<Heading>Titel</Heading>);
  expect(screen.getByRole("heading", { level: 2 }).className).toBe(
    "font-heading text-balance hyphens-heading text-h2",
  );
});

test("a card heading has a role size, the plain wrap and a tone", () => {
  render(
    <Heading
      as="h3"
      size="card-title"
      wrap="normal"
      tone="default"
      className="mt-5"
    >
      Mathematik
    </Heading>,
  );
  expect(screen.getByRole("heading", { level: 3 }).className).toBe(
    "font-heading text-card-title font-bold text-ink mt-5",
  );
});

test("Eyebrow has tones, an optional dot and an element", () => {
  render(
    <>
      <Eyebrow>Fächer</Eyebrow>
      <Eyebrow as="p" dot={false} tone="inverse-muted">
        Navigation
      </Eyebrow>
    </>,
  );
  const dotted = screen.getByText("Fächer");
  expect(dotted.className).toBe(
    "text-eyebrow uppercase inline-flex items-center gap-2.25 text-coral",
  );
  expect(dotted.firstElementChild?.className).toBe(
    "size-1.75 shrink-0 rounded-full bg-coral",
  );
  const plain = screen.getByText("Navigation");
  expect(plain.tagName).toBe("P");
  expect(plain.className).toBe("text-eyebrow uppercase text-on-navy-muted");
  expect(plain.children).toHaveLength(0);
});

test("the note size is fine print at its own token", () => {
  render(
    <Text size="note" tone="muted">
      Quelle
    </Text>,
  );
  expect(screen.getByText("Quelle").className).toBe("text-note text-ink-soft");
});
```

In `packages/ui/src/tokens/prose.test.ts`, replace the line
`for (const [prose, size] of Object.entries(proseTokens)) {` with:

```ts
/** UI role sizes that keep one of Tailwind's default sizes (C4), value for value. */
const uiTokens: Record<string, string> = {
  "accordion-icon": "xl",
  "button-sm": "sm",
  note: "sm",
  "skip-link": "sm",
  tag: "xs",
};

for (const [prose, size] of Object.entries({ ...proseTokens, ...uiTokens })) {
```

- [ ] **Step 3: Run them to see them fail.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/typography src/tokens
```

Expected: FAIL - 4 of the 12 tests in `src/typography` ("Text tones on inverse surfaces are named by role", "a
card heading has a role size ...", "Eyebrow has tones ...", "the note size ...") and the 5 new token tests in
`src/tokens/prose.test.ts` (`undefined`).

- [ ] **Step 4: The API.** Replace `packages/ui/src/typography/heading.tsx` with:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Headings
 *
 * `size` maps to one class from the type scale (size + line-height + tracking +
 * weight live in `@theme`), or to a role size outside the scale (card and step
 * titles: size token + bold). `tone` sets the colour; the default `inherit`
 * takes it from the parent, so the same heading works on light and navy
 * surfaces. `wrap="normal"` drops the balanced, hyphenated wrapping.
   ------------------------------------------------------------------------- */
const headingVariants = cva("font-heading", {
  variants: {
    wrap: {
      balance: "text-balance hyphens-heading",
      normal: "",
    },
    size: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
      title: "text-title",
      "card-title": "text-card-title font-bold",
      "card-title-sm": "text-card-title-sm font-bold",
      "step-title": "text-step-title font-bold",
    },
    tone: {
      inherit: "",
      default: "text-ink",
      muted: "text-ink-soft",
      inverse: "text-on-navy",
      "inverse-soft": "text-on-navy-soft",
    },
  },
  defaultVariants: { wrap: "balance", size: "h2", tone: "inherit" },
});

export type HeadingSize = NonNullable<
  VariantProps<typeof headingVariants>["size"]
>;

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  };

export function Heading({
  as: Tag = "h2",
  wrap,
  size,
  tone,
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(headingVariants({ wrap, size, tone }), className)}
      {...props}
    />
  );
}
```

Replace `packages/ui/src/typography/text.tsx` with:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Body text
   ------------------------------------------------------------------------- */
const textVariants = cva("", {
  variants: {
    size: {
      lead: "text-lead",
      body: "text-body",
      small: "text-small",
      caption: "text-caption",
      /** Fine print: sources, legal notes, consent labels. */
      note: "text-note",
    },
    tone: {
      default: "text-ink",
      muted: "text-ink-soft",
      inverse: "text-on-navy",
      "inverse-soft": "text-on-navy-soft",
      inherit: "",
    },
  },
  defaultVariants: { size: "body", tone: "default" },
});

export type TextSize = NonNullable<VariantProps<typeof textVariants>["size"]>;
export type TextTone = NonNullable<VariantProps<typeof textVariants>["tone"]>;

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div";
  };

export function Text({
  as: Tag = "p",
  size,
  tone,
  className,
  ...props
}: TextProps) {
  return (
    <Tag className={cn(textVariants({ size, tone }), className)} {...props} />
  );
}

export function Address({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <address
      className={cn("text-body not-italic text-ink", className)}
      {...props}
    />
  );
}
```

Replace `packages/ui/src/typography/eyebrow.tsx` with:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const eyebrowVariants = cva("text-eyebrow uppercase", {
  variants: {
    /** The leading dot; without it the label is a plain text element. */
    dot: {
      true: "inline-flex items-center gap-2.25",
      false: "",
    },
    tone: {
      accent: "text-coral",
      muted: "text-ink-soft",
      "inverse-accent": "text-accent-blue",
      "inverse-muted": "text-on-navy-muted",
      "on-accent": "text-on-accent-90",
    },
  },
  defaultVariants: { dot: true, tone: "accent" },
});

type EyebrowProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof eyebrowVariants> & {
    as?: "span" | "p";
  };

/** Small uppercase label above a heading; coral with a leading dot by default. */
export function Eyebrow({
  as: Tag = "span",
  dot = true,
  tone,
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <Tag className={cn(eyebrowVariants({ dot, tone }), className)} {...props}>
      {dot ? (
        <span
          className="size-1.75 shrink-0 rounded-full bg-coral"
          aria-hidden
        />
      ) : null}
      {children}
    </Tag>
  );
}
```

- [ ] **Step 5: The role size tokens.** In `packages/ui/styles/tokens.css`, after
      `--text-prose-xs--line-height: calc(1 / 0.75);`, add:

```text

  /* UI role sizes that keep one of Tailwind's default sizes (size and line
     height): tag = text-xs; button-sm, note, skip-link = text-sm;
     accordion-icon = text-xl. */
  --text-accordion-icon: 1.25rem;
  --text-accordion-icon--line-height: calc(1.75 / 1.25);
  --text-button-sm: 0.875rem;
  --text-button-sm--line-height: calc(1.25 / 0.875);
  --text-note: 0.875rem;
  --text-note--line-height: calc(1.25 / 0.875);
  --text-skip-link: 0.875rem;
  --text-skip-link--line-height: calc(1.25 / 0.875);
  --text-tag: 0.75rem;
  --text-tag--line-height: calc(1 / 0.75);
```

In `packages/ui/src/utils/cn.ts`, after `"prose-xs",` in the `text` list, add:

```ts
        // UI role sizes at Tailwind's default sizes
        "accordion-icon",
        "button-sm",
        "note",
        "skip-link",
        "tag",
```

Run the command of Step 3 again, then `pnpm --filter @skillsite/ui exec vitest run`. Expected: PASS; 9 files /
60 tests.

- [ ] **Step 6: The call sites.** Save the map as `<scratch>/c4b-map.mjs`:

```js
// C4b map: hand-built eyebrows and headings onto the typography API, the last raw
// Tailwind sizes onto role tokens, the Text tone `inverse-muted` renamed `inverse-soft`.
// Each entry: [file, from, to, count in that file, snapshots?]. apply-map.mjs applies
// the source entries; expect-html.mjs applies the entries that carry snapshot files
// (the rendered classes), longest first.
const A = "apps/marketing/src/";
const U = "packages/ui/src/";
const ALL = [
  "index.txt",
  "faecher.txt",
  "ablauf.txt",
  "preise.txt",
  "ueber-mich.txt",
  "kontakt.txt",
  "termin.txt",
  "online-lernen.txt",
  "impressum.txt",
  "datenschutz.txt",
  "agb.txt",
  "zahlung_re_RE-1840_betrag_90_00_20EUR.txt",
  "zahlung_re_x_betrag_abc.txt",
  "gibt-es-nicht.txt",
];
const EYEBROW = 'import { Eyebrow } from "@skillsite/ui/typography/eyebrow";\n';
const HEADING = 'import { Heading } from "@skillsite/ui/typography/heading";\n';

// prettier-ignore
export const REPLACEMENTS = [
  // Raw Tailwind sizes -> UI role tokens (same values; source and rendered classes).
  [U + "primitives/button.tsx", "py-1.5 text-sm", "py-1.5 text-button-sm", 1],
  [U + "primitives/tag.tsx", "py-1 text-xs font-semibold", "py-1 text-tag font-semibold", 1, ALL],
  [U + "primitives/accordion.tsx", "text-xl leading-none", "text-accordion-icon leading-none", 1, ALL],
  [A + "app/layout.tsx", "focus:text-sm", "focus:text-skip-link", 1, ALL],
  [A + "components/booking/booking-form.tsx", "gap-3 text-sm leading-relaxed", "gap-3 text-note leading-relaxed", 1],
  [A + "components/booking/booking-form.tsx", '<Text tone="muted" className="text-sm">', '<Text size="note" tone="muted">', 1],
  [A + "app/preise/page.tsx", '<Text as="span" tone="muted" className="text-sm">', '<Text as="span" size="note" tone="muted">', 1],
  ["(html)", "text-ink-soft text-sm", "text-note text-ink-soft", 0, ["preise.txt"]],
  // Text tone rename (same class).
  [A + "app/preise/page.tsx", 'tone="inverse-muted"', 'tone="inverse-soft"', 2],
  [A + "app/ablauf/page.tsx", 'tone="inverse-muted"', 'tone="inverse-soft"', 1],
  [A + "components/booking/booker.tsx", 'tone="inverse-muted"', 'tone="inverse-soft"', 1],
  // Hand-built eyebrows -> Eyebrow (same classes, order aside).
  [A + "app/kontakt/page.tsx", 'const sideLabelClass = "text-eyebrow uppercase text-coral";\n', "", 1],
  [A + "app/kontakt/page.tsx", "<span className={sideLabelClass}>E-Mail</span>", "<Eyebrow dot={false}>E-Mail</Eyebrow>", 1],
  [A + "app/kontakt/page.tsx", "<span className={sideLabelClass}>\n                Discord und Microsoft Teams\n              </span>", "<Eyebrow dot={false}>Discord und Microsoft Teams</Eyebrow>", 1],
  [A + "app/kontakt/page.tsx", '<span className="text-eyebrow uppercase text-on-accent-90">\n                Am liebsten per WhatsApp\n              </span>', '<Eyebrow dot={false} tone="on-accent">\n                Am liebsten per WhatsApp\n              </Eyebrow>', 1],
  [A + "app/ablauf/page.tsx", HEADING, EYEBROW + HEADING, 1],
  [A + "app/ablauf/page.tsx", '<span className="text-eyebrow uppercase text-accent-blue">\n                Unser Klassenzimmer\n              </span>', '<Eyebrow dot={false} tone="inverse-accent">\n                Unser Klassenzimmer\n              </Eyebrow>', 1],
  [A + "components/sections/cta-section.tsx", HEADING, EYEBROW + HEADING, 1],
  [A + "components/sections/cta-section.tsx", '<span className="text-eyebrow uppercase text-on-accent-90">\n          {eyebrow}\n        </span>', '<Eyebrow dot={false} tone="on-accent">\n          {eyebrow}\n        </Eyebrow>', 1],
  [A + "components/layout/footer.tsx", 'import { contactDetails } from "@/content/contact";\n', 'import { contactDetails } from "@/content/contact";\nimport { Eyebrow } from "@skillsite/ui/typography/eyebrow";\n', 1],
  [A + "components/layout/footer.tsx", '<p className="text-eyebrow uppercase text-on-navy-muted">{title}</p>', '<Eyebrow as="p" dot={false} tone="inverse-muted">\n        {title}\n      </Eyebrow>', 1],
  [A + "components/booking/booker.tsx", HEADING, EYEBROW + HEADING, 1],
  [A + "components/booking/booker.tsx", '<span className="inline-flex items-center gap-2.25 text-eyebrow uppercase text-accent-blue">\n            <span className="size-1.75 rounded-full bg-coral" aria-hidden />\n            Buchung\n          </span>', '<Eyebrow tone="inverse-accent">Buchung</Eyebrow>', 1],
  [A + "components/booking/booker.tsx", '<p className="text-eyebrow uppercase text-accent-blue">\n                Dein Termin\n              </p>', '<Eyebrow as="p" dot={false} tone="inverse-accent">\n                Dein Termin\n              </Eyebrow>', 1],
  [A + "components/booking/booker.tsx", '<p className="text-eyebrow uppercase text-ink-soft">\n                Dein Termin\n              </p>', '<Eyebrow as="p" dot={false} tone="muted">\n                Dein Termin\n              </Eyebrow>', 1],
  ["(html)", "size-1.75 rounded-full bg-coral", "size-1.75 shrink-0 rounded-full bg-coral", 0, ["termin.txt", "kontakt.txt"]],
  // Select's label is an eyebrow too.
  [U + "forms/select.tsx", 'import { cn } from "../utils/cn";\n', 'import { Eyebrow } from "../typography/eyebrow";\nimport { cn } from "../utils/cn";\n', 1],
  [U + "forms/select.tsx", "    eyebrow: string;\n", '    eyebrow: "muted" | "inverse-accent";\n', 1],
  [U + "forms/select.tsx", '    eyebrow: "text-ink-soft",\n', '    eyebrow: "muted",\n', 1],
  [U + "forms/select.tsx", '    eyebrow: "text-accent-blue",\n', '    eyebrow: "inverse-accent",\n', 1],
  [U + "forms/select.tsx", '<span className={cn("text-eyebrow uppercase", t.eyebrow)}>\n            {hideLabel ? null : label}\n          </span>', "<Eyebrow dot={false} tone={t.eyebrow}>\n            {hideLabel ? null : label}\n          </Eyebrow>", 1],
  // Raw headings -> Heading (role size, plain wrap, default tone).
  [A + "components/sections/subject-cards.tsx", 'import { Tag } from "@skillsite/ui/primitives/tag";\n', 'import { Tag } from "@skillsite/ui/primitives/tag";\n' + HEADING, 1],
  [A + "components/sections/subject-cards.tsx", '<h3 className="mt-5 font-heading text-card-title font-bold text-ink">\n        {subject.name}\n      </h3>', '<Heading\n        as="h3"\n        size="card-title"\n        wrap="normal"\n        tone="default"\n        className="mt-5"\n      >\n        {subject.name}\n      </Heading>', 1],
  [A + "components/sections/benefit-grid.tsx", 'import { Reveal } from "@skillsite/ui/motion/reveal";\n', 'import { Reveal } from "@skillsite/ui/motion/reveal";\n' + HEADING, 1],
  [A + "components/sections/benefit-grid.tsx", '<h3 className="mb-1.5 font-heading text-card-title-sm font-bold text-ink">\n            {benefit.title}\n          </h3>', '<Heading\n            as="h3"\n            size="card-title-sm"\n            wrap="normal"\n            tone="default"\n            className="mb-1.5"\n          >\n            {benefit.title}\n          </Heading>', 1],
  [A + "components/sections/step-grid.tsx", 'import { Reveal } from "@skillsite/ui/motion/reveal";\n', 'import { Reveal } from "@skillsite/ui/motion/reveal";\n' + HEADING, 1],
  [A + "components/sections/step-grid.tsx", '<h3 className="mt-3 font-heading text-step-title font-bold text-ink">\n              {step.title}\n            </h3>', '<Heading\n              as="h3"\n              size="step-title"\n              wrap="normal"\n              tone="default"\n              className="mt-3"\n            >\n              {step.title}\n            </Heading>', 1],
];
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/apply-map.mjs" "$SCRATCH/c4b-map.mjs" && pnpm format
perl -pi -e 's/hover:opacity-90 py-1\.5 text-sm px-4/hover:opacity-90 py-1.5 text-button-sm px-4/' "$WORKTREE/packages/ui/src/primitives/button.test.tsx"
grep -rn "text-eyebrow" "$WORKTREE/apps/marketing/src" "$WORKTREE/packages/ui/src" | grep -v "\.test\." | grep -v "utils/cn.ts"
grep -rn "<h[1-6] " "$WORKTREE/apps/marketing/src/components/sections"
```

Expected: `15 files rewritten`; the first `grep` prints only `typography/eyebrow.tsx` (the component itself), the
second nothing. The `perl` line updates the class string in "the class order is base, variant, size, then
className" (the size token changed; the order did not).

- [ ] **Step 7: Ratchet and checks.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just ratchet-update && just static-checks && pnpm --filter @skillsite/ui exec vitest run
```

Expected: `lowered raw-text-size: 7 -> 0`; green; 9 files / 60 tests.

- [ ] **Step 8: Prove the result identical** (the `compare-computed` line needs a 600000 ms timeout or a
      background run). Save the allowed difference as `<scratch>/c4b-expect.json`:

```json
[
  {
    "tool": "computed",
    "path": ">aside:0>span:0>span:0$",
    "property": "flex-shrink",
    "before": "1",
    "after": "0"
  },
  {
    "tool": "probe",
    "path": "^size-1\\.75 rounded-full bg-coral -> ",
    "property": "flex-shrink",
    "before": "1",
    "after": "0"
  }
]
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
node "$SCRATCH/expect-html.mjs" "$SCRATCH/c4b-map.mjs" "$SCRATCH/html-before" "$SCRATCH/html-expected"
node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-expected" "$SCRATCH/html-expected-n"
node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-after" "$SCRATCH/html-after-n"
diff -r -x _styles.css "$SCRATCH/html-expected-n" "$SCRATCH/html-after-n" && echo AS-EXPECTED
EXPECT="$SCRATCH/c4b-expect.json" node "$SCRATCH/probe-classes.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 "$SCRATCH/c4b-map.mjs" | tail -2
EXPECT="$SCRATCH/c4b-expect.json" node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -3 "$SCRATCH/computed.txt"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `AS-EXPECTED`; the probe prints
`expected: flex-shrink 1 -> 0 at /^size-1\.75 rounded-full bg-coral -> / (20x)` and `No differences.`;
`compare-computed` prints `72 page states, 20374 elements, 14768 forced pseudo-states compared.`,
`expected: flex-shrink 1 -> 0 at />aside:0>span:0>span:0$/ (24x)` and `No differences.` Anything else is a
finding: stop and report.

- [ ] **Step 9: Tick spec C4** (its box), run `just check`, commit
      `refactor(ui): one typography API for headings, text and eyebrows`.

PR body: Summary (Heading `tone`/`wrap`/role sizes, Text `note` and the `inverse-soft` rename, Eyebrow
`tone`/`dot`/`as`; 8 hand-built eyebrows + the Select label, 3 raw headings, the last 7 raw sizes onto role
tokens; `raw-text-size` 7 -> 0; the typography group exports one API); _What changes for a visitor_: nothing -
expected-HTML diff empty; class probe 7 pairs; `compare-computed` 72 page states; the one computed difference,
stated plainly: the dot of the booker's "Buchung" eyebrow gains `shrink-0` from the component (`flex-shrink` 1 -> 0);
the eyebrow is stretched to the aside's content width (at least 222px) while its content is 88px, so the dot never
shrinks, and its used width and height are compared unchanged; _Deviations from the plan_; _How to check_: `/`, `/faecher`, `/ablauf`, `/preise`,
`/kontakt`, `/termin` (booker aside and the form after picking a slot), the footer, the skip link (Tab on any page);
390 and 1280 px, light and dark - every eyebrow, the card and step titles, the "Quelle" line on `/preise` and the
consent box of the paid booking look as before.

---

### Task 4c: The /faecher heading outline (spec C4, the semantic fix)

**Branch:** `fix/faecher-outline` from `refactor/ui-typography`. **PR title:**
`fix(a11y): let the subject cards on /faecher follow the page heading`.

**Files:**

- Modify: `apps/marketing/src/components/sections/subject-cards.tsx`, `apps/marketing/src/app/faecher/page.tsx`
- Modify: `apps/marketing/e2e/a11y.spec.ts`

**Interfaces:**

- Consumes: `Heading` of Task 4b.
- Produces: `SubjectCards({ headingAs?: "h2" | "h3" })`, default `h3`.

**Background (measured on the tree after Task 4b).** The outline of every indexable route, read from the rendered
headings: only `/faecher` skips a level - the page's `h1` is followed directly by the three `h3` subject card titles
(`SubjectCards`, also on `/` under a section `h2`, where `h3` is right). The spec puts the fix into C4 ("visual size
unchanged"). The level change is screen-reader behaviour, which E-09 treats as a bug, and `CLAUDE.md` wants every
bug in its own `fix:` PR - so it is this separate, small PR, and C4's refactor PRs stay free of DOM changes.
Preflight gives `h2` and `h3` the same computed styles, so nothing moves. A dry run gave: the new test red on
`/faecher` only, green after; HTML diff exactly the three card titles `<h3` -> `<h2` on `/faecher`; computed styles
equal with heading levels ignored.

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the six toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

- [ ] **Step 2: Write the failing test.** In `apps/marketing/e2e/a11y.spec.ts`, after
      `import { isolate, stubAvailability } from "./helpers";` add
      `import { indexablePaths } from "../src/lib/routes";`, and append:

```ts
for (const path of indexablePaths) {
  test(`the heading outline of ${path} never skips a level`, async ({
    page,
  }) => {
    await page.goto(path);
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((headings) =>
        headings.map((heading) => Number(heading.tagName.slice(1))),
      );
    expect(levels[0], "the first heading is the h1").toBe(1);
    levels.forEach((level, i) => {
      if (i > 0)
        expect(
          level,
          `heading ${i + 1} of ${levels.length}`,
        ).toBeLessThanOrEqual(levels[i - 1]! + 1);
    });
  });
}
```

- [ ] **Step 3: Run it to see it fail.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm format && just build
cd "$WORKTREE/apps/marketing" && pnpm exec playwright test e2e/a11y.spec.ts -g "outline"
```

Expected: `1 failed`, `10 passed` - `/faecher` with `heading 2 of 21 ... Expected: <= 2 Received: 3`.

- [ ] **Step 4: The fix.** Replace `apps/marketing/src/components/sections/subject-cards.tsx` with:

```tsx
import Link from "next/link";

import { Reveal } from "@skillsite/ui/motion/reveal";
import { Tag } from "@skillsite/ui/primitives/tag";
import { Heading } from "@skillsite/ui/typography/heading";
import { subjects } from "@/content/subjects";
import { ArrowRight } from "lucide-react";

type HeadingLevel = "h2" | "h3";

/**
 * Three subject teaser cards. `headingAs` is the level of the card titles: h3
 * under a section heading (home), h2 where they follow the page's h1 directly
 * (/faecher). The look does not change with the level.
 */
export function SubjectCards({
  headingAs = "h3",
}: {
  headingAs?: HeadingLevel;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject, i) => (
        <Reveal key={subject.key} variant="rise-soft" index={i}>
          <SubjectCard subject={subject} headingAs={headingAs} />
        </Reveal>
      ))}
    </div>
  );
}

function SubjectCard({
  subject,
  headingAs,
}: {
  subject: (typeof subjects)[number];
  headingAs: HeadingLevel;
}) {
  const Icon = subject.glyph;
  return (
    <Link
      href={subject.href}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card lift [--lift:-0.375rem] hover:border-coral"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-13 items-center justify-center rounded-xl bg-surface-2 font-heading text-icon-badge font-bold text-coral">
          <Icon className="size-6" />
        </span>
        {subject.tag ? <Tag>{subject.tag}</Tag> : null}
      </div>
      <Heading
        as={headingAs}
        size="card-title"
        wrap="normal"
        tone="default"
        className="mt-5"
      >
        {subject.name}
      </Heading>
      <p className="mt-2 flex-1 text-ink-soft">{subject.claim}</p>
      <span className="mt-4 text-card-link font-semibold text-ink flex flex-row items-center gap-1">
        Mehr erfahren <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
```

In `apps/marketing/src/app/faecher/page.tsx`, `<SubjectCards />` becomes `<SubjectCards headingAs="h2" />`.

- [ ] **Step 5: Run it to see it pass.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm format && just static-checks && just build
cd "$WORKTREE/apps/marketing" && pnpm exec playwright test e2e/a11y.spec.ts
```

Expected: `19 passed`.

- [ ] **Step 6: Prove the visible result unchanged.**

```bash
source <scratch>/toolkit.sh
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
diff -r "$SCRATCH/html-before" "$SCRATCH/html-after"
HEADING_LEVELS=ignore node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 '^/$|^/faecher$' | tail -2
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 '^/faecher$' > "$SCRATCH/levels.txt"; echo "exit $?"; grep -m1 " vs " "$SCRATCH/levels.txt"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: the `diff` shows exactly three changed lines, all in `faecher.txt`:
`<h3 class="font-heading text-card-title font-bold text-ink mt-5">` -> `<h2 class="...same...">`; the first
`compare-computed` prints `8 page states, 2568 elements, 1488 forced pseudo-states compared.` and
`No differences.`; the second (without `HEADING_LEVELS`) prints `exit 1` and a line like
`/faecher @390 light: element 59 is html>…>a:0>h3:1 vs html>…>a:0>h2:1` - the flag hides the tag, and only the
tag.

- [ ] **Step 7: Commit.** `just check`, commit `fix(a11y): let the subject cards on /faecher follow the page
heading`.

PR body: Summary (the outline skipped from `h1` to three `h3`s on `/faecher`; `SubjectCards` takes a heading level;
the test pins the outline of every indexable route); _What changes for a visitor_: nothing visible, so no before/after
screenshots (the spec asks for them for visible fixes; here the computed styles of `/` and `/faecher` are compared
equal). The change is in the accessibility tree: screen readers list "Mathematik", "Informatik", "Physik" as
level-2 headings on `/faecher` (were level 3). Evidence: the heading levels of `/faecher` in document order were
`1 3 3 3 2 3 3 3 3 2 3 3 2 3 3 2 3 3 3 3 2` and are `1 2 2 2 2 3 3 3 3 2 3 3 2 3 3 2 3 3 3 3 2`; the new e2e test
is red before and green after; the home page keeps `h3`; _Deviations from the plan_; _How to check_: `/faecher` at 390 and 1280 px, light and dark - the three cards
look as before; with VoiceOver's rotor (headings) the cards are level 2; `/` unchanged.

---

### Task 5a: Container, Section and the page header in the package (spec C5, part 1)

**Branch:** `refactor/ui-layout` from `fix/faecher-outline`. **PR title:**
`refactor(ui): move container, section and page header into the package`.

**Files:**

- Create: `packages/ui/src/layout/{container,section,page-header}.tsx`, `packages/ui/src/layout/layout.test.tsx`
- Delete: `packages/ui/src/layout/section-header.tsx`,
  `apps/marketing/src/components/layout/{container,section,page-header}.tsx`
- Modify: `packages/ui/package.json` (`exports`), `apps/marketing/src/components/sections/faq-section.tsx`,
  `components/sections/testimonials.tsx`
- Modify: 17 files under `apps/marketing/src` (imports; `SectionHeader` -> `PageHeader variant="section"`)

**Interfaces:**

- Consumes: Task 4b's typography.
- Produces:
  - `Container({ size?: "page" | "faq" | "testimonials" })` in `@skillsite/ui/layout/container` - `page`
    (default): `mx-auto w-full max-w-page px-6`; `faq`: `mx-auto max-w-205 px-6`; `testimonials`:
    `mx-auto max-w-220 px-6`.
  - `Section({ surface?, bleed?, spacing?: "default" | "sm", containerClassName?, ...section props })` in
    `@skillsite/ui/layout/section`.
  - `PageHeader({ eyebrow?, title, lead?, align?, variant?: "page" | "section", size?, className?, titleClassName?,
leadClassName?, children? })` in `@skillsite/ui/layout/page-header` - `page`: the `h1` intro in a Container,
    revealed on mount; `section`: the former `SectionHeader` (`h2`, revealed in view). `SectionHeader` and
    `@skillsite/ui/layout/section-header` no longer exist.

**Background (measured on the tree after Task 4c).** `Container` (17 importers), `Section` (7) and `PageHeader` (6)
live in `apps/marketing/src/components/layout`; `SectionHeader` (6 uses in `page.tsx`, `online-lernen`, `ablauf`)
is in the package. The two headers differ in wrapper (Container with `pt-page-top pb-page-header-bottom` vs `div`
with `className`), element (`h1` vs `h2`), reveal trigger (mount vs in view), lead gap (`mt-5` vs `mt-4`) and
centring of the title (`mx-auto` only on the page) - the `variant` carries exactly these, so both render as before
(the spec's "spacings and stagger as props" are the two variants; no free spacing props). Two hand-built
page columns have the Container pattern - `mx-auto max-w-<n> px-6` on a plain `div`: the FAQ column (`max-w-205`,
inside `FaqSection`'s `<section>`) and the testimonials column (`max-w-220`, `testimonials.tsx`; the component is
not rendered today - its section on `/` is commented out). `size="faq"` and `size="testimonials"` keep their class
strings exactly (no `w-full`), so the DOM does not change. `/preise`'s `mx-auto max-w-230` has no gutter and sits
inside a Container, and the `/ueber-mich` quote card puts `max-w-220` on a card - neither is a page container (open
point 13). The ten
`<Container className="py-section-sm">` blocks are not wrapped in `<section>`; `Section spacing="sm"` exists for new
code, but converting them would add an element (D5). A dry run of this task gave: HTML of the 14 URLs and the
built CSS byte-identical; `compare-computed` no differences; `just check` green.

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the six toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

- [ ] **Step 2: Write the failing test.** Create `packages/ui/src/layout/layout.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Container } from "./container";
import { PageHeader } from "./page-header";
import { Section } from "./section";

// Reveal's in-view path observes its element; jsdom has no IntersectionObserver.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("Container has the page width by default and named narrower sizes", () => {
  render(
    <>
      <Container>Seite</Container>
      <Container size="faq">FAQ</Container>
      <Container size="testimonials">Stimmen</Container>
    </>,
  );
  expect(screen.getByText("Seite").className).toBe(
    "mx-auto w-full max-w-page px-6",
  );
  expect(screen.getByText("FAQ").className).toBe("mx-auto max-w-205 px-6");
  expect(screen.getByText("Stimmen").className).toBe("mx-auto max-w-220 px-6");
});

test("Section wraps its content in a Container with the section rhythm", () => {
  render(
    <>
      <Section id="faq" surface>
        Inhalt
      </Section>
      <Section spacing="sm">Kompakt</Section>
    </>,
  );
  const content = screen.getByText("Inhalt");
  expect(content.className).toBe("mx-auto w-full max-w-page px-6 py-section");
  expect(content.parentElement?.tagName).toBe("SECTION");
  expect(content.parentElement?.className).toBe(
    "border-y border-line bg-surface",
  );
  expect(screen.getByText("Kompakt").className).toBe(
    "mx-auto w-full max-w-page px-6 py-section-sm",
  );
});

test("the page variant is the route's h1 intro inside a Container", () => {
  render(<PageHeader eyebrow="Fächer" title="Titel" lead="Einleitung" />);
  const heading = screen.getByRole("heading", { level: 1, name: "Titel" });
  const container = heading.parentElement!.parentElement!;
  expect(container.className).toBe(
    "mx-auto w-full max-w-page px-6 pt-page-top pb-page-header-bottom",
  );
  expect(screen.getByText("Einleitung").parentElement?.className).toContain(
    "mt-5",
  );
});

test("the section variant is an h2 intro, revealed in view", () => {
  render(
    <PageHeader
      variant="section"
      eyebrow="Ablauf"
      title="So läuft es"
      lead="Kurz erklärt"
      size="h3"
      className="mb-6"
    />,
  );
  const heading = screen.getByRole("heading", {
    level: 2,
    name: "So läuft es",
  });
  expect(heading.className).toContain("text-h3");
  const wrapper = heading.parentElement!.parentElement!;
  expect(wrapper.tagName).toBe("DIV");
  expect(wrapper.className).toBe("mb-6");
  expect(heading.parentElement?.className).toContain("reveal");
  expect(screen.getByText("Kurz erklärt").parentElement?.className).toContain(
    "mt-4",
  );
});
```

Run `source <scratch>/toolkit.sh; cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/layout`.
Expected: FAIL - `Failed to resolve import "./page-header"`.

- [ ] **Step 3: The layout modules.** Create `packages/ui/src/layout/container.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const containerVariants = cva("mx-auto", {
  variants: {
    size: {
      /** The site width (1280px). */
      page: "w-full max-w-page px-6",
      /** The FAQ column (820px). */
      faq: "max-w-205 px-6",
      /** The testimonials column (880px). */
      testimonials: "max-w-220 px-6",
    },
  },
  defaultVariants: { size: "page" },
});

type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants>;

/** Centred page column with the side gutter. */
export function Container({ size, className, ...props }: ContainerProps) {
  return (
    <div className={cn(containerVariants({ size }), className)} {...props} />
  );
}
```

`packages/ui/src/layout/section.tsx`:

```tsx
import { cn } from "../utils/cn";
import { Container } from "./container";

type SectionProps = React.ComponentProps<"section"> & {
  /** Full-bleed surface background with top/bottom hairlines. */
  surface?: boolean;
  /** Skip the inner Container (caller controls width). */
  bleed?: boolean;
  /** Vertical rhythm of the inner Container: `default` = py-section, `sm` = py-section-sm. */
  spacing?: "default" | "sm";
  containerClassName?: string;
};

/**
 * Page section. Wraps content in a centered Container with vertical rhythm.
 * Use `surface` for the alternating cream/white bands from the design.
 */
export function Section({
  surface,
  bleed,
  spacing = "default",
  id,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(surface && "border-y border-line bg-surface", className)}
      {...props}
    >
      {bleed ? (
        children
      ) : (
        <Container
          className={cn(
            spacing === "sm" ? "py-section-sm" : "py-section",
            containerClassName,
          )}
        >
          {children}
        </Container>
      )}
    </section>
  );
}
```

`packages/ui/src/layout/page-header.tsx`:

```tsx
import { Reveal } from "../motion/reveal";
import { Eyebrow } from "../typography/eyebrow";
import { Heading, type HeadingSize } from "../typography/heading";
import { Lead } from "../typography/lead";
import { cn } from "../utils/cn";
import { Container } from "./container";

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  /**
   * `page`: the route's h1 intro, in a Container with the page-top spacing,
   * revealed on mount (above the fold). `section`: an h2 intro inside a
   * section, revealed when it scrolls into view, with tighter spacing.
   */
  variant?: "page" | "section";
  /** Type-scale size of the title; `h1` for a page, `h2` for a section by default. */
  size?: Extract<HeadingSize, "display" | "h1" | "h2" | "h3">;
  /** Wrapper classes (section variant). */
  className?: string;
  titleClassName?: string;
  leadClassName?: string;
  /** Buttons / actions rendered below the lead. */
  children?: React.ReactNode;
};

/** Eyebrow + heading (+ lead, + actions): the intro of a page or a section. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  variant = "page",
  size = variant === "page" ? "h1" : "h2",
  className,
  titleClassName,
  leadClassName,
  children,
}: PageHeaderProps) {
  const page = variant === "page";
  const centered = align === "center";
  const trigger = page ? "mount" : "in-view";
  // Sequential stagger index across whichever elements are present.
  let step = 0;

  const content = (
    <>
      {eyebrow ? (
        <Reveal
          trigger={trigger}
          variant="rise-soft"
          index={step++}
          className={cn(centered && "flex justify-center")}
        >
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal
        trigger={trigger}
        variant="rise-soft"
        index={step++}
        className={cn(eyebrow && "mt-4")}
      >
        <Heading
          as={page ? "h1" : "h2"}
          size={size}
          className={cn(page && centered && "mx-auto", titleClassName)}
        >
          {title}
        </Heading>
      </Reveal>
      {lead ? (
        <Reveal
          trigger={trigger}
          variant="rise-soft"
          index={step++}
          className={page ? "mt-5" : "mt-4"}
        >
          <Lead
            className={cn(
              "max-w-measure-34",
              centered && "mx-auto",
              leadClassName,
            )}
          >
            {lead}
          </Lead>
        </Reveal>
      ) : null}
      {children ? (
        <Reveal
          trigger={trigger}
          variant="rise-soft"
          index={step++}
          className={cn(
            "mt-7 flex flex-wrap gap-3.5",
            centered && "justify-center",
          )}
        >
          {children}
        </Reveal>
      ) : null}
    </>
  );

  return page ? (
    <Container
      className={cn(
        "pt-page-top pb-page-header-bottom",
        centered && "text-center",
      )}
    >
      {content}
    </Container>
  ) : (
    <div className={cn(centered && "text-center", className)}>{content}</div>
  );
}
```

Then remove the old section header and export the new modules:

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && git rm -q packages/ui/src/layout/section-header.tsx
cd "$WORKTREE" && node -e '
const fs = require("fs"); const p = "packages/ui/package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8")); const e = {};
for (const [k, v] of Object.entries(j.exports)) {
  if (k !== "./layout/section-header") { e[k] = v; continue; }
  e["./layout/container"] = "./src/layout/container.tsx";
  e["./layout/page-header"] = "./src/layout/page-header.tsx";
  e["./layout/section"] = "./src/layout/section.tsx";
}
j.exports = e; fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");'
cd "$WORKTREE" && pnpm format && pnpm --filter @skillsite/ui exec vitest run
```

Expected: PASS, 10 files / 64 tests.

- [ ] **Step 4: The app onto them.** Save as `<scratch>/c5a-layout.mjs` and run it:

```js
// C5a codemod: the app imports Container, Section and PageHeader from the package;
// SectionHeader becomes PageHeader variant="section"; the FAQ and testimonials
// columns become Containers of their size (same classes, same DOM).
// Usage (repo root): node <scratch>/c5a-layout.mjs
import { globSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const MOVED = {
  "@/components/layout/container": "@skillsite/ui/layout/container",
  "@/components/layout/section": "@skillsite/ui/layout/section",
  "@/components/layout/page-header": "@skillsite/ui/layout/page-header",
};
const SECTION_HEADER =
  'import { SectionHeader } from "@skillsite/ui/layout/section-header";\n';
const PAGE_HEADER =
  'import { PageHeader } from "@skillsite/ui/layout/page-header";\n';

let files = 0;
let sectionHeaders = 0;
for (const file of globSync("apps/marketing/src/**/*.tsx")) {
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [from, to] of Object.entries(MOVED))
    after = after.split(`from "${from}";`).join(`from "${to}";`);
  if (after.includes(SECTION_HEADER)) {
    after = after.replace(
      SECTION_HEADER,
      after.includes(PAGE_HEADER) ? "" : PAGE_HEADER,
    );
    sectionHeaders += after.split("<SectionHeader").length - 1;
    after = after.split("<SectionHeader").join('<PageHeader variant="section"');
  }
  if (after !== before) {
    writeFileSync(file, after);
    files++;
  }
}

const faq = "apps/marketing/src/components/sections/faq-section.tsx";
const faqSource = readFileSync(faq, "utf8");
const faqNext = faqSource
  .replace(
    'import { Reveal } from "@skillsite/ui/motion/reveal";\n',
    'import { Container } from "@skillsite/ui/layout/container";\nimport { Reveal } from "@skillsite/ui/motion/reveal";\n',
  )
  .replace(
    '<div className="mx-auto max-w-205 px-6 py-section">',
    '<Container size="faq" className="py-section">',
  )
  .replace(
    "      </div>\n    </section>",
    "      </Container>\n    </section>",
  );
if (faqNext.split("Container").length !== 4) {
  console.error(`${faq}: expected markers not found`);
  process.exit(1);
}
writeFileSync(faq, faqNext);

// The testimonials column: the same pattern, one element deeper nesting.
const quotes = "apps/marketing/src/components/sections/testimonials.tsx";
const open = '<div className="mx-auto max-w-220 px-6 py-section text-center">';
let quotesSource = readFileSync(quotes, "utf8");
const start = quotesSource.indexOf(open);
if (start < 0 || quotesSource.indexOf(open, start + 1) >= 0) {
  console.error(`${quotes}: expected the column exactly once`);
  process.exit(1);
}
// Its closing </div>: found by depth.
const tags = /<div\b[^>]*?(\/)?>|<\/div>/g;
tags.lastIndex = start + open.length;
for (let depth = 1, match; (match = tags.exec(quotesSource));) {
  if (match[0] === "</div>") depth--;
  else if (!match[1]) depth++;
  if (depth === 0) {
    quotesSource =
      quotesSource.slice(0, start) +
      '<Container size="testimonials" className="py-section text-center">' +
      quotesSource.slice(start + open.length, match.index) +
      "</Container>" +
      quotesSource.slice(match.index + "</div>".length);
    break;
  }
}
quotesSource = quotesSource.replace(
  'import { Eyebrow } from "@skillsite/ui/typography/eyebrow";\n',
  'import { Container } from "@skillsite/ui/layout/container";\nimport { Eyebrow } from "@skillsite/ui/typography/eyebrow";\n',
);
if (quotesSource.split("Container").length !== 4) {
  console.error(`${quotes}: expected markers not found`);
  process.exit(1);
}
writeFileSync(quotes, quotesSource);

for (const moved of ["container", "section", "page-header"])
  rmSync(`apps/marketing/src/components/layout/${moved}.tsx`);
console.log(
  `${files} files rewritten, ${sectionHeaders} SectionHeader -> PageHeader variant="section", FAQ and testimonials on Container`,
);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/c5a-layout.mjs" && pnpm format && just static-checks
grep -rn 'components/layout/\(container\|section\|page-header\)\|SectionHeader' "$WORKTREE/apps/marketing/src" "$WORKTREE/packages/ui/src"
```

Expected: `17 files rewritten, 6 SectionHeader -> PageHeader variant="section", FAQ and testimonials on Container`;
static checks green; the `grep` prints nothing.

- [ ] **Step 5: Prove the result identical** (the `compare-computed` line needs a 600000 ms timeout or a
      background run).

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
diff -r "$SCRATCH/html-before" "$SCRATCH/html-after" && echo IDENTICAL
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -2 "$SCRATCH/computed.txt"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `IDENTICAL` (HTML of the 14 URLs and the built CSS); `72 page states, 20374 elements, 14768 forced
pseudo-states compared.` and `No differences.`

- [ ] **Step 6: Commit.** `just check`, commit `refactor(ui): move container, section and page header into the
package`.

PR body: Summary (Container with named sizes, Section with a spacing variant, one PageHeader with a `page` and a
`section` variant replacing `SectionHeader`; 17 app files, the FAQ and testimonials columns on `Container size="faq"`/`"testimonials"`); _What
changes for a visitor_: nothing - HTML and CSS byte-identical, `compare-computed` 72 page states; _Deviations from
the spec_: the spec asks for one PageHeader with "spacings and stagger as props" - it has two fixed variants
(`page`, `section`) that carry the two measured sets instead, so no free spacing values can creep in; _Deviations
from the plan_; _How to check_: `/`, `/faecher`, `/ablauf`, `/online-lernen` (page and section intros, FAQ column),
`/preise`; 390 and 1280 px, light and dark.

---

### Task 5b: Split and CardGrid (spec C5, part 2)

**Branch:** `refactor/ui-grids` from `refactor/ui-layout`. **PR title:**
`refactor(ui): add the Split and CardGrid layouts`.

**Files:**

- Create: `packages/ui/src/layout/{split,card-grid}.tsx`, `packages/ui/src/layout/grids.test.tsx`
- Modify: `packages/ui/package.json` (`exports`)
- Modify: `apps/marketing/src/app/{page,kontakt/page,online-lernen/page,faecher/page,ablauf/page,ueber-mich/page,preise/page}.tsx`,
  `components/sections/{subject-cards,benefit-grid,step-grid}.tsx`

**Interfaces:**

- Consumes: Task 5a's layout group.
- Produces: `Split({ align?: "center" | "start" | "stretch", gap?: "split" | "split-hero" | "split-about" | "5",
ratio?: "1/1" | "1.15/0.85" | "1.05/0.95" | "0.9/1.1" | "1.25/1" })` (defaults center / split / 1/1) and
  `CardGrid({ gap?: "5" | "4", columns?: "sm-3" | "sm-2" | "sm-2-lg-3" | "md-2" })` (defaults 5 / sm-3), in
  `@skillsite/ui/layout/split` and `@skillsite/ui/layout/card-grid`. Both render a `div` with
  `grid` + the variants in that order + `className`.

**Background (measured on the tree after Task 5a).** Seven page-level two-column grids (`page.tsx` hero,
`kontakt`, `online-lernen`, `faecher`, `ablauf`, `ueber-mich` 2x) use 5 column ratios, 4 gaps and 3 alignments;
nine card grids use 4 column patterns and 2 gaps (`preise` 2, `online-lernen` 2, `faecher` 1, `ueber-mich` 1,
`subject-cards`, `benefit-grid`, `step-grid`). The variants are the measured values 1:1, named by value; every
class already exists, so the built CSS does not change. Not converted (they are not page layouts or card grids):
the booker's container-query grids, the footer columns, the booking form's field rows and radio group, the
`/online-lernen` card stack (`grid gap-5`, no columns), the pricing card's inner `md:grid-cols-2`. A dry run gave:
HTML and CSS byte-identical; `compare-computed` no differences.

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the six toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

- [ ] **Step 2: Write the failing test.** Create `packages/ui/src/layout/grids.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { CardGrid } from "./card-grid";
import { Split } from "./split";

afterEach(cleanup);

test("Split is a two-column grid: align, gap, then the column ratio", () => {
  render(
    <>
      <Split>Standard</Split>
      <Split align="stretch" gap="5" ratio="1.25/1">
        Kontakt
      </Split>
    </>,
  );
  expect(screen.getByText("Standard").className).toBe(
    "grid items-center gap-split lg:grid-cols-2",
  );
  expect(screen.getByText("Kontakt").className).toBe(
    "grid items-stretch gap-5 lg:grid-cols-[1.25fr_1fr]",
  );
});

test("CardGrid is a card grid: gap, then the columns per breakpoint", () => {
  render(
    <>
      <CardGrid>Drei</CardGrid>
      <CardGrid gap="4" columns="sm-2">
        Zwei
      </CardGrid>
      <CardGrid columns="sm-2-lg-3" className="gap-6">
        Mehr
      </CardGrid>
    </>,
  );
  expect(screen.getByText("Drei").className).toBe("grid gap-5 sm:grid-cols-3");
  expect(screen.getByText("Zwei").className).toBe("grid gap-4 sm:grid-cols-2");
  expect(screen.getByText("Mehr").className).toBe(
    "grid sm:grid-cols-2 lg:grid-cols-3 gap-6",
  );
});
```

Run `source <scratch>/toolkit.sh; cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/layout`.
Expected: FAIL - `Failed to resolve import "./card-grid"`.

- [ ] **Step 3: The components.** Create `packages/ui/src/layout/split.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const splitVariants = cva("grid", {
  variants: {
    align: {
      center: "items-center",
      start: "items-start",
      stretch: "items-stretch",
    },
    gap: {
      split: "gap-split",
      "split-hero": "gap-split-hero",
      "split-about": "gap-split-about",
      "5": "gap-5",
    },
    /** Column widths from `lg` on; one column below. */
    ratio: {
      "1/1": "lg:grid-cols-2",
      "1.15/0.85": "lg:grid-cols-[1.15fr_0.85fr]",
      "1.05/0.95": "lg:grid-cols-[1.05fr_0.95fr]",
      "0.9/1.1": "lg:grid-cols-[0.9fr_1.1fr]",
      "1.25/1": "lg:grid-cols-[1.25fr_1fr]",
    },
  },
  defaultVariants: { align: "center", gap: "split", ratio: "1/1" },
});

type SplitProps = React.ComponentProps<"div"> &
  VariantProps<typeof splitVariants>;

/** Two-column page layout (text beside media or a panel), stacked below `lg`. */
export function Split({ align, gap, ratio, className, ...props }: SplitProps) {
  return (
    <div
      className={cn(splitVariants({ align, gap, ratio }), className)}
      {...props}
    />
  );
}
```

and `packages/ui/src/layout/card-grid.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const cardGridVariants = cva("grid", {
  variants: {
    gap: {
      "5": "gap-5",
      "4": "gap-4",
    },
    /** Columns per breakpoint; one column below the first. */
    columns: {
      "sm-3": "sm:grid-cols-3",
      "sm-2": "sm:grid-cols-2",
      "sm-2-lg-3": "sm:grid-cols-2 lg:grid-cols-3",
      "md-2": "md:grid-cols-2",
    },
  },
  defaultVariants: { gap: "5", columns: "sm-3" },
});

type CardGridProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardGridVariants>;

/** Grid of equal cards. */
export function CardGrid({ gap, columns, className, ...props }: CardGridProps) {
  return (
    <div
      className={cn(cardGridVariants({ gap, columns }), className)}
      {...props}
    />
  );
}
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node -e '
const fs = require("fs"); const p = "packages/ui/package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8")); const e = {};
for (const [k, v] of Object.entries(j.exports)) {
  e[k] = v;
  if (k === "./layout/container") e["./layout/card-grid"] = "./src/layout/card-grid.tsx";
  if (k === "./layout/section") e["./layout/split"] = "./src/layout/split.tsx";
}
j.exports = e; fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");'
cd "$WORKTREE" && pnpm format && pnpm --filter @skillsite/ui exec vitest run
```

Expected: PASS, 11 files / 66 tests.

- [ ] **Step 4: The grids onto them.** Save as `<scratch>/c5b-grids.mjs` and run it:

```js
// C5b codemod: the page-level two-column grids become Split, the card grids CardGrid.
// Each entry: [file, the exact opening tag, the new opening tag]. The matching
// closing </div> is found by depth; every opening tag must occur exactly once.
// Usage (repo root): node <scratch>/c5b-grids.mjs
import { readFileSync, writeFileSync } from "node:fs";

const A = "apps/marketing/src/";
// prettier-ignore
const ELEMENTS = [
  [A + "app/page.tsx", '<div className="grid items-center gap-split-hero lg:grid-cols-[1.15fr_0.85fr]">', '<Split gap="split-hero" ratio="1.15/0.85">'],
  [A + "app/kontakt/page.tsx", '<div className="grid items-stretch gap-5 lg:grid-cols-[1.25fr_1fr]">', '<Split align="stretch" gap="5" ratio="1.25/1">'],
  [A + "app/online-lernen/page.tsx", '<div className="grid items-start gap-split lg:grid-cols-[0.9fr_1.1fr]">', '<Split align="start" ratio="0.9/1.1">'],
  [A + "app/faecher/page.tsx", '<div className="grid items-start gap-split lg:grid-cols-[0.9fr_1.1fr]">', '<Split align="start" ratio="0.9/1.1">'],
  [A + "app/ablauf/page.tsx", '<div className="grid items-center gap-split lg:grid-cols-2">', "<Split>"],
  [A + "app/ueber-mich/page.tsx", '<div className="grid items-center gap-split-about lg:grid-cols-2">', '<Split gap="split-about">'],
  [A + "app/ueber-mich/page.tsx", '<div className="grid items-center gap-split lg:grid-cols-[1.05fr_0.95fr]">', '<Split ratio="1.05/0.95">'],
  [A + "app/preise/page.tsx", '<div className="grid gap-5 md:grid-cols-2">', '<CardGrid columns="md-2">'],
  [A + "app/preise/page.tsx", '<div className="grid gap-5 sm:grid-cols-3">', "<CardGrid>"],
  [A + "app/online-lernen/page.tsx", '<div className="grid gap-5 sm:grid-cols-3">', "<CardGrid>"],
  [A + "app/online-lernen/page.tsx", '<div className="grid gap-5 md:grid-cols-2">', '<CardGrid columns="md-2">'],
  [A + "app/faecher/page.tsx", '<div className="grid gap-4 sm:grid-cols-2">', '<CardGrid gap="4" columns="sm-2">'],
  [A + "app/ueber-mich/page.tsx", '<div className="grid gap-5 sm:grid-cols-3">', "<CardGrid>"],
  [A + "components/sections/subject-cards.tsx", '<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">', '<CardGrid columns="sm-2-lg-3">'],
  [A + "components/sections/benefit-grid.tsx", '<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">', '<CardGrid columns="sm-2-lg-3">'],
  [A + "components/sections/step-grid.tsx", '<div className={cn("grid gap-5 sm:grid-cols-3", className)}>', "<CardGrid className={className}>"],
];
const IMPORTS = {
  Split: 'import { Split } from "@skillsite/ui/layout/split";\n',
  CardGrid: 'import { CardGrid } from "@skillsite/ui/layout/card-grid";\n',
};

/** Replace one element's opening tag and its matching </div>. */
function replaceElement(source, open, newOpen, name, file) {
  const start = source.indexOf(open);
  if (start < 0 || source.indexOf(open, start + 1) >= 0)
    throw new Error(`${file}: opening tag not found exactly once: ${open}`);
  const tags = /<div\b[^>]*?(\/)?>|<\/div>/g;
  tags.lastIndex = start + open.length;
  let depth = 1;
  for (let match; (match = tags.exec(source));) {
    if (match[0] === "</div>") depth--;
    else if (!match[1]) depth++;
    if (depth === 0)
      return (
        source.slice(0, start) +
        newOpen +
        source.slice(start + open.length, match.index) +
        `</${name}>` +
        source.slice(match.index + "</div>".length)
      );
  }
  throw new Error(`${file}: no closing tag for ${open}`);
}

const files = new Map();
for (const [file, open, newOpen] of ELEMENTS) {
  const name = newOpen.startsWith("<Split") ? "Split" : "CardGrid";
  let source = files.get(file) ?? readFileSync(file, "utf8");
  source = replaceElement(source, open, newOpen, name, file);
  if (!source.includes(IMPORTS[name])) {
    // After the last @skillsite/ui import.
    const imports = [
      ...source.matchAll(/^import [^;]+ from "@skillsite\/ui\/[^"]+";\n/gm),
    ];
    const last = imports.at(-1);
    const at = last.index + last[0].length;
    source = source.slice(0, at) + IMPORTS[name] + source.slice(at);
  }
  files.set(file, source);
}
for (const [file, source] of files) writeFileSync(file, source);
console.log(`${ELEMENTS.length} grids in ${files.size} files`);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/c5b-grids.mjs" && pnpm format && just static-checks
```

Expected: `16 grids in 10 files`; green.

- [ ] **Step 5: Prove the result identical** (the `compare-computed` line needs a 600000 ms timeout or a
      background run).

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
diff -r "$SCRATCH/html-before" "$SCRATCH/html-after" && echo IDENTICAL
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -2 "$SCRATCH/computed.txt"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `IDENTICAL` (HTML of the 14 URLs and the built CSS); `72 page states, 20374 elements, 14768 forced
pseudo-states compared.` and `No differences.`

- [ ] **Step 6: Commit.** `just check`, commit `refactor(ui): add the Split and CardGrid layouts`.

PR body: Summary (Split and CardGrid with the measured variants; 7 splits and 9 card grids converted; what was
left out and why); _What changes for a visitor_: nothing - HTML and CSS byte-identical, `compare-computed` 72 page
states; _Deviations from the plan_; _How to check_: `/`, `/kontakt`, `/online-lernen`, `/faecher`, `/ablauf`,
`/ueber-mich`, `/preise` at 390, 1024 and 1280 px (the split switches at `lg`), light and dark.

---

### Task 5c: Theme, logo and fonts in the package (spec C5, part 3)

**Branch:** `refactor/ui-shell` from `refactor/ui-grids`. **PR title:**
`refactor(ui): move theme, logo and fonts into the package`.

**Files:**

- Create: `packages/ui/src/shell/fonts.ts`, `packages/ui/src/shell/shell.test.tsx`,
  `apps/marketing/src/app/layout-imports.test.ts` (the font import order)
- Move: `apps/marketing/src/components/theme-provider.tsx` -> `packages/ui/src/shell/theme-provider.tsx`,
  `apps/marketing/src/components/layout/theme-toggle.tsx` -> `packages/ui/src/shell/theme-toggle.tsx`,
  `apps/marketing/src/components/layout/logo.tsx` -> `packages/ui/src/shell/logo.tsx` (brand props)
- Delete: `apps/marketing/src/components/layout/social-links.tsx` (folded into `footer.tsx`)
- Modify: `packages/ui/package.json` (`exports`, `next-themes`), `apps/marketing/package.json`, `pnpm-lock.yaml`
- Modify: `packages/ui/.storybook/preview.tsx` (brand fonts)
- Modify: `apps/marketing/src/app/layout.tsx`, `components/layout/{navbar,footer}.tsx`
- Modify: `design-ratchet.json`, `docs/specs/foundation-refactor.md` (C5 boxes)

**Interfaces:**

- Consumes: Tasks 5a and 5b.
- Produces: `@skillsite/ui/shell/fonts` (`fontVariables`: the two next/font variable classes, for `<html>`),
  `@skillsite/ui/shell/theme-provider` (`ThemeProvider`), `@skillsite/ui/shell/theme-toggle` (`ThemeToggle`),
  `@skillsite/ui/shell/logo` (`Logo({ name, tagline, src, showText?, tone?, className?, textClassName? })`). The
  package depends on `next-themes`; the app no longer does. `apps/marketing/src/components/layout` holds
  `navbar.tsx`, `footer.tsx`, `ios-toolbar-tint.tsx` only.

**Background - the font spike (run while planning, on 943fb6e).** The spec asks first whether `next/font` can be
called from the workspace package with identical `@font-face` and class output. It can: with the two
`next/font/google` calls in `packages/ui/src/shell/fonts.ts` (the package is in `transpilePackages`), the build
emits the same `@font-face` rules and the same `.…__variable`/`.…__className` rules; the class names differ only in
their hash (`bricolage_grotesque_1b97ba4b-module__NjNj1a__variable` -> `bricolage_grotesque_<other hash>-…`). One
trap: imported after `./globals.css`, the font rules moved from the top to the end of the CSS chunk; imported
before it, the chunk is byte-identical apart from the hashes. Storybook (`@storybook/nextjs-vite`) runs the same
module and then renders Bricolage Grotesque and Hanken Grotesk (loaded from Google's font CDN in the workbench;
before: no brand font loaded, system fallback). **Decision: the "yes" branch - the package owns the fonts.** The
"no" branch (the app keeps `next/font`, the package owns only the variable contract) is not needed. `Logo` moves
with brand props because the package cannot import `@/content/site`; navbar and footer pass `brand.name`,
`brand.tagline`, `brand.logo`. `social-links.tsx` is footer-only markup; it moves into `footer.tsx`, so the
layout folder keeps only navbar, footer and the iOS tint (spec C5). A dry run of this task gave: HTML and CSS
identical apart from the hashed font class names (13 `<html class>` lines and 2 CSS lines, nothing else);
`compare-computed` no differences; `raw-button` 13 -> 12 (the toggle's buttons now count as package code);
the import-order test red, green, and red again when the import is moved below `globals.css`; `just check` green
(app 44 unit tests, 59 smoke tests).

- [ ] **Step 1: Toolkit and before tree.** Write `<scratch>/toolkit.sh` and the six toolkit scripts
      (_Verification toolkit_), build the _Before tree_, then:

```bash
source <scratch>/toolkit.sh
serve "$SCRATCH/before" 3110
node "$SCRATCH/snapshot-html.mjs" "$SCRATCH/before" http://localhost:3110 "$SCRATCH/html-before"
```

- [ ] **Step 2: Write the failing test.** Create `packages/ui/src/shell/shell.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Logo } from "./logo";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

// next-themes reads the system preference; jsdom has no matchMedia.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const brand = {
  name: "Nachhilfe Leon Weimann",
  tagline: "Verstehen statt auswendig lernen.",
  src: "/logo-icon.png",
};

test("Logo renders the brand it is given, in its tone", () => {
  render(<Logo {...brand} tone="inverse" />);
  expect(screen.getByRole("img", { name: brand.name })).toBeTruthy();
  expect(screen.getByText(brand.name).className).toContain("text-white");
  expect(screen.getByText(brand.tagline).className).toContain(
    "text-on-navy-soft",
  );
});

test("Logo without text is the mark only", () => {
  render(<Logo {...brand} showText={false} />);
  expect(screen.queryByText(brand.tagline)).toBeNull();
});

test("ThemeToggle offers the light and dark override inside the provider", () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  const group = screen.getByRole("group", { name: "Farbschema wählen" });
  expect(group.querySelectorAll("button")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Hell" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Dunkel" })).toBeTruthy();
});
```

Create `apps/marketing/src/app/layout-imports.test.ts` (it matches the app's `unit` project,
`src/**/*.test.{ts,mts}`) - the font import order is load-bearing, so a test holds it:

```ts
import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

const layout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

// next/font's @font-face rules follow the import order: imported after the global
// stylesheet they move to the end of the built CSS (the C5 font spike).
test("the brand fonts are imported before the global stylesheet", () => {
  const fonts = layout.indexOf('from "@skillsite/ui/shell/fonts";');
  const globals = layout.indexOf('import "./globals.css";');
  expect(fonts, "the fonts import").toBeGreaterThan(-1);
  expect(globals, "the globals.css import").toBeGreaterThan(-1);
  expect(fonts, "fonts before globals.css").toBeLessThan(globals);
});
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/ui exec vitest run src/shell
cd "$WORKTREE" && pnpm --filter @skillsite/marketing exec vitest run src/app/layout-imports.test.ts
```

Expected: both FAIL - `Failed to resolve import "./logo"`, and
`AssertionError: the fonts import: expected -1 to be greater than -1`.

- [ ] **Step 3: Move the shell parts, the dependency and the exports.**

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && mkdir -p packages/ui/src/shell
git mv apps/marketing/src/components/theme-provider.tsx packages/ui/src/shell/theme-provider.tsx
git mv apps/marketing/src/components/layout/theme-toggle.tsx packages/ui/src/shell/theme-toggle.tsx
git mv apps/marketing/src/components/layout/logo.tsx packages/ui/src/shell/logo.tsx
perl -CSD -pi -e 's#from "\@skillsite/ui/utils/cn"#from "../utils/cn"#; s#from "\@skillsite/ui/hooks/use-hydrated"#from "../hooks/use-hydrated"#' packages/ui/src/shell/theme-toggle.tsx
pnpm add --filter @skillsite/ui next-themes@^0.4.6
pnpm remove --filter @skillsite/marketing next-themes
pnpm install --frozen-lockfile
node -e '
const fs = require("fs"); const p = "packages/ui/package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8")); const e = {};
for (const [k, v] of Object.entries(j.exports)) {
  if (k === "./tokens/colors") {
    e["./shell/fonts"] = "./src/shell/fonts.ts";
    e["./shell/logo"] = "./src/shell/logo.tsx";
    e["./shell/theme-provider"] = "./src/shell/theme-provider.tsx";
    e["./shell/theme-toggle"] = "./src/shell/theme-toggle.tsx";
  }
  e[k] = v;
}
j.exports = e; fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");'
```

Expected: `next-themes` moves from `apps/marketing/package.json` to the `dependencies` of `packages/ui/package.json`
(the lockfile changes only the importer of the same `next-themes@0.4.6` entry).

- [ ] **Step 4: Logo with brand props and the fonts module.** Replace `packages/ui/src/shell/logo.tsx` with:

```tsx
import Image from "next/image";

import { cn } from "../utils/cn";

type LogoProps = {
  /** Brand name: the image's alt text and the first text line. */
  name: string;
  /** Second text line. */
  tagline: string;
  /** Logo image (a path under the app's `public/`). */
  src: string;
  showText?: boolean;
  /** `inverse` on navy surfaces (footer). */
  tone?: "default" | "inverse";
  className?: string;
  textClassName?: string;
};

/** Logo mark plus name and tagline; the app passes its brand. */
export function Logo({
  name,
  tagline,
  src,
  showText = true,
  tone = "default",
  className,
  textClassName,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Image
        src={src}
        alt={name}
        width={42}
        height={41}
        priority
        className="rounded-xl shadow-logo"
      />
      {showText ? (
        <span className={cn("flex flex-col leading-[1.08]", textClassName)}>
          <span
            className={cn(
              "font-heading text-logo font-bold tracking-[-0.01em]",
              tone === "inverse" ? "text-white" : "text-ink",
            )}
          >
            {name}
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-logo-tagline tracking-[0.03em]",
              tone === "inverse" ? "text-on-navy-soft" : "text-ink-soft",
            )}
          >
            {tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}
```

Create `packages/ui/src/shell/fonts.ts` (the same two calls as `apps/marketing/src/app/layout.tsx` today):

```ts
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

/*
 * The brand fonts. next/font/google downloads them at build time and emits the
 * @font-face rules. The classes set the variables the theme reads
 * (`--font-bricolage`, `--font-hanken`; styles/tokens.css): put `fontVariables`
 * on <html>. An app imports this module before its global stylesheet, so the
 * @font-face rules keep their place at the top of the built CSS.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

/** Class names that define the font variables, for <html>. */
export const fontVariables = `${bricolage.variable} ${hanken.variable}`;
```

Run `source <scratch>/toolkit.sh; cd "$WORKTREE" && pnpm format && pnpm --filter @skillsite/ui exec vitest run`.
Expected: PASS, 12 files / 69 tests (the fonts module has no unit test - next/font only runs in the Next and
Storybook builds; Step 7 proves it).

- [ ] **Step 5: The app onto the package shell.** Save as `<scratch>/c5c-shell.mjs` and run it:

```js
// C5c codemod: the app takes ThemeProvider, ThemeToggle, Logo and the fonts from the
// package; the footer's social links move into footer.tsx. Every `from` must occur
// exactly as often as its count, or nothing is written.
// Usage (repo root, after the git mv of Step 4): node <scratch>/c5c-shell.mjs
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const A = "apps/marketing/src/";
const LAYOUT = A + "app/layout.tsx";
const NAVBAR = A + "components/layout/navbar.tsx";
const FOOTER = A + "components/layout/footer.tsx";
const SOCIAL = A + "components/layout/social-links.tsx";
const LOGO_PROPS = "name={brand.name} tagline={brand.tagline} src={brand.logo}";

const social = readFileSync(SOCIAL, "utf8");
const socialBody = social.slice(social.indexOf("type IconType"));

// prettier-ignore
const REPLACEMENTS = [
  [LAYOUT, 'import type { Metadata, Viewport } from "next";\nimport { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";\n\nimport "./globals.css";\nimport { cn } from "@skillsite/ui/utils/cn";\n', 'import type { Metadata, Viewport } from "next";\n\n// The fonts come first: their @font-face rules stay ahead of globals.css in the built CSS.\nimport { fontVariables } from "@skillsite/ui/shell/fonts";\n\nimport "./globals.css";\n', 1],
  [LAYOUT, 'import { ThemeProvider } from "@/components/theme-provider";\n', 'import { ThemeProvider } from "@skillsite/ui/shell/theme-provider";\n', 1],
  [LAYOUT, 'const bricolage = Bricolage_Grotesque({\n  subsets: ["latin"],\n  variable: "--font-bricolage",\n  display: "swap",\n});\n\nconst hanken = Hanken_Grotesk({\n  subsets: ["latin"],\n  variable: "--font-hanken",\n  display: "swap",\n});\n\n', "", 1],
  [LAYOUT, "className={cn(bricolage.variable, hanken.variable)}", "className={fontVariables}", 1],
  [NAVBAR, 'import { Logo } from "@/components/layout/logo";\n', 'import { Logo } from "@skillsite/ui/shell/logo";\n', 1],
  [NAVBAR, 'import { primaryCta, primaryNav, platformNav } from "@/content/site";', 'import { brand, primaryCta, primaryNav, platformNav } from "@/content/site";', 1],
  [NAVBAR, "<Logo />", `<Logo ${LOGO_PROPS} />`, 1],
  [FOOTER, 'import Link from "next/link";\n', 'import Link from "next/link";\nimport {\n  SiDiscord,\n  SiGithub,\n  SiInstagram,\n  SiTiktok,\n  SiWhatsapp,\n  SiYoutube,\n} from "@icons-pack/react-simple-icons";\n', 1],
  [FOOTER, 'import { Logo } from "@/components/layout/logo";\nimport { SocialLinks } from "@/components/layout/social-links";\nimport { ThemeToggle } from "@/components/layout/theme-toggle";\nimport { primaryNav, platformNav } from "@/content/site";\n', 'import { Logo } from "@skillsite/ui/shell/logo";\nimport { ThemeToggle } from "@skillsite/ui/shell/theme-toggle";\nimport { cn } from "@skillsite/ui/utils/cn";\nimport { brand, primaryNav, platformNav } from "@/content/site";\nimport { socials, type SocialKey } from "@/content/socials";\n', 1],
  [FOOTER, '<Logo tone="inverse" />', `<Logo ${LOGO_PROPS} tone="inverse" />`, 1],
  [FOOTER, "\nexport function Footer() {", `\n${socialBody.trimEnd()}\n\nexport function Footer() {`, 1],
];

const files = new Map();
const errors = [];
for (const [file, from, to, expected] of REPLACEMENTS) {
  const source = files.get(file) ?? readFileSync(file, "utf8");
  const count = source.split(from).length - 1;
  if (count !== expected)
    errors.push(
      `${file}: "${from.slice(0, 60)}" found ${count}x, expected ${expected}x`,
    );
  files.set(file, source.split(from).join(to));
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
for (const [file, source] of files) writeFileSync(file, source);
rmSync(SOCIAL);
console.log(
  `${files.size} files rewritten, social-links.tsx folded into footer.tsx`,
);
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && node "$SCRATCH/c5c-shell.mjs" && pnpm format
ls "$WORKTREE/apps/marketing/src/components/layout" "$WORKTREE/apps/marketing/src/components"
```

Then run the import-order test:

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm --filter @skillsite/marketing exec vitest run
```

Expected: `3 files rewritten, social-links.tsx folded into footer.tsx`; the layout folder lists `footer.tsx`,
`ios-toolbar-tint.tsx`, `navbar.tsx`; `components/` has no `theme-provider.tsx`; the app's tests PASS, 10 files / 44
tests. The first import of `app/layout.tsx` is now the fonts module (with its comment). Moving it below
`import "./globals.css"` makes the test fail (`fonts before globals.css: expected 98 to be less than 49`) - checked
in the dry run.

- [ ] **Step 6: Storybook loads the brand fonts.** Replace `packages/ui/.storybook/preview.tsx` with (new: the
      fonts import, the comment, and the class list on `<html>`):

```tsx
import React from "react";

import type { Preview } from "@storybook/nextjs-vite";

import "./preview.css";

import { fontVariables } from "../src/shell/fonts";

/* The brand fonts: the same next/font module as the apps, so the workbench
   renders Bricolage Grotesque and Hanken Grotesk, not the system fallback. */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.add(...fontVariables.split(" "));
      return <Story />;
    },
  ],
};

export default preview;
```

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && pnpm format && just ratchet-update && just static-checks
cd "$WORKTREE" && pnpm --filter @skillsite/ui build-storybook --output-dir "$SCRATCH/storybook"
```

Expected: `lowered raw-button: 13 -> 12`; green; Storybook builds.

- [ ] **Step 7: Prove the result identical apart from the font hashes** (the `compare-computed` line needs a
      600000 ms timeout or a background run).

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
diff -r "$SCRATCH/html-before" "$SCRATCH/html-after" | grep '^[<>]' | grep -vc 'grotesque_\|grotesk_'
node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-before" "$SCRATCH/html-before-n"
node "$SCRATCH/normalize-snapshot.mjs" "$SCRATCH/html-after" "$SCRATCH/html-after-n"
diff -r "$SCRATCH/html-before-n" "$SCRATCH/html-after-n" && echo IDENTICAL-EXCEPT-FONT-HASHES
node "$SCRATCH/compare-computed.mjs" "$WORKTREE" http://localhost:3110 http://localhost:3111 > "$SCRATCH/computed.txt"; tail -2 "$SCRATCH/computed.txt"
stop 3110; stop 3111; git -C "$WORKTREE" worktree remove --force "$SCRATCH/before"
```

Expected: `0` (every raw difference carries a hashed font class name - the `<html class>` of 13 pages and 2 CSS
lines); `IDENTICAL-EXCEPT-FONT-HASHES` (the normaliser masks the font hashes; HTML and `_styles.css`, in their
order); `72 page states, 20374 elements, 14768 forced pseudo-states compared.` and `No differences.` Then open the
Storybook build (`python3 -m http.server 6107 --directory "$SCRATCH/storybook"`, story
`primitives-typography--type-scale`) in Chromium: `document.fonts` lists `Bricolage Grotesque` and
`Hanken Grotesk` as loaded.

- [ ] **Step 8: Tick spec C5** (both boxes), run `just check`, commit
      `refactor(ui): move theme, logo and fonts into the package`.

PR body: Summary (the font spike's result and decision; `fonts`, `ThemeProvider`, `ThemeToggle`, `Logo` with brand
props in `@skillsite/ui/shell`; `next-themes` a package dependency; social links folded into the footer; Storybook
renders the brand fonts); _What changes for a visitor_: nothing - HTML and CSS identical apart from the hashed font
class names, `compare-computed` 72 page states; _Deviations from the plan_; _How to check_: any two pages at 390
and 1280 px, light and dark (headings in Bricolage, text in Hanken, as before); the footer: logo, social icons,
theme toggle (switch light/dark/system); the navbar logo; `pnpm storybook` - the stories now use the brand fonts
(the workbench fetches them from Google's font CDN).

---

### Task 6: Primitives from the duplicates (spec C6)

**Branch / PR:** one per primitive group, `refactor/ui-<group>` / `refactor(ui): <primitive> from the duplicates`,
stacked on `refactor/ui-shell` (via the wave-3 docs PR) in this order unless wave 3 finds a dependency: 6a `Card` (tones, inset/subtle/doc/frame, `asChild`,
`Reveal as={Card}`), 6b `IconButton` and `IconBadge` (size/shape/tone), 6c `Pill` (or `Tag` sizes), `CheckList`,
`InfoRow`, 6d `CenteredState` and `StatusPage` (the three status pages), 6e `Collapsible` and `AnimatedHeight`,
6f `TextLink`/`ArrowLink`/`NavLink` on `next/link` with one external-link rule (`rel`, `target`), 6g `Field`
`error`/`description`/`required` slots (V4).

**Files:** `packages/ui/src/{primitives,layout,motion,forms}/*` (+ exports, stories, tests) and their call sites in
`apps/marketing/src`; `docs/specs/foundation-refactor.md` (the C6 box, in the last C6 PR).

**Interfaces:** each variant maps one current occurrence 1:1 (no rounding); the C6 box needs the ratchet plus a
grep list in the PR showing no hand-built copy is left.

**Background.** Spec C6. Counts to re-measure after C5 (from the audit of `72197da`, drifted since): card surface
12x hand-built, icon button 6x, icon badge 12x in 7 sizes, centered state 7x (private to the booker), status page
3x, collapsible 2x, info row 5 variants, text links 5 styles.

_Detailed steps: wave 3, written against the code after C5 (split into these PR-sized tasks)._

---

### Task 7: Headless spike (spec C7, gate)

**Branch:** `spike/headless-widgets` from the last C6 branch. **PR:** draft,
`chore: headless widget spike - Radix Primitives vs React Aria Components`; never merged.

**Files:** spike stories in Storybook only (on the spike branch): dialog, dropdown menu, radio group, combobox and
date picker, each built once on Radix Primitives and once on React Aria Components in the brand look; the two
libraries are added to `packages/ui` on the spike branch only.

**Interfaces:** none - the spike code is thrown away. Output: a comparison in the PR body (accessibility, German
date formats, fit with the motion tokens, bundle size, composition `asChild` vs render props) and a
recommendation. The spec's C7 box and the _Decisions_ row are written only after the maintainer has chosen, in the
docs PR that opens C8.

**Background.** Spec C7, E-21. Time-boxed. Phase C stops here until the maintainer picks.

_Detailed steps: wave 3, written against the code after C6._

---

## After the gate

Written after the maintainer's C7 choice, as its own plan wave:

- **C8 - Accessible widgets** on the chosen base: `Dialog` (focus trap), `Select`, `Popover`/dropdown with one
  dismiss logic instead of three, `RadioGroup` and chips (arrow keys; single-choice chips cannot be deselected by
  accident), `Switch`, and the booker calendar grid (grid semantics, arrow keys). It includes the E-09 carry-over
  recorded in the spec: **Escape in the navbar "Online lernen" dropdown returns focus to its trigger** (today focus
  drops to `<body>` once the panel hides; `apps/marketing/src/components/layout/navbar.tsx`). C8 changes keyboard
  and screen-reader behaviour, so its PRs describe the change like a `fix:` (spec: "the widget fixes of C8").
- **C9 - Workbench coverage:** a story for every exported component with its variants (`Switch` included, E-11);
  Storybook builds in CI.
