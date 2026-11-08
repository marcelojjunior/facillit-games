# Contract: Round entry and positions (game contract, revision 2)

**Changes**: [`specs/002-game-contract/contracts/game-contract.md`](../../002-game-contract/contracts/game-contract.md).
**Consumers**: every game folder, the in-progress screen, the fix-round sheet.
**Breaking**: yes — every game must add `RoundEntry`. Today that is the two
fixture games only.

## What a game writes now

```ts
// src/games/<id>/index.ts
import { defineGame } from '../../shell/game/contract';
import { validateRound, scoreRound, computeTotals, resolveWinners } from './rules';
import RoundEntry from './RoundEntry';

export default defineGame<MyRound>({
  id: 'my-game',
  name: 'Meu Jogo',
  minPlayers: 2,
  maxPlayers: 6,
  validateRound,
  scoreRound,
  computeTotals,
  resolveWinners,
  RoundEntry,                 // new, required
});
```

A game folder is now `index.ts`, `rules.ts`, `rules.test.ts`, and
`RoundEntry.tsx` (plus its own test, see below). Adding a game still touches
only its folder and the registry (FR-013, SC-006).

## `RoundEntryProps`

```ts
// src/shell/game/contract.ts
import type { ComponentType } from 'react';   // type-only: no runtime React here

export interface RoundEntryProps {
  /** Match players, in roster order. */
  readonly players: readonly PlayerRef[];
  /**
   * What to show: the stored draft while typing a new round, or the stored
   * input of a confirmed round while fixing it. May be `undefined` (empty
   * entry) or anything a previous version stored (FR-012).
   */
  readonly value: unknown;
  /** Report every edit. The value MUST be JSON-serializable (spec 002 FR-018a). */
  readonly onChange: (value: unknown) => void;
  /** Reasons from the last rejected confirm/save, to place next to inputs. May be empty. */
  readonly reasons: readonly RoundRejection[];
}

export type RoundEntryComponent = ComponentType<RoundEntryProps>;
```

`GameDefinition<R>` and `Game` both gain `readonly RoundEntry:
RoundEntryComponent`. `defineGame` passes it through and checks it is a
function (programming error otherwise, like the other static fields).

### Rules for a round entry

1. **Controlled.** Render from `value`; never keep a second source of truth
   that can disagree with it.
2. **Tolerant.** If `value` is not a shape the game recognises, render an empty
   entry. Never throw while rendering (FR-012).
3. **No submit.** No confirm, save, or cancel button; no `<form onSubmit>` that
   submits on Enter. The shell owns those (FR-017, FR-024, research D1).
4. **No storage, no network, no globals.** Edits go only through `onChange`
   (FR-010).
5. **Shell tokens and sizes.** Use design-token utilities only and keep every
   tappable element ≥ 44×44 px (FR-019, FR-022).
6. **Portuguese labels**, using player names from `players`.
7. **Tested.** Each `RoundEntry` has a browser test: renders an empty value,
   renders a valid value, renders garbage without throwing, and emits a value
   that the game's own `validateRound` accepts after a normal interaction.

## `Evaluation.positions`

```ts
type Evaluation =
  | {
      ok: true;
      roundScores: readonly Scores[];
      totals: Scores;
      winners: readonly string[];
      /** Position of each player (1 = best), keyed by player id. */
      positions: Scores;
    }
  | { ok: false; roundIndex: number; reasons: readonly RoundRejection[] };

interface Game {
  // ...existing members
  readonly RoundEntry: RoundEntryComponent;
}
```

`positions` is computed by `defineGame` inside `evaluate` by peeling winners
(research D2): winners are 1, then `resolveWinners` over the remaining players,
and so on. Ties share a position and skip the next ones: 1, 1, 3. With zero
rounds every player is 1. Games do not write it; `MatchView.evaluation.positions`
carries it to the screens.

If a game's `resolveWinners` returns an empty list or an id outside the given
players during peeling, `evaluate` throws a contract error (programming error,
FR-009a of spec 002), caught by the game's tests.
