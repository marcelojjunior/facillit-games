---

description: "Task list for 006-home-and-game-icon"
---

# Tasks: Home button, setup layout, and game icons

**Input**: [spec.md](./spec.md), [plan.md](./plan.md),
[contracts/game-icon.md](./contracts/game-icon.md)

Rules: tests first; tokens only; ≥ 44×44 px; the shell never names a game;
before each commit the full gate (`pnpm build && pnpm test && pnpm typecheck
&& pnpm lint && pnpm format:check`); no AI attribution.

## Tests first

- [ ] T001 [P] Extend `src/shell/game/contract.test.ts` (expected to fail first): `defineGame` passes an `Icon` through unchanged, leaves it `undefined` when absent, and throws a contract error when `Icon` is present and not a function (contracts/game-icon.md)
- [ ] T002 [P] Create `src/shell/ui/home.browser.test.tsx` (expected to fail first): no `data-testid="home"` on the game list; from setup and in progress the house opens a dialog whose text contains `labels.homeLoses`, cancel keeps the match, confirm (`confirm-home`) shows the game list and empties the stored match; from the winner screen the text contains `labels.homeCloses`; the theme choice is untouched; on setup at 360 px the name input and `add-player` have equal widths and the button's top is below the input's bottom; the game list shows a game's `Icon` (an inline test game with an Icon that renders `data-testid="game-icon"`) and the trophy for a game without one
- [ ] T003 [P] Add to `src/games/registry.test.ts`: MECHE-MECHE declares an `Icon` (FR-006)

## Implementation

- [ ] T004 Add optional `Icon` to `GameDefinition` and `Game` in `src/shell/game/contract.ts` with the pass-through and check of contracts/game-icon.md; make T001 pass
- [ ] T005 Add `HomeIcon` to `src/shell/ui/parts/icons.tsx`, the copy (`home`, `homeTitle`, `homeLoses`, `homeCloses`, `homeConfirm`) to `src/shell/ui/copy.ts`, and the house button with its `Dialog` in `src/shell/ui/MatchApp.tsx` per plan; make T002's house cases pass
- [ ] T006 Stack the name field and the add button in `src/shell/ui/screens/Setup.tsx` (both full width); make T002's setup case pass
- [ ] T007 Render `game.Icon ?? TrophyIcon` in `src/shell/ui/screens/GameList.tsx`, setting `--badge` to the badge's color token; make T002's icon cases pass
- [ ] T008 Create `src/games/meche-meche/Icon.tsx` (a fan of three playing cards, `currentColor` strokes, `var(--badge)` faces, a small suit on the front card) and declare it in `src/games/meche-meche/index.ts`; make T003 pass
- [ ] T009 Gate, island budget (≤ 81 920 bytes gzipped), and a check at 360 px in light and dark: header with house and theme, the house dialog, setup, and the game list with the card icon
