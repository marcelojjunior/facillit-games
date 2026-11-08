# Implementation Plan: MECHE-MECHE, the first game

**Branch**: `feature/meche-meche` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-meche-meche/spec.md`

**Note on the branch name**: `setup-plan.sh` reports `005-meche-meche`
because Spec Kit derives it from the feature directory. The real git branch
follows the repository convention (`feature/<slug>`, AGENTS.md § Git).

## Summary

Add MECHE-MECHE as the first game plugin, exactly as AGENTS.md pitfall 11
describes: a folder `src/games/meche-meche/` with `index.ts` (`defineGame`),
`rules.ts` (four pure rule functions), `rules.test.ts`, `RoundEntry.tsx`, and
`RoundEntry.browser.test.tsx`, plus one import and one array entry in
`src/games/registry.ts`. No shell file changes. A round is stored as the
scores taken and the players with the bonus; scoring is the POC's. The round
entry is one card per player with a score button per score on offer, a "no
score" button, and a +10 toggle, in the 3D style of spec 004. Tests and docs
that assumed an empty production registry are updated; the island-budget test
gets a measured answer (research D5).

## Technical Context

**Language/Version**: TypeScript `~6.0.3` (`strictest`), TSX

**Primary Dependencies**: none new. Astro 7.4.4, React 19.3.1, Tailwind 4.3.3.

**Storage**: unchanged. A MECHE-MECHE round is stored inside the existing
match envelope (`facillit-games:state`, `schemaVersion: 1`) as the game's own
JSON value (spec 002 FR-018a); no schema change.

**Testing**: Vitest `unit` (rules, registry) and `browser` (round entry, a full
match through `MatchApp`, layout at 360×640 with 7 players).

**Target Platform**: as specs 003 and 004.

**Project Type**: static web app; one game plugin.

**Performance Goals**: island JS ≤ 80 KiB gzipped (81 920 bytes) with the game
in the production registry; today 79 163 bytes without it (research D5).

**Constraints**: Principle II (the shell never names the game), Principle III
(pure rules with normal, edge, and tie tests), spec 003 round-entry contract,
spec 004 visual contract (3D buttons, tokens only, 44 px).

**Scale/Scope**: 5 new files in one folder, 1 registry line, 3 updated tests
or docs (registry test, static-build fixture/real-game check, tokens scan
reach), 1 spec note (spec 003 FR-029).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | How this plan complies |
|---|---|---|
| **I — Pure Client-Side** *(NON-NEGOTIABLE)* | **PASS** | No network, no new dependency. |
| **II — A Game Is a Plugin** *(NON-NEGOTIABLE)* | **PASS** | Only `src/games/meche-meche/` and one registry line change in `src/`. `tests/shell-boundary.test.ts` (unchanged) also checks the folder name equals the id. This is the property's first real test. |
| **III — Pure, Tested Rules** *(NON-NEGOTIABLE)* | **PASS** | `validateRound`, `scoreRound`, `computeTotals`, `resolveWinners` are pure, no DOM/storage/clock/randomness; `rules.test.ts` covers normal, edge, and tie for each (D2). |
| **IV — `client:only` Island** | **PASS** | The game renders inside the existing island; no new `.astro` file. |
| **V — TypeScript `strict`** | **PASS** | No `any` or casts in `rules.ts`; the round type is narrowed from `unknown` by `validateRound` only. |
| **VI — Mobile-First** | **PASS** | Round entry designed for 360 px and 7 players; layout test covers it (D4). |
| **VII — Versioned Schema** | **PASS** | The match schema is unchanged; the round shape is the game's (validated on load, spec 002). |
| **VIII — Spec Before Code** *(NON-NEGOTIABLE)* | **PASS** | `spec.md` committed with the owner's clarifications. Spec 003 FR-029 gets a note in the same PR (D6). |
| **IX — English repo, pt-BR user** | **PASS** | Game name, labels, and rejection messages in pt-BR inside the game folder (allowed: game copy). |

No violation.

### Post-design re-check

After the contract: the round shape (D1) needs nothing from the shell; the
entry uses only `RoundEntryProps` and the shell's CSS classes. The budget
(D5) is the only risk; its fallback stays inside spec 004 D11's sprite plan
and the game folder. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/005-meche-meche/
├── spec.md
├── plan.md               # this file
├── research.md           # D1–D6
├── data-model.md
├── quickstart.md
├── contracts/
│   └── meche-meche-round.md   # stored round shape, validation, scoring, entry
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
src/games/
├── meche-meche/
│   ├── index.ts                    # defineGame({ id: 'meche-meche', name: 'MECHE-MECHE', 2..7 })
│   ├── rules.ts                    # scoresOnOffer + the four rule functions
│   ├── rules.test.ts               # normal, edge, tie per function (unit)
│   ├── RoundEntry.tsx              # one card per player: scores, none, +10
│   └── RoundEntry.browser.test.tsx # contract tests (empty, valid, garbage, emits valid)
├── registry.ts                     # + one import, one entry
└── registry.test.ts                # "empty until Phase 5" → lists MECHE-MECHE

src/styles/tokens.test.ts           # literal-color scan also covers src/games
tests/static-build.test.ts          # dist/ names MECHE-MECHE; fixtures still absent
src/games/meche-meche/match.browser.test.tsx # full match + POC bugs through MatchApp (D3)
```

**Structure Decision**: everything about the game, tests included, lives in
its folder; the shell's tests stay game-agnostic.

## Complexity Tracking

No constitution violation. One choice recorded:

| Choice | Why | Simpler alternative rejected because |
|---|---|---|
| Full-match browser test inside the game folder | The POC-bug acceptance (spec US3) needs the real screens with the real game | Putting it under `src/shell/ui/` would make the shell's code tree name a game (Principle II guard scans `src/` outside `src/games/`) |
