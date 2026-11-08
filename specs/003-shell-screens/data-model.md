# Data model: Design system and shell screens

**Feature**: [spec.md](./spec.md)

This phase **does not change the match schema** (`facillit-games:state`,
`schemaVersion: 1`, spec 002 data model). It adds one persisted entity and a
few in-memory ones.

## Persisted

### Theme preference — `facillit-games:theme`

| Field | Type | Rule |
|---|---|---|
| `schemaVersion` | `1` | Anything else reads as `auto` |
| `theme` | `'auto' \| 'light' \| 'dark'` | Anything else reads as `auto` |

Independent of the match: no match operation reads or writes it. Full
contract: [contracts/theme-preference.md](./contracts/theme-preference.md).

## Derived (never stored)

### Standing

One per player, computed on every render from the store's `MatchView`:

| Field | Source |
|---|---|
| `player` | `match.players[i]` (roster order) |
| `total` | `evaluation.totals[player.id]` |
| `position` | `evaluation.positions[player.id]` (research D2) |

Displayed sorted by `position`, then roster order. Exactly one line per player
regardless of round count (FR-004).

### History cell

`evaluation.roundScores[roundIndex][player.id]`, one row per player, one column
per round plus total (FR-004a).

### Effective theme

`resolveTheme(choice, prefersDark)` → `'light' | 'dark'`, applied as
`data-theme` on `<html>`.

## In-memory UI state (component state, never persisted)

| State | Lives in | Lifetime | Notes |
|---|---|---|---|
| Open overlay | `MatchApp` | until closed | one of: none, history, fix sheet, rename, confirm-finish, confirm-abandon, confirm-remove-last (the theme control is inline in the header, not an overlay) |
| Fix working value | fix sheet | until save/cancel | copy of `match.rounds[i]`; lost on reload (research D6) |
| Fix index | fix sheet | until save/cancel | if the round disappears (other tab removed it), the sheet closes |
| Last rejection reasons | `MatchApp` | until next successful confirm/save or draft edit | passed to `RoundEntry.reasons` |
| Last operation error | screen | until next operation | `errorCopy[code]` |
| Not-saved warning | `MatchApp` | until an operation returns `persisted: true` | FR-016 |
| Discard notice | store (`getDiscardNotice`) | until acknowledged | FR-015; acknowledged on dismiss |
| Confirm lock | `ConfirmBar` ref | one animation frame | research D11 |

## State transitions

Unchanged from spec 002 ([data-model.md — State transitions](../002-game-contract/data-model.md#state-transitions)).
The screen is a function of `status` only ([contracts/screens.md](./contracts/screens.md)).

Cross-tab: when another tab changes the match, the store notifies, the screen
re-derives from the new state, and any overlay whose target vanished (the
round being fixed, a player being renamed) closes without writing.
