# Feature Specification: LEVA round starter

**Feature Branch**: `feature/leva-round-starter`

**Created**: 2026-11-13

**Status**: Implemented

**Input**: User description (translated from Portuguese): "Add to LEVA the
control of who starts the round. For example, the first round, the card on the
forehead, starts with player 1 giving the guess; then, in the round with two
cards, player 2 starts guessing; in the third round player 3 starts, and so on
according to the number of players. When it reaches the last player, it goes
back to player 1. Ask if in doubt."

## Note on the reader of this spec

**The group at the table.** Today they must remember, round after round, whose
turn it is to guess first; the app already knows the round and the players, so
it can say it. Spec 007 left "who starts" out of scope; this spec brings it in.
It is a LEVA-only change: the shell and MECHE-MECHE are untouched.

## Clarifications

### Session 2026-11-13

- Q: When the player due to start is out, who starts? → A: the start passes to
  the next living player after the previous round's starter, in registration
  order. Example: A, B, C, D; A, B, C start rounds 1–3; C is out in round 3;
  rounds 4, 5, 6, 7 start with D, A, B, D. Nobody is skipped and nobody starts
  twice in a row (unless they are the only one left, which ends the match).
- Q: How does the starter appear? → A: ~~the players are listed starting from
  the starter~~ revised by the owner after implementation (2026-11-13): the
  list keeps the setup order in every round, so it does not move and confuse
  the group; only the "Começa" mark moves from player to player.

### Checklist review 2026-11-13 (`checklists/rotation.md`)

- The rotation runs over **each round's own players** (FR-003). For the round
  being entered they are the players with lives left; for a stored round, the
  players who played it. In normal play this is the rule above; it also keeps
  the starter inside a later round after a past round is fixed and changes who
  is alive (CHK008).
- Stored rounds the rules reject are ignored: they do not advance the rotation
  (CHK009), as they already do not count for cards or lives (spec 007).
- The players of a match are fixed once it starts (only rename exists), and
  setup has no reordering, so registration order is the setup list order
  (CHK001, CHK013).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See who guesses first (Priority: P1)

When a LEVA round opens, the entry shows which player starts the guesses. In
round 1 it is the first registered player; each new round passes the start to
the next player in registration order; after the last player it goes back to
the first.

**Why this priority**: it is the whole feature.

**Independent Test**: start a 3-player match (A, B, C) and confirm 4 rounds
without eliminations; the starter shown is A, B, C, A.

**Acceptance Scenarios**:

1. **Given** a new match with players A, B, C (in that order), **When** round 1
   shows, **Then** A is shown as the one who starts.
2. **Given** round 1 confirmed, **When** round 2 shows, **Then** B starts;
   after round 2, C starts round 3; after round 3, A starts round 4.
3. **Given** a round in the guesses step or the results step, **When** it
   shows, **Then** the players stay in setup order and only the starter's row
   is marked "Começa" (round 3 above: A, B, C with C marked).
4. **Given** guesses entered and the page reloaded, **When** the round shows
   again, **Then** the same starter is marked and the order is unchanged.

---

### User Story 2 - Rotation skips eliminated players (Priority: P1)

When a player is out, they never start a round again; the rotation keeps going
among the living players.

**Why this priority**: eliminations happen in every match; a starter who is out
would break the feature in the first match.

**Independent Test**: 4 players A, B, C, D; A, B, C start rounds 1–3 and C is
out in round 3; rounds 4–7 start with D, A, B, D, and C never starts again.

**Acceptance Scenarios**:

1. **Given** A, B, C, D with C out in round 3 (which C started), **When**
   rounds 4–7 show, **Then** they start with D, A, B, D.
2. **Given** A, B, C, D with B (who started round 2) and C both out in round 2,
   **When** rounds 3–5 show, **Then** they start with D, A, D.
3. **Given** any round, **When** it shows, **Then** the starter is a player with
   lives left.

---

### Edge Cases

- **Two players**: they alternate (A, B, A, …); the first elimination ends the
  match, so no starter is shown after it.
- **Fixing a past round**: the fix sheet shows that round's own starter, among
  that round's own players. Later rounds' starters are derived from the rounds
  as they are after the fix, each among its own players (Clarifications).
- **Removing the last round**: the starter goes back to that round's starter.
- **One player left or none**: nothing to enter (spec 007 FR-017); no starter is
  shown.
- **Rematch**: the first registered player starts round 1 again.
- **Rename during the match**: the start follows the player, not the name.
- **Matches already in progress when this ships**: the starter is derived from
  their confirmed rounds, as if the feature had always existed; a round being
  typed keeps its guesses and results, and only the mark appears.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The change MUST stay inside LEVA's game folder (plus tests and
  specs); the shell, the game contract, and MECHE-MECHE MUST NOT change.
- **FR-002**: Round 1's starter MUST be the first player in registration order
  among round 1's players.
- **FR-003**: Each later round's starter MUST be the first of that round's
  players found going forward in registration order from the player after the
  previous round's starter, wrapping from the last player to the first. A
  round's players are the players with lives left after the previous round is
  confirmed (the round being entered) or the players who played it (a stored
  round).
- **FR-004**: As a consequence of FR-003, a player with no lives left MUST
  never be the starter of the round being entered.
- **FR-005**: The starter MUST be derived from the match's players and its
  rounds the rules accept, by a pure, tested function (Principle III); rounds
  the rules reject MUST NOT advance the rotation. Nothing new is stored, and the
  persisted schema does not change.
- **FR-006**: The round entry MUST list the round's players in setup order in
  every round, in both the guesses and the results steps; the order MUST NOT
  change with the starter (Clarifications). The starter's row MUST show the text
  "Começa" next to the name, as visible text that assistive technology reads
  with the row. The entry MUST keep the spec 007 layout constraints (360 px, no
  sideways scroll, 44×44 px targets) with 10 players and long names: the name
  truncates, the mark stays visible.
- **FR-007**: When fixing a past round, the entry MUST show that round's own
  starter (FR-003 for that round).
- **FR-008**: The rules MUST NOT depend on player names.

### Key Entities

- **Round starter**: for each round, the player among that round's players who
  guesses first; derived, never stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The starter computed by the rules equals the one computed by hand
  in each of these matches, and the full-match test checks the starter shown on
  screen in every round: 3 players with no elimination (4 rounds); 4 players
  with the starter out (User Story 2, scenario 1); 4 players with the starter
  and the next in line out together (scenario 2); 2 players until one is out.
- **SC-002**: An eliminated player is never shown as starter.
- **SC-003**: When a round opens, the list is in setup order and exactly one
  row, the starter's, carries the "Começa" mark, reachable by vertical scroll
  only (no sideways scroll at 360×640). Revised twice (2026-11-13): first
  measured in the app (the standings push the entry below the fold with many
  players), then by the owner's choice to keep the setup order.
- **SC-004**: No file outside LEVA's folder changes, other than specs and tests.

## Assumptions

- **"Player 1"** is the first player in the setup list; setup has no
  reordering, and players cannot be added or removed during a match
  (Clarifications).
- **No enforced order**: the mark says who starts; the person holding the
  phone may still tap any player's guess in any order.
- **No "last guesser" restriction** (e.g. the total of guesses may not equal the
  number of cards): not requested, out of scope.
- **Dealer** is not tracked; only who guesses first.
- **Spec 007** listed "who starts" as out of scope; it now points here.
