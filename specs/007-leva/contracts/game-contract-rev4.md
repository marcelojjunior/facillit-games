# Game contract, revision 4

Amends specs/002-game-contract/contracts/game-contract.md and
specs/003-shell-screens/contracts/round-entry.md. Both additions are optional
for games; existing games compile and behave unchanged.

## RoundEntryProps.rounds

```ts
readonly rounds: readonly unknown[];
```

- The stored inputs of the confirmed rounds **before** the one being edited, in
  order: `match.rounds` for the next round, `match.rounds.slice(0, index)` when
  fixing round `index`.
- Values are as stored: the entry MUST parse them tolerantly and never throw.
- The shell always passes it (possibly empty).

## GameDefinition.unit / Game.unit

```ts
readonly unit?: { readonly one: string; readonly other: string };
```

- Portuguese label of a total: `one` for ±1, `other` otherwise
  (LEVA: `{ one: 'vida', other: 'vidas' }`).
- Absent → the shell shows "pts".
- `defineGame` passes it through; present but not two non-empty strings →
  contract error.

## Tests

- `contract.test.ts`: `unit` passes through; absent stays `undefined`;
  malformed throws.
- Shell: `rounds` given to the entry in progress (all) and in the fix sheet
  (before the index); the badge shows a game's unit and "pts" without one.
