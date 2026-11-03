# Quickstart: validating the game contract

**Feature**: [spec.md](./spec.md) | **Contracts**: [game-contract](./contracts/game-contract.md),
[match-store](./contracts/match-store.md)

This phase ships no screen, so validation is the test suite plus two manual
checks. Prerequisites are the same as spec 001 (Node `>=22.23.4`, pnpm via
Corepack).

## 1. Full pipeline

```sh
pnpm install
pnpm build && pnpm test && pnpm typecheck && pnpm lint && pnpm format:check
```

Expected: every command exits 0. `pnpm test` now includes, besides the spec 001
tests:

| Test file | Proves |
|---|---|
| `tests/fixtures/games/highest-wins/rules.test.ts` | Fixture rules: normal, edge, tie (SC-002) |
| `tests/fixtures/games/lowest-wins/rules.test.ts` | Same, for the opposite winner direction (FR-006) |
| `src/shell/game/contract.test.ts` | `defineGame` erasure and `evaluate` order; bad static fields throw |
| `src/games/registry.test.ts` | Lookup, unknown id, duplicate id, stable order (FR-007–FR-009) |
| `src/shell/match/match.test.ts` | Every operation and transition, every error code (FR-011–FR-017a) |
| `src/shell/match/persistence.test.ts` | The 7 load steps, each discard case (FR-019–FR-020, SC-004) |
| `src/shell/match/store.test.ts` | Persist-then-commit, round-trip after each operation (SC-003), failed write (FR-021) |
| `tests/two-games.test.ts` | One full match per fixture game through the same store (User Story 1) |
| `tests/shell-boundary.test.ts` | No shell file names or imports a game (SC-005) |

## 2. The boundary test actually bites

Temporarily add to any file in `src/shell/`:

```ts
import '../../games/does-not-matter';
```

Run `pnpm test`. Expected: `tests/shell-boundary.test.ts` fails and names the
file. Revert. Repeat with a line such as `if (gameId === 'x') {}`.

## 3. No test game in the artifact (SC-006)

```sh
pnpm build
grep -rE "highest-wins|lowest-wins" dist/ && echo FAIL || echo OK
```

Expected: `OK`. `tests/static-build.test.ts` from spec 001 still passes,
including its check that `dist/index.html` has no `localStorage`,
`schemaVersion`, or `GameDefinition`.

## 4. Adding a game touches only the registry (SC-001)

Reviewed on the Phase 5 diff, not here: the change that adds MECHE-MECHE must
list `src/games/meche-meche/**` and `src/games/registry.ts`, and nothing else
outside its folder.
