# Contract: MECHE-MECHE round

**Implements**: the game contract of spec 002 and the round-entry contract of
spec 003 (`contracts/round-entry.md`), in the visual contract of spec 004
(`contracts/ui-parts.md`).

## Game declaration

```ts
// src/games/meche-meche/index.ts
export default defineGame<MecheRound>({
  id: 'meche-meche',          // equals the folder name (shell-boundary test)
  name: 'MECHE-MECHE',
  minPlayers: 2,
  maxPlayers: 7,
  validateRound, scoreRound, computeTotals, resolveWinners,
  RoundEntry,
});
```

```ts
// src/games/meche-meche/rules.ts
export interface MecheRound {
  readonly scores: Readonly<Record<string, number>>; // player id → score on offer
  readonly bonus: readonly string[];                 // player ids with +10
}
export function scoresOnOffer(players: number): number[]; // [n*10, …, 10]
```

`validateRound` returns `{ ok: true, round }` with both keys filled (missing →
empty) or `{ ok: false, reasons }` per the table in
[data-model.md](../data-model.md). Codes (stable, English): `invalid_shape`,
`unknown_player`, `score_not_on_offer`, `score_taken_twice`, `bonus_twice`.

## Round entry

```ts
// src/games/meche-meche/RoundEntry.tsx
export default function RoundEntry(props: RoundEntryProps): JSX.Element;
```

- Reads `value` tolerantly: anything that is not `{ scores?: object, bonus?:
  array }` renders as an empty round; unknown ids and non-numbers are ignored
  when rendering (validation reports them on confirm).
- Emits on every tap `{ scores, bonus }` (JSON-serializable).
- One `card-3d` per player, in roster order:
  - name (`truncate`, full name in `title`);
  - bonus toggle: `btn-3d btn-yellow` when on, `btn-plain` when off,
    `aria-pressed`, `aria-label="Bônus de +10 para <nome>"`, text "+10";
  - one button per score on offer, largest first, text "<score>",
    `aria-label="<nome>: <score> pontos"`, `aria-pressed`; `btn-blue` when
    this player's, `btn-plain` when free; when another player's, `disabled`,
    struck through, `aria-label="<nome>: <score> pontos, já é de <outro>"`;
  - a "—" button, `aria-label="<nome>: sem pontuação"`, `aria-pressed` when the
    player has no score.
- Tapping this player's own score again clears it.
- No `<form>`, no submit button (spec 003 contract rule 3); every target ≥
  44×44 px; tokens only.

## Tests

| File | Covers |
|---|---|
| `rules.test.ts` | normal, edge, tie for each rule function; every validation row |
| `RoundEntry.browser.test.tsx` | spec 003 rule 7: empty, valid, garbage render; a normal interaction emits a value `validateRound` accepts; taken scores disabled; re-tap clears |
| `match.browser.test.tsx` | SC-001, the six POC bugs (spec US3), 7 players at 360×640 |
