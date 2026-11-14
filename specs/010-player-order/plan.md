# Implementation Plan: Reorder players in setup

**Branch**: `feature/leva-round-starter` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

## Summary

A new pure match operation, `movePlayer(match, playerId, direction)`, swaps a
player with the neighbour above or below while the match is in setup. The
store exposes it like the other operations (saved on every mutation). Setup
shows two arrow buttons per row, disabled at the ends. The players array is
already the match order, so the schema, the games, and every other screen are
untouched.

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (strictest), React 19.3.1, Astro 7.4.4
**Primary Dependencies**: none new
**Storage**: `localStorage` through the existing match store; schema unchanged
(schemaVersion 1): `players` is already an ordered array
**Testing**: Vitest `unit` (`match.test.ts`, `store.test.ts`) and `browser`
(a setup test in `src/shell/ui/`)
**Target Platform**: static site, mobile browsers, 360×640 first
**Project Type**: client-side web app (shell)
**Performance Goals**: n/a
**Constraints**: island JS ≤ 90 KiB gzip; 44 px targets; tokens only
**Scale/Scope**: 2–10 players (game limits)

## Constitution Check

| Principle | Verdict | Note |
|---|---|---|
| I Pure client-side | PASS | No network, no dependency. |
| II A game is a plugin | PASS | Shell only; no game name, no game folder touched. |
| III Pure rules | PASS | `movePlayer` is a pure match operation with unit tests (normal, edge: first/last/unknown player, wrong status). It is not a scoring rule, so no tie case applies. |
| IV `client:only` | PASS | Setup is already inside the island. |
| V strict | PASS | `direction: 'up' \| 'down'`; no casts. |
| VI Mobile-first | PASS | 44 px arrows; 10 players at 360 px, no sideways scroll (research D2). |
| VII Versioned schema | PASS | No shape change; saved on every move like every operation. |
| VIII Spec before code | PASS (gate) | `spec.md` committed before code (T001). |
| IX Language | PASS | Code and docs in English; "Subir"/"Descer" are UI copy in `copy.ts`. |

Post-design re-check: PASS (no change).

## Design

See [research.md](./research.md) and [data-model.md](./data-model.md).

- **Operation** (`src/shell/match/match.ts`): `movePlayer(match, playerId,
  direction, context)`; `guard(match, ['setting_up'])`; `player_not_found` for
  an unknown id; moving past an end returns the match unchanged (`ok`), so a
  stale tap is harmless.
- **Store** (`src/shell/match/store.ts`): `movePlayer(playerId, direction)` on
  the `MatchStore` interface, wired through `apply` like `removePlayer`.
- **Copy** (`src/shell/ui/copy.ts`): `labels.moveUp: 'Subir'`,
  `labels.moveDown: 'Descer'`.
- **Icons** (`src/shell/ui/parts/icons.tsx`): `ArrowUpIcon`, `ArrowDownIcon`
  (chevrons, same `Icon` wrapper).
- **Styles** (`src/shell/ui/parts/styles.ts`): `smallIconButton = 'btn-3d
  btn-plain size-11 px-0'` (44 px).
- **Setup** (`src/shell/ui/screens/Setup.tsx`): in each row, before the remove
  button, "Subir {name}" and "Descer {name}" buttons, `disabled` on the first /
  last row; the doc comment cites spec 010.
- **Contract docs**: add `movePlayer` to
  `specs/002-game-contract/contracts/match-store.md`; mention the arrows in
  `specs/003-shell-screens/contracts/screens.md` (setup).

## Project Structure

### Documentation (this feature)

```text
specs/010-player-order/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

No new `contracts/`: the existing store and screens contracts are amended.

### Source Code

```text
src/shell/match/match.ts (+ match.test.ts)     # movePlayer
src/shell/match/store.ts (+ store.test.ts)     # store.movePlayer
src/shell/ui/copy.ts                           # Subir, Descer
src/shell/ui/parts/icons.tsx                   # arrows
src/shell/ui/parts/styles.ts                   # smallIconButton
src/shell/ui/screens/Setup.tsx                 # arrow buttons
src/shell/ui/player-order.browser.test.tsx     # setup, reload, rematch, 360 px
```

**Structure Decision**: the existing single-project layout; shell only.

## Complexity Tracking

No violations.
