# Research: Game contract, registry, and persisted match

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

The Technical Context has no open unknowns: the stack is fixed by the
constitution and was proven in spec 001. What this phase has to decide is
**shape**: how a game with its own round type fits a shell that cannot know that
type, how state is stored and read back safely, and how the "a game is a
plugin" rule is enforced by a test instead of by memory.

Each decision below lists what was chosen, why, and what was rejected.

---

## Decision 1 — `validateRound` parses `unknown` into the game's round type

**Decision**: a game is written against its own round type `R`, but
`validateRound` receives `unknown` and returns either `{ ok: true, round: R }`
or `{ ok: false, reasons }`. It is the only door through which a value becomes
an `R`.

**Rationale**:

- The same input arrives from two untrusted places: the screen (Phase 4) and
  storage (FR-020, "stored rounds that the game's `validateRound` now rejects").
  One function covering both means one place to test and no second parser that
  can drift from the first.
- It keeps `any` out of the contract (Principle V) without casts: the shell
  holds values as `unknown`, and only the game's own function narrows them.
- `scoreRound`, `computeTotals`, and `resolveWinners` still receive typed
  values, so the game's rule code reads naturally.

**Alternatives considered**:

- **`validateRound(input: R)` plus a separate `isRoundInput(value): value is R`
  guard.** Rejected: two functions that must agree on what a valid round is.
  The guard would accept a shape that `validateRound` then rejects, and storage
  loading would need both.
- **A schema library (e.g. zod) declared per game.** Rejected for now: a new
  dependency for what each game does in a few lines, and the generic test games
  have trivial inputs. Worth revisiting if a real game's input becomes complex.

---

## Decision 2 — `defineGame` erases the round type for the shell

**Decision**: games export `defineGame<R>({ ... })`. It returns a `Game` — a
shell-facing object with no type parameter, whose functions take and return
`unknown` rounds and closed result types. The registry holds `Game[]`.

The erased `Game` exposes what the shell actually needs, not the four raw
functions:

- `validateRound(input: unknown, players)` → ok / reasons
- `evaluate(rounds: unknown[], players)` → per-round scores, totals, winners;
  or a rejection if any stored round is no longer valid

`evaluate` runs `validateRound` → `scoreRound` → `computeTotals` →
`resolveWinners` in that order, inside the closure where `R` is still known.

**Rationale**:

- A registry of heterogeneous games needs one common type. `GameDefinition<any>`
  is forbidden by Principle V. `GameDefinition<unknown>` does not accept a
  `GameDefinition<R>` under `strictFunctionTypes` (parameters are
  contravariant).
- Closing over `R` inside `defineGame` is the standard existential-type pattern
  in TypeScript: no casts, no `any`, and the compiler still checks each game
  against its own `R`.
- The shell never orchestrates rule calls itself, so it cannot call them in the
  wrong order or skip validation (FR-015, FR-016).

**Alternatives considered**:

- **Method syntax in the interface to get bivariant parameters.** Rejected: it
  makes `GameDefinition<unknown>` accept anything by silencing exactly the
  check that should catch a mismatch. It is a loophole, not a design.
- **Shell calls the four functions directly with `unknown` everywhere.**
  Rejected: every game would have to accept `unknown` in all four functions and
  re-validate, turning pure scoring code into defensive parsing.

---

## Decision 3 — Rule results are values, not exceptions

**Decision**: every operation that can fail for a user reason returns a
discriminated union `{ ok: true, ... } | { ok: false, error }`. Error codes are
English identifiers (`roster_too_small`, `duplicate_name`, ...). The only
user-facing text in this phase is the game's `validateRound` reasons, which
carry a Portuguese `message` because the shell cannot write copy about a game
it does not know.

One shell-written reason exists: when a round input cannot be stored as JSON
(e.g. it contains a function or a `BigInt`), `confirmRound`/`replaceRound`
return `invalid_round` with the reason `{ code: 'not_serializable', message:
'Rodada em formato inválido.' }` before the game is asked. It is generic — it
names no game — and keeps what is in memory identical to what is persisted
(SC-003). Found during implementation.

**Rationale**:

- FR-003 forbids throwing for invalid input; the same reasoning applies to
  every shell operation. Phase 4 needs to render the reason, not catch it.
- Splitting code (English, stable, for logic) from message (Portuguese, for the
  player) follows Principle IX: shell error codes are mapped to copy by the
  screens in Phase 4; game reasons arrive already written by the game.

**Alternatives considered**:

- **Throwing typed errors.** Rejected: easy to forget a `catch`, invisible in
  the type of the function, and an uncaught throw breaks the screen —
  precisely what FR-020/FR-021 forbid.
- **Reasons as codes only, mapped to copy by the shell.** Rejected: the shell
  would need a per-game message table, which is naming a game in the shell
  (Principle II).

---

## Decision 4 — Match operations are pure; the store is a thin effectful wrapper

**Decision**: two layers.

1. `match.ts` — pure functions `(match, ..., context) → Result<Match>` for
   every operation in FR-013. Player id generation comes in through `context`.
2. `store.ts` — `createMatchStore({ storage, registry, createId })` holds the
   current match, applies an operation, **writes it**, then updates memory and
   notifies subscribers. It exposes `getState`, `subscribe`, and one method per
   operation.

**Rationale**:

- The pure layer is where the bugs live, and it is tested without storage,
  clock, or DOM — the same discipline Principle III asks of rules.
- Persist-then-commit gives FR-018 ("persisted before reported complete") by
  construction. If the write fails, memory still advances and the result says
  `persisted: false` (FR-021): losing the player's input in memory to protect a
  write that already failed would be the worse outcome.
- `subscribe` / `getState` is the shape `useSyncExternalStore` expects, so
  Phase 4 can read the store from a `client:only` island with no adapter. It is
  a few lines and the one consumer is already known.

**Alternatives considered**:

- **A state library (Zustand, nanostores).** Rejected: one store with one
  value; the subscription logic is ~10 lines. A dependency would also have to
  be justified against the fixed stack.
- **Store does not persist; the screen calls `save()`.** Rejected: it makes
  FR-018 depend on every future screen remembering to save — the POC's exact
  failure.

---

## Decision 5 — Player ids are injected, not generated inside rules

**Decision**: players get an opaque string id when added. The store generates
it with `crypto.randomUUID()` by default; tests inject a counter. Pure match
functions receive `createId` through their context argument.

**Rationale**: renaming must never move points (spec, Key Entities — Player).
The POC indexes rounds by player position, so removing a player shifts every
later score. An id that does not depend on name or position fixes that.
Randomness enters as a parameter, as Principle III requires of rules and as
good practice requires of the shell.

**Alternatives considered**: **position as identity** (POC) — rejected for the
reason above; **name as identity** — rejected, renames would break history.

---

## Decision 6 — Persistence: one namespaced key, one versioned envelope, hand-written parser

**Decision**:

- One key: `facillit-games:state` (FR-023). The POC used `mechemeche_data`, so
  there is no collision.
- Value: `{ "schemaVersion": 1, "match": Match | null }` (FR-019).
- Reading goes through `parsePersistedState(raw: string | null, registry)`,
  which returns a valid state or the initial state. It never throws.
- Storage is injected as `Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>`.
  Access to `globalThis.localStorage` itself is wrapped, because merely reading
  the property throws in some private-mode browsers.

The six discard cases of FR-020 map to checks in this order: unreadable JSON →
wrong envelope shape → unknown or newer `schemaVersion` → wrong match shape →
unregistered game id → `game.evaluate` rejects a stored round.

**Rationale**:

- A single envelope is enough: there is one current match (FR-011a) and no
  history (FR-017a). More keys would mean more partial-write states to reason
  about.
- A hand-written parser for a schema of five fields is short, has no
  dependency, and is fully covered by the six cases above. The
  `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` guards from spec
  001 make the compiler check it.
- Version 1 has no predecessor, so there is no migration yet. The parser has a
  single `switch (schemaVersion)` point where a future migration goes.

**Alternatives considered**:

- **Key per game or per match.** Rejected by FR-011a: one current match.
- **zod / valibot.** Same reasoning as Decision 1: worth it when the schema
  grows, not for five fields.
- **IndexedDB.** Rejected: Principle I names `localStorage`, and the data is a
  few KB.

---

## Decision 7 — The shell/game boundary is a test that reads source files

**Decision**: `tests/shell-boundary.test.ts` lists every source file under
`src/` outside `src/games/`, and fails if any of them:

1. imports from `src/games/` other than `src/games/registry` (Principle II:
   "only the registry resolves games");
2. compares or switches on a game id (`gameId ===`, `game.id ===`,
   `switch (gameId)`, and the mirrored `=== gameId` forms).

**Rationale**: SC-005 asks for an automated check, and Phase 2's experience
(research.md 001, Decision 7) is that documentation does not prevent
regressions — a failing test does. A test in the existing Vitest suite costs no
new tool and runs in CI with everything else.

**Alternatives considered**:

- **ESLint `no-restricted-imports`.** Good for the import half, and gives editor
  feedback, but cannot express the id-comparison half. Not added for now: the
  test covers both and one mechanism is enough. Can be added later as a
  convenience without changing the rule.
- **Lint rule forbidding `client:load` on components that import the store**
  (deferred in spec 001, research Decision 7). **Still deferred**: this phase
  creates the store but no component imports it, so the rule would have no
  target to be tested against. Phase 4 creates the first such component and
  is the right place.

---

## Decision 8 — Test games live in `tests/fixtures/games/`, the production registry is empty

**Decision**: the two generic games required by the clarification (FR-006) —
`highest-wins` and `lowest-wins` — live in `tests/fixtures/games/<id>/`, with
`rules.ts` and `rules.test.ts` side by side as Principle III asks. Tests build
their own registry with `createRegistry([highestWins, lowestWins])`.
`src/games/registry.ts` holds both `createRegistry` and the production
`registry = createRegistry([])` for this phase.

`createRegistry` lives in the registry file, not in the shell, because lookup
by id is a comparison on game identity — allowed only inside the registry
(Principle II). The shell receives a `Registry` object and only calls
`registry.list()` and `registry.get(id)`.

**Rationale**:

- FR-025 / SC-006: no test game in the built artifact. Anything under `src/`
  that the registry imports would ship.
- The two fixtures are chosen to break a contract built around one game: they
  differ in player limits (2–4 vs 3–6), round input shape (a finishing place
  per player, shared places allowed, vs a free number per player), and winner direction.
- An empty production registry is honest: the first real game is Phase 5. The
  registry file still exists so Phase 5's diff is "add a folder, add one line
  here" (SC-001).

**Alternatives considered**: **ship one demo game under `src/games/`** —
rejected by FR-025; **one fixture game only** — rejected, a single game cannot
show that the contract is not shaped around it.

---

## Decision 9 — Player names: trimmed, case-insensitive unique, stored as typed

**Decision**: names are trimmed; blank is rejected; uniqueness compares with
`localeCompare(other, 'pt-BR', { sensitivity: 'accent' })`, which ignores case
but not accents ("Ana" = "ana", "José" ≠ "Jose"). The stored name is the
trimmed text exactly as typed.

**Rationale**: FR-022. Ignoring accents would reject two real, different names
in Portuguese; ignoring case avoids "Ana" and "ana" side by side in the table.

---

## Decision 10 — Tab sync through the `storage` event

**Decision**: the store subscribes to `window`'s `storage` event, filtered by
its key. On an event it re-parses the new value through the same load
validation (D6), replaces its in-memory state, and notifies subscribers. It
does not write in response. `dispose()` removes the listener.

**Rationale**: the browser fires `storage` in every other same-origin tab when
one tab writes, so sync costs one listener and reuses the loader — no new
mechanism, no dependency (FR-021a). Not writing back avoids ping-pong between
tabs. "Last write wins" on truly simultaneous edits is acceptable for a game
table, where two people editing the same match at the same instant is not the
normal case.

**Alternatives considered**:

- **`BroadcastChannel`.** Rejected: it would duplicate what `storage` already
  delivers, and still needs the storage value as the source of truth.
- **Single-tab lock (Web Locks API or a heartbeat key).** Rejected in the
  clarification: it punishes the legitimate case of reopening the app in a new
  tab while an old one is still around.

## Decision 11 — The discard notice lives in memory only

**Decision**: when load validation discards data, the store keeps a
`DiscardNotice` with a reason code in memory and exposes it until
`acknowledgeDiscardNotice()` is called. It is never written to storage, and no
copy of the bad data is kept (FR-020a).

**Rationale**: the notice is about *this* opening of the app. Persisting it
would show it again after a reload even though the storage is now clean.
Keeping the bad payload would need a second key and a cleanup rule for a case
with no recovery path the player could use.

## Carried over from spec 001

- `tests/static-build.test.ts` keeps asserting that `dist/index.html` does not
  contain `localStorage`, `schemaVersion`, or `GameDefinition`. It keeps
  passing in this phase because no page imports the shell yet. Phase 4 must
  revisit that assertion when a page does, and keep the client-only check.
