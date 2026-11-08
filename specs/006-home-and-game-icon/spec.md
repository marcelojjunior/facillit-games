# Feature Specification: Home button, setup layout, and game icons

**Feature Branch**: `feature/meche-meche` (with spec 005, before its PR)

**Created**: 2026-11-08

**Status**: Draft

**Input**: Owner review of the MECHE-MECHE screens (translated from
Portuguese): "put a little house next to the theme button that goes to the
game list, always with a confirmation; in a match, warn that it will be
abandoned and lost"; "put the button below the input and the input full
width"; "MECHE-MECHE is a card game, so it can be cards in a row instead of a
trophy".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Go back to the game list from anywhere (Priority: P1)

A player wants to leave the current screen and pick another game. A house
button next to the theme button takes them to the game list after a
confirmation that says what will be lost.

**Independent Test**: from setup, in progress, and the winner screen, tap the
house, read the warning, cancel (nothing changes), tap again, confirm (the
game list shows and the match is gone).

**Acceptance Scenarios**:

1. **Given** the game list, **When** it shows, **Then** there is no house
   button (it would lead nowhere).
2. **Given** a match in setup or in progress, **When** the house is tapped,
   **Then** a confirmation warns, in Portuguese, that the match will be
   abandoned and cannot be recovered.
3. **Given** a finished match, **When** the house is tapped, **Then** the
   confirmation says the finished match will be closed.
4. **Given** the confirmation, **When** the player cancels, **Then** nothing
   changes; **When** they confirm, **Then** the match is discarded and the
   game list shows.

### User Story 2 - Add players with a wide name field (Priority: P2)

On setup, the name field takes the full width of its card, with the add
button full width below it, so long names are easy to read while typing.

**Independent Test**: at 360 px, the name field and the add button have the
same width as the card's content, and the button sits below the field.

### User Story 3 - Each game shows its own picture (Priority: P2)

On the game list, each game can show its own icon. MECHE-MECHE, a card game,
shows playing cards in a fan; a game without an icon keeps the trophy.

**Independent Test**: the game list shows MECHE-MECHE with its card icon; a
game that declares no icon shows the trophy.

### Edge Cases

- **House during a confirmation of another action**: only one dialog at a time
  (the house is in the header, behind any open dialog's backdrop).
- **Theme choice**: going home never changes it (spec 003 FR-020a).
- **Another tab** changed the match while the house dialog is open: confirming
  still discards whatever match is current; cancel changes nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The header MUST show a house button, beside the theme button,
  whenever there is a match (any status), and MUST NOT show it on the game
  list. It is a 3D neutral button, ≥ 44×44 px, named "Voltar para a lista de
  jogos".
- **FR-002**: Tapping it MUST open a confirmation; confirming MUST discard the
  match and show the game list; cancelling MUST change nothing.
- **FR-003**: The confirmation text MUST say, for a match in setup or in
  progress, that it will be abandoned and cannot be recovered; for a finished
  match, that it will be closed. The confirm action is red when something is
  lost (setup, in progress) and blue for a finished match.
- **FR-004**: On setup, the name field MUST take the full width of its card,
  with the add button below it, also full width; no other setup behavior
  changes.
- **FR-005**: A game MAY declare its own icon (a decorative picture); the game
  list MUST show it in the game's badge, and MUST show the trophy for a game
  that declares none. The shell still never names a game (Principle II).
- **FR-006**: MECHE-MECHE MUST declare an icon of playing cards in a fan.

## Success Criteria *(mandatory)*

- **SC-001**: From each of the three match screens, the house leads to the
  game list in two taps (house, confirm), with the right warning, in 100% of
  the tested cases; cancel changes nothing.
- **SC-002**: All existing tests still pass; the layout test of spec 003 still
  finds every target ≥ 44×44 px with the house in the header.
- **SC-003**: The island script stays within the 80 KiB budget.

## Assumptions

- The house hides on the game list (owner said "goes to the game list";
  there it would do nothing).
- The finished-match wording and colors (FR-003) are the implementer's
  default; the owner can adjust.
- The icon is optional in the game contract, so the test-only games need no
  change (non-breaking revision of spec 003's game contract).
