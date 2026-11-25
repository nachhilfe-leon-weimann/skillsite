# Spec: Payment page (`/zahlung` looks the invoice up in SkillForge)

> Status: Draft, 2026-11-25 - P0 open as a `fix:` PR (#297).
> Builds on SkillForge's [billing spec][billing], slice `SF-PAY` (the payment-request lookup), on the
> `client_credentials` grant of [`user-authentication.md`][auth] and on the admin helper's typed client
> (`@skillsite/api-client`, AH-8). This spec covers skillsite only; what SkillForge reads from sevDesk, the blocked
> customers and the invoice texts are decided in `billing.md`.

## Problem statement

Since 2026-11-18 every invoice uses one sevDesk layout. It always prints the GiroCode and a PayPal link; the line
"Zahlungsverfahren" is gone. The layout builds the link itself:

```text
https://nachhilfe.leonweimann.de/zahlung?re={{data.object.invoice_number}}&betrag={{data.object.total}}
```

Dunning letters carry the same link with `betrag={{data.object.reminder_remaining_amount}}`. Dunning stays in sevDesk:
the lookup serves invoices only, so a dunning's number ends on the "not found" page (the maintainer, 2026-11-25).

`/zahlung` today trusts that link: it validates `re` and `betrag` and redirects to PayPal's checkout
(`apps/marketing/src/modules/payment/model/invoice-link.ts`). That no longer fits:

- **Every family sees the PayPal link**, but a few customers must not pay by PayPal. The link alone cannot tell
  them apart.
- **A family cannot type an invoice number.** Without a usable link the page shows only a way to get in touch.
- **The amount comes from the link.** It is only as right as the link: a cut or edited link sends a wrong amount
  to PayPal, and a raw total like `22.5` was refused until P0.

## Goals

1. `/zahlung?re=<number>` redirects to PayPal with the **open amount SkillForge reads from sevDesk**.
2. `/zahlung` without parameters shows a **field for the invoice number**.
3. For a **blocked customer** the page asks for a bank transfer instead of redirecting.
4. A paid invoice says so; an unknown one says so and offers the field again.
5. Old links (`?re=…&betrag=…`) keep working.

## Non-goals

- **Protection against trying invoice numbers.** Decided by the maintainer (P-03): whoever pays an invoice may.
- **A rate limit.** Neither skillsite nor SkillForge limits the lookups in v1 (`billing.md`, `SF-PAY`); a sevDesk
  throttle surfaces as SkillForge's `502` and the page shows "not reachable". skillsite stores no client address.
- **Detecting the payment** or marking the invoice paid; sevDesk and the maintainer do that.
- **A PayPal API.** The redirect stays the hosted-button URL without credentials.

## Decisions

| #    | Decision                                                                                                                                                                                                                                                                                                     | Date                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| P-01 | The open amount comes from sevDesk through SkillForge's lookup (approach A). skillsite never holds a sevDesk token. `betrag` in a link is ignored.                                                                                                                                                           | 2026-11-25, maintainer |
| P-02 | Which customers may not pay by PayPal is SkillForge's (`billing.md`). skillsite sees only the flag `paypal: allowed \| blocked`, never a customer number.                                                                                                                                                    | 2026-11-25, maintainer |
| P-03 | No guard against enumerating invoice numbers.                                                                                                                                                                                                                                                                | 2026-11-25, maintainer |
| P-04 | Page states: payable → redirect; blocked → "please pay by bank transfer"; paid → "already paid"; not payable → "not found" with the field; SkillForge unconfigured, unreachable or answering something unexpected → "not reachable". Without a `200` from SkillForge the page never redirects (fail closed). | 2026-11-25, maintainer |
| P-05 | Raw layout totals with one decimal (`22.5`, `22,5`) are accepted by the link parser (P0, a `fix:`); the amount parsing goes with P2, when `betrag` is ignored.                                                                                                                                               | 2026-11-25, maintainer |
| P-06 | The terms (`content/legal/agb.tsx`, "per PayPal oder Überweisung") stay unchanged: the maintainer says the wording runs out soon.                                                                                                                                                                            | 2026-11-25, maintainer |
| P-07 | Page texts as in [Family-visible texts](#family-visible-texts).                                                                                                                                                                                                                                              | 2026-11-25, maintainer |
| P-08 | skillsite reaches SkillForge at its public origin `https://api.leonweimann.de`, as the portal does.                                                                                                                                                                                                          | 2026-11-25, maintainer |

## Rules of the arc

- **Fail closed.** No redirect to PayPal without a fresh SkillForge answer for that number - not when SkillForge is
  unconfigured, unreachable or answers something unexpected. A redirect without the lookup would bypass P-02.
- **Recipient, currency and item name stay constants** in `invoice-link.ts`; SkillForge supplies the amount, the
  number is the one SkillForge confirmed.
- **No personal data in skillsite**: the lookup answer holds the number, a state, the open amount and a PayPal
  flag - nothing else is read, logged or rendered. The log line keeps today's shape (`[payment] <outcome>`).
- **One log line per request**, `force-dynamic`, no cache - as today.

## Target shape

### The SkillForge contract skillsite relies on

Defined in `billing.md` (`SF-PAY`); skillsite takes it from the synced `openapi.json`, never from this table.

| Call                                                                                                                 | Answer                                                                                  | Page state                                           |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `GET /api/v1/billing/payment-requests/{invoice_number}`, Bearer token of skillsite's client (`billing:payment:read`) | `200` `{ "invoice_number", "state": "open", "open_amount_cents", "paypal": "allowed" }` | redirect                                             |
|                                                                                                                      | `200` with `"paypal": "blocked"`                                                        | blocked                                              |
|                                                                                                                      | `200` with `"state": "paid"`, or `open` with `open_amount_cents` 0                      | paid                                                 |
|                                                                                                                      | `404`                                                                                   | not payable                                          |
|                                                                                                                      | `401`                                                                                   | invalidate the token, retry once, then not reachable |
|                                                                                                                      | `429`, `5xx`, a body off the contract, a timeout                                        | not reachable                                        |

`{invoice_number}` is a path segment: no `/` (sevDesk numbers read `RE-%NUMBER`).

### skillsite

```text
packages/api-client/src/service-token.ts  a cached client_credentials token (shared with the portal later)
apps/marketing/src/modules/payment/
  model/invoice-link.ts      parse `re`, build the PayPal URL
  model/payment-state.ts     the lookup answer -> page state, pure
  server/lookup.ts           SkillForge call: token, typed client, timeout, fail closed
  server/log.ts              outcomes: redirected | blocked | paid | not_payable | unavailable | rejected
apps/marketing/src/app/zahlung/page.tsx   form (no params), redirect, or one status page per state
apps/marketing/src/content/status.ts      texts of the new states (German)
apps/marketing/src/lib/env.ts             SKILLFORGE_API_URL, SKILLFORGE_CLIENT_ID, SKILLFORGE_CLIENT_SECRET
```

- The form is a plain `<form method="get">` with one field (`re`) from `@skillsite/ui/forms/field` - it works
  without JavaScript.
- Unconfigured (no SkillForge variables): every lookup is `unavailable`, like the booking's `unconfigured`.

### Family-visible texts

Approved by the maintainer (P-07); `content/status.ts` copies them. `<Nummer>` is the number the visitor gave.

| State          | Title                                    | Lead                                                                                  | Below                                                                  |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| form (no `re`) | Rechnung online bezahlen                 | Gib deine Rechnungsnummer ein.                                                        | field `Rechnungsnummer` (example `RE-1234`), button `Weiter zu PayPal` |
| `blocked`      | Bitte per Überweisung zahlen.            | Nutze den GiroCode oder die Bankdaten auf der Rechnung, Verwendungszweck: `<Nummer>`. | contact ways                                                           |
| `paid`         | Diese Rechnung ist schon bezahlt. Danke! | -                                                                                     | contact ways                                                           |
| `not_payable`  | Diese Rechnung finde ich nicht.          | Prüf die Nummer auf deiner Rechnung oder schreib mir kurz.                            | the field again, contact ways                                          |
| `unavailable`  | Die Zahlung ist gerade nicht erreichbar. | Versuch es gleich noch einmal oder überweise mit dem GiroCode auf deiner Rechnung.    | contact ways                                                           |
| malformed `re` | today's page, unchanged                  |                                                                                       |                                                                        |

The eyebrow stays `Zahlung`. No IBAN on any page: it stays off the public repository, and the family has the
invoice.

## Requirements

### Phase P - Payment page

**P0 - Accept the layout's raw total.** _(now)_

- _Technique:_ `AMOUNT_PATTERNS` in `invoice-link.ts` accepts `^\d+[.,]\d$`.
- _Check:_ `/zahlung?re=RE-1&betrag=22.5` redirects to PayPal with `22.50`.
- _Acceptance criteria:_
  - [ ] `invoice-link.test.mts` covers `30`, `22.5`, `22,5`, `1234.5`; `1.234,5` stays refused.

**P1 - The lookup in the payment module.** _(once SkillForge's `SF-PAY` PR fixes the route; stacks on
`@skillsite/api-client`, #272)_

- _Technique:_ contract sync; `service-token.ts`, `server/lookup.ts`, `model/payment-state.ts`, the env variables
  in `env.ts`, the log outcomes. `page.tsx` unchanged.
- _Check:_ none visible.
- _Plan:_ [task plan](../plans/payment-page.md), Tasks 1-4.
- _Acceptance criteria:_
  - [ ] Unit tests map every answer of the contract table, a timeout and a malformed body to a state; anything
        unexpected is `unavailable`; an unconfigured runtime never makes a request.
  - [ ] A malformed variable stops the server at start (`instrumentation.ts`).

**P2 - The page.** _(after P1)_

- _Technique:_ `page.tsx` renders the form, the redirect or the state's status page; texts in `content/status.ts`;
  the amount parsing of `invoice-link.ts` goes (P-05).
- _Check:_ `/zahlung`, `/zahlung?re=<open>`, `<blocked>`, `<paid>`, `<unknown>`, SkillForge failing - light and
  dark, phone and desktop, against the SkillForge stub of the e2e tests, never production.
- _Plan:_ [task plan](../plans/payment-page.md), Tasks 5-6.
- _Acceptance criteria:_
  - [ ] Playwright: no params shows the field; submitting it lands on `?re=`; the stub drives each state.
  - [ ] `betrag` in an old link changes nothing.

## Timeline / phasing

P0 now. P1 starts once SkillForge's `SF-PAY` PR fixes the route: the contract is synced from that branch and
again from `main` after its merge; P1 stacks on #272.
P2 follows P1. The release that carries P2 ships only after SkillForge's release with `SF-PAY` is live and the
production settings below are set. Shared files: `env.ts` and `content/status.ts` (P1, P2).

## Open questions

### For the maintainer

None blocking. Settings, named again under _For the maintainer_ of P2: skillsite's client at SkillForge with the
`billing:payment:read` grant, and `SKILLFORGE_API_URL=https://api.leonweimann.de`, `SKILLFORGE_CLIENT_ID`,
`SKILLFORGE_CLIENT_SECRET` for the marketing container.

## Rules for implementing agents

[`AGENTS.md`](../../AGENTS.md) applies in full. Every PR of this arc is `Review: deep` (money, families see it). No
lookup ever runs against the production SkillForge or the real sevDesk account from an agent session.

[billing]: https://github.com/nachhilfe-leon-weimann/skillforge/blob/main/docs/specs/billing.md
[auth]: https://github.com/nachhilfe-leon-weimann/skillforge/blob/main/docs/specs/user-authentication.md
