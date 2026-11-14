---

description: "Task list for 009-leva-round-starter"
---

# Tasks: LEVA round starter

**Input**: [spec.md](./spec.md), [plan.md](./plan.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[quickstart.md](./quickstart.md)

Rules: tests first (constitution III requires them for rules); only
`src/games/leva/` changes (FR-001); tokens only; ≥ 44×44 px; before each commit
the full gate (`pnpm build && pnpm test && pnpm typecheck && pnpm lint &&
pnpm format:check`); no AI attribution.

Players in examples: A, B, C, D = the `ana`, `bia`, `caio`, `duda` fixtures of
`src/games/leva/rules.test.ts`.

## Phase 1: Setup

- [X] T001 Commit the spec before any code (constitution VIII): `specs/009-leva-round-starter/` and the pointer in `specs/007-leva/spec.md`, as `docs(specs): specify the LEVA round starter`

## Phase 2: Foundational — derive the starter (blocks both stories)

- [X] T002 Write failing tests in `src/games/leva/rules.test.ts`, in a new `describe('round starter (spec 009 FR-002–FR-005)')`: `firstFrom(players, fromId, among)` returns the first of `among` going forward in cyclic roster order from `fromId` inclusive, wraps last → first, and returns `undefined` for empty `among`; `fromStarter(playing, starterId)` rotates `playing` to begin at `starterId` and returns it unchanged for `undefined` or an id not in `playing`; `nextRound([], players)` has `from` A's id and `starter` A; update the existing `nextRound([])` `toEqual` to include `from: ana` and `starter: players[0]`
- [X] T003 Add to `src/games/leva/rules.ts`: `firstFrom` and `fromStarter` (pure, exported), and on `NextRound` `from: string` ("the player after the last accepted round's starter in cyclic roster order, or `players[0]` before any round") and `starter: PlayerRef | undefined` (`firstFrom(players, from, alive)`). In `nextRound`, walk only the rounds `validateRound` accepts: round 1's starter is `firstFrom(players, players[0].id, round 1's players)`; round k+1's is `firstFrom(players, id of the player after starter(k) in cyclic roster order, round k+1's players)`, where a stored round's players are the keys of its `guesses` ("`undefined` when `among` is empty"). Update the file's doc comment; make T002 pass

**Checkpoint**: gate green.

## Phase 3: User Story 1 — See who guesses first (P1) 🎯 MVP

**Goal**: the entry lists the round's players from the starter and marks them "Começa". **Independent test**: 3 players, 4 rounds without eliminations → A, B, C, A.

- [X] T004 [P] [US1] Add to `src/games/leva/rules.test.ts` (round starter describe): 3 players (A, B, C) without eliminations give starters A, B, C, A for rounds 1–4; 2 players alternate A, B, A; a stored round the rules reject (`{ nonsense: true }`) does not advance the starter (FR-005); dropping the last round gives back that round's starter (edge "Removing the last round"); renaming a player (same id, new name) does not change any starter (FR-008)
- [X] T005 [P] [US1] Add failing tests to `src/games/leva/RoundEntry.browser.test.tsx`: round 3 of A, B, C lists C, A, B with "Começa" in C's row only, in the guesses step and after moving to the results step; a reload-style remount with a draft keeps the same order and mark; the emitted draft's `guesses` keys stay in roster order (research D3); "Começa" is part of the row's text content (FR-006, read with the row); with 10 long names at 360 px the mark is visible, the starter's row lies within the 640 px viewport on open, and nothing scrolls sideways (extend the FR-018 test; SC-003); update existing assertions that read player names in DOM order (`names()` helper) to the rotated order
- [X] T006 [US1] In `src/games/leva/RoundEntry.tsx`: `read` returns `starter = firstFrom(players, before.from, playing)` (for the next round this equals `before.starter`); render `fromStarter(playing, starter?.id)` instead of `playing`; in the starter's name row, after the truncating name, show the text "Começa" (tokens only, e.g. `text-sm font-bold`), so the name truncates first; keep `ids` and the draft from `playing` in roster order; update the doc comment to cite spec 009; make T004 and T005 pass

**Checkpoint**: gate green; commit `feat(leva): show who starts each round`.

## Phase 4: User Story 2 — Rotation skips eliminated players (P1)

**Goal**: an eliminated player never starts; fixing a past round keeps each round's starter among its own players. **Independent test**: A, B, C, D with C out in round 3 → rounds 4–7 start D, A, B, D.

- [X] T007 [P] [US2] Add to `src/games/leva/rules.test.ts` (round starter describe), with lives hand-computed in comments: A, B, C, D where C starts round 3 and is out in it → starters of rounds 4–7 D, A, B, D (feed rounds 4–6 with A, B, D as players); B starts round 2 and B and C are out in it → rounds 3–5 D, A, D; a later stored round whose players exclude a player that lives say is alive (a fixed past round revived them) still gets a starter among its own players; a stored round whose players include one that lives say was already out gets `firstFrom` among its own players, that player included (analyze C1); with one player alive `starter` is that player, with none `undefined`
- [X] T008 [P] [US2] Add failing tests to `src/games/leva/RoundEntry.browser.test.tsx`: the fix sheet for a stored round (no `step`) lists that round's own players from its starter (`firstFrom(players, nextRound(before).from, playing)`) with "Começa"; the next round after C is out never marks C
- [X] T009 [US2] In `src/games/leva/RoundEntry.tsx`, confirm the T006 formula covers fixing with no special case (`playing` is the round's own players, so the starter is always in it); make T007 and T008 pass
- [X] T010 [US2] Extend `src/games/leva/match.browser.test.tsx` "a full LEVA match": after every round assert the first listed player and that only they carry "Começa", matching the hand-computed starters in comments, including the round with two players out (SC-001); update existing assertions on the living-player order to the rotated order

**Checkpoint**: gate green; commit `feat(leva): skip eliminated players in the start rotation`.

## Phase 5: Polish

- [X] T011 Run [quickstart.md](./quickstart.md) by hand at 360×640, light and dark; confirm `git diff --stat develop` touches only `src/games/leva/` and `specs/` (SC-004)
- [X] T012 Mark `specs/009-leva-round-starter/spec.md` **Status** as Implemented, and record in it any place where the implementation had to differ (constitution VIII)

## Phase 6: Revision — keep the setup order (owner, after implementation)

- [X] T013 Update spec, plan, research D3, data model, and quickstart: the list keeps setup order in every round, only the "Começa" mark moves (FR-006, SC-003)
- [X] T014 Remove `fromStarter` from `src/games/leva/rules.ts` and its tests in `src/games/leva/rules.test.ts`; render `playing` as is in `src/games/leva/RoundEntry.tsx`
- [X] T015 Update `src/games/leva/RoundEntry.browser.test.tsx` and `src/games/leva/match.browser.test.tsx` to expect setup order with the mark on the starter only; run the gate and check the app at 360×640

## Dependencies

- T001 → everything.
- T002 → T003 → Phase 3 and Phase 4.
- US1 (T004–T006) → US2's entry work (T008, T009) and T010, which touch the same files.
- T011, T012 last.

## Parallel examples

- Phase 3: T004 (`rules.test.ts`) and T005 (`RoundEntry.browser.test.tsx`) together, then T006.
- Phase 4: T007 and T008 together, then T009, then T010.

## Implementation strategy

MVP is Phase 3: after T006 every round shows a starter, already correct for
eliminations because T003 skips players out. Phase 4 adds the proofs for
eliminations and the fix-sheet case, plus the full-match check.
