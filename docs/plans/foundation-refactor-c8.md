# Foundation refactor: C8 accessible widgets on Radix

> Status: Implementation plan, 2026-10-21. The maintainer chose Radix on this date.
> This document records the next implementation wave; it does not claim C8 is implemented or accepted.
> Each numbered slice is one branch and one PR. Implement only a dispatched slice, with its tests and stories.

## Decision and starting point

The decision record is [foundation-refactor.md](../specs/foundation-refactor.md), decision V14.
Use **Radix Primitives** for interactive widgets and **React DayPicker** for the calendar grid.
The existing `@skillsite/ui` components remain the application-facing API and keep the brand tokens.

Evidence: [#167](https://github.com/nachhilfe-leon-weimann/skillsite/pull/167), reviewed at
`1254a93c0a2ac46e6ba8bd4214f8e62c62b4058d`, compares Radix and React Aria Components. On the spike's C8 scope,
Radix fit the existing `Button asChild` composition and had the smaller measured bundle. React Aria offered
broader native coverage and simpler motion integration. Those are measurements of that experiment, not future
bundle guarantees. Radix has no calendar primitive; DayPicker is an explicit additional dependency. Neither
library removes the need to test our labels, focus, rendering and domain adapters.

**C7 is decided. Accessibility acceptance is still pending.** The spike's VoiceOver pass was not performed.
Record that gap honestly and complete the selected implementation's manual pass in C8.9. The maintainer's
explicit selection does not depend on pretending the missing comparative pass succeeded.

**Base:** the completed C6 source at `refactor/ui-field` / [#176](https://github.com/nachhilfe-leon-weimann/skillsite/pull/176),
`0878a5dabed67aefabd708ad9a7bc3d2ff52ce74`. At planning time the preceding PR chain is still open. C8.0 stacks on
#176; start implementation from C8.0, then the previous C8 slice. After predecessors are squash-merged, rebase
and retarget onto the integrated `main`, verify the equivalent C6 changes exist, and rerun checks. Do not treat
today's old `main` as the C8 baseline. Do not cherry-pick or merge the spike.

### Disposition of #167

- C8.0 records V14, checks the C7 decision box and links this plan; it does not check C8 implementation boxes.
- Once C8.0 is merged into `main`, close #167 **without merging** and delete its experiment branch if desired.
  Until then leave the draft available as evidence. GitHub closing keywords on a PR targeting an unmerged
  feature branch are not proof that this follow-up happened.
- The closed PR preserves the comparison and its known limitations. Do not bring `src/spike/`, its stories,
  export-test exclusions, ratchet exclusions, `cmdk` or React Aria dependencies into the production stack.
- Add only the production Radix packages needed by each slice, and DayPicker in C8.8, as dependencies of
  `packages/ui`. The spike's versions are an evaluation baseline; verify maintained stable releases, React 19
  peer compatibility and the exact package's API before installation, record chosen versions in the PR, and
  commit the lockfile. Do not update unrelated dependencies or blindly copy old pins.

## Scope and implementation contracts

- Shared UI stays domain-free. The app owns availability, booking prices/durations, field declarations,
  selected slots, API calls, retries and result states. C8 does not perform the D1/D2 module/booker refactor.
- UI wrappers own behavior integration and styling. App consumers import explicit `@skillsite/ui/<group>/<name>`
  paths, not Radix or DayPicker directly. Add intentional exports to the existing export guard; tests/stories
  and dependency internals are never public exports. Preserve existing APIs unless a slice names a migration.
- C8 fixes keyboard, focus and assistive-technology behavior (E-09), so widget migrations use `fix(a11y):`
  titles and describe before/after behavior. Existing visible copy, colors, dimensions and spacing remain.
  Screen-reader instructions may be added through app content or shared component labels as appropriate.
- Radix owns overlay presence, outside interaction, Escape, focus and scroll locking. Do not recreate a shared
  `document` listener or a second scroll lock. "One dismiss logic" means one library-backed interaction model,
  with separate modal/non-modal semantics, not forcing Select, Dialog and Popover into the same component.
- The desktop link panel is a **non-modal named Popover**, containing ordinary navigation links. It is not an
  application command menu: do not add `menu`/`menuitem` semantics or import the spike's modal DropdownMenu.
  Radix Popover's named dialog container/trigger relationship is an intentional accessibility change; keep the
  links and navigation landmark meaningful. It must not trap focus or hide the rest of the page.
- The full-screen mobile navigation is a **modal Dialog**, preserving its current layout. The home/logo link,
  close control, navigation, nested platform disclosure and CTA must all be inside its active content. The
  background header/page must not remain reachable behind it. This deliberate focus-containment fix is separate
  from the desktop migration. The nested mobile platform list remains an ordinary Collapsible disclosure.
- Use CSS keyframes and Radix presence for enter/exit animation. Add only missing named exit tokens in
  `styles/motion.css`/`styles/tokens.css`, register namespaces in `utils/cn.ts` and its drift tests as needed.
  Keep existing brand durations/easings and per-widget geometry; no blanket `forceMount` workaround or own
  presence manager. A narrow closed-state inert/pointer adapter is allowed if needed; closed content must
  become non-interactive immediately, including during exit. Rapid
  open-close-open and reduced motion must not leave focusable ghosts, locks or a delayed focus steal.
- Portalled content must receive the existing theme/fonts, correct inverse tone and overlay stacking. Test
  clipping, viewport edges and nested Select-in-Dialog; portalling is not a reason for app-wide CSS changes.
- Single-choice chips use RadioGroup: an optional group may start empty, but selecting the checked item again
  keeps it checked. Multi-choice chips remain independent pressed toggles with the current `string[]` contract.
  Selection-required validation, visible error text and option order remain app-owned and unchanged.
- New focus indicators must be visible on selected and unselected surfaces in both themes, using named tokens.
  Document targeted focus fixes. Broad palette/contrast consolidation remains phase E; do not hide known or new
  accessibility failures with a blanket axe-rule exclusion.

## PR sequence

The linear order prevents concurrent changes to the same export map, motion tokens and navbar. Branch names are
proposals under the `codex/` prefix. C8.0 is this documentation PR; C8.1-C8.9 are future implementation PRs.

| Slice | Proposed branch                   | Conventional PR title                                    | Boundary                                                 |
| ----- | --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| C8.0  | `codex/docs-c8-radix-plan`        | `docs: record the radix decision and plan c8`            | Decision, spec checklist and this plan only              |
| C8.1  | `codex/test-ui-widget-browser`    | `test(ui): check widgets in the built storybook`         | Browser fixture/CI plumbing; no widget migration         |
| C8.2  | `codex/fix-dialog-focus`          | `fix(a11y): manage dialog focus with radix`              | Shared Dialog and its motion only                        |
| C8.3  | `codex/fix-nav-popover`           | `fix(a11y): dismiss the desktop navigation with radix`   | Shared Popover and desktop platform links                |
| C8.4  | `codex/fix-mobile-menu-focus`     | `fix(a11y): contain focus in the mobile navigation`      | Mobile navigation consumes Dialog                        |
| C8.5  | `codex/fix-select-radix`          | `fix(a11y): build select on radix`                       | Shared Select and duration integration                   |
| C8.6  | `codex/fix-choice-keyboard`       | `fix(a11y): give booking choices a radio keyboard model` | RadioGroup, single/multi chips and their app adapters    |
| C8.7  | `codex/fix-switch-radix`          | `fix(a11y): build switch on radix`                       | Shared Switch only                                       |
| C8.8  | `codex/fix-booking-calendar-grid` | `fix(a11y): navigate the booking calendar by keyboard`   | Domain-free DayPicker wrapper plus narrow Booker adapter |
| C8.9  | `codex/test-c8-acceptance`        | `test(a11y): verify the integrated c8 booking flow`      | Cross-widget tests, evidence and C8 closure only         |

Every implementation PR contains its own component/browser regression tests and story updates. C8.9 does not
postpone widget tests until the end. Its failures return to the responsible slice or a separately scoped fix.
All merges remain with the maintainer. Do not create empty future branches/PRs while writing this plan.

## C8.1 - Browser acceptance fixture

**Files:** `packages/ui/playwright.config.ts`, `packages/ui/e2e/widgets.spec.ts`, a small static Storybook server
under `packages/ui/e2e/`, package scripts/devDependencies, `justfile`, `turbo.json`/CI only where needed.

1. Build the existing Storybook and test its actual iframe stories with Playwright. Keep production app routes
   free of fixture pages. Exercise an existing Button story as the first readiness/keyboard smoke.
2. Use a dedicated loopback port, a readiness URL, `reuseExistingServer: false`, deterministic locale/time zone
   and an owned server process that is stopped on success or failure. Never test another checkout's build.
3. Add `just widgets`, backed by a root script and a distinct UI task (avoid recursive `turbo run e2e`). Include
   it in `just check` and the existing CI `check` job, with the existing Chromium installation. Ensure new
   config/E2E TypeScript files are included in lint and typecheck, not merely outside current test globs. Align Playwright
   versions between workspaces. Keep build/server tasks uncached where a stale output could fake success.
4. Keep the current marketing production E2E suite. Reuse its external-request isolation pattern, collecting
   console errors/page errors before navigation. Serve locally built assets; do not suppress failed asset loads.

**Acceptance**

- [ ] A fresh static build and Button keyboard probe pass through `just widgets`; `just check` invokes it.
- [ ] An occupied fixture port or a deliberately broken selected story fails; cleanup leaves no server behind.
- [ ] No fixture route, dev server reuse, extra required CI job or production dependency is introduced.
- [ ] Storybook build-in-CI is brought forward from C9 for C8 fixtures. C9 stays open until every exported
      component and variant has a story; do not claim full C9 coverage here.

## C8.2 - Dialog

**Files:** `packages/ui/src/overlays/dialog.tsx`, adjacent tests/story, motion tokens if needed, widget browser tests.
**Consumers:** no live marketing consumer after consent removal; test the public component in Storybook.

1. Replace portal/listeners/scroll-lock/focus effects with Radix Dialog. Preserve controlled `open`, `onClose`,
   `className`, `labelledBy` and `describedBy`; explicitly support C8.4's custom mobile panel layout.
   Do not silently require an incompatible Title-only API. Add accessible trigger/close composition or a focus
   return target where needed; document any additive API in the story.
2. Add default and custom-layout stories with visible labels, description, multiple focusable controls and
   a close control. Add the smallest exit tokens required, tested for the actual presence lifecycle.

**Acceptance**

- [ ] Opening by keyboard moves focus inside; Tab/Shift+Tab stay inside; accessible name/description resolve.
- [ ] Escape, close button and allowed backdrop activation call `onClose` once and return focus to the opener.
      A removed/hidden opener has a documented visible fallback rather than focusing a stale node.
- [ ] External controlled close and route/unmount cleanup release the lock; a harmless `onClose` callback identity
      change while open does not reset focus. Nested overlay Escape dismisses only the topmost overlay.
- [ ] Pointer interactions inside do not dismiss; background controls are unreachable to keyboard/AT while open.
- [ ] Enter/exit keyframes run under normal motion; reduced motion has no delayed close. No closed tabbables or
      duplicate locks remain after repeated cycles. Verify focus restoration during and after exit.
- [ ] Component tests and browser stories cover default/custom layout, controlled close, disabled opener and
      nested overlay behavior when C8.5 adds Select. Existing panel styling remains.

## C8.3 - Non-modal Popover and desktop navigation

**Files:** new `packages/ui/src/overlays/popover.tsx` with export/tests/story,
`apps/marketing/src/components/layout/navbar.tsx` (`PlatformDropdown` only), marketing A11y/Motion E2E.

1. Wrap Radix Popover with controlled state, trigger composition, a required accessible label and the existing
   panel styles. Use `modal={false}`. Retain the current desktop hover and click paths; hover state/timers may
   remain at the consumer, but library behavior owns dismissal and focus. Escape must also prevent a still-hovered
   trigger from immediately reopening until the pointer leaves or the user deliberately opens again.
2. Preserve ordinary links, Next client navigation, destinations, active styling and `aria-current`. Keep the
   current alignment and hover corridor; collision handling must not clip the panel at viewport edges.
3. Remove `PlatformDropdown`'s document-level outside-pointer/Escape listener. Do not copy DropdownMenu from #167.

**Acceptance**

- [ ] Pointer hover/click and Enter/Space open; pointer can cross to the panel without it vanishing. Keyboard-open
      content can be reached by Tab; Tab/Shift+Tab can leave it and continue through the page, with no focus trap.
- [ ] Escape closes and focuses "Online lernen"; outside pointer activation retains the clicked target's focus.
      Pointer-only opening does not steal keyboard focus. Closing does not immediately reopen under hover.
- [ ] Named popover/trigger association is valid; links remain links. No page-wide `aria-hidden`/inert or scroll
      lock appears for this non-modal panel; the spike's modal-menu accessibility failure is not inherited.
- [ ] Navigation closes the panel and keeps SPA navigation; current-page/fragment behavior remains correct.
- [ ] A11y, layout and motion tests cover desktop widths, rapid input and reduced motion. Update old role/no-popup
      assertions to the intentional new semantics, without dropping accessible-name or focus checks.

## C8.4 - Mobile navigation focus

**Files:** mobile portions of `apps/marketing/src/components/layout/navbar.tsx`, existing `ios-toolbar-tint.tsx`
contract tests and marketing browser tests. Use C8.2's Dialog; do not add another modal implementation.

1. Move the full-screen menu's active header controls (home/logo and close/menu control), links, CTA and nested
   platform Collapsible into the Dialog content. Preserve one logical header/navigation structure and the current
   visual arrangement. The nested platform list is not another modal or Popover.
2. Remove mobile's competing document Escape and body-lock owner. Keep `MENU_STATE_EVENT`, route-key reset and
   `DESKTOP_NAV_QUERY` behavior. Avoid duplicate visible/focusable logo/menu buttons across the modal boundary.
3. Escape/explicit close return to the mobile opener. At a desktop breakpoint the now-hidden opener must not
   receive focus: use a visible header fallback. Navigation must let the destination take focus, not pull it
   back to an obsolete trigger after routing. Emit the closed tint state on disposal of an open menu as well
   as on an explicit state change; the current effect alone does not cover route unmount.

**Acceptance**

- [ ] At 390px and 1079px the full-screen layout/scroll behavior remains; Tab/Shift+Tab stay within all active
      header/menu controls, including logo/close. Background content cannot receive focus or AT navigation.
- [ ] Escape closes once and returns focus; nested platform links work and hidden links are untabbable.
- [ ] Crossing 1079/1080px in both directions, SPA navigation, unmount and repeated open/close clear the modal,
      lock and tint state. Focus is on a visible connected element; desktop navigation is usable immediately.
- [ ] Existing iOS tint event fires only on actual menu state changes; preserve the single footer and existing
      toolbar-tint mechanism. Include a manual Safari mobile check; emulated Chromium alone is not iOS evidence.
- [ ] Existing banner/nav assertions are adapted only where portalling requires it, keeping semantic landmarks,
      accessible control names, active links and actual focus containment explicitly checked.

## C8.5 - Select

**Files:** `packages/ui/src/forms/select.tsx`, tests/story and `apps/marketing/src/components/booking/booker.tsx`
only where its duration selector needs migration; marketing Select A11y/Motion tests.

1. Preserve `Select<T extends string | number>`, `options`, `value`, `onChange`, `label`, `hideLabel`, `icon`,
   `tone`, `disabled` and `className`. Adapt Radix's string keys through a reversible type-safe option mapping:
   numeric `1` and string `"1"` must remain distinct, and valid empty-string options must not become an invalid
   empty Radix item value. Emit the original `T`, never an unvalidated cast from a DOM string.
2. Preserve default/inverse visual tones, hints, selection checkmark and label visibility. Use each option's
   main label for typeahead; hints/decorative icons must not corrupt matching or the selected value text.
3. Replace manual option focus, outside/blur/Escape handlers and presence with Radix Select. Closed DOM and
   trigger roles may change appropriately (e.g. combobox); assert user contracts, not the old button/list tree.

**Acceptance**

- [ ] Trigger and popup have a name; hidden "Dauer" remains accessible. Open/selection announcement works.
- [ ] Arrows, Home/End, typeahead and Enter/Space follow the installed Radix Select pattern. While open,
      Tab/Shift+Tab do not navigate behind the popup; Escape or committing closes it and restores the trigger,
      after which Tab leaves normally. This is an intentional change from the old Tab-to-close handler.
      Committing changes calls `onChange` once; Escape preserves the value.
- [ ] Component tests include numbers, strings, `1` versus `"1"`, empty-string options, hints, external value
      changes and disabled state. Duration remains numeric and produces the same availability request.
- [ ] Browser tests cover both tones, duration disabled after slot choice, selection inside a Dialog, topmost-only
      Escape, portalled theme/stacking, edge positioning, normal/reduced motion and rapid reopen.
- [ ] No manual Select listeners/presence remain, and no booking domain logic is moved into the wrapper.

## C8.6 - Radio groups and choice chips

**Files:** new `packages/ui/src/forms/radio-group.tsx` and `choice-chips.tsx`, exports/tests/stories;
`apps/marketing/src/components/booking/fields/{radio-field,chips-field}.tsx`.

1. Build row radios and single chips on Radix RadioGroup with one tab stop. Preserve option labels, icons,
   hints and current row/chip styles. Keep field declarations and validation in the app adapters.
2. Preserve multi-chip toggle semantics, option order and selected `string[]` values; use Radix ToggleGroup in
   multiple mode if it preserves the current contract, with a group label and individual pressed states.
3. Record the intentional fix: clicking/Space on a checked single chip no longer clears it. An optional group
   may initially be empty; do not preselect an answer or add a new visible clear control.

**Acceptance**

- [ ] Group/item accessible names and required/checked/pressed states are correct. Disabled items cannot change.
- [ ] Tab enters/leaves a radio group once; arrows move focus and selection over enabled options; Space selects.
      Empty-initial and preselected groups work. Repeated activation retains a single selection.
- [ ] Multiple chips can select and deselect independently, preserving the existing array order/shape and error
      behavior. Single-choice payloads remain strings. No interaction submits the booking form accidentally.
- [ ] Component and actual booking-form browser tests cover row/single/multi variants, labels/hints, validation
      and keyboard movement. Fast and realistic held key events do not leave focus and checked state divergent
      (the spike exposed a synthetic-key timing sensitivity).

## C8.7 - Switch

**Files:** `packages/ui/src/forms/switch.tsx`, tests/story and widget browser suite.
**Consumers:** no live app usage; do not reintroduce cookie consent or add a product setting to test it.

1. Replace the custom click toggle with Radix Switch while preserving controlled `checked`,
   `onCheckedChange`, disabled/id/ARIA-label APIs and existing track/thumb dimensions and motion.
2. Test a labeled form story and disabled/checked/unchecked variants; use a real browser for focus and thumb
   movement, not jsdom layout assertions. Preserve event/ref composition if exposed by the wrapper.

**Acceptance**

- [ ] The accessible switch is named and announces checked state. Pointer and Space toggle exactly once;
      disabled blocks both; it does not submit its surrounding form.
- [ ] External controlled changes update correctly; label activation and supported form behavior follow the
      wrapper's documented API. Checked/unchecked appearance and reduced motion remain correct.
- [ ] Story, component and browser checks exercise this exported component despite its lack of app consumers.

## C8.8 - Calendar grid and narrow Booker adapter

**Files:** new `packages/ui/src/forms/calendar.tsx` with export/tests/story; a small date adapter adjacent to
`apps/marketing/src/components/booking/booker.tsx` if needed; the existing `SelectStep` calendar markup;
marketing calendar browser tests. Keep fetching, auto-advance, slots and result state in Booker for D2.

1. Use DayPicker in controlled single-date mode. UI accepts controlled month/selection, disabled dates,
   navigation bounds and locale/time zone without importing app configuration. The app maps its date-only
   `YYYY-MM-DD` keys to the library's date model using the installed version's documented time-zone support.
   Never derive date keys with host-local midnight or `toISOString().slice(0, 10)`.
2. Pass `de-DE`, Monday-first and the booking zone `Europe/Berlin` from the app. Preserve month labels, weekday
   look, row count/outside-day treatment, previous/next controls and bounds `0..MAX_MONTH_OFFSET`. Do not import
   a vendor stylesheet that resets the design system; map styles/custom parts through named brand tokens.
3. All explicit month navigation, including keyboard crossing a month edge, routes through Booker's existing
   manual `changeMonth` path: clear stale selection/slot, stop automatic forward searching, request the correct
   month and ignore/abort stale responses. Do not set a second independent displayed month in the wrapper.
4. Availability controls selection, not date navigation. In-range unavailable/not-yet-loaded dates remain in
   DayPicker's roving-focus model, expose `aria-disabled`, and cannot be committed by pointer, Enter, Space or
   the selection callback. Use the installed custom-day/modifier API while forwarding its refs, ARIA, tabIndex
   and event handlers. Do not pass availability as a native disabled matcher that prevents navigation into an
   unknown month. Keep library date arithmetic; do not add a second keyboard engine, cache or prefetch layer.
   Native bounds may still prevent focus outside the booking window. This focusable-unavailable behavior is our
   adapter policy, not a claimed DayPicker default.
5. Keep one grid tab stop in empty/loading months. Keyboard month changes preserve the requested in-range
   focused date through loading/response; pointer month changes retain focus on the month control. Do not remount
   the whole calendar on month/load/selection changes. Focus within a month does not select a date or change slots;
   explicit month changes still perform Booker's existing selection reset. Initial soonest-free preselection
   never autofocuses the grid. If an error/unconfigured branch removes the focused grid, move focus to its visible
   Retry control or existing status container (`tabIndex=-1`), only if focus belonged to that removed grid.
6. Preserve selected date -> timeslot -> form behavior and current retry/result states. No typed date field,
   new date parsing policy, combobox, API changes or additional calendar-service integration is part of C8.

**Acceptance**

- [ ] Named calendar grid has date labels including full date, selected/unavailable state and a visible focus
      indicator on selected and unselected days in both themes. Weekday names are intelligible to AT.
- [ ] One grid tab stop, arrow navigation, Home/End and PageUp/PageDown follow the installed library contract;
      Enter/Space selects only a bookable day. Tab exits to the surrounding controls normally.
- [ ] Tests cover sparse availability, no available day, all loading/disabled, month/year boundaries and both
      navigation limits. With only one available day and no next-month data, ArrowRight at the last date and
      PageDown request exactly the bounded destination month through the same manual fetch/reset path as controls.
      Attempting to cross a bound stays within it without an extra request or stale selection commit.
- [ ] Focus survives an async month response in a predictable place, without a stale removed day, spontaneous
      focus steal, automatic bounce back from a manually requested empty month or accidental selection. The
      requested date stays focused even if unavailable after loading; an empty ready month still has one grid tab
      stop. Error-view fallback never pulls focus away from a different control.
- [ ] Date-adapter tests cover 2026-03-29 and 2026-10-25 (Berlin DST boundaries), leap day and year rollover;
      browser contexts include `Europe/Berlin`, `America/Los_Angeles` and `Pacific/Auckland`. The same API date
      remains the same selected/labeled day, and slot timestamps are never reconstructed from that day key.
- [ ] On both `/termin` and `/kontakt`, deterministic stubbed availability proves initial auto-advance,
      manual empty-month navigation, retry/error/unconfigured, day selection and slot/form entry. Duration
      reset applies to `/termin`; `/kontakt` keeps its fixed-duration contract.
      Fix the test helper's hard-coded `+02:00` when adding winter/DST cases; use coherent Berlin instants.
- [ ] No new network client, domain state machine, D2 decomposition or unrelated layout change is included.

## C8.9 - Integrated acceptance and closure

**Files:** focused marketing/Storybook Playwright cases, spec acceptance/evidence links and this plan's status.
Use test cases already introduced per widget; add only missing cross-widget regressions.

1. Run the real production build and both browser suites on this exact head. Stub availability with fixed
   fixtures and the clock. Any booking submission test must intercept its server-action request (verify no real
   Cal call) or use an isolated fake server fixture; never create a real booking from review/CI. Do not add MSW
   or change the production booking action merely to make this test possible. At minimum cover entry through
   form validation without submission. Keep existing result rendering regressions green; no integrated
   Booker result fixture currently exists, so do not claim one was tested. Full server-action submission/result
   E2E is outside this UI wave unless a separately scoped test-only harness is actually added and verified.
2. Keyboard-run the booking selection/form on both routes, desktop platform links and the full mobile menu.
   Verify nested overlays, tab order, focus restoration, disabled/loading/error states and client navigation.
3. Perform and record a human VoiceOver/Safari pass for the chosen widgets: name, role, selected/checked state,
   focus, description/error linkage, calendar announcements and dismissal. Include the standalone Dialog/Switch
   stories. Automated AX-tree/axe results are useful evidence, never a substitute labeled as VoiceOver.
4. Record manual look/content acceptance at 390px/1280px, light/dark, open/closed states and normal/reduced
   motion; include the 1079/1080px navigation transition. No new screenshot baseline system/coverage gate.
5. Compare first-load JS for representative static and booking routes against the integrated C6 baseline;
   report production before/after with the same build settings. Explain unexpected increases; do not reuse
   spike gzip numbers or invent an unapproved bundle budget.

**C8 completion gate**

- [ ] C8.1-C8.8 are integrated with green checks, no unresolved widget focus/keyboard/label regressions, and no
      remaining custom outside-pointer/Escape handlers for the migrated widgets. Generic hooks may remain for
      legitimate unrelated consumers; do not remove exports opportunistically.
- [ ] `just check`, including production marketing E2E and built-Storybook widget E2E, passes on the final head.
      Every failure/skip has an exact explanation; a local network or browser failure is not reported as green.
- [ ] Deterministic keyboard, nested-overlay, calendar/date-zone and form integration tests pass.
- [ ] Human VoiceOver/Safari and visual checks are recorded with browser/OS/date, routes/stories, actual results
      and any unresolved failures. If unavailable, leave this gate and the spec's overall C8 box unchecked.
- [ ] Known spike issues relevant to the selected implementation are resolved and evidenced; no broad accessibility
      rule suppression or spike exclusions hide them. Existing phase-E contrast work is explicitly identified.
- [ ] Every changed/exported C8 widget has representative stories; package exports and ratchet pass. C9 remains
      a separate full-library coverage audit; this gate does not assert all C9 work is complete.

## Verification and PR handoff

For implementation, install with the repo's pinned pnpm and frozen lockfile, install Chromium once, then use
the canonical commands from the worktree root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @skillsite/marketing exec playwright install chromium
just check
```

From C8.1 onward `just widgets` is the focused built-Storybook browser command. Existing `just test`,
`just typecheck` and marketing `just smoke` remain available. Run the narrow red/green regression first, then
the required full check before pushing. Do not install/update packages while merely documenting C8.0.

Each PR body names its slice, base/stack dependency and changed public API; summarizes exact before/after
keyboard/AT behavior; links test/manual evidence and the updated checklist; and has a **How to check** section
with concrete stories/routes, theme/viewport/state, expected focus and whether a manual pass remains pending.
Do not tick acceptance on a PR description's claim alone. Preserve visible German text through UTF-8-safe edits.

## References

Official documentation checked on 2026-10-21; recheck against the installed package version during implementation:

- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- [Radix Select](https://www.radix-ui.com/primitives/docs/components/select)
- [Radix RadioGroup](https://www.radix-ui.com/primitives/docs/components/radio-group)
- [Radix ToggleGroup](https://www.radix-ui.com/primitives/docs/components/toggle-group)
- [Radix Switch](https://www.radix-ui.com/primitives/docs/components/switch)
- [Radix CSS animation/presence](https://www.radix-ui.com/primitives/docs/guides/animation)
- [DayPicker accessibility](https://daypicker.dev/guides/accessibility)
- [DayPicker controlled month/navigation](https://daypicker.dev/docs/navigation)
- [DayPicker custom components](https://daypicker.dev/guides/custom-components)

The component choices, mobile modal migration and slice boundaries above are this plan's implementation design,
not claims made by those documentation pages or additional maintainer decisions.
