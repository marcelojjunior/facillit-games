# Data Model: Reorder players in setup

No persisted change. `Match.players` (spec 002) is already the ordered list;
its doc comment changes from "Order of addition" to "Setup order: addition,
then moves (spec 010); kept by a rematch".

## movePlayer (match operation, pure)

```text
movePlayer(match, playerId, direction: 'up' | 'down', context) → MatchResult
```

| Case | Result |
|---|---|
| status ≠ `setting_up` | `invalid_status` |
| `playerId` not in `players` | `player_not_found` |
| first + `up`, or last + `down` | `ok`, match unchanged |
| otherwise | `ok`, player swapped with the neighbour in that direction |

Nothing else in the match changes (rounds are empty in setup).
