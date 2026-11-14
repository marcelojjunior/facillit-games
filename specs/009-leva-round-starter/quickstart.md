# Quickstart: validate the LEVA round starter

## Automated

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
```

Expect: `rules.test.ts` starter cases, the entry and full-match browser tests
green; no file outside `src/games/leva/` and this spec changed
(`git diff --stat develop`).

## By hand (`pnpm dev --host`, 360×640, light and dark)

1. LEVA, 3 players (Ana, Bia, Caio). Round 1: Ana, Bia, Caio, with Ana
   marked "Começa".
2. Confirm rounds 2 and 3: the list stays Ana, Bia, Caio; the mark moves to
   Bia, then Caio.
3. Round 4: Ana starts again.
4. Enter guesses, reload: the same starter marked, same order.
5. 4 players, eliminate the starter's next in line: the rotation skips them
   (see the table in [data-model.md](./data-model.md)).
6. Fix an earlier round from the history: the sheet marks that round's
   starter, in setup order.
