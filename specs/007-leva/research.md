# Research: LEVA, the second game

## D1 — How the entry learns the match so far

- **Decision**: add `rounds: readonly unknown[]` to `RoundEntryProps`: the
  stored inputs of the confirmed rounds before the one being edited
  (`match.rounds` for the next round; `match.rounds.slice(0, index)` when
  fixing round `index`).
- **Rationale**: the smallest change that lets an entry derive state from the
  past; the shell already holds the rounds; entries that ignore the prop are
  unaffected (MECHE-MECHE changes nothing).
- **Alternatives**: pass `totals` (not enough: the next card count depends on
  the last round's eliminations and its card count); give `validateRound`
  history (changes the four pure rule signatures and every game's tests).

## D2 — Self-describing rounds

- **Decision**: a LEVA round stores
  `{ cards, guesses: {id: n}, taken: {id: n} }` for the players who played it.
  `validateRound(input, players)` checks only the round itself.
- **Rationale**: `validateRound` and `scoreRound` see no history (contract);
  storing the card count and participants makes each round checkable and
  scorable alone, and a fix of a past round never rewrites later ones.
- **Alternatives**: derive `cards` at scoring time (impossible without history).

## D3 — Lives as totals

- **Decision**: `scoreRound` gives `−|guess − taken|` to each participant and
  0 to the rest; `computeTotals` gives `max(0, 5 + Σ)`; `resolveWinners` keeps
  the highest. The shell's positions then rank by lives.
- **Rationale**: fits the contract with no special case; the floor at 0 also
  absorbs a fix that makes a later round charge a player already at 0.
- **Alternatives**: a floor per round (needs history in `computeTotals` order;
  same result for consistent matches, more code).

## D4 — Next round derivation

- **Decision**: a pure `nextRound(rounds, players)` in `rules.ts`: parse each
  stored round with `validateRound` (skip invalid ones), accumulate lives;
  `cards` = 1 when there are no rounds or the last valid round took a player
  from > 0 to 0 lives, else `last.cards + 1`; `alive` = players with lives > 0.
- **Rationale**: one function for the entry and the tests; reuses the rules.

## D5 — Draft shape and steps

- **Decision**: the draft is `{ cards, step, guesses, taken }`. The entry writes
  `cards` from `nextRound` (or, when fixing, from the round's own value) and
  keeps only living players' values. If a stored draft's `cards` differ from
  the derived ones (a past round was fixed meanwhile), the entry shows the
  derived cards, drops out-of-range values, and writes the corrected draft on
  the next edit. Confirming with results missing is rejected by
  `validateRound` ("Falta quantas levou: Ana").
- **Rationale**: the shell persists drafts as they are (FR-016 of this spec);
  no shell change needed for steps.

## D6 — Input control

- **Decision**: per player, a wrapping grid of number buttons 0…cards
  (`btn-3d`, ≥ 44 px, 5 per row at 360 px); "Leva"/"Não leva" for 1 card.
- **Rationale**: tap-only, every value reachable without a ceiling, the same
  pattern as MECHE-MECHE's score grid; only vertical scrolling grows with many
  cards.
- **Alternatives**: a − / + stepper (fewer targets but several taps per value
  and an empty state that is hard to show).

## D7 — End of match

- **Decision**: with ≤ 1 living player the entry shows "Vitória de Ana! Toque em
  finalizar." (or "Ninguém sobrou.") and never calls `onChange`; the shell's
  confirm stays disabled because the draft is `undefined`.
- **Rationale**: no shell change; the group finishes with the existing button.
  If a stale draft exists, the entry clears it with `onChange(undefined)`.

## D8 — Unit of totals

- **Decision**: `unit?: { one: string; other: string }` on the game;
  `PointsBadge` shows `unit.one` when the value is 1 or −1, else `unit.other`;
  default "pts".
- **Rationale**: "5 pts" for lives misleads; the shell stays game-agnostic.

## D9 — Budget

- **Decision**: island limit 90 KiB (92 160 bytes gzip -9), recorded in spec
  003's plan. Estimated LEVA cost: 1.5–2.5 KB gzipped.
- **Alternatives**: per-game lazy loading — deferred until 4–5 games (owner).
