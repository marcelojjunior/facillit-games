# Contract: Match store

**Consumers**: Phase 4 screens (through a `client:only` island), tests.
Entities and transitions: [data-model.md](../data-model.md).

## Creating the store

```ts
// src/shell/match/store.ts
createMatchStore(options: {
  registry: Registry;
  storage?: StorageLike | null; // default: browser localStorage, safely accessed; null = none
  createId?: () => string;      // default: crypto.randomUUID
  events?: StorageEventSource;  // default: window, if present (tab sync)
}): MatchStore

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// The part of `window` the store uses; `window` satisfies it.
interface StorageEventSource {
  addEventListener(type: 'storage', listener: (event: StorageEvent) => void): void;
  removeEventListener(type: 'storage', listener: (event: StorageEvent) => void): void;
}
```

Creating the store reads storage once and applies the load validation of
[data-model.md](../data-model.md#load-validation-order-fr-020). It never throws.
It must only be called in the browser (FR-024): Phase 4 creates it inside a
`client:only` island.

## Reading

```ts
interface MatchStore {
  getState(): MatchView | null;                 // null = no match
  subscribe(listener: () => void): () => void;  // returns unsubscribe
  getDiscardNotice(): DiscardNotice | null;     // FR-020a
  acknowledgeDiscardNotice(): void;             // clears it; never persisted
  dispose(): void;                              // stops listening to other tabs
  // ...operations below
}

type DiscardNotice = {
  reason: 'unreadable' | 'wrong_shape' | 'unsupported_version'
        | 'unknown_game' | 'invalid_round';
};
```

`getState` returns the same object until the next successful operation, so it
works with React's `useSyncExternalStore` without extra memoization.

```ts
interface MatchView {
  match: Match;                 // see data-model.md
  game: Game;                   // resolved from the registry
  evaluation: {                 // derived, never stored (FR-016)
    roundScores: readonly Scores[];
    totals: Scores;
    winners: readonly string[]; // meaningful when status is 'finished'
  };
}
```

## Operations

Every operation returns `OperationResult`:

```ts
type OperationResult =
  | { ok: true; persisted: boolean }
  | { ok: false; error: MatchError };

type MatchError =
  | { code: 'invalid_round'; reasons: readonly RoundRejection[] }
  | { code:
        | 'game_not_found' | 'match_in_progress' | 'no_match' | 'invalid_status'
        | 'roster_full' | 'roster_too_small' | 'roster_too_large'
        | 'blank_name' | 'name_too_long' | 'invalid_name' | 'duplicate_name'
        | 'player_not_found' | 'round_not_found' | 'invalid_draft' };
```

| Method | Arguments |
|---|---|
| `createMatch` | `gameId: string` |
| `addPlayer` | `name: string` |
| `renamePlayer` | `playerId: string, name: string` |
| `removePlayer` | `playerId: string` |
| `movePlayer` | `playerId: string, direction: 'up' \| 'down'` (setup only; added by spec 010) |
| `start` | — |
| `updateDraft` | `draft: unknown` (must be JSON-serializable) |
| `confirmRound` | `input: unknown` |
| `replaceRound` | `index: number, input: unknown` |
| `removeLastRound` | — |
| `finish` | — |
| `createRematch` | — |
| `discardMatch` | — |

Allowed states and error codes per operation: [data-model.md — State
transitions](../data-model.md#state-transitions). Any operation other than
`createMatch` with no match fails with `no_match`.

### Guarantees

1. **Failure changes nothing.** `ok: false` → state, storage, and subscribers
   untouched.
2. **Persist, then commit (FR-018).** On success, the new state is written to
   storage first, then becomes `getState()`, then subscribers are notified.
3. **A failed write keeps the state (FR-021).** If writing throws (quota,
   private mode), the operation still succeeds in memory and returns
   `{ ok: true, persisted: false }`. The screen decides how to warn the player.
4. **Tabs stay in sync (FR-021a).** The store listens to the browser's
   `storage` event for its key. When another tab writes, it re-runs the load
   validation on the new value, replaces its state, and notifies subscribers —
   without writing back. If the new value fails validation, it falls back to
   the initial state and exposes the notice. Simultaneous edits: last write
   wins.
5. **Error codes are English and stable.** Portuguese copy for them is written
   by the Phase 4 screens; `invalid_round` reasons arrive already in Portuguese
   from the game.
