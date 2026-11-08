# Feature Specification: LEVA, the second game

**Feature Branch**: `feature/leva`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "I want to add a new game, a simpler one" (translated
from Portuguese), followed by the owner's rules for LEVA. LEVA is a card game
where every player holds their cards on the forehead, seen by everybody but
themselves. The app does not deal or play cards: it keeps each player's lives,
the round and its number of cards, and each player's guess and result.

## Note on the reader of this spec

Two readers. **The group at the table**, who play LEVA on paper today and need
the app to track lives, the number of cards of each round, and the guesses.
**Whoever adds the next game**: LEVA is the first game whose round depends on
the rounds before it (who is still alive, how many cards to deal). The game
contract cannot express that today, so this spec revises it (revision 4) in the
contract, not in the shell, and in a way that leaves MECHE-MECHE untouched.

## Clarifications

### Session 2026-11-08

- Q: How many lives does a player start with? → A: always 5; there is no
  setting.
- Q: How many players? → A: 2 to 10.
- Q: Can the tricks taken in a round add up to more or less than the number of
  cards? → A: never more. Each trick is taken by the highest card; equal cards
  cancel each other and the highest of the rest takes it; if all the cards of a
  trick cancel, nobody takes it. So the total is at most the number of cards,
  and may be less.
- Q: Is there a ceiling on the number of cards? → A: no. Cards go 1, 2, 3, …
  and go back to 1 whenever a player is eliminated.
- Q: What if everybody guesses 0 and someone takes a trick? → A: no special
  rule: each player loses the difference between their guess and what they
  took, in any round.
- Q: Can the last players all reach 0 in the same round and tie? → A: no.
  Lives are lost trick by trick ("volta a volta"); the first to reach 0 is
  out, so in the final duel one player always keeps at least 1 life. The
  winner is whoever was not the first to lose all their lives.
- Q: Script budget? → A: raise the island script budget of spec 003 from
  80 KiB to 90 KiB gzipped, as a recorded amendment (MECHE-MECHE left less than
  1 KB). Loading games on demand is deferred until there are 4 or 5 games.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep the lives of a LEVA match (Priority: P1)

The group opens the app, picks LEVA, registers 2 to 10 players, and plays. The
app says how many cards to deal this round. Before playing, each living player
says how many tricks they will take; the person holding the phone enters the
guesses. After the round, they enter how many each player took. Each player
loses as many lives as the difference between guess and result; at 0 lives a
player is out. The last player standing wins.

**Why this priority**: it is the whole game. Without it LEVA is not on the
list.

**Independent Test**: play a full 4-player match through the app until one
player is left; the lives after every round, the number of cards of every
round, and the winner equal those computed by hand.

**Acceptance Scenarios**:

1. **Given** the shipped app, **When** it opens with no match, **Then** the
   game list shows LEVA next to MECHE-MECHE.
2. **Given** LEVA in setup, **When** players are added, **Then** at least 2 and
   at most 10 are accepted.
3. **Given** a new match, **When** the first round shows, **Then** every player
   has 5 lives and the round deals 1 card.
4. **Given** a round with no elimination, **When** the next round shows,
   **Then** it deals one card more than the one before (1, 2, 3, …, no
   ceiling).
5. **Given** a round where a player guessed 2 and took 0, **When** it is
   confirmed, **Then** that player loses 2 lives; a player who guessed 0 and
   took 1 loses 1; a player who guessed right loses none.
6. **Given** a round that leaves a player at 0 lives, **When** the next round
   shows, **Then** that player is out (shown as eliminated, takes no part) and
   the round deals 1 card again.
7. **Given** a player with 1 life who misses by 3, **When** the round is
   confirmed, **Then** they end at 0 lives, never below.
8. **Given** only one player left with lives, **When** the round screen shows,
   **Then** it says that player won and offers no new round to enter; the group
   finishes the match and the winner screen shows that player.
9. **Given** the group finishes earlier, **When** the winner screen shows,
   **Then** standings are by lives left (most lives first) and equal lives share
   a position.

---

### User Story 2 - Guesses first, results after (Priority: P1)

A LEVA round has two moments at the table: everyone guesses, then the round is
played, then the tricks are counted. The entry follows that order. The guesses
are kept while the round is played, even if the phone is locked or the page is
reloaded.

**Why this priority**: the guesses are what the group forgets on paper; keeping
them is the app's main help.

**Independent Test**: enter the guesses of a 5-player round, reload the page,
see the guesses still there, then enter the results and confirm.

**Acceptance Scenarios**:

1. **Given** a round, **When** the entry shows, **Then** it shows the round's
   number of cards and, for each living player, a way to enter the guess from 0
   to the number of cards.
2. **Given** the 1-card round, **When** a guess is entered, **Then** the
   choices read "Leva" and "Não leva".
3. **Given** all the guesses entered, **When** the person moves on, **Then** the
   entry asks, for each living player, how many tricks they took (0 to the
   number of cards), with each player's guess still visible.
4. **Given** guesses entered and the page reloaded, **When** the round screen
   shows again, **Then** the guesses (and any results already entered) are
   still there.
5. **Given** results whose total is more than the number of cards, **When** the
   round is confirmed, **Then** it is rejected with a Portuguese message and
   nothing changes.
6. **Given** results whose total is less than the number of cards (cards
   cancelled), **When** the round is confirmed, **Then** it is accepted.
7. **Given** a player whose guess or result is missing, **When** the round is
   confirmed, **Then** it is rejected with a Portuguese message naming the
   player.
8. **Given** the results step, **When** the person wants to change a guess,
   **Then** they can go back to the guesses without losing the results already
   entered.

---

### User Story 3 - Enter a round with one thumb (Priority: P2)

On a phone held in one hand, a 10-player round is entered with taps only.

**Why this priority**: same as MECHE-MECHE (Principle VI); LEVA has up to 10
players, the most of any game so far.

**Independent Test**: on a 360×640 screen, enter guesses and results of a
10-player round in the 5-card round using only taps; every target is at least
44×44 px; nothing scrolls sideways.

**Acceptance Scenarios**:

1. **Given** a 10-player round at 360 px wide, **When** it is entered, **Then**
   nothing scrolls sideways and every target is at least 44×44 px.
2. **Given** a round with many cards (say 12), **When** a guess is entered,
   **Then** every value from 0 to 12 is reachable with taps, without typing.
3. **Given** the round entry, **When** it shows, **Then** each player's lives
   are visible next to their name.

---

### Edge Cases

- **Two players**: a normal match; the first elimination ends it.
- **Ten players**: the entry still fits 360 px.
- **Several players out in the same round**: all are out; the next round deals
  1 card.
- **Everyone left is out in the same round**: does not happen at the table.
  Lives are lost trick by trick, and the first player to reach 0 is out, so
  the last two never reach 0 together (Clarifications). The app trusts the
  results entered (Assumptions); if such a round is entered anyway, nobody is
  alive, the round screen says the match is over with no player standing, and
  standings are by lives (everyone at 0 shares the win). No extra rule is built
  for it.
- **A round cut short**: when a player reaches 0 in the middle of a round, the
  tricks not played are not counted, so the results may add up to less than
  the number of cards (already allowed).
- **Total taken equals 0**: every trick cancelled; valid.
- **Everybody guesses 0**: no special rule (Clarifications).
- **Fixing a past round**: the fix sheet shows that round's own number of
  cards and players; it changes that round only. Later rounds keep their own
  cards and players; lives are recomputed from all rounds and never go below
  0. The entry for the next round derives its cards and players from the
  rounds as they are after the fix.
- **Rename during the match**: lives stay with the player, not the name.
- **Rematch**: same players, 5 lives each, 1 card.
- **Stored round the rules no longer accept**: the shell's discard rules apply
  (spec 002).

## Requirements *(mandatory)*

### Functional Requirements

#### Plugin boundary and contract

- **FR-001**: LEVA MUST be added by creating its own game folder and one
  registry entry; its id is `leva` and its display name "LEVA". The only other
  changes allowed are the contract revision (FR-002, FR-003), the budget
  amendment (FR-020), and tests and docs that list the shipped games.
- **FR-002**: Game contract revision 4: a game's round entry MUST also receive
  the match's confirmed rounds before the one being entered: all of them for
  the next round, and the rounds before it when fixing a past round. Games that
  ignore it MUST keep working unchanged (MECHE-MECHE changes no file).
- **FR-003**: Game contract revision 4: a game MAY name the unit of its totals
  (LEVA: "vidas"; "vida" for 1); a game that names none keeps the current
  "pts". The shell shows a game's totals with that unit and never names a game.
- **FR-004**: The round entry MUST follow the round-entry contract of spec 003
  (controlled, tolerant of any stored value, no submit of its own) and the game
  style of spec 004 (3D buttons, tokens only, 44 px targets).

#### Rules (pure functions, each with normal, edge, and tie tests)

- **FR-005**: A match MUST have between 2 and 10 players. Every player starts
  with 5 lives.
- **FR-006**: Each round MUST record its own number of cards (a whole number,
  at least 1) and, for each player who played it, the guess and the tricks
  taken, each a whole number from 0 to the number of cards. A round MUST be
  scored from its own record, without the rounds before it.
- **FR-007**: A round MUST be rejected, with Portuguese messages, when it has
  no players, names a player not in the match, misses a guess or a result,
  has a guess or result outside 0 to the number of cards, or has results
  whose total is more than the number of cards.
- **FR-008**: In a round, a player MUST lose lives equal to the difference
  between guess and tricks taken; players who did not play it lose none.
- **FR-009**: A player's lives MUST be 5 minus all the lives lost so far, and
  never below 0. A player at 0 lives is out.
- **FR-010**: The next round's number of cards MUST be 1 for the first round
  and for the round after any round that put a player out; otherwise one more
  than the round before. There is no ceiling.
- **FR-011**: The next round's players MUST be the players with lives left.
- **FR-012**: The most lives MUST win; players sharing the most lives are all
  winners. Positions follow the shell's rule (spec 003 research D2). (When one
  player is left, they have the most lives and win alone.)
- **FR-013**: The rules MUST NOT depend on player names.

#### Round entry

- **FR-014**: The entry MUST show the round's number of cards and only the
  players with lives left, each with their lives.
- **FR-015**: The entry MUST take the guesses first, then the tricks taken,
  showing each player's guess beside the result; going back to the guesses
  MUST keep the results entered. In the 1-card round the guess choices read
  "Leva" and "Não leva".
- **FR-016**: Every change in the entry (guesses, results, and the current
  step) MUST be kept as the round being typed, so a reload restores it (spec
  003 FR-011).
- **FR-017**: With one player left, or none, the entry MUST say so (the winner,
  or that nobody is left) and offer nothing to enter, so the group finishes the
  match.
- **FR-018**: With 10 players at 360 px wide, the entry MUST NOT scroll
  sideways and every target MUST be at least 44×44 px; any value from 0 to the
  number of cards MUST be reachable with taps.
- **FR-019**: When fixing a past round, the entry MUST show that round's own
  number of cards and players, taken from the round itself.

#### Shipped app

- **FR-020**: The island script budget of spec 003 MUST be raised from 80 KiB
  to 90 KiB gzipped, recorded as an amendment in spec 003's plan with the
  reason; the shipped app MUST fit it with LEVA.
- **FR-021**: The shipped app MUST list LEVA and MECHE-MECHE; the test-only
  games MUST still never reach the shipped artifact.

### Key Entities

- **LEVA round**: its number of cards; for each player who played it, the guess
  and the tricks taken.
- **Lives**: per player, 5 minus the lives lost, never below 0; the game's total.
- **Round being typed**: the guesses and results entered so far and the step
  (guesses or results).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A full 4-player match entered in the app, played until one player
  is left, gives the same lives, cards per round, and winner as computed by
  hand, in 100% of the tested matches (including a round with two players out
  and a round where cards cancelled).
- **SC-002**: Adding LEVA changes MECHE-MECHE's folder not at all, and the shell
  only by the contract revision (rounds to the entry, unit of totals).
- **SC-003**: A 10-player round can be entered at 360×640 with taps only, no
  sideways scrolling, every target at least 44×44 px.
- **SC-004**: Guesses entered survive a page reload in 100% of the tests.
- **SC-005**: The shipped page lists LEVA and MECHE-MECHE, no test-only game,
  and its island script fits 90 KiB gzipped.

## Assumptions

- **Rules source**: the owner's description in this conversation; no POC
  exists for LEVA.
- **The app does not check the cards**: it trusts the results entered, beyond
  the checks of FR-007 (it cannot know which cards cancelled).
- **No automatic end**: the shell has none; with one player left the entry
  tells the group to finish (FR-017).
- **Totals are lives**: the shell's standings, history, and winner screen show
  lives, highest first, with the "vidas" unit (FR-003).
- **Out of scope**: dealing order, who starts, the trick-by-trick play, the
  cutover (Phase 6), loading games on demand.
