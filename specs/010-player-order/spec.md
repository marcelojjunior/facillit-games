# Feature Specification: Reorder players in setup

**Feature Branch**: `feature/leva-round-starter` (follows spec 009 in the same
branch)

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description (translated from Portuguese): "To make it easier in
case they want to change the order, add arrows to change the players'
position. So when they play again, a rematch for example, they can just move
players in the list instead of registering them again in a different order."

## Note on the reader of this spec

**The group at the table.** Since spec 009, the setup order decides who
starts each LEVA round. Today the only way to change it is to remove players
and add them again. A rematch keeps the players and their order, so the group
cannot change who starts the first round without retyping names.

**Whoever adds the next game.** This is a shell change: setup is shared by every
game, and the order already exists (players are kept in the order they were
added). No game changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move a player up or down in setup (Priority: P1)

In setup, each player's row has an up arrow and a down arrow. Tapping one swaps
the player with the neighbour above or below. The new order is the order the
match uses.

**Why this priority**: it is the whole feature.

**Independent Test**: in setup with Ana, Bia, Caio, tap Caio's up arrow twice;
the list reads Caio, Ana, Bia; start a LEVA match; Caio is marked "Começa" in
round 1.

**Acceptance Scenarios**:

1. **Given** setup with Ana, Bia, Caio, **When** Bia's up arrow is tapped,
   **Then** the list reads Bia, Ana, Caio.
2. **Given** the same list, **When** Bia's down arrow is tapped, **Then** the
   list reads Ana, Caio, Bia.
3. **Given** the first player, **When** the row shows, **Then** their up arrow
   is disabled; the last player's down arrow is disabled.
4. **Given** a reordered list, **When** the page is reloaded, **Then** the new
   order is kept.
5. **Given** a reordered list, **When** the match starts, **Then** every screen
   that lists players in match order (standings ties, round entry, history)
   uses the new order, and LEVA's first starter is the new first player.

---

### User Story 2 - Change the order for a rematch (Priority: P1)

After a match, the group chooses rematch; setup opens with the same players in
the same order, and they move players instead of retyping them.

**Why this priority**: the case the owner named.

**Independent Test**: finish a LEVA match with Ana, Bia, Caio; choose rematch;
move Ana to the bottom; start; Bia is marked "Começa" in round 1.

**Acceptance Scenarios**:

1. **Given** the winner screen, **When** rematch is chosen, **Then** setup shows
   the players in the previous match's order, with the arrows.
2. **Given** that setup, **When** players are moved and the match starts,
   **Then** the new match uses the new order; the finished match is not
   changed.

---

### Edge Cases

- **One player**: both arrows disabled.
- **Two players**: one tap swaps them.
- **Moving while renaming a player**: the rename in progress is kept or
  closed as rename already behaves today; moving never loses a typed name.
- **After the match starts**: no arrows; the order is fixed for the match (as
  players are, spec 003).
- **Removing or adding a player after moving**: the others keep their order; a
  new player goes to the end.
- **Ten players at 360 px**: the arrows fit with the name and the remove button,
  no sideways scroll; long names truncate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Setup MUST show, on each player's row, a "move up" and a "move
  down" control. Each MUST swap the player with the neighbour in that
  direction.
- **FR-002**: The first player's "move up" and the last player's "move down"
  MUST be disabled (visible, not tappable).
- **FR-003**: Moving MUST be allowed only while the match is in setup; it MUST
  be rejected in any other status, like the other setup operations.
- **FR-004**: The order MUST be saved on every move (spec 003 FR-011, Principle
  VII) and MUST survive a reload. The persisted schema does not change: the
  players are already stored in order.
- **FR-005**: The match MUST use the setup order everywhere it already uses the
  players' order (it is the same list); no game changes.
- **FR-006**: A rematch MUST open setup with the previous order, which can then
  be changed (spec 003 User Story 4, extended).
- **FR-007**: The controls MUST be at least 44×44 px, use the shell's 3D button
  style and tokens, and carry Portuguese accessible names naming the player
  (e.g. "Subir Ana", "Descer Ana"). With 10 players at 360 px there MUST be no
  sideways scroll.
- **FR-008**: The move operation MUST be a pure function with a unit test
  (normal, edge: first/last, and an unknown player), like the other match
  operations.

### Key Entities

- **Player order**: the order of the match's players, already stored; set in
  setup by adding and now by moving.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any order of 4 players can be reached from any other with arrow
  taps only, without removing or retyping a player.
- **SC-002**: After a rematch, choosing a different first player takes at most
  one tap per position moved (e.g. last to first of 4: 3 taps).
- **SC-003**: The new order survives a reload in 100% of the tests.
- **SC-004**: At 360×640 with 10 players, nothing scrolls sideways and every
  arrow is at least 44×44 px.
- **SC-005**: No game folder changes.

## Assumptions

- **Arrows, not drag**: the owner asked for arrows; drag and drop is out of
  scope (harder with one thumb on a phone, and needs more code).
- **Disabled at the ends** rather than hidden, so rows stay aligned.
- **Setup only**: the order cannot change during a match; to change it, use
  rematch or start a new match.
- **Spec 009** said setup has no reordering; it now points here.
- **Same branch as spec 009**: neither is merged yet, and this feature exists
  because of 009's starter rotation.
