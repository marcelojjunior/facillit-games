# Research: MECHE-MECHE, the first game

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## D1 — The stored round: scores taken and bonus holders

**Decision**: a round is the JSON value
`{ "scores": { "<playerId>": 40, ... }, "bonus": ["<playerId>", ...] }`.
A player missing from `scores` took no score; a player missing from `bonus`
did not get it. Both keys are optional on input (missing = empty), so the
entry can start from nothing and every edit is a valid draft shape.

**Rationale**:

- Mirrors the table: "who took which score" and "who got +10".
- "No score" needs no sentinel value; leftover scores (owner answer) are just
  absent from `scores`.
- Validation is simple: every score is on offer for this number of players,
  appears once, and belongs to a known player; bonus ids are known and unique.

**Alternatives rejected**: the POC's array of `{ playerIdx, points, bonus }`
(positional, breaks on rename/removal ordering); per-player objects
`{ id: { score, bonus } }` (two ways to say "nothing").

## D2 — Rules and their tests

**Decision** (`rules.ts`, all pure):

- `scoresOnOffer(n)` → `[n*10, (n-1)*10, …, 10]`.
- `validateRound(input, players)`: object check; `scores` a record of known ids
  to integers on offer, no score twice; `bonus` an array of known, distinct
  ids; first problem wins, Portuguese message naming the player or score.
- `scoreRound(round, players)` → per player `(scores[id] ?? 0) + (bonus has id ? 10 : 0)`.
- `computeTotals` → sum per player.
- `resolveWinners` → every player with the highest total.

`rules.test.ts` has, for each of the four functions, a normal case, an edge
case (2 players; 7 players; empty round; bonus with no score; negative or
unknown input), and a tie case.

## D3 — Where the end-to-end tests live

**Decision**: `src/games/meche-meche/match.browser.test.tsx` plays full matches
through `MatchApp` with `createRegistry([mecheMeche])`: SC-001 (5 players,
totals and winners equal to the rules), the six POC bugs of spec US3, and a
7-player round at 360×640 (no sideways scroll, 44 px targets). It sits in the
game folder so no shell file names the game.

## D4 — The round entry

**Decision**: one raised card per player (`card-3d`):

- Row 1: the name (truncated, full name in `title`) and a +10 toggle on the
  right (`btn-3d btn-yellow` when on, `btn-plain` when off; `aria-pressed`;
  label "Bônus de +10 para <nome>").
- Row 2: a 4-column grid with one button per score on offer (largest first,
  `btn-blue` when chosen by this player, `btn-plain` when free) and a final
  "—" button for no score (selected when the player has no score). A score
  chosen by another player is `disabled`, struck through, with label
  "<score> pontos, já é de <nome>".
- Tapping a score already chosen by this player clears it (no score).

With 7 players: 7 scores + "—" = 8 buttons, two rows of four, each about
70 px wide at 360 px. Every edit calls `onChange` with the new
`{ scores, bonus }`; garbage `value` renders as empty (contract rule 2).

**Rationale**: one tap per player plus optional bonus; the POC's dropdowns
needed two taps and were small. Taken scores stay visible, so the table sees
what is left.

## D5 — The island budget

**Context**: the production island is 79 163 bytes gzipped (spec 004), budget
81 920. MECHE-MECHE is the first game in the production registry, so its
rules and entry ship in the island.

**Decision** (revised after /speckit-analyze): apply spec 004 research D11's
planned fallback **before** the game lands, in its own commit (task T005):
the mascot's drawing becomes a static SVG sprite in the layout, referenced
with `<use>`, which takes it out of the island. The game's own diff then stays
inside `src/games/` (SC-002). Write the game lean (no helpers beyond
`scoresOnOffer`, no new icons, the shell's button classes) and measure right
after the entry exists (T012). If the budget still fails, stop and bring the
decision to the owner; raising the budget means amending spec 003's plan.

## D6 — Ending "no real game before Phase 5"

**Decision**: update `src/games/registry.test.ts` ("empty until Phase 5" →
lists exactly MECHE-MECHE), extend `tests/static-build.test.ts` so `dist/`
must contain "MECHE-MECHE" (and still no fixture marker), extend the
literal-color scan of `src/styles/tokens.test.ts` to `src/games/`, and add a
note to spec 003 FR-029 that spec 005 ends the "no real game" clause
(Principle VIII). README and AGENTS.md "current state" lines are updated.
