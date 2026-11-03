# Foundation Refactor - Phase B (Bug fixes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking. **Each task is one slice = one branch = one PR.** Phase A is not merged yet: the slices form one
> linear stack on top of it (see _Execution order_).

**Goal:** Fix the four groups of bugs of phase B - `cn` dropping theme tokens (B1), layout and motion bugs (B2),
metadata deviations (B3) and accessibility gaps (B4) - each in its own `fix:` PR that names every visible change.

**Architecture:** B1 configures tailwind-merge once in `@skillsite/ui` (`cn`) and guards the configuration with a
test that reads `theme.css`, so a new token cannot be forgotten. B2 fixes CSS where it is declared (transition
property lists, a missing utility, one breakpoint token, two base rules) and proves the motion in a real browser.
B3 makes `pageMetadata` the only way a route declares metadata and removes the canonical from the root layout.
B4 adds names, `aria-current`, Escape handling and one `aria-hidden` spelling without rebuilding any widget.

**Tech Stack:** pnpm 12.4.2 + Turborepo 2.11.2, Node 26, Next.js 16.3.5, React 19.3.0, TypeScript 7.0.2,
Tailwind CSS 4.3.3, tailwind-merge 3.7.0, Vitest 5 (node + jsdom), Playwright 1.63 (Chromium).

**Spec:** [`docs/specs/foundation-refactor.md`](../specs/foundation-refactor.md) - phase B. Read _Rules of the
refactor_, _Rules for implementing agents_ and decisions **R2**, **E-09**, **V10-V13** before starting any task.

## Global Constraints

- English in code, comments, identifiers, specs and commits; German only in visible content.
- B1-B4 are `fix:` PRs (they change what a visitor or a screen reader gets). Every PR body lists **every** visible
  change with before/after, and a _How to check_ section: routes and states, light and dark, 390px and 1280px.
- Change nothing beyond the listed fixes. If a fix would move something not listed in its task, stop and report.
- **No `Co-Authored-By` trailer.** Do not name the maintainer in any file, commit, PR or issue.
- Push the branch and open the PR; **never merge**, never change repo settings, rulesets, the App or Dokploy.
- `just check` green before every push (it includes `just smoke`; install Chromium once with
  `pnpm --filter @skillsite/marketing exec playwright install chromium`).
- Tick the matching acceptance boxes in `docs/specs/foundation-refactor.md` in the PR that fulfils them.
- Every new theme utility is registered in the `cn` configuration with a test; never raise a ratchet count.
- Bulk edits over German files only with UTF-8-safe tools (`perl -CSD -pi -e ...`).
- Scratch output (built HTML dumps, head dumps) goes to the session scratchpad, never into the repo.

## Review Focus

1. **A tailwind-merge config that over-merges.** Registering a token in the wrong group makes `cn` drop a class
   that used to survive (e.g. a size token registered as a colour, or `shadow-card` swallowing `shadow-coral/20`).
   Task 1 tests the survivors (`text-eyebrow text-coral`, `shadow-card shadow-coral/20`,
   `bg-coral-gradient bg-navy`) as well as the conflicts.
2. **A token added later and forgotten in `cn`.** Task 1's drift test parses `theme.css` and fails for any
   `--text-*`, `--shadow-*`, `--ease-*`, `--transition-duration-*`, `--animate-*`, `--container-*` or `@utility`
   that `cn` does not know - B2 relies on it when it adds `pb-section-sm`.
3. **Motion that only "works" at the end state.** A transition that jumps still reaches the right end value, so
   end-state assertions pass. Task 2 seeks each running transition to its midpoint and asserts an intermediate
   value, and checks that reduced motion still lands on the end state at once.
4. **A root canonical leaking to a page again.** Removing it from the layout is the fix; Task 3's smoke test
   asserts on every indexable route, `/zahlung` and a 404 that only `/` renders the root canonical.
5. **Keyboard users losing their place.** Escape in the mobile menu must close it **and** put focus back on the
   menu button; Task 4 asserts `toBeFocused()`, not just the closed state.

## Decisions taken while planning

Maintainer decisions (2026-09-27, recorded in the spec by Task 0 as V10-V13):

- **V10 - Home head:** only the missing `og:url` is added. Home keeps its untemplated title, its short social
  description and its file-convention OG image (hash, `og:image:type`, "Mathe" alt).
- **V11 - `/zahlung` head:** no canonical; the social card stays the site default (home card), no new copy.
- **V12 - Booker duration select:** accessible name "Dauer" (read as "Dauer: 60 Minuten"); nothing visible.
- **V13 - Brand icons (`@icons-pack/react-simple-icons`):** `aria-hidden` only. Their `<title>` stays, so the
  hover tooltips stay; the icon no longer leaks "Discord" into the link name.

Rulings by the planner (from the spec text; stated in the PR bodies, not open questions):

- **B2 `pb-section-sm`** is defined as the bottom half of `py-section-sm` (`clamp(2.25rem, 5vw, 3.5rem)`); the
  spec lists it as a bug, so the 36-56px of extra space under the `/ueber-mich` quote is the fix.
- **B2 switch thumb:** it already interpolates (`transition-transform` in Tailwind 4.3.3 compiles to
  `transform, translate, scale, rotate`) and no route renders `Switch`. The code stays; the PR says so, and
  the `CLAUDE.md` trap line and the `theme-toggle.tsx` comment that claim otherwise are corrected. The real
  trap is an explicit list such as `transition-[opacity,transform]`, which leaves out `translate`/`scale`.
- **B2 scroll offset:** exactly the header height, no extra breathing room.
- **B2 navbar breakpoints** are tokens in rem (`67.5rem` = 1080px, `79.875rem` = 1278px): a px breakpoint sorts
  before Tailwind's rem breakpoints in the generated CSS, so `sm:`/`nav:` pairs would resolve in the wrong order.
- **B3 404 robots:** the page keeps its own `noindex, nofollow` next to the one Next injects (unchanged).
- **B4 `aria-hidden`:** the shorthand `aria-hidden` (42 uses) is the one style; the 8 `aria-hidden="true"` are
  rewritten and ESLint forbids the long forms.
- **B4 `aria-current`:** on the header and mobile-menu page links only; never on a `#section` link. The footer
  (a server component without active state) and the doc table of contents stay as they are.

## Execution order

Phase A (#144 -> #149) is open and unmerged. Phase B stacks on its tip, one branch per task, each PR based on the
previous branch:

```
chore/design-ratchet (#149)
  -> docs/phase-b-plan      Task 0  docs: add the phase B plan
    -> fix/cn-theme         Task 1  B1
      -> fix/layout-motion  Task 2  B2
        -> fix/metadata     Task 3  B3
          -> fix/a11y       Task 4  B4
```

The spec allows B2-B4 in parallel after B1; they run in sequence here because B2 and B4 both edit `navbar.tsx`
and `select.tsx`, B2 and B3 both add Playwright specs, and every slice ticks boxes in the same spec file. Each PR
body says "Stacked on #N - merge after it". After a squash merge, rebase the rest of the chain with
`git rebase --onto origin/main <merged-branch> <next-branch>`, run `just check`, and `git push --force-with-lease`.

## File map

| File                                                                                        | Task | Responsibility                                 |
| ------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------- |
| `docs/plans/foundation-refactor-phase-b.md`, spec _Decisions_                               | 0    | this plan, V10-V13                             |
| `packages/ui/src/utils.ts`, `utils.test.ts`, `typography.test.tsx`                          | 1    | theme-aware `cn`, drift guard                  |
| `packages/ui/styles/theme.css`                                                              | 2    | `pb-section-sm`, cursor rule                   |
| `packages/ui/src/select.tsx`, `accordion.tsx`, `apps/marketing/.../navbar.tsx`              | 2    | transition property lists, breakpoint variants |
| `apps/marketing/src/app/globals.css`, `src/lib/breakpoints.ts(+test)`                       | 2    | `nav`/`nav-wide` breakpoints, header height    |
| `apps/marketing/e2e/helpers.ts`, `e2e/motion.spec.ts`, `e2e/layout.spec.ts`                 | 2    | shared e2e helpers, motion and anchor proof    |
| `CLAUDE.md`, `theme-toggle.tsx` (comment only)                                              | 2    | correct the transition trap                    |
| `apps/marketing/src/lib/metadata.ts(+test)`, `app/layout.tsx`, `app/page.tsx`, 404, zahlung | 3    | one metadata helper, no inherited canonical    |
| `apps/marketing/e2e/smoke.spec.ts`                                                          | 3    | canonical guard                                |
| `navbar.tsx`, `theme-toggle.tsx`, `select.tsx(+test)`, `booker.tsx`, `content/booking.ts`   | 4    | names, `aria-current`, Escape, disclosure      |
| `online-lernen/page.tsx`, `preise/page.tsx`, `ios-toolbar-tint.tsx`, `doc-components.tsx`   | 4    | `aria-hidden` spelling and Discord icon        |
| `packages/config/eslint/next.mjs`, `apps/marketing/e2e/a11y.spec.ts`                        | 4    | lint guard, keyboard proof                     |

---

### Task 0: The phase B plan (docs PR)

**Branch:** `docs/phase-b-plan` from `chore/design-ratchet`. **PR base:** `chore/design-ratchet`.

**Files:**

- Create: `docs/plans/foundation-refactor-phase-b.md` (this file)
- Modify: `docs/specs/foundation-refactor.md` (_Decisions_ table)

- [ ] **Step 1: Record V10-V13.** Append four rows to the _Decisions_ table, after **V9**, in the table's style:

```markdown
| **V10** | Home `<head>` (B3): only the missing `og:url` is added; the untemplated title, the short social description and the file-convention OG image stay. | 2026-09-27 |
| **V11** | `/zahlung` `<head>` (B3): no canonical; the social card stays the site default, no new copy. | 2026-09-27 |
| **V12** | The booker's duration select is named "Dauer" for assistive technology (B4); nothing visible changes. | 2026-09-27 |
| **V13** | Brand icons inside named links get `aria-hidden` only (B4); their `<title>` and its hover tooltip stay. | 2026-09-27 |
```

- [ ] **Step 2: Format and check.** Run `pnpm format` (Prettier re-pads the table), then `just static-checks`.
      Expected: green.

- [ ] **Step 3: Commit, push, open the PR.**

```bash
git add docs/plans/foundation-refactor-phase-b.md docs/specs/foundation-refactor.md
git commit -m "docs: add the phase B plan"
git push -u origin docs/phase-b-plan
gh pr create --base chore/design-ratchet --title "docs: add the phase B plan" --body-file <body>
```

Body: summary (plan for B1-B4, decisions V10-V13), "Stacked on #149 - merge after it", _How to check_: "Nothing
visible; read the plan and the four new decision rows."

---

### Task 1: `cn` knows the theme (spec B1)

**Branch:** `fix/cn-theme` from `docs/phase-b-plan`. **PR title:** `fix(ui): keep theme tokens when merging classes`.

**Files:**

- Modify: `packages/ui/src/utils.ts`
- Modify: `packages/ui/src/utils.test.ts`
- Create: `packages/ui/src/typography.test.tsx`

**Interfaces:**

- Produces: `cn(...inputs: ClassValue[]): string` (unchanged signature) backed by a tailwind-merge instance that
  knows every theme token. Task 2 extends its `classGroups.pb` with `section-sm`; the drift test enforces that.

**Background.** `cn` calls an unconfigured `twMerge`. tailwind-merge 3.7.0 treats unknown `text-<name>` as a
text colour, `shadow-<name>` as a shadow colour and `bg-<name>` as a background colour, so `cn("text-eyebrow
text-coral")` returns `text-coral`, `cn("text-ink-soft text-small")` returns `text-small` and
`cn("bg-coral-gradient bg-navy")` returns `bg-navy`. Durations, easings, animations, section paddings and
`max-w-page` are not dropped today but never conflict either (`py-section py-4` keeps both). Theme keys in v3:
`text`, `shadow`, `ease`, `animate`, `container` (used by `max-w`, `w`, `basis`); `duration` has no theme key and
needs `classGroups.duration`; `py`/`pt`/`pb`, `bg-image` and `hyphens` are class groups.

- [ ] **Step 1: Write the failing tests.** Replace `packages/ui/src/utils.test.ts` with:

```ts
import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { cn } from "./utils";

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
});

test("the page width conflicts with max-width utilities", () => {
  expect(cn("max-w-page max-w-none")).toBe("max-w-none");
});

// Drift guard: every token and utility of theme.css must be known to `cn`.
const themeCss = readFileSync(
  new URL("../styles/theme.css", import.meta.url),
  "utf8",
);

/** Token names of one namespace, e.g. `--text-lead` -> `lead` (skips `--text-lead--line-height`). */
function tokens(namespace: string): string[] {
  const pattern = new RegExp(`^\\s*--${namespace}-([a-z0-9-]+?):`, "gm");
  return [...themeCss.matchAll(pattern)]
    .map((match) => match[1]!)
    .filter((name) => !name.includes("--"));
}

/** For each namespace: a Tailwind utility that must override the token. */
const namespaceConflicts: Record<string, [prefix: string, winner: string]> = {
  text: ["text", "text-sm"],
  shadow: ["shadow", "shadow-none"],
  ease: ["ease", "ease-linear"],
  "transition-duration": ["duration", "duration-200"],
  animate: ["animate", "animate-none"],
  container: ["max-w", "max-w-none"],
};

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

/** For each @utility: a class it must conflict with, or null when it has no conflicting group. */
const utilityConflicts: Record<string, string | null> = {
  "bg-coral-gradient": "bg-none",
  "py-section": "py-4",
  "py-section-sm": "py-4",
  "pt-section": "pt-4",
  "pb-section": "pb-4",
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

- [ ] **Step 2: Run the tests to see them fail.**

Run: `pnpm --filter @skillsite/ui exec vitest run --project unit`
Expected: FAIL - among others `a type-scale size and a text colour both survive` (received `text-coral`) and the
drift tests for `text`, `transition-duration`, `ease`, `animate`, `container` and `@utility`.

- [ ] **Step 3: Configure `cn`.** Replace `packages/ui/src/utils.ts` with:

```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge that knows the theme of `styles/theme.css`. Without this it
 * reads unknown names as colours (`text-eyebrow` as a text colour, `bg-coral-gradient`
 * as a background colour) and drops them next to a real colour. Every token and
 * `@utility` of theme.css is listed here; `utils.test.ts` fails when one is missing.
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
      ],
      shadow: ["card"],
      ease: ["flow", "soft"],
      animate: ["rise", "fade", "fade-down", "draw", "rise-soft", "settle"],
      container: ["page"],
    },
    classGroups: {
      duration: [{ duration: ["quick", "base", "slow", "flow", "settle"] }],
      py: [{ py: ["section", "section-sm"] }],
      pt: [{ pt: ["section"] }],
      pb: [{ pb: ["section"] }],
      "bg-image": [{ bg: ["coral-gradient"] }],
      hyphens: [{ hyphens: ["heading"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run the tests to see them pass.**

Run: `pnpm --filter @skillsite/ui exec vitest run --project unit`
Expected: PASS, all tests of `utils.test.ts`. If a drift test fails for a token not listed above, register it in
the matching group - do not loosen the test.

- [ ] **Step 5: Prove the components render their tokens.** Create `packages/ui/src/typography.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Eyebrow } from "./eyebrow";
import { Lead, Text } from "./typography";

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
```

Run: `pnpm --filter @skillsite/ui exec vitest run`
Expected: PASS (both projects). `tone="muted"` maps to `text-ink-soft` (`typography.tsx:58-64`), so each test pairs a size token with a colour.

- [ ] **Step 6: Record the before/after HTML.** On `docs/phase-b-plan` (before) and on this branch (after), run
      `just build` and count `text-lead` in class attributes of every prerendered page:

```bash
for f in apps/marketing/.next/server/app/*.html; do
  printf '%s %s\n' "$(grep -o 'class="[^"]*\btext-lead\b' "$f" | wc -l | tr -d ' ')" "$(basename "$f")"
done
```

Expected: before, every page 0; after: `_not-found` 1, `ablauf` 2, `agb` 1, `datenschutz` 1, `faecher` 5,
`impressum` 1, `index` 2, `online-lernen` 3, `preise` 1, `termin` 2, `ueber-mich` 3. The dynamic routes have no
`.html`: start the build (`pnpm --filter @skillsite/marketing start -p 3100`) and count with
`curl -s localhost:3100/kontakt | grep -o 'class="[^"]*\btext-lead\b' | wc -l` (expected 3) and the same for
`/zahlung?re=x&betrag=abc` (expected 1). Put both tables in the PR body.

- [ ] **Step 7: Look at it.** `just dev`, open the routes below at 390px and 1280px, light and dark, and compare
      with `main` (`git stash`/second worktree). Every item of the _How to check_ list below must match; anything
      else that moves is a finding - stop and report.

- [ ] **Step 8: Tick spec B1** (both boxes), then `just check`. Expected: green, ratchet unchanged.

- [ ] **Step 9: Commit, push, open the PR.**

```bash
git add packages/ui/src/utils.ts packages/ui/src/utils.test.ts packages/ui/src/typography.test.tsx docs/specs/foundation-refactor.md
git commit -m "fix(ui): keep theme tokens when merging classes"
git push -u origin fix/cn-theme
gh pr create --base docs/phase-b-plan --title "fix(ui): keep theme tokens when merging classes" --body-file <body>
```

PR body - _What changes for a visitor_ (measured; every class change restores a type token, nothing else):

- **Eyebrow** (every page but AGB, Datenschutz, Impressum; also the 404): 16px/400 -> 12.8px/700, tracking
  0.12em, uppercase stays. Box height 26 -> 13px.
- **Lead** (page headers, section headers, CTA section on 8 routes, legal pages, 404, error page): 16px ->
  16.8px at 390px and 19.2px at 1280px. Reading widths are set in `em`, so lines get wider and break elsewhere.
- **Small text** (`Text size="small"`, CTA note, booker subtitle and slot hints, contact and payment notes):
  16px -> 14.72px.
- **Caption** (home hero note, booker footer note, the booking form's ready hint): 16px -> 12.8px.
- **h4** - the Discord card heading on `/ablauf` and the booker title on `/termin` and `/kontakt`: 16px/400 ->
  22.4px/700.
- **Booker controls** - calendar days, time chips, radio rows, the duration select value and options, the
  mobile menu's platform sub-links: 16px -> 14.72px.
- **Unchanged although the class returns:** `Address`, body-size `Text` with a tone, form inputs and the mobile
  nav links - they already inherited 16px/1.6.

_How to check:_ `/`, `/faecher`, `/ablauf`, `/preise`, `/ueber-mich`, `/online-lernen`, `/impressum`, `/404`
(any unknown path); `/termin` -> duration select -> a day -> a slot -> the form; `/kontakt` -> a day -> a slot;
the mobile menu at 390px -> "Online lernen". Light and dark, 390px and 1280px. Plus the two `text-lead` tables.
"Stacked on #<Task 0 PR> - merge after it."

---

### Task 2: Layout and motion bugs (spec B2)

**Branch:** `fix/layout-motion` from `fix/cn-theme`. **PR title:** `fix: animate the panels, close the navbar gap and land anchors below the header`.

**Files:**

- Modify: `packages/ui/styles/theme.css` (`pb-section-sm`, cursor rule)
- Modify: `packages/ui/src/utils.ts`, `packages/ui/src/utils.test.ts` (register `pb-section-sm`)
- Modify: `packages/ui/src/select.tsx:271`, `packages/ui/src/accordion.tsx:74`
- Modify: `apps/marketing/src/components/layout/navbar.tsx` (breakpoints, dropdown transition)
- Modify: `apps/marketing/src/app/globals.css` (breakpoint tokens, header height, scroll padding)
- Create: `apps/marketing/src/lib/breakpoints.ts`, `apps/marketing/src/lib/breakpoints.test.ts`
- Create: `apps/marketing/e2e/helpers.ts`, `apps/marketing/e2e/motion.spec.ts`, `apps/marketing/e2e/layout.spec.ts`
- Modify: `apps/marketing/e2e/smoke.spec.ts` (import the helpers)
- Modify: `CLAUDE.md` (_Traps_), `apps/marketing/src/components/layout/theme-toggle.tsx` (comment only)

**Interfaces:**

- Consumes: `cn` from Task 1 and its drift test.
- Produces: `apps/marketing/e2e/helpers.ts` exporting `isolate(page: Page): Promise<void>`,
  `collectErrors(page: Page): string[]`, `stubAvailability(page: Page): Promise<void>` (moved verbatim from
  `smoke.spec.ts`); `DESKTOP_NAV_QUERY` in `apps/marketing/src/lib/breakpoints.ts`; Tailwind variants `nav:`,
  `max-nav:`, `nav-wide:`, `max-nav-wide:`. Task 4 uses the helpers and the variants.

**Background (measured in Chromium against the current build).** Tailwind 4.3.3 sets `translate-*` and `scale-*`
through the `translate`/`scale` properties. `transition-transform` compiles to
`transition-property: transform, translate, scale, rotate` and animates them; an explicit list such as
`transition-[opacity,transform]` does not. The select panel, the accordion answer and the navbar dropdown use
such lists, so only their opacity animates and the slide/scale jumps (`getAnimations()` shows only `opacity`).
The switch thumb uses `transition-transform` and already interpolates (2 -> 22px over 160ms). `max-[1079px]`
compiles to `width < 1079px` and `min-[1080px]` to `width >= 1080px`, so at 1079px neither applies: the open
mobile menu stays `sticky` instead of covering the screen. `pb-section-sm` generates no CSS. Nothing sets a
scroll offset, so every anchor lands under the 66-71px sticky header.

- [ ] **Step 1: Move the e2e helpers.** Create `apps/marketing/e2e/helpers.ts` with `isolate`, `collectErrors`
      and `stubAvailability` cut verbatim from `smoke.spec.ts` (keep their comments), each prefixed with
      `export`, and the import `import type { Page } from "@playwright/test";`. In `smoke.spec.ts` replace them
      with `import { collectErrors, isolate, stubAvailability } from "./helpers";` and keep
      `import { expect, test } from "@playwright/test";`. Run `just build && just smoke`. Expected: green,
      same test count as before.

- [ ] **Step 2: Write the failing motion spec.** Create `apps/marketing/e2e/motion.spec.ts`:

```ts
import { expect, test, type Locator } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";

type Motion = "translate" | "scale";

/**
 * Seek the running CSS transition of `property` on the element to its midpoint and
 * return the computed value there - or null when no transition runs for it.
 * A jumping property has no transition, so this separates "animates" from "jumps"
 * independently of timing.
 */
async function midpoint(element: Locator, property: Motion) {
  return element.evaluate((node, name) => {
    const transition = node
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === name,
      );
    if (!transition) return null;
    transition.pause();
    transition.currentTime =
      Number(transition.effect!.getTiming().duration) / 2;
    return getComputedStyle(node).getPropertyValue(name);
  }, property);
}

/** The y component of a computed `translate` value ("0px -1.37px" -> -1.37, "none" -> 0). */
function translateY(value: string) {
  if (value === "none") return 0;
  const [, y = "0px"] = value.split(" ");
  return Number.parseFloat(y);
}

test.beforeEach(async ({ page }) => {
  await isolate(page);
  await stubAvailability(page);
});

test("the duration select panel slides and scales in", async ({ page }) => {
  await page.goto("/termin");
  await page.locator('button[aria-haspopup="listbox"]').click();
  const panel = page.getByRole("listbox");
  const y = await midpoint(panel, "translate");
  const scale = await midpoint(panel, "scale");
  expect(y, "translate transition").not.toBeNull();
  expect(translateY(y!)).toBeGreaterThan(-4);
  expect(translateY(y!)).toBeLessThan(0);
  expect(scale, "scale transition").not.toBeNull();
  expect(Number(scale)).toBeGreaterThan(0.97);
  expect(Number(scale)).toBeLessThan(1);
});

test("an FAQ answer slides in", async ({ page }) => {
  await page.goto("/preise");
  const trigger = page.locator("main h3 > button[aria-controls]").first();
  await trigger.click();
  const panelId = await trigger.getAttribute("aria-controls");
  const answer = page.locator(`[id="${panelId}"] > div`);
  const y = await midpoint(answer, "translate");
  expect(y, "translate transition").not.toBeNull();
  expect(translateY(y!)).toBeGreaterThan(-4);
  expect(translateY(y!)).toBeLessThan(0);
});

test("the navbar dropdown slides in", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const trigger = page
    .getByRole("banner")
    .getByRole("button", { name: "Online lernen" });
  await trigger.click();
  const panel = trigger.locator("xpath=following-sibling::div");
  const y = await midpoint(panel, "translate");
  expect(y, "translate transition").not.toBeNull();
  expect(translateY(y!)).toBeGreaterThan(0);
  expect(translateY(y!)).toBeLessThan(8);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the select panel is at its end state at once", async ({ page }) => {
    await page.goto("/termin");
    await page.locator('button[aria-haspopup="listbox"]').click();
    const panel = page.getByRole("listbox");
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(resolve)),
    );
    expect(await panel.evaluate((node) => getComputedStyle(node).opacity)).toBe(
      "1",
    );
    expect(
      translateY(
        await panel.evaluate((node) => getComputedStyle(node).translate),
      ),
    ).toBe(0);
  });
});
```

- [ ] **Step 3: Run it to see it fail.**

Run: `just build && pnpm --filter @skillsite/marketing exec playwright test e2e/motion.spec.ts`
Expected: the three motion tests FAIL with "translate transition ... Received: null" (and "scale transition" for
the select); the reduced-motion test PASSES.

- [ ] **Step 4: Fix the three property lists.**
  - `packages/ui/src/select.tsx:271`: `"transition-[opacity,transform] ease-flow"` ->
    `"transition-[opacity,translate,scale] ease-flow"`.
  - `packages/ui/src/accordion.tsx:74`: `transition-[opacity,transform]` -> `transition-[opacity,translate]`.
  - `apps/marketing/src/components/layout/navbar.tsx:198`: `transition-[opacity,transform,visibility]` ->
    `transition-[opacity,translate,visibility]`.

- [ ] **Step 5: Run it to see it pass.** Same command as Step 3. Expected: 4 passed.

- [ ] **Step 6: Correct the trap wording.**
  - `CLAUDE.md`, _Traps_: replace the bullet starting "Tailwind v4 `translate-*` / `scale-*`" with:
    ``- Tailwind v4 `translate-*` / `scale-*` set the `translate` / `scale` properties, not `transform`.
`transition-transform` covers them; an explicit list such as `transition-[opacity,transform]` does not -
write `transition-[opacity,translate,scale]`. Verify every motion change in a browser (`e2e/motion.spec.ts`).``
  - `apps/marketing/src/components/layout/theme-toggle.tsx:122-127`: replace the comment (code unchanged) with:
    `// The indicator moves via an inline transform so its glide does not depend on
// Tailwind's translate utilities; either way the transition must list the
// property it animates.`

- [ ] **Step 7: Write the failing breakpoint test.** Create `apps/marketing/src/lib/breakpoints.test.ts`:

```ts
import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import { DESKTOP_NAV_QUERY } from "./breakpoints";

const globalsCss = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("the JS navbar query and the header height use the CSS nav breakpoint", () => {
  const token = /--breakpoint-nav:\s*([^;]+);/.exec(globalsCss)?.[1];
  expect(token).toBe("67.5rem");
  expect(DESKTOP_NAV_QUERY).toBe(`(min-width: ${token})`);
  expect(globalsCss).toContain(`@media (width >= ${token})`);
});
```

Run: `pnpm --filter @skillsite/marketing exec vitest run src/lib/breakpoints.test.ts`
Expected: FAIL - cannot resolve `./breakpoints`.

- [ ] **Step 8: One breakpoint token.**
  - Create `apps/marketing/src/lib/breakpoints.ts`:

```ts
/** Media query of the desktop navbar; mirrors `--breakpoint-nav` in app/globals.css (the test keeps them equal). */
export const DESKTOP_NAV_QUERY = "(min-width: 67.5rem)";
```

- In `apps/marketing/src/app/globals.css`, directly after the `@source` line, add:

```css
/* Navbar breakpoints (1080px / 1278px at the default font size). In rem so they
   sort among Tailwind's rem breakpoints; `nav:` / `max-nav:` never leave a gap. */
@theme {
  --breakpoint-nav: 67.5rem;
  --breakpoint-nav-wide: 79.875rem;
}
```

- In `navbar.tsx`: delete the local `DESKTOP_NAV_QUERY` constant (line 18) and add
  `import { DESKTOP_NAV_QUERY } from "@/lib/breakpoints";`. Replace with UTF-8-safe tools, in this file only:
  `max-[1079px]:` -> `max-nav:`, `min-[1080px]:` -> `nav:`, `min-[1278px]:` -> `nav-wide:`:

```bash
perl -CSD -pi -e 's/max-\[1079px\]:/max-nav:/g; s/min-\[1080px\]:/nav:/g; s/min-\[1278px\]:/nav-wide:/g' apps/marketing/src/components/layout/navbar.tsx
grep -rn '\[10[78][0-9]px\]\|\[1278px\]' apps packages --include=*.tsx --include=*.ts --include=*.css
```

Expected: the grep prints nothing. Run the breakpoint test again - PASS.

- [ ] **Step 9: `pb-section-sm`, header height, scroll padding, cursor.**
  - `packages/ui/styles/theme.css`, after `@utility pb-section { ... }`:

```css
@utility pb-section-sm {
  padding-bottom: clamp(2.25rem, 5vw, 3.5rem);
}
```

- `packages/ui/src/utils.ts`: `pb: [{ pb: ["section"] }]` -> `pb: [{ pb: ["section", "section-sm"] }]`;
  `packages/ui/src/utils.test.ts`: add `"pb-section-sm": "pb-4",` to `utilityConflicts` and
  `expect(cn("pb-section pb-section-sm")).toBe("pb-section-sm");` to the section-padding test. (Without these
  the drift test fails - run it once before adding them to see that.)
- `packages/ui/styles/theme.css`, inside `@layer base`, after the `:focus-visible` rule:

```css
/* Enabled buttons show the pointer; utilities (e.g. cursor-not-allowed) still win. */
button:not(:disabled),
[role="button"]:not([aria-disabled="true"]) {
  cursor: pointer;
}
```

- `apps/marketing/src/app/globals.css`, after the new `@theme` block:

```css
/* Height of the sticky header (logo row below `nav`, button row from `nav` on):
   anchors land below it instead of under it. */
:root {
  --header-height: 4.125rem;
}
@media (width >= 67.5rem) {
  :root {
    --header-height: 4.4375rem;
  }
}
@layer base {
  html {
    scroll-padding-top: var(--header-height);
  }
}
```

- [ ] **Step 10: Write the layout spec.** Create `apps/marketing/e2e/layout.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

import { isolate } from "./helpers";

/** Distance between the bottom of the sticky header and the top of the anchor target. */
async function gapBelowHeader(page: Page, id: string) {
  return page.evaluate((targetId) => {
    const header = document.querySelector("header")!.getBoundingClientRect();
    const target = document.getElementById(targetId)!.getBoundingClientRect();
    return target.top - header.bottom;
  }, id);
}

test.beforeEach(async ({ page }) => {
  await isolate(page);
});

for (const width of [390, 1280]) {
  test(`an anchor lands below the header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/faecher#faq");
    await expect
      .poll(() => gapBelowHeader(page, "faq"))
      .toBeGreaterThanOrEqual(-1);
    expect(await gapBelowHeader(page, "faq")).toBeLessThan(4);
  });
}

test("the open mobile menu covers the screen at 1079px", async ({ page }) => {
  await page.setViewportSize({ width: 1079, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menü" }).click();
  expect(
    await page
      .getByRole("banner")
      .evaluate((node) => getComputedStyle(node).position),
  ).toBe("fixed");
});

test("the desktop navigation takes over at 1080px", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Menü" })).toBeHidden();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Preise" }),
  ).toBeVisible();
});

test("enabled buttons show the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menü" });
  expect(
    await menuButton.evaluate((node) => getComputedStyle(node).cursor),
  ).toBe("pointer");
});

test("the quote on /ueber-mich has its bottom spacing", async ({ page }) => {
  await page.goto("/ueber-mich");
  const padding = await page
    .locator(".pb-section-sm")
    .first()
    .evaluate((node) => getComputedStyle(node).paddingBottom);
  expect(Number.parseFloat(padding)).toBeGreaterThan(0);
});
```

Run: `just build && pnpm --filter @skillsite/marketing exec playwright test e2e/layout.spec.ts`
Expected: PASS. Then prove each test can fail - one at a time, revert after each:
remove the `scroll-padding-top` line (anchor tests red), change `max-nav:fixed` back to `max-[1079px]:fixed`
(1079px test red), delete the cursor rule (pointer test red), delete `@utility pb-section-sm` (spacing test red).
If an anchor test is red with the rule in place because the header measures differently, read
`document.querySelector("header").offsetHeight` at both widths and set `--header-height` to that value in rem
(px / 16) - do not widen the tolerance.

- [ ] **Step 11: Reduced motion by hand.** In Chrome DevTools > Rendering > "Emulate prefers-reduced-motion:
      reduce", open the select, an FAQ answer and the navbar dropdown: each appears at once, anchors jump
      without smooth scrolling.

- [ ] **Step 12: Tick spec B2**, run `just check`, commit, push, open the PR.

The B2 box: tick it and add an indented line under it: `Select panel, accordion answer and navbar dropdown are
measured by e2e/motion.spec.ts; the switch thumb already interpolated (transition-transform covers translate)
and no route renders it - its story comes with C.`

```bash
git add -A packages/ui apps/marketing CLAUDE.md docs/specs/foundation-refactor.md
git commit -m "fix: animate the panels, close the navbar gap and land anchors below the header"
git push -u origin fix/layout-motion
gh pr create --base fix/cn-theme --title "fix: animate the panels, close the navbar gap and land anchors below the header" --body-file <body>
```

PR body - _What changes for a visitor_:

- **Select panel** (`/termin`, duration), **FAQ answers** (`/preise`, `/faecher`, `/ablauf`, `/online-lernen`),
  **navbar dropdown** "Online lernen" (>= 1080px): they now slide (4px / 4px / 8px) and the select also scales
  from 0.97 while fading; before, only the fade ran and the offset jumped.
- **`/ueber-mich`:** 36-56px more space under the navy quote (`pb-section-sm` generated no CSS before).
- **Exactly 1079px wide:** the open mobile menu covers the screen like at every other phone/tablet width.
- **Pointer cursor** on hover over every enabled button that lacked it: select trigger and options, month
  arrows, calendar days, time slots, the form's back button, chips, radio rows, theme buttons, menu button,
  mobile "Online lernen", testimonial arrows and dots.
- **Anchors** (`/faecher#faq`, `/kontakt#kennenlernen`, `/preise#but`, the skip link, doc "Auf dieser Seite"
  links) land directly below the sticky header instead of under it; so does the booker's scroll back to the
  top of its card.
- Unchanged: the switch (already animated, rendered nowhere); reduced motion still shows end states at once.

_How to check:_ the list above, each at 390px and 1280px, light and dark; resize across 1080px with the mobile
menu open; DevTools reduced-motion emulation. "Stacked on #<Task 1 PR> - merge after it."

---

### Task 3: Metadata (spec B3)

**Branch:** `fix/metadata` from `fix/layout-motion`. **PR title:** `fix(seo): drop the inherited canonical and route every page through pageMetadata`.

**Files:**

- Modify: `apps/marketing/src/lib/metadata.ts`
- Create: `apps/marketing/src/lib/metadata.test.ts`
- Modify: `apps/marketing/src/app/layout.tsx:26-54`, `apps/marketing/src/app/page.tsx`,
  `apps/marketing/src/app/not-found.tsx:9-12`, `apps/marketing/src/app/zahlung/page.tsx:17-20`
- Modify: `apps/marketing/e2e/smoke.spec.ts`

**Interfaces:**

- Consumes: `isolate` from `e2e/helpers.ts` (Task 2); `routes`, `SITE_URL`, `indexablePaths` from `@/lib/routes`.
- Produces:
  - `siteMetadata: Metadata` - the root layout's defaults (no canonical).
  - `pageMetadata(input: PageMetadataInput): Metadata` with
    `PageMetadataInput = { home: true } | { title: string; description: string; canonical: string } | { title: string; unlisted: true }`.

**Background.** The root layout declares `alternates: { canonical: "/" }`, which every route inherits unless it
sets its own. The nine static subpages and `/kontakt` set one through `pageMetadata`; `/zahlung` and the 404
declare a hand-written object and inherit `https://nachhilfe.leonweimann.de` as their canonical. Home inherits
everything and has no `og:url`. The fix removes the canonical from the layout and gives each kind of page one
branch of the helper (V10, V11). `alternates` and `openGraph` merge shallowly: a page that sets `openGraph`
replaces the layout's object entirely, so home restates the site card plus `url`. The root segment's
`opengraph-image.tsx` keeps priority over config images, so home's image stays the file-convention one.

- [ ] **Step 1: Capture the heads before the change.** On this branch before editing, `just build`, start
      `pnpm --filter @skillsite/marketing start -p 3100`, and dump the `<head>` of `/`, the nine subpages,
      `/kontakt`, `/zahlung?re=x&betrag=abc` and `/gibt-es-nicht` (title, meta description/robots,
      `link[rel=canonical]`, every `og:*` and `twitter:*`) into `<scratchpad>/head-before.txt`, one block per
      route. Use a small Node script with `fetch`; strip `<svg>...</svg>` first (icon `<title>`s).

- [ ] **Step 2: Write the failing unit test.** Create `apps/marketing/src/lib/metadata.test.ts`:

```ts
import { expect, test } from "vitest";

import { pageMetadata, siteMetadata } from "./metadata";

test("the site defaults declare no canonical", () => {
  expect(siteMetadata.alternates).toBeUndefined();
});

test("home gets its canonical and og:url and keeps the site card", () => {
  const metadata = pageMetadata({ home: true });
  expect(metadata.alternates).toEqual({ canonical: "/" });
  expect(metadata.title).toBeUndefined();
  expect(metadata.openGraph).toEqual({ ...siteMetadata.openGraph, url: "/" });
  expect(metadata.twitter).toBeUndefined();
});

test("a listed page echoes its copy into the social card", () => {
  const metadata = pageMetadata({
    title: "Preise",
    description: "Was eine Stunde kostet.",
    canonical: "/preise",
  });
  expect(metadata.alternates).toEqual({ canonical: "/preise" });
  expect(metadata.openGraph).toMatchObject({
    url: "/preise",
    title: "Preise – Nachhilfe Leon Weimann",
    description: "Was eine Stunde kostet.",
  });
  expect(metadata.twitter).toMatchObject({
    title: "Preise – Nachhilfe Leon Weimann",
  });
});

test("an unlisted page has no canonical, is noindex and keeps the site card", () => {
  const metadata = pageMetadata({ title: "Rechnung bezahlen", unlisted: true });
  expect(metadata).toEqual({
    title: "Rechnung bezahlen",
    robots: { index: false, follow: false },
  });
});
```

Run: `pnpm --filter @skillsite/marketing exec vitest run src/lib/metadata.test.ts`
Expected: FAIL - `siteMetadata` is not exported.

- [ ] **Step 3: The helper.** In `apps/marketing/src/lib/metadata.ts`:
  - Move the root layout's `metadata` object (`layout.tsx:26-54`) here as `export const siteMetadata: Metadata`,
    **byte-identical except** that the `alternates: { canonical: "/" },` line is removed. It needs
    `import { SITE_URL } from "@/lib/routes";` for `metadataBase`. Keep `brand` import. Pull its `openGraph`
    object out into `const siteOpenGraph = { ... } satisfies NonNullable<Metadata["openGraph"]>;` and use it as `openGraph: siteOpenGraph` - the home branch
    below spreads it without a null check.
  - Replace `PageMetadataInput` and `pageMetadata` with:

```ts
type PageMetadataInput =
  /** The home page: the site's default title, description and social card, plus its URL. */
  | { home: true }
  /** A listed page: own title and description, echoed into the social card. */
  | { title: string; description: string; canonical: string }
  /** An unlisted page (noindex, disallowed in robots.txt): no canonical, the site's social card. */
  | { title: string; unlisted: true };

/** The only way a route declares metadata; keeps search and social copy aligned. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  if ("home" in input) {
    return {
      alternates: { canonical: "/" },
      openGraph: { ...siteOpenGraph, url: "/" },
    };
  }

  if ("unlisted" in input) {
    return { title: input.title, robots: { index: false, follow: false } };
  }

  const { title, description, canonical } = input;
  const socialTitle = `${title} – ${brand.name}`;

  return {
    alternates: { canonical },
    title,
    description,
    openGraph: {
      type: "website",
      locale: "de_DE",
      url: canonical,
      siteName: brand.name,
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
    },
  };
}
```

Move the German strings with an editor or `perl -CSD`, never plain `sed`; afterwards
`git diff --word-diff apps/marketing/src/app/layout.tsx apps/marketing/src/lib/metadata.ts` must show the
strings unchanged. Run the unit test - PASS.

- [ ] **Step 4: Route every page through it.**
  - `app/layout.tsx`: `export const metadata: Metadata = siteMetadata;` (import from `@/lib/metadata`; drop
    imports that become unused).
  - `app/page.tsx`: add `import type { Metadata } from "next";`, `import { pageMetadata } from "@/lib/metadata";`
    and `export const metadata: Metadata = pageMetadata({ home: true });`.
  - `app/not-found.tsx`:
    `export const metadata: Metadata = pageMetadata({ title: "Seite nicht gefunden", unlisted: true });`
  - `app/zahlung/page.tsx`:
    `export const metadata: Metadata = pageMetadata({ title: "Rechnung bezahlen", unlisted: true });`
  - Check nothing else declares metadata by hand:
    `grep -rn "export const metadata\|generateMetadata" apps/marketing/src/app` - every hit uses `pageMetadata`
    or is `layout.tsx` (`siteMetadata`).

- [ ] **Step 5: Write the canonical guard.** Append to `apps/marketing/e2e/smoke.spec.ts` (add `SITE_URL` to the
      `../src/lib/routes` import):

```ts
for (const path of [
  ...indexablePaths,
  "/zahlung?re=x&betrag=abc",
  "/gibt-es-nicht",
]) {
  test(`${path} declares the root canonical only if it is the home page`, async ({
    page,
  }) => {
    await isolate(page);
    await page.goto(path);
    const canonicals = await page
      .locator('link[rel="canonical"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    if (path === "/") expect(canonicals).toEqual([SITE_URL]);
    else expect(canonicals).not.toContain(SITE_URL);
  });
}
```

Run: `just build && just smoke`. Expected: PASS. Prove it: put `alternates: { canonical: "/" },` back into
`siteMetadata`, rebuild, run - the `/zahlung` and `/gibt-es-nicht` tests are red; revert.

- [ ] **Step 6: Diff the heads.** Rebuild, dump the same routes to `<scratchpad>/head-after.txt`,
      `diff -u head-before.txt head-after.txt`. Expected - exactly these lines differ, nothing else:
  - `/`: `+ og:url https://nachhilfe.leonweimann.de`
  - `/zahlung?...`: `- canonical https://nachhilfe.leonweimann.de`
  - `/gibt-es-nicht`: `- canonical https://nachhilfe.leonweimann.de`

  Put the diff in the PR body.

- [ ] **Step 7: Tick spec B3**, `just check`, commit, push, open the PR.

```bash
git add apps/marketing docs/specs/foundation-refactor.md
git commit -m "fix(seo): drop the inherited canonical and route every page through pageMetadata"
git push -u origin fix/metadata
gh pr create --base fix/layout-motion --title "fix(seo): drop the inherited canonical and route every page through pageMetadata" --body-file <body>
```

PR body: _What changes_ - the three-line head diff (V10, V11); every other route's `<head>` is identical.
_How to check:_ view-source (or DevTools > Elements > `<head>`) of `/`, `/preise`, `/zahlung?re=x&betrag=abc`
and any unknown path: canonical and `og:url` as in the diff. Nothing on the pages themselves changes.
"Stacked on #<Task 2 PR> - merge after it."

---

### Task 4: Accessibility without widget rebuilds (spec B4)

**Branch:** `fix/a11y` from `fix/metadata`. **PR title:** `fix(a11y): name the controls, mark the current page and close the menu with Escape`.

**Files:**

- Modify: `apps/marketing/src/components/layout/navbar.tsx`
- Modify: `apps/marketing/src/components/layout/theme-toggle.tsx:141-153`
- Modify: `packages/ui/src/select.tsx` (`hideLabel`)
- Create: `packages/ui/src/select.test.tsx`
- Create: `apps/marketing/src/content/booking.ts`
- Modify: `apps/marketing/src/components/booking/booker.tsx:347-358`
- Modify: `apps/marketing/src/app/online-lernen/page.tsx:53,106`
- Modify: `apps/marketing/src/app/preise/page.tsx:166`, `components/layout/ios-toolbar-tint.tsx:81`,
  `components/docs/doc-components.tsx:60,77,164,237,263,274`
- Modify: `packages/config/eslint/next.mjs`
- Create: `apps/marketing/e2e/a11y.spec.ts`

**Interfaces:**

- Consumes: `isolate`, `stubAvailability` from `e2e/helpers.ts`; the `nav:` variants and `DESKTOP_NAV_QUERY`
  from Task 2.
- Produces: `Select` prop `hideLabel?: boolean`; `bookerText.durationLabel` in `content/booking.ts`.

- [ ] **Step 1: Write the failing keyboard and name spec.** Create `apps/marketing/e2e/a11y.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";

test.beforeEach(async ({ page }) => {
  await isolate(page);
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the theme buttons have names", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Farbschema wählen" });
    await expect(group.getByRole("button", { name: "Hell" })).toBeVisible();
    await expect(group.getByRole("button", { name: "Dunkel" })).toBeVisible();
  });

  test("Escape closes the menu and returns focus to its button", async ({
    page,
  }) => {
    await page.goto("/preise");
    const menuButton = page.getByRole("button", { name: "Menü" });
    await menuButton.click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();
  });

  test("the mobile menu marks the current page", async ({ page }) => {
    await page.goto("/preise");
    await page.getByRole("button", { name: "Menü" }).click();
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Preise" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      banner.getByRole("link", { name: "Ablauf" }),
    ).not.toHaveAttribute("aria-current");
  });

  test("a section link is never the current page", async ({ page }) => {
    await page.goto("/online-lernen");
    await page.getByRole("button", { name: "Menü" }).click();
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Online lernen" })
      .click();
    const links = page.locator("#mobile-platform-nav a");
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(
      page.locator('#mobile-platform-nav a[href*="#"]'),
    ).not.toHaveAttribute("aria-current");
  });
});

test("the desktop navigation marks the current page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/preise");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: "Preise" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("the platform disclosure is a disclosure, not a menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const trigger = page
    .getByRole("banner")
    .getByRole("button", { name: "Online lernen" });
  await expect(trigger).not.toHaveAttribute("aria-haspopup");
  const panelId = await trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  await expect(page.locator(`[id="${panelId}"]`)).toHaveCount(1);
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("the duration select is named", async ({ page }) => {
  await stubAvailability(page);
  await page.goto("/termin");
  await expect(
    page.getByRole("button", { name: /^Dauer: \d+ Minuten$/ }),
  ).toBeVisible();
});

test("the Discord buttons are named by their text only", async ({ page }) => {
  await page.goto("/online-lernen");
  await expect(
    page.getByRole("link", { name: "Server beitreten", exact: true }),
  ).toHaveCount(2);
});
```

Run: `just build && pnpm --filter @skillsite/marketing exec playwright test e2e/a11y.spec.ts`
Expected: every test FAILS. If one passes already, check its selector against the page before going on (a green
test here proves nothing).

- [ ] **Step 2: Theme button names.** `theme-toggle.tsx`, on the `<button>` of the segment (line ~141): add
      `aria-label={label}` (the existing `label` of `themeOptions`, "Hell"/"Dunkel"). Visible text unchanged.

- [ ] **Step 3: The select gets a hidden label.** Create `packages/ui/src/select.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Select } from "./select";

afterEach(cleanup);

const options = [{ value: 60, label: "60 Minuten" }];

test("a hidden label still names the trigger and the list", () => {
  render(
    <Select
      label="Dauer"
      hideLabel
      value={60}
      options={options}
      onChange={() => {}}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Dauer: 60 Minuten" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("listbox", { hidden: true, name: "Dauer" }),
  ).toBeTruthy();
  expect(screen.queryByText("Dauer")).toBeNull();
});

test("a visible label is shown above the value", () => {
  render(
    <Select label="Dauer" value={60} options={options} onChange={() => {}} />,
  );
  expect(screen.getByText("Dauer")).toBeTruthy();
});
```

Run `pnpm --filter @skillsite/ui exec vitest run src/select.test.tsx` - FAIL (`hideLabel` unknown, "Dauer"
rendered). Then in `select.tsx`: add to `SelectProps`

```ts
  /** Accessible name of the trigger and the list; shown as the eyebrow unless `hideLabel`. */
  label: string;
  /** Keep the label for assistive technology only. */
  hideLabel?: boolean;
```

(replacing the old `label` doc comment), destructure `hideLabel = false`, and render the eyebrow span's content
as `{hideLabel ? null : label}` - **keep the span itself**: removing it drops the `gap-0.5` and moves the value.
Run the test - PASS.

- [ ] **Step 4: The booker passes the name.** Create `apps/marketing/src/content/booking.ts`:

```ts
/** Texts of the booker that are not part of an event's configuration. */
export const bookerText = {
  /** Accessible name of the duration select (not shown). */
  durationLabel: "Dauer",
} as const;
```

In `booker.tsx`, the `<Select`: `label=""` -> `label={bookerText.durationLabel} hideLabel`, plus
`import { bookerText } from "@/content/booking";`.

- [ ] **Step 5: `aria-current` and the disclosure** in `navbar.tsx`:
  - After `isActive`, add:

```ts
/** `aria-current` for a page link; a `#section` link never is the current page. */
function currentPage(pathname: string, href: string) {
  return !href.includes("#") && isActive(pathname, href) ? "page" : undefined;
}
```

- Add `aria-current={currentPage(pathname, item.href)}` to the desktop `LinkButton` in `DesktopNav`, the
  dropdown's `LinkButton` in `PlatformDropdown` (give `PlatformDropdown` a `pathname: string` prop and pass
  it from `DesktopNav`), and both mobile `Link`s in `MobileMenu`.
- `PlatformDropdown`: delete `aria-haspopup="true"`; add `const panelId = useId();` (import `useId` from
  `react`), `aria-controls={panelId}` on the `Button`, `id={panelId}` on the panel `div` (the one with
  `invisible absolute ...`).

- [ ] **Step 6: Escape closes the mobile menu** in `NavbarContent`:

```tsx
const menuButtonRef = useRef<HTMLButtonElement>(null);

// Escape closes the mobile menu and hands focus back to its button.
useEffect(() => {
  if (!open) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    setOpen(false);
    menuButtonRef.current?.focus();
  };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [open]);
```

and `ref={menuButtonRef}` on the menu `<button>`. (The `PlatformDropdown` listener only exists at desktop
width, where `open` is always false - no double handling.)

- [ ] **Step 7: Discord icons.** `online-lernen/page.tsx:53` and `:106`:
      `<SiDiscord className="size-4" />` -> `<SiDiscord className="size-4" aria-hidden />` (V13: the `<title>`
      stays). `social-links.tsx` already passes `aria-hidden`; leave it.

- [ ] **Step 8: One `aria-hidden` spelling.**
  - Add to `packages/config/eslint/next.mjs`, as a new config object after `...nextTs`:

```js
  {
    files: ["**/*.tsx"],
    rules: {
      // One spelling for hidden decoration: the shorthand `aria-hidden`.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='aria-hidden'][value.type='Literal'][value.value='true']",
          message: 'Write the shorthand `aria-hidden` instead of `aria-hidden="true"`.',
        },
        {
          selector:
            "JSXAttribute[name.name='aria-hidden'] > JSXExpressionContainer > Literal[value=true]",
          message: "Write the shorthand `aria-hidden` instead of `aria-hidden={true}`.",
        },
      ],
    },
  },
```

- Run `pnpm lint` - expected: 8 errors in `preise/page.tsx`, `ios-toolbar-tint.tsx`, `doc-components.tsx`.
- Rewrite them: `perl -CSD -pi -e 's/aria-hidden="true"/aria-hidden/g' <the three files>`.
- Run `pnpm lint` - expected: clean. `grep -rn 'aria-hidden="true"\|aria-hidden={true}' apps/*/src packages/ui/src` prints nothing.

- [ ] **Step 9: Run everything.** `just build && pnpm --filter @skillsite/marketing exec playwright test e2e/a11y.spec.ts` - expected: all pass. Then a keyboard pass by hand at 390px and 1280px: Tab through the header, open the
      menu, Tab, Escape (focus ring on the menu button is the only visible effect); open the "Online lernen"
      dropdown with Enter and close it with Escape. With VoiceOver (Cmd+F5) on `/termin` the duration select
      reads "Dauer: 60 Minuten". Nothing looks different.

- [ ] **Step 10: Tick spec B4** (it has no boxes - flip the spec's status line to "Phase B done" instead, since
      this is the last phase-B PR), `just check`, commit, push, open the PR.

```bash
git add -A apps/marketing packages docs/specs/foundation-refactor.md
git commit -m "fix(a11y): name the controls, mark the current page and close the menu with Escape"
git push -u origin fix/a11y
gh pr create --base fix/metadata --title "fix(a11y): name the controls, mark the current page and close the menu with Escape" --body-file <body>
```

PR body - _What changes_: nothing visible (V12, V13). For assistive technology: theme buttons are named below
1024px; the duration select is "Dauer: 60 Minuten"; header and mobile-menu links carry `aria-current="page"`;
Escape closes the mobile menu and focus returns to the menu button (its focus ring shows, as for any keyboard
focus); the "Online lernen" button is a disclosure (`aria-controls`, no `aria-haspopup`); the Discord buttons
are named "Server beitreten". Lint now enforces the shorthand `aria-hidden`.
_How to check:_ keyboard pass as in Step 9, light and dark, 390px and 1280px; VoiceOver on `/termin` and
`/online-lernen`. "Stacked on #<Task 3 PR> - merge after it."

---

## After phase B

- The spec's status line reads "Phase B done" (Task 4).
- The phase C plan (`docs/plans/foundation-refactor-phase-c.md`) starts with C1 (groups and explicit exports;
  CVA + Slot is C2) and must keep the `cn` drift test green: every token or `@utility` phase C adds is registered in
  `packages/ui/src/utils/cn.ts` (its path after C1).
