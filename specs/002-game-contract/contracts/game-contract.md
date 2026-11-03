# Contract: Game definition and registry

**Consumers**: every game folder (`src/games/<id>/`), the registry, the match
store. **Breaking this contract means changing every game**, so changes need a
spec.

## What a game writes

```ts
// src/games/<id>/index.ts
import { defineGame } from '../../shell/game/contract';
import { validateRound, scoreRound, computeTotals, resolveWinners } from './rules';

export default defineGame<MyRound>({
  id: 'my-game',            // kebab-case, equals the folder name
  name: 'Meu Jogo',         // user-facing, Portuguese
  minPlayers: 2,
  maxPlayers: 6,
  validateRound,
  scoreRound,
  computeTotals,
  resolveWinners,
});
```

Rules live in `rules.ts` with `rules.test.ts` beside it (Principle III).

## `GameDefinition<R>`

`R` is the game's own round type. `PlayerRef` is `{ id: string; name: string }`.
`Scores` is `Readonly<Record<string, number>>` keyed by player id.

| Field | Signature | Contract |
|---|---|---|
| `id` | `string` | Unique in the registry |
| `name` | `string` | Display name |
| `minPlayers` | `number` | Integer ≥ 1 |
| `maxPlayers` | `number` | Integer ≥ `minPlayers` |
| `validateRound` | `(input: unknown, players: readonly PlayerRef[]) => RoundValidation<R>` | The only way a value becomes an `R`. Never throws on bad input (FR-003) |
| `scoreRound` | `(round: R, players: readonly PlayerRef[]) => Scores` | Points each player earns in this round. Every player id present |
| `computeTotals` | `(roundScores: readonly Scores[], players: readonly PlayerRef[]) => Scores` | Totals over all rounds. Usually a sum; the game decides |
| `resolveWinners` | `(totals: Scores, players: readonly PlayerRef[]) => readonly string[]` | Winner ids. Ties → more than one (FR-004). Highest or lowest wins is the game's choice (FR-006). Zero rounds → every player wins |

```ts
type RoundValidation<R> =
  | { ok: true; round: R }
  | { ok: false; reasons: readonly RoundRejection[] };   // at least one

interface RoundRejection {
  code: string;      // English identifier, e.g. 'rank_out_of_range'
  message: string;   // Portuguese, shown to the player as is
}
```

All four functions MUST be pure (FR-005): no storage, DOM, clock, randomness,
or module-level mutable state. Every one of them MUST have tests for a normal
case, an edge case, and a tie (SC-002).

`defineGame` also checks the static fields once (integers, `min ≤ max`,
kebab-case id) and throws at module load if they are wrong — that is a
programming error caught by any test importing the game, not a player error.

## `Game` (what the shell sees)

`defineGame<R>` returns a `Game`, which has no type parameter (research D2).

| Member | Signature | Contract |
|---|---|---|
| `id`, `name`, `minPlayers`, `maxPlayers` | as above | |
| `validateRound` | `(input: unknown, players) => { ok: true } \| { ok: false; reasons }` | Same verdict as the game's function, without exposing `R` |
| `evaluate` | `(rounds: readonly unknown[], players) => Evaluation` | Validates every round, then scores, totals, and resolves winners |

```ts
type Evaluation =
  | {
      ok: true;
      roundScores: readonly Scores[];   // same order as rounds
      totals: Scores;
      winners: readonly string[];
    }
  | { ok: false; roundIndex: number; reasons: readonly RoundRejection[] };
```

## Registry

```ts
// src/games/registry.ts — the only file allowed to name or compare games
export function createRegistry(games: readonly Game[]): Registry;
export const registry: Registry;   // createRegistry([]) in this phase

// src/shell/game/contract.ts — the type lives in the shell, so shell code never
// imports from src/games/ just to name it
interface Registry {
  list(): readonly Game[];                  // registration order (stable)
  get(id: string): Game | undefined;        // undefined = game not found (FR-009)
}
```

`createRegistry` throws if two games share an id (programming error, caught by
tests).

`RoundValidation` with `ok: false` and an empty `reasons` list is also a
programming error: `defineGame`'s wrapper throws (FR-003, FR-009a).

The game's `id` MUST equal its folder name (FR-001); `tests/shell-boundary.test.ts`
checks it for every game folder.

**Adding a game (SC-001)**: create `src/games/<id>/`, then add one import and
one array entry in `src/games/registry.ts`. No other file changes.

## Boundary rules (enforced by `tests/shell-boundary.test.ts`)

Files under `src/` outside `src/games/` MUST NOT:

- import from `src/games/` except `src/games/registry`;
- compare or switch on a game id (`gameId ===`, `=== gameId`, `.id ===` on a
  game, `switch (gameId)`).
