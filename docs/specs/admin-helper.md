# Spec: Admin helper (the portal's admin area: login, lessons, billing, credit)

> Status: Accepted, 2026-11-10 - SS0 to SS2 done; SS3 built, its security review pending.
> Builds on [`foundation-refactor.md`](foundation-refactor.md) (decision V15 brings this arc ahead of phase E) and on
> SkillForge's [`user-authentication.md`](https://github.com/nachhilfe-leon-weimann/skillforge/blob/main/docs/specs/user-authentication.md)
> (its _BFF contract_). This spec is the decision record of the arc; it takes the phase-F decisions the admin helper
> needs, and leaves the others to the portal spec.

## Problem statement

The maintainer bills lessons by hand: appointments from the calendar, hours in Clockodo, invoices in sevDesk. The
billing domain - lessons, rates, invoices, credit accounts and the calls to sevDesk and the calendar - is built in
SkillForge (its `billing` arc). It needs a screen: a place to log in, check off lessons, preview invoices and create
drafts. Nothing in skillsite can host that today:

- There is no `apps/portal`; the foundation spec puts all portal work after the design pass (phase E).
- There is no typed client for SkillForge's API and no backend-for-frontend (BFF) that holds its tokens.
- SkillForge's human login is done (password grant, refresh rotation, revoke, `admin` role, `/auth/me`), and its
  spec says what it expects from the portal's BFF - the skillsite side does not exist.

## Goals

1. **One portal app** (`apps/portal`) whose first area is the admin helper; the student portal joins the same app
   later.
2. **A login that follows SkillForge's BFF contract**: tokens and the client secret stay on the server, the browser
   holds an opaque session cookie.
3. **A typed client generated from SkillForge's OpenAPI contract**, so contract drift fails a check, not a click.
4. **Modules for lessons, billing and credit** on `@skillsite/ui`, each a thin view of SkillForge's endpoints.

## Non-goals

- **Money logic in skillsite.** SkillForge prices, builds and books; the portal shows what it returns and sends
  what the maintainer chose.
- **The student portal** (`(portal)`, family login, #31) and a persistent session store - they come together.
- **Phase E for the admin screens.** They use `@skillsite/ui` as it is; the design pass comes later.
- **Deploying the portal** before SS8.
- **Changes to SkillForge.** A missing endpoint or field goes to the maintainer as a question.

## Decisions

Decided by the maintainer; nothing here is reopened by an implementing agent. AH-5 to AH-7 are the maintainer's
defaults and AH-9 to AH-12 are proposed with SS0; both stand until the maintainer changes them in review.

| #         | Decision                                                                                                                                                                                                                                                       | Date       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **AH-1**  | The admin helper comes before phase E (V15 of the foundation spec). Admin screens get a lighter look check: light theme only, a phone and a desktop width.                                                                                                     | 2026-11-04 |
| **AH-2**  | Billing lives in SkillForge; the portal is UI and BFF only. No database in Next, no direct calls to sevDesk or the calendar from the portal.                                                                                                                   | 2026-11-04 |
| **AH-3**  | One app `apps/portal` (`@skillsite/portal`) with the route group `(admin)` and a `/login` route; no third app (July 2026). The admin pages live under `(admin)`; `(portal)` for families comes later.                                                          | 2026-11-10 |
| **AH-4**  | Real authentication from the start, against SkillForge's password grant; no mocked session.                                                                                                                                                                    | 2026-11-10 |
| **AH-5**  | Sessions live in memory behind a `SessionStore` interface: after a restart the maintainer logs in again. A persistent store comes with the student portal. The cookie holds only a random session ID, not an encrypted session: the tokens stay on the server. | 2026-11-10 |
| **AH-6**  | The BFF limits failed logins per client IP (SkillForge locks per account only).                                                                                                                                                                                | 2026-11-10 |
| **AH-7**  | v1 runs locally (`just dev`); the domain and the deploy come with SS8.                                                                                                                                                                                         | 2026-11-10 |
| **AH-8**  | `packages/api-client` is generated with `openapi-typescript` and called through `openapi-fetch`; SkillForge's `openapi.json` is vendored and copied by a script, never edited by hand (July 2026).                                                             | 2026-07-20 |
| **AH-9**  | Only the `admin` role opens the admin area, read from `/auth/me`; SkillForge still authorizes every call by scope. A login without `admin` gets no portal session, and its SkillForge session is revoked at once.                                              | 2026-11-10 |
| **AH-10** | The portal renders the light theme only (no toggle) until the student portal, matching the look check of AH-1.                                                                                                                                                 | 2026-11-10 |
| **AH-11** | A portal session ends at the refresh token's expiry (BFF contract) or after 8 hours without a request, whichever comes first.                                                                                                                                  | 2026-11-10 |
| **AH-12** | No analytics in the portal.                                                                                                                                                                                                                                    | 2026-11-10 |
| **AH-13** | Agents run the portal only against a local SkillForge on the local database with synthetic data (`app/cli/bootstrap.py`, later SkillForge's demo seed); never against a hosted database, never against production.                                             | 2026-11-10 |
| **AH-14** | `openapi-fetch` is the one new runtime dependency of this arc; the portal otherwise uses the workspace's existing ones (`next`, `react`, `zod`, `server-only`, `@skillsite/ui`). Anything else is asked first.                                                 | 2026-11-10 |

Phase-F questions this spec answers: start with real auth (AH-4), views and route groups (AH-3), session store
(AH-5), data sources (AH-2, AH-8), domain (AH-7, SS8), OpenAPI sourcing (AH-8), analytics (AH-12). Still open in
phase F: #31, status colours and typography density (SS4 brings them to the maintainer), the release number (2.0.0).

## Rules of the admin helper

- **The BFF contract is the law** for everything auth: the browser talks to the portal only; the client secret, the
  access and the refresh token never reach the browser - not in a cookie, a prop, the RSC payload or a client
  bundle. Refresh is single-flight per session; `invalid_grant` on refresh ends the portal session.
- **Every SkillForge call is server code**: it goes through the auth module's `server.ts` entry, which starts with
  `import "server-only"`; a module's client components call server actions, never SkillForge.
- **Amounts are SkillForge's.** The portal formats cent integers for display and never computes a price, a sum or
  a balance.
- **One log line per outcome**, `[auth] <outcome>` (later `[lessons]`, `[billing]`, `[credit]`): never a token, a
  password, an e-mail address or a client IP; a user is named by SkillForge's `user_id` only.
- **The contract is vendored, not edited.** A new SkillForge release is a `sync` PR of its own: copy, regenerate,
  fix what the types break.
- **Visible text is German** and lives in `apps/portal/src/content/*.ts`, like the marketing app.

## Target shape

```
apps/portal/src/
  app/
    (admin)/                   layout checks the admin session; one route per module
    login/                     the login page
    health/route.ts            same report as the marketing app
  modules/
    auth/                      components/ (login form, logout), server/ (session store, SkillForge calls,
                               throttle, actions.ts), model/, index.ts, server.ts
    lessons/ billing/ credit/  SS6, SS7, SS9 - same shape (E-04)
  content/                     all visible text
  lib/                         env, log, routes
  proxy.ts                     optimistic redirect to /login without a session cookie
  instrumentation.ts           env validation at server start (V6)

packages/api-client/           @skillsite/api-client
  contracts/openapi.json       vendored from SkillForge
  src/schema.ts                generated, never edited
  src/index.ts                 createSkillforgeClient and the contract types
```

The module rules of the marketing app apply unchanged (`moduleBoundaries` in `packages/config/eslint`).

## Requirements

Each slice is one PR. _Check_ is what the maintainer looks at before merging; for admin screens light only, a
phone and a desktop width (AH-1).

### Phase A - Foundation and login

**SS0 - This spec and V15.**

- _Technique:_ V15 in `foundation-refactor.md` (decision row, phase F, timeline, non-goals); this spec.
- _Acceptance criteria:_
  - [x] V15 is in the foundation spec's decision table; phase F points here; this spec lists SS1-SS9.

**SS1 - The portal app.** _(after SS0)_

- _Technique:_ `apps/portal` as a Next.js 16 app beside `apps/marketing`, same presets (`@skillsite/config`), same
  `lib/env.ts` / `instrumentation.ts` pattern, `/health` like the marketing app, `next dev` on port 3001. Root
  layout from `@skillsite/ui` (fonts, theme provider with the light theme forced, container, logo); `(admin)` with a
  placeholder start page; `/login` with a placeholder. `src/proxy.ts` (Next 16's successor of `middleware`)
  redirects every route but `/login`, `/health` and static files to `/login` while the session cookie is missing -
  only an optimistic check; the authoritative one comes with SS3 in the `(admin)` layout. Security headers like
  the marketing app, plus `X-Frame-Options: DENY`. Turbo picks the app up by its scripts; CI gets a `portal` area
  (lint, test, build, smoke) and builds both images when image inputs change; `docker build --build-arg
APP=portal` works; Playwright smoke in `apps/portal/e2e/`. `AGENTS.md`, `README.md` and `docs/testing.md` name
  the app.
- _Check:_ `http://localhost:3001` redirects to `/login`; the login placeholder and the 404, light, phone and
  desktop.
- _Acceptance criteria:_
  - [x] `just check` lints, type-checks, tests, builds and smoke-tests both apps.
  - [x] A request to `/` without a session cookie is redirected to `/login` (smoke).
  - [x] `docker build --build-arg APP=portal .` builds an image whose `/health` reports the version.
  - [x] A pull request that changes only `apps/portal` runs the portal checks; one that changes image inputs builds
        both images.

**SS2 - The API client.** _(after SS1)_

- _Technique:_ `packages/api-client` (`@skillsite/api-client`): `contracts/openapi.json` is SkillForge's committed
  `openapi.json`; `src/schema.ts` is generated from it by `openapi-typescript` (dev dependency);
  `createSkillforgeClient({ baseUrl, fetch? })` wraps `openapi-fetch` (runtime dependency) and is exported with the
  contract types. `pnpm --filter @skillsite/api-client sync` copies the contract from a local SkillForge checkout
  (default `../skillforge`, overridable by an argument) and regenerates; `generate` only regenerates. A test
  regenerates in memory and fails when `src/schema.ts` differs.
- _Check:_ none visible.
- _Acceptance criteria:_
  - [x] Changing `contracts/openapi.json` without regenerating turns `just test` red.
  - [x] A typed call to `/api/v1/auth/me` type-checks; a wrong path or body fails `just typecheck` (a
        `@ts-expect-error` test).
  - [x] `openapi-fetch` is the package's only runtime dependency.

**SS3 - Login through the BFF.** _(after SS2; `Review: deep`)_

- _Technique:_ `modules/auth` in the E-04 shape.
  - **Environment** (`lib/env.ts`): `SKILLFORGE_API_URL`, `SKILLFORGE_CLIENT_ID`, `SKILLFORGE_CLIENT_SECRET` - all
    three or none; none means the login page says the portal is not configured. `.env.example` lists them.
  - **Session store:** `SessionStore` (get, set, delete) and `MemorySessionStore`, held on `globalThis` so every
    server bundle and a dev reload see one store, bounded in size, dropping expired sessions. A session holds the
    tokens, their expiries, `user_id`, `party_id`, the roles and the time of the last request.
  - **Cookie:** a new random ID (32 bytes) at every login; `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure` and the
    `__Host-` prefix in production builds; its lifetime never exceeds the session's (AH-11).
  - **Login** (server action): throttle check, then `password` grant with the client authenticated by HTTP Basic,
    then `/auth/me`; without `admin` revoke and refuse (AH-9). One message for every wrong-credential case
    (SkillForge's `invalid_grant` has one body); separate messages for throttled, not an admin, not configured and
    SkillForge unreachable.
  - **Throttle:** at most 10 failed logins per client IP in 15 minutes; the 11th is refused without calling
    SkillForge; a success clears the IP's count; the map is bounded. The client IP comes from a trusted proxy header
    only once SS8 configures one; until then every request shares one bucket.
  - **Requests:** `requireAdminSession()` for the `(admin)` layout and server code; it refreshes when the access
    token has less than 60 seconds left, single-flight per session, and ends the session on `invalid_grant`. A
    network error keeps the session and shows an error. Authenticated responses carry `Cache-Control: no-store`.
  - **Logout** (server action): revoke the refresh token with the portal's own `client_credentials` token (cached
    until shortly before it expires), delete the session, clear the cookie. A failed revoke still ends the portal
    session and is logged.
- _Check:_ `/login`: the form, each error message (wrong password, too many attempts, no admin, not configured),
  the start page after login and the logout; light, phone and desktop - against a local SkillForge with a synthetic
  admin.
- _Acceptance criteria:_
  - [x] A synthetic admin logs in against a local SkillForge and reaches the start page; logout returns to `/login`,
        and a refresh with the revoked token answers `invalid_grant`.
  - [x] No token reaches the browser: the only cookie is the session ID, and neither the HTML, the RSC payload nor
        `.next/static` contains a token.
  - [x] Two concurrent requests with an expiring access token cause exactly one refresh (test).
  - [x] `invalid_grant` on refresh ends the portal session; the next request lands on `/login` (test).
  - [x] A login without `admin` creates no portal session and revokes its SkillForge session (test).
  - [x] The 11th failed login from one IP within 15 minutes never reaches SkillForge (test).
  - [x] Each of these tests turns red when the guarded behaviour is broken (mutation probes in the PR).
  - [ ] An independent security review's conclusion is in the PR.

### Phase B - UI kit _(outline; detailed before it starts)_

**SS4 - UI kit 1.** Checkbox, status badge, inline alert in `@skillsite/ui` with stories and widget tests; the
maintainer decides the status colours.

- [ ] The three components are exported, documented in Storybook and pass the widget checks.

**SS5 - UI kit 2.** Data table, German number, currency and date formatting (Europe/Berlin).

- [ ] The table and the formatters are exported with stories and tests; dates are formatted in Europe/Berlin.

### Phase C - Modules _(outline; each waits for its SkillForge slice and a synced contract)_

**SS6 - Lessons.** _(after SS5 and SkillForge's lesson domain and calendar import)_ Lessons of a period, check off,
correct the minutes, add one by hand, unmatched appointments, show and change a person's rate.

- [ ] Every action of the list goes through SkillForge; the module has component tests and a smoke path.

**SS7 - Billing.** _(after SS6 and SkillForge's invoice preview and draft creation)_ Preview per payer (one invoice
per lesson by default, combined by selection), create the draft, status and reconcile, a link to sevDesk.

- [ ] A draft is created only from a preview the maintainer confirmed; an unknown outcome shows reconcile, never a
      retry.

**SS8 - Deploy.** _(milestone 2, optional; after SS3)_ The portal image in the release, a second compose service,
the domain, the trusted proxy header for the throttle.

- [ ] The portal answers on its domain with its own image; the marketing deploy is unaffected.

**SS9 - Credit.** _(after SS7 and SkillForge's credit accounts)_ Balance list with status, account statement in
sections, top-up, the close wizard, badges in SS6 and SS7.

- [ ] Balances and statements come from SkillForge; the portal computes no balance.

## Timeline / phasing

```
SS0 -> SS1 -> SS2 -> SS3 -> SS4 -> SS5 -> SS6 -> SS7 -> SS9
                      SS3 -> SS8 (any time after)
```

SS1 and SS2 both touch `pnpm-lock.yaml` and `.github/workflows/ci.yml`; they run in sequence as one stack. SS6, SS7
and SS9 wait for their SkillForge slices to be released, then start with a contract sync.

## Open questions

- Status colours and typography density for the admin screens: the maintainer, with SS4.
- Persistent session store and family login: with the student portal.
- The release number when the portal ships (2.0.0): the maintainer.

## Rules for implementing agents

- Follow the root `AGENTS.md`; English in code and docs, German only in `apps/portal/src/content/`.
- Run SkillForge only locally, on the local database (`just pg-up` in SkillForge), with a synthetic admin and portal
  client from `app/cli/bootstrap.py`; never a hosted database, never production, no tunnel (AH-13). Change nothing
  in SkillForge; if something is missing there, stop and ask.
- No new runtime dependency besides `openapi-fetch` (AH-14); a dev dependency needs its reason in the PR.
- Never log, print or commit a token, a client secret or a password - also not the synthetic ones.
- SS3 and every later slice that touches auth or money: `Review: deep`, an independent review before the PR goes to
  the maintainer, and mutation probes for the guarded behaviour.
- Tick this spec's boxes in the PR that fulfils them.
