# Quickstart: validating spec 005

**Feature**: [spec.md](./spec.md)

## Automated checks

```sh
pnpm typecheck && pnpm lint && pnpm format:check
pnpm build          # static-build guard reads dist/
pnpm test
```

| Check | Covers |
|---|---|
| `src/games/meche-meche/rules.test.ts` | FR-003–FR-011 (Principle III) |
| `src/games/meche-meche/RoundEntry.browser.test.tsx` | FR-002, FR-012, FR-013 |
| `src/games/meche-meche/match.browser.test.tsx` | SC-001, SC-003, SC-004 (US1–US3) |
| `tests/shell-boundary.test.ts` (unchanged) | FR-001, SC-002 |
| `src/games/registry.test.ts` | FR-017 (the production registry lists MECHE-MECHE) |
| `tests/static-build.test.ts` | FR-017, SC-005 (game in `dist/`, no fixture), island ≤ 80 KiB |
| `src/styles/tokens.test.ts` | FR-002 (no literal color in `src/games/`) |

`git diff develop --stat -- src` must list only `src/games/` (SC-002).

## By hand

```sh
pnpm dev --host
```

On `http://<machine-ip>:4321/` (the real page now):

1. Pick MECHE-MECHE, add 5 players, start.
2. Round 1: give 50, 40, 30 to three players, leave two with "—", give +10 to
   one of those two. Confirm. Totals: 50, 40, 30, 10, 0.
3. Check that a score taken by one player is disabled for the others; tap it
   again on its owner to free it.
4. Reload mid-round: the chosen scores and bonuses are still there.
5. Finish with two players tied on top: both are named as a shared win, and
   the rounds are still in the history.
6. Repeat 1–2 with 7 players on a phone: one thumb, no sideways scroll.
