# Feature Specification: Cutover from the POC to the new app

**Feature Branch**: `feature/cutover`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Let's do the cutover now" (translated from
Portuguese). Phase 6 of the rewrite. The new app is live at
`https://facillit-games.vercel.app/`; the frozen POC is still served by GitHub
Pages from `main` at `https://marcelojjunior.github.io/facillit-games/`.

## Clarifications

### Session 2026-11-09

- Q: A match in progress in the POC cannot move to the new app (another
  address, so the browser keeps it apart). What do we do? → A: nothing; the
  old match is not shown or kept. (First answered "only tell the user"; after
  seeing the page the owner removed that sentence.)
- Q: Should the old address send people to the new one by itself? → A: yes, at
  once. If the script does not run, the page shows a fallback message and a
  button to the new address.
- Q: Which branch does Vercel publish to production after the cutover? → A:
  `main`, as the repository's convention says (the owner switches it in the
  Vercel dashboard).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The old address leads to the new app (Priority: P1)

Someone opens the old address (a bookmark, a shared link, a home-screen icon)
and lands in the new app without doing anything.

**Why this priority**: it is the cutover: one live app, at one address people
are sent to.

**Independent Test**: open the old address in a browser: it ends at the new
address. With scripts disabled, it shows the message and the button, and the
button opens the new address.

**Acceptance Scenarios**:

1. **Given** the old address, **When** it opens with scripts on, **Then** the
   browser goes to the new address at once, without leaving the old page in
   the back history.
2. **Given** the old address, **When** it opens with scripts off (or the
   redirect fails), **Then** it shows, in Portuguese, that the app moved and a
   button to the new address.
3. **Given** the fallback page, **When** it shows on a 360 px phone, **Then**
   it fits without sideways scrolling and the button is at least 44×44 px.

### User Story 2 - One source of truth after the cutover (Priority: P2)

The repository stops carrying the POC: `main` holds the new app, the POC files
are gone, and the rules that protected them are lifted.

**Why this priority**: keeps the repository honest after the move; nothing
user-visible depends on it.

**Independent Test**: the POC's `script.js` and `style.css` no longer exist;
the guards that excluded them from the tools are gone; the docs describe
`main` as production.

**Acceptance Scenarios**:

1. **Given** the cutover merged, **When** the repository root is listed,
   **Then** `script.js` and `style.css` are gone and `index.html` is the
   redirect page.
2. **Given** the docs, **When** read, **Then** they no longer call the POC
   frozen or `main` closed, and say that `main` is production.

### Edge Cases

- **A match in progress in the POC**: lost at the new address (another
  origin). Nothing is migrated or announced (owner's decision).
- **Deep paths of the old address** (e.g. `/facillit-games/style.css`): they
  stop existing; GitHub Pages' own "not found" page applies.
- **Old home-screen icons**: they open the old address, which redirects.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page at the old address MUST send the browser to
  `https://facillit-games.vercel.app/` as soon as it loads, replacing the
  current history entry.
- **FR-002**: The same page MUST show, without depending on scripts, a
  Portuguese message that the app moved and a button (a plain link) to the new
  address.
- **FR-003**: The page MUST be self-contained: no other file, font, script, or
  stylesheet from any host; at 360 px it fits without sideways scrolling and
  the button is at least 44×44 px.
- **FR-004**: The POC's `script.js` and `style.css` MUST be removed, and the
  tool exclusions and tests that protected the frozen POC MUST be replaced by
  a test of the redirect page (FR-001, FR-002, FR-003).
- **FR-005**: GitHub Pages MUST serve the root files as they are (no site
  generator processing the repository's other files).
- **FR-006**: The docs (README, AGENTS.md, CLAUDE.md) MUST describe the state
  after the cutover: no frozen POC, `main` is production, releases go
  `develop` → `main`.
- **FR-007**: The cutover reaches `main` as a fast-forward of `develop`
  (constitution: `main` stays an ancestor of `develop` until the cutover).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the old address ends at the new address in 100% of
  tries with scripts on.
- **SC-002**: With scripts off, the message and a working button show.
- **SC-003**: After the cutover, the repository has no POC file and no tool
  exclusion for one.

## Assumptions

- **Vercel production branch**: switched to `main` by the owner in the Vercel
  dashboard after the merge; this repository holds no Vercel setting for it.
- **The constitution** says "until the cutover" for the POC rules; those rules
  lapse by their own wording, so the constitution text is not amended here.
- **Out of scope**: migrating POC matches, a custom 404 page, link-preview tags
  on the old address.
