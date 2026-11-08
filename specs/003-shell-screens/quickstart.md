# Quickstart: validating Phase 4

**Feature**: [spec.md](./spec.md)

## Prerequisites

```sh
pnpm install
pnpm exec playwright install chromium   # once per machine, for browser tests
```

## Automated checks

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build          # static-build guard reads dist/
pnpm test           # node project + browser project
```

| Check | Covers |
|---|---|
| `tests/static-build.test.ts` (repointed) | FR-026, FR-030: fallback frame in HTML, no app markup; FR-029: no fixture or game name in `dist/` |
| `tests/island-directives.test.ts` | FR-028, research D14 |
| `tests/shell-boundary.test.ts` (unchanged) | FR-009, FR-013 |
| `src/shell/game/contract.test.ts` | `RoundEntry` pass-through, `rank` peeling and ties |
| `src/shell/ui/copy.test.ts` | SC-005 |
| `src/shell/theme/*.test.ts` | FR-020a table, boot script parity |
| `src/styles/tokens.test.ts` | FR-019 (no literal colors), FR-021 / SC-004 contrast |
| `**/*.browser.test.tsx` | SC-001, SC-002, SC-003, SC-004 (targets), SC-007, SC-008, each fixture `RoundEntry` |

Expected: everything green; `dist/` contains neither `highest-wins` nor
`lowest-wins`, and `dist/index.html` contains no screen copy (that lives only
in the island's script).

## Manual check on a phone (development only)

```sh
pnpm dev --host
```

Open `http://<machine-ip>:4321/dev/test-games` on the phone (FR-029a).

1. Pick "Maior Vence", add 4 players, start. Confirm 3 rounds with the thumb
   only. The confirm button never needs scrolling.
2. Type half of round 4, lock the phone, reopen the tab: same screen, same half
   round, no flash of the game list.
3. Open the history, fix round 1, save: only round 1 and totals change.
4. Finish → confirmation shows the table → finish → winner screen. Force a tie
   (same places) in a second match and check every tied player is named.
5. Rematch → same players in setup. New match → game list.
6. Switch the phone to dark mode: the app follows. Pick "Claro" in the theme
   control: the app stays light after reload, whatever the phone says.
7. Open `http://<machine-ip>:4321/` in the same browser: the test match is
   discarded with the "game no longer available" notice, once, and the game list
   says no game is available (research D5).

## Production artifact

```sh
pnpm build && pnpm preview
```

`/` shows the "nenhum jogo disponível" state; `/dev/test-games` returns 404.
