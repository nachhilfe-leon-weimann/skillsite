# Testing

The test contract: which layer guards what, and what no test guards. `AGENTS.md` holds the rules an agent must not
break; this file holds their reason.

## Principle

A test guards behaviour someone relies on: a visitor, a keyboard or screen-reader user, the booking. It does not
guard an implementation detail, the previous behaviour of `main`, or the look. The look stays the maintainer's
manual check (E-12 in [`specs/foundation-refactor.md`](specs/foundation-refactor.md)).

During the foundation refactor, many browser tests pinned `main`'s exact behaviour (frame timings, mid-animation
opacity, hit-testing during an exit) so that a refactor could prove it changed nothing. That bar was for the
refactor only: older suites may still hold such equivalence checks, and a pruning PR removes them. From now on this
contract is the reference, not `main`'s former behaviour.

## Layers

Each behaviour is guarded on the cheapest layer that can see it, and on one layer only.

| Layer     | Tool                                                                                                                               | Guards                                                                                                                                                                                                            | Does not guard                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Logic     | Vitest, node: `*.test.ts` in the packages and `apps/marketing/src`, [`tests/`](../tests/), [`scripts/`](../scripts/) (`just test`) | booking logic, dates and time zones, schemas, config, prices; money and data paths also get a mutation probe                                                                                                      | -                                              |
| Component | Vitest, jsdom: `*.test.tsx` (`just test`)                                                                                          | the public API and props, ARIA attributes, state changes                                                                                                                                                          | focus order, layout, motion                    |
| Widget    | Playwright against the built Storybook: [`packages/ui/e2e/`](../packages/ui/e2e/) (`just widgets`)                                 | each widget's keyboard and screen-reader contract after its [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) pattern: role and name, keys, focus in, out and back, dismissal. The only place for widget behaviour | how a page wires the widget                    |
| Page      | Playwright against the production build: [`apps/marketing/e2e/`](../apps/marketing/e2e/) (`just smoke`)                            | what only a page shows (below)                                                                                                                                                                                    | widget details the widget layer already guards |

## Page layer

- **Smoke:** every route renders without console errors; the 404 too.
- **Wiring:** the current page is marked; the 1080px breakpoint hands over between mobile and desktop navigation;
  client navigation leaves no overlay behind; the platform popover and the duration list are never open together.
- **Booking:** the whole keyboard path to a valid form, never submitting; the availability states (days, empty,
  error, unconfigured); the calendar across time zones and month bounds; failure and success are announced.
- **Motion:** only two things. A declared animation runs at all and ends in its end state (the Tailwind v4
  `translate`/`scale` trap in [`AGENTS.md`](../AGENTS.md)); with reduced motion, everything is at its end state at
  once.
- **Layout:** only regressions of named bugs (the anchor below the sticky header, the 1080px gap).

## Out of scope

- Frame or pixel comparisons: opacity mid-animation, reversed sweeps, sub-pixel offsets.
- Comparisons against `main`'s former behaviour, and probes taken over from reviews.
- Library internals (for example Radix focus guards), unless they caused a bug that was fixed.
- The same behaviour asserted on both the widget and the page layer.
- Fixed waits (`waitForTimeout`): wait for a state instead.

For example, "Escape closes the popover and focuses its trigger" belongs on the widget layer; "a popover that faded
out takes no hit at exactly 120 ms" is a timing probe and belongs nowhere.

## Rules

1. A test's title states what a user experiences; reading the title tells the contract.
2. A fixed bug gets one regression test, on the cheapest layer that can see it.
3. A design change may update tests while the contract holds; changing the contract changes the spec first.
4. Equivalence checks for a refactor ("nothing changed") are allowed, but they live in that refactor's PR evidence or
   are removed when it merges; they do not stay in the suites.
