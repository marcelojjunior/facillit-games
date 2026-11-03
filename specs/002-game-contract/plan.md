# Implementation Plan: Game contract, registry, and persisted match

**Branch**: `feature/game-contract` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-contract/spec.md`

**Note on the branch name**: `setup-plan.sh` reports `002-game-contract`
because Spec Kit derives it from the feature directory. The real git branch
follows the repository convention (`feature/<slug>`, AGENTS.md § Git).

## Summary

Build the plugin seam the rest of the project depends on: a `GameDefinition<R>`
contract that each game fills with four pure rule functions, a `defineGame`
helper that erases the game's round type so the shell can hold any game without
`any`, a registry that is the only place allowed to name a game, and a match
store that applies pure operations, persists every mutation in one versioned
`localStorage` envelope, and degrades to the initial state on any bad data.

No screen, no real game. Two fixture games in `tests/` prove that the contract
is not shaped around one game; a source-scanning test enforces the shell/game
boundary.

## Technical Context

**Language/Version**: TypeScript `~6.0.3`, `astro/tsconfigs/strictest`
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)

**Primary Dependencies**: none added. This phase is plain TypeScript; Astro and
React are not imported by any new module.

**Storage**: browser `localStorage`, one key `facillit-games:state`, envelope
`{ schemaVersion: 1, match }` (research D6)

**Testing**: Vitest 5, default `node` environment (no DOM — impure rules fail).
Storage is an in-memory fake implementing `getItem`/`setItem`/`removeItem`.

**Target Platform**: mobile browsers (code runs only in a `client:only` island,
from Phase 4 on)

**Project Type**: static web app — this phase adds a domain library inside it

**Performance Goals**: no measurable concern: a match is ≤ 7 players × tens of
rounds; full re-evaluation on every operation is microseconds (SC-007 is about
correctness, not speed)

**Constraints**: no new dependency; no `any`, `@ts-ignore`, or casts in the
contract, schema, or rules (Principle V); nothing under `src/` reachable from a
page in this phase

**Scale/Scope**: ~6 source modules, 2 fixture games, ~9 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | How this plan complies |
|---|---|---|
| **I — Pure Client-Side** *(NON-NEGOTIABLE)* | **PASS** | No server, no `fetch`. Persistence is `localStorage` only. The build stays static (`tests/static-build.test.ts` unchanged). |
| **II — A Game Is a Plugin** *(NON-NEGOTIABLE)* | **PASS** | Shell code under `src/shell/` receives a `Registry` and never imports `src/games/<id>/`. `createRegistry` and the id lookup live in `src/games/registry.ts`, the only file allowed to compare ids (research D8). Enforced by `tests/shell-boundary.test.ts` (D7). |
| **III — A Scoring Rule Is a Pure, Tested Function** *(NON-NEGOTIABLE)* | **PASS** | Rules take inputs and return values; randomness (player ids) is injected into the shell, never read by rules (D5). Each fixture game has `rules.test.ts` beside `rules.ts` with normal, edge, and tie cases. Ties return lists. |
| **IV — Match State Is a `client:only` Island** | **PASS** | No component reads the store in this phase. The store reads storage only when created, and the contract requires creating it in the browser. The deferred `client:load` lint rule stays deferred to Phase 4 with a reason (D7). |
| **V — TypeScript `strict`** | **PASS** | `strictest` already on. Heterogeneous games are held through type erasure in a closure (D2), not `any` or bivariant methods. Loaded data is `unknown` until parsed (D1, D6). |
| **VI — Mobile-First** | **N/A** | No layout in this phase. |
| **VII — The Persisted Schema Is Versioned** | **PASS** | `schemaVersion: 1` on the envelope; a single `switch` point for future migrations; 7-step safe load; save on every mutation including the draft round; explicit `status` field. POC data is not migrated — documented decision (spec Assumptions; different origin). |
| **VIII — Spec Before Code** *(NON-NEGOTIABLE)* | **PASS** | `spec.md` committed in `13f96fd` before this plan. |
| **IX — English in the Repository** | **PASS** | All identifiers, error codes, and docs in English. The only Portuguese is user-facing: game `name` and `RoundRejection.message` (D3). |

| Gate | Verdict | Note |
|---|---|---|
| **Spec gate** | **PASS** | See VIII. |
| **Test gate** | **PASS** | Every rule function of both fixture games is tested (SC-002). |
| **Constitution gate** | **PASS** | This section is filled; no violation to record. |
| **Git conventions** | **PASS** | Branch `feature/game-contract` from `develop`; conventional commits; no AI attribution. |

### Post-design re-evaluation

Re-checked after writing data-model.md and contracts/. One finding changed the
design: `createRegistry` first sat in the shell, where its `games.find(g =>
g.id === id)` is exactly the id comparison Principle II forbids outside the
registry. It moved to `src/games/registry.ts`. No other change; all rows above
hold.

**After `/speckit-clarify` (2026-11-02)**: tab sync through the `storage`
event (D10) and an in-memory discard notice (D11) were added, plus name
limits, draft serializability, and the failed-write semantics. All use
browser features already in scope; no new dependency, no new principle
concern. All rows above still hold.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-contract/
├── plan.md              # This file
├── research.md          # Decisions D1–D11
├── data-model.md        # Entities, transitions, load order
├── quickstart.md        # Validation guide
├── contracts/
│   ├── game-contract.md # GameDefinition, Game, Registry, boundary rules
│   └── match-store.md   # Store API, operations, guarantees
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── shell/                       # NEW — the shell; never names a game
│   ├── game/
│   │   ├── contract.ts          # GameDefinition<R>, Game, defineGame, result types
│   │   └── contract.test.ts
│   └── match/
│       ├── match.ts             # pure operations (FR-013)
│       ├── match.test.ts
│       ├── persistence.ts       # envelope, parsePersistedState, safe storage access
│       ├── persistence.test.ts
│       ├── store.ts             # createMatchStore
│       └── store.test.ts
├── games/                       # NEW
│   ├── registry.ts              # createRegistry + `registry` (empty this phase)
│   └── registry.test.ts
├── components/ClientOnlyProbe.tsx   # unchanged (Phase 4 removes it)
├── layouts/BaseLayout.astro         # unchanged
├── pages/index.astro                # unchanged
└── styles/global.css                # unchanged

tests/
├── fixtures/games/              # NEW — never shipped (FR-025)
│   ├── highest-wins/{index.ts, rules.ts, rules.test.ts}
│   └── lowest-wins/{index.ts, rules.ts, rules.test.ts}
├── two-games.test.ts            # NEW — User Story 1 end to end
├── shell-boundary.test.ts       # NEW — SC-005
├── smoke.test.ts                # unchanged
└── static-build.test.ts         # unchanged

index.html, script.js, style.css     # FROZEN POC — untouched
```

**Structure Decision**: a `src/shell/` folder makes the boundary physical: the
boundary test can say "every file outside `src/games/`" without a list to
maintain. Tests for shell modules sit beside them (`src/**/*.test.ts`, already
in `vitest.config.ts`); cross-cutting and fixture tests sit in `tests/`. No
config file changes are needed.

## Complexity Tracking

No constitution violation to justify. Recorded for the reviewer — things
deliberately **not** built:

| Not built | Why | When |
|---|---|---|
| Schema validation library (zod etc.) | Five-field schema; fixture inputs are trivial (D1, D6) | When a real game's input is complex enough to warrant it |
| State management library | One store, one value; ~10 lines of subscribe logic (D4) | Not foreseen |
| ESLint rule for the boundary | The test covers imports and id comparisons; one mechanism is enough (D7) | Optional convenience, any time |
| `client:load` lint rule | No component imports the store yet (D7) | Phase 4 |
| Migration code | `schemaVersion` 1 has no predecessor (D6) | First incompatible schema change |
| Automatic match end | Out of scope (spec Assumptions) | A game that needs it, in its own spec |
