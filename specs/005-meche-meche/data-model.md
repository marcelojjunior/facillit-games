# Data model: MECHE-MECHE, the first game

**Feature**: [spec.md](./spec.md)

The match envelope (`facillit-games:state`, `schemaVersion: 1`) is unchanged;
the game owns the shape of its rounds inside it (spec 002 FR-018a).

## MECHE-MECHE round (stored, and as the draft)

```json
{ "scores": { "p-ana": 50, "p-bia": 30 }, "bonus": ["p-ana", "p-caio"] }
```

| Field | Type | Rule |
|---|---|---|
| `scores` | object, optional | keys: player ids in the match; values: integers in `scoresOnOffer(n)`; no value twice. Missing key = no score (0). |
| `bonus` | array, optional | player ids in the match, no repeats. Missing id = no bonus. |

`n` = number of players in the match (2–7).

### Scores on offer

| Players | Scores |
|---|---|
| 2 | 20, 10 |
| 3 | 30, 20, 10 |
| 5 | 50, 40, 30, 20, 10 |
| 7 | 70, 60, 50, 40, 30, 20, 10 |

### Round value per player

`(scores[id] ?? 0) + (bonus includes id ? 10 : 0)` → between 0 and n×10 + 10.

### Validation (first failure wins; messages in pt-BR)

| Input | Result |
|---|---|
| not an object (or an array) | reject `invalid_shape`: "Rodada em formato inválido." |
| `scores` present but not a plain object | reject `invalid_shape` |
| `scores` names a player not in the match | reject `unknown_player` |
| a score not an integer on offer | reject `score_not_on_offer`: "<n> pontos não existe com <k> jogadores." |
| the same score given twice | reject `score_taken_twice`: "<n> pontos foi dado a mais de um jogador." |
| `bonus` present but not an array of strings | reject `invalid_shape` |
| `bonus` names a player not in the match | reject `unknown_player` |
| `bonus` repeats a player | reject `bonus_twice` |
| otherwise (including `{}`) | accept |

## Derived

Totals, positions, and winners come from the shell (spec 002, spec 003 D2)
using `scoreRound`, `computeTotals`, and `resolveWinners` (highest wins).
