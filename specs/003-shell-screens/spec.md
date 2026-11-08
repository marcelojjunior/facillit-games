# Feature Specification: Design system and shell screens

**Feature Branch**: `feature/shell-screens`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "start the Phase 4 spec" (translated from
Portuguese). Phase 4 is defined by specs 001 and 002 as the design system and
the shell screens: the first user-visible flow of the rewrite, consuming the
Phase 3 match store through a `client:only` island, with no real game
(MECHE-MECHE is Phase 5).

## Note on the reader of this spec

This is the first phase whose direct user is **the player**: a group around a
table, one phone passed from hand to hand, often at night. Every screen here is
generic — it must work the same for any game in the registry — so the second
reader is **whoever adds a game** in Phase 5 and later, who must be able to
plug a game in without touching these screens.

Contract names fixed by earlier specs (`GameDefinition`, the match store
operations and error codes, `status`, `schemaVersion`, the discard notice
reasons) are used here as given: see
[`specs/002-game-contract/contracts/`](../002-game-contract/contracts/).

## Clarifications

### Session 2026-11-08

- Q: Until MECHE-MECHE arrives, should the screens be playable by hand with the
  test-only games? → A: only in development mode (`pnpm dev`) the test-only
  games appear in the game list; the shipped build stays empty and shows the
  "no game available" message.
- Q: How should the score table be laid out on a 360 px screen? → A: a compact
  standings view by default (one line per player: name, total, position); one
  tap opens the full history (players × rounds, names pinned on the left,
  horizontal scroll that opens at the latest round).
- Q: Should the theme only follow the device, or also have a switch? → A: it
  follows the device by default, and a switch (automatic / light / dark) lets
  the player override it; the choice is saved on the device.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a full match on one phone (Priority: P1)

A player opens the app, picks a game, registers the players at the table,
starts the match, records one round after another, watches the standings, finishes the match, and sees who won.

**Why this priority**: this is the whole product. Without it, nothing built in
Phases 2 and 3 reaches a player.

**Independent Test**: with a test-only game registered, run a full match from
an empty app to the winner screen using only taps and typing on a narrow
(phone-sized) viewport, and check that the totals and winners shown equal the
ones the game's rules compute.

**Acceptance Scenarios**:

1. **Given** no match exists and the registry has games, **When** the player
   opens the app, **Then** they see the list of available games by name and can
   choose one.
2. **Given** a game was chosen, **When** the player types a name and submits,
   **Then** the player appears in the roster; submitting again with the same
   name (ignoring case) shows a Portuguese message and adds nothing.
3. **Given** the roster has fewer players than the game's minimum, **When** the
   player looks at the start action, **Then** it is unavailable and the screen
   says how many more players are needed.
4. **Given** the roster has reached the game's maximum, **When** the player
   looks at the add action, **Then** it is unavailable and the screen says the
   roster is full.
5. **Given** a valid roster, **When** the player starts the match, **Then** the
   round-entry screen of the chosen game appears for round 1.
6. **Given** a round is being entered, **When** the player confirms a valid
   round, **Then** the standings show the updated totals and positions,
   and the entry is ready for the next round.
7. **Given** a round is being entered, **When** the player confirms an invalid
   round, **Then** every reason the game gave is shown in Portuguese next to
   the entry, the entry keeps what was typed, and no round is added.
8. **Given** a match in progress, **When** the player asks to finish, **Then**
   a confirmation shows the current table and lets them either continue
   playing or finish.
9. **Given** the player confirms finishing, **When** the winner screen
   appears, **Then** it names the winner — or, on a tie, every tied player,
   presented as a shared win and not as a single winner.

---

### User Story 2 - The match survives a closed tab (Priority: P1)

The phone locks, the browser discards the tab, someone closes it by mistake.
When the app is opened again, the match is exactly where it was — including a
round that was half-entered.

**Why this priority**: this is the normal use, not an edge case (constitution,
Principle IV and VII). A screen that flashes empty or forgets the round on
reopen fails the main scenario.

**Independent Test**: start a match, confirm two rounds, type part of a third,
reload the page; the same screen comes back with both rounds, the same totals,
and the partially typed round, with no empty or initial-state flash before it.

**Acceptance Scenarios**:

1. **Given** a match in progress with a partially entered round, **When** the
   app is reopened, **Then** the round-entry screen shows the same partial
   round.
2. **Given** a roster being set up, **When** the app is reopened, **Then** the
   setup screen shows the same game and players.
3. **Given** a finished match, **When** the app is reopened, **Then** the
   winner screen is shown again, with its rematch and new-match actions.
4. **Given** the app is opened in two tabs, **When** a round is confirmed in
   one, **Then** the other shows it without a manual reload.
5. **Given** stored data could not be read and was discarded, **When** the app
   opens, **Then** the player sees once a Portuguese notice that the previous
   match could not be recovered, and then the initial screen.
6. **Given** the browser refuses to save (full or private storage), **When** an
   action succeeds on screen, **Then** the player is warned in Portuguese that
   the match may be lost if the app is closed, and play continues.

---

### User Story 3 - A wrong round can be fixed (Priority: P2)

Someone notices a mistake two rounds later. The player opens the round, fixes
it, and the totals update. Or the last round was entered twice and must go.

**Why this priority**: mistakes at the table are frequent, and the POC handled
them badly; but a match can still be played without it.

**Independent Test**: confirm three rounds, edit round 1 to different values,
check that its row and the totals change and rounds 2–3 do not; then remove the
last round and check it disappears.

**Acceptance Scenarios**:

1. **Given** confirmed rounds, **When** the player selects a round in the
   full history, **Then** it opens in the game's round entry, filled with its values.
2. **Given** an opened round, **When** the player saves a valid change,
   **Then** that round and the totals update and every other round is
   unchanged; an invalid change shows the game's reasons and changes nothing.
3. **Given** at least one confirmed round, **When** the player removes the last
   round and confirms, **Then** it disappears and totals update.
4. **Given** a round was being typed when another round was opened for fixing,
   **When** the fix is saved or cancelled, **Then** the round being typed is
   still there.

---

### User Story 4 - Play again (Priority: P2)

After the winner screen the group wants another match: with the same players
(rematch), or from scratch, possibly with another game.

**Why this priority**: groups rarely play one match; but the first match is
already complete without it.

**Independent Test**: finish a match, choose rematch, check the same game and
players are in setup with no rounds; finish again, choose new match, check the
game list appears.

**Acceptance Scenarios**:

1. **Given** the winner screen, **When** the player chooses rematch, **Then**
   setup opens with the same game and players and no rounds, and players can
   still be added, renamed, or removed before starting.
2. **Given** the winner screen, **When** the player chooses new match, **Then**
   the game list appears.
3. **Given** a match in setup or in progress, **When** the player chooses to
   abandon it and confirms, **Then** the match is discarded and the game list
   appears; cancelling keeps everything as it was.

---

### User Story 5 - Comfortable at night, with one hand (Priority: P2)

The phone sits on a dark table and is passed around. The app follows the
phone's dark or light setting, every tappable element is easy to hit, and
recording a round needs only the thumb.

**Why this priority**: required by Principle VI, and the most repeated
interaction is round entry; but correctness (US1–US2) comes first.

**Independent Test**: open every screen at a 360 px wide viewport in light and
dark system modes; check readable contrast, no horizontal scroll, every
tappable element at least 44×44 px, and the confirm-round action inside the
bottom part of the screen.

**Acceptance Scenarios**:

1. **Given** the device is in dark mode, **When** any screen is shown, **Then**
   it uses the dark theme; in light mode, the light theme.
2. **Given** a 360 px wide viewport, **When** any screen is shown, **Then**
   nothing scrolls horizontally except the full history, which scrolls inside
   itself while keeping player names visible.
3. **Given** the round-entry screen, **When** the phone is held in one hand,
   **Then** the confirm-round action stays in the lower part of the screen and
   reachable without scrolling.

---

### User Story 6 - A game brings its own round entry (Priority: P1)

A developer adding a game supplies, with the game's rules, the piece of screen
where a round of that game is entered. The shell places it, feeds it the
players and the current draft, and receives the entered round — without the
shell naming or checking any game.

**Why this priority**: each game enters a round differently (MECHE-MECHE in
Phase 5 will not look like a numeric form). Without this, the round-entry
screen cannot exist without breaking Principle II.

**Independent Test**: the two test-only games, each with a different round
entry, both play a full match through the same screens; the boundary test still
finds no game name or id comparison in the shell.

**Acceptance Scenarios**:

1. **Given** two registered games with different round entries, **When** a
   match of each is played, **Then** each shows its own entry and the shell
   screens around it are the same.
2. **Given** a game's round entry, **When** the player changes a value,
   **Then** the change is kept as the draft round, so it survives a reload.
3. **Given** a game's round entry is used to fix an old round, **When** it
   opens, **Then** it is filled with that round's stored values.

---

### Edge Cases

- **Empty registry**: until Phase 5 the shipped app has no game. The initial
  screen MUST say in Portuguese that no game is available yet, with no error
  and no broken layout.
- **Only one game**: the game list is still shown (one tap); it is not skipped,
  so the flow is the same whatever the registry size.
- **Stored draft the game no longer understands**: the round entry receives
  whatever was stored (FR-018a of spec 002) and MUST start from a clean entry
  instead of breaking the screen.
- **Rename during the match**: names in the table, the entry, and the winner
  screen update at once; duplicate names are rejected with the same message as
  in setup.
- **Every player ties**, including a match finished with zero rounds: the
  winner screen names every player as tied winners.
- **Long names** (up to 30 characters, spec 002 FR-022): never break the layout;
  they wrap or truncate with the full name still reachable.
- **Many rounds**: after 30+ rounds the compact standings are unchanged (one
  line per player), and the full history opens scrolled to the latest round.
- **Negative or large totals**: shown as the game computes them, with sign,
  never clipped.
- **Game chosen, then removed from the registry** (a stored match of a game
  that no longer exists): handled by the store's discard notice
  (`unknown_game`); the screen shows the notice once.
- **Double tap on confirm**: one tap confirms one round; a second quick tap
  MUST NOT add a duplicate round.
- **Destructive actions** (abandon match, remove last round) ask for
  confirmation; finishing asks through the finish confirmation (US1-8).

## Requirements *(mandatory)*

### Functional Requirements

#### Flow

- **FR-001**: The app MUST show exactly one screen per match state: the game
  list when there is no match, setup when `setting_up`, round entry with the
  table when `in_progress`, and the winner screen when `finished`. The screen
  MUST be derived from the stored match `status`, never from the number of
  rounds or players.
- **FR-002**: The game list MUST show every game in the registry, in registry
  order, by its display name. Choosing one creates the match.
- **FR-003**: Setup MUST allow adding, renaming, and removing players, and MUST
  show the game's minimum and maximum player count and the current count.
  Start MUST be unavailable outside those limits, with the reason shown.
- **FR-004**: The in-progress screen MUST show the current round number, the
  game's round entry, and the compact standings: one line per player with
  name, total, and position, as computed by the game. The standings MUST NOT
  grow with the number of rounds.
- **FR-004a**: One tap on the standings MUST open the full history: one row
  per player, one column per round plus a total column, player names pinned
  on the left, scrolled on open so the latest round is visible. Selecting a
  round there opens it for fixing (FR-005). Closing it returns to the round
  entry with the draft intact.
- **FR-005**: The in-progress screen MUST allow renaming a player, fixing any
  confirmed round, removing the last round, finishing, and abandoning the
  match. Adding or removing players after start MUST NOT be offered.
- **FR-006**: Finishing MUST go through a confirmation that shows the current
  table and offers continue or finish.
- **FR-007**: The winner screen MUST show the final table and the winners the
  game resolved; with more than one winner it MUST present a tie, naming every
  tied player. It MUST offer rematch and new match.
- **FR-008**: Abandoning a match and removing the last round MUST ask for
  confirmation; cancelling MUST change nothing.

#### Round entry supplied by the game

- **FR-009**: The game contract MUST let each game supply its own round-entry
  component alongside its rules. The shell MUST obtain it only through the
  registry entry of the match's game, and MUST NOT import, name, or compare any
  game (Principle II; enforced by the existing boundary test).
- **FR-010**: The shell MUST give the round entry the players, the current
  draft (or a stored round when fixing), and a way to report draft changes and
  to submit. The game's entry MUST NOT read or write storage itself; every
  change goes through the match store.
- **FR-011**: Every change in the round entry MUST be saved as the draft round,
  so a reload restores it (spec 002 FR-018a). Fixing an old round MUST NOT
  overwrite the draft of the round being typed.
- **FR-012**: The round entry MUST tolerate any stored draft value: one it
  cannot interpret is treated as an empty entry, without an error on screen.
- **FR-013**: Adding a game MUST still touch only its folder and the registry
  (spec 002 SC-001), now including its round entry.

#### Messages and state feedback

- **FR-014**: Every store error code (spec 002, match-store contract) MUST have
  Portuguese copy written by the shell; no English code is ever shown to the
  player. Round rejections MUST show the game's Portuguese messages as given.
- **FR-015**: When the store exposes a discard notice, the app MUST show it once
  in Portuguese, explaining that the previous match could not be recovered, and
  acknowledge it so it is not shown again.
- **FR-016**: When an operation reports that it was not persisted, the app MUST
  warn that progress may be lost if the app is closed, without blocking play.
  The warning MUST disappear after the next operation that persists.
- **FR-017**: Confirming a round MUST be protected against double submission:
  one gesture adds at most one round.
- **FR-018**: Changes saved in another tab MUST appear without a manual reload
  (spec 002 FR-021a).

#### Design system

- **FR-019**: The app MUST have a single set of named design tokens (color,
  spacing, type scale, radius) with a light and a dark value for every color.
  Components MUST use the tokens, not literal colors.
- **FR-020**: The app MUST offer a theme choice with three values —
  automatic, light, dark — reachable from every screen. Automatic (the
  default) follows the device preference and switches when it changes. The
  page MUST paint with the effective theme from the first frame, with no flash
  of the other theme, including when a stored choice overrides the device.
- **FR-020a**: The theme choice MUST be saved in browser storage under its own
  key in the app's namespace, separate from the match, carrying a
  `schemaVersion` (Principle VII). A missing, unreadable, or unknown stored
  value MUST fall back to automatic without any notice. Discarding,
  abandoning, or finishing a match MUST NOT change the theme choice, and a
  failure to save the choice MUST NOT block play (the choice still applies
  until the page is closed). Other open tabs pick up the choice on their next
  load; live sync between tabs is not required.
- **FR-021**: Text and essential UI MUST meet WCAG 2.2 AA contrast in both
  themes.
- **FR-022**: Every tappable element MUST have a touch area of at least
  44×44 px (Principle VI).
- **FR-023**: Layout MUST be designed for a 360 px wide viewport first and MUST
  NOT scroll horizontally, except the full history (FR-004a), which scrolls
  inside its own area with player names kept visible.
- **FR-024**: On the in-progress screen, the confirm-round action MUST stay in
  the lower part of the viewport, reachable without scrolling, on a 360×640
  viewport.
- **FR-025**: All user-visible copy MUST be Brazilian Portuguese and the page
  MUST declare `pt-BR` (Principle IX).

#### Island and build guards

- **FR-026**: Everything that reads match state MUST run in the browser only
  (Principle IV); the built page MUST NOT contain match-state markup. The
  existing static-build guard MUST be repointed from the probe to the real
  match island, not removed.
- **FR-027**: The disposable home page and the probe component from Phase 2
  MUST be replaced by the real app.
- **FR-028**: A check MUST fail when a component that reads the match store is
  rendered with a hydration mode other than browser-only (the rule deferred to
  this phase by spec 002, research D7).
- **FR-029**: The shipped artifact MUST NOT contain the test-only games
  (existing guard), and MUST NOT name any real game until Phase 5.
  *Note (spec 005)*: MECHE-MECHE, the first real game, ends the "MUST NOT
  name any real game until Phase 5" clause; the test-only games still never
  reach the artifact.
- **FR-029a**: In development mode only, a development-only page MUST offer
  the test-only games in its game list, so every screen can be played by hand
  on a phone before Phase 5; the production build MUST NOT contain that page. The mechanism MUST keep the shell free of game names and ids
  (Principle II) and MUST NOT change what the production build contains.
- **FR-030**: Before the first match state is shown, the app MUST show a
  neutral loading frame that does not look like the initial screen, so a
  reopened match never appears to have been lost.

### Key Entities

- **Screen**: one of four views (game list, setup, in progress, winner),
  determined only by the match `status` (or its absence).
- **Round entry**: the game-supplied part of the in-progress screen; receives
  players and a draft or stored round, reports draft changes and submissions.
- **Design token**: a named value (color, spacing, type, radius) with light and
  dark variants for colors; the only source of visual values in components.
- **Theme preference**: automatic, light, or dark; persisted per device,
  versioned, independent of the match.
- **Transient message**: a notice shown to the player that is not part of the
  match — discard notice, not-saved warning, operation error — never persisted
  by the shell.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A full match (pick game, 4 players, 5 rounds, finish) can be
  completed on a 360 px wide viewport using only taps and typing, with the
  winner shown matching the game's rules — verified for both test-only games.
- **SC-002**: Recording a round, after the values are entered, takes a single
  tap, and the confirm action is reachable without scrolling on a 360×640
  viewport.
- **SC-003**: Reloading the page at any point of a match restores the same
  screen and data, including a half-entered round, in 100% of the tested
  states (each of the four screens, plus a half-entered draft), with no frame
  of the initial screen shown first. A reload while a confirmed round is being
  fixed keeps every round and the draft; the unsaved fix itself is not
  restored.
- **SC-004**: 100% of tappable elements measure at least 44×44 px, and 100% of
  text meets AA contrast, in both themes on every screen.
- **SC-005**: 100% of store error codes and discard reasons have Portuguese
  copy; a test fails if one is added without copy.
- **SC-006**: Adding a third test-only game with a different round entry
  changes no file outside its folder and the registry.
- **SC-007**: No screen scrolls horizontally at 360 px wide, except inside the
  full history. With 7 players and 30 rounds, the compact standings still take
  exactly one line per player.
- **SC-008**: In automatic, changing the device theme switches the app without
  reload; choosing light or dark overrides the device and survives a reload;
  in every case the first paint already uses the effective theme.

## Assumptions

- **Branch**: the spec, plan, and tasks were committed on `develop`; the
  implementation happens on `feature/shell-screens`, branched from `develop`
  (constitution, Git conventions).
- **No history, no other settings, no multiple matches**: decided in spec 002
  (single current match, no history). The only persisted data this phase adds
  is the theme preference (FR-020a), under its own key; the match schema does
  not change.
- **No celebration effects are required**: the winner screen must announce the
  winner clearly; animation is optional and MUST respect reduced-motion.
- **Fixture games prove the screens**: with an empty production registry, the
  screens are verified by automated tests that use the test-only games, and a
  browser-level test is justified now that there is a real screen (deferred to
  this phase by spec 001's plan). For manual checks, the test-only games are
  playable in development mode only (FR-029a).
- **Fonts and icons are self-hosted or system**: no third-party CDN at runtime
  (Principle I, pure client-side), unlike the POC.
- **The POC stays untouched** and live; this phase does not cut over (Phase 6).
- **Out of scope**: MECHE-MECHE and its rules (Phase 5); cutover and POC
  removal (Phase 6); install-as-app/offline behavior; analytics.
