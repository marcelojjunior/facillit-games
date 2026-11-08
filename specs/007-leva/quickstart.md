# Quickstart: validate LEVA

## Automated

```bash
pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
```

Expect: LEVA rules tests, entry and full-match browser tests green; the island
under 92 160 bytes gzip -9; the registry lists `meche-meche` and `leva`.

## By hand (`pnpm dev --host`, 360×640, light and dark)

1. Game list shows MECHE-MECHE and LEVA with its icon.
2. LEVA, 4 players (Ana, Bia, Caio, Duda). Round 1: "1 carta", choices
   "Leva"/"Não leva"; every badge reads "5 vidas".
3. Enter guesses, reload: guesses still there. Move to results, enter them,
   confirm; lives drop by |guess − taken|.
4. Round 2 shows "2 cartas". A result total above the cards is rejected.
5. Bring a player to 0: they disappear from the entry, round goes back to
   "1 carta".
6. Play until one is left: the entry says who won; confirm is disabled; finish
   shows that player as the winner.
7. Fix an earlier round from the history: the sheet shows that round's cards
   and players.
8. 10 players, 5 cards: no sideways scroll, targets ≥ 44 px.
