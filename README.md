# Skillsite

The website of Nachhilfe Leon Weimann - marketing pages, appointment booking through Cal.com and the
payment links printed on invoices - as a pnpm/Turborepo workspace with the Next.js app in
[`apps/marketing`](apps/marketing) and shared packages in [`packages/`](packages).

## Development

Needs Node 26, `pnpm`, `just` and an `apps/marketing/.env` (see `.env.example` next to it;
`.env.local.example` documents what only local development needs). `just check`'s smoke test needs a
one-time browser install: `pnpm --filter @skillsite/marketing exec playwright install chromium`.

| Command                                 |                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `just dev`                              | run the site                                                                |
| `just check`                            | everything that must be green before a push; CI's `check` job runs the same |
| `just docker-build` / `just docker-run` | build and run the production image locally                                  |

Everything else is in the [`justfile`](justfile). The image builds the marketing app by default;
another app comes from `--build-arg APP=<name>`.

## Operating the booking

Every booking attempt that reaches the server leaves exactly one line in the container log
(`[booking] <outcome> {…}`). The UI reports success only for `created`, which means Cal.com confirmed
the booking. The only personal detail is a masked e-mail (`ma***@example.com`), so a wrongly blocked
customer stays recognisable.

| Outcome        | Level | Meaning                                                       |
| -------------- | ----- | ------------------------------------------------------------- |
| `created`      | info  | Cal.com booked it (`calUid` is the booking in Cal.com)        |
| `slot_taken`   | info  | the slot was taken in the meantime                            |
| `blocked`      | warn  | the spam guard stopped it (`signal`) - can be a real customer |
| `rate_limited` | warn  | the IP hit the limit                                          |
| `rejected`     | warn  | server validation failed although the form checks the same    |
| `failed`       | error | Cal.com unreachable, unconfigured or answering with an error  |

```bash
docker logs <container> 2>&1 | grep -F "[booking]" | grep -vE "created|slot_taken"
```

Bookings that fail in the browser before they reach the server show up as the Umami event
`booking-failed`.

## Operating the payment link

Invoices from sevDesk link to `/zahlung?re=<invoice>&betrag=<amount>`, which redirects to the PayPal
checkout with amount and invoice number prefilled:

```
https://nachhilfe.leonweimann.de/zahlung?re=RE-1840&betrag=90,00%20EUR
```

The amount may look the way sevDesk writes it (`90,00 EUR`, `1.234,56 EUR`, or without a currency);
ambiguous figures like `1.234`, amounts below 0.01 € and above 5,000 € are rejected instead of
guessed. Recipient, currency and item name are constants in `apps/marketing/src/lib/payment/invoice-link.ts` - a
link can only decide amount and invoice number, never the account. The page stays out of search
(`robots.txt`, `noindex`, and `unlistedRoutes` in `apps/marketing/src/lib/routes.ts`).

Each call leaves one line (`[payment] <outcome> {…}`) with invoice number and amount, no name, e-mail
or IP: `redirected` (info) or `rejected` (warn, with `reason` and the raw values). Repeated
`rejected` lines mean the sevDesk template is wrong.

```bash
docker logs <container> 2>&1 | grep -F "[payment] rejected"
```

## Releasing

Merging the release PR (`chore(main): release X.Y.Z`) is the release: tag, image and deploy follow.
Never bump the version or tag by hand - the conventional commits on `main` (`feat`, `fix`, `!`) drive
both, and [`compose.yml`](compose.yml) records the version prod runs.

The platform's one flow, documented in skillforge:
[`release-flow.md`](https://github.com/Nachhilfe-Leon-Weimann/skillforge/blob/main/docs/specs/release-flow.md)
(the why), [rolling back](https://github.com/Nachhilfe-Leon-Weimann/skillforge#rolling-back), and
[`skill-platform-workflows`](https://github.com/Nachhilfe-Leon-Weimann/skill-platform-workflows) (the
deploy).
