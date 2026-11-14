---

description: "Task list for 010-player-order"
---

# Tasks: Reorder players in setup

**Input**: [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[quickstart.md](./quickstart.md)

Rules: tests first (constitution III); shell only, no file under `src/games/`
(SC-005); tokens only; ≥ 44×44 px; before each commit the full gate
(`pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm
format:check`); no AI attribution.

## Phase 1: Setup

- [X] T001 Commit the spec before any code (constitution VIII): `specs/010-player-order/` and the spec 009 pointer, as `docs(specs): specify player reordering in setup`

## Phase 2: Foundational — the move operation (blocks both stories)

- [X] T002 Write failing tests in `src/shell/match/match.test.ts`, `describe('movePlayer')`: with Ana, Bia, Caio, `up` on Bia → Bia, Ana, Caio and `down` on Bia → Ana, Caio, Bia; `up` on the first and `down` on the last → `ok`, players unchanged; unknown id → `player_not_found`; status `in_progress` or `finished` → `invalid_status`; with 2 players one move swaps them
- [X] T003 Implement `movePlayer(match, playerId, direction: 'up' | 'down', context)` in `src/shell/match/match.ts` per data-model.md ("first + `up`, or last + `down` | `ok`, match unchanged"); `guard(match, ['setting_up'], context)`; update the `players` doc comment in `src/shell/match/types.ts` ("Setup order: addition, then moves (spec 010); kept by a rematch"); make T002 pass
- [X] T004 Add `movePlayer(playerId, direction)` to `MatchStore` and its object in `src/shell/match/store.ts`, wired through `apply` like `removePlayer`; add a `['movePlayer', () => store.movePlayer('p2', 'up')]` step before `start` in the reload test of `src/shell/match/store.test.ts` (SC-003)

**Checkpoint**: gate green.

## Phase 3: User Story 1 — Move a player up or down in setup (P1) 🎯 MVP

**Goal**: arrows in setup change the match order. **Independent test**: Ana, Bia, Caio; Caio up twice → Caio, Ana, Bia; LEVA marks Caio "Começa" in round 1.

- [X] T005 [US1] Create `src/shell/ui/player-order.browser.test.tsx` (expected to fail first), through `MatchApp` with the test-only games (a shell test must not name a real game, spec 003 FR-025): a seeded setup with Ana, Bia, Caio; "Subir Ana" and "Descer Caio" are disabled; tapping "Subir Caio" twice gives Caio, Ana, Bia in the list; unmount and remount from storage keeps that order; starting stores Caio, Ana, Bia and shows no arrows (LEVA's "Começa" follows from spec 009 and is checked by hand in T011); with 10 players named long (a 10-player copy of a test game) at 360 px nothing scrolls sideways and every button is ≥ 44×44 px
- [X] T006 [P] [US1] Add `moveUp: 'Subir'` and `moveDown: 'Descer'` to `labels` in `src/shell/ui/copy.ts`; `ArrowUpIcon` and `ArrowDownIcon` (chevrons, `M6 15l6-6 6 6` / `M6 9l6 6 6-6`) in `src/shell/ui/parts/icons.tsx`; `smallIconButton = 'btn-3d btn-plain size-11 px-0'` in `src/shell/ui/parts/styles.ts`
- [X] T007 [US1] In `src/shell/ui/screens/Setup.tsx`, before each row's remove button, add buttons with `aria-label` "Subir {name}" / "Descer {name}", `disabled` on the first / last row, calling `act(() => store.movePlayer(player.id, 'up' | 'down'))`; update the doc comment (spec 010); make T005 pass

**Checkpoint**: gate green; commit `feat(shell): reorder players in setup`.

## Phase 4: User Story 2 — Change the order for a rematch (P1)

**Goal**: a rematch opens setup in the previous order, which can be changed. **Independent test**: finish LEVA with Ana, Bia, Caio; rematch; move Ana to the end; Bia is marked "Começa".

- [X] T008 [US2] Extend `src/shell/ui/player-order.browser.test.tsx`: from a seeded finished match of a test game with Ana, Bia, Caio, choose rematch, see Ana, Bia, Caio with the arrows, move Ana to the end (2 taps, SC-002), start, and see the order stored; the finished match is gone (rematch replaces it, spec 003)
- [X] T009 [US2] Fix whatever T008 shows (expected: nothing, the rematch keeps `players`)

## Phase 5: Polish

- [ ] T010 [P] Add `movePlayer` to `specs/002-game-contract/contracts/match-store.md` and the arrows to setup in `specs/003-shell-screens/contracts/screens.md`
- [ ] T011 Run [quickstart.md](./quickstart.md) by hand at 360×640, light and dark; confirm `git diff --stat` touches nothing under `src/games/` (SC-005)
- [ ] T012 Mark `specs/010-player-order/spec.md` **Status** as Implemented, recording any difference (constitution VIII)

## Dependencies

- T001 → everything; T002 → T003 → T004 → Phase 3.
- T005 → T007; T006 parallel with T005.
- Phase 3 → Phase 4. T010 parallel with Phase 4. T011, T012 last.

## Implementation strategy

MVP is Phase 3: the arrows work in any setup, which already includes the
rematch screen. Phase 4 proves the rematch path end to end.
