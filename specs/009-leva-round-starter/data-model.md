# Data Model: LEVA round starter

Nothing persisted changes. `LevaRound` and the draft are as in
[spec 007](../007-leva/data-model.md).

## NextRound (derived, never stored)

```text
nextRound(rounds, players) → { cards, alive, lives, from, starter }
```

- `from: string`: the id the next rotation starts from — the player after the
  last accepted round's starter in cyclic roster order, or `players[0]` before
  any round.
- `starter: PlayerRef | undefined` = `firstFrom(players, from, alive)`.
- `firstFrom(players, fromId, among)`: the first player of `among` found going
  forward in cyclic roster order from `fromId` (inclusive); `undefined` when
  `among` is empty.
- Walk the rounds `validateRound` accepts (rejected ones do not advance it):
  - round 1's starter: `firstFrom(players, players[0], round 1's players)`;
  - round k+1's starter: `firstFrom(players, player after starter(k), round
    k+1's players)`.
  - A stored round's players are the keys of its `guesses`; the next round's
    players are `alive`.
- Because each round looks only among its own players, a fix to a past round
  that changes who is alive never yields a starter outside a later round.
- With one player alive the match is over (spec 007 FR-017) and the starter is
  not shown.

Example (A, B, C, D; C starts round 3 and is out in it):

| Round | Starter |
|---|---|
| 1 | A |
| 2 | B |
| 3 | C |
| 4 | D |
| 5 | A |
| 6 | B |
| 7 | D |

Second example (A, B, C, D; B starts round 2, B and C are out in it):

| Round | Starter |
|---|---|
| 3 | D |
| 4 | A |
| 5 | D |

## Starter shown by the entry

`firstFrom(players, nextRound(before).from, playing)`, where `playing` is
`alive` for the next round and the round's own players when fixing it. Always
in `playing`, and the same rule as FR-003 for both cases. The list itself
stays in setup order; only the starter's row is marked.
