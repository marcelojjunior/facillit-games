# Quickstart: validating spec 004

**Feature**: [spec.md](./spec.md)

## Prerequisites

As spec 003: `pnpm install`, and `pnpm exec playwright install chromium` once
per machine.

## Automated checks

```sh
pnpm typecheck && pnpm lint && pnpm format:check
pnpm build          # static-build guard reads dist/
pnpm test
```

| Check | Covers |
|---|---|
| every spec 003 test, unchanged in what it asserts | SC-002, FR-001, FR-016, FR-017 |
| `src/styles/tokens.test.ts` | FR-005, FR-015, FR-018, SC-003 |
| `tests/static-build.test.ts` | FR-007, SC-004, SC-005 (font ≤ 80 kB, island JS ≤ 80 kB gz, no external URL) |
| `src/shell/ui/parts/podiumSteps.test.ts` | FR-013 (steps for ties and two players) |
| `src/shell/ui/look.browser.test.tsx` | FR-004, FR-006 |
| `src/shell/ui/mascot.browser.test.tsx` | FR-009, FR-010 |
| `src/shell/ui/scoreboard.browser.test.tsx` | FR-011, FR-012, SC-007 |
| `src/shell/ui/winner.browser.test.tsx` | FR-013, FR-014, SC-006 |
| `src/shell/ui/layout.browser.test.tsx` (unchanged) | FR-016 on every restyled screen |

## Visual check (SC-001)

```sh
pnpm dev --host
```

On `http://<machine-ip>:4321/dev/test-games`, at 360 px in light and dark,
compare each screen with [`prototype.html`](./prototype.html):

1. Game list: mascot greeting, raised game cards, sky with hills (night with
   stars in dark).
2. Setup and a few rounds: green 3D buttons that sink when pressed, purple
   round ribbon, medals and "N pts" badges.
3. Confirm an incomplete round: the mascot appears beside the reasons.
4. Finish with a tie for first: two golds, one step with both names, confetti.
5. Turn on "reduce motion" in the phone: no confetti, the mascot stands still.
6. Reload in dark: the night scene is there from the first frame.

## Production artifact

```sh
pnpm build && pnpm preview
```

`/` shows the mascot and "Nenhum jogo disponível ainda." in the new style; the
network panel lists requests to the app's own origin only.
