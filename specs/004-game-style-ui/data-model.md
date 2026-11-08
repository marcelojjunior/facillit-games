# Data model: Game-style visual identity

**Feature**: [spec.md](./spec.md)

No persisted data changes. `facillit-games:state` and `facillit-games:theme`
keep the schemas of specs 002 and 003.

## Design tokens (source: `src/styles/tokens.ts`)

| Group | Kind | Names |
|---|---|---|
| Surfaces and text | themed | `surface`, `surface-raised`, `surface-sunken`, `ink`, `ink-muted`, `line`, `accent`, `danger` |
| Scene | themed | `sky-top`, `sky-bottom`, `hill-back`, `hill-front`, `cloud`, `star` |
| Color families | fixed | `green`, `blue`, `red`, `orange`, `yellow`, `purple`, each with `-edge` and `-hi` |
| Text on color | fixed | `on-color`, `on-warm` |
| Medals | fixed | `gold`, `silver`, `bronze` |
| Mascot | fixed | `die`, `die-edge`, `pip`, `face` |

Rules: themed tokens have a light and a dark value; fixed tokens one value,
never overridden in the dark block. Contrast pairs in
[contracts/visual-tokens.md](./contracts/visual-tokens.md).

## Derived (never stored)

### Medal

From `evaluation.positions[player.id]`: 1 → gold, 2 → silver, 3 → bronze,
4+ → plain badge with the number. Players sharing a position share its medal.

### Points badge

`evaluation.totals[player.id]` → `"<total> pts"`, sign kept.

### Podium step (research D6)

```text
podiumSteps(view) → Step[]   (at most 3, ordered by position)
Step = { position: 1 | 2 | 3, players: PlayerRef[] (roster order) }
```

Only positions 1–3 that exist produce a step. Layout order on screen:
second, first, third.

| Positions | Steps |
|---|---|
| 1, 2, 3, 4 | 1 (A), 2 (B), 3 (C) |
| 1, 1, 3 | 1 (A, B), 3 (C) |
| 1, 2, 2 | 1 (A), 2 (B, C) |
| 1, 1 (two players) | 1 (A, B) |
| 1, 2 (two players) | 1 (A), 2 (B) |

### Mascot moment

| Screen | Moment | Crown |
|---|---|---|
| Game list | greeting | no |
| In progress, round rejected | beside the reasons | no |
| Winner | celebrating | yes |

## UI state

Unchanged from spec 003. Reduced motion is read by CSS only; no state.
