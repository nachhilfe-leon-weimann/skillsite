# Specs

A spec is the work order for one arc: why it exists, what is decided, and slices an agent can implement without
asking back. It is also the plan - progress shows only in its checkboxes and its status block. The reference spec
is [`foundation-refactor.md`](foundation-refactor.md); SkillForge's
[spec pattern](https://github.com/nachhilfe-leon-weimann/skillforge/blob/main/docs/specs/README.md) is the same.

## Shape

```text
# Spec: <Arc> (<what it covers, in a few words>)

> Status: Draft | Accepted, <date> - <phases done> | Implemented (<date>)
> **Amended YYYY-MM-DD:** <what changed and why, one sentence>.
> Builds on <specs>. Says whether it is also the decision record for the arc.

## Problem statement
## Goals
## Non-goals
## Decisions                 | # | Decision | Date |, one numbered row per decision (E-01, E-02, ...)
## Rules of the <arc>        the standing rules every slice keeps
## Target shape              the structure the arc ends in
## Requirements
### Phase A - <Name>         slices A0, A1, ...
## Timeline / phasing        the order, the parallel slices, the files two slices share
## Open questions
## Rules for implementing agents
```

A slice:

```markdown
**D2 - <Name>.** _(after C6)_

- _Technique:_ the symbols, files and steps - `useAvailability`, `BookingCalendar`, `TimeSlots`; pricing into
  `model/`.
- _Check:_ what the maintainer opens by hand - `/termin` and `/kontakt`: both flows, the empty month, the
  `unconfigured` and `error` states; "none visible" for plumbing.
- _Plan:_ [task plan](../plans/<spec>-<phase>.md), only when a phase needs one.
- _Acceptance criteria:_
  - [ ] a statement a reviewer can check, with the command or the test that shows it.
```

## What makes a spec work for agents

- **Decisions are closed.** The decision table records who decided and when, and the rules carry the why, so an
  agent applies a decision instead of reopening it; _Non-goals_ mark what is left out on purpose.
- **Facts are separated from assumptions.** What was probed (framework behavior, a build, a browser) says how;
  anything not verified says so.
- **Every slice names its symbols and files** and has criteria a reviewer can check, ticked in the PR that
  fulfils them.
- **A slice fits one review.** It lands as one PR with its tests and adds at most about 400 lines of code; tests,
  docs and generated files (`pnpm-lock.yaml`, recorded fixtures) do not count. The maintainer then reads it in one
  sitting. A larger requirement is split into several, one slice each.
- **Every slice says what to look at.** CI sees no look and no content: _Check_ names the routes and states the
  maintainer checks by hand, and the PR's _How to check_ repeats them.
- **The order is explicit.** The timeline names what runs in parallel, what waits and which files two slices
  share.
- **A refactor slice changes nothing a visitor sees**; if it cannot stay pixel-identical, the rules say stop and
  report.

## Rules

- A spec's _Rules for implementing agents_ apply in addition to [`AGENTS.md`](../../AGENTS.md); if they contradict
  it, ask.
- Progress shows only in the checkboxes and the status block: a slice PR ticks its own boxes, and a change of
  course gets an **Amended** line or an amended date in the decision table. Moved code gets a status line saying
  what moved where.
- No tracking issues.
- A task plan for a phase lives versioned in `docs/plans/`, linked from the slice as `_Plan:_` (C8 in
  `foundation-refactor.md`); it replaces tool defaults such as `docs/superpowers/`. Briefs and handoffs never become
  files.
- Private working notes stay out of the repository (`docs/.gitignore`); a spec names what was found, not the notes.
