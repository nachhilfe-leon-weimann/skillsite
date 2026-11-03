# Spec: Foundation refactor (one UI system, one type scale, module structure - before the portal)

> Status: Accepted, 2026-09-25 - no slice started.
> This spec is also the decision record for the arc (no separate ADRs, decision V1): _Decisions_ and _Rules of
> the refactor_ carry the why. It builds on the monorepo arc (P0/P1 done: `apps/marketing`, `packages/config`,
> `packages/ui` + Storybook) and comes **before** the portal (`apps/portal`, `lernen.leonweimann.de`), which gets
> its own spec (phase F). Facts below were established by a read-only audit of `main` @ `72197da` (v1.2.0) on
> 2026-09-25, each finding checked by an independent verifier; the audit itself stays in the maintainer's local notes.

## Problem statement

The site works and looks right, but the code underneath is not a system the portal can build on:

- **The type scale is mostly not applied.** `cn` in [`utils.ts`](../../packages/ui/src/utils.ts) calls an
  unconfigured `twMerge`. tailwind-merge takes the theme's font-size utilities (`text-eyebrow`, `text-lead`,
  `text-small`, `text-caption`, `text-body`, `text-h4`, ...) for text colours and drops them whenever a colour
  class follows. About 82 call sites render without their declared size: `Text` 51 of 53, `Lead` 5 of 5,
  `Address` 1 of 1, `Eyebrow` 11 of 11, `Heading` 2 of 30, plus `Select`, the booking chips and radio rows, the
  calendar days and the mobile platform toggle. `text-lead` appears on no rendered page. The `Eyebrow` component
  renders at 16px/400 while eight hand-built eyebrows render the token (12.8px/700/0.12em) - both styles on
  almost every page. The same blind spot covers `shadow-card`, `bg-coral-gradient`, the motion utilities,
  `py-section*` and `max-w-page` (latent today).
- **Common UI is hand-built instead of shared.** `Card` is used 3 times while the same surface
  (`rounded-2xl border border-line bg-surface shadow-card`) is written out 12 times, plus 16 inset/subtle/doc/frame
  variants and 11 navy/coral/glass panels. Missing primitives: icon button (6 copies), icon badge (12 copies,
  7 sizes), centered state (7 uses, private to the booker), status page (3 identical copies), collapsible (2),
  dismiss logic (3), info row (5 variants), nav link (7 variants), text links (5 styles; `InlineLink` bypasses
  `next/link`). Variants are implemented four different ways; there is no CVA or Slot although both were decided
  in July 2026. Storybook covers 3 of 15 primitives.
- **Design values bypass the tokens.** 34 arbitrary `text-[...]`, 26 raw `text-xs`...`text-2xl`, 13 inline
  `color-mix(...)` (eight different coral percentages), 27 `white/*` modifiers with 15 alpha steps, 24 fluid
  `clamp()` spacings (16 values), 14 hex colours in TS, 7 custom shadows, 14 `em` reading widths. Token names
  mix roles (`bg`, `ink`, `line`) with hues (`navy`, `coral`); there is no semantic layer.
- **Three typography systems.** `Heading`/`Text`/`Lead` and `H1`/`H2`/`H3`/`P`/`Small`/`Muted` (with
  `variant: site | doc`) live in the same file; the legal pages add Tailwind's default scale. `Small` and
  `Muted` are identical and unused.
- **The structure hides the domains.** Booking is 22 files / 2,933 lines (~30 % of the app) spread over
  `lib/booking`, `components/booking` and `app/api`, server and isomorphic code unmarked; payment likewise.
  [`booker.tsx`](../../apps/marketing/src/components/booking/booker.tsx) is 865 lines with eight components
  inside. The consent subsystem (506 lines) renders nothing but its provider is still mounted. Routes carry
  most section markup inline (176 `className` attributes in `page.tsx` files against 65 in
  `components/sections`). Shell parts a second app needs (container, section, page header, theme provider,
  fonts, theme toggle, logo) live in `apps/marketing`.
- **Latent bugs.** `pb-section-sm` generates no CSS; four slide/scale transitions jump instead of animating
  (Tailwind v4 `translate`/`scale` longhands are not in the transition list); the navbar's custom breakpoint is
  spelled three ways with a 1px gap at 1079-1080px; `/_not-found` inherits the canonical `/`; anchor jumps land
  under the sticky header; the dialog has no focus trap, the calendar grid no semantics, radio groups no
  keyboard model, the theme buttons below `lg` no accessible name, the navigation no `aria-current`.
- **Tooling decided in July is missing:** Prettier, Vitest, MSW, Playwright, CVA + Slot, zod. The unit tests
  run on `node --test`, which cannot resolve the `@/` alias, so tested modules must be import-free and duplicate
  their constants. There is no env module and no `server-only` boundary.
- **The repo is hard to hand to agents.** No `CLAUDE.md`, all plans untracked, 8 of 9 open issues without a
  body, nothing that stops hand-tuned values from creeping back in.

## Goals

1. **One UI system.** Every recurring pattern is a component in `@skillsite/ui` with a variant API; pages
   compose components instead of repeating class strings.
2. **One type scale that works.** `cn` knows every theme utility; one typography API renders the scale as
   declared.
3. **Every design value is a token.** Today's values get names 1:1; nothing is rounded in phases A-D.
4. **A structure that shows the domains.** Real business domains are modules with a public API; pages stay
   pages; shared UI lives in one package with explicit exports. The same convention serves the portal.
5. **Nothing the visitor sees changes - except fixed bugs.** Pure refactors are pixel-identical; bug fixes land
   as their own `fix:` PRs that name the visible change.
6. **Ready for the portal.** `@skillsite/ui` carries layout, shell, primitives and accessible widgets; the
   portal starts from conventions, not from a copy of the marketing app.
7. **Ready for agents.** A versioned spec, a root `CLAUDE.md`, a test runner that understands the codebase,
   and a ratchet that keeps the design system enforced.

## Non-goals

- **New features and content changes.** Visible text stays word for word; moving strings into `content/*.ts`
  keeps them byte-identical. The only visible changes are the bug fixes of phase B and the widget fixes of C8.
- **Design consolidation during phases A-D.** Fewer icon-badge sizes, fewer white alphas, a WCAG-AA coral:
  that is phase E, pattern by pattern, with the maintainer's approval.
- **Portal code.** Phase F only writes the portal spec. MSW and the generated `packages/api-client` (both
  decided in July) come with the portal.
- **Security follow-ups of the booking action** (duration allow-list, POST timeout, redacted Cal errors,
  bounded rate-limit map, `cal-api-version`) - backlog without a date (decision S).
- **Visual-regression or screenshot tooling.** The maintainer checks the look by hand (decision E-12); the July
  decision against visual regression, git hooks, coverage gates and Renovate stands.
- **Tailwind class sorting** in Prettier (decision V2).
- **A package split** of `@skillsite/ui` and **a domain move** of the marketing site.

## Decisions

Decided by the maintainer; nothing here is reopened by an implementing agent.

| #        | Decision                                                                                                                                                                                                                     | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **R1**   | Cleanup first, portal after (supersedes O5 of the July plan; matches the June guardrail "foundation first").                                                                                                                 | 2026-09-25 |
| **R2**   | The reference is the declared design, not a render produced by a bug: "if the code is broken, it gets fixed" - even when the fix is visible. Pure refactors stay pixel-identical.                                            | 2026-09-25 |
| **E-01** | Scope beyond UI/typography/structure/tooling: decompose the booker (assessment 1.5), zod + env module (1.6/1.7), route robustness (1.8).                                                                                     | 2026-09-25 |
| **E-03** | Marketing structure is a **hybrid**: only real business domains become modules (`modules/booking`, `modules/payment`), with the portal's convention; everything else stays pages + sections.                                 | 2026-09-25 |
| **E-04** | Module shape for both apps: `modules/<domain>/{components/, server/, model/, index.ts, server.ts}` (see _Target shape_).                                                                                                     | 2026-09-25 |
| **E-05** | One-off page blocks live next to their route in `app/<route>/_components/`; `components/sections` holds blocks with two or more users.                                                                                       | 2026-09-25 |
| **E-06** | All domain-free layout and shell parts move to `@skillsite/ui` now: container, section, page header, status page, theme provider, fonts, theme toggle, logo.                                                                 | 2026-09-25 |
| **E-07** | `@skillsite/ui` is grouped into folders with an explicit export map (`@skillsite/ui/<group>/<name>`); stories are not exported; one package.                                                                                 | 2026-09-25 |
| **E-08** | Variants are named by role, not colour: `variant: primary                                                                                                                                                                    | secondary  | inverse | outline | ghost`, `tone: default | muted | inverse | accent`. Renamed by codemod together with the CVA switch. | 2026-09-25 |
| **E-09** | Also treated as bugs: missing `cursor-pointer` on raw buttons, keyboard/screen-reader behaviour (focus trap, Escape and focus return, arrow keys, names, `aria-current`), the anchor scroll offset, the metadata deviations. | 2026-09-25 |
| **E-10** | A design pass follows the refactor, before the portal (phase E).                                                                                                                                                             | 2026-09-25 |
| **E-11** | `Switch` stays (gets a story); `Dialog` stays (P1 list).                                                                                                                                                                     | 2026-09-25 |
| **E-12** | The maintainer checks look and content by hand; every PR states exactly what to check.                                                                                                                                       | 2026-09-25 |
| **E-13** | A ratchet script in `just check` keeps pattern counts from rising.                                                                                                                                                           | 2026-09-25 |
| **E-14** | Plans live versioned in `docs/specs/` (this file), conventions in the root `CLAUDE.md`; `docs/ref/` stays private.                                                                                                           | 2026-09-25 |
| **E-15** | Next's generated agent files are switched off (`agentRules: false`); the root `CLAUDE.md` is the only anchor.                                                                                                                | 2026-09-25 |
| **E-16** | Agents push feature branches and open PRs (dependent ones as a GitHub stack); **the maintainer merges**. Commits carry **no** `Co-Authored-By` trailer.                                                                      | 2026-09-25 |
| **E-17** | Execution: an orchestrator session hands independent slices to parallel, worktree-isolated agents; one PR per slice; slices that touch the same `@skillsite/ui` files run in sequence.                                       | 2026-09-25 |
| **E-21** | Accessible widgets: a time-boxed spike (Radix Primitives vs React Aria Components) first; the maintainer picks (gate C7).                                                                                                    | 2026-09-25 |
| **E-02** | Portal decisions other than E-21 are taken in the portal spec (phase F), against SkillForge as it is then.                                                                                                                   | 2026-09-25 |
| **S**    | Security follow-ups of the booking action: backlog, no date.                                                                                                                                                                 | 2026-09-25 |
| **V1**   | This spec is the decision record; no ADRs for the arc.                                                                                                                                                                       | 2026-09-25 |
| **V2**   | Prettier without Tailwind class sorting (sorting can change which conflicting class `twMerge` keeps).                                                                                                                        | 2026-09-25 |
| **V3**   | Dependabot ignores ESLint majors until `eslint-config-next` supports ESLint 10.                                                                                                                                              | 2026-09-25 |
| **V4**   | `Field` gets error and description slots; the booking keeps its visible error pattern for now.                                                                                                                               | 2026-09-25 |
| **V5**   | Module boundaries are enforced with `import/no-restricted-paths` (already installed) in the shared ESLint preset.                                                                                                            | 2026-09-25 |
| **V6**   | The env schema validates at server start (`instrumentation.ts`), not at import; build and CI stay env-free.                                                                                                                  | 2026-09-25 |
| **V7**   | Text that is still inline in routes moves to `content/*.ts` (June convention "texts live in content").                                                                                                                       | 2026-09-25 |
| **V8**   | This spec fixes the procedure of the design pass, not its outcome.                                                                                                                                                           | 2026-09-25 |
| **V9**   | The portal prerequisites known today are recorded here (phase F) so they are not lost.                                                                                                                                       | 2026-09-25 |

Earlier decisions this spec relies on (unchanged):

- **July 2026, "Quality: standard + workbench":** Prettier, hardened tsconfig (done), Vitest (unit in node +
  components in jsdom), MSW, Playwright smoke, CI expansion, Storybook, CVA + `@radix-ui/react-slot`.
  Explicitly **not**: git hooks, coverage gates, visual regression, Renovate.
- **July 2026:** delete the consent subsystem (Umami is cookieless). `@skillsite/ui` holds only domain-free
  code. No Tailwind preset: `theme.css` is the preset (PR #92).
- **June 2026:** build pages through the component API and the type scale, no hand-tuned clamps or magic numbers;
  texts live in `content/*.ts`; code, comments and identifiers in English, visible content in German.
- **Motion DNA** "choreography and calm": the motion tokens, `lift`, `Reveal` stay the vocabulary.

## Rules of the refactor

- **Pixel-identical by default.** A refactor slice changes no rendered pixel, text, `<head>` entry or behaviour.
  When two occurrences of a pattern differ (radius 16 vs 20px, `mb-4` vs `mb-5`, 12 vs 16 % tint), each keeps its
  value as a named variant or token. No rounding onto the nearest step - that is phase E.
- **What counts as a bug.** Code that does not do what it declares (a token dropped by `twMerge`, a class that
  generates no CSS, a transition that cannot run, a breakpoint gap) plus the cases of E-09. Bugs are fixed in
  their own `fix:` PR. When it is unclear whether something is a bug or a design choice, **stop and ask the maintainer**.
- **How the maintainer checks.** Every PR body carries a _How to check_ section: the routes and states to open (for
  example `/termin` -> duration -> calendar -> slot -> form), light and dark, a phone and a desktop width, and -
  for `fix:` PRs - the exact visible change to expect, with before/after screenshots. A PR whose check cannot be
  described in a few lines is too big; split it.
- **Commits and PRs.** Conventional messages; the PR title is the commit message on `main` (squash). Plumbing and
  refactors use `refactor:`, `chore:`, `ci:`, `build:`, `docs:`, `test:`; only user-visible fixes use `fix:`
  (they create patch releases). No `Co-Authored-By` trailer. Agents push branches and open PRs; the maintainer merges.

## Target shape

```
apps/marketing/src/
  app/                        routes only; one-off blocks in app/<route>/_components/
    api/booking/availability/route.ts   thin: calls modules/booking/server
  modules/
    booking/
      components/             booker parts, booking form, fields
      server/                 actions, cal client, availability, rate limit, log
      model/                  config, fields, zod schemas, mapping, dates, anti-spam, pricing
      index.ts                public API, client-safe
      server.ts               server entry, starts with import "server-only"
    payment/                  same shape (invoice link, log)
  components/
    sections/                 blocks used by two or more pages
  content/                    all visible text
  lib/                        cross-cutting: env, routes, metadata, seo, analytics, health
  instrumentation.ts          env validation at server start

packages/ui/
  styles/                     tokens, base, motion, components (css), imported in a fixed order
  src/
    primitives/               button, card, icon-button, icon-badge, tag, pill, check-list, info-row, links
    typography/               heading, text, lead, eyebrow, prose
    forms/                    field, select, radio-group, chips, switch
    overlays/                 dialog, popover
    layout/                   container, section, page-header, section-header, split, card-grid, status-page, centered-state
    shell/                    theme-provider, fonts, theme-toggle, logo
    motion/                   reveal, count-up, animated-check-mark, animated-height, collapsible
    hooks/
    utils/                    cn (configured twMerge)
  package.json                explicit exports: @skillsite/ui/<group>/<name>, @skillsite/ui/styles/*
```

**Module rules.** Outside a module, import only from `modules/<domain>` (the `index.ts`) or
`modules/<domain>/server` (the `server.ts`); never from deeper paths. `index.ts` never re-exports server code.
Modules do not import each other's internals. `app/` routes are thin: data and actions come from the module.
`packages/ui` imports nothing from an app. Enforced by `import/no-restricted-paths` in the shared preset (V5).

**Where things go.** Domain logic -> its module. A block used by one page -> `app/<route>/_components/`. A block
used by several pages -> `components/sections`. Anything domain-free that a second app could use ->
`@skillsite/ui`. Visible text -> `content/*.ts`.

**Tokens.** Three layers: raw values on `:root` (with dark overrides under `[data-theme="dark"]`) -> semantic
roles (`accent`, `inverse`, `on-accent`, `on-inverse`, ...) -> Tailwind utilities via `@theme`. Existing
utility names keep working during the arc; new code uses the semantic names. Every token namespace is
registered in the `cn` configuration with a unit test.

## Requirements

Each slice is one PR. _Check_ is what the maintainer looks at before merging.

### Phase A - Foundation

**A0 - This spec, versioned docs.**

- _Technique:_ `docs/.gitignore` ignores only the private folders (`ref/`, `security-audit-*/`, `wording/`);
  `docs/specs/foundation-refactor.md` is added.
- _Acceptance criteria:_
  - [ ] `git ls-files docs` lists `docs/.gitignore` and this spec, nothing from the private folders.

**A1 - Agent anchor.**

- _Technique:_ root `CLAUDE.md` in the SkillForge style (commands, layout, conventions, traps) with the
  conventions of this spec: module rules, `@skillsite/ui` public API, token layers, variant names, the refactor
  rules, commit/PR rules (no trailer, the maintainer merges), language. Traps section: bulk edits over German content only
  with UTF-8-safe tools (`perl -CSD`); delete `.next` before `dev` when CSS looks stale; Tailwind v4
  `translate`/`scale` are separate properties and need `transition-[translate]` etc.; next-themes
  `disableTransitionOnChange`; `next/font/google` needs network at build time; the iOS toolbar tint samples the
  `footer` element. `agentRules: false` in `next.config.ts` (E-15). README paths fixed
  (`apps/marketing/src/lib/...`).
- _Acceptance criteria:_
  - [x] `CLAUDE.md` exists at the root; `next dev` no longer creates `AGENTS.md`/`CLAUDE.md` in `apps/marketing`.
  - [x] Every path mentioned in README and `CLAUDE.md` exists.

**A2 - Delete the consent subsystem.**

- _Technique:_ remove `components/consent/*`, `providers/consent-provider.tsx`, `lib/consent.ts`, the
  `ConsentProvider` wrapper in the root layout and the commented-out references (footer). `Dialog` and `Switch`
  stay in `@skillsite/ui`.
- _Check:_ all pages render as before; the footer looks unchanged.
- _Acceptance criteria:_
  - [ ] `rg -il consent apps/marketing/src` lists only the booking form (its early-performance consent) and the
        testimonials comment; no file of the subsystem, no import, no commented-out reference is left.
  - [ ] `just check` green; the production CSS loses only the consent rules.

**A3 - Prettier.** _(before the parallel slices, it touches every file)_

- _Technique:_ Prettier with a shared config in `packages/config`, no Tailwind plugin (V2); one format-only PR;
  its commit hash in `.git-blame-ignore-revs`; `prettier --check` in `just check` and CI.
- _Check:_ none visible; the diff is whitespace/quotes/commas only.
- _Acceptance criteria:_
  - [x] `just check` fails on an unformatted file.
  - [x] Text and class attributes of the built HTML are identical before/after (build IDs and chunk hashes aside).

**A4 - Vitest.** _(closes #90)_

- _Technique:_ Vitest as the `test` task in every workspace: project `unit` (node) and project `components`
  (jsdom + Testing Library); path aliases resolved. Migrate the seven `node --test` files under
  `apps/marketing/src/lib` and the two under `tests/`. Drop the import-free rule for tested modules; tested code
  may import `@/...` again (consolidating the duplicated constants/log helpers happens in D6).
- _Acceptance criteria:_
  - [ ] `pnpm test` runs all former tests green; `node --test` is gone from every script.
  - [ ] A component test (e.g. `Button`) runs in jsdom in CI.

**A5 - CI and build hygiene.**

- _Technique:_ remove the transitional job _Lint and build_ from `ci.yml` (the ruleset only requires `check`);
  align the `turbo` version pinned in the `Dockerfile` with the workspace; a `typecheck` task (`tsc --noEmit`)
  for workspaces `next build` does not type-check (`packages/ui` incl. stories); Dependabot ignores ESLint
  majors (V3) and no longer drops patch updates when a major PR is closed.
- _Acceptance criteria:_
  - [ ] CI runs one job `check` = format, lint, typecheck, test, build, ratchet.
  - [ ] Docker image builds with the workspace's turbo version.

**A6 - Playwright smoke.**

- _Technique:_ Playwright against `next start` of a production build, in CI: every route of
  `apps/marketing/src/lib/routes.ts` plus `/zahlung` (valid and invalid query) and a 404 renders without console
  errors; the booker on `/termin` reaches the slot list with `/api/booking/availability` stubbed by `page.route`.
  Functional only, no screenshots.
- _Acceptance criteria:_
  - [ ] `just smoke` and CI run the suite green; breaking a route's render makes it red.

**A7 - Design ratchet.** _(E-13)_

- _Technique:_ `scripts/design-ratchet.mjs` counts, per pattern, occurrences in `apps/*/src` and `packages/ui/src`
  (stories excluded): arbitrary `text-[`, raw `text-(xs|sm|base|lg|xl|2xl)`, `color-mix(`, `shadow-[`,
  `rounded-[`, spacing `-[clamp(`, hex colours in TS/TSX, raw `<button`, inline `style={{`. Counts live in
  `design-ratchet.json`; a PR may lower but never raise them; exceptions by an allow-list with a reason. Part of
  `just check`.
- _Acceptance criteria:_
  - [ ] Adding one `text-[13px]` makes `just check` red; removing one and updating the file keeps it green.

### Phase B - Bug fixes _(visible; each PR shows before/after)_

**B1 - `cn` knows the theme.** _(first after A; everything in C builds on it)_

- _Technique:_ `extendTailwindMerge` with every theme namespace: font sizes (`display`, `h1`-`h4`, `title`,
  `eyebrow`, `lead`, `body`, `small`, `caption`), `shadow-card`, `bg-coral-gradient`, the motion durations,
  easings and animations, `py-section*`/`pt-section`/`pb-section`, `max-w-page`. A unit test per group.
- _Check (visible change, all routes):_ `Eyebrow` 16px/400 -> 12.8px/700/+0.12em; `Lead` 16px ->
  clamp(1.05rem, 1.6vw, 1.2rem); `Text size="small"`/`"caption"` 16px -> 0.92/0.8rem; `Address`; the headings on
  `/ablauf` and the booker title -> `h4`; booking chips, radio rows, calendar days, the mobile platform toggle ->
  `small`. Reading widths in `em` grow or shrink with their text, so line breaks move.
- _Acceptance criteria:_
  - [ ] `cn("text-eyebrow text-coral")` keeps both classes (test).
  - [ ] Built HTML contains `text-lead` wherever `Lead` is used.

**B2 - Layout and motion bugs.**

- _Technique:_ define `pb-section-sm` (used on `/ueber-mich`); make the four jumping transitions (select panel,
  accordion answer, navbar dropdown, switch thumb) animate what they declare - measure in a real browser before
  and after, the Tailwind v4 `translate`/`scale` trap is known to be subtle; one breakpoint token for the navbar
  (no gap at 1079-1080px); `cursor: pointer` for enabled buttons in the base layer; `scroll-padding-top` from
  the header height so anchors land below the sticky header. Reduced-motion stays honoured.
- _Check:_ `/ueber-mich` bottom spacing under the quote; open/close select, accordion, navbar dropdown; resize
  across 1080px; hover over the booking controls; jump to `#` anchors from the navigation.
- _Acceptance criteria:_
  - [ ] Each of the four transitions measurably interpolates (not a single-frame jump).

**B3 - Metadata.**

- _Technique:_ every page goes through one metadata helper (`pageMetadata`); `/_not-found` declares no canonical.
- _Check:_ `<head>` of every route (title, description, canonical, OG, Twitter, JSON-LD) - only the listed
  deviations change.
- _Acceptance criteria:_
  - [ ] No route renders `<link rel="canonical" href=".../">` except `/`.

**B4 - Accessibility without widget rebuilds.**

- _Technique:_ accessible names for the theme buttons below `lg` and the booker's duration select; `aria-current`
  on active navigation; Escape closes the mobile menu and focus returns to its button; one `aria-hidden` style;
  icons inside named links carry no `<title>`; the navbar platform disclosure drops `aria-haspopup`.
- _Check:_ keyboard pass through navbar and mobile menu; nothing looks different.

### Phase C - Design system in `@skillsite/ui`

**C1 - Groups and explicit exports.** _(move only)_

- _Technique:_ move files into the groups of _Target shape_; `package.json` exports each public module
  explicitly; stories not exported; rewrite imports in the apps.
- _Acceptance criteria:_
  - [ ] Importing a story or an unexported file fails to resolve.
  - [ ] Built CSS rules and the text and class attributes of the built HTML are identical (hashes aside).

**C2 - CVA, Slot and role names.** _(E-08)_

- _Technique:_ `class-variance-authority` and `@radix-ui/react-slot` in `@skillsite/ui`. `Button` gets `asChild`
  and replaces `LinkButton`/`buttonClasses`. Codemod the names: `Button` `primary`->`primary`,
  `navy`->`secondary`, `white`->`inverse`, `outline`->`outline`, `ghost`->`ghost`; `Tag` `coral`->`accent`,
  `navy`->`inverse`, `outline`->`outline`; `Logo onDark` -> `tone="inverse"`; `Text`/`Heading` tones follow the
  tone vocabulary. Variant maps are carried over 1:1 (same order base -> variant -> size -> `className`).
- _Acceptance criteria:_
  - [ ] Every rendered class attribute is unchanged (compare built HTML before/after).

**C3 - Token layer.**

- _Technique:_ semantic aliases (`--accent`, `--accent-2`, `--inverse`, `--on-inverse`, `--on-accent`, ...)
  without changing values; move `on-navy*`, `accent-blue`, `coral-light` into the raw layer. Name every value
  that is a token in disguise, 1:1: coral tints (8 %, 11 %, 12 %, 14 %, 16 %, 22 %, 35 %, 45 %), white alphas, the
  seven shadows, radii off the scale, reading widths, split-layout gaps, fluid section/panel spacings, z-index,
  focus ring. Role type tokens for the sizes outside the scale (step digits, stat figure, price, quote, card
  title, large button) and prose tokens for the legal pages (their current Tailwind-default values). Hex values in
  TS read from tokens where the runtime allows it.
- _Acceptance criteria:_
  - [ ] The ratchet counts for `color-mix(`, `text-[`, `shadow-[`, `rounded-[`, `-[clamp(` and hex drop to the
        allow-listed rest; computed styles unchanged.

**C4 - One typography API.**

- _Technique:_ `Heading` (`size`, `as`, `tone`), `Text` (`size`, `tone`, `as`), `Lead`, `Eyebrow` (`tone`, `dot`,
  `as`) and a `Prose` module for long legal text (`ProseH2`, `ProseH3`, `ProseP`, `InlineLink`) on the prose
  tokens. Remove `H1`-`H3`/`P` site variants, `Small`, `Muted`. Replace the hand-built eyebrows and raw headings.
  Fix heading levels semantically where the outline skips (`/faecher`) - visual size unchanged.
- _Acceptance criteria:_
  - [ ] `typography` exports one API; the ratchet shows no raw `text-(xs...2xl)` outside the allow-list.

**C5 - Layout and shell into the package.** _(E-06)_

- _Technique:_ `Container` (widths as named sizes), `Section` (spacing variants incl. `sm`), one `PageHeader`
  that also covers `SectionHeader` (spacings and stagger as props), `Split`, `CardGrid`; `ThemeProvider`
  (`next-themes` becomes a dependency of the package), `ThemeToggle`, `Logo`, fonts. First a spike: can
  `next/font` be called from the workspace package with identical `@font-face` and class output? If not, the app
  keeps the `next/font` call and the package owns the variable contract - report, do not improvise. Storybook
  loads the brand fonts.
- _Acceptance criteria:_
  - [ ] `apps/marketing/src/components/layout` keeps only marketing-specific parts (navbar, footer, iOS tint).
  - [ ] Built CSS/HTML identical apart from hashed font class names.

**C6 - Primitives from the duplicates.**

- _Technique:_ `Card` (tones and the inset/subtle/doc/frame variants; `asChild`; `Reveal as={Card}` for animated
  cards, no wrapper div), `IconButton`, `IconBadge` (size/shape/tone), `Pill` (or `Tag` sizes), `CheckList`,
  `InfoRow`, `CenteredState`, `StatusPage` (the three status pages), `Collapsible`, `AnimatedHeight`,
  `TextLink`/`ArrowLink`/`NavLink` on `next/link` with one external-link rule (`rel`, `target`). `Field` gets
  `error`, `description`, `required` slots (V4). Every current occurrence maps to a variant 1:1.
- _Acceptance criteria:_
  - [ ] No hand-built copy of these patterns is left outside the package (ratchet + grep list in the PR).

**C7 - Headless spike.** _(gate - the maintainer decides)_

- _Technique:_ time-boxed, in Storybook, brand look: Radix Primitives vs React Aria Components for dialog,
  dropdown menu, radio group, combobox and date picker. Criteria: accessibility, German date formats, fit with
  the motion tokens, bundle size, composition (`asChild` vs render props). Result: a short comparison in the PR;
  the spike code is thrown away.
- _Acceptance criteria:_
  - [ ] The maintainer has chosen; the choice is recorded in _Decisions_.

**C8 - Accessible widgets.** _(after C7)_

- _Technique:_ on the chosen base: `Dialog` (focus trap), `Select`, `Popover`/dropdown (one dismiss logic
  instead of three), `RadioGroup` and chips (arrow-key model, single-choice chips not deselectable by accident),
  `Switch`; the booker calendar grid gets grid semantics and arrow keys.
- _Check:_ the booker end to end by keyboard; select, navbar dropdown; look unchanged.

**C9 - Workbench coverage.**

- _Acceptance criteria:_
  - [ ] Every exported component has a story with its variants; Storybook builds in CI.

### Phase D - Marketing: structure and migration

**D1 - Modules.** _(E-03/E-04; may run parallel to C2-C6)_

- _Technique:_ move booking into `modules/booking` and payment into `modules/payment` in the E-04 shape;
  `server.ts` starts with `import "server-only"`; routes and the API handler import only the public entries;
  boundary rules in the shared ESLint preset (V5).
- _Acceptance criteria:_
  - [ ] A deep import (`modules/booking/server/...` from `app/`) fails lint; built output identical.

**D2 - Decompose the booker.** _(after C6)_

- _Technique:_ `useAvailability` (fetch, abort, month auto-advance), `BookingCalendar`, `TimeSlots`,
  `BookingResult`; pricing into `model/`; the generic helpers are already in the package (C6).
- _Check:_ `/termin` and `/kontakt`: both flows, empty month, `unconfigured` and `error` states.
- _Acceptance criteria:_
  - [ ] No component file in `modules/booking/components` exceeds 250 lines; the booking steps are covered by
        component tests.

**D3 - Env and zod.**

- _Technique:_ `lib/env.ts` (zod) per app, validated in `instrumentation.ts` `register()` at server start (V6);
  all `process.env` reads go through it (`CAL_API_KEY` is read in two places today). Booking validation on zod
  schemas derived from the field declarations - one source for client and server, typed errors.
- _Acceptance criteria:_
  - [ ] `next build` without `.env` is green.
  - [ ] `CAL_API_KEY` stays optional: without it the booker shows the `unconfigured` state exactly as today
        (decided June 2026). A variable that is present but malformed stops the server at start with a clear message.

**D4 - Route robustness.**

- _Technique:_ `loading.tsx`/`error.tsx` where a route segment needs them, `global-error.tsx`.
- _Acceptance criteria:_
  - [ ] A thrown error in a page renders the error boundary in the site's look.

**D5 - Page migration.** _(after C; one PR per route or route group)_

- _Technique:_ replace hand-built patterns by the package components; one-off blocks to
  `app/<route>/_components/`; inline text to `content/*.ts` (byte-identical, UTF-8-safe edits).
- _Check:_ the migrated routes, light/dark, phone/desktop - no visible change.

**D6 - Cleanup.**

- _Technique:_ one numbering registry for AGB and privacy; one log core for booking and payment; remove dead
  code and stray folders (`providers/`, `components/shared`); set the ratchet to its final counts; update
  `CLAUDE.md`.

### Phase E - Design pass _(E-10, V8)_

- _Procedure:_ per pattern (for example icon-badge sizes, white alphas, reading widths, eyebrow and doc labels,
  coral contrast to WCAG AA - white on coral is 2.84:1 today, AA needs 4.5:1), a PR-sized proposal with
  before/after; the maintainer approves or rejects each one. Approved consolidations collapse variants/tokens and lower the
  ratchet.

### Phase F - Portal kickoff

- Write the portal spec with the open portal decisions (start with real auth, views and route groups, #31,
  session store, data sources, domain, OpenAPI sourcing, status colours, typography density, analytics, 2.0.0).
- Prerequisites known today (V9):
  - SkillForge v0.5.0 (2026-09-25) ships the auth core (password login, refresh, revoke, `/auth/me`, invitation
    redeem) and a BFF contract; the July blocker of P4 is gone.
  - **Family login is the common case** (product requirement, 2026-09-25): usually one account per family, the parent's, which
    reaches the children through `PARENT_OF`/`PAYS_FOR`; features must not assume the logged-in person is the
    student; views revolve around a selected party.
  - No self-signup (SkillForge ADR 0008) - #31 needs a new meaning or closing.
  - Tokens stay on the server and skillsite uses no auth library, so the BFF needs a server-side session store
    (tension with the July rule "no DB in Next").
  - Open on the SkillForge side: #158 (password change, own sessions), #160 (`crm:write:own`), #161 (own
    relations and subjects), #163 (`Cache-Control: no-store` for secrets); no lessons/appointments/invoices yet.

## Timeline / phasing

```
A0 -> A1 -> A3 -> { A2, A4, A5, A6, A7 } -> B1 -> { B2, B3, B4 }
B1 -> C1 -> C2 -> C3 -> C4 -> C5 -> C6 -> C7 (gate) -> C8 -> C9
C1 -> D1 (parallel to C2-C6)          C6 -> D2        A4 -> D3 -> D4
C9 + D1-D4 -> D5 -> D6 -> E -> F
```

Slices touching the same package files run in sequence (E-17). A stacked PR is used only where a slice builds on
an unmerged one.

## Backlog (outside this spec)

- Security follow-ups of the booking action (decision S) and the hardening list (`poweredByHeader`, CSP).
- Privacy text vs. reality: SkillForge's database on Neon, log retention ("a few days" vs. size-based
  rotation), the booking/payment log lines, "IP at most 24 hours".
- Alerting channel for `blocked`/`failed` bookings; a test booking and an Umami cross-check after the phantom fix.
- #65 (images) and #83 (navigation animations) - scope first.

## Open questions

- **C7:** Radix Primitives or React Aria Components - after the spike.
- **Phase E:** each consolidation - the maintainer, per pattern.
- **Phase F:** the portal decisions listed there.

## Rules for implementing agents

- Follow the root `CLAUDE.md`; English in code, comments, specs and commits; German only in visible content.
- **Never change what a visitor sees in a refactor slice.** If a unification would move a pixel, keep the
  old value as a named variant. If a slice cannot stay pixel-identical, stop and report.
- **Bugs get their own `fix:` PR** with the visible change described; unclear bug-or-design cases go to the maintainer.
- **Never edit visible text** except moving it byte-identically into `content/*.ts`; bulk edits over German
  files only with UTF-8-safe tools.
- Every new theme utility is registered in the `cn` configuration with a test; never add a pattern the ratchet
  counts - lower the count instead.
- One PR per slice; `just check` green before every push; the PR body carries _How to check_. Push the branch
  and open the PR; **never merge**, never change repo settings, rulesets, the App or Dokploy - list needed
  settings in the PR. No `Co-Authored-By` trailer.
- Tick this spec's acceptance boxes in the PR that fulfils them; flip the status line when a phase is done.
