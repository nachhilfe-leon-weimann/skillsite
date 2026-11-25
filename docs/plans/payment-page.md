# Payment page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/zahlung` looks an invoice up in SkillForge and redirects to PayPal with sevDesk's open amount, shows a
field for the number, and stops blocked customers, paid and unknown invoices.

**Architecture:** The marketing app gets SkillForge's typed client (`@skillsite/api-client`) and a cached
`client_credentials` token. The payment module maps SkillForge's answer to a page state in a pure function; the
page renders the form, redirects, or shows one status page per state. Every failure ends in `unavailable`, never in
a redirect.

**Tech Stack:** Next.js 16 (App Router, server components), TypeScript, `openapi-fetch` through
`@skillsite/api-client`, `zod/mini`, Vitest, Playwright.

**Spec:** [`docs/specs/payment-page.md`](../specs/payment-page.md) - slices P2 and P3. The SkillForge half (P1a,
P1b) is planned in SkillForge's `billing.md` by P1a; this plan starts once P1b is merged in SkillForge.

## Global Constraints

- Fail closed: no redirect to PayPal without a fresh `200` from SkillForge for that number (spec, _Rules of the
  arc_).
- Recipient, currency and item name stay the constants of `invoice-link.ts`; only number and amount vary.
- No personal data in skillsite: the lookup answer holds number, state, open amount, PayPal flag - nothing else is
  read, logged or rendered.
- One `[payment] <outcome>` log line per request; `export const dynamic = "force-dynamic"` stays.
- Environment only through `apps/marketing/src/lib/env.ts`; `SKILLFORGE_API_URL`, `SKILLFORGE_CLIENT_ID`,
  `SKILLFORGE_CLIENT_SECRET` - all three or none, as in the portal (`apps/portal/src/lib/env.ts` on #273).
- Module boundaries: `app/` imports `@/modules/payment` (`index.ts`) or `@/modules/payment/server` (`server.ts`) only.
- German text lives in `apps/marketing/src/content/status.ts`, word for word from the spec's _Family-visible texts_.
- Synthetic data only: invoice numbers `RE-1001` ... `RE-1006`, client `marketing-e2e` / `sf_synthetic_secret`.
- Never against production SkillForge or the real sevDesk account; checks run against the stub of Task 6.
- Every PR: `Review: deep`, a mutation probe on the state mapping, `CAL_API_KEY= just check` green.

## Review Focus

1. A hand-typed number with spaces or in lower case (`re-1001`) is found - Task 3 trims and upper-cases it.
2. SkillForge hangs: the page answers `unavailable` within the timeout instead of hanging - Task 4 tests a fetch
   that never resolves.
3. The cached token was revoked: one `401` invalidates it and retries once, a second `401` is `unavailable` -
   Task 4.
4. `open` with an open amount of 0, or above `AMOUNT_LIMITS.max`, never redirects - Task 3.
5. An old link whose `betrag` differs from sevDesk pays sevDesk's amount - Task 6 (stub answers 22,50, the link says
   90,00).

---

## Slice P2 - the lookup (one PR, stacked on #272 `build/api-client`)

### Task 1: Sync the contract and wire the client into the marketing app

**Files:**

- Modify: `packages/api-client/contracts/openapi.json`, `packages/api-client/src/schema.ts` (generated)
- Modify: `apps/marketing/package.json` (`"@skillsite/api-client": "workspace:*"`), `pnpm-lock.yaml`
- Modify: `apps/marketing/next.config.ts` - `transpilePackages: ["@skillsite/ui", "@skillsite/api-client"]`

**Interfaces:**

- Produces: `paths["/api/v1/billing/payment-requests/{invoice_number}"]["get"]` in the typed client.

- [ ] **Step 1:** `pnpm --filter @skillsite/api-client sync ../skillforge` (SkillForge checkout at P1b's merge).
- [ ] **Step 2:** `pnpm --filter @skillsite/api-client test` - PASS (freshness test sees the new contract).
- [ ] **Step 3:** add the dependency and `transpilePackages`; `pnpm install`; `just build` - PASS.
- [ ] **Step 4:** commit `build(marketing): sync the SkillForge contract and add the API client`.

### Task 2: A cached service token in `@skillsite/api-client`

**Files:**

- Create: `packages/api-client/src/service-token.ts`, `packages/api-client/src/service-token.test.ts`
- Modify: `packages/api-client/src/index.ts` (re-export)

**Interfaces:**

- Produces:

  ```ts
  export type ClientCredentials = { clientId: string; clientSecret: string };
  export type ServiceTokenSource = {
    token(): Promise<string | null>; // cached until 60 s before expiry; concurrent callers share one fetch
    invalidate(): void;
  };
  export function createServiceTokenSource(options: {
    client: SkillforgeClient;
    credentials: ClientCredentials;
    now?: () => number;
  }): ServiceTokenSource;
  ```

  The request is `POST /api/v1/auth/token`, form-encoded `grant_type=client_credentials`, HTTP Basic
  `base64(utf8(id:secret))`, as `clientCredentials` in the portal's `modules/auth/server/skillforge.ts` (#273). Any
  non-`200`, a body without `access_token`/`expires_in`, or a thrown fetch yields `null`. Same margin as the
  portal's `SERVICE_TOKEN_MARGIN_MS` (60 000 ms).

- [ ] **Step 1: Write the failing tests** with a `fetch` stub passed through `createSkillforgeClient({ baseUrl,
fetch })`:
  - `reuses a token until 60 seconds before it expires` - two calls at `now` and `now + 3539_000` with
    `expires_in: 3600` make one request; at `now + 3541_000` a second.
  - `shares one request between concurrent callers` - `Promise.all([token(), token()])` makes one request.
  - `sends HTTP Basic and the client_credentials grant` - header `Basic bWFya2V0aW5nLWUyZTpzZl9zeW50aGV0aWNfc2VjcmV0`,
    body `grant_type=client_credentials`.
  - `returns null on a refusal, a broken body and a network error` - `401`, `{}`, a rejecting fetch.
  - `fetches anew after invalidate`.
- [ ] **Step 2:** `pnpm --filter @skillsite/api-client test` - FAIL (module missing).
- [ ] **Step 3:** implement `createServiceTokenSource` in `service-token.ts`; re-export from `index.ts`.
- [ ] **Step 4:** tests PASS; `pnpm --filter @skillsite/api-client typecheck` PASS.
- [ ] **Step 5:** commit `feat(api-client): cache a client_credentials token`.

> For the maintainer (PR): the portal (#273) keeps its own copy until it adopts this source; named, not changed here.

### Task 3: The page state, pure, in the payment module

**Files:**

- Create: `apps/marketing/src/modules/payment/model/payment-state.ts`, `payment-state.test.mts`
- Modify: `apps/marketing/src/modules/payment/model/invoice-link.ts`, `invoice-link.test.mts`
- Modify: `apps/marketing/src/modules/payment/index.ts` (exports)

**Interfaces:**

- Produces:

  ```ts
  // invoice-link.ts
  export type InvoiceNumberResult =
    | { ok: true; invoice: string }
    | { ok: false; reason: "missing" | "invoice" };
  export function parseInvoiceNumber(re: QueryValue): InvoiceNumberResult;
  export function formatPaypalAmount(cents: number): string; // 2250 -> "22.50"

  // payment-state.ts
  export type PaymentLookup =
    | { kind: "open"; amountCents: number; paypal: "allowed" | "blocked" }
    | { kind: "paid" }
    | { kind: "not_payable" }
    | { kind: "unavailable" };
  export type PaymentPageState =
    | { kind: "redirect"; request: PaymentRequest }
    | {
        kind: "blocked" | "paid" | "not_payable" | "unavailable";
        invoice: string;
      };
  export function toPageState(
    invoice: string,
    lookup: PaymentLookup,
  ): PaymentPageState;
  ```

  `parseInvoiceNumber` trims, upper-cases and checks `^[A-Z0-9][A-Z0-9._-]{0,31}$` - no `/`, because the number is a
  path segment of SkillForge's route (sevDesk's format is `RE-%NUMBER`, Q3 of `billing.md`). A repeated parameter
  is `invoice`, an absent or empty one `missing`.

- [ ] **Step 1: Write the failing tests:**
  - `parseInvoiceNumber`: `" re-1001 "` → `RE-1001`; `"RE/1001"`, `["RE-1", "RE-2"]`, `"R".repeat(33)` →
    `invoice`; `undefined`, `""` → `missing`.
  - `formatPaypalAmount`: `2250` → `"22.50"`, `9000` → `"90.00"`, `1` → `"0.01"`.
  - `toPageState("RE-1001", …)`:
    - `open`, 2250, `allowed` → `redirect` with `{ invoice: "RE-1001", amount: "22.50" }`;
    - `open`, 2250, `blocked` → `blocked`;
    - `open`, 0 → `paid`; `open`, 500 001 (above `AMOUNT_LIMITS.max`) → `unavailable`;
    - `paid`, `not_payable`, `unavailable` → the same kind with the invoice.
- [ ] **Step 2:** `pnpm --filter @skillsite/marketing exec vitest run src/modules/payment` - FAIL.
- [ ] **Step 3:** implement; `toPageState` reuses `AMOUNT_LIMITS` from `invoice-link.ts` (export it).
- [ ] **Step 4:** tests PASS. **Mutation probe:** make `blocked` return `redirect` → the blocked test fails;
      restore. Note both runs for the PR.
- [ ] **Step 5:** commit `feat(payment): map an invoice lookup to the page state`.

### Task 4: The SkillForge lookup on the server

**Files:**

- Create: `apps/marketing/src/modules/payment/server/lookup.ts`, `lookup.test.ts`
- Modify: `apps/marketing/src/lib/env.ts`, `env.test.ts`
- Modify: `apps/marketing/src/modules/payment/server.ts` (export), `server/log.ts`, `server/log.test.mts`

**Interfaces:**

- Consumes: `createServiceTokenSource` (Task 2), `PaymentLookup` (Task 3).
- Produces:

  ```ts
  // env.ts - ServerEnv gains the three SKILLFORGE_* keys, validated like the portal's; all or none.
  // lookup.ts
  export type LookupInvoice = (invoice: string) => Promise<PaymentLookup>;
  export const LOOKUP_TIMEOUT_MS = 5000;
  export function createLookup(deps: {
    client: SkillforgeClient;
    tokens: ServiceTokenSource;
    timeoutMs?: number;
  }): LookupInvoice;
  export function lookupInvoice(invoice: string): Promise<PaymentLookup>; // runtime: serverEnv(); unconfigured → unavailable
  // log.ts
  export type PaymentOutcome =
    | "redirected"
    | "blocked"
    | "paid"
    | "not_payable"
    | "unavailable"
    | "rejected";
  ```

  Mapping: `200` whose body passes a `zod/mini` schema (`state: "open" | "paid"`, `open_amount_cents` a
  non-negative integer, `paypal: "allowed" | "blocked"`) → `open` / `paid`; `404` → `not_payable`; `401` →
  `tokens.invalidate()` and one retry, then `unavailable`; a missing token, `429`, `5xx`, a body that fails the
  schema, a thrown fetch or the timeout (`AbortSignal.timeout`) → `unavailable`. Levels: `redirected`, `blocked`,
  `paid` info; `not_payable`, `rejected` warn; `unavailable` error.

- [ ] **Step 1: Write the failing tests** (a stub `fetch`, no network):
  - `env.test.ts`: all three set → parsed; one missing → `EnvError` naming the missing ones; a URL with a path →
    `EnvError`; the secret never appears in a message.
  - `lookup.test.ts`: each mapping above, one test each; `a fetch that never resolves ends unavailable after the
timeout` (fake timers, `timeoutMs: 50`); `a second 401 ends unavailable without a third request`;
    `an unconfigured runtime answers unavailable without a request`.
- [ ] **Step 2:** run - FAIL.
- [ ] **Step 3:** implement; `lookupInvoice` builds one client and one token source per process (module-level,
      created on first use, like `serverEnv()`).
- [ ] **Step 4:** tests PASS; `CAL_API_KEY= just check` PASS.
- [ ] **Step 5:** commit `feat(payment): look an invoice up in SkillForge`; open P2's PR (stacked on #272), tick
      P2's boxes in the spec.

## Slice P3 - the page (one PR, stacked on P2)

### Task 5: Texts, the form and the page

**Files:**

- Modify: `apps/marketing/src/content/status.ts` (`paymentPage`)
- Create: `apps/marketing/src/app/zahlung/_components/invoice-form.tsx`
- Modify: `apps/marketing/src/app/zahlung/page.tsx`
- Modify: `packages/ui/src/layout/status-page.tsx` (+ story, test) - `lead` becomes optional and renders nothing
  when absent (the `paid` state has none)
- Remove from `invoice-link.ts`: `parsePaymentRequest`, `normalizeAmount`, `AMOUNT_PATTERNS`, `CURRENCY_SUFFIX` and
  their tests - `betrag` is ignored now (P-02)

**Interfaces:**

- Consumes: `parseInvoiceNumber`, `toPageState`, `buildPaypalUrl` (index); `lookupInvoice`, `logPayment` (server).
- Produces: `paymentPage` with `form`, `blocked`, `paid`, `notPayable`, `unavailable`, each `{ title, lead? }`;
  `blocked.lead` is `(invoice: string) => string`. Texts exactly as the spec's table.

- [ ] **Step 1:** the page flow, in `page.tsx`:
  - no `re` → the form page (`InvoiceForm`: `<form method="get" action={routes.payment}>`, `Field`
    `Rechnungsnummer` with `Input name="re" placeholder="RE-1234" required`, `Button` `Weiter zu PayPal`);
  - `re` malformed → today's page and `rejected`, unchanged;
  - else `toPageState(invoice, await lookupInvoice(invoice))` → `redirect(buildPaypalUrl(...))` after
    `logPayment("redirected", …)`, or the state's `StatusPage` after its log line. `not_payable` shows the form
    again below the contact ways.
  - `routes.payment` exists in `lib/routes.ts` or is added there.
- [ ] **Step 2:** `pnpm --filter @skillsite/ui test` and the marketing unit tests PASS; `just ratchet` unchanged.
- [ ] **Step 3:** commit `feat(payment): show a field for the invoice number and a page per state`.

### Task 6: A SkillForge stub for Playwright and the e2e tests

**Files:**

- Create: `apps/marketing/e2e/stubs/skillforge.mjs`
- Modify: `apps/marketing/playwright.config.ts` - `webServer` becomes an array: the stub on port 3199
  (`url: http://127.0.0.1:3199/health`), then the app with `SKILLFORGE_API_URL=http://127.0.0.1:3199`,
  `SKILLFORGE_CLIENT_ID=marketing-e2e`, `SKILLFORGE_CLIENT_SECRET=sf_synthetic_secret`
- Modify: `apps/marketing/e2e/smoke.spec.ts`

**Interfaces:**

- The stub (plain `node:http`, no dependency): `GET /health` → 200; `POST /api/v1/auth/token` with the Basic pair
  above → `{ "access_token": "stub", "token_type": "bearer", "expires_in": 3600 }`, else 401;
  `GET /api/v1/billing/payment-requests/<n>` with `Authorization: Bearer stub`:
  `RE-1001` open 2250 allowed; `RE-1002` open 2250 blocked; `RE-1003` paid 0; `RE-1004` 404
  `invoice_not_payable`; `RE-1005` 502; anything else 404.

- [ ] **Step 1: Write the failing tests** in `smoke.spec.ts` (replace the valid-link test):
  - `an old link pays sevDesk's amount, not the link's` - `/zahlung?re=RE-1001&betrag=90,00%20EUR`, no redirects
    followed → 307, `location` matches PayPal and contains `amount=22.50&invoice=RE-1001`.
  - `the form leads to the lookup` - `/zahlung` shows the field `Rechnungsnummer`; fill `re-1001`, press
    `Weiter zu PayPal` → the request to PayPal carries `invoice=RE-1001` (intercept `www.paypal.com` with
    `page.route` and abort it; assert the URL).
  - one test per state: `RE-1002` heading `Bitte per Überweisung zahlen.` and lead containing `RE-1002`;
    `RE-1003` `Diese Rechnung ist schon bezahlt. Danke!`; `RE-1004` `Diese Rechnung finde ich nicht.` and the
    field; `RE-1005` `Die Zahlung ist gerade nicht erreichbar.` - each `200`, no console errors, no redirect.
  - keep `an invalid payment link renders a page instead of redirecting`.
- [ ] **Step 2:** `just smoke` - FAIL before the stub and config exist.
- [ ] **Step 3:** add the stub and the config.
- [ ] **Step 4:** `CAL_API_KEY= just check` PASS (counts for the PR); `just smoke` PASS three times in a row.
- [ ] **Step 5:** commit `test(payment): drive the payment page against a SkillForge stub`; open P3's PR (stacked
      on P2) with _How to check_ from the spec's P3 _Check_ (against `node apps/marketing/e2e/stubs/skillforge.mjs`),
      tick P3's boxes. _For the maintainer_: P-07 and the three variables must be set in production before the release
      that carries P3.
