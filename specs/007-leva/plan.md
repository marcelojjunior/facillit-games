# Implementation Plan: LEVA, the second game

**Branch**: `feature/leva` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

## Summary

LEVA is a plugin in `src/games/leva/` plus one registry line, like MECHE-MECHE.
Two small, optional additions to the game contract (revision 4) make it
possible: the round entry receives the confirmed rounds before the one it edits
(`rounds`), and a game may name the unit of its totals (`unit`). Each stored
round is self-describing (`{ cards, guesses, taken }`), so the four rules score
it alone; the entry derives the living players, their lives, and the next
number of cards from `rounds` with the same rules. The island budget goes from
80 KiB to 90 KiB (amendment to spec 003).

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (strictest), React 19.3.1, Astro 7.4.4
**Primary Dependencies**: none new
**Storage**: `localStorage` through the existing match store; schema unchanged
(schemaVersion 1): LEVA rounds and drafts are game-owned JSON values, which the
store already stores opaquely
**Testing**: Vitest 5 `unit` (rules, contract) and `browser` (entry, full match)
**Target Platform**: static site, mobile browsers, 360×640 first
**Constraints**: island JS ≤ 92 160 bytes gzip -9 (was 81 920; 80 969 used
before this feature); 44 px targets; tokens only
**Scale/Scope**: 2–10 players, rounds without ceiling on cards

## Constitution Check

| Principle | Verdict | Note |
|---|---|---|
| I Pure client-side | PASS | No network, no new dependency. |
| II A game is a plugin | PASS | LEVA lives in its folder; the shell gains two generic, optional contract fields and never names a game. `shell-boundary.test.ts` unchanged. |
| III Pure rules | PASS | `validateRound`, `scoreRound`, `computeTotals`, `resolveWinners` pure, each with normal, edge, and tie tests; the next-round derivation (`nextRound`) is pure and tested too. |
| IV `client:only` | PASS | Everything inside the island. |
| V strict | PASS | `rounds: readonly unknown[]`, parsed tolerantly; no casts. |
| VI Mobile-first | PASS | Wrapping grid of number buttons, 44 px; 10 players fit 360 px with vertical scroll only. |
| VII Versioned schema | PASS | No persisted shape of the shell changes; LEVA's round shape is new and versioned by the game (unknown shapes are rejected by `validateRound`, so the shell's discard rules apply). |
| VIII Spec before code | PASS | spec.md committed (a255823) before this plan. |
| IX Language | PASS | Code and docs in English; copy pt-BR in LEVA's folder and `copy.ts`. |

Post-design re-check: PASS (no change).

## Design

See [research.md](./research.md) for the decisions and
[contracts/game-contract-rev4.md](./contracts/game-contract-rev4.md) for the
contract change.

- **Contract** (`src/shell/game/contract.ts`):
  `RoundEntryProps.rounds: readonly unknown[]`;
  `GameDefinition.unit?` / `Game.unit?: { one: string; other: string }`;
  `defineGame` passes `unit` through and throws a contract error if it is
  present and malformed.
- **Shell**: `InProgress` passes `rounds={match.rounds}`; `FixSheet` passes
  `rounds={match.rounds.slice(0, index)}`; `PointsBadge` takes the game's unit
  (`Standings`, `Podium` pass `view.game.unit`), default `labels.points`.
- **LEVA rules** (`rules.ts`): `LevaRound { cards, guesses, taken }`;
  `scoreRound` = `−|guess − taken|` per participant, 0 otherwise;
  `computeTotals` = `max(0, 5 + Σ)`; `resolveWinners` = highest; plus
  `nextRound(rounds, players)` → `{ cards, alive, lives }`.
- **LEVA entry** (`RoundEntry.tsx`): draft
  `{ cards, step: 'guess' | 'taken', guesses, taken }`; header "N carta(s)";
  per living player a sunken panel with name, lives, and a wrapping grid of
  buttons 0…cards ("Leva"/"Não leva" when cards = 1); a button to move to the
  results and one to go back; with ≤ 1 living player, a message and no input
  (the draft stays `undefined`, so the shell's confirm stays disabled).
- **Icon** (`Icon.tsx`): a face with a card on the forehead, `currentColor`
  strokes, `var(--badge)` card face.
- **Budget**: `tests/static-build.test.ts` limit to `90 * KB`; amendment note in
  `specs/003-shell-screens/plan.md`.

## Project Structure

### Documentation (this feature)

```text
specs/007-leva/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/game-contract-rev4.md
└── checklists/requirements.md
```

### Source Code

```text
src/shell/game/contract.ts (+ contract.test.ts)     # rounds, unit
src/shell/ui/screens/InProgress.tsx                  # rounds={match.rounds}
src/shell/ui/parts/FixSheet.tsx                      # rounds before index
src/shell/ui/parts/PointsBadge.tsx, Standings.tsx, Podium.tsx   # unit
src/games/leva/
├── index.ts            # defineGame({ id: 'leva', name: 'LEVA', 2, 10, unit, … })
├── rules.ts            # LevaRound, four rules, nextRound
├── rules.test.ts
├── RoundEntry.tsx
├── RoundEntry.browser.test.tsx
├── Icon.tsx
└── match.browser.test.tsx   # full 4-player match, hand-computed
src/games/registry.ts (+ registry.test.ts)          # [mecheMeche, leva]
tests/static-build.test.ts                          # 90 KiB, LEVA in dist
specs/003-shell-screens/plan.md                     # budget amendment
```

**Structure Decision**: the existing single-project layout; LEVA mirrors
`src/games/meche-meche/`.

## Complexity Tracking

No violations.
