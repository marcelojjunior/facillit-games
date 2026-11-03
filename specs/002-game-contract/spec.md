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
- Q: What happens when the app is open in two tabs and both change the same
  match? → A: keep tabs in sync — when one tab saves, the others reload the
  match immediately; on truly simultaneous edits the last write wins.
- Q: Should the player be told when stored data had to be discarded? → A: yes —
  discard safely and expose a one-time notice with a reason code; the screen
  shows it once.

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
4. **Given** any of the discard cases above, **When** the app opens, **Then**
   a one-time notice with the discard reason is available to show the player,
   and after it is acknowledged it does not come back.

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
- **Two tabs open on the same match**: a save in one tab is picked up by the
  others immediately (FR-021a), so a forgotten background tab cannot later
  overwrite newer rounds with its stale copy.
- **The POC's stored data**: the POC's existing stored match is not read or
  migrated (see Assumptions).
- **Name casing**: names are kept exactly as typed (after trimming). The POC
  rewrites them to "Capitalized" form, which mangles names like "McDonald" or
  "de Souza".

## Requirements *(mandatory)*

### Functional Requirements

**Game contract**

- **FR-001**: Each game MUST declare, through the game contract: a unique id
  (kebab-case, equal to its folder name), a display name in Portuguese, a
  minimum and maximum number of players (integers, `1 ≤ minimum ≤ maximum`;
  a single-player game is allowed by the contract), and the four rule functions
  `validateRound`, `scoreRound`, `computeTotals`, and `resolveWinners`.
- **FR-001a**: Every score a game produces (per round or total) MUST be a
  finite integer; negative values are allowed. `scoreRound` and
  `computeTotals` MUST return exactly one score for each player of the match,
  and no other.
- **FR-002**: Each game MUST define its own round input shape. The shell MUST
  store and pass that input without interpreting it.
- **FR-003**: `validateRound` MUST return either acceptance or a non-empty list
  of reasons, so the screen can show them. Each reason MUST carry a stable
  English code and a Portuguese message for the player. It MUST NOT throw for
  invalid player input.
- **FR-004**: `resolveWinners` MUST return a list of players, which has more
  than one element on a tie. With zero confirmed rounds, every player is a
  winner, whatever the game's winner direction.
- **FR-005**: The four rule functions MUST be pure: same input, same output; no
  reading of storage, screen, clock, or randomness; no mutation of their inputs;
  no module-level mutable state. Any non-deterministic input MUST be passed in
  as a parameter.
- **FR-006**: The contract MUST support games where the lowest total wins, not
  only the highest — the decision lives in `resolveWinners`. No game beyond
  MECHE-MECHE is planned yet, so the contract is validated against the two
  generic test games of User Story 1 (highest total wins / lowest total wins,
  with different player limits and round input shapes).

**Registry**

- **FR-007**: There MUST be a single registry that lists all available games
  and resolves a game by id. It is the only place allowed to name a game. Game
  ids MUST be unique in it.
- **FR-008**: Adding a game MUST require only creating its folder and adding it
  to the registry.
- **FR-009**: Requesting an unknown game id MUST produce an explicit "game not
  found" result, never an unhandled failure.
- **FR-009a**: "Never throws" in this spec covers player input and stored
  data. Programming errors — an invalid game declaration, a duplicate id in the
  registry, a rule function breaking FR-001a — MUST fail loudly and immediately,
  so that the game's own tests catch them before release.
- **FR-010**: Shell code — every source file of the app outside the games
  folder — MUST NOT branch on a game's identity and MUST NOT import a game's
  folder directly; only the registry may be imported. This MUST be checked
  automatically, so a violation fails the test suite. The automated check MUST
  cover at least: imports from any game folder, equality or inequality against a
  game id, and `switch` on a game id.

**Match**

- **FR-011**: A match MUST record: the game id, the roster of players, the
  confirmed rounds with each round's input as entered, the round currently being
  filled in (if any), and an explicit status.
- **FR-011a**: There MUST be at most one current match for the whole app.
  Creating a match while another one is setting up or in progress MUST be
  rejected; the caller has to invoke the discard operation first. A finished
  match is replaced by creating a new one.
- **FR-012**: Status MUST be one of: setting up, in progress, finished. Whether
  a match is in progress MUST be read from the status, never inferred from the
  number of rounds.
- **FR-013**: Supported operations: create a match for a game; add and remove
  players while setting up; rename players while setting up or in progress (not
  once finished); start the match; update the round being filled in; confirm
  it; replace a confirmed round, identified by its position in play order;
  remove the last confirmed round; finish the match; create a rematch from a
  finished match; discard the match. Replacing a position that does not exist,
  or removing when there are no rounds, MUST be rejected.
- **FR-014**: Starting MUST be rejected when the roster is outside the game's
  player limits. Adding a player MUST be rejected when the roster is at the
  game's maximum.
- **FR-015**: Confirming or replacing a round MUST run the game's
  `validateRound` first, against the current roster (players are matched by
  identifier, so a rename never invalidates a round). An invalid round MUST NOT
  change the match, and the game's reasons MUST reach the caller unchanged.
- **FR-015a**: Confirming a round clears the draft round; a rejected confirm
  keeps it. Replacing a round or removing the last one leaves the draft
  untouched.
- **FR-016**: Totals and winners MUST always be computed from the confirmed
  rounds through the game's rule. They MUST NOT be stored as an independent
  value.
- **FR-017**: Finishing MUST set the status to finished and make the winners
  available. A finished match MUST NOT accept round changes.
- **FR-017a**: There is no match history. A finished match stays available
  (with its winners) until a new match is created or it is discarded. Creating a
  rematch replaces the finished match with a new match for the same game, in
  setting up, with the same players (names and order) and no rounds; the old
  winners are no longer available. Player limits are checked again at start.

**Persistence**

- **FR-018**: Every successful mutation of the match MUST be written to storage
  before the operation is reported as complete, including updates to the round
  being filled in. If the write fails, FR-021 applies.
- **FR-018a**: A draft round MUST be serializable for storage; a draft that is
  not MUST be rejected and leave the match unchanged. The shell never validates
  a draft's content; screens MUST tolerate any stored draft.
- **FR-019**: All persisted data MUST carry a schema version, starting at 1.
- **FR-020**: Loading MUST degrade safely: unreadable data, a wrong shape, an
  unknown or newer version, an unregistered game id, or stored rounds that the
  game's `validateRound` now rejects MUST result in discarding that data —
  removing it from storage — and returning to the initial state (no current
  match), without breaking the app. If storage itself cannot be accessed, the
  app MUST start from the initial state without a discard notice, since nothing
  was discarded.
- **FR-020a**: When FR-020 discards data, the app MUST expose a one-time
  discard notice carrying a stable reason code (unreadable, wrong shape,
  unsupported version, unknown game, invalid round). The notice MUST be
  available until acknowledged, and MUST NOT be persisted: a later reload with
  clean storage shows no notice. No copy of the discarded data is kept.
- **FR-021**: If a write fails, the operation still takes effect in memory and
  is reported as complete but **not persisted**; it MUST NOT crash the app.
  Storage keeps the last successfully written state, which is what a reload
  shows. Every later successful write stores the full current state, so
  persistence recovers on its own once storage works again.
- **FR-021a**: When another tab or window of the app saves a change, every
  other open instance MUST replace its in-memory match with the stored one and
  notify its subscribers, without writing back. If the stored data fails the
  load validation of FR-020, the instance MUST fall back to the initial state.
  Edits made at the same instant in two instances resolve as last write wins.
- **FR-022**: Player names MUST be trimmed, MUST NOT be blank, MUST NOT exceed
  30 characters after trimming, MUST NOT contain control characters, MUST be
  unique within a match ignoring case but not accents ("Ana" equals "ana";
  "José" differs from "Jose"), and MUST be stored exactly as typed otherwise.
  Renaming a player to their own name, or to a case variant of it, is allowed.
- **FR-023**: Every key written to browser storage MUST belong to a namespace
  of this app, so it cannot collide with the POC's key or other apps on the same
  origin.

**Guards**

- **FR-024**: The match state MUST only be read in the browser. The existing
  build-time guard (the test that asserts the client-only island does not
  render at build time) MUST keep passing. Creating the match state where
  browser storage does not exist MUST yield the initial state without error.
- **FR-025**: This phase MUST NOT ship any user-visible screen or any real game.
  The test games of User Story 1 exist only in the test suite and MUST NOT be
  in the built artifact. They are not shipped games, so the constitution's
  `src/games/<id>/` rule does not apply to them; they mirror that layout under
  the test fixtures folder.

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
  covering a normal case, an edge case, and a tie — where "tie" means two or
  more players with equal values in that function's input or output (equal
  claims for `validateRound`, equal round points for `scoreRound`, equal totals
  for `computeTotals`, several winners for `resolveWinners`).
- **SC-003**: After each of the operations in FR-013, reloading the persisted
  state yields a match identical to the one before reload — structurally equal,
  including status, player ids, rounds, and draft.
- **SC-004**: For each of the five discard reasons of FR-020a (with both an
  unknown and a newer version under "unsupported version"), opening the app
  reaches the initial state with the matching notice in 100% of attempts, with
  no unhandled error.
- **SC-005**: An automated check fails when a shell file names a game or
  imports a game folder directly.
- **SC-006**: No file in the built artifact contains a test game's id, and the
  artifact has no user-visible screen beyond what Phase 2 shipped.
- **SC-007**: For a 20-round, 7-player match, totals equal the values computed
  independently in the test from the fixture game's documented rule, after
  every operation, with no stored total to drift.

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
  principle. Tabs on the same device stay in sync (FR-021a).
- **No performance target.** A match is bounded by the game's player limit and
  a few dozen rounds; recomputing everything on each operation is negligible.
  This is a decision, not an omission.
- **Privacy.** Player names stay on the device only; discarding a match removes
  them from storage.
- **Forward-only versions.** A deploy rollback that meets data with a newer
  `schemaVersion` discards it (FR-020). Accepted: rollbacks are rare and the
  player is told (FR-020a).
