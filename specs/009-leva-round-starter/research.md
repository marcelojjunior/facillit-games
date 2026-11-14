# Research: LEVA round starter

## D1. Derive the starter, do not store it

- **Decision**: compute the starter from the players and the confirmed rounds,
  inside `nextRound`.
- **Rationale**: the confirmed rounds already say who played each one (the keys
  of `guesses`) and the lives after it, which is all the rotation needs. No
  schema or draft change (Principle VII); matches in progress get it for free;
  fixing a past round recomputes later starters automatically (spec edge case).
- **Alternatives considered**: storing a `starter` per round or in the draft —
  rejected: a second source of truth that a fix to a past round would make
  stale.

## D2. Rotation over living players

- **Decision**: starter(1) = first in roster among round 1's players;
  starter(k+1) = first of round k+1's players going forward in cyclic roster
  order from the player after starter(k) (Clarifications Q1 and checklist
  review). The next round's players are the living ones; a stored round's are
  the ones who played it.
- **Rationale**: the owner's choice; it is how the turn passes at a table, never
  repeats a starter while two or more are alive, and never skips a living one.
- **Why each round's own players**: after a fix to a past round, the lives
  derived from all rounds can say a player is alive who did not play a later
  stored round; choosing among lives would put a starter outside that round.
- **Alternatives considered**: fixed seat per round index (`(k−1) mod n`,
  skipping out players) — rejected by the owner: it can give the same player two
  rounds in a row.

## D3. Rotate the rendering, not the draft

- **Decision**: the entry renders `fromStarter(playing, starter)`; the draft's
  ids stay in roster order.
- **Rationale**: the entry compares the stored draft with the one it rebuilds
  (spec 007 research D5) by JSON, so key order matters; rotating only the view
  leaves stored drafts byte-identical and needs no re-sync.
- **Alternatives considered**: returning `alive` already rotated from
  `nextRound` — rejected: changes the documented "roster order" of `alive` and
  the draft's key order.

## D4. Invalid rounds

- **Decision**: rounds `validateRound` rejects are skipped, as `nextRound`
  already does for cards; they do not advance the starter.
- **Rationale**: one walk, one rule for both values; the shell discards such
  rounds anyway (spec 002).
