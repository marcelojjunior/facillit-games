# Feature Specification: MECHE-MECHE, the first game

**Feature Branch**: `feature/meche-meche`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Let's now make our first game, MECHE-MECHE"
(translated from Portuguese). Phase 5 of the rewrite: the first real game,
added as a plugin on top of the game contract (spec 002), the shell screens
(spec 003), and the game-style look (spec 004). Its rules come from the
frozen POC (`script.js`), which is live today and is what groups at the
table already know.

## Note on the reader of this spec

Two readers. **The group at the table**, who already keep MECHE-MECHE scores
with the POC and must find the same rules, without the POC's bugs. **Whoever
adds the next game**, for whom this is the reference: MECHE-MECHE must be
added by creating its own folder and one registry line, and nothing else
(spec 002 SC-001, spec 003 FR-013). If that turns out to be impossible, the
contract has a gap, and the gap is fixed in the contract, not worked around
in the shell.

## Clarifications

### Session 2026-11-08

- Q: When does a player get no score ("Nenhum") in a round? → A: when they do
  not score in that round (for example, they did not finish); any number of
  players may get no score.
- Q: Must every score on offer be given out for a round to be accepted? → A:
  No. Scores may be left over (as in the POC).
- Q: Who may get the +10 bonus in a round? → A: any number of players,
  including a player who took no score (as in the POC).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep the score of a MECHE-MECHE match (Priority: P1)

The group opens the app, picks MECHE-MECHE, registers 2 to 7 players, and
plays. After each round, one person enters, for each player, the score that
player earned in the round (the scores on offer depend on how many players
there are) and whether the player got the +10 bonus. The standings update;
at the end, the highest total wins.

**Why this priority**: this is the product's first real use. Without it the
app still says "no game available".

**Independent Test**: play a full match of 5 players through the app; the
totals and the winner equal those computed by hand with the POC's rules.

**Acceptance Scenarios**:

1. **Given** the shipped app, **When** it opens with no match, **Then** the
   game list shows MECHE-MECHE (and no test-only game).
2. **Given** MECHE-MECHE in setup, **When** players are added, **Then** at
   least 2 and at most 7 are accepted, as in the POC.
3. **Given** a match of N players, **When** a round is entered, **Then** the
   scores on offer are N×10, (N−1)×10, …, 10 (for 5 players: 50, 40, 30, 20,
   10).
4. **Given** a round being entered, **When** one player takes a score,
   **Then** that score shows as taken for every other player in that round.
5. **Given** a round being entered, **When** a player gets the +10 bonus,
   **Then** 10 points are added to that player's round, on top of the score.
6. **Given** a confirmed round, **When** the standings show, **Then** each
   player's total is the sum of their scores and bonuses so far.
7. **Given** the match is finished, **When** the winner screen shows, **Then**
   the highest total wins; equal highest totals share the win.

---

### User Story 2 - Enter a round fast, with one thumb (Priority: P1)

The round entry is the most repeated interaction of the evening. On a phone
held in one hand, the person entering the round taps one score per player and
the bonuses, then confirms, without scrolling sideways or opening menus.

**Why this priority**: the POC used one dropdown per player; on a phone that
is several taps per player and hard to read at night (Principle VI).

**Independent Test**: on a 360×640 screen, enter a round of 7 players using
only taps on visible buttons; every target is at least 44×44 px; nothing
scrolls sideways.

**Acceptance Scenarios**:

1. **Given** a round of N players, **When** the entry shows, **Then** each
   player has one tappable button per score on offer, a way to give no
   score, and a bonus toggle, all in the game style of spec 004.
2. **Given** a score taken by one player, **When** another player's row
   shows it, **Then** it is visibly taken and cannot be picked again, unless
   the first player gives it up.
3. **Given** a 7-player round at 360 px wide, **When** it is entered,
   **Then** nothing scrolls sideways and every target is at least 44×44 px.

---

### User Story 3 - No POC bug comes back (Priority: P1)

The POC's known bugs are the acceptance criteria of the rewrite (AGENTS.md,
pitfall 4). With MECHE-MECHE on the new shell, none of them may happen.

**Why this priority**: they are why the rewrite exists.

**Independent Test**: reproduce each POC bug's steps in the new app; none
reproduces.

**Acceptance Scenarios**:

1. **Given** a player named with markup (e.g. `<b>Ana</b>`), **When** it
   shows anywhere, **Then** it shows as typed, as text, never as markup.
2. **Given** a player named "José da Silva", **When** the final table shows,
   **Then** the name shows exactly as typed (the POC rewrote it to "José da
   silva").
3. **Given** a match started with zero rounds, **When** the app is reopened,
   **Then** it returns to the round screen, not to setup.
4. **Given** a half-entered round with bonuses, **When** the app is
   reopened, **Then** the scores and bonuses already chosen are still there.
5. **Given** a finished match, **When** the winner screen shows, **Then** the
   rounds and totals are still available (the POC erased them first).
6. **Given** a confirmed round with a mistake, **When** the player opens it
   from the history, **Then** it can be fixed (the POC could not).

---

### Edge Cases

- **Two players**: the scores on offer are 20 and 10.
- **Seven players**: 70 down to 10; the entry still fits a 360 px screen.
- **Ties**: equal totals share a position and, at the end, the win
  (spec 003).
- **Bonus with no score**: a player can get the bonus in a round where they
  took no score (the POC allows it); their round is worth 10.
- **A score given up**: if a player switches to another score or to none,
  the first score becomes free again for the others.
- **Stored round the rules no longer accept** (e.g. from a later change): the
  shell's discard rules apply (spec 002).
- **Rename during the match**: totals stay with the player, not the name
  (spec 003).
- **Rematch**: same players, new rounds; the scores on offer follow the new
  number of players if it changed in setup.

## Requirements *(mandatory)*

### Functional Requirements

#### Plugin boundary

- **FR-001**: MECHE-MECHE MUST be added by creating its own game folder and
  one registry entry only; no shell file may change for it (spec 002 SC-001,
  spec 003 FR-013). Its id is `meche-meche` and its display name
  "MECHE-MECHE".
- **FR-002**: Its round entry MUST follow the round-entry contract of spec 003
  (controlled, tolerant of any stored value, no submit of its own) and the
  game style of spec 004 (3D buttons, tokens only, 44 px targets).

#### Rules (pure functions, each with normal, edge, and tie tests)

- **FR-003**: A match MUST have between 2 and 7 players.
- **FR-004**: In a round of N players, the scores on offer MUST be
  N×10, (N−1)×10, …, 20, 10.
- **FR-005**: Each score on offer MUST be given to at most one player in a
  round; a round that gives the same score to two players MUST be rejected
  with a Portuguese message naming the score.
- **FR-006**: A player MAY take no score in a round (they did not score),
  worth 0; any number of players may take none. Scores on offer MAY be left
  over: a round does not have to give them all out. A round where every player
  took no score and nobody got the bonus is still valid (worth 0 to all).
- **FR-007**: Each player MAY get a +10 bonus in a round, independent of
  their score; it adds 10 to their round. Any number of players may get it in
  the same round, including a player who took no score.
- **FR-008**: A player's round is worth their score (or 0) plus 10 if they
  got the bonus; their total is the sum of their rounds.
- **FR-009**: The highest total MUST win; players sharing the highest total
  are all winners. Positions follow the shell's rule (spec 003 research D2).
- **FR-010**: A round MUST be rejected, with Portuguese messages, when it names
  a player not in the match, gives a score not on offer for that number of
  players, or gives a score to two players.
- **FR-011**: The rules MUST NOT depend on player names, so a rename never
  changes a total.

#### Round entry

- **FR-012**: For each player, the entry MUST show every score on offer as a
  tappable button, a "no score" choice (the POC's "Nenhum"; shown as "—" so it
  fits the score grid, read by screen readers as "sem pontuação"), and a +10
  bonus toggle; a score taken
  by another player MUST show as taken and not be selectable.
- **FR-013**: Every change in the entry MUST be kept as the round being typed,
  so a reload restores it, bonuses included (spec 003 FR-011).
- **FR-014**: With 7 players at 360 px wide, the entry MUST NOT scroll
  sideways and every target MUST be at least 44×44 px.

#### POC bugs that must not return

- **FR-015**: Names MUST always be shown as text exactly as typed, never as
  markup and never re-capitalized.
- **FR-016**: A match with zero confirmed rounds MUST reopen on the round
  screen; a half-entered round MUST reopen as it was; finishing MUST keep the
  rounds available on the winner screen; any confirmed round MUST be fixable.
  (Provided by the shell of spec 003; verified here with MECHE-MECHE.)

#### Shipped app

- **FR-017**: The shipped app MUST list MECHE-MECHE on the game list, ending
  spec 003 FR-029's "no real game before Phase 5"; the test-only games MUST
  still never reach the shipped artifact.

### Key Entities

- **MECHE-MECHE round**: for each player, the score taken (one of the scores on
  offer, or none) and whether they got the bonus.
- **Scores on offer**: N×10 down to 10, where N is the number of players.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A full 5-player match entered in the app gives the same totals
  and winners as the POC's rules computed by hand, in 100% of the tested
  matches (including a tie and a round with bonuses).
- **SC-002**: Adding MECHE-MECHE changes no file outside its game folder and
  the registry, except tests and docs that stop expecting an empty registry.
  Moving the mascot's drawing out of the island to keep spec 004's script
  budget is spec 004's planned fallback (its research D11), done in its own
  commit before the game lands, and is not counted here.
- **SC-003**: A 7-player round can be entered at 360×640 with taps only, no
  sideways scrolling, every target at least 44×44 px.
- **SC-004**: 0 of the six POC bugs listed in User Story 3 reproduce.
- **SC-005**: The shipped page lists MECHE-MECHE, and no test-only game.

## Assumptions

- **Rules source**: the frozen POC (`script.js`) as it is live today; where
  the POC's behavior was a bug (User Story 3), the bug is not a rule.
- **Player limits**: 2 to 7 (POC). Name rules are the shell's (spec 002:
  up to 30 characters, unique ignoring case), not the POC's 20 characters.
- **No scoring rule beyond the POC**: no multipliers, no target score, no
  automatic end; the group decides when to finish (shell flow).
- **Out of scope**: other games, the cutover and removal of the POC (Phase 6),
  importing matches saved by the POC (its storage key and format are
  different; matches in progress there stay there).
