# Feature Specification: Game contract, registry, and persisted match

**Feature Branch**: `feature/game-contract`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "let's go to Phase 3" (translated from Portuguese).
Phase 3 is defined by spec 001 and its plan as the game contract: the
`GameDefinition` contract, the game registry, and the versioned persisted match
schema, with no screens (Phase 4) and no real game (Phase 5).

## Note on the reader of this spec

As in spec 001, the direct "user" of this feature is **whoever builds the
following phases**: Phase 4 (design system and shell screens) consumes the
match model, and Phase 5 (MECHE-MECHE) and every later game plug into the
contract. The end player sees no screen in this phase, but every rule decided
here shows up for them later as behavior: what survives a closed tab, how a tie
is announced, whether a wrong round can be fixed.

Contract names (`GameDefinition`, `validateRound`, `scoreRound`,
`computeTotals`, `resolveWinners`, `schemaVersion`, `status`) are not choices
of this spec: they are fixed by the constitution (Principles II, III, VII) and
used here as given.

## Clarifications

### Session 2026-11-02

- Q: Which games are planned beyond MECHE-MECHE? → A: none yet; validate the
  contract with two generic test games (highest wins / lowest wins).
- Q: How many matches can exist at once? → A: a single current match for the
  whole app.
- Q: What happens to a finished match? → A: no history; keep only the roster
  for a rematch, as in the POC.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A game plugs in without touching the shell (Priority: P1)

A developer adds a new game by creating its folder, declaring its rules through
the game contract, and registering it. The shell lists it, starts a match with
it, records rounds, shows totals, and announces winners — without a single line
of shell code changing.

**Why this priority**: this is the property the constitution exists to protect.
If the contract cannot carry a game without shell changes, every later phase
inherits the defect.

**Independent Test**: register two test-only games with deliberately different
rules (different player limits, different round input, one where the highest
total wins and one where the lowest wins). Both run a full match through the
same shell operations, and no shell file mentions either game.

**Acceptance Scenarios**:

1. **Given** a registry with two test games, **When** the list of available
   games is requested, **Then** both appear with their display name and player
   limits, in a stable order.
2. **Given** a new game folder registered in the registry, **When** the change
   is reviewed, **Then** the only file outside the game folder that changed is
   the registry.
3. **Given** a game whose round input differs from another game's, **When** a
   round is recorded for each, **Then** each game's own rule validates and
   scores it, and the shell treats both the same way.
4. **Given** an id that is not registered, **When** a match for it is
   requested, **Then** the request is rejected with a clear error instead of
   failing later.

---

### User Story 2 - A match survives a closed tab (Priority: P1)

Players are mid-match. The phone screen turns off, the browser discards the
tab, or someone closes it by mistake. When the app opens again, the match is
exactly where it was — including a round that was being filled in and not yet
confirmed.

**Why this priority**: this is the normal use of the app (phone on the table,
passed from hand to hand). The POC only saves when a round is closed and infers
"match in progress" from the number of rounds, so a half-filled round is lost
and a match with zero rounds looks like no match at all.

**Independent Test**: drive the match through each mutation (add player, rename,
start, fill part of a round, confirm a round, edit a round, finish), reload the
persisted state after each one, and compare it with the state before reload.

**Acceptance Scenarios**:

1. **Given** a match in progress with a partially filled round, **When** the
   app is reopened, **Then** the match, its confirmed rounds, and the partial
   round are restored exactly.
2. **Given** a match that has started but has no confirmed round, **When** the
   app is reopened, **Then** it is restored as a match in progress, not as the
   setup screen.
3. **Given** any change to the match, **When** the change completes, **Then**
   it is already persisted, with no separate "save" action.

---

### User Story 3 - Scores are always right, ties included (Priority: P1)

Each confirmed round is scored by the game's rule. Totals are always derived
from the recorded rounds, never kept as a separate running number that can
drift. When the match is finished, the winners are announced — and when two or
more players tie for first, all of them win.

**Why this priority**: a scorekeeper that shows a wrong total is worse than
paper. The POC keeps a running total on each player and recomputes it in two
different places.

**Independent Test**: each test game's rule functions are tested in isolation
with a normal case, an edge case, and a tie, with no screen and no storage
involved.

**Acceptance Scenarios**:

1. **Given** a round input the game rejects (e.g. two players claiming the same
   exclusive score), **When** it is confirmed, **Then** the round is not
   recorded and the game's reasons are returned so they can be shown.
2. **Given** three confirmed rounds, **When** totals are requested, **Then**
   they equal the sum the game's rule defines over those rounds, and nothing
   else.
3. **Given** two players tied for the best total, **When** the match is
   finished, **Then** both are returned as winners.
4. **Given** the same inputs, **When** a rule function runs twice, **Then** it
   returns the same result (no clock, randomness, or stored state involved).

---

### User Story 4 - A wrong round can be fixed (Priority: P2)

Someone records a round with the wrong points. Before the match ends, any
confirmed round can be corrected or the last one removed, and totals follow
immediately.

**Why this priority**: mistakes happen when the phone passes from hand to hand.
The POC offers no way to fix a confirmed round short of restarting the match.

**Independent Test**: record three rounds, edit the second, remove the third,
and check totals and persisted state after each step.

**Acceptance Scenarios**:

1. **Given** three confirmed rounds, **When** round 2 is replaced with a valid
   input, **Then** totals reflect the new round 2 and rounds 1 and 3 are
   unchanged.
2. **Given** a replacement input the game rejects, **When** it is confirmed,
   **Then** the original round stays as it was.
3. **Given** three confirmed rounds, **When** the last round is removed,
   **Then** two rounds remain and totals reflect only those two.

---

### User Story 5 - Corrupted or old data never breaks the app (Priority: P2)

Stored data can be from an older version of the app, from a game that no longer
exists, or simply corrupted. Opening the app in any of these cases leads to a
working initial state, never to a broken screen.

**Why this priority**: required by Principle VII, and the failure mode is
invisible until it hits a real phone.

**Independent Test**: feed the loader each kind of bad payload (not valid
data, wrong shape, unknown version, newer version, unknown game id, rounds that
the game's rule now rejects) and check that each one yields the initial state.

**Acceptance Scenarios**:

1. **Given** stored data that cannot be read, **When** the app opens, **Then**
   it starts from the initial state and the bad data is discarded.
2. **Given** stored data with an unknown version, **When** the app opens,
   **Then** it starts from the initial state.
3. **Given** a match stored for a game id that is no longer registered, **When**
   the app opens, **Then** that match is discarded and the rest of the app
   works.

---

### Edge Cases

- **Player count outside the game's limits**: starting a match with fewer
  players than the game's minimum, or adding a player beyond its maximum, is
  rejected. Limits belong to the game, not to the shell (the POC hard-codes 2
  to 7).
- **Duplicate or blank player names**: a blank name (only spaces) is rejected;
  names are trimmed. Two players with the same name are rejected, since the
  table and the winner announcement would be ambiguous.
- **Players change after the match starts**: adding, removing, or reordering
  players during a match is not allowed in this phase; the roster is fixed at
  start. Renaming is allowed.
- **Finishing a match with zero rounds**: allowed; every player has a total of
  zero and all of them are winners (a tie is a normal case).
- **Storage unavailable or full**: if a write fails, the in-memory match keeps
  working and the failure is reported so the screen can warn the player; the
  app does not crash.
- **The POC's stored data**: the POC's existing stored match is not read or
  migrated (see Assumptions).
- **Name casing**: names are kept exactly as typed (after trimming). The POC
  rewrites them to "Capitalized" form, which mangles names like "McDonald" or
  "de Souza".

## Requirements *(mandatory)*

### Functional Requirements

**Game contract**

- **FR-001**: Each game MUST declare, through the game contract: a unique id, a
  display name in Portuguese, a minimum and maximum number of players, and the
  four rule functions `validateRound`, `scoreRound`, `computeTotals`, and
  `resolveWinners`.
- **FR-002**: Each game MUST define its own round input shape. The shell MUST
  store and pass that input without interpreting it.
- **FR-003**: `validateRound` MUST return either acceptance or a list of
  reasons, so the screen can show them. It MUST NOT throw for invalid player
  input.
- **FR-004**: `resolveWinners` MUST return a list of players, which has more
  than one element on a tie.
- **FR-005**: The four rule functions MUST be pure: same input, same output; no
  reading of storage, screen, clock, or randomness. Any non-deterministic input
  MUST be passed in as a parameter.
- **FR-006**: The contract MUST support games where the lowest total wins, not
  only the highest — the decision lives in `resolveWinners`. No game beyond
  MECHE-MECHE is planned yet, so the contract is validated against the two
  generic test games of User Story 1 (highest total wins / lowest total wins,
  with different player limits and round input shapes).

**Registry**

- **FR-007**: There MUST be a single registry that lists all available games
  and resolves a game by id. It is the only place allowed to name a game.
- **FR-008**: Adding a game MUST require only creating its folder and adding it
  to the registry.
- **FR-009**: Requesting an unknown game id MUST produce an explicit "game not
  found" result, never an unhandled failure.
- **FR-010**: Shell code MUST NOT branch on a game's identity and MUST NOT
  import a game's folder directly. This MUST be checked automatically, so a
  violation fails the test suite.

**Match**

- **FR-011**: A match MUST record: the game id, the roster of players, the
  confirmed rounds with each round's input as entered, the round currently being
  filled in (if any), and an explicit status.
- **FR-011a**: There MUST be at most one current match for the whole app.
  Creating a match while another one is setting up or in progress MUST replace
  it only through an explicit discard; it MUST NOT be replaced silently.
- **FR-012**: Status MUST be one of: setting up, in progress, finished. Whether
  a match is in progress MUST be read from the status, never inferred from the
  number of rounds.
- **FR-013**: Supported operations: create a match for a game; add, rename, and
  remove players while setting up; start the match; update the round being
  filled in; confirm it; replace a confirmed round; remove the last confirmed
  round; finish the match; discard the match.
- **FR-014**: Starting MUST be rejected when the roster is outside the game's
  player limits. Adding a player MUST be rejected when the roster is at the
  game's maximum.
- **FR-015**: Confirming or replacing a round MUST run the game's
  `validateRound` first. An invalid round MUST NOT change the match.
- **FR-016**: Totals and winners MUST always be computed from the confirmed
  rounds through the game's rule. They MUST NOT be stored as an independent
  value.
- **FR-017**: Finishing MUST set the status to finished and make the winners
  available. A finished match MUST NOT accept round changes.
- **FR-017a**: There is no match history. A finished match stays available
  (with its winners) until a new match is created or it is discarded. Creating a
  rematch for the same game MUST be able to reuse the finished match's roster
  (same names, same order), with no rounds.

**Persistence**

- **FR-018**: Every successful mutation of the match MUST be persisted before
  the operation is reported as complete, including updates to the round being
  filled in.
- **FR-019**: All persisted data MUST carry a schema version, starting at 1.
- **FR-020**: Loading MUST degrade safely: unreadable data, a wrong shape, an
  unknown or newer version, an unregistered game id, or stored rounds that the
  game's `validateRound` now rejects MUST result in discarding that data and
  returning to the initial state, without breaking the app.
- **FR-021**: A failed write MUST NOT lose the in-memory state or crash the
  app, and MUST be reported to the caller.
- **FR-022**: Player names MUST be trimmed, MUST NOT be blank, MUST be unique
  within a match (case-insensitive), and MUST be stored exactly as typed
  otherwise.
- **FR-023**: Every key written to browser storage MUST belong to a namespace
  of this app, so it cannot collide with the POC's key or other apps on the same
  origin.

**Guards**

- **FR-024**: The match state MUST only be read in the browser. The existing
  build-time guard (the test that asserts the client-only island does not
  render at build time) MUST keep passing.
- **FR-025**: This phase MUST NOT ship any user-visible screen or any real game.
  The test games of User Story 1 exist only in the test suite and MUST NOT be
  in the built artifact.

### Key Entities

- **Game definition**: what a game declares — id, display name, player limits,
  and its four rule functions. Owns the shape of its round input.
- **Registry**: the list of available game definitions, resolvable by id.
- **Player**: a participant in a match — a stable identifier and a display
  name. Identity does not depend on name or position, so renaming never moves
  points between players.
- **Round**: one confirmed round — the game-specific input exactly as entered.
  Its score is derived, not stored.
- **Draft round**: the round being filled in, not yet validated. Persisted so a
  closed tab does not lose it.
- **Match**: the single current match — a game id, players, confirmed rounds, an optional draft round, and
  a status (setting up, in progress, finished).
- **Persisted state**: the stored envelope — schema version plus the match
  data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a second game requires changes to zero shell files: in the
  change that adds it, the only file outside its own folder is the registry.
- **SC-002**: 100% of the rule functions of every game in the suite have tests
  covering a normal case, an edge case, and a tie.
- **SC-003**: After each of the operations in FR-013, reloading the persisted
  state yields a match identical to the one before reload — 0 differences.
- **SC-004**: For each of the 6 kinds of bad stored data in FR-020, opening the
  app reaches the initial state in 100% of attempts, with no unhandled error.
- **SC-005**: An automated check fails when a shell file names a game or
  imports a game folder directly.
- **SC-006**: The built artifact contains no test game and no user-visible
  screen beyond what Phase 2 shipped.
- **SC-007**: Totals computed for a 20-round, 7-player match are correct on
  every recomputation, with no stored total to drift.

## Assumptions

- **No migration from the POC.** The POC is on a different host (GitHub Pages)
  from the new app (Vercel), and browser storage is per origin, so the new app
  cannot read the POC's data even if it tried. This is recorded as the explicit
  "discard old data" decision Principle VII allows. If the cutover keeps the
  same origin, this assumption must be revisited in the Phase 6 spec.
- **The roster is fixed once the match starts.** The POC allows player changes
  only before starting too. Mid-match roster changes are out of scope.
- **Finishing is a manual action.** No game ends a match on its own in this
  phase (e.g. "first to 500"); a game that needs it can extend the contract in
  its own spec.
- **Round inputs are kept, not just their scores.** This is what makes editing
  a round possible and keeps totals derivable.
- **Phase boundaries.** Screens, design tokens, and the decision to remove the
  probe island belong to Phase 4. MECHE-MECHE's rules belong to Phase 5. This
  spec only guarantees that both fit.
- **No history.** Past matches are not kept; only the roster can be reused for
  a rematch. A history screen would need its own spec.
- **Single device.** No sync between devices; this is client-side only by
  principle.
