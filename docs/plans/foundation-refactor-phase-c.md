# Foundation Refactor - Phase C (Design system in `@skillsite/ui`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking. **Each task is one slice = one branch = one PR.** Phase B is not merged yet: the slices form one
> linear stack on top of it (see _Execution order_). **This plan is written in waves.** Wave 1 (this version)
> fixes the skeleton of all of phase C and details C1-C3 (Tasks 1-3). Wave 2 adds the steps of C4 and C5, wave 3
> splits C6 into PR-sized tasks and details C7 - each written against the code as it is after the slice before.
> A task that still reads "_Detailed steps: wave 2/3_" is not ready to implement.
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
  and report.
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
tags left out (they follow the chunking, not the markup), plus the served stylesheets as `_styles.css`. Usage:
`node "$SCRATCH/snapshot-html.mjs" <tree> http://localhost:<port> "$SCRATCH/html-<name>"`, then
`diff -r "$SCRATCH/html-before" "$SCRATCH/html-after"`.

```js
// Snapshot the server-rendered HTML of every route as one line per element/text node
// (hashes aside), plus the stylesheets the pages load (_styles.css).
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
// Script tags and script preloads differ with chunking, not with markup.
const skip = (el) =>
  el.tagName === "SCRIPT" ||
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
`No differences.` or a list of `element: property: before -> after` and exit code 1.

```js
// Compare the computed styles of every element between two running builds
// (before/after), per route and scenario, at 390px and 1280px, light and dark,
// including forced :hover/:focus/:focus-visible/:active on every interactive
// element. Reduced motion, so reveals and counters sit at their end state.
// Usage: node compare-computed.mjs <repo-root> <before-url> <after-url> [scenario-filter]
// (the optional filter is a regular expression on the scenario names below).
// Exit code 1 and a list of differences when anything differs.
import { createRequire } from "node:module";
import path from "node:path";

const [root, beforeUrl, afterUrl, filter = ""] = process.argv.slice(2);
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
function subtreeStyles() {
  const skip = new Set([
    "HEAD",
    "SCRIPT",
    "LINK",
    "STYLE",
    "TEMPLATE",
    "NOSCRIPT",
  ]);
  const out = [];
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
      .forEach((child, i) =>
        visit(child, `${where}>${child.tagName.toLowerCase()}:${i}`),
      );
  };
  visit(this, this.tagName.toLowerCase());
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
    `(${subtreeStyles.toString()}).call(document.documentElement)`,
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
    const props = [...new Set([...pa.keys(), ...pb.keys()])].filter(
      (k) => pa.get(k) !== pb.get(k),
    );
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
if (report.length) {
  console.log(`${report.length} differences:\n${report.join("\n")}`);
  process.exit(1);
}
console.log("No differences.");
```

**Class probe** - `<scratch>/probe-classes.mjs`, for slices that rename classes. For every `[from, to]` pair of the
slice's class map it renders one element with the old classes in the before build and one with the new classes in
the after build (inside `main` of `/`), and compares their computed styles at 390 and 1280 px, light and dark,
plain and with each of the four states forced. This covers replacements whose element no scenario renders (the
booking confirmation, the rate-limited state, `error.tsx`). Usage:
`node "$SCRATCH/probe-classes.mjs" <tree> http://localhost:3110 http://localhost:3111 <map.mjs>` (about a
minute). It ends with `No differences.` or the differing pairs and exit code 1.

```js
// Class probe: for every pair of a class map, render one element with the old
// classes in the before build and one with the new classes in the after build, and
// compare their computed styles - at 390 and 1280px, light and dark, plain and with
// :hover, :focus, :focus-visible and :active forced. Covers every replacement,
// including the ones whose element only renders in a state no scenario reaches.
// Usage: node probe-classes.mjs <repo-root> <before-url> <after-url> <map.mjs>
// Exit code 1 and a list of differences when anything differs.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [root, beforeUrl, afterUrl, mapFile] = process.argv.slice(2);
const { REPLACEMENTS } = await import(
  pathToFileURL(path.resolve(mapFile)).href
);
const { chromium } = createRequire(
  path.join(root, "apps/marketing/package.json"),
)("@playwright/test");

/** Distinct [from, to] pairs, in map order. */
const pairs = [
  ...new Map(
    REPLACEMENTS.map(([, from, to]) => [`${from} ${to}`, [from, to]]),
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
        const props = [...new Set([...a.keys(), ...b.keys()])].filter(
          (k) => a.get(k) !== b.get(k),
        );
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
if (report.length) {
  console.log(`${report.length} differences:\n${report.join("\n")}`);
  process.exit(1);
}
console.log("No differences.");
```

**Expected HTML** - `<scratch>/expect-html.mjs`, for slices that rename classes: writes the before snapshot with
the class map applied (longest entries first, so a context entry wins over a bare value), so the after snapshot is
compared exactly, not filtered. Usage: `node "$SCRATCH/expect-html.mjs" <map.mjs> "$SCRATCH/html-before"
"$SCRATCH/html-expected"`, then `diff -r -x _styles.css "$SCRATCH/html-expected" "$SCRATCH/html-after"` - it must
print nothing (the built CSS changes by design; the computed-style tools cover it).

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

Known properties of the pipeline (measured, so nobody is surprised):

- `next build` minifies with Lightning CSS: `bg-white/8` ships as `#ffffff14` with a
  `@supports (color:color-mix(...))` override to `color-mix(in oklab, var(--color-white) 8%, transparent)`;
  `bg-[color-mix(in_srgb,var(--coral)_14%,transparent)]` ships as `var(--coral)` plus the same kind of override.
  Chromium applies the override, so the computed value is the `color-mix(...)`, and its serialisation depends on
  the colour space (`in srgb` vs `in oklab`). A token therefore copies the exact expression and colour space.
- The app's `@source "../../../../packages/ui/src"` also scans tests and stories, so a class name that only
  appears in a test still generates a (never applied) CSS rule. It does not touch computed styles.
- Tailwind resolves the `@import`s of `theme.css` itself: `@theme`, `@utility`, `@layer base` and `@custom-variant`
  work from the imported parts, and the built CSS stays byte-identical as long as the parts keep the source order
  (measured in the C1 dry run).
- Turborepo shares its cache between worktrees; a build of an unchanged tree is replayed from the cache. A change
  in `packages/ui` does invalidate the app build (checked with `turbo run build --dry=json`).

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

## Decisions taken while planning

Given by the controller for this phase (not reopened):

- Phase C runs automatically through C1-C6 and the C7 spike and stops at the C7 gate: the maintainer picks Radix
  Primitives or React Aria Components. C8 and C9 get only the section _After the gate_ here.
- Waves: this version details C1-C3; wave 2 (C4, C5) and wave 3 (C6 split into PR-sized tasks, C7) are written
  later against the then-current code, each as a docs PR in the stack.
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
- C5 font spike is an explicit decision branch (Task 5).
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
  `text-ink-soft/50`, `bg-black/45`), the Tailwind default `shadow` on `Switch`, `max-w-205/220/230` (C5 container
  sizes), the app stylesheet's `z-index: 5` (iOS toolbar tint), the dead `--maxw` and `--blue` (D6).

## Open points for the maintainer

The plan takes the conservative option in each case; none blocks a task.

1. **Tone for muted text on inverse surfaces.** E-08 names `tone: default | muted | inverse | accent`, but `Text`
   has a fifth colour today, `on-navy-soft` (#b9c8db, used 4 times). The plan keeps it as `inverse-muted`
   (value unchanged). Rename later if a different name is wanted.
2. **Select tone name.** E-08 does not list `Select`; the plan renames its `on-navy` tone to `inverse` under the
   same rule. `Text`'s `inherit` tone stays (it sets no colour).
3. **Token names of C3** (tints by percent, `overlay-*` for white washes, `on-accent-*` for text on coral, role
   sizes, fluid spacings by role) are the planner's proposal. A rename is a codemod over the same table.
4. **Open Graph image colours stay literal.** Reading them from `brandColors` renders a byte-identical image, but
   Next derives the `og:image`/`twitter:image` URL hash from the file (measured: `?a20751a4992edc7d` ->
   `?745246771e923f94`), which changes `<head>` on every page. The plan allow-lists the file instead; moving them
   later is a one-line decision.
5. **QR code fill spelling.** `whatsapp-qr.tsx` passes `#13283F`; the token mirrors `theme.css` (`#13283f`). The
   SVG `fill` attribute on `/kontakt` changes case; the colour (computed `fill`) is identical. The plan accepts it
   and lists it as the one expected non-class HTML difference of C3.
6. **Spec wording:** C2's "Text/Heading tones follow the tone vocabulary" - `Heading` has no tone today; it gets
   one in C4. C2 renames only the existing `Text` tones.

## Execution order

Phase B (#152 -> #155) is open and unmerged. Phase C stacks on its tip, one branch per task, each PR based on the
previous branch:

```
fix/a11y (#155)
  -> docs/phase-c-plan               Task 0  docs: add the phase C plan
    -> refactor/ui-groups            Task 1  C1
      -> refactor/ui-variants        Task 2  C2
        -> refactor/ui-tokens        Task 3  C3
          -> docs/phase-c-plan-wave-2        docs: detail phase C slices C4 and C5
            -> refactor/ui-typography        Task 4  C4
              -> refactor/ui-layout-shell    Task 5  C5
                -> docs/phase-c-plan-wave-3  docs: detail phase C slices C6 and C7
                  -> refactor/ui-<primitive> ...  Task 6a.. C6 (one PR each)
                    -> spike/headless-widgets     Task 7  C7 (draft, never merged; gate)
```

Each PR body starts with "Stacked on #N - merge after it." and "Part of #139.". After a squash merge, rebase the
rest of the chain with `git rebase --onto origin/main <merged-branch> <next-branch>`, run `just check`, and
`git push --force-with-lease`.

## File map

| File                                                                                         | Task | Responsibility                           |
| -------------------------------------------------------------------------------------------- | ---- | ---------------------------------------- |
| `docs/plans/foundation-refactor-phase-c.md`, spec C8 technique, phase-B plan "After phase B" | 0    | this plan, E-09 carry-over               |
| `packages/ui/src/{primitives,typography,forms,overlays,layout,motion,utils}/`                | 1    | grouped modules (moved verbatim)         |
| `packages/ui/styles/{theme,tokens,base,components,motion}.css`                               | 1    | styles split along its sections          |
| `packages/ui/package.json` (`exports`), `packages/ui/src/exports.test.ts`                    | 1    | explicit export map and its guard        |
| 39 files under `apps/marketing/src` (imports only)                                           | 1    | grouped import paths                     |
| `packages/ui/src/primitives/{button,tag}.tsx`, `typography/{heading,text}.tsx` (+ tests)     | 2    | CVA variants, role names, `asChild`      |
| `packages/ui/src/forms/select.tsx`, `apps/marketing/.../layout/logo.tsx`, `footer.tsx`       | 2    | `inverse` tone, `Logo tone`              |
| 12 files under `apps/marketing/src` (`LinkButton` -> `Button asChild`), stories              | 2    | one button API                           |
| `packages/ui/styles/tokens.css`, `styles/base.css` (focus ring)                              | 3    | raw, semantic and `@theme` tokens        |
| `packages/ui/src/utils/cn.ts`, `utils/cn.test.ts`                                            | 3    | registration and drift guard             |
| `packages/ui/src/tokens/colors.ts` (+ `colors.test.ts`), `tokens/prose.test.ts`              | 3    | TS colour mirror, prose parity           |
| 36 files under `apps/marketing/src` and `packages/ui/src` (classes), `design-ratchet.json`   | 3    | token classes, lowered counts            |
| `packages/ui/src/typography/*`, doc components, pages with hand-built eyebrows/headings      | 4    | one typography API (wave 2)              |
| `packages/ui/src/{layout,shell}/*`, `apps/marketing/src/components/layout/*`, `app/layout`   | 5    | layout and shell in the package (wave 2) |
| `packages/ui/src/{primitives,layout,motion,forms}/*`, their app call sites                   | 6    | primitives from the duplicates (wave 3)  |
| Storybook spike stories (spike branch only)                                                  | 7    | Radix vs React Aria comparison (wave 3)  |
| `CLAUDE.md`                                                                                  | 1-3  | layout line, variant rule, token rule    |

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
  - `<scratch>/c3-map.mjs` shape `[file, from, to, count]` - wave 2 reuses the toolkit's `expect-html.mjs` and
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
      background run).

```bash
source <scratch>/toolkit.sh
cd "$WORKTREE" && just build
serve "$WORKTREE" 3111
node "$SCRATCH/snapshot-html.mjs" "$WORKTREE" http://localhost:3111 "$SCRATCH/html-after"
node "$SCRATCH/expect-html.mjs" "$SCRATCH/c3-map.mjs" "$SCRATCH/html-before" "$SCRATCH/html-expected"
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

### Task 4: One typography API (spec C4)

**Branch:** `refactor/ui-typography` from `docs/phase-c-plan-wave-2`. **PR title:** `refactor(ui): one typography API`.

**Files:**

- Modify: `packages/ui/src/typography/{heading,text,lead,eyebrow,prose}.tsx`, `typography.test.tsx`,
  `typography.stories.tsx`
- Modify: `apps/marketing/src/components/docs/doc-components.tsx`, `doc-section-nav.tsx`, `app/{agb,datenschutz,impressum}/page.tsx`
- Modify: the hand-built eyebrows (`kontakt/page.tsx` 2x incl. `sideLabelClass`, `ablauf/page.tsx`,
  `cta-section.tsx`, `footer.tsx`, `booker.tsx` 3x) and raw headings (`subject-cards.tsx`, `step-grid.tsx`,
  `benefit-grid.tsx`), `faecher/page.tsx` (outline), the remaining raw sizes (`button.tsx` `sm`, `tag.tsx`,
  `accordion.tsx`, `layout.tsx` skip link, `booking-form.tsx` 2x, `preise/page.tsx`)
- Modify: `design-ratchet.json`, `docs/specs/foundation-refactor.md` (C4 box)

**Interfaces:**

- Consumes: Task 1's typography paths, Task 2's CVA pattern and tone names, Task 3's role and prose tokens and the
  toolkit's `expect-html.mjs`/`probe-classes.mjs` (with a C4 class map).
- Produces: `Heading({ size, as, tone })`, `Text({ size, tone, as })`, `Lead`, `Eyebrow({ tone, dot, as })`; a Prose
  module (`ProseH2`, `ProseH3`, `ProseP`, `InlineLink`) on the `prose-*` tokens; `H1`-`H3`, `P` site variants,
  `Small` and `Muted` removed. `raw-text-size` ratchet count 0 outside the allow-list.

**Background.** Spec C4. `Small` and `Muted` are identical and unused. The eyebrow count and the raw sizes above
are from the tree after Task 3 (`text-eyebrow` appears in 8 hand-built places; `raw-text-size` is 21). Notes for
wave 2:

- The `/faecher` outline fix changes a heading element (tag name), not its look: the computed-style comparison
  reports it as `element i is h3 vs h2`, so wave 2 adds a tag-insensitive mode or an explicit exception for that
  one element.
- `prose-body` sets `font-size: 1rem` explicitly where the doc `P` (`leading-7`, no size) inherits 16px today. The
  computed value is the same only while the parent is 16px; the C4 proof must show it on every legal page (the
  computed-style comparison covers `/agb`, `/datenschutz`, `/impressum`) and the class probe must include the pair.
- From C4 on, the HTML snapshot keeps `script[type="application/ld+json"]` (structured data is content, not a
  chunk): wave 2 changes `skip` in `snapshot-html.mjs` to drop only scripts without that type.

_Detailed steps: wave 2, written against the code after C3._

---

### Task 5: Layout and shell into the package (spec C5)

**Branch:** `refactor/ui-layout-shell` from `refactor/ui-typography`. **PR title:**
`refactor(ui): move layout and shell into the package`.

**Files:**

- Create: `packages/ui/src/layout/{container,section,page-header,split,card-grid}.tsx`,
  `packages/ui/src/shell/{theme-provider,theme-toggle,logo}.tsx`, `packages/ui/src/shell/fonts.ts` (+ exports,
  stories)
- Delete (moved): `apps/marketing/src/components/layout/{container,section,page-header,logo,theme-toggle}.tsx`,
  `apps/marketing/src/components/theme-provider.tsx`; `layout/section-header.tsx` folds into `page-header`
- Modify: `packages/ui/package.json` (`next-themes` becomes a dependency), `packages/ui/.storybook/preview.tsx`
  (brand fonts), `apps/marketing/src/app/layout.tsx`, every importer of the moved parts
- Modify: `docs/specs/foundation-refactor.md` (C5 boxes)

**Interfaces:**

- Consumes: Tasks 1-4.
- Produces: `Container({ size })` (named widths, incl. today's `max-w-205/220/230` and `page`), `Section({ spacing })`
  (incl. `sm`), `PageHeader` (covers `SectionHeader`; spacings and stagger as props), `Split`, `CardGrid`,
  `ThemeProvider`, `ThemeToggle`, `Logo({ tone, name, tagline, src })`, fonts (`shell/fonts.ts`).
  `apps/marketing/src/components/layout` keeps only the marketing parts: `navbar.tsx`, `footer.tsx`,
  `ios-toolbar-tint.tsx` and the footer's `social-links.tsx`.

**Background.** Spec C5, E-06. The package cannot import `@/content/site`, so `Logo` takes the brand as props
(`name`, `tagline`, image `src`, today `brand.name`, `brand.tagline`, `brand.logo`) and the app passes them from
`content/site.ts` (e.g. through a small app-side `SiteLogo` wrapper). **Font spike - a decision branch, not an
improvisation:**

1. Spike first: call `next/font/google` (Bricolage Grotesque, Hanken Grotesk, the same options as
   `apps/marketing/src/app/layout.tsx` today) from `packages/ui/src/shell/fonts.ts`, build, and compare the
   `@font-face` rules and the `<html>` font classes against the base build.
2. **If** they are identical apart from the hashed class names: the package owns the fonts; the app imports them.
3. **Else** (different `@font-face` output, a build error, or `next/font` refusing to run outside the app): the app
   keeps its `next/font` call; the package owns only the variable contract (`--font-hanken`, `--font-bricolage`
   and a typed helper for the `<html>` class list). Report which branch applied and why in the PR - do not look
   for a third way.

Identity proof: the HTML snapshot with the font class names masked (they are hashed:
`bricolage_grotesque_<hash>-module__<hash>__variable`), the built CSS apart from those names, and the computed-style
comparison.

_Detailed steps: wave 2, written against the code after C4._

---

### Task 6: Primitives from the duplicates (spec C6)

**Branch / PR:** one per primitive group, `refactor/ui-<group>` / `refactor(ui): <primitive> from the duplicates`,
stacked in this order unless wave 3 finds a dependency: 6a `Card` (tones, inset/subtle/doc/frame, `asChild`,
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
