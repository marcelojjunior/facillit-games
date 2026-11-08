# Feature Specification: Game-style visual identity

**Feature Branch**: `feature/ui-redesign`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Game-style visual identity for the shell screens
(spec 004, built on spec 003). Restyle every existing screen and overlay so the
app looks like a casual mobile game, without changing any flow, game contract,
or persisted match schema." The owner asked for the change after using the
Phase 4 screens ("I want it to look like a mobile game"), shared reference
images of casual-game UI kits, and approved a clickable prototype. The
decisions it settled are in the input; the prototype is kept next to this spec
as [`prototype.html`](./prototype.html).

## Note on the reader of this spec

The player is the same as in spec 003: a group around a table, one phone passed
from hand to hand, often at night. What changes is how the app feels: today it
reads as a neutral utility; the owner wants it to read as a game, because it is
used while playing one.

Every flow, screen, message meaning, and guarantee of
[spec 003](../003-shell-screens/spec.md) stays as it is. This spec changes how
those screens look, adds a mascot and decorative illustration, and replaces one
decision of spec 003 (research D8: system font only).

## Clarifications

### Session 2026-11-08 (owner review of the implemented screens)

- Q: Should the theme control keep three options (automatic, light, dark)?
  → A: No. One button that switches between light and dark. With nothing
  chosen, the app follows the device; if the device does not say, it is light.
  Once the player taps it, the tapped theme stays. This replaces the
  three-option control of spec 003 FR-020 (the stored format does not change:
  "nothing chosen" is the stored `auto` or no value; a tap stores `light` or
  `dark`).
- Q: The confirm-round button sits to the left on wide screens. → A: It must
  be centered at any width (bug found by the owner on a desktop browser).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The app feels like a casual mobile game (Priority: P1)

A player opens the app at the table and it looks like the games on their phone:
big, rounded, colorful buttons that look raised and sink when tapped, a rounded
playful typeface, and bright colors.

**Why this priority**: this is the whole request. Without it nothing else in
this spec matters.

**Independent Test**: open every screen and overlay of spec 003 and compare
with the approved prototype: buttons, typeface, palette, and backgrounds follow
it; every flow of spec 003 still works the same way.

**Acceptance Scenarios**:

1. **Given** any screen, **When** it is shown, **Then** every button is drawn
   as a raised, rounded, colored button with a darker lower edge and a light
   highlight on top, in the palette of the prototype.
2. **Given** any button, **When** the player presses it, **Then** it visibly
   sinks while pressed and comes back when released.
3. **Given** any screen, **When** text is shown, **Then** it uses the rounded
   game typeface chosen by the owner, for titles and for running text.
4. **Given** the flows of spec 003 (pick a game, set up players, play rounds,
   fix a round, finish, rematch, abandon), **When** they are performed,
   **Then** they behave exactly as before; only their appearance changed.

---

### User Story 2 - Comfortable in daylight and at night (Priority: P1)

In the light theme the app sits on a bright sky with hills and clouds; in the
dark theme on a deep night sky with stars. Text stays easy to read in both, the
buttons keep their colors, and the chosen theme shows from the very first
frame.

**Why this priority**: the app is used at night as often as by day
(constitution, Principle VI). A game look that is hard to read in one theme
fails the main use.

**Independent Test**: show every screen in both themes at 360 px wide; contrast
of every text and essential boundary meets WCAG AA; switching theme changes the
background scene and surfaces but not the button colors.

**Acceptance Scenarios**:

1. **Given** the light theme, **When** any screen is shown, **Then** the
   background is a daytime sky scene.
2. **Given** the dark theme, **When** any screen is shown, **Then** the
   background is a night sky scene with stars, and no card, sheet, or dialog
   surface is lighter than the lightest color of the night sky.
3. **Given** either theme, **When** a colored button is shown, **Then** it has
   the same color as in the other theme.
4. **Given** a stored theme choice, **When** the app opens, **Then** the first
   frame already shows that theme's scene (spec 003 FR-020 still holds).

---

### User Story 3 - A mascot gives the app a face (Priority: P2)

A friendly mascot, a smiling white die with red pips and little arms, greets the
group on the game list, appears next to a round's problem to say what is
missing, and wears a crown on the winner screen.

**Why this priority**: it gives the app its personality, but a match can be
played without it.

**Independent Test**: reach the game list, an invalid round confirmation, and
the winner screen; the mascot appears in each, and nowhere it would cover a
control or text.

**Acceptance Scenarios**:

1. **Given** the game list, **When** it is shown, **Then** the mascot greets the
   player next to a short Portuguese greeting.
2. **Given** a rejected round, **When** the reasons are shown, **Then** the
   mascot appears beside them.
3. **Given** the winner screen, **When** it is shown, **Then** the mascot
   appears wearing a crown.
4. **Given** any screen with the mascot, **When** it is shown at 360 px wide,
   **Then** the mascot covers no button, input, or text.

---

### User Story 4 - Scores read as a game scoreboard (Priority: P2)

Totals show as a points badge ("30 pts") and positions as gold, silver, and
bronze medals, so the standings read like a game scoreboard. Points are never
drawn as coins or money.

**Why this priority**: the owner pointed out that a coin icon reads as "30
coins", not "30 points". It is a correctness issue of the visual language, but
the standings still work without it.

**Independent Test**: play a few rounds of each test game, including a negative
total and a tie for first; every total shows as "N pts" with its sign, and each
position shows the matching medal.

**Acceptance Scenarios**:

1. **Given** the standings, **When** a total is shown, **Then** it reads as a
   number followed by "pts", with no coin or currency symbol.
2. **Given** a negative total, **When** it is shown, **Then** the sign is kept
   (for example "-25 pts").
3. **Given** positions 1, 2, and 3, **When** they are shown, **Then** they carry
   a gold, silver, and bronze medal; positions from 4 on carry a plain badge
   with the number.
4. **Given** a tie, **When** players share a position, **Then** they share the
   same medal (two golds for a tie for first).

---

### User Story 5 - The winner is celebrated (Priority: P3)

The winner screen opens with a ribbon banner, the crowned mascot, the winners'
names, a podium of the top places, and falling confetti.

**Why this priority**: it is the moment the group remembers, but the result is
already clear without the celebration.

**Independent Test**: finish a match with a single winner, one with a tie for
first, and one with two players; then repeat with the device asking for reduced
motion.

**Acceptance Scenarios**:

1. **Given** a finished match, **When** the winner screen opens, **Then** it
   shows a ribbon banner, the crowned mascot, the winner's name, and a podium
   of the top three places.
2. **Given** a tie for first, **When** the winner screen opens, **Then** every
   tied player is named as a shared win (spec 003 FR-007 still holds) and the
   podium shows them on the same top step.
3. **Given** a match of two players, **When** the winner screen opens, **Then**
   the podium shows two steps.
4. **Given** the device asks for reduced motion, **When** the winner screen
   opens, **Then** there is no confetti and the mascot does not move; all
   information is still shown.

---

### Edge Cases

- **Long names** (30 characters): on medals rows, the podium, and the points
  badge rows they truncate with the full name still reachable, as in spec 003;
  the badge and medal never shrink below legibility.
- **Large or negative totals** (e.g. "-125 pts", "1250 pts"): the badge grows
  to fit, never clips, never wraps the number.
- **Seven players**: the standings keep one line per player (spec 003 SC-007);
  the podium shows only the top three places, everyone else stays in the
  standings below it.
- **Ties beyond first**: players sharing second share silver; the next position
  skips as before (1, 2, 2, 4), and position 4 gets the plain badge.
- **The game font fails to load** (slow network, blocked download): the app
  shows a rounded fallback typeface with the same layout; nothing overlaps or
  clips. Checked by hand with the font request blocked (no automated check).
- **Reduced motion**: no confetti, no mascot bobbing, no button sink animation
  beyond an instant pressed state; every element still visible.
- **Many games in the list**: the hills illustration stays behind the list and
  never hides a game; the list scrolls over it.
- **Empty registry** (production until Phase 5): the game list still shows the
  mascot and the "no game available yet" message in the new style.
- **Overlays** (history, fix sheet, rename, finish, abandon, remove last round,
  discard notice, not-saved warning): all follow the new style; none loses a
  control or message it has today.

## Requirements *(mandatory)*

### Functional Requirements

#### Scope guard

- **FR-001**: Every flow, screen, overlay, message meaning, and stable test hook
  of spec 003 MUST keep working unchanged; this feature changes appearance
  only, plus the mascot and illustrations it adds.
- **FR-002**: The game contract, the persisted match schema, and the theme
  preference schema MUST NOT change.
- **FR-003**: The shell MUST still name no game; the mascot and illustrations
  belong to the shell, not to any game.

#### Look and feel

- **FR-004**: Buttons MUST be drawn as raised, rounded, saturated buttons with
  a darker lower edge and a lighter top highlight, and MUST visibly sink while
  pressed.
- **FR-005**: The palette MUST offer green, blue, red, orange, yellow, and
  purple, each with a base, an edge, and a highlight tone, as named design
  tokens. Each action keeps a consistent meaning by color across screens
  (for example confirm and rematch in green, destructive actions in red).
- **FR-006**: All text MUST use the owner's chosen rounded game typeface for
  titles and running text, with a rounded fallback when it is unavailable.
- **FR-007**: The typeface MUST be served by the app itself; no request to a
  third-party font or asset host at runtime (Principle I). It replaces spec 003
  research D8 ("system font"), which is updated in the same change.
- **FR-008**: The light theme background MUST be a daytime sky scene (sky
  gradient, hills, clouds); the dark theme background MUST be a night sky
  scene (deep navy, stars). Surfaces (cards, sheets, dialogs) follow the theme;
  colored buttons keep the same colors in both themes.

#### Mascot and illustration

- **FR-009**: The app MUST have an original mascot: a smiling white die with red
  pips and little arms, as in the approved prototype. It MUST appear on the
  game list greeting, beside the reasons of a rejected round, and wearing a
  crown on the winner screen.
- **FR-010**: The mascot and illustrations MUST be decorative to assistive
  technology unless they carry information, MUST cover no control or text,
  and MUST NOT move when the device asks for reduced motion.

#### Scoreboard

- **FR-011**: Totals MUST be shown as a points badge with the number and the
  Portuguese abbreviation "pts", keeping the sign of negative totals, and
  MUST NOT use a coin or currency image.
- **FR-012**: Positions 1, 2, and 3 MUST be shown as gold, silver, and bronze
  medals; later positions as a plain numbered badge. Players sharing a
  position share its medal.

#### Winner celebration

- **FR-013**: The winner screen MUST show a ribbon banner, the crowned mascot,
  the winners' names (a tie still named as a shared win), and a podium of the
  top three places (fewer steps when there are fewer players).
- **FR-014**: The winner screen MAY show falling confetti; it MUST NOT appear
  when the device asks for reduced motion.

#### Guarantees carried over from spec 003

- **FR-015**: Text and essential UI MUST meet WCAG 2.2 AA contrast in both
  themes, checked from the design tokens, including text on every colored
  button; where white text fails on a color (orange, yellow), the text MUST be
  dark.
- **FR-016**: Every tappable element MUST stay at least 44×44 px; no screen MAY
  scroll horizontally at 360 px except inside the full history; the
  confirm-round action MUST stay in thumb reach without scrolling at 360×640.
- **FR-017**: The theme MUST still apply before the first frame, background
  scene included.
- **FR-017a**: The theme control MUST be a single button, on every screen, that
  switches between light and dark. With no choice stored (or the stored
  `auto`), the theme follows the device and changes with it; when the device
  gives no preference, it is light. A tap stores the theme it switched to
  (`light` or `dark`), which then wins over the device, survives a reload, and
  still applies for the page's lifetime if saving fails. The button's
  accessible name says what it does ("Mudar para o tema escuro" / "claro").
  The stored format of spec 003 does not change. Replaces the three-option
  control of spec 003 FR-020.
- **FR-017b**: The confirm-round button MUST be centered in its bar at any
  viewport width.
- **FR-018**: Components MUST still use design tokens only, never literal
  colors (spec 003 FR-019).
- **FR-019**: All user-visible copy, including the mascot's greeting and the
  "pts" label, MUST be Brazilian Portuguese and live with the rest of the
  shell's copy.

### Key Entities

- **Color token family**: a named color (green, blue, red, orange, yellow,
  purple) with base, edge, and highlight tones; the same in both themes.
- **Scene**: the background of the app for a theme: daytime sky with hills
  and clouds (light) or night sky with stars (dark).
- **Mascot**: the shell's character, a die; appears in three moments
  (greeting, round problem, winner) and is never tied to a game.
- **Points badge**: how a total is shown: number plus "pts".
- **Medal**: how a position is shown: gold, silver, bronze, or a plain badge.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner approves screenshots of every screen and overlay, in
  both themes at 360 px wide, as matching the approved prototype's direction.
- **SC-002**: 100% of the automated checks of spec 003 still pass with no
  change to what they assert (flows, persistence, 44 px targets, horizontal
  scroll, confirm in reach, contrast, theme before first paint). The one
  allowed adjustment is how a check reads a displayed total, because FR-011
  changes its format ("190" becomes "190 pts"); the expected numbers never
  change.
- **SC-003**: 100% of text-on-color and text-on-surface pairs meet WCAG AA in
  both themes, including every colored button.
- **SC-004**: The app makes zero runtime requests to hosts other than its own.
- **SC-005**: The added font weighs at most 80 kB in total, and the app's
  script for the screens stays within the 80 kB (compressed) budget of spec
  003.
- **SC-006**: With reduced motion requested, 0 animated elements remain on any
  screen, and no information is lost.
- **SC-007**: In every screen with standings, 100% of totals read as "N pts"
  and 0 coin or currency images appear.

## Assumptions

- **Branch**: `feature/ui-redesign`, branched from `develop` after spec 003 was
  merged; the spec is committed before implementation (Principle VIII).
- **The prototype is the reference, not the code**: colors, sizes, and shapes
  are taken from it as direction; exact values are settled in the plan and may
  shift where contrast requires it.
- **Typeface**: Baloo 2, chosen by the owner over Fredoka and Lilita One; it is
  under an open font license, which allows self-hosting. Weights limited to
  what the screens use, Latin subset (Portuguese accents included).
- **Mascot**: original artwork drawn for this project (the die), chosen by the
  owner over an owl and a playing card. Reference images the owner shared were
  used for style only; no asset, character, or identity was copied from them.
- **Copy**: meanings of every message stay as in spec 003; only new strings
  are added (the greeting, "pts").
- **Out of scope**: MECHE-MECHE and any game (Phase 5), sounds, haptics, new
  screens or flows, a logo redesign beyond the title treatment, cutover
  (Phase 6).
