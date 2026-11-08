---

description: "Task list for 007-leva"
---

# Tasks: LEVA, the second game

**Input**: [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/game-contract-rev4.md](./contracts/game-contract-rev4.md)

Rules: tests first (constitution III requires them); tokens only; ≥ 44×44 px;
the shell never names a game; before each commit the full gate (`pnpm build &&
pnpm test && pnpm typecheck && pnpm lint && pnpm format:check`); no AI
attribution.

## Phase 1: Setup

- [X] T001 Raise the island budget to 90 KiB: limit `90 * KB` (92 160 bytes) in `tests/static-build.test.ts`, and an "Amendment (spec 007)" note under the budget line of `specs/003-shell-screens/plan.md` (80 KiB → 90 KiB, reason: MECHE-MECHE left < 1 KB; lazy-loading deferred to 4–5 games) (FR-020)

## Phase 2: Foundational — contract revision 4 (blocks all stories)

- [X] T002 [P] Extend `src/shell/game/contract.test.ts` (expected to fail first): `defineGame` passes `unit` `{ one, other }` through, leaves it `undefined` when absent, and throws a contract error when present with a missing or empty `one`/`other` (contracts/game-contract-rev4.md)
- [X] T003 [P] Create `src/shell/ui/contract-rev4.browser.test.tsx` (expected to fail first), with inline test games: the in-progress entry receives `rounds` equal to the confirmed rounds; the fix sheet for round index 1 of 3 receives only round 0; a game with `unit: { one: 'vida', other: 'vidas' }` shows "5 vidas" and "1 vida" in the standings badge; a game without `unit` shows "pts"
- [X] T004 Add `rounds: readonly unknown[]` to `RoundEntryProps` and optional `unit` to `GameDefinition` and `Game` in `src/shell/game/contract.ts`, with the pass-through and check; make T002 pass
- [X] T005 Pass `rounds={match.rounds}` in `src/shell/ui/screens/InProgress.tsx` and `rounds={view.match.rounds.slice(0, index)}` in `src/shell/ui/parts/FixSheet.tsx`; give `PointsBadge` (`src/shell/ui/parts/PointsBadge.tsx`) an optional `unit` (one for ±1, other otherwise, default `labels.points`) passed from `view.game.unit` in `src/shell/ui/parts/Standings.tsx` and `src/shell/ui/parts/Podium.tsx`; make T003 pass and keep every existing test green (MECHE-MECHE and fixtures untouched)

**Checkpoint**: gate green; commit `feat(game): add rounds and unit to the game contract`.

## Phase 3: User Story 1 — Keep the lives of a LEVA match (P1) 🎯 MVP

**Goal**: LEVA is listed and scores lives correctly. **Independent test**: the full 4-player match of T009.

- [X] T006 [P] [US1] Create `src/games/leva/rules.test.ts` (expected to fail first), normal/edge/tie per rule and for `nextRound`: `validateRound` accepts `{cards, guesses, taken}` and rejects each code of data-model.md (`invalid_shape`, `no_players`, `unknown_player`, `missing_guess`, `missing_taken` naming the player, `value_out_of_range`, `too_many_taken`), accepts Σ taken < cards and Σ taken = 0; `scoreRound` gives `−|guess − taken|` to participants and 0 to others (guess 2 took 0 → −2; guess 0 took 1 → −1; exact → 0); `computeTotals` = `max(0, 5 + Σ)` (1 life missing by 3 → 0); `resolveWinners` highest, ties shared, all-0 shared; `nextRound` → cards 1 with no rounds, `last.cards + 1` without elimination, 1 after a round that put any player (or several) from > 0 to 0, `alive` excludes players at 0, invalid stored rounds skipped
- [X] T007 [US1] Implement `src/games/leva/rules.ts` (`validateRound` returns only `{ cards, guesses, taken }`, dropping `step`; `LevaRound`, `STARTING_LIVES = 5`, the four rules, `nextRound(rounds, players) → { cards, alive, lives }`, Portuguese messages); make T006 pass
- [X] T008 [US1] Create `src/games/leva/Icon.tsx` (a face with a card on the forehead, `currentColor` strokes, `var(--badge)` card face) and `src/games/leva/index.ts` (`defineGame({ id: 'leva', name: 'LEVA', minPlayers: 2, maxPlayers: 10, unit: { one: 'vida', other: 'vidas' }, … })`); add `leva` to `src/games/registry.ts`; update `src/games/registry.test.ts` to list `['meche-meche', 'leva']` with LEVA's name, limits 2–10, `Icon` and `unit`
- [X] T009 [US1] Create `src/games/leva/match.browser.test.tsx` (expected to fail until T011): a full 4-player match through `MatchApp` until one player is left, with a round where two players are out and a round where cards cancelled (Σ taken < cards); after every round assert the lives (hand-computed in the test's comments), the "N carta(s)" header, and the living players; once, after entering a round's guesses, unmount and remount `MatchApp` from storage and assert the guesses are still there (SC-004); at the end the entry says who won, confirm is disabled, and finishing shows that player as the winner with "vidas" badges

## Phase 4: User Story 2 — Guesses first, results after (P1)

**Goal**: the two-step entry that keeps the guesses. **Independent test**: T010.

- [X] T010 [P] [US2] Create `src/games/leva/RoundEntry.browser.test.tsx` (expected to fail first): shows "1 carta" and "Leva"/"Não leva" with no rounds; shows "3 cartas" and buttons 0–3 after two rounds without elimination; only living players, each with lives; guesses step then results step with each guess visible; going back keeps results; every edit calls `onChange` with `{cards, step, guesses, taken}`; a value from an unknown shape renders an empty guesses step without throwing; a stored draft with stale `cards` shows the derived cards, drops out-of-range values, and calls `onChange` with the corrected draft without any tap; with one living player shows "Vitória de <nome>" and no buttons, and with none shows "Ninguém sobrou", calling `onChange(undefined)` if a draft exists; when fixing (value is a stored round, no `step`) shows that round's cards and players on the results step; `reasons` from a rejected confirm are not hidden by the entry
- [X] T011 [US2] Implement `src/games/leva/RoundEntry.tsx` per plan and research D5–D7 (tolerant `read(value)`, `nextRound(rounds, players)` for the next round, the round's own cards and players when `value` is a valid stored round, sunken panel per player, step buttons); make T010 and T009 pass

**Checkpoint**: gate green; commit `feat(leva): add LEVA`.

## Phase 5: User Story 3 — One thumb (P2)

- [X] T012 [US3] Add to `src/games/leva/RoundEntry.browser.test.tsx`: 10 players, 5 cards, at 360 px: no horizontal overflow (`scrollWidth ≤ clientWidth`), every button ≥ 44×44 px; with 12 cards every value 0–12 is a visible button; fix any layout issue in `src/games/leva/RoundEntry.tsx`

## Phase 6: Polish

- [ ] T013 Assert LEVA ships in `tests/static-build.test.ts` (its name in `dist/`) and the island ≤ 92 160 bytes; record the measured size in `specs/007-leva/research.md` D9
- [ ] T014 Update README.md game list and the "Adding a game" comment in `src/games/registry.ts` (mention `rounds` and `unit`)
- [ ] T015 Gate, then check by hand at 360 px in light and dark per [quickstart.md](./quickstart.md)

Note: the share image (`scripts/render-share-images.mjs`) keeps its
MECHE-MECHE badge; adding LEVA there is not part of this feature.

## Dependencies

T001 → T002–T005 → US1 (T006 → T007 → T008; T009 written then) → US2 (T010 → T011, which also turns T009 green) → US3 (T012) → Polish. T002 ∥ T003; T006 ∥ T010 once T005 is done.

## Implementation strategy

MVP = Phases 1–4 (US1 and US2 are both P1 and need each other to play a match); US3 hardens the layout; Polish closes the budget and docs.
