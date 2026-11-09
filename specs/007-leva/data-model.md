# Data Model: LEVA

All values are game-owned JSON stored by the existing match store (schemaVersion
1, unchanged).

## LevaRound (confirmed round)

```text
{ cards: integer ≥ 1,
  guesses: { [playerId]: integer 0..cards },
  taken:   { [playerId]: integer 0..cards } }
```

Validation (`validateRound`, Portuguese messages):

| Code | When |
|---|---|
| `invalid_shape` | not an object, or `cards` not an integer ≥ 1 |
| `no_players` | `guesses` empty |
| `unknown_player` | an id not in the match |
| `missing_guess` / `missing_taken` | a participant without guess or result (message names the player) |
| `value_out_of_range` | a guess or result outside 0..cards |

Participants = keys of `guesses`; `taken` must have exactly the same keys.

## Lives (totals)

`lives(p) = max(0, 5 − Σ_rounds |guess − taken|)`; out when 0.

## NextRound (derived, never stored)

`nextRound(rounds, players) → { cards, alive: PlayerRef[], lives: Scores }`

- no valid rounds → cards 1
- else → last.cards + 1 (also after an elimination: FR-010 as revised)

## Draft (round being typed)

```text
{ cards, step: 'guess' | 'taken', guesses: {...}, taken: {...} }
```

Tolerant reading: anything unrecognised → empty draft at step `guess`.
`validateRound` ignores `step`.
