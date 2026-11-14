# Quickstart: validate the LEVA round starter

## Automated

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
```

Expect: `rules.test.ts` starter cases, the entry and full-match browser tests
green; no file outside `src/games/leva/` and this spec changed
(`git diff --stat develop`).

## By hand (`pnpm dev --host`, 360×640, light and dark)

1. LEVA, 3 players (Ana, Bia, Caio). Round 1: Ana listed first, marked
   "Começa".
2. Confirm rounds 2 and 3: Bia, then Caio start, each listed first with the
   others following in order (Caio, Ana, Bia for round 3).
3. Round 4: Ana starts again.
4. Enter guesses, reload: the same starter and order.
5. 4 players, eliminate the starter's next in line: the rotation skips them
   (see the table in [data-model.md](./data-model.md)).
6. Fix an earlier round from the history: the sheet lists that round's
   starter first.
