# Foundation refactor: phase D (marketing structure and migration) and C9

> Status: Implementation plan, 2026-11-03. Not implemented; the maintainer approves this plan before any slice
> starts. At the time of writing C8.1/C8.2 are on `main` and C8.3-C8.9 are an open, unmerged stack. Each numbered
> slice below is one branch and one PR. Implement only a dispatched slice, with its tests.

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement a slice task by task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** give the marketing app the module structure of E-03/E-04 (D1), a decomposed booker (D2), one env module
and zod validation (D3), error boundaries in the site's look (D4), pages built from `@skillsite/ui` with their text
in `content/` (D5), a final cleanup (D6) - and a story for every exported component (C9), which D5 waits for.

**Architecture:** booking and payment become `modules/<domain>/{components,server,model}` with a client-safe
`index.ts` and a `server.ts` that starts with `import "server-only"`; `import/no-restricted-paths` zones from the
shared ESLint preset enforce the entries (V5). The booker splits into hooks and step components on top of the C8
widgets. `lib/env.ts` parses the runtime environment with zod in `instrumentation.ts` (V6); booking input is
validated by zod schemas derived from the field declarations. Routes then shed their hand-built markup and inline
text one route group per PR.

**Tech stack:** pnpm 12.4.2, Turborepo 2, Next.js 16.4.2 (App Router, `src/`), React 19.3, TypeScript 7, Tailwind
CSS 4.3, Vitest 5, Playwright 1.63, Storybook 10 (`@storybook/nextjs-vite`), Radix Primitives and React DayPicker
(from C8), zod 4 (new direct dependency in D3), `server-only` (new in D1a).

**Spec:** [`docs/specs/foundation-refactor.md`](../specs/foundation-refactor.md) - phase D, C9, _Target shape_,
_Rules of the refactor_, _Timeline / phasing_, _Rules for implementing agents_. The spec is binding; this plan
refines it and reopens no decision. Read the [C8 plan](foundation-refactor-c8.md) for the widgets D2 builds on.

## Global constraints

- English in code, comments, identifiers, specs and commits; German only in visible content.
- Refactor slices are pixel-identical: no rendered pixel, text, `<head>` entry or behaviour changes. A slice that
  cannot stay identical stops and reports. Visible changes ship only in the slices marked `fix:` below.
- Visible text is never edited; moving it into `content/*.ts` keeps it byte-identical. Bulk edits over German files
  only with UTF-8-safe tools (`perl -CSD -pi -e ...`).
- Module rules (spec _Target shape_): outside a module, import only `@/modules/<domain>` or
  `@/modules/<domain>/server`; `index.ts` never re-exports server code; modules do not import each other's
  internals; `packages/ui` imports nothing from an app.
- Every new theme token or utility is registered in `cn` with a test; a ratchet count never rises; when one falls,
  run `just ratchet-update` and commit `design-ratchet.json`.
- Security follow-ups of the booking action stay in the backlog (decision S): no duration allow-list change, POST
  timeout, redacted Cal errors, bounded booking rate-limit map or `cal-api-version` change in any slice.
- `just check` green before every push. Commit with the PR title as message, **no trailer of any kind**. Never name
  the maintainer. Push and open the PR; never merge; never change repo settings, rulesets, the GitHub App or
  Dokploy. Dependent PRs form a GitHub stack (E-16).
- Tick the slice's spec acceptance boxes in the same PR. Scratch output (snapshots, logs, before-trees) goes only
  to the session scratchpad.

## Review focus

1. **Server code in a client bundle.** A client-safe `index.ts` that re-exports from `server/`, or a client
   component that imports a server entry, ships secrets or fails the build late. D1a/D1b test that no `index.ts`
   imports `./server`, and `next build` proves `server-only` holds.
2. **An empty `CAL_API_KEY` that stops the server.** CI, smoke and the pixel toolkit run with `CAL_API_KEY=`; today
   an empty value means "unconfigured". D3's schema treats an empty string as absent (test case).
3. **A `loading.tsx` that breaks the payment redirect.** `redirect()` inside a streamed boundary becomes a
   client-side meta refresh instead of the 307 that `e2e/smoke.spec.ts` asserts. D4 adds no `loading.tsx` to
   `/zahlung`.
4. **zod validation that disagrees with today's rules at the edges** - whitespace-only text, a value exactly at
   `maxLength`, a choice that is not offered, an empty multi-chip array, a phone number with five digits, the order
   of the missing-field labels. D3 writes a characterization table against the current code before switching.
5. **A decomposed booker with different effect timing** - a stale month response after a fast duration change, an
   auto-advance bounce after manual navigation, a double fetch on mount. D2 tests `useAvailability` with a
   controllable `fetch` and aborts.

## Facts from the code (`main` @ `572762d`)

Verified by reading the tree; the spec's audit numbers are from `72197da` and some have moved since.

- **Booking** is 19 non-test files, 2,632 lines: `apps/marketing/src/lib/booking/` (`actions.ts` - the only
  `"use server"` module, `anti-spam.ts`, `availability.ts`, `availability-guard.ts`, `cal/client.ts`, `config.ts`,
  `dates.ts`, `fields.ts`, `log.ts`, `mapping.ts`, `rate-limit.ts`, `validation.ts`, plus tests for anti-spam,
  availability-guard and log), `apps/marketing/src/components/booking/` (`booker.tsx`, `booking-form.tsx`,
  `use-booking-form.ts`, `fields/{chips-field,radio-field,text-field}.tsx`) and
  `apps/marketing/src/app/api/booking/availability/route.ts`. Outside imports: `app/termin/page.tsx` and
  `app/kontakt/page.tsx` (`Booker`), the API route (`getAvailability`, the guard, `bookingEvents`).
- **Payment** is `apps/marketing/src/lib/payment/{invoice-link,log}.ts` (185 lines) plus two tests; the only
  consumer is `app/zahlung/page.tsx`. `README.md` names `apps/marketing/src/lib/payment/invoice-link.ts`;
  `CLAUDE.md`'s layout block names `components/booking/`, `lib/booking/` and `lib/payment/`.
- **`booker.tsx`** is 804 lines with five components: `Booker` (lines 98-450: state, the availability effect with
  abort and month auto-advance, the scroll effect, the submit flow, the sidebar and the step switch),
  `UnavailableNotice` (452-488), `SelectStep` (504-638, month header and day grid), `TimeSlots` (640-673),
  `ResultStep` (684-804). The price (`EUR`, `slotPrice`), `dateLabel`, `WEEKDAYS`, `MONTHS` and
  `MAX_MONTH_OFFSET` sit at its top. `booking-form.tsx` has 246 lines.
- **`process.env` reads in `apps/marketing/src`:** `CAL_API_KEY` in `lib/booking/availability.ts:51` and
  `lib/booking/cal/client.ts:12` (the two reads the spec names); `APP_VERSION` in `lib/health.ts:12` (inlined at
  build by `next.config.ts` `env`); `NODE_ENV` in `components/analytics/umami.tsx:20`. Outside `src`:
  `ALLOWED_DEV_ORIGINS` in `next.config.ts`, `CI` in both Playwright configs. No `instrumentation.ts`, no zod
  dependency (zod 4.6.5 is only transitive), no `server-only`.
- **Route files:** `app/error.tsx` (root segment, `StatusPage`, uses `reset`), `app/not-found.tsx`. No
  `loading.tsx`, no `global-error.tsx`. `/zahlung` is `force-dynamic` and redirects with 307; every other page is
  static. Next 16.3 made `retry` the stable recovery prop (`node_modules/next/dist/docs`, error.md); `global-error`
  must render its own `<html>`/`<body>`, styles and fonts.
- **Duplicated log helpers:** `lib/booking/log.ts` and `lib/payment/log.ts` each define `LEVEL`,
  `MAX_LOGGED_LENGTH = 64`, `loggable()`, the `[domain] outcome {json}` line and the drop-`undefined` loop. Other
  duplicates: `"Europe/Berlin"` literal in `mapping.ts` next to `BOOKING_TIMEZONE`; the generic failure sentence
  three times (`actions.ts` and twice in `booker.tsx`).
- **Numbering registries:** `content/agb.ts` (`agbSections`, `agbSectionNumber`, `agbSectionHeading`) and
  `content/privacy.ts` (`privacySections`, `privacySectionNumber`, `privacySectionHeading`) are identical code.
- **Stray folders:** `providers/` no longer exists (removed with consent in A2). `components/shared/` holds
  `contact-address.tsx` (users: `/impressum`, `/datenschutz`). `components/sections/testimonials.tsx` has no live
  user (commented out in `app/page.tsx`).
- **Sections with one user (E-05 candidates):** `benefit-grid` (`/`), `code-typewriter` (`/ueber-mich`),
  `whatsapp-qr` (`/kontakt`). All others have two or more.
- **Ratchet** (`node scripts/design-ratchet.mjs`, green): all counts 0 except `raw-button` 6 (`navbar.tsx` 1,
  `radio-field.tsx` 1, `chips-field.tsx` 1, `testimonials.tsx` 1, `booker.tsx` 2) and `inline-style` 16
  (`opengraph-image.tsx` 11, `animated-height.tsx`, `theme-toggle.tsx`, `booking-form.tsx`,
  `lesson-timeline.tsx`, `profile-photo.tsx`). C8.4/C8.6/C8.8 will lower `raw-button`.
- **Stories** exist for `Button` (variants, sizes, as link), `Card` (one basic), typography (`Heading` display-h4,
  `Lead`, `Text`) and `Dialog` (C8.2). C8.3-C8.8 add stories for Popover, Select, RadioGroup, choice chips,
  Switch and Calendar. Storybook builds in CI through `just widgets` (C8.1).

## C8 dependency ruling

C8.3-C8.9 change these files that phase D also touches:

| C8 slice | Files phase D also touches                                                                           | Affected D slices |
| -------- | ---------------------------------------------------------------------------------------------------- | ----------------- |
| C8.3     | `components/layout/navbar.tsx` (`PlatformDropdown`)                                                  | none              |
| C8.4     | `components/layout/navbar.tsx` (mobile menu); may leave `useBodyScrollLock` without a consumer       | D6b               |
| C8.5     | `components/booking/booker.tsx` (duration `Select`)                                                  | D1b, D2           |
| C8.6     | `components/booking/fields/{radio-field,chips-field}.tsx`; new `forms/{radio-group,choice-chips}`    | D1b, C9           |
| C8.7     | `packages/ui/src/forms/switch.tsx` and its story                                                     | C9                |
| C8.8     | `booker.tsx` (`SelectStep`, month changes, error focus), a date adapter next to it, `forms/calendar` | D1b, D2, C9       |
| C8.9     | marketing/Storybook E2E, spec checklist, C8 plan status                                              | none (spec lines) |

- **May start now, on `main`, beside the C8 stack:** D1a, D3, D4 (one small stack). They touch no file of the C8
  slices: payment, the ESLint preset, `lib/env.ts`, `instrumentation.ts`,
  `lib/booking/{availability,actions,validation}.ts`, `lib/booking/cal/client.ts`, a new schema file,
  `app/error.tsx`, `app/global-error.tsx`. D3 must keep `validateBookingValues`' signature so
  `use-booking-form.ts` and `booking-form.tsx` stay untouched.
- **Start only after C8.8 is on `main`:** D1b (moves every file C8.5/C8.6/C8.8 edit), D2 (decomposes the C8.8
  booker), C9 (needs every C8 widget and story). C8.9 may still be open: it adds tests and evidence only.
- **Later:** D5 after C9 and D1-D4; D6 after D5 (spec timeline).
- **Rebasing.** Branch the post-C8 slices from a fresh `origin/main`, never from a C8 branch. When a C8 PR lands
  while D1b is open, `git rebase origin/main`; git's rename detection carries the C8 edits onto the moved files.
  Prove it: for every moved file, `diff <(git show origin/main:<old path>) <new path>` shows only import lines.
  Conflicts in `pnpm-lock.yaml`: take `origin/main`'s lockfile, run `pnpm install`, commit the result. Conflicts in
  `design-ratchet.json`: take `origin/main`'s file, run `just ratchet-update`. Spec checkbox conflicts: keep both
  ticks. After a squash merge inside a stack: `git rebase --onto origin/main <merged-branch> <next-branch>`,
  `just check`, `git push --force-with-lease`.

## PR sequence

Kind: **R** refactor, pixel-identical; **F** `fix:` with a described visible change; **T** tests/workbench only.
Each PR body starts with its base ("Stacked on #N - merge after it." or "Based on `main`.") and "Part of #140."
(C9 PRs: "Part of #139.").

| Slice | Branch                        | Conventional PR title                                                    | Kind | Starts after            |
| ----- | ----------------------------- | ------------------------------------------------------------------------ | ---- | ----------------------- |
| D0    | `docs/phase-d-plan`           | `docs: plan phase d and c9`                                              | -    | -                       |
| D1a   | `refactor/payment-module`     | `refactor(payment): move payment into a module with enforced boundaries` | R    | D0                      |
| D3    | `refactor/env-zod`            | `refactor: read env through one module and validate with zod`            | R    | D1a (stacked)           |
| D4    | `fix/route-errors`            | `fix(errors): render root layout errors in the site's look`              | F    | D3 (stacked)            |
| D1b   | `refactor/booking-module`     | `refactor(booking): move booking into a module`                          | R    | C8.8, D1a, D3 on `main` |
| C9a   | `test/ui-stories-primitives`  | `test(ui): stories for the primitives and typography`                    | T    | C8.8 on `main`          |
| C9b   | `test/ui-stories-layout`      | `test(ui): stories for layout, motion and shell`                         | T    | C8.8 on `main`          |
| C9c   | `test/ui-story-coverage`      | `test(ui): guard story coverage of every exported component`             | T    | C9a + C9b (stacked)     |
| D2    | `refactor/booker-decompose`   | `refactor(booking): decompose the booker`                                | R    | D1b                     |
| D5.0  | `refactor/ui-page-patterns`   | `refactor(ui): name the last page values and add a step number`          | R    | C9c, D2, D4 on `main`   |
| D5.1  | `refactor/page-home`          | `refactor(home): build the home page from the design system`             | R    | D5.0                    |
| D5.2  | `refactor/page-subjects`      | `refactor(subjects): build /faecher from the design system`              | R    | D5.0                    |
| D5.3  | `refactor/page-process`       | `refactor(process): build /ablauf from the design system`                | R    | D5.0                    |
| D5.4  | `refactor/page-pricing`       | `refactor(pricing): build /preise from the design system`                | R    | D5.0                    |
| D5.5  | `refactor/page-about`         | `refactor(about): build /ueber-mich from the design system`              | R    | D5.0                    |
| D5.6  | `refactor/page-online`        | `refactor(online): build /online-lernen from the design system`          | R    | D5.0                    |
| D5.7  | `refactor/page-booking`       | `refactor(booking): build /termin and /kontakt from the design system`   | R    | D5.0                    |
| D5.8  | `refactor/page-legal`         | `refactor(legal): move the legal pages' text into content`               | R    | D5.0, open question 4   |
| D5.9  | `refactor/page-status`        | `refactor(status): move the status pages' text into content`             | R    | D5.0, open question 3   |
| D6a   | `refactor/log-core-numbering` | `refactor: one log core and one legal numbering registry`                | R    | all D5                  |
| D6b   | `chore/phase-d-cleanup`       | `chore: remove leftovers and record the final ratchet`                   | R    | D6a (stacked)           |

D1 is split in two PRs so the payment module and the boundary rule need not wait for C8; the spec's D1 box is
ticked in D1b. C9 is split by group so each PR's check fits in a few lines; its box is ticked in C9c.

**Parallelism (E-17).** D1a -> D3 -> D4 is linear (shared `package.json`, lockfile, ESLint and Vitest config).
D1b runs beside C9a/C9b (apps versus `packages/ui` stories). D5.1-D5.9 run in parallel: each owns its
`app/<route>/` folder and route content file; shared `design-ratchet.json` and `content/site.ts` conflicts are
resolved by the rebase rules above. D5.0 runs alone because it edits `packages/ui` tokens and typography that
every route PR consumes. D6a/D6b are sequential.

## Verification toolkit

Pixel identity is proven exactly as in phase C: copy `toolkit.sh`, `snapshot-html.mjs` and `compare-computed.mjs`
from the _Verification toolkit_ of [the phase C plan](foundation-refactor-phase-c.md) into the scratchpad, build a
before-tree from the slice's base commit and the after-tree, serve both with `CAL_API_KEY=` pinned empty, and run:

- **HTML:** `diff -r html-before html-after` - every element, attribute and text node of every route, `/zahlung`
  valid and invalid, and a 404, plus the served CSS. A refactor slice reports "no differences". Slices that move
  classes onto components (D5) may change class attributes only; they then also need the computed-style run.
- **Computed styles:** `compare-computed.mjs` (390 and 1280 px, light and dark, forced pseudo-states, the booker
  calendar and form scenarios, the open mobile menu and desktop popover) ends with `No differences.`. After C8 its
  selectors (`radio` "Discord", menu, popover triggers) follow the new widget roles; keep every scenario.
- **Booker states D2 adds:** a "/termin booker result" scenario that submits the form with `CAL_API_KEY=` (the
  action stops before Cal with `[booking] Cal.com is not configured - booking not created.` in the server log and
  renders the generic failure); wait at least 3 s before submitting (time-trap) and restart both servers before
  each run (the action allows four attempts per IP per ten minutes).

Put the before/after numbers ("72 page states, ... No differences.") in the PR body. Never point a toolkit at a
port another agent uses; the toolkit's ports are 3110/3111, smoke uses 3100, widgets 6106.

---

## D1a - Payment module and boundary rule

**Files:** create `apps/marketing/src/modules/payment/{index.ts,server.ts,model/invoice-link.ts,server/log.ts}`
(moved from `lib/payment/`, tests move along as `model/invoice-link.test.mts` and `server/log.test.mts`); modify
`app/zahlung/page.tsx` (imports only), `packages/config/eslint/` (new `boundaries.mjs`, exported next to
`next.mjs`), `apps/marketing/eslint.config.mjs`, `packages/ui/eslint.config.mjs`, `apps/marketing/vitest.config.mts`,
`apps/marketing/package.json` (`server-only`), `pnpm-lock.yaml`, `README.md` (payment path), `CLAUDE.md` (layout).
Test: `apps/marketing/src/modules/boundaries.test.ts`.

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

1. Move the two payment files and their tests with `git mv`; rewrite the relative test imports and the page
   imports (`@/modules/payment`, `@/modules/payment/server`). Bodies stay byte-identical.
2. Add `server-only` to `apps/marketing` dependencies. Alias it to an empty stub in `vitest.config.mts` (a file
   next to the config, outside `src/`), so tests may import a server entry; the package's default entry throws
   outside the `react-server` condition.
3. Write `boundaries.test.ts` first: it lints source text with ESLint's Node API (`new ESLint({ cwd: <app> })`,
   `lintText(code, { filePath })`) and asserts: `app/zahlung/page.tsx` importing `@/modules/payment/server/log`
   reports `import/no-restricted-paths`; importing `@/modules/payment/server` and `@/modules/payment` reports
   nothing; a file under `modules/payment/` may import its own `./server/log`; a `packages/ui` file importing
   `../../apps/marketing/src/lib/routes` is reported. Run it red, then add `boundaries.mjs` and wire both configs.
4. Add a test that no `modules/*/index.ts` contains an import or re-export from `./server` (string scan).
5. Fix `README.md` and the `CLAUDE.md` layout block (`src/modules/  booking/, payment/ - see module rules`).

**Acceptance**

- [ ] `boundaries.test.ts` passes and fails when the zones are removed; `just lint` is green on the real tree.
- [ ] HTML snapshot identical; `e2e/smoke.spec.ts` payment tests green (307 and the error page).
- [ ] Every path in `README.md` and `CLAUDE.md` exists.

## D3 - Env module and zod

**Files:** create `apps/marketing/src/lib/env.ts` (+ `env.test.ts`), `apps/marketing/src/instrumentation.ts`,
`apps/marketing/src/lib/booking/schema.ts` (+ `schema.test.ts`); modify
`lib/booking/{availability,validation,actions}.ts`, `lib/booking/cal/client.ts`, `lib/health.ts`,
`components/analytics/umami.tsx`, `apps/marketing/eslint.config.mjs`, `apps/marketing/package.json` (`zod`),
`pnpm-lock.yaml`, `.env.example` (comment only), `README.md` (env paragraph), `CLAUDE.md` (env rule).
Spec: both D3 boxes.

**Contracts**

- `lib/env.ts` starts with `import "server-only";` and never parses at import time (V6).
  - `parseServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv` with
    `ServerEnv = { CAL_API_KEY?: string }`. An empty or whitespace-only value is absent. A present value that does
    not match the agreed shape (open question 1) throws `EnvError` whose message names the variable and the rule,
    never the value.
  - `serverEnv(): ServerEnv` - parses once and memoizes; the only accessor for runtime variables.
  - `appVersion(): string` (`process.env.APP_VERSION ?? "unknown"`, a literal member access so Next keeps inlining
    it) and `isProduction(): boolean` (`process.env.NODE_ENV === "production"`).
- `instrumentation.ts`: `export async function register()` - only when `process.env.NEXT_RUNTIME === "nodejs"`,
  dynamically imports `@/lib/env` and calls `parseServerEnv()`; on `EnvError` it logs `[env] <message>` and
  rethrows.
- `lib/booking/schema.ts`: `fieldValueSchema(field: FieldDef)` and `bookingValuesSchema(event: BookingEventKey)`,
  derived from the field declarations (required/empty, `maxLength` on strings, `format` via the existing
  `EMAIL_RE`/`PHONE_RE`, option whitelist, `multiple` -> `string[]`); `bookingSubmissionSchema` for the transport
  shape of `BookingSubmission` (event key, non-empty slot, optional duration, values record, optional agreements,
  honeypot and fill duration); `checkBookingSubmission(submission: unknown, now?: number): BookingIssue | null`
  with `BookingIssue` the union of `{ check: "slot" }`, `{ check: "fields"; fields: string[] }`,
  `{ check: "terms" }` and `{ check: "withdrawal_notice" }`.
- `validateBookingValues(event, values): string[]` keeps its signature and result (labels via
  `shortLabel ?? label`, declaration order); it now reads the schema.

1. Characterize first: `schema.test.ts` holds a table of inputs run against the **current**
   `validateBookingValues` (both events; blank, whitespace-only, at and over each `FIELD_LIMITS` value, invalid
   e-mail, a five- and a six-digit phone, an option not offered, an empty and a mixed multi-chip array, a missing
   key). Commit the table green on the old code, then switch to zod and keep it green.
2. Add action tests for `checkBookingSubmission`: unknown event and empty slot -> `slot`; missing fields ->
   `fields` with the same labels; paid event without `termsAccepted` -> `terms`; a slot within the withdrawal
   period without `earlyPerformanceRequested` -> `withdrawal_notice`; the free event never needs agreements.
3. Rewrite `processBooking` in `actions.ts` to call `checkBookingSubmission` after rate limit and anti-spam (same
   order as today) and map each issue to today's message and log `check` value. A non-string field value from a
   hand-made request is now rejected as `validation` instead of throwing into the generic failure; name this in
   the PR body (no form can send it).
4. Write `env.test.ts`: absent, `""`, `"  "` -> `{}`; a valid shape -> kept; malformed -> `EnvError` without the
   value in its message; `serverEnv()` memoizes. Then replace both `CAL_API_KEY` reads with `serverEnv()`, and
   `health.ts`/`umami.tsx` with `appVersion()`/`isProduction()`. `health.test.mts` stays green unchanged.
5. Add `instrumentation.ts`. Measure in a production build (scratch only): `CAL_API_KEY=` and no variable -> server
   starts, `/termin` shows "Online-Terminwahl gerade nicht verfügbar"; a malformed value -> `next start` exits
   non-zero within seconds with the `[env]` line. If Next keeps serving after `register()` throws, call
   `process.exit(1)` after logging and say so in the PR. Note whether `next build` invokes `register()`.
6. ESLint: `no-restricted-properties` for `process.env` in `apps/marketing/src/**`, except `lib/env.ts`,
   `instrumentation.ts` and test files. `rg -n 'process\.env' apps/marketing/src` lists only those.
7. `zod` is a direct dependency of `apps/marketing` (current stable 4.x, recorded in the PR). Report the first-load
   JS of `/termin` and `/kontakt` before/after; zod reaches the client through `validation.ts`.

**Acceptance**

- [ ] `next build` without `.env` is green (a fresh worktree has none) - spec box.
- [ ] Without `CAL_API_KEY` the booker shows `unconfigured` exactly as today (HTML snapshot identical); a present
      but malformed value stops `next start` with a clear message - spec box.
- [ ] Characterization table and action tests green; every log line and user message of the action unchanged.
- [ ] `.env.example` and README state the variable is optional and what shape it needs.

## D4 - Route robustness

**Files:** create `apps/marketing/src/app/global-error.tsx`, `apps/marketing/src/app/_components/error-state.tsx`
(+ tests); modify `app/error.tsx`, `apps/marketing/vitest.config.mts` (project `components`: `src/**/*.test.tsx`,
jsdom, Testing Library), `apps/marketing/package.json` (`jsdom`, `@testing-library/react`,
`@testing-library/dom`, versions as in `packages/ui`), `CLAUDE.md` (test projects line). Spec: the D4 box.
If a C8 slice has added a marketing `components` project by the time D4 rebases, keep that one; D2 reuses it.

**Rulings.** No `loading.tsx`: every page except `/zahlung` is static and has nothing to wait for, and on
`/zahlung` a boundary would turn the 307 into a meta refresh. `global-error.tsx` shows the existing error copy -
no new text - without navbar and footer (the layout is what failed); it is a `fix:` because a root layout error
renders Next's bare default page today.

1. Extract the `StatusPage` of `app/error.tsx` into `ErrorState({ onRetry }: { onRetry: () => void })`;
   `error.tsx` renders it with `reset` (or `retry`, per open question 2). Markup unchanged (HTML snapshot of the
   404/error states, component test asserting the eyebrow, title, both actions and the contact link).
2. `global-error.tsx` (`"use client"`): `<html lang="de" className={fontVariables}>`, imports `./globals.css`
   after `@skillsite/ui/shell/fonts` (keep `layout-imports.test.ts`'s order rule satisfied), wraps
   `<ThemeProvider>` around `<main id="main"><ErrorState /></main>` so the stored theme applies. A `<title>` only
   if open question 2 says so.
3. Component tests (jsdom; mock `@skillsite/ui/shell/fonts`, which calls `next/font` at import): both boundaries
   render the heading "Da ist etwas schiefgelaufen.", the retry button calls the recovery prop once, and the
   contact link points to `/kontakt`.
4. Manual proof in a scratch copy only (never committed): a client component that throws after a click, once
   inside a page (expect `error.tsx` inside navbar/footer) and once in the navbar (expect `global-error.tsx` with
   the brand fonts and the stored theme), in a production build, light and dark.

**Acceptance**

- [ ] A thrown error in a page renders the error boundary in the site's look; a thrown error in the root layout
      renders `global-error.tsx` with fonts, styles and the stored theme - spec box.
- [ ] All routes' HTML identical; the 307 smoke test green; no `loading.tsx` added.
- [ ] PR body: the visible change (layout errors: bare Next page -> site error page), screenshots light/dark.

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
| `components/booking/**` (incl. C8's date adapter)  | `components/**`                            |

Create `index.ts`, `server.ts`, `server/availability-route.ts`; modify `app/api/booking/availability/route.ts`,
`app/termin/page.tsx`, `app/kontakt/page.tsx`, `boundaries.test.ts`, `CLAUDE.md`. `content/booking.ts` stays.

**Contracts**

- `index.ts`: `export { Booker } from "./components/booker";` and the client-safe types pages need (none today).
- `server.ts`: `import "server-only";`, then re-exports `handleAvailabilityRequest` from
  `./server/availability-route`.
- `server/availability-route.ts`: `handleAvailabilityRequest(request: Request): Promise<Response>` - today's
  `GET` body verbatim, with the module-scope `AvailabilityRateLimiter` instance (same per-process semantics).
- `app/api/booking/availability/route.ts`: a one-line `GET(request)` that returns
  `handleAvailabilityRequest(request)`, and nothing else.
- Internal imports inside the module stay relative or `@/modules/booking/...`; the Booker keeps importing the
  `"use server"` action from `../server/actions` (inside the module, so allowed).

1. Start from `origin/main` with C8.8 merged; list `components/booking/` again (C8 may have added files) and move
   everything. File bodies change only in import lines (prove with the per-file `diff` from the rebase rules).
2. Extend `boundaries.test.ts`: `app/termin/page.tsx` importing `@/modules/booking/server/actions` or
   `@/modules/booking/components/booker` is reported; `@/modules/booking` and `@/modules/booking/server` are not;
   `modules/payment/x.ts` importing `@/modules/booking/model/config` is reported.
3. `rg -n 'lib/booking|components/booking' apps/marketing README.md CLAUDE.md` returns nothing.

**Acceptance**

- [ ] A deep import (`modules/booking/server/...` from `app/`) fails lint; built output identical - spec box
      (HTML snapshot, computed styles of the booker scenarios, smoke and C8 booking E2E green).
- [ ] `next build` passes with `server-only` in both `server.ts` files; no `index.ts` imports `./server`.

## C9 - Workbench coverage

**Rules for every story file.** One `*.stories.tsx` next to its component, `title: "<Group>/<Name>"`, German
sample copy, no app imports. A `Variants` story renders every value of every CVA variant key (and boolean props
such as `Section surface`/`bleed`), inverse tones on an inverse surface; light and dark come from the toolbar.
Stories are never exported (`exports.test.ts`). Hooks, `utils/cn`, `tokens/colors` and `shell/fonts` are not
components and need no story (the preview already loads the fonts).

**Gap list** (exports without a story, or with an incomplete one, on `main` @ `572762d`; C8.3-C8.8 deliver Popover,
Select, RadioGroup, choice chips, Switch and Calendar - C9c only audits those):

| PR  | Component (variant keys to cover)                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C9a | `Card` (tone, radius, lift, surface incl. glass on inverse, `asChild`) - extend the existing story                                                                                       |
| C9a | `Tag` (tone), `Pill` (tone, size, `as`), `IconBadge` (layout, size, shape, tone), `IconButton` (size, surface)                                                                           |
| C9a | `CheckList`, `CheckMark`, `InfoRow` (default, inverse, summary, doc), `Accordion`                                                                                                        |
| C9a | `SmartLink`, `TextLink` (site, doc, underline, inverse, inverse-muted), `ArrowLink`, `NavLink` (menu, menu-sub, toc; active)                                                             |
| C9a | `Heading` (every size incl. title/card-title/step-title, tone, wrap) and `Text` (size, tone, `Address`) - extend typography; `Eyebrow` (tone, dot), `Lead`, `ProseH2`/`ProseH3`/`ProseP` |
| C9a | `Field` (label, description, error, required) with `Input` and `Textarea`                                                                                                                |
| C9b | `Container` (size), `Section` (surface, bleed, spacing), `PageHeader` (variant, align, size), `Split` (align, gap, ratio)                                                                |
| C9b | `CardGrid` (gap, columns), `CenteredState`, `StatusPage`                                                                                                                                 |
| C9b | `Reveal` (rise, rise-soft, fade, settle; mount and in-view), `CountUp`, `AnimatedCheckMark`, `AnimatedHeight`, `Collapsible`                                                             |
| C9b | `Logo` (tone), `ThemeToggle` inside `ThemeProvider` (covers both)                                                                                                                        |

1. **C9a/C9b:** write the stories of the table; check each in `pnpm storybook` light and dark. `Reveal` and
   `CountUp` stories must reach their end state deterministically (the widget suite runs under reduced motion).
2. **C9c, guard first:** `packages/ui/src/stories.test.ts` (node) maps every exported `.tsx` module of
   `primitives`, `typography`, `forms`, `overlays`, `layout`, `motion`, `shell` to the component names it exports
   and asserts each name is imported by at least one `*.stories.tsx`. It fails on today's tree and passes after
   C9a/C9b. Variant completeness stays a reviewed checklist in the PR (every key/value of the table ticked).
3. **C9c, render smoke:** `packages/ui/e2e/stories.spec.ts` reads `storybook-static/index.json` and opens every
   story in light and dark, asserting no console or page error (reuse C8.1's fixtures and server). Audit the C8
   widget stories against the rules above and add missing variants (e.g. Select `tone="inverse"`).

**Acceptance**

- [ ] Every exported component has a story with its variants; Storybook builds in CI - spec box (C9c).
- [ ] The guard fails when one story file is deleted; the render smoke fails on a story that throws.
- [ ] `exports.test.ts`, `just widgets` and the ratchet are green; no component code changes.

## D2 - Decompose the booker

**Files** (all under `apps/marketing/src/modules/booking/`): create the components `booker-aside`, `select-step`,
`booking-calendar`, `time-slots`, `booking-result`, `unavailable-notice` (`components/*.tsx`), the hooks
`use-availability` and `use-booking-submission` (`components/*.ts`), `model/pricing.ts`, tests next to
each (`*.test.tsx` / `*.test.ts`); modify `components/booker.tsx`, `model/dates.ts`, `content/booking.ts`.
Spec: the D2 box.

**Contracts** (adapt the names of the C8.8 calendar props as merged; keep its manual month path)

- `useAvailability(event: BookingEventKey, duration: number, onFirstFreeDay: (date: string) => void)` returns
  `{ shown, monthOffset, availability, loading, status, changeMonth(delta: number), restartSearch(), retry() }`.
  It owns the fetch, the `AbortController`, `reloadKey` and the auto-advance ref; `changeMonth` switches
  auto-advance off and clamps to `0..MAX_MONTH_OFFSET`; `restartSearch` switches it on and reloads.
- `useBookingSubmission(event, duration)` returns `{ phase, error, submit(draft), retryBooking(), reset() }` - the
  `finalizeBooking` flow, `withFillDuration`, the three analytics events, unchanged.
- `model/pricing.ts`: `formatSlotPrice(config: BookingEventConfig, duration: number): string | null` and
  `durationLabel(config, duration): string`. `model/dates.ts` gains `formatDateLabel(dateKey: string): string`.
- `BookerAside`, `SelectStep`, `BookingCalendar` (month header plus the C8.8 `Calendar`), `TimeSlots`,
  `BookingResult` (today's `ResultStep`), `UnavailableNotice`: props are today's, markup moves verbatim.
- The booker's inline strings move to `bookerText` in `content/booking.ts`, byte-identical (entities as their
  characters, e.g. `&nbsp;` -> `\u00a0`).

1. Characterize first, in a temporary uncommitted test: render the whole `Booker` (fetch stubbed, `requestBooking`
   mocked to each outcome: confirmed, slot_taken, rate_limited, blocked, too_fast, generic, rejected promise) and
   write each state's `container.innerHTML` to the scratchpad. Run it on the base commit; it is the reference.
2. Write the committed tests: `use-availability.test.ts` (first-day callback; empty month advances until
   `MAX_MONTH_OFFSET` and stops; manual `changeMonth` into an empty month does not bounce; a duration change aborts
   the in-flight request and ignores its late answer; non-OK -> `error`; `retry` refetches once),
   `pricing.test.ts` (45/60/90 -> `"22,50\u00a0€"`, `"30,00\u00a0€"`, `"45,00\u00a0€"`; free event -> `null`),
   `booking-result.test.tsx` (title and actions per phase and reason, both events), `time-slots.test.tsx`,
   `unavailable-notice.test.tsx`, and `booker.test.tsx` (select -> form -> result with the action mocked).
3. Extract hooks, then components, one commit each; after each commit the step-1 states are byte-identical.
4. `wc -l modules/booking/components/**/*.tsx` - every file at most 250 lines (`booking-form.tsx` included; split
   its field grouping into `field-groups.ts` if C8.6 pushed it over).
5. Run the toolkit with the booker scenarios plus the result scenario; smoke and C8 booking E2E green.

**Acceptance**

- [ ] No component file in `modules/booking/components` exceeds 250 lines; the booking steps are covered by
      component tests - spec box.
- [ ] Characterized states identical; HTML and computed styles identical on `/termin` and `/kontakt` (calendar,
      form, empty month, `unconfigured`, `error`, generic failure).
- [ ] Network requests per flow unchanged (same availability queries in the same order in the E2E run).

## D5 - Page migration

**Rules for every route PR.** Replace hand-built markup by `@skillsite/ui` components and variants where the
computed styles stay identical; move a block with one user into `app/<route>/_components/` (home: `app/_components/`)
and keep blocks with two or more users in `components/sections`; move inline visible text into the route's
`content/*.ts` file, byte-identical, keeping existing content shapes (strings, objects with named parts for text
around a link); `pageMetadata` titles and descriptions move too. Use `SmartLink`/`Button asChild` per `CLAUDE.md`.
No new `@skillsite/ui` component outside D5.0; a pattern without a component is reported, not improvised. Prove
HTML text nodes identical and computed styles identical with the toolkit; class attributes may change.

### D5.0 - Shared page values (package)

**Files:** `packages/ui/styles/tokens.css`, `packages/ui/src/utils/cn.ts` (+ test), new
`packages/ui/src/typography/step-number.tsx` (+ test, story, export), the call sites listed below.

1. Regenerate the list: `rg -n '(leading|tracking|mt|left|bottom|h|w)-\[' apps/marketing/src`. On `572762d` it is:
   `leading-[1.35]` (`/ueber-mich` quote), `tracking-[0.04em]` (`/preise`), `tracking-[-0.02em]`
   (`stat-grid.tsx`), `leading-[1.7]` (`code-typewriter.tsx`), `mt-[0.7rem]` (`doc-components.tsx`),
   `leading-[1.28] tracking-[-0.015em]` (`testimonials.tsx`, see open question 5), the hero underline geometry
   (`app/page.tsx`) and the caret geometry (`code-typewriter.tsx`).
2. Name each type and spacing value 1:1 as a token with its `cn` registration and drift test. The underline and
   caret geometry describe one decorative element each: they stay local and move with their block in D5.1/D5.5.
3. `StepNumber({ size: "sm" | "md" | "lg", as?, className? })` renders
   `font-heading text-digit-<size> font-extrabold leading-none text-coral` (today in `/preise`, `/ueber-mich`,
   `/online-lernen` and `step-grid.tsx`); replace those four with it. Story with all sizes.

**Acceptance:** HTML text and computed styles identical on all routes; the new export has a story (C9 guard green).

### D5.1-D5.9 - Route groups

| Slice | Route(s) and files                                                                                     | Specific work                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D5.1  | `/` - `app/page.tsx` (22 `className`), `content/home.ts`                                               | `benefit-grid` -> `app/_components/`; hero block (underline, price badge, floating tag) -> `app/_components/hero.tsx`; section intros to content |
| D5.2  | `/faecher` - `app/faecher/page.tsx` (12), `content/subjects.ts`                                        | subject detail cards to a `_components` block; glyph badge on `IconBadge` if a variant matches                                                   |
| D5.3  | `/ablauf` - `app/ablauf/page.tsx` (12), `content/process.ts`                                           | Discord panel to `_components`; intros to content                                                                                                |
| D5.4  | `/preise` - `app/preise/page.tsx` (29), `content/pricing.ts`                                           | price panel and conditions cards to `_components`; steps on `StepNumber`                                                                         |
| D5.5  | `/ueber-mich` - `app/ueber-mich/page.tsx` (18), `content/about.ts`                                     | `code-typewriter` -> `app/ueber-mich/_components/`; quote panel                                                                                  |
| D5.6  | `/online-lernen` - `app/online-lernen/page.tsx` (23), `content/online-learning.ts`                     | platform steps and checklist cards to `_components`                                                                                              |
| D5.7  | `/termin`, `/kontakt` - both pages (2/18), `content/contact.ts`, `content/booking.ts`                  | `whatsapp-qr` -> `app/kontakt/_components/`; contact cards; page intros to content                                                               |
| D5.8  | `/impressum`, `/datenschutz`, `/agb` - pages (0/4/0), `components/docs/*`                              | inline legal prose to content in the form chosen by open question 4; nothing visible changes                                                     |
| D5.9  | `/zahlung`, 404, error boundaries - `zahlung/page.tsx`, `not-found.tsx`, `_components/error-state.tsx` | status copy to `content/status.ts`; `/zahlung` actions on `SmartLink` only as open question 3 decides                                            |

Steps per route PR: (1) toolkit before-tree; (2) move one-user blocks; (3) swap hand-built markup for components;
(4) move text (`perl -CSD` for any bulk edit); (5) toolkit after-run, `just ratchet-update` if a count fell;
(6) `just check`.

**Acceptance (each D5 PR)**

- [ ] HTML text nodes and `<head>` identical; computed styles `No differences.` at 390/1280, light/dark.
- [ ] The route's files hold no visible German text: no JSX text and no string literal in text props (`title`,
      `eyebrow`, `lead`, `description`, `alt`, `aria-label`, `pageMetadata` fields); every such string comes from
      `content/`. Deliberate exceptions are listed in the PR.
- [ ] Only blocks with one user live in the route's `_components/`; ratchet not raised.

## D6 - Cleanup

### D6a - One log core and one numbering registry

**Files:** create `apps/marketing/src/lib/log.ts` (+ test), `apps/marketing/src/lib/numbered-sections.ts`
(+ test); modify `modules/booking/server/log.ts`, `modules/payment/server/log.ts`, `content/agb.ts`,
`content/privacy.ts`, the two legal pages, `modules/booking/model/mapping.ts`, `modules/booking/server/actions.ts`,
`content/booking.ts`.

- `lib/log.ts`: `createLogger<O extends string>(domain: string, levels: Record<O, LogLevel>)` returning
  `(outcome: O, context: Record<string, unknown>) => void` (`LogLevel = "info" | "warn" | "error"`),
  `loggable(value: unknown): string | undefined` (64 chars) and `compact(context): Record<string, unknown>`
  (drops `undefined`). Both domain logs keep their exports (`logBooking`, `describeAttempt`, `maskEmail`,
  `logPayment`, `describeLink`); their tests stay unchanged.
- `lib/numbered-sections.ts`: `numberedSections(sections)` returns
  `{ sections, number(id): number, heading(id): string }` (1-based; unknown id -> `0` and `""`).
  `agb.ts`/`privacy.ts` export one registry each; the pages call `registry.heading(id)` / `registry.number(id)`.
- `mapping.ts` uses `BOOKING_TIMEZONE`; the generic failure sentence lives once in `content/booking.ts` and is
  used by the action and the booker.
- Not consolidated, on purpose: the two client-IP helpers (only the availability one truncates) and the two rate
  limiters (bounding the booking map is decision S).

**Acceptance:** log tests unchanged and green; legal pages' HTML identical;
`rg -n "MAX_LOGGED_LENGTH|function loggable" apps/marketing/src` finds only `lib/log.ts`.

### D6b - Leftovers, final ratchet, anchor

**Files:** `components/shared/contact-address.tsx` -> `components/sections/contact-address.tsx`; dead code per the
steps; `design-ratchet.json`; `CLAUDE.md`; spec status line.

1. Confirm `apps/marketing/src/providers` does not exist; move `contact-address.tsx` and delete `components/shared/`.
2. List exports without importers (`rg` over `apps/marketing/src` and `packages/ui/src`, stories excluded). Remove
   `useBodyScrollLock` if C8.4 left it without a consumer (C8 forbids a second scroll lock). Keep `Dialog` and
   `Switch` (E-11) and every module's public entry. Resolve `testimonials` per open question 5; anything else
   ambiguous goes to the maintainer.
3. Final ratchet: `just ratchet-update`; allow-list `opengraph-image.tsx` for `inline-style` with the Satori reason
   (it already is for `hex-color`); list every remaining `raw-button` and `inline-style` occurrence with its reason
   in the PR body.
4. `CLAUDE.md`: layout (`src/modules/`, `app/<route>/_components/`), module rules and the lint that enforces them,
   `process.env` only through `lib/env.ts`, the marketing `components` test project, booking paths in traps. Flip
   the spec status line to "Phase D done" once every D box is ticked.

**Acceptance:** HTML identical on all routes; `just check` green; every path in `CLAUDE.md` and `README.md` exists.

## Verification and PR handoff

From the worktree root, with the pinned pnpm and a frozen lockfile:

```sh
pnpm install --frozen-lockfile
pnpm --filter @skillsite/marketing exec playwright install chromium   # once
just test          # focused: pnpm --filter @skillsite/marketing exec vitest run --project unit|components
just widgets       # C9 and any packages/ui change
just smoke         # production build + marketing E2E
just check         # required before every push (format, lint, typecheck, ratchet, test, build, smoke, widgets)
```

Run the slice's new test red first, then green, then the toolkit, then `just check`. Every PR body names the slice
and its base, the changed public API (module entries, new exports), the toolkit numbers, the ratchet change and a
**How to check** section:

- **Refactor slices:** the routes touched, light and dark, 390 px and 1280 px, "nothing looks or behaves
  differently". Booking slices add the flows: `/termin` -> duration -> calendar (month back/forward, empty month)
  -> slot -> form -> submit with no Cal key (generic failure); `/kontakt` -> slot -> form; the `unconfigured` state.
- **D4 (`fix:`):** the before/after of a root layout error, screenshots light/dark, and the scratch steps to
  reproduce it locally.
- **C9:** the Storybook groups to open and the variant checklist.
- **D3:** the commands that show a malformed key stopping the server and an empty key keeping `unconfigured`.

## Open questions for the maintainer

1. **D3 - what is a malformed `CAL_API_KEY`?** The spec says a malformed value stops the server, but not what
   "malformed" means. Proposal: non-empty, no whitespace, starts with `cal_`. Please confirm the production key
   matches, or name the rule. (`.env.example`'s `API_KEY_HERE` would then stop a server that copies it unedited.)
2. **D4 - `reset` or `retry`?** `app/error.tsx` passes `reset` to "Nochmal versuchen"; since Next 16.3 `retry` is
   the stable prop that re-fetches the segment, so after a server error today's button may not recover. Is this a
   bug to fix in D4, or intended? And should `global-error.tsx` set a tab title (for example the existing eyebrow
   "Ein Fehler ist aufgetreten" in the site's title template) or none?
3. **D5.9 - WhatsApp on `/zahlung`.** Its button is a raw `<a>` and opens WhatsApp in the same tab; the link rule
   (`SmartLink`) opens external links in a new tab. Bug (separate `fix(links):` PR) or intended (the button stays
   a raw anchor with a recorded exception)?
4. **D5.8 - legal prose in content.** The legal pages hold long paragraphs with inline links and section
   references. Moving them into `content/*.ts` needs a form: content modules that export JSX (`content/legal/*.tsx`,
   changing the `content/*.ts` convention), a small rich-text segment format in `.ts`, or keeping the legal prose
   inline as an exception to V7. Which one?
5. **D6 - parked testimonials.** `components/sections/testimonials.tsx` and `content/testimonials.ts` are unused
   (the home section is commented out, awaiting real testimonials). Keep them parked, or remove them as dead code
   and restore from history later?
