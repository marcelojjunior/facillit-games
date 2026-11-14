# Contract: Screens, actions, and copy

**Consumers**: `MatchApp` and its screens, browser tests, Phase 5 (which adds
a real game behind these screens without changing them).

## Screen selection (FR-001)

| Store state | Screen | `data-screen` |
|---|---|---|
| `getState() === null` | Game list | `game-list` |
| `status === 'setting_up'` | Setup | `setup` |
| `status === 'in_progress'` | In progress | `in-progress` |
| `status === 'finished'` | Winner | `winner` |

Before the island mounts, the page shows the static fallback frame
(`data-testid="loading-frame"`, research D4). The island root carries
`data-testid="match-app"` and the current `data-screen`.

Overlays on any screen: discard notice (once, FR-015), not-saved warning
(FR-016), theme control (FR-020).

## Actions per screen → store operation

| Screen | Action (pt-BR label) | Operation | Confirmation |
|---|---|---|---|
| Game list | tap a game | `createMatch(id)` | — |
| Setup | Adicionar | `addPlayer(name)` | — |
| Setup | rename (tap name) | `renamePlayer(id, name)` | — |
| Setup | Remover | `removePlayer(id)` | — |
| Setup | Subir / Descer (spec 010) | `movePlayer(id, 'up' \| 'down')` | — |
| Setup | Iniciar partida | `start()` | — |
| Setup | Abandonar | `discardMatch()` | yes |
| In progress | edit entry | `updateDraft(value)` on every change | — |
| In progress | Confirmar rodada (bottom bar) | `confirmRound(draft)` | — (guarded, D11) |
| In progress | Ver histórico | — (opens full history) | — |
| History | tap a round | opens fix sheet with the round's input | — |
| Fix sheet | Salvar | `replaceRound(index, value)` | — |
| Fix sheet | Cancelar | — | — |
| In progress | Remover última rodada | `removeLastRound()` | yes |
| In progress | Renomear jogador | `renamePlayer(id, name)` | — |
| In progress | Finalizar | `finish()` | yes, shows the table (FR-006) |
| In progress | Abandonar | `discardMatch()` | yes |
| Winner | Revanche | `createRematch()` | — |
| Winner | Nova partida | `discardMatch()` | — |

"Nova partida" on the winner screen discards the finished match (it holds no
history, spec 002) and shows the game list.

## Result handling

| Result | Screen behaviour |
|---|---|
| `{ ok: true, persisted: true }` | Clear the not-saved warning and any shown error. |
| `{ ok: true, persisted: false }` | Show the not-saved warning (stays until a persisted result). |
| `{ ok: false, error: { code: 'invalid_round', reasons } }` | Pass `reasons` to the round entry and list them inside the fixed bottom bar, right above the confirm button, so they are never hidden behind it; keep the draft. |
| `{ ok: false, error: { code } }` (any other) | Show `errorCopy[code]` next to the control that triggered it. |

## Copy (pt-BR), `src/shell/ui/copy.ts`

Every `MatchError['code']` and `DiscardNotice['reason']` has an entry; the
`Record` type makes a missing one a compile error (SC-005). Final wording is an
implementation detail reviewed in the PR; the meaning is fixed here:

| Code | Meaning to convey |
|---|---|
| `game_not_found` | That game is not available. |
| `match_in_progress` | A match is already in progress; finish or abandon it first. |
| `no_match` | There is no match; pick a game. |
| `invalid_status` | That action is not available right now. |
| `roster_full` | The game allows at most N players. |
| `roster_too_small` | The game needs at least N players. |
| `roster_too_large` | The game allows at most N players. |
| `blank_name` | Type a name. |
| `name_too_long` | Names have at most 30 characters. |
| `invalid_name` | The name has invalid characters. |
| `duplicate_name` | There is already a player with that name. |
| `player_not_found` | That player is no longer in the match. |
| `round_not_found` | That round no longer exists. |
| `invalid_draft` | The round could not be saved; try again. |
| `invalid_round` | (game reasons shown as given) |

| Discard reason | Meaning to convey (all: "the previous match could not be recovered") |
|---|---|
| `unreadable` | …the saved data was damaged. |
| `wrong_shape` | …the saved data was damaged. |
| `unsupported_version` | …it was saved by an incompatible version of the app. |
| `unknown_game` | …its game is no longer available. |
| `invalid_round` | …one of its rounds is no longer valid. |

N comes from the current game's `minPlayers`/`maxPlayers`.

## Stable test hooks

`data-testid` values used by browser tests and kept stable: `match-app`,
`loading-frame`, `game-option`, `player-name-input`, `add-player`,
`start-match`, `standings`, `standing-row`, `round-entry`, `confirm-round`,
`open-history`, `history-round`, `save-fix`, `finish-match`, `confirm-finish`,
`winner-names`, `rematch`, `new-match`, `discard-notice`, `not-saved-warning`,
`theme-control`.
