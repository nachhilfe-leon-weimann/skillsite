# Skillsite

The website of Nachhilfe Leon Weimann - marketing pages, appointment booking through Cal.com and the
payment links printed on invoices - as a pnpm/Turborepo workspace with the Next.js app in
[`apps/marketing`](apps/marketing), the portal in [`apps/portal`](apps/portal) and shared packages in
[`packages/`](packages). The portal's first area is the admin helper
([`docs/specs/admin-helper.md`](docs/specs/admin-helper.md)); it is not deployed yet.

## Development

Needs Node 26, `pnpm` and `just`. `just check`'s smoke test needs a one-time browser install:
`pnpm --filter @skillsite/marketing exec playwright install chromium`.

The environment is optional. `apps/marketing/.env` (see `.env.example` next to it) holds `CAL_API_KEY`: without
it, the booker shows its "unconfigured" state; with it, the key must start with `cal_live_` and contain no
whitespace, or the server stops at start with an `[env]` line naming the rule. `.env.local.example` documents what
only local development needs.

| Command                                 |                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `just dev`                              | run the site (`localhost:3000`) and the portal (`localhost:3001`)                         |
| `just check`                            | the full suite, green before every push; CI scopes pull requests to the areas they change |
| `just docker-build` / `just docker-run` | build and run the production image locally                                                |

Everything else is in the [`justfile`](justfile). The image builds the marketing app by default;
another app comes from `--build-arg APP=<name>` (`just docker-build <image> portal`).

The portal calls SkillForge through [`packages/api-client`](packages/api-client), a client typed by SkillForge's
OpenAPI contract. A new SkillForge release comes in as a PR of its own:
`pnpm --filter @skillsite/api-client sync [checkout]` copies the contract from a SkillForge checkout (default
`../skillforge`) and regenerates the types; `just check` then shows what the new contract breaks.

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
guessed. Recipient, currency and item name are constants in
`apps/marketing/src/modules/payment/model/invoice-link.ts` - a
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
