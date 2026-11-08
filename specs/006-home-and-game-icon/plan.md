# Implementation Plan: Home button, setup layout, and game icons

**Branch**: `feature/meche-meche` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

## Summary

Three small changes from the owner's review. (1) `MatchApp`'s header gets a
house button, shown when a match exists, that opens a `Dialog` and on confirm
runs the existing `discardMatch` operation. (2) `Setup` stacks the name field
and the add button. (3) The game contract gains an optional `Icon` component
(decorative), `GameList` renders it in the badge with the trophy as fallback,
and MECHE-MECHE declares a fan of cards.

## Technical Context

TypeScript/React/Tailwind as before; no new dependency; no storage change
(discard is the existing store operation). Island budget: 80 436 of 81 920
bytes before this change; the house dialog reuses `Dialog` and the icons are a
few SVG paths.

## Constitution Check

| Principle | Verdict | Note |
|---|---|---|
| I Pure client-side | PASS | No network. |
| II A game is a plugin | PASS | The shell renders `game.Icon` from the registry; it never names a game. `shell-boundary.test.ts` unchanged. |
| III Pure rules | PASS | No rule changes. |
| IV `client:only` | PASS | Changes inside the island. |
| V strict | PASS | `Icon` typed as an optional component in the contract; no casts. |
| VI Mobile-first | PASS | House ≥ 44 px; header still fits 360 px (title + two 48 px buttons). |
| VII Versioned schema | PASS | No persisted change. |
| VIII Spec before code | PASS | This spec committed before the code. |
| IX Language | PASS | New copy in `copy.ts`; MECHE-MECHE's icon in its folder. |

## Design

- **Contract** (`contracts/game-icon.md`): `GameDefinition.Icon?:
  ComponentType` and `Game.Icon?: ComponentType`; `defineGame` passes it
  through and throws a contract error if it is present and not a function.
- **Header**: `[title] … [house] [theme]`; the house is `btn-3d btn-plain
  size-12 px-0` with a house SVG, `data-testid="home"`. Dialog title "Voltar
  para a lista de jogos?"; text per status; buttons "Cancelar" and "Voltar" (`data-testid="confirm-home"`, red or blue per FR-003).
- **Setup**: the input/button row becomes a column; the button gets `w-full`.
- **Icon in the badge**: icons draw with `currentColor` strokes; the cards'
  faces fill with the badge color through a CSS variable `--badge` that
  `GameList` sets with a token (`[--badge:var(--color-orange)]`), so back
  cards are hidden behind front ones without literal colors.

## Files

```text
src/shell/game/contract.ts (+ contract.test.ts)   # optional Icon
src/shell/ui/MatchApp.tsx                          # house + dialog
src/shell/ui/copy.ts                               # house copy
src/shell/ui/parts/icons.tsx                       # HomeIcon
src/shell/ui/screens/GameList.tsx                  # game.Icon ?? TrophyIcon, --badge
src/shell/ui/screens/Setup.tsx                     # stacked field and button
src/shell/ui/home.browser.test.tsx                 # US1, US2, US3 (shell side)
src/games/meche-meche/Icon.tsx, index.ts           # the card fan
```
