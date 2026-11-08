# Foundation refactor: C8 accessible widgets on Radix

> Status: Implementation plan, 2026-10-21. The maintainer chose Radix on this date.
> Implemented through #210; accepted on 2026-11-06 after the maintainer's manual VoiceOver, Safari and look pass.
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

- [x] A fresh static build and Button keyboard probe pass through `just widgets`; `just check` invokes it.
- [x] An occupied fixture port or a deliberately broken selected story fails; cleanup leaves no server behind.
- [x] No fixture route, dev server reuse, extra required CI job or production dependency is introduced.
- [x] Storybook build-in-CI is brought forward from C9 for C8 fixtures. C9 stays open until every exported
      component and variant has a story; do not claim full C9 coverage here.

Verification on 2026-10-21: `just widgets` rebuilt the static Storybook and passed the existing Primary Button
story's Tab, Enter and Space probes in light/dark. The same command rejected a foreign listener on 6106 without
stopping it. Temporary console/page errors in the selected story failed both probes; the story was restored.
No listener remained after the successful run or either failure. `just check` runs this uncached task through
the existing CI `check` job and keeps the production marketing suite. This slice makes no widget migration or
human VoiceOver/Safari acceptance claim; C8 and the full C9 story audit remain open.

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

- [x] Opening by keyboard moves focus inside; Tab/Shift+Tab stay inside; accessible name/description resolve.
- [x] Escape, close button and allowed backdrop activation call `onClose` once and return focus to the opener.
      A removed/hidden opener has a documented visible fallback rather than focusing a stale node.
- [x] External controlled close and route/unmount cleanup release the lock; a harmless `onClose` callback identity
      change while open does not reset focus. Nested overlay Escape dismisses only the topmost overlay.
- [x] Pointer interactions inside do not dismiss; background controls are unreachable to keyboard/AT while open.
- [x] Enter/exit keyframes run under normal motion; reduced motion has no delayed close. No closed tabbables or
      duplicate locks remain after repeated cycles. Verify focus restoration during and after exit.
- [x] Component tests and browser stories cover default/custom layout, controlled close and disabled opener.
      Existing panel styling remains; the current nested-overlay regression uses a second Dialog.
- [x] C8.5 follow-up: verify nested Select-in-Dialog behavior when Select is migrated.

C8.2 verification on 2026-10-21: the previous implementation failed the new focus/browser regressions. The
Radix wrapper passes three component tests and 18 Dialog browser cases (20 widget cases including Button):
keyboard entry/containment, names/descriptions, callback identity, Escape/close/backdrop counts, external close,
unmount, removed/hidden/disabled opener fallback, explicit/navigation focus destinations, immediate nested
Escape, exit inertness, repeated reopen and reduced motion. Default panel gutters, padding and radius are
checked at phone/desktop widths. Custom layout is fixed to the viewport with no wrapper animation/transform.
Focus returns through Radix's close-autofocus hook after the panel exit; closed content is immediately inert,
removed from AT and pointer interaction. No human VoiceOver/Safari or maintainer look acceptance is claimed.

The controlled `open`/`onClose`, `className`, `labelledBy` and `describedBy` API remains. Additive props are
`id`, `layout="custom"`, `returnFocusRef`, `fallbackFocusRef` and `onCloseAutoFocus`. The last may prevent default
when navigation owns the destination. If an opener may disappear, pass a visible focusable fallback; the
Default story demonstrates a heading with `tabIndex={-1}`. ExplicitFocusReturn/NavigationFocus demonstrate
the optional overrides. Custom layout supplies its own styling and inner motion for C8.4.

Dependency evidence: registry stable `@radix-ui/react-dialog` 1.3.1 supports React 19; its installed source
accepts the existing external label IDs. Unpatched 1.3.1 and the documented stable 1.2.0 both failed immediate
nested Escape. This matches upstream [issue #4143](https://github.com/radix-ui/primitives/issues/4143).
The published dependency still has the render-time layer-listener race. The pnpm patch to DismissableLayer
1.2.1 applies the event-time stack guard proposed in [#4147](https://github.com/radix-ui/primitives/pull/4147)
and [#4145](https://github.com/radix-ui/primitives/pull/4145), and also attaches a listener per layer so the first
Escape is handled rather than ignored during registration. This is a local extension, not a merged upstream
fix. Both ESM/CJS entry points are patched; no application layer stack/listener is added. The deterministic
registration unit test fails without the patch; the unchanged immediate browser test passes, including three
parallel repetitions. Workspace overrides keep one patched DismissableLayer 1.2.1 and FocusScope 1.3.1 for
later Popover/Select composition. Remove the patch/pins only after a published upstream fix passes both
regressions and the nested integration suite. Overall C8, the C8.5 Select follow-up and full C9 remain open.

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

- [x] Pointer hover/click and Enter/Space open; pointer can cross to the panel without it vanishing. Keyboard-open
      content can be reached by Tab; Tab/Shift+Tab can leave it and continue through the page, with no focus trap.
- [x] Escape closes and focuses "Online lernen"; outside pointer activation retains the clicked target's focus.
      Pointer-only opening does not steal keyboard focus. Closing does not immediately reopen under hover.
- [x] Named popover/trigger association is valid; links remain links. No page-wide `aria-hidden`/inert or scroll
      lock appears for this non-modal panel; the spike's modal-menu accessibility failure is not inherited.
- [x] Navigation closes the panel and keeps SPA navigation; current-page/fragment behavior remains correct.
- [x] A11y, layout and motion tests cover desktop widths, rapid input and reduced motion. Update old role/no-popup
      assertions to the intentional new semantics, without dropping accessible-name or focus checks.

C8.3 verification on 2026-11-04: the previous navbar failed all eighteen original marketing regressions, mainly
because they address the panel as a named dialog. Plain Radix wrapping failed three of six component tests: Radix
loops Tab even in a non-modal popover, returns focus to the trigger only after the exit, and focuses the trigger
on a close although focus is elsewhere. The wrapper passes Tab to the browser, returns focus on Escape at once and
otherwise only when the panel held it and no outside pointer interaction followed, also across a reopen during the
exit; closing links leave the tab order and the panel leaves the accessibility tree immediately. Its container is
not focusable, so a click on the panel's padding moves no focus, as on main. It passes nine component tests and
thirteen Popover browser cases (light/dark keyboard path, Shift+Tab, Escape, outside click, toggle exit, link
close, rapid reopen, reduced motion, viewport-edge collision at 390/1280px, and on the HoverExit story re-entry
onto the fading panel and no hits once it has faded). Thirty-three marketing cases cover the navbar at
1080/1280px: semantics without added `aria-hidden`/inert/scroll lock, Enter/Space/Tab/Shift+Tab, Escape, outside
clicks on controls, plain text and the panel's padding, mouse/pen/touch hover, hover corridor without focus moves,
hover suppression after Escape, trigger toggle, rapid input, client and fragment navigation with `aria-current`,
slide in/out, exit inertness, reduced motion, and pointer paths in slow motion (interrupted entrance, sweep,
re-entry onto trigger or fading panel after a hover leave, an outside click or Tab, a click on the revived link, a
click through a panel closed by its trigger, no hits once a short hover has faded out, focus return across a hover
reopen, plain-text clicks during a hover exit); they pass five times in a row. Red evidence for the last fixes:
before them, the jsdom padding and hit-testable-exit tests, the browser padding case, the short-hover hit case,
the hover-exit focus case across a reopen, both re-entry cases after an outside click or Tab and the widget
short-hover and transition-list cases fail. The browser plain-text clicks without a reopen pass on the older heads
too, because React commits the hover close only after the mousedown has moved focus to `<body>`; they are no red
evidence. Deviation from "CSS keyframes" above, by maintainer decision (the panel must look and feel exactly as on
`main`): the panel keeps main's reversible opacity/translate/visibility transitions (8px, `duration-base`,
`ease-flow`; the entrance starts from the closed, invisible look after one style flush), and a no-op
`presence-hold` keyframe (`animate-presence-hold`, animating an unread registered property) holds Radix presence
for the exit. As on main, the fading panel takes pointer hits until it has faded out, so the pointer coming back
reopens it, after a hover leave, an outside click or Tab; when Escape, a click or Tab out closes it under a
hovering pointer, it lets hits through, so it does not reopen under that pointer and stays closed until the pointer
leaves. It stops taking hits on the frame its opacity transition ends, where main's visibility turns hidden: its
exit starts between frames, and Chrome then starts the visibility transition a frame after opacity. A keyframe
version snapped on interrupted sweeps; the sweep regressions fail on it and pass now. The panel keeps its size,
alignment and 6px corridor; Floating UI snaps its position to device pixels (under 0.5px at 1x), which Radix does
not expose to configure. As on main, the links become focusable with the entrance's first frame; a Tab within that
frame passes them. Every entrance starts one frame (about 17 ms) later than on main, because the panel mounts a
render after the event: on main's curve, a hover shorter than the transition peaks one frame lower, and a pointer
crossing the trigger in a single move shows nothing where main flashes to 0.27. `@radix-ui/react-popover` 1.3.1
resolves to the pinned DismissableLayer 1.2.1 and FocusScope 1.3.1. No human VoiceOver/Safari or maintainer look
acceptance is claimed.

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

- [x] At 390px and 1079px the full-screen layout/scroll behavior remains; Tab/Shift+Tab stay within all active
      header/menu controls, including logo/close. Background content cannot receive focus or AT navigation.
- [x] Escape closes once and returns focus; nested platform links work and hidden links are untabbable.
- [x] Crossing 1079/1080px in both directions, SPA navigation, unmount and repeated open/close clear the modal,
      lock and tint state. Focus is on a visible connected element; desktop navigation is usable immediately.
- [ ] Existing iOS tint event fires only on actual menu state changes; preserve the single footer and existing
      toolbar-tint mechanism. Include a manual Safari mobile check; emulated Chromium alone is not iOS evidence.
- [x] Existing banner/nav assertions are adapted only where portalling requires it, keeping semantic landmarks,
      accessible control names, active links and actual focus containment explicitly checked.

C8.4 verification on 2026-11-04: the previous navbar failed seventeen of the eighteen new or adapted marketing
cases. Tab ran from the menu into the page and on to the footer, the page behind stayed in the accessibility tree,
crossing to 1080px dropped focus to `<body>`, and history back with the menu open never announced the closed
state, so the toolbar tint stayed in its menu state. The menu is now C8.2's modal Dialog (`layout="custom"`, named
"Menü" by its close control). Its content repeats the header row (one shared component with the page header: home
link, close control) above the links, the "Online lernen" Collapsible and the CTA, all inside one `<header>`; the
page header stays in place, `inert`, and Radix hides the page from AT, so one banner, home link and menu control
exist for keyboard and AT. Radix owns Escape, focus containment and the scroll lock; the document Escape listener
and the `useBodyScrollLock` call are gone. Opening keeps focus on the menu control, now the dialog's close control
at the same place; Escape and the close control return focus to the menu button, past 1080px to the visible home
link. The home link on the home page keeps focus on the page header's home link, as on main. Any other menu link
leaves focus on `<body>`; the tests pin that and the next Tab stop (the skip link after a route or same-URL
change, the fragment target's next control after a fragment link). On main the next Tab after a route change
reached the header's home link, because the menu was part of the header; here the sequential focus start point is
the removed link in the dialog portal at the end of `<body>` (a maintainer decision in the PR). Box 3's "visible
connected element" is thus covered for Escape, the close control, the crossing and the home link; after other
links, focus is on `<body>` by design and the next Tab stop is visible. The tint event fires on real state
changes and once more when an open menu unmounts. Seventeen a11y cases at 390/1079px (containment over logo, close,
links, nested platform links and CTA in both directions, names, landmark, `aria-current`, `aria-hidden`/inert
background, Escape once, close control, five client navigations with focus pinned, the home link on the home
page by Enter and click, history back, the event contract, repeated cycles without locks, focus guards or ghost
tab stops, the 1079/1080 crossing both ways with the desktop popover usable at once), two layout cases (the dialog
fills the viewport; its home link and close control sit on the page header's) and two motion cases (fade-down of
the links under a still header row) pass five times in a row; the thirty-three C8.3 navbar cases pass. The
custom-layout Dialog's backdrop no longer draws a scrim or fades out over the page on close (it still holds the
scroll lock); a widget case covers it and failed before. Production screenshots against `main` at 390/1079px,
light/dark, normal/reduced motion (click, keyboard and touch opening, frames during the fade-down and the
disclosure, closing, scrolled pages, the home link) match in 120 of 128 states of the independent review and 76
of 88 of the implementer's; the dialog keeps the open header's backdrop blur, which keeps its text rendering. All
other states show one general difference: on main the sticky header leaves the flow behind the open menu, so the
page beneath shifts up 66px; a reveal whose trigger lies within 66px below the fold plays behind the menu (the
statistics card on `/` at 1079x800, a check icon on `/preise` at 390x800, also `/preise` at 1079x420 with
scrollbars), and a same-URL link can leave the page 66px up. Here the page beneath does not move, so neither
happens. The plan's "existing `ios-toolbar-tint.tsx` contract tests" did not exist; the contract is checked in
the marketing browser tests. No human VoiceOver/Safari or maintainer look acceptance is claimed; the manual
Safari mobile check stays open.

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

- [x] Trigger and popup have a name; hidden "Dauer" remains accessible. Open/selection announcement works.
- [x] Arrows, Home/End, typeahead and Enter/Space follow the installed Radix Select pattern. While open,
      Tab/Shift+Tab do not navigate behind the popup; Escape or committing closes it and restores the trigger,
      after which Tab leaves normally. This is an intentional change from the old Tab-to-close handler.
      Committing changes calls `onChange` once; Escape preserves the value.
- [x] Component tests include numbers, strings, `1` versus `"1"`, empty-string options, hints, external value
      changes and disabled state. Duration remains numeric and produces the same availability request.
- [x] Browser tests cover both tones, duration disabled after slot choice, selection inside a Dialog, topmost-only
      Escape, portalled theme/stacking, edge positioning, normal/reduced motion and rapid reopen.
- [x] No manual Select listeners/presence remain, and no booking domain logic is moved into the wrapper.

C8.5 verification on 2026-11-04: the previous Select failed all twelve new component tests, seventeen Select
browser cases and six marketing cases, all at the missing combobox; probed directly, Escape in a Select inside a
Dialog closed the Dialog with the list still open, Tab closed the list and moved on, the closed trigger had no
typeahead, committing the current value called `onChange` again, and option names included their hints. The wrapper
on `@radix-ui/react-select` 2.4.1 (resolving to the pinned DismissableLayer 1.2.1 and FocusScope 1.3.1) keeps the
`Select<T>` API. Values pass through a type-tagged key (`n:1`, `s:1`, `s:`), mapped back through the options, so
`1`, `"1"` and `""` stay distinct and the original `T` is emitted; `onChange` fires once per committed change, not
for a re-commit of the current value. The trigger is a combobox named by `label` (V12: "Dauer") whose value is the
selected label; the listbox shares the name; hints describe their option and never join its name, the shown value
or typeahead. It passes thirteen component tests and twenty-one Select browser cases (both tones in light/dark with
arrows, Home/End, Tab/Shift+Tab held in the list, Enter and Space commits, Escape, typeahead closed and open, typed
values, hints, a hovering mouse that leaves the keyboard's ring and Enter target alone, a mouse opening and closing
on release, a mouse or touch press dragged off the open trigger keeping the list, pointer toggling and outside
presses, disabled, a bottom-edge flip, entrance and exit transitions with no lock left, rapid keyboard and pointer
reopen, reduced motion, and the InDialog story in light/dark: selection, rendering inside the dialog over its
backdrop, topmost-only Escape); they pass five times in a row. Six marketing cases cover the "Dauer" combobox, a
keyboard choice of 90 minutes that the next availability request carries as `duration=90` (Escape asks for
nothing), the disabled state after a slot choice and the slide and scale in and out, also under reduced motion;
they pass five times in a row. Look and motion stay as on main: the panel renders in place, not portalled, so it
inherits theme, fonts and stacking (inside a Dialog too); it keeps main's reversible opacity/translate/scale
transitions (in over `duration-base`, out over `duration-quick`, `ease-flow`, from 4px above at 0.97) with a new
`presence-hold-quick` token holding Radix presence for the exit; its entrance starts on the frame Radix has placed
it, two to three frames later than on main (mounting cost; first visible frame 60-67 ms after the key, against
17-34 ms). Sampled curves and panel geometry equal main's, apart from a top edge snapped to device pixels (0.02px
here). Production screenshots of `/termin` at 390/1280px, light/dark, normal/reduced motion (rest, hover, click and
keyboard opening, hovered and left rows, a hovering mouse after keyboard use, a pointer and a keyboard commit,
Escape, disabled) are identical in 39 of 112 states; the others differ by at most 7/255 per channel in the open
panel's antialiasing, or only where main differs from itself. To keep main's look and pointer behaviour, a mouse
opens and closes the list on release (a held press, or one dragged off and released elsewhere, changes nothing),
the trigger stays hit-testable while the list is open (hover look, a click closes, a click during the exit
reopens), the pointer only hovers rows while focus (ring and Enter target) stays with the keyboard, and rows show a
focus ring only after keyboard use. Radix's modal pointer model remains (`SelectContentImpl` hard-codes the scroll
lock, outside pointer blocking, `hideOthers`, the focus trap and the close on window blur/resize): while the list
is open, and until about 200 ms after it closes, the rest of the page takes no pointer input or scroll, an outside
press only closes it and focus returns to the trigger; near a viewport edge the list opens above the trigger,
mirrored. No human VoiceOver/Safari or maintainer look acceptance is claimed.

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

- [x] Group/item accessible names and required/checked/pressed states are correct. Disabled items cannot change.
- [x] Tab enters/leaves a radio group once; arrows move focus and selection over enabled options; Space selects.
      Empty-initial and preselected groups work. Repeated activation retains a single selection.
- [x] Multiple chips can select and deselect independently, preserving the existing array order/shape and error
      behavior. Single-choice payloads remain strings. No interaction submits the booking form accidentally.
- [x] Component and actual booking-form browser tests cover row/single/multi variants, labels/hints, validation
      and keyboard movement. Fast and realistic held key events do not leave focus and checked state divergent
      (the spike exposed a synthetic-key timing sensitivity).

C8.6 verification on 2026-11-04: on `main` the single-choice groups had one tab stop per option, arrows only
scrolled the page, and Space or Enter on the checked chip cleared the subject; four of the six new booking-form
cases fail there, the two `/kontakt` cases pass unchanged. `RadioGroup` (rows) and single `ChoiceChips` build on
`@radix-ui/react-radio-group` 1.5.1, multiple `ChoiceChips` on `@radix-ui/react-toggle-group` 1.2.1 with
`rovingFocus={false}` and `role="group"`, so each chip stays an independent pressed toggle and tab stop and the
value lists the chips in pressing order; neither package uses DismissableLayer or FocusScope. The app adapters keep
the field declarations, the first-option preselection of the platform and the open-items validation. A
single-choice group is one tab stop, entered at its checked radio or, empty, at the first without checking it;
arrows, Home/End and PageUp/PageDown move focus and selection together over the enabled radios and no longer
scroll; Space and Enter (kept from `main`; Radix ignores it) check the focused radio, and activating the checked
one keeps it. Radix moves focus a task after the key and checks only while an arrow key is still down, so a quick
press, a second key before the first focus or Home/End left focus on an unchecked radio (Playwright's own presses
diverge without the fix); the group checks a radio focused while a key is pending and, after Radix's timer, the
focused one, skipping a radio Radix's click checked. Hints describe a row without joining its name. Pointer
behaviour equals `main` (checks on release, a press dragged off changes nothing, a press in the gap between options
focuses nothing and Tab then enters the group): the group lets the pointer through to its radios. Radix's hidden
native radios inside the form are not rendered; drawn, they shifted the antialiasing of the rows' corners.
Twenty-four component tests pass; eleven Storybook cases (light/dark rings on checked and unchecked surfaces in the
focus-ring token, quick, paired, rapid and held keys, pointer, empty and disabled groups) and six booking-form
cases on `/termin` and `/kontakt` (names, required, tab stops, arrows, the kept chip, open items, quick and held
keys, no submission by any choice key with a complete form, and the intercepted, unsent drafts carrying the subject
`"Physik"` and the subjects `["Physik","Mathematik"]`) pass five times in a row. Production screenshots of the
booking forms against `main` at 390/1280px, light/dark, normal/reduced motion (rest, hover, keyboard focus on
checked and unchecked options, clicked rows and chips, pressed chips) are identical in all 56 states (one hover
state differs by 1/255 in some runs, as this head does from itself). The multiple group no longer carries
`aria-required`, which ARIA does not define for a group and Chrome did not expose. No human VoiceOver/Safari or
maintainer look acceptance is claimed.

## C8.7 - Switch

**Files:** `packages/ui/src/forms/switch.tsx`, tests/story and widget browser suite.
**Consumers:** no live app usage; do not reintroduce cookie consent or add a product setting to test it.

1. Replace the custom click toggle with Radix Switch while preserving controlled `checked`,
   `onCheckedChange`, disabled/id/ARIA-label APIs and existing track/thumb dimensions and motion.
2. Test a labeled form story and disabled/checked/unchecked variants; use a real browser for focus and thumb
   movement, not jsdom layout assertions. Preserve event/ref composition if exposed by the wrapper.

**Acceptance**

- [x] The accessible switch is named and announces checked state. Pointer and Space toggle exactly once;
      disabled blocks both; it does not submit its surrounding form.
- [x] External controlled changes update correctly; label activation and supported form behavior follow the
      wrapper's documented API. Checked/unchecked appearance and reduced motion remain correct.
- [x] Story, component and browser checks exercise this exported component despite its lack of app consumers.

C8.7 verification on 2026-11-04: `main`'s switch was already a native `button` with `role="switch"` and
`aria-checked`, so the new checks pass on it as well (eleven component tests; nine browser cases in a Storybook
build of `main` with the new stories, 27 of 27 in three repetitions). The slice moves it onto
`@radix-ui/react-switch` 1.4.1 without changing its behaviour. Radix's `Root` adds a hidden native checkbox after
the button inside a form, re-sends the click to the form from it, and on a form reset restores the first
rendered state through `onCheckedChange`; with it, two component tests and one browser case fail. The wrapper is
built from Radix's provider, trigger and thumb (`unstable_Provider`/`unstable_Trigger`: these parts carry no
semver promise; the stack pins its Radix packages exactly) and stays a single button. As on `main`, the
trigger's `onClick` asks for the other state, also when an ancestor prevented the click's default; the provider
gets no `onCheckedChange`, so Radix's own toggle and its reset listener reach a no-op. Given `onCheckedChange`,
the provider fails the reset checks in jsdom and in the browser. The public API is unchanged (`checked`,
`onCheckedChange`, `disabled`, `id`, `aria-label`, `aria-labelledby`; no ref or event props, so there is
nothing to compose); the wrapper documents that it is not a form field: no value, no submission, no reset.
Forms/Switch stories (Default named by a `<label>`, with an outside toggle and a reset button; Checked by
`aria-labelledby`; Unchecked by `aria-label`; Disabled; DisabledChecked) and nine browser cases cover names and
states, the focus ring on both tracks in light/dark, Space (also held) and Enter toggling once, pointer release,
drag-off and double click, label activation, outside changes, the reset, disabled blocking, the 44x24 track and
20x20 thumb at 2/22px in the line/coral tokens, the 160ms soft thumb travel and the jump under reduced motion;
they pass five times in a row. Against `main`, a pointer/keyboard/touch matrix (also with prevented clicks) and
the accessibility tree are equal, the thumb passes through the same offsets frame by frame, and the screenshots
(five stories, light/dark, 390/1280px, normal/reduced motion, rest/hover/focus/Space/click/press) are identical
within `main`'s own run-to-run noise (at most 4/255 in a few antialiased pixels of the focus ring or a button
label). The button now carries Radix's `data-state`, `data-disabled` and `value="on"` attributes. No human
VoiceOver/Safari or maintainer look acceptance is claimed.

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

- [x] Named calendar grid has date labels including full date, selected/unavailable state and a visible focus
      indicator on selected and unselected days in both themes. Weekday names are intelligible to AT.
- [x] One grid tab stop, arrow navigation, Home/End and PageUp/PageDown follow the installed library contract;
      Enter/Space selects only a bookable day. Tab exits to the surrounding controls normally.
- [x] Tests cover sparse availability, no available day, all loading/disabled, month/year boundaries and both
      navigation limits. With only one available day and no next-month data, ArrowRight at the last date and
      PageDown request exactly the bounded destination month through the same manual fetch/reset path as controls.
      Attempting to cross a bound stays within it without an extra request or stale selection commit.
- [x] Focus survives an async month response in a predictable place, without a stale removed day, spontaneous
      focus steal, automatic bounce back from a manually requested empty month or accidental selection. The
      requested date stays focused even if unavailable after loading; an empty ready month still has one grid tab
      stop. Error-view fallback never pulls focus away from a different control.
- [x] Date-adapter tests cover 2026-03-29 and 2026-10-25 (Berlin DST boundaries), leap day and year rollover;
      browser contexts include `Europe/Berlin`, `America/Los_Angeles` and `Pacific/Auckland`. The same API date
      remains the same selected/labeled day, and slot timestamps are never reconstructed from that day key.
- [x] On both `/termin` and `/kontakt`, deterministic stubbed availability proves initial auto-advance,
      manual empty-month navigation, retry/error/unconfigured, day selection and slot/form entry. Duration
      reset applies to `/termin`; `/kontakt` keeps its fixed-duration contract.
      Fix the test helper's hard-coded `+02:00` when adding winter/DST cases; use coherent Berlin instants.
- [x] No new network client, domain state machine, D2 decomposition or unrelated layout change is included.

C8.8 verification on 2026-11-04: the calendar is `@skillsite/ui/forms/calendar`, a wrapper of `react-day-picker`
10.0.2 (latest stable; peers `react >=16.8`; dependencies `date-fns` 4.4.0 and `@date-fns/tz` 1.5.0, both new) in
controlled single-date mode, built from DayPicker's custom parts with the brand classes and no DayPicker
stylesheet. Its API takes calendar dates, never instants: days "YYYY-MM-DD", months "YYYY-MM", an IANA `timeZone`
and a supported locale tag ("de-DE"). The wrapper maps them to DayPicker's dates through its documented time-zone
support (`TZDate` at noon of the day in the zone, the `timeZone` prop) and back through the same zone; no key
passes through host-local midnight or `toISOString().slice(0, 10)`. It lives in the wrapper, not the app, because
the app imports only `@skillsite/ui` paths. Booker's adapter (`booker-calendar.ts`) names its month offsets as
month keys, derives the navigation bounds from the shown month and its offset (never from the clock, so a Berlin
month boundary passing with the page open cannot make the grid show a month Booker did not fetch) and turns every
requested month into the existing manual `changeMonth(delta)`; Booker keeps fetching, auto-advance, slots and
results. Availability is a custom `unavailable` modifier, not a `disabled` matcher: unavailable and not-yet-loaded
days stay in DayPicker's roving focus with `aria-disabled` and select nothing (one guard in `onSelect`); as on
`main`, they let pointer hits through to their cell. The navigation bounds are DayPicker's `startMonth`/`endMonth`.
If an error or unconfigured answer replaces the calendar while its grid holds focus, Retry or the notice
(`CenteredState`, new optional `ref`/`tabIndex={-1}`) takes it and scrolls into view; focus elsewhere stays. A
clicked month button keeps `main`'s behaviour: focus falls to `<body>` and the page does not move. The days fade in
per month as before (the day rows, not the whole calendar, are keyed by month); the caption stays plain text, not
DayPicker's live region. Forty-six component tests (names, weekday headers, labels, `aria-disabled`, busy, one tab
stop in sparse/empty/loading/later months, arrows/Home/End/PageUp/PageDown/Shift+PageUp, bounds, selection guards,
focus kept across a load and an answer, 2026-03-29, 2026-10-25, 2028-02-29 and the year's end under host zones
Berlin/Los Angeles/Auckland/UTC), twelve widget cases (Forms/Calendar: Default, NoAvailableDays, Loading,
LoadOnMonthChange; light/dark ring on selected, free and unavailable days) and forty-five marketing cases pass, the
latter on `/termin` and `/kontakt`: auto-advance without focus, a manual empty month without bounce, keyboard and
button month changes through the manual path, focus waiting on the requested day through loading and its answer,
both bounds without a request, a stale answer ignored, Retry/error/unconfigured focus after a keyboard month
change, a click on "Nächster Monat" into an error or unconfigured answer on a 390x844 phone without a scroll or
focus move, the duration reset on `/termin` and the fixed duration on `/kontakt`, the DST days and the year's end
in browser contexts in Berlin, Los Angeles and Auckland, the slot instant sent unchanged, and the month fade with
and without reduced motion. The e2e helper now gives slot starts their Berlin offset (`+01:00` in winter) and
freezes time with a `Date` proxy: Playwright's `page.clock` drops the prototype of `Date` subclasses, so `TZDate`
falls back to the host zone (in Auckland, Berlin noon is the next day's midnight). On `main`, 38 of the first 41
marketing cases fail (the three passing ones send the slot instant unchanged there too); on the first review head,
the four phone click cases failed (the page jumped by up to 550px). Seven of the nine adapter node tests cover the
booking window; all seven fail on that head. Eight mutation probes fail the expected tests; day keys from
`toISOString().slice(0, 10)` survive as an equivalent mutant, because `TZDate` prints its zone's wall-clock time.
Against `main`, production builds give 53 of 56 identical calendar screenshots (eleven states, light/dark,
390/1280px, normal/reduced motion); the others are focus-ring states within 4/255, as two runs of `main` differ
from each other (6 of 56, within 5/255). No `rdp-*` class name remains in the DOM. Geometry and computed styles are
equal except the computed cursor of unavailable days, which take no pointer hits. The pointer and touch matrix is
equal, including the month-button click into an error or unconfigured answer at 390x844; the keyboard now has one
grid tab stop, and arrows/PageUp/PageDown move within the grid instead of scrolling the page. A focused unavailable
day shows the focus ring (it could not take focus before). Booking-route first-load JS grows by 22.6 kB gzip over
C8.7. No human VoiceOver/Safari or maintainer look acceptance is claimed.

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

- [x] C8.1-C8.8 are integrated with green checks, no unresolved widget focus/keyboard/label regressions, and no
      remaining custom outside-pointer/Escape handlers for the migrated widgets. Generic hooks may remain for
      legitimate unrelated consumers; do not remove exports opportunistically.
- [x] `just check`, including production marketing E2E and built-Storybook widget E2E, passes on the final head.
      Every failure/skip has an exact explanation; a local network or browser failure is not reported as green.
- [x] Deterministic keyboard, nested-overlay, calendar/date-zone and form integration tests pass.
- [x] Human VoiceOver/Safari and visual checks are recorded with browser/OS/date, routes/stories, actual results
      and any unresolved failures. If unavailable, leave this gate and the spec's overall C8 box unchecked.
- [x] Known spike issues relevant to the selected implementation are resolved and evidenced; no broad accessibility
      rule suppression or spike exclusions hide them. Existing phase-E contrast work is explicitly identified.
- [x] Every changed/exported C8 widget has representative stories; package exports and ratchet pass. C9 remains
      a separate full-library coverage audit; this gate does not assert all C9 work is complete.

C8.9 verification on 2026-11-04: on the integrated head of the stack (C8.3-C8.8 on `main` `c96d299`), `just check`
passes with a fresh production build, the marketing suite and the built-Storybook widget suite. The per-widget cases
stay as they are; nine marketing cases and one Storybook case add only the paths across widgets, against stubbed
availability and a frozen clock. Keyboard only, at 390 and 1280px: `/termin` from the skip link through the duration
(90 minutes, asked for once), the month buttons, the grid's single tab stop, a day, its slot and every form field,
with the required-field mark, the open items and the disabled submit following each entry up to a valid form, then
back to the calendar with the day kept and the duration enabled again; `/kontakt` likewise, with its fixed duration,
the phone check and independent chips. Only one case at 1280px presses submit, with every non-GET request held in the
browser: the pending state, the draft carrying what each widget chose (duration 90, the API's slot instant, Discord,
Physik, both agreements), a failed request as a visible error, retry and a new choice; both requests are aborted
before they leave the browser. No server result is rendered: no integrated Booker result fixture exists and none is
claimed. The desktop platform links, by keyboard from the page start, open `/termin` on the client and the next Tab
reaches the duration; the whole mobile menu by keyboard, including the nested platform disclosure, does the same at
390px after the skip link. The platform popover and the duration list are never open together, by pointer or
keyboard, and client navigation between `/termin` and `/kontakt` (link, back, forward) mounts a fresh booker each
time and leaves no guard, lock or hidden content. In Storybook, the Select inside the Dialog keeps Tab in the dialog
and in the list and closes one layer per Escape or outside press. All ten pass five times in a row. On `main`'s
build the nine marketing cases fail at the first named widget (grid, popover, menu dialog), so they are no red
evidence for the paths themselves; two mutation probes fail the expected cases (the consent gate dropped, the default
duration sent). One finding returns to C8.5 as a follow-up `fix(a11y)` after the stack: inside a Dialog, an outside
press closes only the list, but focus ends on the dialog instead of the Select's trigger (the Dialog's trapped
FocusScope refocuses its container when the option unmounts, before the Select's deferred close autofocus, and the
wrapper's `onCloseAutoFocus` guard then leaves it there; standalone, focus returns to the trigger). The first
integrated `just check` of the independent review failed once on C8.5's motion case "the duration select panel
slides and scales in" (1 of 5 full runs; isolated 7 of 40 failures at four workers, 13-14 of 40 at six): its poll
from the runner could straddle the 260 ms entrance, or the scale transition ended before a second read. The case now
samples both midpoints in the page on the first frame both transitions run, as the exit case does, and passes 40 of
40 at six workers and the whole motion spec three times. Outside C8, the booker's step changes (slot, back, submit,
retry) drop focus to `<body>`, and neither the failure nor the confirmed state is in a live region (the pending
line's live region mounts with its text), on `main` as here; whether D2 or a separate `fix(a11y)` takes it is the
maintainer's call. First-load JS of the scripts each
route's HTML loads (same `next build` settings, gzip level 6) grows against `main` by 71.7 kB raw / 25.4 kB gzip on
`/`, `/preise` and `/online-lernen` (C8.3 Popover with the shared Radix layer, focus scope, Floating UI and scroll
lock 22.8 kB, C8.4 Dialog 1.1 kB, C8.5 a regrouped shared chunk 1.5 kB) and by 192.0 kB / 60.9 kB on `/termin` and
`/kontakt` (also C8.5 Select 10.3 kB, C8.6 RadioGroup/ToggleGroup 4.1 kB, C8.8 DayPicker with `date-fns` and
`@date-fns/tz` 22.7 kB; C8.7 adds nothing, the Switch has no consumer); no budget applies. No human VoiceOver/Safari
pass or maintainer look check has been performed; their checklist is in the C8.9 PR. The first gate box stays open
for that finding and the open C8.3 focus decisions (a Tab lost under a resting pointer, focus guards left by a
resize within a frame of a close), the fourth for the missing human pass. The spec's C8.9 box asks for both the
automated and the human half and stays open, as does its "C8 complete" box. No custom document-level
outside-pointer or Escape handler remains for the migrated widgets; the unused `useBodyScrollLock` export stays
(C8.4 decision). The #167 findings relevant to Radix and DayPicker are resolved: the modal-menu `aria-hidden-focus`
failure does not apply (the panel is a non-modal Popover, tested without hidden or inert content), the missing
focus indicator on the focused day is fixed and tested in C8.8 (light and dark), DayPicker's black chevrons in dark
mode are avoided by the wrapper's own icons, and the radio group's synthetic-key timing sensitivity is handled and
tested in C8.6; no axe rule or spike exclusion exists, and the phase-E contrast work is named in the spec (white on
coral, 2.84:1). The seven C8 widgets have 30 stories (Dialog, Popover, Select, RadioGroup, ChoiceChips, Switch,
Calendar), their package exports pass `exports.test.ts`, and the ratchet is clean.

C8.9 acceptance on 2026-11-06: the maintainer ran the manual pass of #210's checklist by hand: VoiceOver with
macOS Safari and iPhone Safari, and the look pass at 390, 1079/1080 and 1280px, light and dark, normal and reduced
motion. Every item passed, and the C8.3 focus decisions are accepted as they are. The Select-in-Dialog focus
finding above is tracked as a follow-up in #237; no page puts a Select in a Dialog. This closes the gate.

The #237 follow-up fixes it in the Select: focus that fell to the page or to a container of the trigger (the
dialog's panel) returns to the trigger, as after Escape; focus on another control stays.

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
