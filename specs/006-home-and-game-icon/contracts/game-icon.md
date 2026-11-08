# Contract: Game icon (game contract, revision 3)

**Changes**: `src/shell/game/contract.ts` (spec 002, revised by spec 003).
**Breaking**: no — the field is optional.

```ts
import type { ComponentType } from 'react'; // type-only, as for RoundEntry

interface GameDefinition<R> {
  // ...existing members
  /** Decorative picture for the game list badge (spec 006 FR-005). Optional. */
  readonly Icon?: ComponentType;
}

interface Game {
  // ...existing members
  readonly Icon?: ComponentType;
}
```

- `defineGame` passes `Icon` through unchanged and throws a contract error if
  it is present and not a function.
- The icon renders inside a 52×52 colored badge, in a 24×24 box: an inline
  SVG with `aria-hidden="true"`, strokes in `currentColor` (white on the
  badge), and fills that must match the badge use `var(--badge)`. Token
  utilities and CSS variables only; no literal color (the literal-color scan
  covers `src/games/`).
- No icon → the shell shows its trophy.
