# Quickstart: validate player reordering

## Automated

```bash
pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
```

Expect: `movePlayer` unit tests, the store reload test, and the setup browser
test green; no file under `src/games/` changed.

## By hand (`pnpm dev --host`, 360×640, light and dark)

1. Any game, add Ana, Bia, Caio. Ana's "Subir" and Caio's "Descer" are
   disabled.
2. Tap Caio's up arrow twice: Caio, Ana, Bia. Reload: same order.
3. Start LEVA: Caio is marked "Começa" in round 1.
4. Finish, choose rematch: setup shows Caio, Ana, Bia; move Caio to the end;
   start: Ana is marked "Começa".
5. 10 players with long names: no sideways scroll; arrows ≥ 44 px.
