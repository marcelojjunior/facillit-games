# Implementation Plan: Design system and shell screens

**Branch**: `feature/shell-screens` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-shell-screens/spec.md`

**Note on the branch name**: `setup-plan.sh` reports `003-shell-screens`
because Spec Kit derives it from the feature directory. The real git branch
follows the repository convention (`feature/<slug>`, AGENTS.md § Git).

## Summary

Turn the Phase 3 domain into the first playable app. One `client:only` React
island (`MatchApp`) owns the match store and renders one of four screens chosen
only by the match `status`. Each game now brings its own `RoundEntry`
component through the game contract — a controlled editor of a JSON value with
no submit button — while the shell owns confirm, fix, finish, and every
message. The shell ranks players by peeling the game's own `resolveWinners`,
so it never needs to know whether highest or lowest wins.

The design system is a set of Tailwind 4 `@theme` tokens with light and dark
values, applied before first paint by a tiny inline script that honours a
persisted theme choice (automatic / light / dark). Browser-mode Vitest tests
measure what Principle VI asks for (44 px targets, no horizontal scroll,
confirm in thumb reach) on a 360×640 viewport. Test-only games are playable by
hand on a development-only page that never reaches the build.

## Technical Context

**Language/Version**: TypeScript `~6.0.3` (`strictest`), TSX for components

**Primary Dependencies**: Astro 7.4.4, React 19.3.1, Tailwind 4.3.3 (all
existing). New **dev** dependencies only: `@vitest/browser-playwright` (same
version as `vitest`, 5.0.5), `playwright` (pinned exact), and
`vitest-browser-react` (pinned exact, peer-compatible with Vitest 5 and
React 19). No new runtime dependency.

**Storage**: `localStorage` — existing `facillit-games:state` (unchanged) and
new `facillit-games:theme` (`schemaVersion: 1`, see
[contracts/theme-preference.md](./contracts/theme-preference.md)).

**Testing**: Vitest projects — `unit` (`node`, existing patterns) and
`browser` (Chromium via Playwright, `*.browser.test.tsx`, viewport 360×640).

**Target Platform**: mobile browsers first (last 2 versions of Chrome Android
and Safari iOS); desktop works as a wider layout.

**Project Type**: static web app (Astro, one page, one island)

**Performance Goals**: an operation re-renders within one frame on a mid-range
phone (match ≤ 7 players × tens of rounds; full re-evaluation is
microseconds). Island JS ≤ 80 kB gzipped including React.

**Constraints**: no `client:load`/`client:visible`; no `src/` → `tests/`
import; no game name or id branch in the shell; no literal colors in
components; no runtime network request; no change to the match schema.

**Scale/Scope**: 4 screens, ~5 overlays, ~25 source modules, 2 fixture round
entries, ~12 test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | How this plan complies |
|---|---|---|
| **I — Pure Client-Side** *(NON-NEGOTIABLE)* | **PASS** | Static output unchanged. Fonts and icons are local (D8); no `fetch`. The dev-only route exists only under `astro dev` (D5). |
| **II — A Game Is a Plugin** *(NON-NEGOTIABLE)* | **PASS** | The shell gets `RoundEntry` and `rank` from the `Game` returned by the registry (D1, D2); it never imports a game folder or compares ids. `tests/shell-boundary.test.ts` stays and still covers every new file under `src/`. Adding a game = folder + registry line (SC-006). |
| **III — Pure, Tested Rules** *(NON-NEGOTIABLE)* | **PASS** | No rule function added or changed. `rank` is derived from `resolveWinners` in `defineGame` and unit-tested (normal, edge, tie). Round entries are UI, not rules; they never compute scores. |
| **IV — `client:only` Island** | **PASS** | One island, `client:only="react"`, with a static fallback (D3, D4). `static-build.test.ts` is repointed, not removed (FR-026). The deferred directive rule lands as `tests/island-directives.test.ts` (D14). The inline theme script reads only the theme key, not match state. |
| **V — TypeScript `strict`** | **PASS** | `RoundEntryProps.value` is `unknown`; no `any` or casts in the contract. React types imported as types only in the contract. |
| **VI — Mobile-First** | **PASS** — first phase that claims it | 360 px first; 44 px targets, no horizontal scroll, and confirm-in-reach are measured by browser tests (D13); fixed bottom confirm bar (D10); dark mode with persisted choice (D7). |
| **VII — Versioned Schema** | **PASS** | Match schema untouched. New theme key carries `schemaVersion: 1`, degrades to `auto` on anything unknown, documented discard policy for future versions. Drafts saved on every change (`updateDraft`), as before. |
| **VIII — Spec Before Code** *(NON-NEGOTIABLE)* | **PASS** | `spec.md` committed and clarified before this plan. FR-029a and SC-003 are reworded in this same change to match D5 and D6. |
| **IX — English repo, pt-BR user** | **PASS** | All code, tests, docs in English; Portuguese only in `copy.ts`, game names, round-entry labels, and fallback frame text. |
| **Spec gate / Test gate** | **PASS** | Every FR maps to a task with a test (see quickstart table). No scoring rule changes. |

Deviation: fixture games outside `src/games/` (inherited from spec 002,
already recorded there) now also carry `RoundEntry.tsx`. No new violation.

### Post-design re-check

Re-evaluated after writing the contracts: the game-contract change (D1) is a
breaking change to `GameDefinition` that only the two fixture games feel today;
it is the reason this phase exists (FR-009) and is recorded in
[contracts/round-entry.md](./contracts/round-entry.md). All gates still pass.

## Project Structure

### Documentation (this feature)

```text
specs/003-shell-screens/
├── spec.md
├── plan.md                  # this file
├── research.md              # D1–D15
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── round-entry.md       # game contract revision 2: RoundEntry + rank
│   ├── screens.md           # screen selection, actions, copy, test ids
│   └── theme-preference.md  # facillit-games:theme
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks
```

### Source Code (repository root)

```text
astro.config.mjs                 # + dev-only integration injecting /dev/test-games (D5)
vitest.config.ts                 # unit + browser projects (D13)

src/
├── pages/index.astro            # replaced: BaseLayout + <MatchApp client:only="react"> + fallback
├── layouts/BaseLayout.astro     # + inline theme boot script, app header slot
├── styles/
│   ├── global.css               # @theme tokens, dark overrides, dark variant (D7)
│   ├── tokens.ts                # color token values: single source for the contrast test (D15)
│   └── tokens.test.ts
├── components/                  # ClientOnlyProbe.tsx removed
│   └── MatchIsland.tsx          # binds MatchApp to src/games/registry (production)
├── shell/
│   ├── game/contract.ts         # + RoundEntryProps, RoundEntry, rank
│   ├── match/…                  # unchanged
│   ├── theme/
│   │   ├── preference.ts        # read/write/resolve (contract)
│   │   ├── boot.ts              # inline-script source generator
│   │   └── *.test.ts
│   └── ui/
│       ├── MatchApp.tsx         # creates store, selects screen, overlays
│       ├── copy.ts (+ test)     # pt-BR copy for every code (D12)
│       ├── screens/             # GameList, Setup, InProgress, Winner
│       ├── parts/               # Standings, History, ConfirmBar, FixSheet,
│       │                        # RenameDialog, ThemeControl, Notices, Dialog, icons
│       └── *.browser.test.tsx   # flows, layout, persistence, theme
└── games/registry.ts            # unchanged (still empty)

tests/
├── static-build.test.ts         # repointed to the real island + fallback (FR-026)
├── island-directives.test.ts    # new (D14)
├── shell-boundary.test.ts       # unchanged
├── two-games.test.ts            # unchanged
└── fixtures/
    ├── games/<id>/RoundEntry.tsx (+ .browser.test.tsx)   # one per fixture game
    └── dev/                     # dev-only page + DevMatchIsland (D5)
```

**Structure Decision**: single Astro project, as before. Screens are shell code
under `src/shell/ui/`; the only `.astro` page stays a thin wrapper around one
island, and the production island binding (`MatchIsland.tsx`) is the only
component that imports the registry.

## Complexity Tracking

No constitution violation to justify. Two choices recorded for reviewers:

| Choice | Why | Simpler alternative rejected because |
|---|---|---|
| Browser-mode test project (+3 dev deps, Chromium) | Principle VI requirements are about layout; only a real browser measures them | jsdom has no layout engine; screenshots alone are not assertions |
| Dev-only injected route for test games | Manual play before Phase 5 (clarification Q1) without `src/` importing `tests/` | A `DEV` branch in the registry couples `src/` to fixtures and trusts tree-shaking to keep them out of `dist/` |
