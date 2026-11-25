# Spec: Payment page (`/zahlung` looks the invoice up in SkillForge)

> Status: Draft, 2026-11-25 - P0 open as a `fix:` PR (#297).
> Builds on SkillForge's [billing spec][billing] (sevDesk client, ADR 0010, the `client_credentials` grant of
> [`user-authentication.md`][auth]) and on the admin helper's typed client (`@skillsite/api-client`, AH-8). This
> spec is the decision record for the arc; the SkillForge half lands as an amendment of `billing.md` (P1a, P1b).

## Problem statement

Since 2026-11-18 every invoice uses one sevDesk layout. It always prints the GiroCode and a PayPal link; the line
"Zahlungsverfahren" is gone. The layout builds the link itself:

```text
https://nachhilfe.leonweimann.de/zahlung?re={{data.object.invoice_number}}&betrag={{data.object.total}}
```

`/zahlung` today trusts that link: it validates `re` and `betrag` and redirects to PayPal's checkout
(`apps/marketing/src/modules/payment/model/invoice-link.ts`). That no longer fits:

- **Every family sees the PayPal link**, but a few customers must not pay by PayPal. The link alone cannot tell
  them apart.
- **A family cannot type an invoice number.** Without a usable link the page shows only a way to get in touch.
- **The amount comes from the link.** It is only as right as the link: a cut or edited link sends a wrong amount
  to PayPal, and a raw total like `22.5` was refused until P0.

## Goals

1. `/zahlung?re=<number>` redirects to PayPal with the invoice's **open amount read from sevDesk**.
2. `/zahlung` without parameters shows a **field for the invoice number**.
3. For a **blocked customer** the page asks for a bank transfer instead of redirecting.
4. A paid invoice says so; anything else ends on today's "link leads nowhere" page.
5. Old links (`?re=…&betrag=…`) keep working.

## Non-goals

- **Protection against trying invoice numbers.** Decided by the maintainer (P-04): whoever pays an invoice may.
- **Detecting the payment** or marking the invoice paid; sevDesk and the maintainer do that.
- **Billing changes beyond the texts.** Lessons, rates and drafts stay as `billing.md` decides them.
- **A PayPal API.** The redirect stays the hosted-button URL without credentials.

## Decisions

| #    | Decision                                                                                                                                                                                                                                                                                                                                                                       | Date                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| P-01 | One invoice layout for everyone: GiroCode and PayPal link always; no payment method on the invoice and none read from sevDesk. `billing.md` decision K, the blocker `payment_method_missing`, `payment_methods.py`, `SEVDESK__PAYMENT_METHOD_FIELD_SETTING_ID` and the two foot texts go; SF8 is moot. The maintainer stops maintaining the contact field "Zahlungsverfahren". | 2026-11-25, maintainer                                  |
| P-02 | The open amount comes from sevDesk, through SkillForge (approach A). skillsite never holds a sevDesk token. `betrag` in a link is ignored.                                                                                                                                                                                                                                     | 2026-11-25, maintainer                                  |
| P-03 | Blocked customers are a list of sevDesk customer numbers in SkillForge's configuration (`BILLING__PAYPAL_BLOCKED_CUSTOMER_NUMBERS`, about five). SkillForge answers only "PayPal allowed or not"; skillsite never sees a customer number.                                                                                                                                      | 2026-11-25, maintainer (env); SkillForge side: proposal |
| P-04 | No guard against enumerating invoice numbers. A rate limit protects only sevDesk's quota: one global limit in SkillForge's lookup, no client address stored (so the privacy text needs no change).                                                                                                                                                                             | 2026-11-25, maintainer; the global limit: proposal      |
| P-05 | Page states: payable → redirect; blocked → a neutral "please pay by bank transfer"; paid → "already paid"; unknown, draft, cancelled, SkillForge or sevDesk unreachable → today's "link leads nowhere" page. Without an answer from SkillForge the page never redirects (fail closed).                                                                                         | 2026-11-25, maintainer                                  |
| P-06 | Raw layout totals with one decimal (`22.5`, `22,5`) are accepted by the link parser (P0, a `fix:`).                                                                                                                                                                                                                                                                            | 2026-11-25, maintainer                                  |
| P-07 | Production SkillForge reads the real sevDesk account before P3 is released, earlier than SF7; writes stay `dry_run` until SF7.                                                                                                                                                                                                                                                 | 2026-11-25, maintainer                                  |
| P-08 | Dunning letters carry the same link; the lookup accepts a dunning's number too and sends the remaining amount sevDesk reports for it, what the letter prints - verified on the trial first.                                                                                                                                                                                    | 2026-11-25, maintainer                                  |
| P-09 | The fixtures are recorded on a second sevDesk trial, created when P1b is ready to record (planned for the week of 2026-11-30); the real account never gets a test object. P1a does not wait for it.                                                                                                                                                                            | 2026-11-25, maintainer                                  |
| P-10 | The terms (`content/legal/agb.tsx`, "per PayPal oder Überweisung") stay unchanged: the maintainer says the wording runs out soon.                                                                                                                                                                                                                                              | 2026-11-25, maintainer                                  |
| P-11 | Page texts as in [Family-visible texts](#family-visible-texts); several children on one invoice: `<Vorname> / Di, 17.11.2026 → 16:00–17:00`.                                                                                                                                                                                                                                   | 2026-11-25, maintainer                                  |

## Rules of the arc

- **Fail closed.** No redirect to PayPal without a fresh SkillForge answer for that number - not when SkillForge is
  unconfigured, unreachable or answers something unexpected. A redirect without the lookup would bypass P-03.
- **Recipient, currency and item name stay constants** in `invoice-link.ts`; SkillForge supplies the amount, the
  number is the one SkillForge confirmed.
- **No personal data crosses to skillsite**: the lookup answer holds the number, a state, the open amount and a
  PayPal flag - no name, contact or customer number. The log line keeps today's shape (`[payment] <outcome>`).
- **One log line per request**, `force-dynamic`, no cache - as today.

## Target shape

### SkillForge (in `billing.md`, P1a and P1b)

- `GET /api/v1/billing/payment-requests/{invoice_number}`, scope `billing:payment:read` (new; an `application`
  grant of skillsite's own client, not in `admin`). Reads only; never writes to sevDesk.
- `{invoice_number}` matches `^[A-Z0-9][A-Z0-9._-]{0,31}$`: a path segment, so no `/` (sevDesk numbers read `RE-%NUMBER`, Q3).
- Reads `GET /Invoice?invoiceNumber=<n>` (filter to be recorded on the trial - unverified) and the invoice's
  contact for its `customerNumber`.
- Answer `200`:

  ```json
  {
    "invoice_number": "RE-1950",
    "state": "open",
    "open_amount_cents": 2250,
    "paypal": "allowed"
  }
  ```

  - `state`: `open` - `invoiceType` `RE`, status 200 or 750; `paid` - status 1000 with `paidAmount` > 0.
  - `open_amount_cents`: `sumGross` minus `paidAmount`, in cents; 0 when paid.
  - `paypal`: `blocked` when the contact's customer number is in `BILLING__PAYPAL_BLOCKED_CUSTOMER_NUMBERS`.

- `404 invoice_not_payable` - no such number, a draft (100), a cancellation (`SR`), or a cancelled original
  (status 1000, `paidAmount` 0 - Q12 of `billing.md`). `502` for a sevDesk error (PD6).
- **Dunning letters** carry the same link (dunning layout: `re={{data.object.invoice_number}}`,
  `betrag={{data.object.reminder_remaining_amount}}`). Which number `re` holds there and how a dunning reads through
  the API is unverified and recorded with the other fixtures (P-08, P-09); the state rules above extend to it.
- **Precondition (P-07):** production SkillForge reads the real sevDesk account (`SEVDESK__TOKEN`,
  `SEVDESK__ACCOUNT=live`, the account id) before P3 is released. Writes stay `dry_run` until SF7.
- **Rate limit:** a global cap on lookups per minute inside SkillForge (the value is the builder's, sized well below
  sevDesk's quota); over it the route answers `429` and skillsite shows `unavailable`.

#### `billing.md` amendment (texts)

P-01, and the family-visible texts follow the maintainer's templates of 2026-11-18 word for word. The signature is
`[%KONTAKTPERSON%]`, never a name in the repository; it renders as today.

`HEAD_TEXT` (raw):

```text
[%VOLLEANREDE%],
vielen Dank für Ihr Vertrauen. Hier ist die Abrechnung der Nachhilfestunden im oben genannten Zeitraum:
```

`FOOT_TEXT` (raw; `bis zum [%ZAHLUNGSZIEL%]` bold):

```text
Bitte überweisen Sie den Betrag bis zum [%ZAHLUNGSZIEL%] mit dem Verwendungszweck [%RECHNUNGSNUMMER%].
Bei Fragen erreichen Sie mich jederzeit per E-Mail oder WhatsApp.
Mit freundlichen Grüßen
[%KONTAKTPERSON%]
```

`POSITION_DESCRIPTION`: `<Wt>, <TT>.<MM>.<JJJJ> → <HH:MM>–<HH:MM>` - weekday in two letters (`Mo`, `Di`, `Mi`, `Do`,
`Fr`, `Sa`, `So`), day and month with leading zero, the arrow U+2192 with one space on each side, the en dash
U+2013 without spaces. Example: `Di, 17.11.2026 → 16:00–17:00`. Several children (P-11):
`<Vorname> / Di, 17.11.2026 → 16:00–17:00`.

A top-up's texts stay deferred to SFP (M2 of `billing.md`); the new head text speaks of "Abrechnung der
Nachhilfestunden", which SFP revisits for a top-up.

### skillsite

```text
apps/marketing/src/modules/payment/
  model/invoice-link.ts      parse `re` (amount parsing goes with P3: `betrag` is ignored), build the PayPal URL
  model/payment-state.ts     the lookup answer -> page state, pure
  server/lookup.ts           SkillForge call: client_credentials token, typed client, timeout, fail closed
  server/log.ts              outcomes: redirected | blocked | paid | not_payable | unavailable | rejected
apps/marketing/src/app/zahlung/page.tsx   form (no params), redirect, or one status page per state
apps/marketing/src/content/status.ts      texts of the new states (German)
apps/marketing/src/lib/env.ts             SKILLFORGE_API_URL, SKILLFORGE_CLIENT_ID, SKILLFORGE_CLIENT_SECRET
```

- The form is a plain `<form method="get">` with one field (`re`) from `@skillsite/ui/forms/field` - it works
  without JavaScript.
- Unconfigured (no SkillForge variables): every lookup state is `unavailable`, like the booking's `unconfigured`.

### Family-visible texts

Approved by the maintainer (P-11); `content/status.ts` copies them. `<Nummer>` is the number the visitor gave.

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

**P1a - SkillForge: amend `billing.md`.** _(now; docs only)_

- _Technique:_ a `docs(billing)` PR amends the frozen spec with an **Amended** line: P-01 (decision K, the blocker,
  `payment_methods.py`, the setting, fixtures S4/S5, SF8), the texts of the target shape, and a slice `SF-PAY` with
  the route, the scope `billing:payment:read`, `BILLING__PAYPAL_BLOCKED_CUSTOMER_NUMBERS` and its fixtures.
- _Check:_ none visible.
- _Acceptance criteria:_
  - [ ] Nothing in `billing.md` still reads a payment method or sets a PayPal link; `test_texts_match_the_spec`
        has nothing to compare yet (SF5-2 builds `texts.py` from the amended blocks).

**P1b - SkillForge: `SF-PAY`, the lookup.** _(after P1a and the second trial, P-09)_

- _Technique:_ `find_invoice_by_number` in `app/integrations/sevdesk/client.py`, the service in
  `app/services/billing/`, the route, the scope, the setting and the global limit. The fixtures for the filter,
  each state and a dunning are recorded on the trial, after the maintainer's go.
- _Check:_ none visible.
- _Acceptance criteria:_
  - [ ] Each state of the target shape and a dunning have a test against recorded fixtures; an unrecorded filter
        stops the slice.
  - [ ] A blocked customer number yields `paypal: blocked`; the number never appears in a response or a log line.
  - [ ] Released in a SkillForge version before P3 is released.

**P2 - skillsite: the lookup in the payment module.** _(after P1b; stacks on `@skillsite/api-client`)_

- _Technique:_ contract sync; `server/lookup.ts`, `model/payment-state.ts`, the env variables in `env.ts`, the log
  outcomes. `page.tsx` unchanged.
- _Check:_ none visible.
- _Plan:_ [task plan](../plans/payment-page.md), Tasks 1-4.
- _Acceptance criteria:_
  - [ ] Unit tests map every SkillForge answer, a timeout and a malformed body to a state; anything unexpected is
        `unavailable`.
  - [ ] A malformed variable stops the server at start (`instrumentation.ts`).

**P3 - skillsite: the page.** _(after P2)_

- _Technique:_ `page.tsx` renders the form, the redirect or the state's status page; texts in `content/status.ts`.
  No rate limit in skillsite (P-04 puts it into SkillForge).
- _Check:_ `/zahlung`, `/zahlung?re=<open>`, `<blocked>`, `<paid>`, `<unknown>`, SkillForge stopped - light and
  dark, phone and desktop, against a stub SkillForge that answers each state (`SEVDESK__MODE=fake` is SF5-4's and
- _Plan:_ [task plan](../plans/payment-page.md), Tasks 5-6.
  is not pulled forward), never production.
- _Acceptance criteria:_
  - [ ] Playwright: no params shows the field; submitting it lands on `?re=`; a stubbed SkillForge drives each
        state. That an unconfigured SkillForge never redirects is a unit test of P2, the cheapest layer.
  - [ ] `betrag` in an old link changes nothing.

## Timeline / phasing

P0 now. P1a now, before SF5 builds the texts. P1b after the second trial (P-09). P2 can be written against P1b's
contract and stacks on the admin helper's `@skillsite/api-client` (#272); it syncs the contract after P1b's release.
P3 follows P2 and is released only after P-07 is set in production. Shared files: `env.ts` and `content/status.ts` (P2, P3), SkillForge's
`config.py`, `scopes.py`, `openapi.json` (P1b and the billing slices).

## Open questions

### For the maintainer

None blocking; the answers of 2026-11-25 are P-07 to P-11. One setting is the maintainer's, named under _For the
maintainer_ of P1b and P3: how the marketing container reaches SkillForge in production (proposal: the compose
stack's internal network), skillsite's client with its `billing:payment:read` grant, and the variables of P-03 and
P-07.

## Rules for implementing agents

[`AGENTS.md`](../../AGENTS.md) applies in full; in SkillForge its own `AGENTS.md` and the billing spec's rules.
Every PR of this arc is `Review: deep` (money, families see it). No lookup ever runs against the real sevDesk
account or the production SkillForge from an agent session.

[billing]: https://github.com/nachhilfe-leon-weimann/skillforge/blob/main/docs/specs/billing.md
[auth]: https://github.com/nachhilfe-leon-weimann/skillforge/blob/main/docs/specs/user-authentication.md
