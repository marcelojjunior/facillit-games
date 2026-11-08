---

description: "Task list for 004-game-style-ui"
---

# Tasks: Game-style visual identity

**Input**: Design documents from `specs/004-game-style-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/visual-tokens.md](./contracts/visual-tokens.md),
[contracts/ui-parts.md](./contracts/ui-parts.md),
[quickstart.md](./quickstart.md), [prototype.html](./prototype.html)
(the approved visual reference)

**Tests**: included and written **before** the code in each story. The spec's
success criteria are automated checks (SC-002 to SC-007); SC-001 is the
owner's visual approval.

**Branch**: `feature/ui-redesign`, branched from `develop`.

**Organization**: by user story in priority order — P1: US1, US2; P2: US3,
US4; P3: US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (separate files, no pending dependency)
- **[Story]**: the user story the task belongs to (US1–US5)
- Paths are relative to the repository root

## Rules that apply to every task in this list

- **Appearance only.** No change to flows, the game contract
  (`src/shell/game/contract.ts`), `src/shell/match/**`, or
  `src/shell/theme/preference.ts` (FR-001, FR-002).
- **Spec 003 tests keep what they assert** (SC-002). A test may change only a
  selector that named a removed class or token; never an expectation.
- **The shell never names a game; `src/` never imports `tests/`;** only
  `client:only="react"` (spec 003 rules stand).
- **Tokens only.** No literal color in `src/shell/ui/`, `src/components/`, or
  `tests/fixtures/games/` (FR-018). Colors live in `src/styles/tokens.ts` and
  `src/styles/global.css`.
- **Every tappable element ≥ 44×44 px**; 3D button labels bold ≥ 19 px
  (research D3).
- **No runtime request to another host** (Principle I, FR-007).
- **English in the repo; pt-BR only in `src/shell/ui/copy.ts`**, game names,
  and round-entry labels (Principle IX).
- `pnpm build` before `pnpm test`. Before each commit: `pnpm build && pnpm test
  && pnpm typecheck && pnpm lint && pnpm format:check`, all green. Mark each
  finished task `[X]`. Commits `<type>(<scope>): <imperative>`, no AI
  attribution.

---

## Phase 1: Setup

- [X] T001 Run `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` on `feature/ui-redesign` and confirm all pass before any change (baseline)
- [X] T002 Add the font (research D1): download `baloo-2-latin-wght-normal.woff2` from `https://cdn.jsdelivr.net/npm/@fontsource-variable/baloo-2@5.3.0/files/baloo-2-latin-wght-normal.woff2` into `src/assets/fonts/` (expect 33 188 bytes) and Baloo 2's SIL Open Font License text into `src/assets/fonts/OFL.txt` (from the same package's `LICENSE`); this is a build-time step done once and committed, never a runtime request

**Checkpoint**: baseline green; font file in the repo.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: tokens, font, button classes, scene, and the motion rule. Every
story builds on them.

### Tests first

- [X] T003 [P] Rewrite `src/styles/tokens.test.ts` per `contracts/visual-tokens.md` (expected to fail first): `themed` tokens have `#rrggbb` or `#rrggbbaa` light and dark values and appear in both the `@theme` and `[data-theme='dark']` blocks of `src/styles/global.css` with the same values; `fixed` tokens appear in `@theme` only and never in the dark block; `textPairs` ≥ 4.5:1, `largeTextPairs` ≥ 3:1, `boundaryPairs` ≥ 3:1 in both themes (fixed tokens use their one value; alpha is ignored only for `cloud`/`star`, which are in no pair); names carry no numeric suffix; the literal-color scan keeps scanning `src/shell/ui`, `src/components` (`.tsx` and `.astro`), and `tests/fixtures/games`
- [X] T004 [P] Extend `tests/static-build.test.ts` (expected to fail first): a `.woff2` file exists under `dist/` and all `.woff2` files together are ≤ 80 kB; `dist/index.html` has a `<link rel="preload" as="font" type="font/woff2" crossorigin>` to it; no `http://` or `https://` URL appears in any `dist/` `.html` or `.css` file except `http://www.w3.org/2000/svg`; the sum of gzip sizes of `dist/_astro/*.js` is ≤ 80 kB (SC-004, SC-005, research D8); `dist/index.html` contains `data-testid="scene"` (research D4)
- [X] T005 [P] Add the browser command `emulateReducedMotion` in `vitest.config.ts` (beside `emulateColorScheme`, calling `context.page.emulateMedia({ reducedMotion })` with `'reduce' | 'no-preference'`) and its typing in `tests/browser-setup.ts` (research D8)

### Implementation

- [X] T006 Restructure `src/styles/tokens.ts` per `contracts/visual-tokens.md`: export `themed` (`surface`, `surface-raised`, `surface-sunken`, `ink`, `ink-muted`, `line`, `accent`, `danger`, `sky-top`, `sky-bottom`, `hill-back`, `hill-front`, `cloud` (transparent in dark), `star` (transparent in light)), `fixed` (`green`, `blue`, `red`, `orange`, `yellow`, `purple` each with `-edge` and `-hi`; `on-color`, `on-warm`, `gold`, `silver`, `bronze`, `die`, `die-edge`, `pip`, `face`), and the three pair lists; start from the prototype's values in `specs/004-game-style-ui/prototype.html` and darken until every pair passes (research D3: e.g. green near `#2e9b38`); remove `accent-ink` and `danger-ink`
- [X] T007 Rewrite `src/styles/global.css`: `@font-face` for "Baloo 2" (`font-weight: 400 800; font-display: swap;` Latin `unicode-range`, `src: url('../assets/fonts/baloo-2-latin-wght-normal.woff2') format('woff2')`); `@theme` with `--color-*: initial;`, every fixed token, the light value of every themed token, `--font-sans: "Baloo 2", ui-rounded, "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif`, radius and spacing tokens kept; `[data-theme='dark']` with the dark themed values only; `@layer components` with `.btn-3d` and `.btn-green|blue|red|purple|orange|yellow|plain` per `contracts/ui-parts.md` and research D10 (gradient `--btn-hi` → `--btn` from 48 %, bottom edge shadow, top gloss, `min-height: 3rem`, label `font-weight: 800; font-size: 1.1875rem` or larger, `:active` `translateY(4px)` with a shorter edge, `:disabled` flat with `opacity: .5` and no sink, warm variants use `on-warm` text); body background = `sky-bottom` (the scene paints over it); and the global reduced-motion rule (research D7); make T003 pass
- [X] T008 Add the font preload to `src/layouts/BaseLayout.astro` (import the file with Vite `?url` so the preload matches the hashed asset, `<link rel="preload" as="font" type="font/woff2" crossorigin>`), and amend `specs/003-shell-screens/research.md` D8 with a line "Superseded for the typeface by spec 004 research D1 (self-hosted Baloo 2)" (Principle VIII)
- [X] T009 Create `src/components/Scene.astro` per research D4 and `contracts/ui-parts.md` (`data-testid="scene"`, `aria-hidden="true"`, `position: fixed; inset: 0; z-index: -1; pointer-events: none`, sky gradient from `sky-top` to `sky-bottom`, clouds in `cloud`, two hills in `hill-back`/`hill-front` at the bottom, stars in `star`; token utilities only, shapes from the prototype) and render it first inside `<body>` in `src/layouts/BaseLayout.astro`; run `pnpm build` and make T004 pass
- [X] T010 Map `src/shell/ui/parts/styles.ts` to the new classes (`primaryButton` → `btn-3d btn-green`, `secondaryButton` → `btn-3d btn-plain`, `iconButton` → `btn-3d btn-plain` square ≥ 44×44, a new `dangerButton` → `btn-3d btn-red`, `textInput` restyled with `surface-raised`, `line`, `rounded-control`), replace every use of the removed `accent-ink`/`danger-ink` tokens and inline danger buttons in `src/shell/ui/**` with these, and run every spec 003 test: all must pass with no expectation changed (SC-002); then measure the island JS (sum of gzip sizes of `dist/_astro/*.js`) and note it in the commit message: above 78 kB, apply research D11 before going on

**Checkpoint**: new tokens, font, buttons, and scene in place; every spec 003
test green.

---

## Phase 3: User Story 1 — The app feels like a casual mobile game (P1) 🎯 MVP

**Goal**: every screen and overlay in the game style of the prototype.

**Independent Test**: every flow of spec 003 still passes; each screen matches
the prototype's direction.

### Tests first

- [ ] T011 [US1] Create `src/shell/ui/look.browser.test.tsx` (expected to fail first): on the game list, setup, in progress, each overlay, and the winner screen (seeded with the test games), every visible `button` inside `data-testid="match-app"` either has class `btn-3d` or belongs to a game's round entry (`data-testid="round-entry"` or the fix sheet's entry) or is a theme-control option; the computed `font-family` of the screen heading starts with `"Baloo 2"` and `document.fonts.check('700 20px "Baloo 2"')` is true after `document.fonts.ready` (FR-004, FR-006)

### Implementation

- [ ] T012 [P] [US1] Restyle the shared header in `src/shell/ui/MatchApp.tsx` (title "Facillit Games" white with a `blue-edge` outline via `text-shadow` utilities) and `src/components/LoadingFrame.astro` to match, and `src/shell/ui/parts/ThemeControl.tsx` as a raised segmented control (`surface-raised` with a `line` edge, selected option `btn-blue`-style), every option ≥ 44×44
- [ ] T013 [P] [US1] Restyle `src/shell/ui/screens/GameList.tsx`: each game option as a raised card (`surface-raised`, `line` bottom edge, `rounded-card`) with a colored icon badge and a green play disc, as in the prototype; empty state as a raised card
- [ ] T014 [P] [US1] Restyle `src/shell/ui/screens/Setup.tsx`: raised roster rows, add and start as `btn-green`, abandon as `btn-plain`, error text in `danger`
- [ ] T015 [US1] Restyle `src/shell/ui/screens/InProgress.tsx` and `src/shell/ui/parts/ConfirmBar.tsx`: round title as a purple ribbon (`bg-purple`, `on-color`, `purple-edge` bottom edge), finish as a `btn-red` button, more as a `btn-plain` square, "Ver histórico" (`open-history`) as a small `btn-blue`, standings card raised, confirm as a full-width `btn-3d btn-green`, the rejection box as a raised card with a `red-edge` bottom edge
- [ ] T016 [P] [US1] Restyle the overlays: `src/shell/ui/parts/Dialog.tsx` (raised card, `rounded-card`, bold heading), `History`/`ScoreTable.tsx` (round header buttons as small `btn-blue`, pinned column on `surface-raised`), `FixSheet.tsx`, `RenameDialog.tsx`, `AbandonDialog.tsx` and the remove-last dialog (destructive = `btn-red`, cancel = `btn-plain`), `Notices.tsx` (raised cards; not-saved with a `red-edge` edge; the discard notice's dismiss button as `btn-plain` ≥ 44×44)
- [ ] T017 [P] [US1] Restyle the fixture entries `tests/fixtures/games/highest-wins/RoundEntry.tsx` (selected place = `btn-3d btn-blue`, others `btn-3d btn-plain`) and `tests/fixtures/games/lowest-wins/RoundEntry.tsx` (inputs with the shared input look), keeping every label, test hook, and 44 px target; make T011 pass; measure the island JS again (research D11)

**Checkpoint**: the whole app in the game style; MVP for review.

---

## Phase 4: User Story 2 — Comfortable in daylight and at night (P1)

**Goal**: both scenes right from the first frame and legible.

**Independent Test**: tokens test green; build shows the scene; dark mode on a
phone shows the night scene at once.

- [ ] T018 [US2] Extend `tests/static-build.test.ts` (expected to pass after T009, and to fail if the scene ever moves into the island): the scene markup sits before the island's fallback in `dist/index.html` (the literal-color scan of T003 already covers `src/components/*.astro`); and in `src/styles/tokens.test.ts` assert `cloud` is fully transparent in dark and `star` fully transparent in light (research D4)
- [ ] T019 [US2] Tune the dark surfaces in `src/styles/tokens.ts` and `src/styles/global.css` so cards and dialogs on the night scene do not glare: no surface lighter than the scene's lightest stop, and `ink` on every surface still ≥ 4.5:1, and verify on `/dev/test-games` in both themes at 360×640 against the prototype

**Checkpoint**: day and night scenes both approved for legibility.

---

## Phase 5: User Story 3 — A mascot gives the app a face (P2)

**Goal**: the die greets, helps with a rejected round, and celebrates.

**Independent Test**: the mascot appears in the three moments and covers no
control.

### Tests first

- [ ] T020 [US3] Create `src/shell/ui/mascot.browser.test.tsx` (expected to fail first): `data-testid="mascot"` is visible on the game list (also with an empty registry), inside the confirm bar after an invalid confirm (and gone after a successful one), and on the winner screen with `data-crown="true"`; on each, the mascot's bounding box intersects no visible `button`, `input`, or the heading; the mascot is `aria-hidden` (FR-009, FR-010)

### Implementation

- [ ] T021 [P] [US3] Create `src/shell/ui/parts/Mascot.tsx` per `contracts/ui-parts.md` and research D5: the die from `specs/004-game-style-ui/prototype.html` (`#m-dado`), token fills only (`die`, `die-edge`, `pip`, `face`, `red`, `red-hi`, `blue-edge`), optional crown (`gold`, `yellow-edge`, `red`, `blue`, `green`), props `{ crown?: boolean; className?: string }`, `aria-hidden="true"`, `data-testid="mascot"`, `data-crown` when crowned, a bob animation class (off under reduced motion via the global rule)
- [ ] T022 [US3] Add the greeting copy to `src/shell/ui/copy.ts` (e.g. headline "Bora jogar?" and "Escolha o jogo da mesa."), render the mascot with a speech bubble in `src/shell/ui/screens/GameList.tsx`, a 44 px mascot inside the rejection box in `src/shell/ui/screens/InProgress.tsx`, and the crowned mascot on `src/shell/ui/screens/Winner.tsx`; make T020 pass

**Checkpoint**: the app has a face.

---

## Phase 6: User Story 4 — Scores read as a game scoreboard (P2)

**Goal**: "N pts" badges and medals, never coins.

**Independent Test**: totals read "N pts" with sign; medals per position,
shared on ties.

### Tests first

- [ ] T023 [US4] Create `src/shell/ui/scoreboard.browser.test.tsx` (expected to fail first): in the standings of an in-progress `lowest-wins` match with a negative total, every `data-testid="points"` text matches `^-?\d+ pts$` and the negative one reads `"-25 pts"`; for positions 1, 2, 2, 4 the medals are `gold`, `silver`, `silver`, `plain` (`data-medal`), with text `"1º"`, `"2º"`, `"2º"`, `"4º"`; a tie for first shows two `gold`; no `img` and no element whose class or text mentions coin/moeda inside `data-testid="standings"` (FR-011, FR-012, SC-007)

### Implementation

- [ ] T024 [P] [US4] Create `src/shell/ui/parts/PointsBadge.tsx` and `src/shell/ui/parts/Medal.tsx` per `contracts/ui-parts.md` (badge on `purple` with `on-color`, label from a new `labels.points: 'pts'` in `src/shell/ui/copy.ts`, number never wraps; medal `gold|silver|bronze` with `on-warm` text, `plain` on `surface-sunken` with `ink`)
- [ ] T025 [US4] Use them in `src/shell/ui/parts/Standings.tsx` (medal instead of the plain position, badge instead of the plain total; still one line per player and full name in `title`); make T023 pass and keep `flow`, `fix`, and `persistence` browser tests green (they read totals from `standing-row` text, which now ends in " pts" — adjust only the regex anchors, never the expected numbers)

**Checkpoint**: the scoreboard reads as a game.

---

## Phase 7: User Story 5 — The winner is celebrated (P3)

**Goal**: ribbon, crowned mascot, podium, confetti, motion-safe.

**Independent Test**: single winner, tie for first, two players, and reduced
motion all render as specified.

### Tests first

- [ ] T026 [P] [US5] Create `src/shell/ui/parts/podium.test.ts` (expected to fail first) covering every row of the podium table in `specs/004-game-style-ui/data-model.md` (positions 1,2,3,4 → three steps; 1,1,3 → two steps, first with two players; 1,2,2 → second step with two players; two players tied → one step; two players → two steps) and that players inside a step keep roster order
- [ ] T027 [US5] Create `src/shell/ui/winner.browser.test.tsx` (expected to fail first): a finished match shows a ribbon heading, `data-testid="podium"` with the right number of `podium-step`s for a single winner, a tie for first (one step with both names; the shared-win text of spec 003 still present), and two players; `data-testid="confetti"` is visible; with `commands.emulateReducedMotion('reduce')`, confetti is not displayed and `document.getAnimations()` is empty, while names, podium, and actions are still visible; reset to `'no-preference'` after (FR-013, FR-014, SC-006)

### Implementation

- [ ] T028 [P] [US5] Create `src/shell/ui/parts/podium.ts` (`podiumSteps(view)` per research D6) and `src/shell/ui/parts/Podium.tsx` (steps laid out second–first–third, heights from the prototype, each with `Medal`, every name truncated with `title`, and `PointsBadge`); make T026 pass
- [ ] T029 [P] [US5] Create `src/shell/ui/parts/Confetti.tsx` (research D11: one element with CSS-generated pieces, no per-piece JavaScript; deterministic pieces in family colors, `aria-hidden`, `data-testid="confetti"`, `motion-reduce:hidden`, falling animation in `global.css`)
- [ ] T030 [US5] Rebuild `src/shell/ui/screens/Winner.tsx`: red ribbon heading (tie heading kept from spec 003), crowned mascot, `winner-names` kept, `Podium`, standings, `Confetti`, rematch `btn-green` and new match `btn-blue` as large buttons; make T027 pass and keep `flow` and `replay` browser tests green

**Checkpoint**: every story done.

---

## Phase 8: Polish & cross-cutting

- [ ] T031 [P] Update `AGENTS.md` pitfall 11: a game's `RoundEntry` uses the shell's button classes (`btn-3d` plus a color modifier) and token utilities; link `specs/004-game-style-ui/contracts/ui-parts.md`
- [ ] T032 [P] Update `README.md` "Current state" (game-style UI, self-hosted Baloo 2 under OFL in `src/assets/fonts/`) and record in `specs/004-game-style-ui/research.md` any decision changed during implementation, updating `spec.md` where reality contradicted it (Principle VIII)
- [ ] T033 Record in `specs/004-game-style-ui/research.md` D8 the measured island JS (gzipped) and font size from `pnpm build`
- [ ] T034 Run the quickstart visual check on `/dev/test-games` at 360×640 in light and dark, plus `pnpm build && pnpm preview` on `/`; take screenshots of every screen and overlay in both themes for the owner's approval (SC-001); and with the font request blocked in the browser, check that every screen still lays out with the fallback typeface and nothing overlaps or clips (spec Edge Cases)
- [ ] T035 Final gate: `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` all green; `git grep -nE 'https?://' -- src ':!*.md'` lists only the SVG namespace; `git grep -nE 'fetch\(|XMLHttpRequest' -- src` returns nothing; `git diff develop -- src/shell/game src/shell/match src/shell/theme/preference.ts` is empty (FR-002)

---

## Dependencies & execution order

- **Phase 1 → Phase 2 → stories.** Phase 2 blocks everything (tokens, font,
  buttons, scene).
- **US1** first (MVP: the look). **US2** depends only on Phase 2 and can run
  beside US1.
- **US3**, **US4** depend on Phase 2 and touch different parts; they can run in
  parallel. US3's T022 and US1's T013/T015 edit the same screens: do them in
  order.
- **US5** depends on US3 (`Mascot`) and US4 (`Medal`, `PointsBadge`).
- **Polish** last.

```text
Setup ─► Foundational ─┬─► US1 ─┐
                       ├─► US2 ─┤
                       ├─► US3 ─┼─► US5 ─► Polish
                       └─► US4 ─┘
```

## Parallel examples

- Phase 2 tests: T003, T004, T005 together.
- US1: T012, T013, T014, T016, T017 together after T011 (different files).
- US3 T021 beside US4 T024.
- US5: T026, T028, T029 together.

## Implementation strategy

1. **MVP = Phases 1–3**: the whole app in the game style with all spec 003
   tests green. Show the owner screenshots and adjust before going on.
2. US2 (night scene tuning), then US3 (mascot) and US4 (scoreboard).
3. US5 (celebration) last; it reuses the mascot, medals, and badges.
4. Commit per task group on `feature/ui-redesign`, e.g.
   `feat(ui): add game-style tokens, font, and 3D buttons`.
