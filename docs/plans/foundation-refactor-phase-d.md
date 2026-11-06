# Foundation refactor: phase D (marketing structure and migration) and C9

> Status: Implementation plan, revised 2026-11-04. Implemented: every slice (D0-D6, C9) is done, ending with D6;
> the maintainer approved this plan before the first slice. C8 is on `main` (C8.1-C8.9, through #210); only the
> spec's manual C8.9 box stays open for the maintainer. The maintainer has answered the plan's questions
> (_Decisions for this phase_). The whole phase ships as one `gh stack` of 13 slice PRs on top of this plan's PR.
> Each slice below is one branch and one PR; implement only a dispatched slice, with its tests.

**Goal:** give the marketing app the module structure of E-03/E-04 (D1), a decomposed booker (D2), one env module
and zod validation (D3), error boundaries in the site's look (D4), pages built from `@skillsite/ui` with their text
in `content/` (D5), a final cleanup (D6) - and a story for every exported component (C9), which D5 waits for.

**Architecture:** booking and payment become `modules/<domain>/{components,server,model}` with a client-safe
`index.ts` and a `server.ts` that starts with `import "server-only"`; `import/no-restricted-paths` zones from the
shared ESLint preset enforce the entries (V5). The booker splits into hooks and step components on top of the C8
widgets. `lib/env.ts` parses the runtime environment with zod in `instrumentation.ts` (V6); booking input is
validated by zod schemas derived from the field declarations. Routes then shed their hand-built markup and inline
text, one route group per PR.

**Tech stack:** pnpm 12.4.2, Turborepo 2, Next.js 16.4.3 (App Router, `src/`), React 19.3, TypeScript 7, Tailwind
CSS 4.3, Vitest 5, Playwright 1.64, Storybook 10 (`@storybook/nextjs-vite`), Radix Primitives and React DayPicker
(from C8), zod 4 (new direct dependency in D3), `server-only` (new in D1a).

**Spec:** [`docs/specs/foundation-refactor.md`](../specs/foundation-refactor.md) - phase D, C9, _Target shape_,
_Rules of the refactor_, _Timeline / phasing_, _Rules for implementing agents_. The spec is binding; this plan
refines it and reopens no decision. Tests follow the contract in [`docs/testing.md`](../testing.md). Read the
[C8 plan](foundation-refactor-c8.md) for the widgets D2 builds on.

## Global constraints

- English in code, comments, identifiers, specs and commits; German only in visible content.
- Refactor slices are pixel-identical: no rendered pixel, text, `<head>` entry or behaviour changes. A slice that
  cannot stay identical stops and reports. Visible changes ship only in the slices marked `fix:` below.
- Visible text is never edited; moving it into `content/` keeps it byte-identical. Bulk edits over German files
  only with UTF-8-safe tools (`perl -CSD -pi -e ...`).
- Module rules (spec _Target shape_): outside a module, import only `@/modules/<domain>` or
  `@/modules/<domain>/server`; `index.ts` never re-exports server code; modules do not import each other's
  internals; `packages/ui` imports nothing from an app.
- Every new theme token or utility is registered in `cn` with a test; a ratchet count never rises; when one falls,
  run `just ratchet-update` and commit `design-ratchet.json`.
- Security follow-ups of the booking action stay in the backlog (decision S): no duration allow-list change, POST
  timeout, redacted Cal errors, bounded booking rate-limit map or `cal-api-version` change in any slice.
- Tests guard the contract of `docs/testing.md` on the layer it names; "nothing changed" evidence lives in the PR,
  never in the suites (its rule 4, _Verification toolkit_ below).
- `just check` green before every push. Commit with the PR title as message, **no trailer of any kind**. Never name
  the maintainer. Push and open the PR as part of the stack; never merge; never change repo settings, rulesets, the
  GitHub App or Dokploy.
- Tick the slice's spec acceptance boxes in the same PR. Scratch output (snapshots, logs, before-trees) goes only
  to the session scratchpad.

## Decisions for this phase

The maintainer's answers to the questions of the first draft. A slice that implements a lasting decision records
it in the spec in the same PR (named per slice below); this plan PR leaves the spec unchanged.

1. **D3 - a valid `CAL_API_KEY`** is non-empty, has no whitespace and starts with `cal_live_`. A present value that
   fails this stops the server at start. An empty or absent value stays "unconfigured", as today.
2. **D4 - `reset` on "Nochmal versuchen" is a bug.** D4r is certain and is its own `fix(errors):` PR.
   `global-error.tsx` sets a tab title from existing text: the eyebrow "Ein Fehler ist aufgetreten" in the site's
   title template. That title is a reversible default taken from the first draft's proposal.
3. **D5c - the WhatsApp button on `/zahlung` opens in the same tab on purpose.** It stays a raw anchor with a
   recorded exception, reason "intended by the maintainer" (see D5c for the mechanism).
4. **D5d - legal prose moves into JSX content modules** `content/legal/*.tsx`, byte-identical text. This extends the
   `content/*.ts` convention for legal texts only; D5d updates the places that document it.
5. **D6 - the parked testimonials stay** (`components/sections/testimonials.tsx`, `content/testimonials.ts`): real
   testimonials are planned. A reversible ruling.
6. The first draft's C9 timing question is moot: C8 is on `main`.

D4 and D4r are visible fixes beyond the spec's non-goal list ("the only visible changes are the bug fixes of phase
B and the widget fixes of C8"); the answers above accept them, and D4 adds them to that sentence.

## Review focus

1. **Server code in a client bundle.** A client-safe `index.ts` that re-exports from `server/`, or a client
   component that imports a server entry, ships secrets or fails the build late. D1a/D1b test that no `index.ts`
   imports `./server`, and `next build` proves `server-only` holds.
2. **A `CAL_API_KEY` that stops the server by accident.** CI runs without it; local smoke reads whatever the local
   `.env` holds; the toolkit and every agent run pin `CAL_API_KEY=` empty. An empty value means "unconfigured"
   today and after D3 (test case); only a present value outside the decided shape stops the server.
3. **A `loading.tsx` that breaks the payment redirect.** `redirect()` inside a streamed boundary becomes a
   client-side meta refresh instead of the 307 that `e2e/smoke.spec.ts` asserts. D4 adds no `loading.tsx`.
4. **zod validation that disagrees with today's rules at the edges** - whitespace-only text, a value exactly at
   `maxLength`, a choice that is not offered, an empty multi-chip array, a phone number with five digits, the order
   of the missing-field labels. D3 runs a characterization table against the current code before switching.
5. **A decomposed booker with different effect timing** - a stale month response after a fast duration change, an
   auto-advance bounce after manual navigation, a double fetch on mount. D2 tests `useAvailability` with a
   controllable `fetch` and aborts.

## Facts from the code (`main` @ `c17f9da`)

Verified by reading the tree; the spec's audit numbers are from `72197da` and some have moved since.

- **Booking** is 20 non-test files, 2,540 lines: `apps/marketing/src/lib/booking/` (`actions.ts` - the only
  `"use server"` module, `anti-spam.ts`, `availability.ts`, `availability-guard.ts`, `cal/client.ts`, `config.ts`,
  `dates.ts`, `fields.ts`, `log.ts`, `mapping.ts`, `rate-limit.ts`, `validation.ts`, plus tests for anti-spam,
  availability-guard and log), `apps/marketing/src/components/booking/` (`booker.tsx`, `booker-calendar.ts` (C8.8's
  month adapter, with a test), `booking-form.tsx`, `use-booking-form.ts`,
  `fields/{chips-field,radio-field,text-field}.tsx`) and `apps/marketing/src/app/api/booking/availability/route.ts`.
  Outside imports: `app/termin/page.tsx` and `app/kontakt/page.tsx` (`Booker`), the API route (`getAvailability`,
  the guard, `bookingEvents`).
- **Payment** is `apps/marketing/src/lib/payment/{invoice-link,log}.ts` (185 lines) plus two tests; the only
  consumer is `app/zahlung/page.tsx`. `README.md` names `apps/marketing/src/lib/payment/invoice-link.ts`.
  `AGENTS.md`'s _Where to look_ table names `components/booking/`, `lib/booking/` and `lib/payment/`; `CLAUDE.md`
  only imports `AGENTS.md` (#201), so every doc edit below goes to `AGENTS.md`.
- **`booker.tsx`** is 759 lines with five components: `Booker` (lines 84-436: state, the availability effect with
  abort and month auto-advance, the scroll effect, the submit flow, the sidebar and the step switch),
  `UnavailableNotice` (438-491), `SelectStep` (507-593, month header and the C8.8 `Calendar`), `TimeSlots`
  (595-628), `ResultStep` (639-759). `MAX_MONTH_OFFSET`, `EUR` and `dateLabel` sit at its top; the price
  (`slotPrice`) and `durationLabel` are locals inside `Booker` (about line 300). `booking-form.tsx` has 246 lines.
- **`process.env` reads in `apps/marketing/src`:** `CAL_API_KEY` in `lib/booking/availability.ts:51` and
  `lib/booking/cal/client.ts:12` (the two reads the spec names); `APP_VERSION` in `lib/health.ts:12` (inlined at
  build by `next.config.ts` `env`); `NODE_ENV` in `components/analytics/umami.tsx:20`; `health.test.mts` sets
  `APP_VERSION`. Outside `src`: `ALLOWED_DEV_ORIGINS` in `next.config.ts`, `CI` in both Playwright configs. No
  `instrumentation.ts`, no zod dependency (zod 4.6.5 is only transitive), no `server-only`. `.env.example` holds
  `CAL_API_KEY=API_KEY_HERE`, which the decided shape rejects.
- **Route files:** `app/error.tsx` (root segment, `StatusPage`, uses `reset`), `app/not-found.tsx`. No
  `loading.tsx`, no `global-error.tsx`. Two pages render per request: `/zahlung` (`force-dynamic`, a 307
  redirect) and `/kontakt` (awaits `searchParams` for `?fach=<anchor>`, which preselects the subject in the booker
  via `initialSubject`). Every other page is static. Next 16.3 made `retry` the stable recovery prop
  (`node_modules/next/dist/docs`, error.md); `global-error` must render its own `<html>`/`<body>`, styles and
  fonts. The site's title template is `title.template` in `lib/metadata.ts`.
- **Duplicated log helpers:** `lib/booking/log.ts` and `lib/payment/log.ts` each define `LEVEL`,
  `MAX_LOGGED_LENGTH = 64`, `loggable()`, the `[domain] outcome {json}` line and the drop-`undefined` loop. Other
  duplicates: `"Europe/Berlin"` literal in `mapping.ts` next to `BOOKING_TIMEZONE`; the generic failure sentence
  three times (`actions.ts:40`, `booker.tsx:267` and `:706`).
- **Numbering registries:** `content/agb.ts` (`agbSections`, `agbSectionNumber`, `agbSectionHeading`) and
  `content/privacy.ts` (`privacySections`, `privacySectionNumber`, `privacySectionHeading`) are identical code.
- **Stray code:** `providers/` no longer exists (removed with consent in A2). `components/shared/` holds
  `contact-address.tsx` (users: `/impressum`, `/datenschutz`). `components/sections/testimonials.tsx` has no live
  user (commented out in `app/page.tsx`). `useBodyScrollLock` (`packages/ui/src/hooks`) has had no consumer since
  C8.4; only the export map names it.
- **Sections with one user (E-05 candidates):** `benefit-grid` (`/`), `code-typewriter` (`/ueber-mich`),
  `whatsapp-qr` (`/kontakt`). All others have two or more.
- **Links on `/zahlung`:** both error-page actions are raw anchors inside `Button asChild` (`mailto:` and the
  WhatsApp URL). No lint rule and no ratchet pattern counts raw anchors; the link rule lives in `SmartLink`'s
  JSDoc and `AGENTS.md` _Conventions_.
- **Ratchet** (`node scripts/design-ratchet.mjs`, green): all counts 0 except `raw-button` 3 (`navbar.tsx`,
  `booker.tsx`, `testimonials.tsx`, one each) and `inline-style` 16 (`opengraph-image.tsx` 11, `animated-height.tsx`,
  `theme-toggle.tsx`, `booking-form.tsx`, `lesson-timeline.tsx`, `profile-photo.tsx`).
- **Stories** exist for `Button`, `Card` (one basic), typography (`Primitives/Typography`: `Heading` display-h4,
  `Lead`, `Text`), `Dialog`, `Popover`, `Select`, `RadioGroup`, `ChoiceChips`, `Switch` and `Calendar`. Storybook
  builds in CI through `just widgets`; widget tests reference story ids of `forms-*`, `overlays-*` and
  `primitives-button` only.
- **Test projects:** the marketing Vitest config has only the node project `unit` (`src/**/*.test.{ts,mts}`);
  `packages/ui` already runs `.test.tsx` in jsdom. `AGENTS.md` _Conventions_ lists the globs.
- **Moving parts outside this plan:** #217 (`fix(booking)`, open) edits `booker.tsx`, `lib/booking/dates.ts`, the
  `booker-calendar` test and both booking pages; #218 (open) prunes the browser suites to the contract. No slice
  relies on a test #218 removes; the page tests this plan names (the payment 307 and error page, the booker
  reaching the slot list, the booking keyboard path and availability states) survive it.

## CI and the local check

- `just check` locally stays the full suite (format, lint, typecheck, ratchet, test, build, smoke, widgets) and is
  green before every push, with `CAL_API_KEY=` pinned empty.
- CI (#215) scopes a pull request to its changed areas: Markdown and `docs/` get the format check alone;
  `apps/marketing` gets lint, unit tests, ratchet, build and smoke; `packages/ui` adds typecheck and the widget
  checks and also builds and smoke-tests the site; anything else (root config, `packages/config`, `scripts/`,
  `tests/`, the lockfile) runs the full suite. The Docker build runs when runtime inputs change. So D1a
  (`packages/config`) and D3 (lockfile) get the full run, C9 the UI scope, the D5 route PRs the website scope
  (D5.0 the UI scope).
- The release PR runs the full suite with every browser test three times: a flaky test a slice adds surfaces
  there, after the stack has merged. A slice that adds a browser test therefore runs it locally with
  `--repeat-each=3` (`pnpm --filter @skillsite/marketing e2e` or `pnpm --filter @skillsite/ui widgets`) and puts
  the number in its PR.

## PR sequence: one stack

Kind: **R** refactor, pixel-identical; **F** `fix:` with a described visible change; **T** tests/workbench only.
The phase is one linear `gh stack`: position 1 is this plan's PR, each slice stacks on the one above it, and the
maintainer merges bottom-up. Each PR body starts with "Stacked on #N - merge after it." and "Part of #140." (C9:
"Part of #139."). Review per `AGENTS.md`: **deep** for booking, payment and log paths and for visible fixes, so a
session that did not write the code reviews it first; **evidence** for the rest. The two moves (D1a, D1b) are
evidence: their bodies stay byte-identical, and the per-file rename proof is their review.

| Pos | Slice | Branch                                 | Conventional PR title                                                    | Kind | Review   |
| --: | ----- | -------------------------------------- | ------------------------------------------------------------------------ | ---- | -------- |
|   1 | D0    | `docs/phase-d-plan`                    | `docs: plan phase d and c9`                                              | -    | evidence |
|   2 | D1a   | `refactor/payment-module`              | `refactor(payment): move payment into a module with enforced boundaries` | R    | evidence |
|   3 | D3    | `refactor/env-zod`                     | `refactor: read env through one module and validate with zod`            | R    | deep     |
|   4 | D4    | `fix/route-errors`                     | `fix(errors): render root layout errors in the site's look`              | F    | deep     |
|   5 | D4r   | `fix/error-retry`                      | `fix(errors): retry the failed segment from the error page`              | F    | deep     |
|   6 | D1b   | `refactor/booking-module`              | `refactor(booking): move booking into a module`                          | R    | evidence |
|   7 | D2    | `refactor/booker-decompose`            | `refactor(booking): decompose the booker`                                | R    | deep     |
|   8 | C9    | `test/ui-stories`                      | `test(ui): a story for every exported component`                         | T    | evidence |
|   9 | D5.0  | `refactor/ui-page-patterns`            | `refactor(ui): name the last page values and add a step number`          | R    | evidence |
|  10 | D5a   | `refactor/pages-home-subjects-process` | `refactor(pages): migrate /, /faecher and /ablauf`                       | R    | evidence |
|  11 | D5b   | `refactor/pages-pricing-about-online`  | `refactor(pages): migrate /preise, /ueber-mich and /online-lernen`       | R    | evidence |
|  12 | D5c   | `refactor/pages-booking-status`        | `refactor(pages): migrate /termin, /kontakt and the status pages`        | R    | evidence |
|  13 | D5d   | `refactor/page-legal`                  | `refactor(legal): move the legal pages' text into content`               | R    | evidence |
|  14 | D6    | `refactor/phase-d-cleanup`             | `refactor: one log core, one legal numbering and the final ratchet`      | R    | deep     |

The 22 PRs of the first draft are consolidated, so the maintainer's hand checks (E-12) are fewer: C9a-C9c are one
C9 PR; D5.1-D5.9 become D5a (old D5.1-D5.3), D5b (D5.4-D5.6), D5c (D5.7 and D5.9) and D5d (D5.8); D6a and D6b are
one D6 PR. D1 stays split, so the payment module and the boundary rule land before the larger booking move; the
spec's D1 box is ticked in D1b. D4r stays apart from D4: each bug gets its own `fix:` PR (`AGENTS.md`), and D4's
visible change (layout errors) is a different one.

**Why this order.** It follows the spec timeline (`C9 + D1-D4 -> D5 -> D6`) and the hard dependencies: D1b moves
`schema.ts` (D3) and extends `boundaries.test.ts` (D1a); D2 builds on D1b's paths and D4's jsdom project; D4r
edits D4's files; D5.0 needs C9's coverage guard; D5c moves D2's `bookerText` and D4's `ErrorState` copy; D6 edits
D1's log files and D5d's legal pages.

**Independent in content, stacked only for order** (review each on its own diff): D1a, D3 and D4 touch disjoint
source files and share only plumbing (`package.json`, the lockfile, `eslint.config.mjs`, `vitest.config.mts`,
`AGENTS.md`). C9 touches only `packages/ui` stories, `.storybook/preview.tsx`, a node test, a widget test and one
line of `docs/testing.md`, nothing of D1-D4. D5a, D5b and D5d each own their routes and content files and depend
only on D5.0; D5c also needs D2 and D4r.

**Restacking.** After a merge, `gh stack sync` restacks the remaining branches onto the new `main` (with
`--force-with-lease`); then `just check` on every restacked branch before it is pushed. Conflicts during a restack:

- `pnpm-lock.yaml`: take `origin/main`'s lockfile, run `pnpm install`, commit the result.
- `design-ratchet.json`: take `origin/main`'s file, run `just ratchet-update`.
- Spec checkboxes: keep both ticks.
- Shared content files used by several routes (`content/site.ts`, `content/faqs.ts`, `content/subjects.ts`): a
  route PR only adds keys there, never edits or reorders existing ones, so keep both sides' additions.
- A file a slice moved (D1a, D1b, D5's `_components/`): git's rename detection carries edits from `main` onto the
  new path. Prove it per moved file with `diff <(git show origin/main:<old path>) <new path>`: only import lines
  differ. If #217 lands while D1b or D2 is open, this is how its booker and `dates.ts` edits reach the module.

## Verification toolkit (PR evidence)

Per `docs/testing.md` rule 4, "nothing changed" is shown in the PR, not by tests that stay in the suites. The
toolkit, temporary characterization tests and before/after runs live in the session scratchpad; their numbers go
into _How it was checked_, and nothing of them is committed. Committed tests guard a contract on the cheapest layer
that sees it (logic in node, component in jsdom, widget against the built Storybook, page against the production
build) and never restate `main`'s former output.

Pixel identity is proven as in phase C: copy `toolkit.sh`, `snapshot-html.mjs` and `compare-computed.mjs` from the
_Verification toolkit_ of [the phase C plan](foundation-refactor-phase-c.md) into the scratchpad, build a
before-tree from the slice's base commit and the after-tree, serve both with `CAL_API_KEY=` pinned empty, and run:

- **HTML:** `diff -r html-before html-after` - every element, attribute and text node of every route, `/zahlung`
  valid and invalid, and a 404, plus the served CSS. A refactor slice reports "no differences". Slices that move
  classes onto components (D5) may change class attributes only; they then also need the computed-style run.
- **Computed styles:** `compare-computed.mjs` (390 and 1280 px, light and dark, forced pseudo-states, the booker
  calendar and form scenarios, the open mobile menu and desktop popover) ends with `No differences.`. Its
  selectors follow the C8 widget roles (`radio` "Discord", the menu dialog, the popover trigger); keep every
  scenario.
- **Booker result scenario (D2, D5c):** submits the form with `CAL_API_KEY=` (the action stops before Cal with
  `[booking] Cal.com is not configured - booking not created.` in the server log and renders the generic failure);
  wait at least 3 s before submitting (time-trap) and restart both servers before each run (the action allows four
  attempts per IP per ten minutes).
- **Temporary characterization tests** (D2, D3, D4, D5c): written on the base commit, run before and after, deleted
  before the PR is opened.

Put the before/after numbers ("72 page states, ... No differences.") in the PR body. Never point a toolkit at a
port another agent uses; the toolkit's ports are 3110/3111, smoke uses 3100, widgets 6106.

---

## D1a - Payment module and boundary rule

**Files:** create `apps/marketing/src/modules/payment/{index.ts,server.ts,model/invoice-link.ts,server/log.ts}`
(moved from `lib/payment/`, tests move along as `model/invoice-link.test.mts` and `server/log.test.mts`); modify
`app/zahlung/page.tsx` (imports only), `packages/config/eslint/` (new `boundaries.mjs` next to `next.mjs`, whose
header comment "Module-boundary rules join here once ..." is updated to point at it),
`apps/marketing/eslint.config.mjs`, `packages/ui/eslint.config.mjs`, `apps/marketing/vitest.config.mts`,
`apps/marketing/package.json` (`server-only`), `pnpm-lock.yaml`, `README.md` (payment path), `AGENTS.md` (_Where to
look_). Test: `apps/marketing/src/modules/boundaries.test.ts`.

**Contracts**

- `modules/payment/index.ts` (client-safe): `parsePaymentRequest`, `buildPaypalUrl` and the types
  `PaymentRequest`, `PaymentRejection`, `ParsedPaymentRequest`.
- `modules/payment/server.ts`: first line `import "server-only";`, then `logPayment`, `describeLink`,
  `PaymentOutcome`.
- `packages/config/eslint/boundaries.mjs` exports `moduleBoundaries(appRoot: string)` and
  `packageBoundaries(packageRoot: string)`, each returning one flat-config object with
  `import/no-restricted-paths` zones (`basePath` = the given root). `moduleBoundaries` discovers the modules as the
  directories of `<appRoot>/src/modules/`; for each module it forbids imports of anything but `index.ts` and
  `server.ts` from every top-level entry of `src/` and from every other module. `packageBoundaries` forbids any
  import from `../../apps`. Messages name the rule ("Import modules/<name> through its index.ts or server.ts").
- **Risk to clear first:** the apps lint with ESLint 10.14, while `@skillsite/config` declares a peer of
  `eslint ^9` and `eslint-plugin-import` 2.32 targets ESLint 9 or lower (the lockfile resolves it against 9.39). A
  rule that silently never reports would pass every other check, which is why step 3 must see the test red for the
  right reason (a reported `import/no-restricted-paths`, not a crash or a missing rule). If the rule cannot run on
  ESLint 10, stop and report - switching plugins is a dependency decision for the maintainer.

1. Move the two payment files and their tests with `git mv`; rewrite the relative test imports and the page
   imports (`@/modules/payment`, `@/modules/payment/server`). Bodies stay byte-identical.
2. Add `server-only` to `apps/marketing` dependencies. Alias it to an empty stub in `vitest.config.mts` (a file
   next to the config, outside `src/`), so tests may import a server entry; the package's default entry throws
   outside the `react-server` condition.
3. Write `boundaries.test.ts` first (logic layer): it lints source text with ESLint's Node API
   (`new ESLint({ cwd: <app> })`, `lintText(code, { filePath })`) and asserts: `app/zahlung/page.tsx` importing
   `@/modules/payment/server/log` reports `import/no-restricted-paths`; importing `@/modules/payment/server` and
   `@/modules/payment` reports nothing; a file under `modules/payment/` may import its own `./server/log`;
   `packages/ui/src/x.tsx` importing `../../../apps/marketing/src/lib/routes` (a path that resolves -
   `no-restricted-paths` ignores unresolvable imports) is reported. Run it red, then add `boundaries.mjs` and wire
   both configs.
4. Add a test that no `modules/*/index.ts` contains an import or re-export from `./server` (string scan).
5. Fix `README.md` and `AGENTS.md`'s _Where to look_ row: `lib/` loses `payment/`, `src/modules/` (`payment/`) joins
   it with a pointer to the module rules (booking joins in D1b, once the folder exists).

**Acceptance**

- [x] `boundaries.test.ts` passes; `just lint` is green on the real tree. Evidence: the test fails when the zones
      are removed (probe, restored).
- [x] Evidence: HTML snapshot identical; the smoke payment tests (307 and the error page) green.
- [x] Every path in `README.md` and `AGENTS.md` exists.

## D3 - Env module and zod

**Files:** create `apps/marketing/src/lib/env.ts` (+ `env.test.ts`), `apps/marketing/src/instrumentation.ts`,
`apps/marketing/src/lib/booking/schema.ts` (+ `schema.test.ts`); modify
`lib/booking/{availability,validation,actions,fields}.ts`, `lib/booking/cal/client.ts`, `lib/health.ts`,
`components/analytics/umami.tsx`, `apps/marketing/eslint.config.mjs`, `apps/marketing/package.json` (`zod`),
`pnpm-lock.yaml`, `.env.example` (placeholder `API_KEY_HERE` -> `CAL_API_KEY=` plus a comment on the shape, so a
copied example never stops `just dev`), `README.md` (env paragraph), `AGENTS.md` (env rule). Spec: both D3 boxes,
and the key shape (decision 1) in the D3 acceptance text.

**Contracts**

- `lib/env.ts` starts with `import "server-only";` and never parses at import time (V6).
  - `parseServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv` with
    `ServerEnv = { CAL_API_KEY?: string }`. Only the empty string is absent - exactly today's
    `process.env.CAL_API_KEY || null`. Any other value must match `^cal_live_\S*$` (decision 1; whitespace-only and
    any other prefix included); otherwise it throws `EnvError`, whose message names the variable and the rule,
    never the value.
  - `serverEnv(): ServerEnv` - parses once and memoizes; the only accessor for runtime variables.
  - `appVersion(): string` (`process.env.APP_VERSION ?? "unknown"`, a literal member access so Next keeps inlining
    it) and `isProduction(): boolean` (`process.env.NODE_ENV === "production"`).
- `instrumentation.ts`: `export async function register()` - only when `process.env.NEXT_RUNTIME === "nodejs"`,
  dynamically imports `@/lib/env` and calls `parseServerEnv()`; on `EnvError` it logs `[env] <message>` and
  rethrows.
- `EMAIL_RE` and `PHONE_RE` move from `validation.ts` to `fields.ts` (the field primitives, which import nothing
  from the booking domain), so `schema.ts` and `validation.ts` both import them without a cycle; `toE164` stays in
  `validation.ts`. Update every importer (`rg -n 'EMAIL_RE|PHONE_RE' apps/marketing/src`).
- `lib/booking/schema.ts` imports `config.ts` and `fields.ts`, never `validation.ts`:
  - `fieldValueSchema(field: FieldDef)` and `bookingValuesSchema(event: BookingEventKey)`, derived from the field
    declarations (required/empty, `maxLength` on strings, `format` via `EMAIL_RE`/`PHONE_RE`, option whitelist,
    `multiple` -> `string[]`). Array versus string keeps today's results: an array passes on a plain text field
    and on a single-choice field whose entries are all offered, exactly as `isFieldValid` treats it now.
  - `bookingSubmissionSchema` checks **only what today's action checks**, with today's semantics: the event is an
    own key of `bookingEvents`, `slot` is truthy, `values` per field as above, and `agreements?.termsAccepted` /
    `agreements?.earlyPerformanceRequested` read as truthy flags. Everything else (`duration`, `honeypot`,
    `fillDurationMs`, unknown keys) passes through untouched (`.passthrough()` / loose objects): `duration` reaches
    Cal unvalidated today (`mapping.ts:93`), and validating it is the backlog's duration allow-list (decision S).
  - `checkBookingSubmission(submission: BookingSubmission, now?: number): BookingIssue | null` with
    `BookingIssue` the union of `{ check: "slot" }`, `{ check: "fields"; fields: string[] }`,
    `{ check: "terms" }` and `{ check: "withdrawal_notice" }`, returned in today's order.
  - **Malformed shapes.** Where today's code throws - `values` missing (`null`/`undefined`), a field value that
    is neither a string nor an array where `.trim()` is reached - `checkBookingSubmission` throws
    `MalformedSubmissionError` too. `requestBooking`'s existing catch turns it into today's outcome: a `failed`
    log line and the generic failure. Where today's code returns a result for odd input (an array on a text field,
    a non-empty non-string slot, a primitive or array `values` such as `"x"`, `5` or `[]`, which today yields the
    required-field labels as `rejected`/`validation`), the schema returns the same result.
- `validateBookingValues(event, values): string[]` keeps its signature and result (labels via
  `shortLabel ?? label`, declaration order); it now reads the schema, so `use-booking-form.ts` and
  `booking-form.tsx` stay untouched.

**Behaviour changes, all of them** (operator-facing only; a visitor on a correctly configured server sees none):

| Change                                                                  | Today                                                          | After D3                                                                                                                                                | Why it stays in a `refactor:` PR                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A present `CAL_API_KEY` outside the shape (not `cal_live_...`)          | server starts; Cal answers 401; booker shows error             | `next start` exits with an `[env]` line                                                                                                                 | The spec's D3 acceptance demands it; the shape is decision 1                |
| A whitespace-only `CAL_API_KEY`                                         | configured; Cal 401; error state                               | malformed: `next start` exits                                                                                                                           | A case of the row above; it never silently becomes `unconfigured`           |
| A malformed `CAL_API_KEY` in a local `.env`                             | `just dev`, `just smoke`, `just check` run; booker shows error | `next dev` exits too (`register()` runs in dev), stopping `just dev`; `just smoke` and so `just check` stop because `next start` reads the local `.env` | Same rule as row 1; the `[env]` line names the fix                          |
| A hand-made malformed submission (values null, a number as field value) | `failed` log with a `TypeError` text; generic error            | `failed` log naming the shape; same error                                                                                                               | Same outcome and message; only the `error` text inside the log line changes |

Anything beyond this table is a regression: stop and report.

1. Characterize first, in the scratchpad: a temporary table test runs inputs against the **current**
   `validateBookingValues` (both events; blank, whitespace-only, at and over each `FIELD_LIMITS` value, invalid
   e-mail, a five- and a six-digit phone, an option not offered, an empty and a mixed multi-chip array, a missing
   key; and hand-made shapes: `values` missing, `values: "x"`, `values: []`, a number as a field value, an array on
   a text field). Each row pins today's result - the label list, or "throws". Run it green on the base commit and
   again after the switch; its result goes into the PR, the file is not committed.
2. Commit `schema.test.ts` for the validation rules a visitor relies on (logic layer): required, blank and
   whitespace-only, exactly at and one over `maxLength`, e-mail, five versus six phone digits, an option not
   offered, multi-chip arrays, and the label order of missing fields. Quirks that only exist today (an array on a
   text field passes, `values: "x"` yields labels) stay in the step-1 evidence, not in the suite.
3. Add action tests for `checkBookingSubmission`: unknown event and empty slot -> `slot`; missing fields ->
   `fields` with the same labels; paid event without `termsAccepted` -> `terms`; a slot within the withdrawal
   period without `earlyPerformanceRequested` -> `withdrawal_notice`; the free event never needs agreements; a
   malformed shape never reaches Cal and ends in the generic failure.
4. Rewrite `processBooking` in `actions.ts` to call `checkBookingSubmission` after rate limit and anti-spam (same
   order as today) and map each issue to today's message and log `check` value. A malformed shape throws into
   the existing catch (see _Malformed shapes_). The PR body carries the behaviour-change table above.
5. Write `env.test.ts`: absent and `""` -> `{}`; `cal_live_` plus a synthetic suffix -> kept; `"  "`, a value with
   inner whitespace and another prefix -> `EnvError` without the value in its message; `serverEnv()` memoizes.
   Then replace both `CAL_API_KEY` reads with `serverEnv()`, and `health.ts`/`umami.tsx` with
   `appVersion()`/`isProduction()`. `health.test.mts` stays green unchanged.
6. Add `instrumentation.ts`. Measure in a production build (scratch only, synthetic values only): `CAL_API_KEY=`
   and no variable -> server starts, `/termin` shows "Online-Terminwahl gerade nicht verfügbar"; a malformed value
   -> `next start` exits non-zero within seconds with the `[env]` line, and `next dev` stops with the same line. If
   Next keeps serving after `register()` throws, call `process.exit(1)` after logging and say so in the PR. Note
   whether `next build` invokes `register()`.
7. ESLint: `no-restricted-properties` for `process.env` in `apps/marketing/src/**`, except `lib/env.ts`,
   `instrumentation.ts` and test files. `rg -n 'process\.env' apps/marketing/src` lists only those.
   `next.config.ts` and the Playwright configs stay outside the rule on purpose: they run in plain Node (before
   or beside the app), where `lib/env.ts`'s `server-only` import throws, and they read tooling variables
   (`ALLOWED_DEV_ORIGINS`, `CI`), not the app's runtime environment.
8. `zod` is a direct dependency of `apps/marketing` (current stable 4.x, recorded in the PR). Report the first-load
   JS of `/termin` and `/kontakt` before/after; zod reaches the client through `validation.ts`.
9. Mutation probes (booking validation costs data when wrong): drop the terms check, and loosen the key rule to
   accept another prefix; show the failing action and env tests, restore.

**Acceptance**

- [x] `next build` without `.env` is green (a fresh worktree has none) - spec box.
- [x] Without `CAL_API_KEY` the booker shows `unconfigured` exactly as today (evidence: HTML snapshot identical); a
      present value outside the decided shape stops `next start` with a clear message - spec box.
- [x] Schema, action and env tests green; the step-1 table identical before and after (evidence); every log line
      and user message of the action unchanged except the rows of the behaviour-change table.
- [x] `.env.example` and README state the variable is optional and what shape it needs.

## D4 - Route robustness

**Files:** create `apps/marketing/src/app/global-error.tsx`, `apps/marketing/src/app/_components/error-state.tsx`
(+ tests); modify `app/error.tsx`, `apps/marketing/vitest.config.mts` (project `components`: `src/**/*.test.tsx`,
jsdom, Testing Library), `apps/marketing/package.json` (`jsdom`, `@testing-library/react`,
`@testing-library/dom`, versions as in `packages/ui`), `pnpm-lock.yaml`, `AGENTS.md` (the Vitest globs line). Spec:
the D4 box, and the non-goal sentence on visible changes gains the D4/D4r fixes (_Decisions for this phase_).

**Rulings.** No `loading.tsx`. The static pages have nothing to wait for. The two per-request pages render in one
server pass without slow data: on `/kontakt` a fallback would only flash before the page, and on `/zahlung` a
streamed boundary would turn the 307 into a meta refresh. `global-error.tsx` shows the existing error copy - no
new text - without navbar and footer (the layout is what failed); it is a `fix:` because a root layout error
renders Next's bare default page today. `error.tsx` keeps `reset` in D4; the switch to `retry` is D4r.

1. First commit: add the `components` project. In the scratchpad, a temporary characterization test renders
   today's `app/error.tsx` and writes its `container.innerHTML`. Then extract the `StatusPage` into
   `ErrorState({ onRetry }: { onRetry: () => void })` and render it from `error.tsx` with `reset`; the rerun
   writes a byte-identical `innerHTML`. (The server HTML snapshot never reaches an error boundary, so this is the
   pixel-identity evidence for the extraction.)
2. `global-error.tsx` (`"use client"`) mirrors `layout.tsx`'s document:
   `<html lang="de" data-scroll-behavior="smooth" suppressHydrationWarning className={fontVariables}>`
   (`data-scroll-behavior` as in `layout.tsx`; next-themes sets `data-theme` early),
   `<body className="flex min-h-dvh flex-col">`, then `<ThemeProvider>` around
   `<main id="main" className="flex-1"><ErrorState onRetry={reset} /></main>`. It imports `./globals.css` after
   `@skillsite/ui/shell/fonts` (keep `layout-imports.test.ts`'s order rule satisfied). Its `<title>` is the eyebrow
   in the title template (decision 2): built from `ErrorState`'s eyebrow and `lib/metadata.ts`'s template, no new
   string. **If adding the `globals.css` import changes any route's stylesheet links or served CSS (HTML
   snapshot), stop and report.**
3. Component tests (jsdom) target `ErrorState`, not `global-error.tsx`: rendering `<html>` inside a Testing
   Library container only produces nesting warnings. Assert the heading "Da ist etwas schiefgelaufen.", that the
   retry button calls `onRetry` once, and that the contact link points to `/kontakt`. `global-error.test.tsx`
   checks the document with `renderToStaticMarkup` instead of a container (mock `@skillsite/ui/shell/fonts`, which
   calls `next/font` at import): `lang="de"`, the font classes, the body classes, the title and the `ErrorState`
   heading.
4. Manual proof in a scratch copy only (never committed): a client component that throws after a click, once
   inside a page (expect `error.tsx` inside navbar/footer) and once in the navbar (expect `global-error.tsx` with
   the brand fonts and the stored theme), in a production build, light and dark.

**Acceptance**

- [x] A thrown error in a page renders the error boundary in the site's look; a thrown error in the root layout
      renders `global-error.tsx` with fonts, styles, the stored theme and the tab title - spec box.
- [x] Evidence: all routes' HTML identical; the 307 smoke test green; no `loading.tsx` added.
- [x] PR body: the visible change (layout errors: bare Next page -> site error page with its tab title),
      screenshots light/dark.

## D4r - Retry from the error page

**Files:** `app/error.tsx`, `app/global-error.tsx`, the `ErrorState` and global-error tests.

`app/error.tsx` and `global-error.tsx` pass `retry` instead of `reset` to `ErrorState` (decision 2). Regression
test (component layer, `docs/testing.md` rule 2): the boundary's button calls `retry` once. Manual proof in a
scratch copy: a server component that throws once (a module-level counter) recovers on "Nochmal versuchen" with
`retry` and stays on the error page with `reset`. The scratch route must render per request (`await connection()`
in the component, or `export const dynamic = "force-dynamic"`): on a static page the throw fails the prerender in
`next build`. The PR body names exactly that change, with before/after of the scratch route.

## D1b - Booking module

**Files:** move with `git mv`, then rewrite imports:

| From (`apps/marketing/src/`)                       | To (`apps/marketing/src/modules/booking/`) |
| -------------------------------------------------- | ------------------------------------------ |
| `lib/booking/{config,fields,mapping,dates}.ts`     | `model/`                                   |
| `lib/booking/{anti-spam,validation,schema}.ts`     | `model/` (tests alongside)                 |
| `lib/booking/actions.ts`                           | `server/actions.ts`                        |
| `lib/booking/cal/client.ts`                        | `server/cal-client.ts`                     |
| `lib/booking/{availability,availability-guard}.ts` | `server/` (tests alongside)                |
| `lib/booking/{rate-limit,log}.ts`                  | `server/` (tests alongside)                |
| `components/booking/**` (incl. `booker-calendar`)  | `components/**`                            |

Create `index.ts`, `server.ts`, `server/availability-route.ts`; modify `app/api/booking/availability/route.ts`,
`app/termin/page.tsx`, `app/kontakt/page.tsx`, `boundaries.test.ts`, `AGENTS.md` (_Where to look_). `content/booking.ts`
stays.

**Contracts**

- `index.ts`: `export { Booker } from "./components/booker";` and what the pages need besides: `bookingToday`
  (#217 passes the server's day to the Booker), no types today.
- `server.ts`: `import "server-only";`, then re-exports `handleAvailabilityRequest` from
  `./server/availability-route`.
- `server/availability-route.ts`: `handleAvailabilityRequest(request: Request): Promise<Response>` - today's
  `GET` body verbatim, with the module-scope `AvailabilityRateLimiter` instance (same per-process semantics).
- `app/api/booking/availability/route.ts`: a one-line `GET(request)` that returns
  `handleAvailabilityRequest(request)`, and nothing else.
- Internal imports inside the module stay relative or `@/modules/booking/...`; the Booker keeps importing the
  `"use server"` action from `../server/actions` (inside the module, so allowed).

1. List `lib/booking/` and `components/booking/` again on the base (a merged #217 may have changed them) and move
   everything. File bodies change only in import lines (prove with the per-file `diff` from _Restacking_).
2. Extend `boundaries.test.ts`: `app/termin/page.tsx` importing `@/modules/booking/server/actions` or
   `@/modules/booking/components/booker` is reported; `@/modules/booking` and `@/modules/booking/server` are not;
   `modules/payment/x.ts` importing `@/modules/booking/model/config` is reported.
3. `rg -n 'lib/booking|components/booking' apps/marketing README.md AGENTS.md` returns nothing.

**Acceptance**

- [x] A deep import (`modules/booking/server/...` from `app/`) fails lint; built output identical - spec box
      (evidence: HTML snapshot, computed styles of the booker scenarios; smoke and the booking page tests green).
- [x] `next build` passes with `server-only` in both `server.ts` files; no `index.ts` imports `./server`.
- [x] `/kontakt?fach=mathematik` still preselects the subject in the booker form (`initialSubject`), as on `main`.

How to check: `/termin` (duration -> calendar -> slot -> form) and `/kontakt?fach=mathematik` (slot -> form, the
subject chip preselected), light/dark, 390/1280 px - nothing changes.

## D2 - Decompose the booker

**Files** (all under `apps/marketing/src/modules/booking/`): create the components `booker-aside`, `select-step`,
`booking-calendar`, `time-slots`, `booking-result`, `unavailable-notice` (`components/*.tsx`), the hooks
`use-availability` and `use-booking-submission` (`components/*.ts`), `model/pricing.ts`, tests next to each; modify
`components/booker.tsx`, `model/dates.ts`, `content/booking.ts`. Spec: the D2 box.

**Test environments.** D2 sits above D4 in the stack, so the marketing `components` project (`src/**/*.test.tsx`,
jsdom, Testing Library) exists. Before writing tests, confirm `apps/marketing/vitest.config.mts` lists it, or a
`.test.tsx` file matches no glob and silently never runs. Every test that renders or uses `renderHook` is a
`.test.tsx` (component layer), including `use-availability.test.tsx`; pure model tests (`pricing.test.ts`) stay
`.test.ts` (logic layer).

**Contracts** (keep the C8.8 calendar props as merged, and its manual month path)

- `useAvailability(event: BookingEventKey, duration: number, onFirstFreeDay: (date: string) => void)` returns
  `{ shown, monthOffset, availability, loading, status, changeMonth(delta: number), restartSearch(), retry() }`.
  It owns the fetch, the `AbortController`, `reloadKey` and the auto-advance ref; `changeMonth` switches
  auto-advance off and clamps to `0..MAX_MONTH_OFFSET`; `restartSearch` switches it on and reloads.
  `onFirstFreeDay` is held in a ref updated on every render and is **not** an effect dependency: the effect's
  dependencies stay today's (`event`, `duration`, the shown month, `reloadKey`, `monthOffset`). If #217 has landed,
  the hook also takes over its server-day hydration path unchanged: #217 has landed, so the hook takes a fourth
  argument, `renderedToday: string`, and also returns the booking day (`today`).
- `useBookingSubmission(event, duration)` returns `{ phase, error, submit(draft), retryBooking(), reset() }` - the
  `finalizeBooking` flow, `withFillDuration`, the three analytics events, unchanged.
- `model/pricing.ts`: `formatSlotPrice(config: BookingEventConfig, duration: number): string | null` and
  `durationLabel(config, duration): string`. `model/dates.ts` gains `formatDateLabel(dateKey: string): string`.
- `BookerAside`, `SelectStep`, `BookingCalendar` (month header plus the C8.8 `Calendar`), `TimeSlots`,
  `BookingResult` (today's `ResultStep`), `UnavailableNotice`: props are today's, markup moves verbatim.
- The booker's inline strings move to `bookerText` in `content/booking.ts`, byte-identical (entities as their
  characters, e.g. `&nbsp;` -> ` `).

1. Characterize first, in a temporary test in the scratchpad: render the whole `Booker` for both events (the
   `kennenlernen` form also with `initialSubject`, as `/kontakt?fach=` passes it; fetch stubbed, `requestBooking`
   mocked to each outcome: confirmed, slot_taken, rate_limited, blocked, too_fast, generic, rejected promise) and
   write each state's `container.innerHTML`. Run it on the base commit; it is the reference, never committed.
2. Write the committed tests for what the booking relies on: `use-availability.test.tsx` (mount fetches exactly
   once; a new `onFirstFreeDay` identity on rerender does not refetch; first-day callback; empty month advances
   until `MAX_MONTH_OFFSET` and stops; manual `changeMonth` into an empty month does not bounce; a duration change
   aborts the in-flight request and ignores its late answer; non-OK -> `error`; `retry` refetches once),
   `pricing.test.ts` (45/60/90 -> `"22,50 €"`, `"30,00 €"`, `"45,00 €"`; free event -> `null`),
   `booking-result.test.tsx` (title and actions per phase and reason, both events), `time-slots.test.tsx`,
   `unavailable-notice.test.tsx`, and `booker.test.tsx` (select -> form -> result with the action mocked). They
   assert what a visitor gets (states, names, announced results), not markup copied from `main`.
3. Extract hooks, then components, one commit each; after each commit the step-1 states are byte-identical.
4. `wc -l modules/booking/components/**/*.tsx` - every file at most 250 lines (`booking-form.tsx` included; split
   its field grouping into `field-groups.ts` if needed).
5. Run the toolkit with the booker scenarios plus the result scenario; smoke and the booking page tests green.
6. Mutation probe (the price is money): change one duration's price factor; `pricing.test.ts` fails; restore.

**Acceptance**

- [x] No component file in `modules/booking/components` exceeds 250 lines; the booking steps are covered by
      component tests - spec box.
- [x] Evidence: characterized states identical; HTML and computed styles identical on `/termin` and `/kontakt`
      (calendar, form, empty month, `unconfigured`, `error`, generic failure).
- [x] Evidence: network requests per flow unchanged (the availability queries of one scripted flow, before and
      after, listed in the PR).
- [x] `/kontakt?fach=mathematik` preselects the subject exactly as before (characterized state and the page test).

How to check: `/termin` -> duration -> calendar (month back/forward, an empty month) -> slot -> form -> submit
(generic failure without a Cal key); `/kontakt` and `/kontakt?fach=mathematik` -> slot -> form with the subject
preselected; the `unconfigured` state - light/dark, 390/1280 px, nothing changes.

## C9 - Workbench coverage

**Rules for every story file.** One `*.stories.tsx` next to its component, `title: "<Group>/<Name>"`, German
sample copy, no app imports. A `Variants` story renders every value of every CVA variant key (and boolean props
such as `Section surface`/`bleed`), inverse tones on an inverse surface; light and dark come from the toolbar.
Stories are never exported (`exports.test.ts`). Hooks, `utils/cn`, `tokens/colors` and `shell/fonts` are not
components and need no story (the preview already loads the fonts).

**Gap list** (exports without a story, or with an incomplete one, on `main` @ `c17f9da`; the C8 widget stories -
Dialog, Popover, Select, RadioGroup, ChoiceChips, Switch, Calendar - are audited, not rewritten):

| Group      | Component (variant keys to cover)                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primitives | `Card` (tone, radius, lift, surface incl. glass on inverse, `asChild`) - extend the existing story                                                                                       |
| primitives | `Tag` (tone), `Pill` (tone, size, `as`), `IconBadge` (layout, size, shape, tone), `IconButton` (size, surface, hover: border/none)                                                       |
| primitives | `CheckList` (size, tone), `CheckMark`, `InfoRow` (default, inverse, summary, doc), `Accordion`                                                                                           |
| primitives | `SmartLink`, `TextLink` (site, doc, underline, inverse, inverse-muted), `ArrowLink`, `NavLink` (menu, menu-sub, toc; active)                                                             |
| typography | `Heading` (every size incl. title/card-title/step-title, tone, wrap) and `Text` (size, tone, `Address`) - extend typography; `Eyebrow` (tone, dot), `Lead`, `ProseH2`/`ProseH3`/`ProseP` |
| forms      | `Field` (label, description, error, required) with `Input` and `Textarea`                                                                                                                |
| layout     | `Container` (size), `Section` (surface, bleed, spacing), `PageHeader` (variant, align, size), `Split` (align, gap, ratio)                                                                |
| layout     | `CardGrid` (gap, columns), `CenteredState`, `StatusPage`                                                                                                                                 |
| motion     | `Reveal` (rise, rise-soft, fade, settle; mount and in-view), `CountUp`, `AnimatedCheckMark`, `AnimatedHeight`, `Collapsible`                                                             |
| shell      | `Logo` (tone), `ThemeToggle` inside `ThemeProvider` (covers both)                                                                                                                        |

1. **Guard first** (logic layer): `packages/ui/src/stories.test.ts` (node) maps every exported `.tsx` module of
   `primitives`, `typography`, `forms`, `overlays`, `layout`, `motion`, `shell` to the component names it exports
   and asserts each name is imported by at least one `*.stories.tsx`. It fails on the base tree. Variant
   completeness stays a reviewed checklist in the PR (every key/value of the table ticked).
2. **Stories:** write the stories of the table; check each in `pnpm storybook` light and dark. `Reveal` and
   `CountUp` stories must reach their end state deterministically (the widget suite runs under reduced motion).
   Rename the existing `Primitives/Typography` story file into per-component files titled `Typography/Heading`,
   `Typography/Text`, ... (the `<Group>/<Name>` rule; no widget test references its story id). `ThemeToggle` would
   fight the preview decorator, which writes `data-theme` on every render: teach the decorator to skip that write
   when a story sets `parameters.ownsTheme: true`; the `ThemeToggle` story sets it and lets its `ThemeProvider` own
   the attribute. Audit the C8 widget stories against the rules above and add missing variants (e.g. Select
   `tone="inverse"`). The guard turns green.
3. **Render smoke** (widget layer): `packages/ui/e2e/stories.spec.ts` reads `storybook-static/index.json` and opens
   every story once, asserting no console or page error (reuse the fixtures and server of `packages/ui/e2e/`).
   This is the workbench's counterpart of the page layer's "every route renders without console errors"; the PR
   adds that line to the widget row of `docs/testing.md`. One pass per story, not per theme: whether a story
   throws does not depend on the theme, and the look is the maintainer's check. Run it with `--repeat-each=3`.

**Acceptance**

- [x] Every exported component has a story with its variants; Storybook builds in CI - spec box.
- [x] The guard fails when one story file is deleted; the render smoke fails on a story that throws (probes,
      restored).
- [x] `exports.test.ts`, `just widgets` and the ratchet are green; no component code changes.

How to check: in `pnpm storybook`, every group of the table, light and dark, against the variant checklist.

## D5 - Page migration

**Rules for every route PR.** Replace hand-built markup by `@skillsite/ui` components and variants where the
computed styles stay identical; move a block with one user into `app/<route>/_components/` (home:
`app/_components/`) and keep blocks with two or more users in `components/sections`; move inline visible text into
the route's `content/*.ts` file, byte-identical, keeping existing content shapes (strings, objects with named parts
for text around a link); `pageMetadata` titles and descriptions move too. Use `SmartLink`/`Button asChild` per
`AGENTS.md`. No new `@skillsite/ui` component outside D5.0; a pattern without a component is reported, not
improvised. Prove HTML text nodes identical and computed styles identical with the toolkit (evidence); class
attributes may change. A route PR adds no test: it changes no contract, and its "nothing changed" is evidence.

Steps per route PR: (1) toolkit before-tree; (2) move one-user blocks; (3) swap hand-built markup for components;
(4) move text (`perl -CSD` for any bulk edit); (5) toolkit after-run, `just ratchet-update` if a count fell;
(6) `just check`. A group PR may take one commit per route, so its review reads route by route.

**Acceptance (each D5 PR)**

- [x] Evidence: HTML text nodes and `<head>` identical; computed styles `No differences.` at 390/1280, light/dark.
- [x] The route's files hold no visible German text: no JSX text and no string literal in text props (`title`,
      `eyebrow`, `lead`, `description`, `alt`, `aria-label`, `pageMetadata` fields); every such string comes from
      `content/`. Deliberate exceptions are listed in the PR.
- [x] Only blocks with one user live in the route's `_components/`; ratchet not raised.

### D5.0 - Shared page values (package)

**Files:** `packages/ui/styles/tokens.css`, `packages/ui/src/utils/cn.ts` (+ test), new
`packages/ui/src/typography/step-number.tsx` (+ test, story, export), the call sites listed below.

1. Regenerate the list: `rg -n '(leading|tracking|mt|left|bottom|h|w)-\[' apps/marketing/src`. On `c17f9da` it is:
   `leading-[1.35]` (`/ueber-mich` quote), `tracking-[0.04em]` (`/preise`), `tracking-[-0.02em]`
   (`stat-grid.tsx`), `leading-[1.7]` (`code-typewriter.tsx`), `mt-[0.7rem]` (`doc-components.tsx`),
   `leading-[1.28] tracking-[-0.015em]` (`testimonials.tsx`, parked but kept - decision 5), the hero underline
   geometry (`app/page.tsx`) and the caret geometry (`code-typewriter.tsx`).
2. Name each type and spacing value 1:1 as a token with its `cn` registration and drift test. The underline and
   caret geometry describe one decorative element each: they stay local and move with their block in D5a/D5b.
3. `StepNumber({ size: "sm" | "md" | "lg", as?, className? })` renders
   `font-heading text-digit-<size> font-extrabold leading-none text-coral` (today in `/preise`, `/ueber-mich`,
   `/online-lernen` and `step-grid.tsx`); replace those four with it. A component test for its sizes and `as`; a
   story with all sizes.

**Acceptance:** evidence: HTML text and computed styles identical on all routes; the new export has a story (C9
guard green).

### D5a - `/`, `/faecher`, `/ablauf`

| Route      | Files                                      | Specific work                                                                                                                                    |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`        | `app/page.tsx` (22 `className`), `home.ts` | `benefit-grid` -> `app/_components/`; hero block (underline, price badge, floating tag) -> `app/_components/hero.tsx`; section intros to content |
| `/faecher` | `app/faecher/page.tsx` (12), `subjects.ts` | subject detail cards to a `_components` block; glyph badge on `IconBadge` if a variant matches                                                   |
| `/ablauf`  | `app/ablauf/page.tsx` (12), `process.ts`   | Discord panel to `_components`; intros to content                                                                                                |

How to check: `/`, `/faecher`, `/ablauf` - light/dark, 390/1280 px, nothing changes.

### D5b - `/preise`, `/ueber-mich`, `/online-lernen`

| Route            | Files                                                   | Specific work                                                                                   |
| ---------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/preise`        | `app/preise/page.tsx` (29), `pricing.ts`                | price panel and conditions cards to `_components` (its step digits are already on `StepNumber`) |
| `/ueber-mich`    | `app/ueber-mich/page.tsx` (18), `about.ts`              | `code-typewriter` -> `app/ueber-mich/_components/` (with its caret geometry); quote panel       |
| `/online-lernen` | `app/online-lernen/page.tsx` (23), `online-learning.ts` | platform steps and checklist cards to `_components`                                             |

How to check: `/preise`, `/ueber-mich` (the typewriter runs), `/online-lernen` - light/dark, 390/1280 px, nothing
changes.

### D5c - `/termin`, `/kontakt` and the status pages

| Route                        | Files                                                                                  | Specific work                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/termin`, `/kontakt`        | both pages (2/18 `className`), `contact.ts`, `booking.ts`                              | `whatsapp-qr` -> `app/kontakt/_components/`; contact cards; page intros to content  |
| `/zahlung`, 404, error pages | `zahlung/page.tsx`, `not-found.tsx`, `_components/error-state.tsx`, `global-error.tsx` | status copy to a new `content/status.ts`; the `/zahlung` actions per the rule below |

- **`/zahlung` actions.** The e-mail action is a `mailto:` link, which `SmartLink` renders as the same plain
  anchor: it moves to `Button asChild` around `SmartLink` with identical HTML. The WhatsApp action stays a raw
  anchor in the same tab (decision 3). No lint rule or ratchet pattern counts raw anchors, so the exception is
  recorded where the link rule lives: a one-line comment at the anchor ("Same tab on purpose: intended by the
  maintainer; `SmartLink` would open a new tab") and a line in the PR's _For the maintainer_.
- **Error boundaries.** The HTML snapshot never reaches them: a temporary component test writes the `innerHTML` of
  `ErrorState` and of `global-error.tsx`'s `renderToStaticMarkup` output to the scratchpad before and after the
  copy move; both must be byte-identical (evidence).
- **Booker.** The booker result scenario of the toolkit runs before and after.

How to check: `/termin` and `/kontakt` (both flows to the form, `/kontakt?fach=mathematik`), `/zahlung` valid
(redirect) and invalid (both actions; WhatsApp still opens in the same tab), a 404 - light/dark, 390/1280 px,
nothing changes.

### D5d - Legal pages

**Files:** `/impressum`, `/datenschutz`, `/agb` pages (0/4/0 `className`), `components/docs/*`, new
`content/legal/*.tsx`; `AGENTS.md` (_Where to look_ and _Conventions_); spec (V7, decision 4).

- The inline legal prose moves into JSX content modules `content/legal/{impressum,datenschutz,agb}.tsx`
  (decision 4): components or JSX constants that hold the paragraphs with their inline links and section
  references, byte-identical text; the pages render them. Existing `content/agb.ts`, `content/privacy.ts` and
  `content/legal.ts` keep their data (sections, headings, numbering) where it is.
- The convention is documented in `AGENTS.md` (_Conventions_: "visible content, which lives in
  `apps/marketing/src/content/*.ts`"; _Where to look_: `apps/marketing/src/content/`), in the spec's V7 and in its
  _Rules for implementing agents_ ("moving it byte-identically into `content/*.ts`"). D5d updates the `AGENTS.md`
  line to "`content/*.ts`, legal prose as JSX in `content/legal/*.tsx`" and adds the extension to V7 in the spec's
  decision table with its date.
- The legal texts themselves do not change: no word, no link target, no order. The PR says so and flags nothing
  for legal review beyond the move.

How to check: `/impressum`, `/datenschutz`, `/agb` (the section navigation and every in-text link) - light/dark,
390/1280 px, nothing changes.

## D6 - Cleanup

**Files:** create `apps/marketing/src/lib/log.ts` (+ test), `apps/marketing/src/lib/numbered-sections.ts`
(+ test); modify `modules/booking/server/log.ts`, `modules/payment/server/log.ts`, `content/agb.ts`,
`content/privacy.ts`, the two legal pages (or their D5d content modules), `modules/booking/model/mapping.ts`,
`modules/booking/server/actions.ts`, `modules/booking/components/*` (the generic failure), `content/booking.ts`;
`components/shared/contact-address.tsx` -> `components/sections/contact-address.tsx`; `packages/ui` hook and export
map (`useBodyScrollLock`); `design-ratchet.json`; `AGENTS.md`; spec status line.

**Log core and numbering**

- `lib/log.ts`: `createLogger<O extends string>(domain: string, levels: Record<O, LogLevel>)` returning
  `(outcome: O, context: Record<string, unknown>) => void` (`LogLevel = "info" | "warn" | "error"`),
  `loggable(value: unknown): string | undefined` (64 chars) and `compact(context): Record<string, unknown>`
  (drops `undefined`). Both domain logs keep their exports (`logBooking`, `describeAttempt`, `maskEmail`,
  `logPayment`, `describeLink`); their tests stay unchanged, and the `[booking] <outcome>` line with its masked
  e-mail keeps its exact shape (README, _Operating the booking_).
- `lib/numbered-sections.ts`: `numberedSections(sections)` returns
  `{ sections, number(id): number, heading(id): string }` (1-based; unknown id -> `0` and `""`).
  `agb.ts`/`privacy.ts` export one registry each; the pages call `registry.heading(id)` / `registry.number(id)`.
- `mapping.ts` uses `BOOKING_TIMEZONE`; the generic failure sentence lives once in `content/booking.ts` and is
  used by the action and the booker (today three copies).
- Not consolidated, on purpose: the two client-IP helpers (only the availability one truncates) and the two rate
  limiters (bounding the booking map is decision S).
- Mutation probe (the log line carries the only personal detail): drop the masking in the core path; the booking
  log test fails; restore.

**Leftovers, final ratchet, anchor**

1. Confirm `apps/marketing/src/providers` does not exist; move `contact-address.tsx` and delete `components/shared/`.
2. List exports without importers (`rg` over `apps/marketing/src` and `packages/ui/src`, stories excluded). Remove
   `useBodyScrollLock` and its export-map entry (no consumer since C8.4; C8 forbids a second scroll lock). Keep
   `Dialog` and `Switch` (E-11), every module's public entry, and the parked testimonials with their content
   (decision 5). Anything else ambiguous goes to the maintainer.
3. Final ratchet: `just ratchet-update`; allow-list `opengraph-image.tsx` for `inline-style` with the Satori reason
   (it already is for `hex-color`); list every remaining `raw-button` and `inline-style` occurrence with its reason
   in the PR body.
4. `AGENTS.md`: layout (`src/modules/`, `app/<route>/_components/`), module rules and the lint that enforces them,
   `process.env` only through `lib/env.ts`, the marketing `components` test project - whatever D1-D5 have not
   already written. Flip the spec status line to "Phase D done" once every D box is ticked.

**Acceptance**

- [x] Log tests unchanged and green; `rg -n "MAX_LOGGED_LENGTH|function loggable" apps/marketing/src` finds only
      `lib/log.ts`.
- [x] Evidence: HTML identical on all routes, the legal pages included.
- [x] `just check` green; every path in `AGENTS.md` and `README.md` exists.

How to check: `/impressum`, `/datenschutz`, `/agb` (section numbers and headings), `/termin` generic failure without
a Cal key - light/dark, nothing changes.

## Verification and PR handoff

From the worktree root, with the pinned pnpm and a frozen lockfile:

```sh
pnpm install --frozen-lockfile
pnpm --filter @skillsite/marketing exec playwright install chromium   # once
just test          # focused: pnpm --filter @skillsite/marketing exec vitest run --project unit|components
just widgets       # C9 and any packages/ui change
CAL_API_KEY= just smoke    # production build + marketing E2E
CAL_API_KEY= just check    # required before every push (format, lint, typecheck, ratchet, test, build, smoke, widgets)
```

Run the slice's new test red first, then green, then the toolkit, then `just check`. Every PR body follows
`.github/pull_request_template.md`: the slice and its stack position, the changed public API (module entries, new
exports), the ratchet change, `Review: deep | evidence` from the table, _How it was checked_ with the commands and
their numbers, the toolkit numbers and every probe, and a _How to check_ section:

- **Refactor slices:** the routes touched, light and dark, 390 px and 1280 px, "nothing looks or behaves
  differently". Booking slices add the flows: `/termin` -> duration -> calendar (month back/forward, empty month)
  -> slot -> form -> submit with no Cal key (generic failure); `/kontakt` and `/kontakt?fach=mathematik` -> slot ->
  form (subject preselected); the `unconfigured` state.
- **D4 and D4r (`fix:`):** the before/after of a root layout error (D4) and of a recovering server error (D4r),
  screenshots light/dark, and the scratch steps to reproduce them locally.
- **C9:** the Storybook groups to open and the variant checklist.
- **D3:** the commands that show a malformed key stopping the server and an empty key keeping `unconfigured`.

## Still open

Nothing blocks a slice. Points a slice settles itself and reports under _For the maintainer_: whether ESLint 10
runs `eslint-plugin-import`'s zones (D1a; stop if not), whether Next keeps serving after `register()` throws (D3),
and any pattern without a component (D5).
