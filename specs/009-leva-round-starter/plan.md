# Implementation Plan: LEVA round starter

**Branch**: `feature/leva-round-starter` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

The starter of each LEVA round is derived, never stored: `nextRound` (spec 007
research D4) already walks the confirmed rounds to find the next round's cards
and living players; it now also tracks the starter, passing it each round to
the first of that round's own players after the previous starter in roster
order (the living players, for the round being entered). The round
entry lists the round's players rotated to start from that player and marks
them "Começa". Everything stays in `src/games/leva/`.

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (strictest), React 19.3.1, Astro 7.4.4
**Primary Dependencies**: none new
**Storage**: none new; the starter is derived from confirmed rounds (no schema
change, no draft change)
**Testing**: Vitest `unit` (`rules.test.ts`) and `browser`
(`RoundEntry.browser.test.tsx`, `match.browser.test.tsx`)
**Target Platform**: static site, mobile browsers, 360×640 first
**Project Type**: client-side web app (game plugin)
**Performance Goals**: n/a (O(rounds × players), at most 10 players)
**Constraints**: island JS ≤ 90 KiB gzip (spec 003 amendment); 44 px targets;
tokens only
**Scale/Scope**: 2–10 players; two files of LEVA code plus their tests

## Constitution Check

| Principle | Verdict | Note |
|---|---|---|
| I Pure client-side | PASS | No network, no dependency. |
| II A game is a plugin | PASS | Only `src/games/leva/` changes; no shell file, no contract change. |
| III Pure rules | PASS | The starter comes from `nextRound`, `firstFrom`, and `fromStarter`, pure and tested (normal, edge: elimination of the starter and of the next in line, two players; tie: n/a for a starter, covered by "several out in the same round"). |
| IV `client:only` | PASS | Inside the existing island. |
| V strict | PASS | No casts; `starter` is `PlayerRef \| undefined`. |
| VI Mobile-first | PASS | One short "Começa" label in the existing name row; no new targets. |
| VII Versioned schema | PASS | Nothing persisted changes; in-progress matches get a starter from their rounds. |
| VIII Spec before code | PASS (gate) | `spec.md` MUST be committed before `/speckit-implement`. |
| IX Language | PASS | Code and docs in English; "Começa" is UI copy. |

Post-design re-check: PASS (no change).

## Design

See [research.md](./research.md) for the decisions and
[data-model.md](./data-model.md) for the derivation.

- **Rules** (`rules.ts`):
  - `NextRound` gains `from: string` (the id the next rotation starts from:
    the player after the previous round's starter, or `players[0]` before any
    round) and `starter: PlayerRef | undefined` (`firstFrom(players, from,
    alive)`).
  - `firstFrom(players, fromId, among)`: first of `among` going forward in
    cyclic roster order from `fromId`.
  - `nextRound` walks the accepted rounds, choosing each round's starter with
    `firstFrom` among that round's own players (keys of `guesses`), starting
    from the player after the previous starter; the next round's starter is
    chosen among `alive`. With nobody alive, `undefined`.
  - `fromStarter(playing, starterId)`: the list rotated to begin with the
    starter; unchanged when the starter is not in it.
- **Entry** (`RoundEntry.tsx`): `read` returns the starter as
  `firstFrom(players, before.from, playing)`: for the next round `playing` is
  `alive` (so it equals `before.starter`); for a round being fixed it is the
  round's own players. One rule for both (FR-003, FR-007). The render maps over `fromStarter(playing, starter?.id)` instead
  of `playing`, and shows the text "Começa" in the starter's name row, after the
  truncating name, in both steps (read by screen readers with the row). The
  draft's ids (and key order) stay in roster order, so stored drafts compare equal as before (spec
  007 research D5).
- **Fixing a past round**: the shell already passes the rounds before it
  (contract revision 4); the starter is picked among the round's own players.
- **Spec 007**: its "Out of scope" line now points to this spec.
- **Tests**: update the `nextRound([])` `toEqual` in `rules.test.ts` for the new
  fields; add starter cases for the four matches of SC-001, a rejected round,
  removing the last round, a renamed player, and a fixed past round that
  changes who is alive; add an entry test for order and
  label in both steps and in the fix sheet; extend the full-match test with the
  starter of every round.

## Project Structure

### Documentation (this feature)

```text
specs/009-leva-round-starter/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/requirements.md
```

No `contracts/`: no interface changes (the game contract is untouched).

### Source Code

```text
src/games/leva/
├── rules.ts                    # NextRound.starter, firstFrom, fromStarter
├── rules.test.ts               # starter rotation cases
├── RoundEntry.tsx              # rotated list, "Começa"
├── RoundEntry.browser.test.tsx # order and label, fix sheet
└── match.browser.test.tsx      # starter per round in the full match
```

**Structure Decision**: the existing single-project layout; only LEVA's folder.

## Complexity Tracking

No violations.
