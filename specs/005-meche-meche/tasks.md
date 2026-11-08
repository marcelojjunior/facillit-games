---

description: "Task list for 005-meche-meche"
---

# Tasks: MECHE-MECHE, the first game

**Input**: Design documents from `specs/005-meche-meche/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/meche-meche-round.md](./contracts/meche-meche-round.md),
[quickstart.md](./quickstart.md)

**Tests**: included and written **before** the code in each story
(Principle III requires the rule tests; the spec's success criteria are
automated checks except the by-hand quickstart).

**Branch**: `feature/meche-meche`, branched from `develop`.

**Organization**: P1 stories in order — US1 (score a match), US2 (fast round
entry), US3 (no POC bug returns).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (separate files, no pending dependency)
- **[Story]**: US1–US3
- Paths are relative to the repository root

## Rules that apply to every task in this list

- **Plugin only.** In `src/`, change only `src/games/meche-meche/**`,
  `src/games/registry.ts`, and `src/games/registry.test.ts`. No shell file
  changes (FR-001, SC-002). `tests/shell-boundary.test.ts` stays unchanged and
  green.
- **Pure rules** (Principle III): `rules.ts` touches no DOM, storage, clock, or
  randomness; no `any` or casts.
- **Round-entry contract** (spec 003) and **visual contract** (spec 004):
  controlled, tolerant, no `<form>` or submit; `btn-3d` classes and token
  utilities only; every target ≥ 44×44 px.
- **pt-BR** only for the game name, entry labels, and rejection messages;
  everything else in English.
- `pnpm build` before `pnpm test`. Before each commit: `pnpm build && pnpm test
  && pnpm typecheck && pnpm lint && pnpm format:check`, all green. Mark
  finished tasks `[X]`. Commits `<type>(<scope>): <imperative>`, no AI
  attribution.

---

## Phase 1: Setup

- [ ] T001 Run `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` on `feature/meche-meche` and confirm all pass before any change (baseline); record the island JS gzipped size (sum of `gzip -9` of `dist/_astro/*.js`)

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: guards that must hold once a real game is in the production
registry.

- [ ] T002 [P] Extend the literal-color scan in `src/styles/tokens.test.ts` to also cover `src/games` (`.tsx` and `.ts`, excluding tests), keeping the other folders (FR-002, research D6)
- [ ] T003 [P] Add to `tests/static-build.test.ts` (expected to fail first): some file under `dist/` contains `MECHE-MECHE` (FR-017, SC-005); keep the fixture-marker check and the island budget test unchanged
- [ ] T004 Update `src/games/registry.test.ts` (expected to fail first): the production registry lists exactly one game, with id `meche-meche`, name `MECHE-MECHE`, `minPlayers` 2, and `maxPlayers` 7 (FR-001, FR-003; replaces "is empty until the first real game")

- [ ] T005 Before the game lands, apply spec 004 research D11's fallback in its own commit (`perf(ui): move the mascot drawing out of the island`): draw the die (and crown) once as an SVG sprite (`<symbol>`) in `src/layouts/BaseLayout.astro`, and make `src/shell/ui/parts/Mascot.tsx` render `<svg><use href="#…"/></svg>` with the same props, test hooks, and token fills; record the island size before and after in `specs/004-game-style-ui/research.md` D12; all spec 003/004 tests stay green. This shell change belongs to spec 004, not to this spec (SC-002)

**Checkpoint**: guards written; T003 and T004 fail until US1 registers the game; the island has headroom for the game.

---

## Phase 3: User Story 1 — Keep the score of a MECHE-MECHE match (P1)

**Goal**: the rules and the registered game; a match is playable.

**Independent Test**: SC-001 — a 5-player match gives the same totals and
winners as the rules computed by hand.

### Tests first

- [ ] T006 [US1] Create `src/games/meche-meche/rules.test.ts` (expected to fail first) per `specs/005-meche-meche/data-model.md` and research D2: `scoresOnOffer` for 2, 3, 5, 7 players; `validateRound` normal (accepts a full round), edge (accepts `{}`, leftover scores, bonus for a player with no score), tie (accepts two players with no score and both with the bonus, i.e. equal round values), and rejects every row of the validation table with its code (`invalid_shape`, `unknown_player`, `score_not_on_offer`, `score_taken_twice`, `bonus_twice`) and a Portuguese message naming the score or player; `scoreRound` normal (score + bonus), edge (no score + bonus = 10; empty round = all 0), tie (two players same value); `computeTotals` normal, edge (no rounds = all 0), tie; `resolveWinners` normal (highest), edge (single player in list), tie (all tied players returned)

### Implementation

- [ ] T007 [US1] Create `src/games/meche-meche/rules.ts` per `contracts/meche-meche-round.md` (`MecheRound { scores; bonus }`, `scoresOnOffer`, `validateRound`, `scoreRound`, `computeTotals`, `resolveWinners`; pure, no casts); make T006 pass
- [ ] T008 [US1] (Do not commit between T008 and T011: a registered game with a stub entry is unusable; commit Phases 3 and 4 together.) Create a minimal `src/games/meche-meche/RoundEntry.tsx` stub that renders nothing interactive yet (so `defineGame` accepts the game), and `src/games/meche-meche/index.ts` with `defineGame<MecheRound>({ id: 'meche-meche', name: 'MECHE-MECHE', minPlayers: 2, maxPlayers: 7, … })`
- [ ] T009 [US1] Register the game in `src/games/registry.ts` (one import, one array entry; drop the "empty on purpose" comment); run `pnpm build` and make T003 and T004 pass; confirm `tests/shell-boundary.test.ts` passes unchanged

**Checkpoint**: MECHE-MECHE shows on `/`; rules tested.

---

## Phase 4: User Story 2 — Enter a round fast, with one thumb (P1) 🎯 MVP

**Goal**: the real round entry.

**Independent Test**: a 7-player round at 360×640, taps only, no sideways
scroll, 44 px targets.

### Tests first

- [ ] T010 [US2] Create `src/games/meche-meche/RoundEntry.browser.test.tsx` (expected to fail first) using `tests/fixtures/games/round-entry-harness.tsx`: renders `undefined`, a valid value (chosen score `aria-pressed`, bonus `aria-pressed`), and garbage (`42`, `null`, `{scores: 'x'}`, `{bonus: 5}`, `[]`) as empty without throwing; no `<form>` or submit; after tapping a score for two players and a bonus, the last emitted value passes `mecheMeche.validateRound`; a score taken by player A is `disabled` for player B with a label naming A; re-tapping A's own score clears it; the "—" button marks no score; every visible button ≥ 44×44 px with 7 players at 360 px and `document.documentElement.scrollWidth <= 360` (FR-012, FR-014, research D4)

### Implementation

- [ ] T011 [US2] Implement `src/games/meche-meche/RoundEntry.tsx` per research D4 and the contract (one `card-3d` per player; name + `+10` toggle; 4-column grid of score buttons largest first plus "—"; `btn-blue`/`btn-plain`/`btn-yellow`; taken scores disabled and struck through; pt-BR labels); make T010 pass
- [ ] T012 [US2] Measure the island JS (gzip -9 of `dist/_astro/*.js`) after `pnpm build`; record it in `specs/005-meche-meche/research.md` D5; `tests/static-build.test.ts` "keeps the island script within 80 kB gzipped" must pass without raising the budget (T005 already moved the mascot out of the island); if it still fails, stop and record it as a budget decision for the owner instead of changing the shell

**Checkpoint**: one-thumb entry done; budget met.

---

## Phase 5: User Story 3 — No POC bug comes back (P1)

**Goal**: prove the POC's six bugs do not reproduce with the real game.

**Independent Test**: SC-004.

- [ ] T013 [US3] Create `src/games/meche-meche/match.browser.test.tsx` rendering `MatchApp` with `createRegistry([mecheMeche])` (research D3): SC-001 with hand-computed constants (not recomputed by the rules) — 5 players A–E, scores on offer 50…10: R1 A50 B40 C30, D and E none, bonus E; R2 B50 A40 D30 C20 E10; R3 C50 E40 A10, bonus B and D; R4 E50 D40 B30 A20 C10, bonus A → totals A 130, B 130, C 110, D 80, E 110, positions 1, 1, 3, 5, 3, winners A and B as a shared win; renaming C during the match keeps C's total (FR-011); a rematch with 3 players offers 30, 20, 10; US3 — a player named `<b>Ana</b>` shows as text (no `b` element created), "José da Silva" shows unchanged in standings and on the winner screen, a match started with zero rounds remounts on `in-progress`, a half-entered round with a bonus remounts intact, the winner screen still offers the history-backed standings and podium with every total, and a confirmed round can be fixed from the history (change a score, totals update)
- [ ] T014 [US3] Fix whatever T013 exposes inside `src/games/meche-meche/` only; if a failure needs a shell change, stop and record it in `specs/005-meche-meche/research.md` as a contract gap before changing the shell (plan, Summary)

**Checkpoint**: acceptance criteria of the rewrite hold for MECHE-MECHE.

---

## Phase 6: Polish & cross-cutting

- [ ] T015 [P] Add a note under spec 003 FR-029 in `specs/003-shell-screens/spec.md` that spec 005 (MECHE-MECHE) ends the "no real game before Phase 5" clause; update `README.md` "Current state" (MECHE-MECHE playable on `/`) and the `AGENTS.md` pitfall 11 examples (MECHE-MECHE as the reference game)
- [ ] T016 Run the quickstart by hand on `pnpm dev` at `/` (real page) at 360×640 in light and dark, with screenshots for the owner; and `pnpm build && pnpm preview` showing MECHE-MECHE on `/`
- [ ] T017 Final gate: `pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` all green; `git diff <T005 commit> --stat -- src` lists only `src/games/` (T005's mascot move is spec 004's); island JS and font sizes recorded

---

## Dependencies & execution order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish. US2 needs the registered game
  (US1); US3 needs the real entry (US2).
- T002 and T003 can run together; T004 after them is independent too. T005
  before US1, in its own commit.

## Implementation strategy

1. **MVP = Phases 1–4**: rules, registration, and the real round entry; the
   game is playable at the table. Check the budget right away (T012).
2. US3 proves the rewrite's acceptance criteria with the real game.
3. Polish, then the owner's check on a phone.
