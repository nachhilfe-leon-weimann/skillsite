# CLAUDE.md

Anchor for AI assistants and quick onboarding: commands, layout, conventions, traps. The _why_ and the current
plan live in [`docs/specs/`](docs/specs/) - start with
[`foundation-refactor.md`](docs/specs/foundation-refactor.md).

## Commands

- `just dev` - run the site (`http://localhost:3000`).
- `just check` - everything that must be green before a push; CI's `check` job runs the same. **Keep green before every push.**
- `just test` - the tests only.
- `just smoke` - functional smoke test against the production build (once: `pnpm --filter @skillsite/marketing exec playwright install chromium`).
- `just build` - production build; it is also the type check of `apps/marketing`.
- `just typecheck` - type-check the packages `next build` does not cover.
- `just docker-build` / `just docker-run` - build and run the production image locally.
- `pnpm storybook` - the design-system workbench of `packages/ui` (`http://localhost:6006`).

## Layout

```
apps/marketing/        the Next.js site (nachhilfe.leonweimann.de)
  src/app/             routes
  src/components/      booking/, layout/, sections/, ...
  src/content/         all visible text (German)
  src/lib/             booking/, payment/, routes, metadata, health
  e2e/                 Playwright smoke suite
packages/ui/           @skillsite/ui - tokens (styles/theme.css), primitives, hooks, Storybook
packages/config/       shared tsconfig, ESLint and Prettier presets
scripts/               repo scripts (e.g. the design ratchet)
tests/                 repo-level tests (release config, workflows, Dockerfile guard)
docs/specs/            specs: plans and decision records (versioned)
docs/plans/            task-level implementation plans for spec phases
```

The target structure (modules, a grouped `@skillsite/ui`) is described in the foundation refactor spec; code moves
there slice by slice.

## Conventions

- English in code, comments, identifiers, specs and commits; German only in visible content.
- Visible text lives in `apps/marketing/src/content/*.ts`, not in components.
- Build pages from `@skillsite/ui` components and the type scale (`text-display` ... `text-caption`). No arbitrary
  values (`text-[...]`, inline `color-mix(...)`, hand-tuned `clamp()`), no hand-built copies of existing components.
- `just ratchet` counts design-system bypasses (`design-ratchet.json`). A count may never rise; when your change
  lowers one, run `just ratchet-update` and commit the file. Exceptions go into its `allow` list with a reason.
- Motion speaks the brand tokens: `ease-flow`, `ease-soft`, `duration-quick|base|slow`, the `lift` utility, `Reveal`.
- A refactor changes nothing a visitor sees. A bug is fixed in its own `fix:` PR that describes the visible
  change. When it is unclear whether something is a bug or a design choice, stop and ask.
- Next.js 16 differs from older versions: read the guide in `apps/marketing/node_modules/next/dist/docs/` before relying on an
  API you are unsure about.
- Tests run on Vitest (`just test`). `packages/ui`: `src/**/*.test.ts` in node (project `unit`),
  `src/**/*.test.tsx` in jsdom with Testing Library (project `components`). `apps/marketing`:
  `src/**/*.test.{ts,mts}` in node (project `unit`; a `components` project follows with the booker slice).
  Repo level: `tests/**/*.test.mts`, `scripts/**/*.test.mjs`. A test file outside these globs does not run.
  Tested modules may use the `@/` alias.

## Git and PRs

- Conventional commits; the PR title is the commit message on `main` (squash merge). `feat` and `fix` cut releases;
  use `refactor`, `chore`, `ci`, `build`, `docs`, `test` for everything else.
- One PR per slice of a spec; tick the slice's acceptance boxes in the same PR.
- Push the branch and open the PR - never merge, never change repo settings, rulesets or deployment configuration;
  list settings that need changing in the PR body.
- Every PR body has a _How to check_ section: the routes and states to open, light and dark, phone and desktop
  width, and for fixes the exact visible change to expect.
- Never bump a version or create a tag by hand; release-please does it (see [README](README.md#releasing)).

## Traps

- Bulk edits over German files only with UTF-8-safe tools (`perl -CSD -pi -e ...`); plain `sed`/`perl` destroy
  umlauts and ß.
- `next dev` serving stale CSS: delete `apps/marketing/.next` and restart.
- Tailwind v4 `translate-*` / `scale-*` set the `translate` / `scale` properties, not `transform`;
  `transition-transform` does not cover them. Verify every motion change in a browser.
- `next-themes` runs with `disableTransitionOnChange`: theme switches do not animate, on purpose.
- `next/font/google` downloads the fonts at build time: `just build` needs network access to Google Fonts.
- The iOS 26 Safari toolbar tint follows the `footer` element
  (`apps/marketing/src/components/layout/ios-toolbar-tint.tsx`); keep exactly one `<footer>` in the layout.
- `agentRules: false` in `apps/marketing/next.config.ts` stops `next dev` from writing its own `AGENTS.md` /
  `CLAUDE.md`; this file is the only anchor.
