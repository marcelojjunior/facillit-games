# Data Model: Game contract, registry, and persisted match

**Feature**: [spec.md](./spec.md) | **Decisions**: [research.md](./research.md)

Types are described in TypeScript notation because the contract is a
TypeScript interface; the exact signatures are in
[contracts/game-contract.md](./contracts/game-contract.md) and
[contracts/match-store.md](./contracts/match-store.md).

## Entities

### Player

| Field | Type | Rules |
|---|---|---|
| `id` | `string` | Opaque, unique within the match, assigned on add, never changes (research D5) |
| `name` | `string` | Trimmed; not blank; unique in the match ignoring case, not accents; stored as typed (FR-022, D9) |

Order in `Match.players` is the order players were added; it is the order the
screens show and the order a rematch keeps (FR-017a).

### Round

The confirmed input of one round, as the game's `validateRound` accepted it.
Stored as the game's own JSON value; the shell treats it as `unknown`
(FR-002). Its score is **not** stored (FR-016).

### Draft round

`unknown` JSON value, or absent. Whatever the screen is filling in for the next
round. Not validated until confirmed. Persisted on every update (FR-018,
User Story 2).

### Match

| Field | Type | Rules |
|---|---|---|
| `gameId` | `string` | Must resolve in the registry, or the match is discarded on load (FR-020) |
| `status` | `'setting_up' \| 'in_progress' \| 'finished'` | Explicit; never inferred from rounds (FR-012) |
| `players` | `Player[]` | Limits from the game, enforced at add and at start (FR-014) |
| `rounds` | `unknown[]` | Confirmed rounds, in play order; empty while `setting_up` |
| `draft` | `unknown` (optional) | Only while `in_progress` |

Derived, never stored: per-round scores, totals, winners — produced by
`game.evaluate(match.rounds, match.players)` (FR-016).

### Persisted state

```json
{ "schemaVersion": 1, "match": null }
```

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | `1` | Any other value → discard (FR-019, FR-020) |
| `match` | `Match \| null` | `null` is the initial state |

Storage key: `facillit-games:state` (FR-023, research D6).

### Game (registry entry)

| Field | Type | Rules |
|---|---|---|
| `id` | `string` | Unique in the registry; kebab-case; equals the folder name under `src/games/` |
| `name` | `string` | Display name, Portuguese (user-facing copy) |
| `minPlayers` / `maxPlayers` | `number` | Integers, `1 ≤ min ≤ max` |
| rule functions | see contract | Pure (FR-005) |

## State transitions

```text
                 createMatch(gameId)
   (no match) ───────────────────────► setting_up
                                         │  addPlayer / renamePlayer / removePlayer
                                         │  start  [min ≤ players ≤ max]
                                         ▼
                                     in_progress
                                         │  updateDraft / confirmRound
                                         │  replaceRound / removeLastRound
                                         │  renamePlayer
                                         │  finish
                                         ▼
                                      finished ──── createRematch ──► setting_up
                                                                      (same game,
                                                                       same players,
                                                                       no rounds)

   discardMatch: any state ──► (no match)
   createMatch while setting_up / in_progress: rejected (FR-011a);
   allowed when there is no match or it is finished.
```

| Operation | Allowed in | Fails with |
|---|---|---|
| `createMatch` | none, finished | `match_in_progress`, `game_not_found` |
| `addPlayer` | setting_up | `roster_full`, `blank_name`, `duplicate_name` |
| `renamePlayer` | setting_up, in_progress | `player_not_found`, `blank_name`, `duplicate_name` |
| `removePlayer` | setting_up | `player_not_found` |
| `start` | setting_up | `roster_too_small`, `roster_too_large` |
| `updateDraft` | in_progress | — |
| `confirmRound` | in_progress | `invalid_round` (with game reasons) |
| `replaceRound` | in_progress | `round_not_found`, `invalid_round` |
| `removeLastRound` | in_progress | `round_not_found` (no rounds) |
| `finish` | in_progress | — |
| `createRematch` | finished | — |
| `discardMatch` | any | — |

Any operation called in a state not listed fails with `invalid_status`; any
operation other than `createMatch` with no match fails with `no_match`. A
failed operation leaves the match unchanged and writes nothing.
`confirmRound` clears the draft.

## Load validation order (FR-020)

1. `getItem` throws or returns `null` → initial state.
2. Not valid JSON → discard.
3. Envelope is not an object with `schemaVersion` and `match` → discard.
4. `schemaVersion !== 1` → discard (no older versions exist; future migrations
   go here).
5. `match` has the wrong shape (fields, types, status value, duplicate player
   ids) → discard.
6. `registry.get(match.gameId)` not found → discard.
7. `game.evaluate(match.rounds, match.players)` rejects → discard.

"Discard" means: remove the key and return the initial state. It never throws.
