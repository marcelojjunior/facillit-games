---

description: "Task list for 002-game-contract"
---

# Tasks: Game contract, registry, and persisted match

**Input**: Design documents from `specs/002-game-contract/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/game-contract.md](./contracts/game-contract.md),
[contracts/match-store.md](./contracts/match-store.md),
[quickstart.md](./quickstart.md)

**Tests**: included, and written **before** the code in each story. Not a TDD
preference: the spec requires automated checks (FR-010, SC-002, SC-003, SC-004,
SC-005) and constitution Principle III requires `rules.test.ts` beside every
`rules.ts`.

**Organization**: grouped by user story in the spec's priority order (US1, US2,
US3 are P1; US4, US5 are P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (separate files, no pending dependency)
- **[Story]**: the user story the task belongs to (US1–US5)
- Paths are relative to the repository root

## Rules that apply to every task in this list

- **`index.html`, `script.js`, `style.css` are untouchable** (frozen POC).
- **No new dependency.** No `any`, `@ts-ignore`, `@ts-expect-error`, or `as`
  casts in `src/shell/game/contract.ts`, `src/shell/match/persistence.ts`, or
  any `rules.ts` (Principle V). Narrow `unknown` with type guards instead.
- **Shell files never name a game.** Files under `src/shell/` receive a
  `Registry`; they never import `src/games/` except `src/games/registry.ts`,
  and never compare or `switch` on a game id (FR-010, research D7, D8).
- **Errors are values.** Player input and stored data never throw; return the
  discriminated unions of the contracts. Only programming errors throw
  (FR-009a).
- **English everywhere** except game `name` and `RoundRejection.message`, which
  are Portuguese user-facing copy (Principle IX).
- Run `pnpm test` after every task that adds or changes a test; it must be green
  before moving on, except where a task says the test is expected to fail first.

---

## Phase 1: Setup

**Purpose**: confirm the baseline. No configuration changes are needed:
`vitest.config.ts` already includes `src/**/*.test.ts` and `tests/**/*.test.ts`,
and `tsconfig.json` already uses `strictest` (plan, Structure Decision).

- [X] T001 Run `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` on `feature/game-contract` and confirm all pass before any change (baseline for the spec 001 guards in `tests/static-build.test.ts` and `tests/smoke.test.ts`)

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the contract, the registry, and the two fixture games. Every user
story uses them.

**⚠️ CRITICAL**: no user story work can begin until this phase is complete.

- [X] T002 Write `src/shell/game/contract.test.ts` (expected to fail until T003): with a tiny inline game declared via `defineGame`, assert that (a) `Game.validateRound(unknown, players)` returns `{ ok: true }` / `{ ok: false, reasons }` with the game's reasons unchanged; (b) `Game.evaluate(rounds, players)` returns `roundScores` in round order, `totals`, and `winners`, and calls the game's functions in the order validate → score → totals → winners; (c) `evaluate` returns `{ ok: false, roundIndex, reasons }` for the first invalid stored round; (d) with zero rounds, `winners` contains every player (FR-004); (e) `defineGame` throws for: non-integer `minPlayers`/`maxPlayers`, `minPlayers < 1`, `minPlayers > maxPlayers`, an id that is not kebab-case; (f) `evaluate` throws (programming error, FR-009a) when `scoreRound` or `computeTotals` returns a score that is not a finite integer, omits a player of the match, or includes an id not in the match (FR-001a); (g) `validateRound` and `evaluate` throw (programming error, FR-009a) when the game returns `{ ok: false, reasons: [] }` — FR-003 requires at least one reason
- [X] T003 Implement `src/shell/game/contract.ts` per [contracts/game-contract.md](./contracts/game-contract.md): types `PlayerRef = { id: string; name: string }`, `Scores = Readonly<Record<string, number>>`, `RoundRejection = { code: string; message: string }`, `RoundValidation<R>`, `GameDefinition<R>`, `Game`, `Evaluation`; and `defineGame<R>(definition): Game`, which closes over `R` (research D2 — no `any`, no bivariant method syntax, no casts), validates the static fields once (integers, `1 ≤ minPlayers ≤ maxPlayers`, id matching `/^[a-z0-9]+(-[a-z0-9]+)*$/`), throws when a game rejects with an empty `reasons` list, and exposes `validateRound` and `evaluate`. Make T002 pass
- [X] T004 [P] Write `src/games/registry.test.ts` (expected to fail until T005): `createRegistry([a, b]).list()` returns `[a, b]` in registration order; `get(id)` returns the game; `get('unknown')` returns `undefined` (FR-009); `createRegistry` throws on two games with the same id (FR-007, FR-009a); the exported production `registry.list()` is empty in this phase (research D8)
- [X] T005 Implement `src/games/registry.ts`: `createRegistry(games: readonly Game[]): Registry` with `list()` and `get(id)`, and `export const registry = createRegistry([])`. This file is the only place allowed to compare game ids (research D8). Import `Game`/`Registry` types from `src/shell/game/contract.ts` (define `Registry` there so the shell does not import from `src/games/` for a type). Make T004 pass
- [X] T006 [P] Write `tests/fixtures/games/highest-wins/rules.ts` and `tests/fixtures/games/highest-wins/rules.test.ts`: round input `{ ranks: Record<playerId, number> }` — each player's finishing place `1..n` (`n` = number of players), where **shared places are allowed** (two players tied for 2nd both get rank 2); `validateRound` rejects (with codes and Portuguese messages) a non-object input (`not_an_object`), a missing player (`missing_player`), an extra player id (`unknown_player`), a rank outside `1..n` (`rank_out_of_range`), and a non-integer rank (`invalid_rank`); `scoreRound` gives `(n - rank + 1) * 10` points; `computeTotals` sums; `resolveWinners` returns every player with the highest total. Tests cover, for **each** of the four functions, a normal case, an edge case, and a tie as defined in SC-002 ("equal claims for `validateRound`, equal round points for `scoreRound`, equal totals for `computeTotals`, several winners for `resolveWinners`"): the `validateRound` tie accepts two players sharing a rank; the `scoreRound` tie gives them equal points (constitution Principle III — every function has a real tie test)
- [X] T007 [P] Write `tests/fixtures/games/lowest-wins/rules.ts` and `tests/fixtures/games/lowest-wins/rules.test.ts`: round input `{ points: Record<playerId, number> }`, free integer per player, negatives allowed (FR-001a); `validateRound` rejects a non-object input, a missing player, an extra player id, and a non-integer or non-finite value; `scoreRound` returns the points as entered; `computeTotals` sums; `resolveWinners` returns every player with the **lowest** total (FR-006). Same per-function normal / edge / tie coverage as T006 (SC-002)
- [X] T008 Write `tests/fixtures/games/highest-wins/index.ts` and `tests/fixtures/games/lowest-wins/index.ts` exporting `defineGame` results: `highest-wins` with `name: 'Maior Vence'`, `minPlayers: 2`, `maxPlayers: 4`; `lowest-wins` with `name: 'Menor Vence'`, `minPlayers: 3`, `maxPlayers: 6` (research D8 — different limits, input shapes, and winner direction). Add `tests/fixtures/games/registry.ts` exporting `testRegistry = createRegistry([highestWins, lowestWins])` for the story tests

**Checkpoint**: contract, registry, and fixture rules exist and are tested.
`pnpm test && pnpm typecheck && pnpm lint` green.

---

## Phase 3: User Story 1 — A game plugs in without touching the shell (P1) 🎯 MVP

**Goal**: two different games run a full match through the same shell
operations, and no shell file names either game.

**Independent Test**: `tests/two-games.test.ts` plays one complete match per
fixture game with the same calls; `tests/shell-boundary.test.ts` fails if a
shell file names or imports a game.

### Tests for User Story 1

- [X] T009 [P] [US1] Write `tests/shell-boundary.test.ts` (SC-005, FR-010, research D7): recursively list every `.ts`, `.tsx`, `.astro`, `.js`, `.mjs` file under `src/` **outside** `src/games/`; fail, naming the file and line, when a file (a) imports or re-exports from a path that resolves into `src/games/` other than `src/games/registry` (match both relative paths like `../../games/x` and any alias), or (b) contains an equality or inequality against a game id or a `switch` on one — at least the patterns `gameId ===`, `=== gameId`, `gameId !==`, `!== gameId`, `.gameId ===`, `game.id ===`, `=== game.id`, `switch (gameId)`, `switch (match.gameId)`, `switch (game.id)`. Also assert the test finds at least one file to scan, so it cannot pass vacuously. Finally (FR-001), for every folder under `src/games/` and `tests/fixtures/games/` that contains an `index.ts`, import it and assert the exported game's `id` equals the folder name
- [X] T010 [P] [US1] Write `src/shell/match/match.test.ts` covering the lifecycle operations of this story (expected to fail until T012–T013), with an injected counter for `createId`: `createMatch` (rejects unknown id with `game_not_found`); `addPlayer` (rejects with `roster_full` at the game's maximum, `blank_name` for only spaces, `name_too_long` above 30 Unicode code points after trimming, `invalid_name` for control characters, `duplicate_name` ignoring case but not accents — "Ana" equals "ana", "José" differs from "Jose"; stores the trimmed name exactly as typed); `renamePlayer` in `setting_up` and `in_progress`, `invalid_status` once finished, renaming to own name or a case variant allowed (FR-022); `removePlayer` only in `setting_up`; `start` rejects `roster_too_small` / `roster_too_large` (FR-014); `confirmRound` validates through the game and returns `invalid_round` with the game's reasons unchanged (FR-015); `finish`; `createRematch` produces `setting_up` with same game, same player names and order, no rounds (FR-017a); `discardMatch`; `createMatch` while `setting_up` or `in_progress` fails with `match_in_progress` and succeeds when finished (FR-011a); every operation in a state not allowed by the [data-model table](./data-model.md#state-transitions) fails with `invalid_status`, and with no match fails with `no_match`; a failed operation returns the input match unchanged (same reference)
- [X] T011 [P] [US1] Write `tests/two-games.test.ts` (User Story 1 acceptance 1–4, SC-001): using `testRegistry`, assert `list()` returns both fixture games with name and limits in registration order; then play one full match per game — create, add players within limits, start, confirm three valid rounds, finish — using **identical** calls on the match operations, and check totals and winners against values computed by hand in the test; assert a game id that is not registered is rejected with `game_not_found`

### Implementation for User Story 1

- [X] T012 [US1] Create `src/shell/match/types.ts` with `Player = { id: string; name: string }`, `MatchStatus = 'setting_up' | 'in_progress' | 'finished'`, `Match = { gameId: string; status: MatchStatus; players: readonly Player[]; rounds: readonly unknown[]; draft?: unknown }`, `MatchError` (the union from [contracts/match-store.md](./contracts/match-store.md)), and `MatchResult = { ok: true; match: Match } | { ok: false; error: MatchError }` — data-model constraints quoted in doc comments: name "Trimmed; not blank; ≤ 30 Unicode code points; no control characters; unique in the match ignoring case, not accents; stored as typed"; status "Explicit; never inferred from rounds"
- [X] T013 [US1] Implement in `src/shell/match/match.ts` the pure operations `createMatch`, `addPlayer`, `renamePlayer`, `removePlayer`, `start`, `confirmRound`, `finish`, `createRematch`, `discardMatch` with signature `(match | null, ...args, context: { registry: Registry; createId: () => string }) → MatchResult` (or `null` result for discard), following the allowed-state table and error codes in [data-model.md](./data-model.md#state-transitions). Name rules per FR-022 / research D9: trim; reject blank; reject more than 30 Unicode code points (count with `[...name].length`, not `.length`); reject `/[\p{Cc}]/u`; uniqueness via `localeCompare(other, 'pt-BR', { sensitivity: 'accent' }) === 0`, excluding the player being renamed. `confirmRound` runs `game.validateRound(input, match.players)` against the current roster and clears `draft` on success, keeps it on rejection (FR-015a). Never mutate inputs. Make T010 and T011 pass
- [X] T014 [US1] Run `tests/shell-boundary.test.ts` against the new `src/shell/` files and confirm it passes; then temporarily add `import '../../games/does-not-matter';` to `src/shell/match/match.ts`, confirm the test fails naming that file, and revert (quickstart §2)

**Checkpoint**: US1 delivered — two games, same shell, boundary enforced.

---

## Phase 4: User Story 2 — A match survives a closed tab (P1)

**Goal**: every mutation is persisted before it is reported complete, including
the draft round; reopening restores the match exactly; other tabs stay in sync.

**Independent Test**: `src/shell/match/store.test.ts` drives every operation,
re-creates the store from the same storage after each one, and compares state.

### Tests for User Story 2

- [X] T015 [P] [US2] Write `src/shell/match/persistence.test.ts` (happy path only; discard cases are US5): `serializeState({ schemaVersion: 1, match })` round-trips through `parsePersistedState(raw, registry)` to a structurally equal match, including `draft`; `parsePersistedState(null, registry)` returns the initial state (`match: null`) with no notice; the key constant equals `'facillit-games:state'` (FR-023); `safeStorage()` returns `null` instead of throwing when `globalThis.localStorage` is missing or its getter throws (FR-024)
- [X] T016 [P] [US2] Write `src/shell/match/store.test.ts` (expected to fail until T017–T019), with an in-memory `StorageLike` fake and a fake event target: (a) after **each** operation of FR-013, a new store created from the same storage returns a match structurally equal to the previous store's — status, player ids, rounds, and draft (SC-003); (b) storage is written **before** `getState()` changes and before subscribers run (FR-018 — assert with a fake whose `setItem` records the store's state at call time); (c) `updateDraft` persists the draft; a non-serializable draft (e.g. containing a function or a `BigInt`) fails with `invalid_draft` and changes nothing (FR-018a); (d) when `setItem` throws, the operation returns `{ ok: true, persisted: false }`, `getState()` advances, storage still holds the last good state, and the next operation with a working `setItem` writes the full current state (FR-021); (e) a failed operation writes nothing and does not notify; (f) `getState()` returns the same object between operations; (g) creating the store with no storage available (`storage` absent and no `localStorage`) yields `getState() === null` without throwing (FR-024); (h) tab sync (FR-021a): dispatching a `storage` event for the key with a valid new value replaces the state and notifies **without** calling `setItem`; an event for another key is ignored; `dispose()` removes the listener

### Implementation for User Story 2

- [X] T017 [US2] Implement the happy path of `src/shell/match/persistence.ts`: `STORAGE_KEY = 'facillit-games:state'`, `type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>`, `safeStorage(): StorageLike | null` (wraps access to `globalThis.localStorage` in `try/catch` — research D6), `serializeState(match: Match | null): string` producing `{ "schemaVersion": 1, "match": ... }`, and `parsePersistedState(raw: string | null, registry: Registry): { match: Match | null; notice: DiscardNotice | null }` with a single `switch (schemaVersion)` point for future migrations. Full shape validation is T027; here, return the parsed match for a well-formed envelope. Make T015 pass
- [X] T018 [US2] Add `updateDraft(match, draft, context)` to `src/shell/match/match.ts`: allowed only in `in_progress`; reject with `invalid_draft` when `JSON.stringify` throws or the value does not survive a `JSON.parse(JSON.stringify(x))` round trip unchanged (functions, `undefined`, `BigInt`, non-finite numbers) (FR-018a)
- [X] T019 [US2] Implement `src/shell/match/store.ts` per [contracts/match-store.md](./contracts/match-store.md): `createMatchStore({ registry, storage?, createId?, events? })` — defaults `safeStorage()`, `() => crypto.randomUUID()`, and `globalThis.window` if present; load once through `parsePersistedState`; one method per operation that runs the pure function, then on success **writes first** (catching write errors into `persisted: false`), then swaps the state object, then notifies subscribers (research D4); `getState()` returns a `MatchView { match, game, evaluation }` built once per change from `game.evaluate`, or `null`; `subscribe` returns an unsubscribe function; listen to `storage` events filtered by `STORAGE_KEY`, re-parse, replace state, notify, never write back (research D10); `dispose()` removes the listener. Make T016 pass

**Checkpoint**: US2 delivered — persistence on every mutation, reload-safe,
tab-synced.

---

## Phase 5: User Story 3 — Scores are always right, ties included (P1)

**Goal**: totals and winners are always derived from confirmed rounds through
the game's rule; ties produce several winners.

**Independent Test**: the fixture `rules.test.ts` files (Phase 2) plus a
long-match test against independently computed totals.

### Tests for User Story 3

- [X] T020 [P] [US3] Add to `tests/two-games.test.ts` a 20-round, 7-player match on a store with in-memory storage, using a third game defined in the test with `defineGame({ id: 'lowest-wins-seven', name: 'Menor Vence (7)', minPlayers: 2, maxPlayers: 7, ...lowest-wins rule functions })` (the fixtures' limits stop below 7) and a store whose registry is `createRegistry([lowestWinsSeven])`: after every confirmed round, compare `getState().evaluation.totals` with totals computed independently in the test by summing the raw inputs (SC-007); also assert that the persisted JSON contains no `totals` or `winners` field (FR-016)
- [X] T021 [P] [US3] Add to `src/shell/match/store.test.ts`: a finished match with two players tied for the best total exposes both in `evaluation.winners` (US3 acceptance 3); finishing with zero rounds makes every player a winner (spec Edge Cases, FR-004); an `invalid_round` result carries the game's `reasons` array unchanged, code and Portuguese message included (US3 acceptance 1)

### Implementation for User Story 3

- [X] T022 [US3] Fix whatever T020–T021 expose in `src/shell/match/store.ts` or `src/shell/game/contract.ts`; if both pass on first run, record that in the PR description instead of changing code. Do not add any stored total or cached winner (FR-016)

**Checkpoint**: US3 delivered — totals cannot drift; ties are normal.

---

## Phase 6: User Story 4 — A wrong round can be fixed (P2)

**Goal**: any confirmed round can be replaced, and the last one removed, before
the match ends.

**Independent Test**: record three rounds, replace the second, remove the third,
check totals and persisted state after each step.

### Tests for User Story 4

- [X] T023 [P] [US4] Add to `src/shell/match/match.test.ts`: `replaceRound(match, index, input)` with a zero-based `index` replaces only that round (US4 acceptance 1); an invalid replacement returns `invalid_round` with the game's reasons and leaves the original (acceptance 2); an index `< 0`, `>= rounds.length`, or non-integer fails with `round_not_found`; `removeLastRound` drops only the last round (acceptance 3) and fails with `round_not_found` when there are no rounds; both leave `draft` untouched (FR-015a); both fail with `invalid_status` outside `in_progress`
- [X] T024 [P] [US4] Add to `src/shell/match/store.test.ts`: after `replaceRound` and after `removeLastRound`, `evaluation.totals` reflects the change and a store re-created from the same storage returns the same rounds (SC-003)

### Implementation for User Story 4

- [X] T025 [US4] Implement `replaceRound` and `removeLastRound` in `src/shell/match/match.ts` (validation through `game.validateRound` against the current roster, as in T013) and expose them as store methods in `src/shell/match/store.ts`. Make T023 and T024 pass

**Checkpoint**: US4 delivered.

---

## Phase 7: User Story 5 — Corrupted or old data never breaks the app (P2)

**Goal**: every kind of bad stored data leads to the initial state, removes the
bad data, and exposes a one-time notice.

**Independent Test**: feed each kind of bad payload to the loader and to a new
store.

### Tests for User Story 5

- [X] T026 [P] [US5] Add to `src/shell/match/persistence.test.ts` one case per row of the [load validation table](./data-model.md#load-validation-order-fr-020), asserting the result `{ match: null, notice }` with the exact reason: invalid JSON → `unreadable`; JSON that is not an object, or lacks `schemaVersion`/`match` → `wrong_shape`; `schemaVersion: 0`, `2`, and `"1"` → `unsupported_version` (unknown and newer, SC-004); match with a bad status value, a missing field, a non-array `rounds`, duplicate player ids, a blank or 31-character name → `wrong_shape`; `gameId` not in the registry → `unknown_game`; a stored round the fixture's `validateRound` rejects → `invalid_round`. Also: a stored round stays valid after its player is renamed, because rounds reference player ids (FR-015); a draft of any JSON value is accepted without validation (FR-018a); `parsePersistedState` never throws for any of these
- [X] T027 [P] [US5] Add to `src/shell/match/store.test.ts`: for each reason above, a store created from that storage has `getState() === null`, `getDiscardNotice()` returns `{ reason }`, the key has been removed from storage (`removeItem` called), and after `acknowledgeDiscardNotice()` it returns `null`; a second store created from the now-clean storage has no notice (FR-020a, US5 acceptance 4); storage whose `getItem` throws yields the initial state with **no** notice (FR-020); a `storage` event carrying a bad value falls back to `null` state and exposes the notice (FR-021a)

### Implementation for User Story 5

- [X] T028 [US5] Complete `parsePersistedState` in `src/shell/match/persistence.ts` with the seven steps of the data-model table in order, using hand-written type guards on `unknown` (research D6 — no schema library, no casts): envelope shape, `schemaVersion === 1`, match fields and types, `status` in the three allowed values, players as `{ id: string; name: string }` with unique ids and names meeting FR-022, `rounds` an array, then `registry.get(gameId)`, then `game.evaluate(rounds, players)`. Export `type DiscardNotice = { reason: 'unreadable' | 'wrong_shape' | 'unsupported_version' | 'unknown_game' | 'invalid_round' }`. Make T026 pass
- [X] T029 [US5] In `src/shell/match/store.ts`, on a load (initial or from a `storage` event) that yields a notice: call `removeItem(STORAGE_KEY)` inside `try/catch`, keep the notice in memory only, and implement `getDiscardNotice()` / `acknowledgeDiscardNotice()` (research D11 — never persisted, no copy of the bad data). Make T027 pass

**Checkpoint**: all five stories delivered.

---

## Phase 8: Polish & cross-cutting concerns

- [X] T030 [P] Extend `tests/static-build.test.ts`: after the existing checks, read **every** file under `dist/` (recursively) and assert none contains `highest-wins`, `lowest-wins`, `Maior Vence`, or `Menor Vence` (SC-006, FR-025). Keep the existing `localStorage|schemaVersion|GameDefinition` assertion on `dist/index.html` unchanged — no page imports the shell yet (research, Carried over from spec 001)
- [X] T031 [P] Update `AGENTS.md`: add to "Known pitfalls" (a) "Adding a game: create `src/games/<id>/` with `index.ts`, `rules.ts`, `rules.test.ts`, then add one import and one entry in `src/games/registry.ts` — nothing else; `tests/shell-boundary.test.ts` fails otherwise", and (b) "Create the match store only inside a `client:only` island; it reads storage once at creation and listens to other tabs"
- [X] T032 [P] Update `README.md` § "Current state": the new application now has the game contract, registry, and persisted match store (`specs/002-game-contract/`), still with no game screens; link `contracts/game-contract.md` for whoever adds a game
- [X] T033 Run the [quickstart.md](./quickstart.md) validation end to end: §1 full pipeline (`pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check`), §2 boundary test bites (already exercised in T014 — repeat with `if (gameId === 'x') {}`), §3 `grep -rE "highest-wins|lowest-wins" dist/` prints nothing. State in the PR description that SC-001 is verified on the Phase 5 diff (quickstart §4), not in this phase. Record any divergence from the spec in the spec itself, in the same PR (Principle VIII)
- [X] T034 Review `src/shell/` and `tests/fixtures/` for Principle V and IX: `grep -rnE "\bany\b|@ts-ignore|@ts-expect-error|\bas (unknown|string|number|boolean|any|[A-Z])" src/shell tests/fixtures` and review every hit by hand — none is allowed in `contract.ts`, `persistence.ts`, or any `rules.ts` (`as const` is not an assertion and is fine); `grep -rnE '[ãõçáéíóúâêôà]'` hits only game `name`, `RoundRejection.message` strings, and test names quoting player names like "José"

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup. Blocks every story.
- **US1 (Phase 3)**: after Foundational. Creates `match.ts` and `types.ts`,
  which every later story extends.
- **US2 (Phase 4)**: after US1 (needs the match operations to persist).
- **US3 (Phase 5)**: after US2 (its tests run on the store).
- **US4 (Phase 6)**: after US2 (store methods); independent of US3.
- **US5 (Phase 7)**: after US2 (extends `persistence.ts` and `store.ts`);
  independent of US3 and US4.
- **Polish (Phase 8)**: after all stories.

```text
T001 → T002 → T003 ─┬─ T004 → T005 ─┐
                    ├─ T006 ────────┼─ T008 → US1 → US2 ─┬─ US3
                    └─ T007 ────────┘                    ├─ US4
                                                         └─ US5 → Polish
```

### Within each story

Tests first (they must fail for the right reason), then types, then pure
operations, then the store. `match.ts` and `store.ts` are touched by several
stories, so story phases run in sequence even though they are independent in
behavior.

### Parallel opportunities

- Phase 2: T004, T006, T007 in parallel after T003.
- US1: T009, T010, T011 in parallel (three different test files).
- US2: T015, T016 in parallel.
- US3: T020, T021 in parallel.
- US4: T023, T024 in parallel.
- US5: T026, T027 in parallel.
- After US2, US3 / US4 / US5 test tasks can be written in parallel; their
  implementation tasks touch the same files and run in sequence.
- Polish: T030, T031, T032 in parallel.

## Parallel example: Phase 2

```text
Task: "Write src/games/registry.test.ts"                       (T004)
Task: "Write tests/fixtures/games/highest-wins/rules.ts + test" (T006)
Task: "Write tests/fixtures/games/lowest-wins/rules.ts + test"  (T007)
```

## Implementation Strategy

### MVP first (User Story 1)

1. Phase 1 → Phase 2 → Phase 3.
2. **Stop and validate**: two fixture games play a full match through the same
   operations, and the boundary test bites. This is the property the
   constitution exists to protect; everything after it is built on top.

### Incremental delivery

1. US1 → the contract holds.
2. US2 → persistence and tab sync; Phase 4 (screens) could start from here.
3. US3 → long-match correctness proof.
4. US4, US5 → editing and recovery.
5. Polish → artifact check, docs, quickstart.

One PR for the whole feature into `develop` (conventional commits per task
group, no AI attribution), since nothing here is user-visible until Phase 4.
