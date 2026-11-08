---

description: "Task list for 003-shell-screens"
---

# Tasks: Design system and shell screens

**Input**: Design documents from `specs/003-shell-screens/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/round-entry.md](./contracts/round-entry.md),
[contracts/screens.md](./contracts/screens.md),
[contracts/theme-preference.md](./contracts/theme-preference.md),
[quickstart.md](./quickstart.md)

**Tests**: included and written **before** the code in each story. The spec
requires automated checks for every success criterion (SC-001 to SC-008), and
Principle IV requires the static-build guard to be repointed, not removed.

**Branch**: `feature/shell-screens`, branched from `develop`.

**Organization**: grouped by user story in priority order — P1: US1, US2, US6;
P2: US3, US4, US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (separate files, no pending dependency)
- **[Story]**: the user story the task belongs to (US1–US6)
- Paths are relative to the repository root

## Rules that apply to every task in this list

- **`index.html`, `script.js`, `style.css` are untouchable** (frozen POC).
- **The shell never names a game.** Nothing under `src/` outside `src/games/`
  imports a game folder or compares/switches on a game id; screens get
  everything from the `Game` the registry returns (Principle II,
  `tests/shell-boundary.test.ts`).
- **`src/` never imports `tests/`** (spec 002 FR-025). Test games reach a page
  only through the dev-only route (research D5).
- **Only `client:only="react"`** on islands (Principle IV, research D14).
- **Design tokens only.** No literal colors (`#…`, `rgb(`, `text-red-500`,
  `bg-[#…]`) in components; use the token utilities from
  `src/styles/global.css` (FR-019).
- **Every tappable element ≥ 44×44 px** (`min-h-11 min-w-11` or larger) (FR-022).
- **No `any`, `@ts-ignore`, `@ts-expect-error`, or `as` casts** in
  `src/shell/game/contract.ts` and `src/shell/theme/preference.ts`
  (Principle V, VII).
- **English everywhere** except user-visible copy, which is pt-BR and lives in
  `src/shell/ui/copy.ts`, game names, round-entry labels, and the fallback
  frame (Principle IX).
- **Match schema is untouched.** No change to `src/shell/match/persistence.ts`
  or `types.ts` envelopes.
- Run `pnpm test` after every task that adds or changes a test; it must be
  green before moving on, except where a task says a test is expected to fail
  first. `pnpm build` must run before `pnpm test` (static-build guard).

---

## Phase 1: Setup

**Purpose**: baseline and test infrastructure for the browser project.

- [X] T001 Run `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` on `feature/shell-screens` and confirm all pass before any change (baseline)
- [X] T002 Add dev dependencies pinned to exact versions in `package.json`: `@vitest/browser-playwright` at the same version as `vitest` (5.0.5), `playwright` (latest stable, exact), `vitest-browser-react` (latest version whose peers accept Vitest 5 and React 19, exact); run `pnpm install` and `pnpm peers check` (must report no peer issues, AGENTS.md pitfall 9)
- [X] T003 Split `vitest.config.ts` into two projects (research D13): `unit` keeps `environment: 'node'` and the existing `include` (`tests/**/*.test.ts`, `src/**/*.test.ts`); `browser` uses `@vitest/browser-playwright` with Chromium, headless, viewport 360×640, `include: ['src/**/*.browser.test.tsx', 'tests/**/*.browser.test.tsx']`; keep the comment explaining why `unit` is `node`
- [X] T004 Add `src/shell/ui/smoke.browser.test.tsx` rendering a `<button>` with `vitest-browser-react` and asserting it is visible, to prove the browser project runs; run `pnpm exec playwright install chromium` if needed (documented in T048)

**Checkpoint**: `pnpm test` runs both projects green.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the contract revision, the design tokens, the island skeleton, and
the guards. Every story depends on this phase.

### Tests first

- [X] T005 [P] Extend `src/shell/game/contract.test.ts` (expected to fail first): `defineGame` passes `RoundEntry` through unchanged and throws a contract error when it is not a function; `evaluate` returns `positions` keyed by player id via peeling `resolveWinners` — normal case (1,2,3), tie (1,1,3), all tied / zero rounds (all 1), lowest-wins game (lowest total gets 1), and throws a contract error if `resolveWinners` returns an empty list or an unknown id during peeling (contracts/round-entry.md)
- [X] T006 [P] Create `src/shell/ui/copy.test.ts` (expected to fail first): every key of `errorCopy` and `discardCopy` is a non-empty string; `rosterLimitCopy(min, max)` interpolates the numbers; the set of `errorCopy` keys equals every `MatchError['code']` and of `discardCopy` every `DiscardNotice['reason']` (SC-005, research D12)
- [X] T007 [P] Create `src/styles/tokens.test.ts` (expected to fail first): every color token in `src/styles/tokens.ts` has a light and a dark value; each CSS variable in `src/styles/global.css` matches `tokens.ts`; WCAG contrast ≥ 4.5:1 for every text-on-surface pair and ≥ 3:1 for every boundary pair listed in `tokens.ts`, in both themes (FR-021, research D15); no file under `src/shell/ui/` or `tests/fixtures/games/` contains a literal color (`#[0-9a-f]{3,8}\b`, `rgb(`, `hsl(`, or a class of Tailwind's default palette: `-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b`) (FR-019); color token names have no numeric suffix (research D7)
- [X] T008 [P] Create `tests/island-directives.test.ts` (expected to pass now and keep passing): scans every `.astro` file under `src/` and fails on `client:load`, `client:idle`, `client:visible`, `client:media`, `server:defer`, or a `client:only` whose value is not `"react"` (FR-028, research D14)
- [X] T009 Repoint `tests/static-build.test.ts` (expected to fail first): replace the probe marker with assertions that `dist/index.html` contains `data-testid="loading-frame"`, does not contain `data-testid="match-app"` nor any value of `errorCopy`/screen headings, contains `lang="pt-BR"`, and that no file in `dist/` contains `highest-wins`, `lowest-wins`, `Maior Vence`, or `Menor Vence` (FR-026, FR-029, FR-030, research D4); keep the header comment, updated to say it now guards the real island

### Implementation

- [X] T010 Revise `src/shell/game/contract.ts` per `contracts/round-entry.md`: `import type { ComponentType } from 'react'`; add `RoundEntryProps` (`players`, `value: unknown`, `onChange(value: unknown)`, `reasons`), `RoundEntryComponent`, required `RoundEntry` on `GameDefinition<R>` and `Game`, and `positions` in `Evaluation` (passed through `MatchView.evaluation`) computed in `defineGame` by peeling winners with standard competition ranking (research D1, D2); make T005 pass
- [X] T011 [P] Create `tests/fixtures/games/highest-wins/RoundEntry.tsx`: one row per player with a place selector 1..n (buttons, ≥ 44 px, token classes), controlled from `value` (`{ ranks: Record<id, number> }`), treats any other shape as empty, emits `{ ranks }` via `onChange`, shows `reasons` messages; register it in `tests/fixtures/games/highest-wins/index.ts`
- [X] T012 [P] Create `tests/fixtures/games/lowest-wins/RoundEntry.tsx`: one numeric input per player (`inputMode="numeric"`, negatives allowed, ≥ 44 px), controlled from `value` (`{ points: Record<id, number> }`), keeps a partially typed value (e.g. `-`) without crashing, treats any other shape as empty; register it in `tests/fixtures/games/lowest-wins/index.ts`
- [X] T013 Create `src/styles/tokens.ts` (color tokens with light and dark values plus the list of foreground/background and boundary pairs) and rewrite `src/styles/global.css`: Tailwind 4 `@theme` with color, spacing, radius, and type-scale variables; `[data-theme='dark']` overrides of the same variables; `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`; system font stack; `body` background and text from tokens (research D7, D8); make T007 pass
- [X] T014 Create `src/shell/ui/copy.ts` with pt-BR `errorCopy: Record<MatchError['code'], string>`, `discardCopy: Record<DiscardNotice['reason'], string>`, `rosterLimitCopy`, and every screen label used by the contracts/screens.md table (meanings from that table); make T006 pass
- [X] T015 [P] Create `src/shell/ui/parts/Dialog.tsx` (native `<dialog>` with `showModal()`, close on `Esc` and backdrop, title, focus returns to the opener) and `src/shell/ui/parts/icons.tsx` (inline SVG icons used by the screens, `aria-hidden`) (research D8, D9)
- [X] T016 Create `src/shell/ui/MatchApp.tsx`: props `{ registry: Registry; storage?: StorageLike | null }`; creates the store once with a lazy `useState` initializer and disposes it on unmount; reads it with `useSyncExternalStore`; root element `data-testid="match-app"` with `data-screen` per contracts/screens.md; renders placeholder screens for the four states (research D3)
- [X] T017 Create `src/components/MatchIsland.tsx` (renders `<MatchApp registry={registry} />` with `registry` from `src/games/registry.ts`) and replace `src/pages/index.astro`: `BaseLayout` + `<MatchIsland client:only="react">` with a `slot="fallback"` neutral frame `data-testid="loading-frame"` (app title only, no buttons) (FR-027, FR-030, research D4); delete `src/components/ClientOnlyProbe.tsx`; run `pnpm build` and make T009 pass
- [X] T018 Add the dev-only route (research D5): in `astro.config.mjs` a local integration whose `astro:config:setup` hook calls `injectRoute({ pattern: '/dev/test-games', entrypoint: './tests/fixtures/dev/test-games.astro' })` only when `command === 'dev'`; create `tests/fixtures/dev/test-games.astro` (BaseLayout + `<DevMatchIsland client:only="react">` + the same fallback) and `tests/fixtures/dev/DevMatchIsland.tsx` (renders `MatchApp` with `testRegistry`); verify `pnpm build` output has no `dev/` directory and T009 still passes (FR-029, FR-029a)

**Checkpoint**: contract revised, fixture games carry entries, tokens defined,
the real island ships with its fallback, all guards green.

---

## Phase 3: User Story 1 — Play a full match on one phone (P1) 🎯 MVP

**Goal**: from an empty app to the winner screen with only taps and typing.

**Independent Test**: SC-001 for both fixture games at 360×640.

### Tests first

- [X] T019 [US1] Create `src/shell/ui/flow.browser.test.tsx` (expected to fail first), rendering `MatchApp` with `testRegistry` and a fresh `localStorage`: game list lists both fixture games in registry order; empty registry shows the "nenhum jogo disponível" state; setup rejects a duplicate name (case-insensitive) with `errorCopy.duplicate_name`; start disabled below `minPlayers` with the missing count shown and add disabled at `maxPlayers` with `roster_full` copy; a full match of 4 players × 5 rounds for each fixture game ends on the winner screen with totals and winners equal to `game.evaluate(...)`; an invalid confirm shows every game reason and keeps the draft; a tied match names every tied player as a shared win; the in-progress screen offers no `add-player` and no remove-player control (FR-005); a `lowest-wins` match with negative points shows the negative total with its sign; a 30-character name renders without horizontal overflow and its full text is reachable via `title` (SC-001, US1 scenarios 1–9, Edge Cases)
- [X] T020 [P] [US1] Create `src/shell/ui/parts/ConfirmBar.browser.test.tsx` (expected to fail first): two clicks dispatched back to back add exactly one round; the button is disabled with no draft (FR-017, research D11)

### Implementation

- [X] T021 [P] [US1] Create `src/shell/ui/screens/GameList.tsx`: one `data-testid="game-option"` button per `registry.list()` entry by `name`; empty state copy when the list is empty; tap calls `createMatch(id)` (FR-002)
- [X] T022 [P] [US1] Create `src/shell/ui/screens/Setup.tsx`: name input (`data-testid="player-name-input"`, `maxLength` 30, `enterKeyHint="done"`), add button, roster with rename (inline) and remove, count `n / max` and min hint from `rosterLimitCopy`, start (`data-testid="start-match"`) disabled outside limits, error copy next to the input (FR-003)
- [X] T023 [P] [US1] Create `src/shell/ui/parts/Standings.tsx`: one `data-testid="standing-row"` per player with position (`evaluation.positions`), name (truncate with full name in `title`), and total; sorted by position then roster order; never grows with rounds (FR-004, data-model Standing)
- [X] T024 [US1] Create `src/shell/ui/parts/ConfirmBar.tsx`: fixed to the viewport bottom with safe-area padding, `data-testid="confirm-round"`, ref lock released on the next animation frame after the store notifies, disabled without a draft (FR-017, FR-024, research D10, D11); make T020 pass
- [X] T025 [US1] Create `src/shell/ui/screens/InProgress.tsx`: header with round number (`rounds.length + 1`) and finish button, `Standings`, the game's `RoundEntry` inside `data-testid="round-entry"` fed `players`, `value = match.draft`, `onChange → updateDraft`, `reasons` from the last rejection; rejection list above the bar; `ConfirmBar` calling `confirmRound(match.draft)`; reasons clear on the next draft edit or success (FR-004, FR-009–FR-011)
- [X] T026 [US1] Add the finish confirmation in `src/shell/ui/screens/InProgress.tsx` using `Dialog`: shows the full per-round table and totals, buttons "Continuar" and "Finalizar" (`data-testid="confirm-finish"`) calling `finish()` (FR-006); finishing with zero rounds is allowed (research D10)
- [X] T027 [US1] Create `src/shell/ui/screens/Winner.tsx`: final standings; `data-testid="winner-names"` with one winner or, with more than one, a tie heading naming every tied player; rematch and new-match buttons (wired in US4); optional celebration only under `prefers-reduced-motion: no-preference` (FR-007)
- [X] T028 [US1] Wire the four screens into `src/shell/ui/MatchApp.tsx` replacing the placeholders; route every operation result through one handler that shows `errorCopy[code]` or passes `invalid_round` reasons (contracts/screens.md, Result handling); make T019 pass

**Checkpoint**: a full match is playable at `/dev/test-games`; MVP.

---

## Phase 4: User Story 2 — The match survives a closed tab (P1)

**Goal**: reopening restores the exact screen and draft; notices for discarded
data and failed saves; tab sync.

**Independent Test**: SC-003 — remount `MatchApp` over the same storage in each
state.

### Tests first

- [X] T029 [US2] Create `src/shell/ui/persistence.browser.test.tsx` (expected to fail first): for each of setup, in progress with a half-entered draft, and winner, unmount and remount `MatchApp` over the same `localStorage` and assert the first rendered `data-screen` is the same screen (never `game-list` first) with the same players, rounds, and draft; a stored match of `highest-wins` remounted with a registry that lacks it shows `discard-notice` with `discardCopy.unknown_game` once and then the game list (Edge Cases); a corrupted stored value shows `data-testid="discard-notice"` once and not again after dismiss and remount; a storage whose `setItem` throws shows `data-testid="not-saved-warning"` after an operation and it disappears after a persisted one; a `storage` event with a new confirmed round from "another tab" updates the standings without reload (SC-003, US2 scenarios 1–6)

### Implementation

- [X] T030 [P] [US2] Create `src/shell/ui/parts/Notices.tsx`: discard notice (from `getDiscardNotice()`, text `discardCopy[reason]`, dismiss calls `acknowledgeDiscardNotice()`), and the not-saved warning (non-blocking, `role="status"`) (FR-015, FR-016)
- [X] T031 [US2] Wire `Notices` in `src/shell/ui/MatchApp.tsx`: not-saved state set on `persisted: false`, cleared on `persisted: true`; overlays whose target vanished after a cross-tab update close without writing (data-model, Cross-tab); make T029 pass

**Checkpoint**: reload-safe in every state.

---

## Phase 5: User Story 6 — A game brings its own round entry (P1)

**Goal**: prove the round-entry seam carries different games and that adding
one touches only its folder and the registry.

**Independent Test**: SC-006 and the per-entry contract tests.

- [X] T032 [P] [US6] Create `tests/fixtures/games/highest-wins/RoundEntry.browser.test.tsx` and `tests/fixtures/games/lowest-wins/RoundEntry.browser.test.tsx`: each renders with `value` undefined, a valid value, and garbage (`42`, `{ranks: 'x'}`, `null`) without throwing; after a normal interaction the last `onChange` value passes the game's `validateRound`; it renders no `button[type=submit]` and no `<form>` (contracts/round-entry.md, rules 1–7)
- [X] T033 [US6] Create `tests/round-entry-plugin.browser.test.tsx`: defines a third game inline in the test (a different round shape and its own `RoundEntry`), builds a registry with `createRegistry`, and plays a full match through `MatchApp`; assert `tests/shell-boundary.test.ts` still passes unchanged (SC-006, FR-013)
- [X] T034 [US6] Update `AGENTS.md` pitfall 11 (game folder now also has `RoundEntry.tsx` and its browser test; link `specs/003-shell-screens/contracts/round-entry.md`) and pitfall 12 (the store is created in `MatchApp`, the only island)

**Checkpoint**: any game shape plugs in.

---

## Phase 6: User Story 3 — A wrong round can be fixed (P2)

**Goal**: fix any confirmed round or remove the last one without losing the
draft.

**Independent Test**: confirm 3 rounds, fix round 1, remove the last.

### Tests first

- [X] T035 [US3] Create `src/shell/ui/fix.browser.test.tsx` (expected to fail first): open history (`open-history`), tap round 1 (`history-round`), change it, save (`save-fix`): only round 1 and totals change; an invalid fix shows reasons and changes nothing; cancel changes nothing; the draft typed before opening is intact after save and after cancel; "Remover última rodada" asks for confirmation, cancel keeps it, confirm removes it; the history table opens scrolled to the latest round and keeps names visible while scrolling; renaming a player during the match (overflow menu → "Renomear jogador") updates the name in the standings, the history, and later the winner screen, and a duplicate name (case-insensitive) shows `errorCopy.duplicate_name` and changes nothing (US3 scenarios 1–4, FR-004a, FR-005, Edge Cases — rename during the match)

### Implementation

- [X] T036 [P] [US3] Create `src/shell/ui/parts/History.tsx`: full-screen `Dialog`, one row per player, one column per round plus total, sticky first column with names, horizontal scroll inside its own container, scrolled to the end on open, each round header a ≥ 44 px button (FR-004a, FR-023)
- [X] T037 [P] [US3] Create `src/shell/ui/parts/FixSheet.tsx`: copies `match.rounds[index]` into local state, renders the game's `RoundEntry` with it, "Salvar" calls `replaceRound(index, value)`, "Cancelar" drops it, shows reasons on rejection; closes if the round disappears (research D6)
- [X] T038 [US3] Add the overflow menu to `src/shell/ui/screens/InProgress.tsx` with "Ver histórico", "Renomear jogador" (`src/shell/ui/parts/RenameDialog.tsx`), and "Remover última rodada" (confirmation `Dialog`); wire `History` → `FixSheet`; make T035 pass (FR-005, FR-008)

**Checkpoint**: mistakes are recoverable.

---

## Phase 7: User Story 4 — Play again (P2)

**Goal**: rematch, new match, abandon.

**Independent Test**: finish → rematch → finish → new match.

- [X] T039 [US4] Create `src/shell/ui/replay.browser.test.tsx` (expected to fail first): rematch opens setup with the same game and players and no rounds, still editable; new match shows the game list; abandon from setup and from in progress asks for confirmation, cancel keeps everything, confirm shows the game list (US4 scenarios 1–3)
- [X] T040 [US4] Wire rematch (`createRematch`) and new match (`discardMatch`) in `src/shell/ui/screens/Winner.tsx`, and "Abandonar" with a confirmation `Dialog` in `src/shell/ui/screens/Setup.tsx` and the in-progress overflow menu; make T039 pass (FR-007, FR-008)

**Checkpoint**: groups can play many matches.

---

## Phase 8: User Story 5 — Comfortable at night, with one hand (P2)

**Goal**: theme choice persisted and applied before paint; Principle VI
measured.

**Independent Test**: SC-002, SC-004, SC-007, SC-008.

### Tests first

- [X] T041 [P] [US5] Create `src/shell/theme/preference.test.ts` (expected to fail first) covering every row of the reading table in `contracts/theme-preference.md` (missing, not JSON, wrong `schemaVersion`, unknown `theme`, throwing storage → `auto`; valid → stored value), `writeThemeChoice` returning `{ persisted: false }` on a throwing `setItem`, and `resolveTheme` for all 6 combinations
- [X] T042 [P] [US5] Create `src/shell/theme/boot.test.ts` (expected to fail first): evaluates the generated boot script against a fake `document`/`localStorage`/`matchMedia` and asserts it sets `data-theme` and `colorScheme` exactly as `resolveTheme(readThemeChoice(...))` for the same inputs, and never throws on a throwing storage
- [X] T043 [US5] Create `src/shell/ui/layout.browser.test.tsx` (expected to fail first), at 360×640, on every screen and overlay with 7 players (using a test game with `maxPlayers` ≥ 7 defined inline) and 30 rounds: every visible `button, a, input, select, [role=button]` has a bounding box ≥ 44×44 (SC-004); `document.documentElement.scrollWidth <= 360` (SC-007); `confirm-round` is fully inside the viewport without scrolling (SC-002); standings have exactly one row per player (SC-007); theme control is present on every screen, switches `data-theme` live, persists across remount, still switches when `setItem` throws (FR-020a), and in `auto` follows an emulated `prefers-color-scheme` change (SC-008)

### Implementation

- [X] T044 [US5] Create `src/shell/theme/preference.ts` exactly per `contracts/theme-preference.md` (key `facillit-games:theme`, envelope `{ "schemaVersion": 1, "theme": "auto" | "light" | "dark" }`, reuse `safeStorage` from `src/shell/match/persistence.ts`); make T041 pass
- [X] T045 [US5] Create `src/shell/theme/boot.ts` exporting `bootScript(): string` built from the same parsing logic, and add it to `src/layouts/BaseLayout.astro` as `<script is:inline set:html={bootScript()} />` at the top of `<head>`; keep `<meta name="color-scheme" content="light dark">`; make T042 pass (FR-020, research D7)
- [X] T046 [US5] Create `src/shell/ui/parts/ThemeControl.tsx` (`data-testid="theme-control"`, three options "Automático" / "Claro" / "Escuro", writes via `writeThemeChoice`, applies `data-theme` immediately, listens to `matchMedia` changes in `auto`), placed in the shared app header rendered by `MatchApp`, so it is on every screen (FR-020, FR-020a, research D10)
- [X] T047 [US5] Fix any layout failures from T043 across `src/shell/ui/` (sizes, overflow, bottom bar safe-area), then make T043 pass

**Checkpoint**: Principle VI is measured, not claimed.

---

## Phase 9: Polish & cross-cutting

- [X] T048 [P] Update `README.md` status row ("game screens delivered; no real game until Phase 5"), the testing prerequisites, and the dev-only page `/dev/test-games`
- [X] T049 [P] Record in `specs/003-shell-screens/research.md` any decision changed during implementation, and update `specs/003-shell-screens/spec.md` in the same change wherever reality contradicted it (Principle VIII)
- [X] T050 Check the island bundle size from `pnpm build` output: island JS ≤ 80 kB gzipped (plan, Performance Goals); record the measured value in `specs/003-shell-screens/research.md` D13 or justify the excess there
- [X] T051 Run the full quickstart (`specs/003-shell-screens/quickstart.md`): automated checks, the manual phone checklist on `/dev/test-games`, and `pnpm build && pnpm preview` showing the empty state on `/` and 404 on `/dev/test-games`
- [X] T052 Final gate: `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` all green; `git grep -nE '[ãõçáéíóúâêôà]' -- src tests ':!src/shell/ui/copy.ts' ':!tests/fixtures/games'` lists only user-visible copy (Principle IX); `git grep -nE 'fetch\(|XMLHttpRequest' -- src` returns nothing (Principle I)

---

## Dependencies & execution order

- **Phase 1 → Phase 2 → stories.** Phase 2 blocks everything (contract,
  tokens, island).
- **US1** first (MVP). **US2** and **US6** depend only on Phase 2 and US1's
  `MatchApp` wiring (T028); they can run in parallel with each other.
- **US3** depends on US1 (`InProgress`, `Dialog`). **US4** depends on US1
  (`Winner`, `Setup`). **US3** and **US4** can run in parallel.
- **US5** depends on every screen existing (its layout test walks all of them);
  T041, T042, T044, T045 can start right after Phase 2.
- **Polish** last.

```text
Setup ─► Foundational ─► US1 ─┬─► US2 ─┐
                              ├─► US6 ─┤
                              ├─► US3 ─┼─► US5 ─► Polish
                              └─► US4 ─┘
```

## Parallel examples

- Phase 2 tests: T005, T006, T007, T008 together; then T011 and T012 together
  after T010.
- US1: T021, T022, T023 together after T019/T020 are written.
- US3: T036 and T037 together.
- US5: T041 and T042 together, any time after Phase 2.

## Implementation strategy

1. **MVP = Phases 1–3**: a full match playable at `/dev/test-games`, guards
   green. Stop and validate on a real phone.
2. Add US2 (reload safety) before showing anyone: it is the normal use.
3. Add US6 to lock the plugin seam before Phase 5 builds MECHE-MECHE on it.
4. US3, US4, then US5 to measure Principle VI.
5. Work on `feature/shell-screens`; commit per task group with `<type>(<scope>): <imperative>` (e.g.
   `feat(shell): add game list and setup screens`), no AI attribution.
