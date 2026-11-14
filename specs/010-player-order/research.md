# Research: Reorder players in setup

## D1. One-step swap operation

- **Decision**: `movePlayer(playerId, 'up' | 'down')` swaps with the neighbour.
- **Rationale**: matches the arrows one to one; one tap, one stored mutation.
- **Alternatives considered**: `setOrder(ids[])` — more general, but needs
  validation of a whole permutation for a UI that only ever swaps neighbours;
  drag and drop — out of scope (spec Assumptions).

## D2. Fit at 360 px

- **Decision**: arrows at 44×44 px (`size-11`), side by side, before the
  48 px remove button.
- **Rationale**: at 360 px the row has about 280 px inside the card; three
  48 px buttons and gaps would leave the name about 112 px; 44 px arrows leave
  about 120 px, enough for most first names, and names truncate (they already
  do). 44 px is the constitution minimum.
- **Alternatives considered**: stacking the arrows (row height doubles, 10
  players no longer fit near one screen); hiding arrows at the ends (rows
  stop aligning).

## D3. Moving past an end

- **Decision**: returns the match unchanged and `ok`.
- **Rationale**: the UI disables those arrows; a tap that races a change
  (another tab) should not show an error.
- **Alternatives considered**: a `cannot_move` error — an error message for
  something the user cannot do on purpose.

## D4. Status

- **Decision**: only `setting_up`, like add and remove; `invalid_status`
  otherwise.
- **Rationale**: the match order is fixed once it starts (spec 003; spec 009
  derives the LEVA starter from it).
