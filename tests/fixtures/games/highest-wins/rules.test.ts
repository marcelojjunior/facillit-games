import { describe, expect, it } from 'vitest';

import { computeTotals, resolveWinners, scoreRound, validateRound } from './rules';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bia' },
  { id: 'c', name: 'Caio' },
];

describe('highest-wins validateRound', () => {
  it('normal: accepts one place per player', () => {
    expect(validateRound({ ranks: { a: 1, b: 2, c: 3 } }, players)).toEqual({
      ok: true,
      round: { ranks: { a: 1, b: 2, c: 3 } },
    });
  });

  it('edge: rejects a place outside 1..n, a non-integer, a missing and an unknown player', () => {
    const codes = [
      { ranks: { a: 1, b: 2, c: 4 } },
      { ranks: { a: 1, b: 2, c: 0 } },
      { ranks: { a: 1, b: 2.5, c: 3 } },
      { ranks: { a: 1, b: 2 } },
      { ranks: { a: 1, b: 2, c: 3, z: 1 } },
      null,
      { ranks: 'nope' },
    ].map((input) => {
      const result = validateRound(input, players);
      return result.ok ? 'ok' : result.reasons[0]?.code;
    });

    expect(codes).toEqual([
      'rank_out_of_range',
      'rank_out_of_range',
      'invalid_rank',
      'missing_player',
      'unknown_player',
      'not_an_object',
      'not_an_object',
    ]);
  });

  it('tie: accepts two players claiming the same place', () => {
    expect(validateRound({ ranks: { a: 1, b: 2, c: 2 } }, players).ok).toBe(true);
  });

  it('rejections carry a Portuguese message for the player', () => {
    const result = validateRound({ ranks: { a: 1, b: 2 } }, players);

    expect(result).toEqual({
      ok: false,
      reasons: [{ code: 'missing_player', message: 'Falta a colocação de Caio.' }],
    });
  });
});

describe('highest-wins scoreRound', () => {
  it('normal: place p is worth (n - p + 1) * 10', () => {
    expect(scoreRound({ ranks: { a: 1, b: 2, c: 3 } }, players)).toEqual({ a: 30, b: 20, c: 10 });
  });

  it('edge: everyone last scores 10 each', () => {
    expect(scoreRound({ ranks: { a: 3, b: 3, c: 3 } }, players)).toEqual({ a: 10, b: 10, c: 10 });
  });

  it('tie: a shared place gives equal points', () => {
    expect(scoreRound({ ranks: { a: 1, b: 2, c: 2 } }, players)).toEqual({ a: 30, b: 20, c: 20 });
  });
});

describe('highest-wins computeTotals', () => {
  it('normal: sums every round', () => {
    expect(
      computeTotals(
        [
          { a: 30, b: 20, c: 10 },
          { a: 10, b: 30, c: 20 },
        ],
        players,
      ),
    ).toEqual({ a: 40, b: 50, c: 30 });
  });

  it('edge: no rounds gives zero for everyone', () => {
    expect(computeTotals([], players)).toEqual({ a: 0, b: 0, c: 0 });
  });

  it('tie: equal totals stay equal', () => {
    expect(
      computeTotals(
        [
          { a: 30, b: 10, c: 20 },
          { a: 10, b: 30, c: 20 },
        ],
        players,
      ),
    ).toEqual({ a: 40, b: 40, c: 40 });
  });
});

describe('highest-wins resolveWinners', () => {
  it('normal: the highest total wins', () => {
    expect(resolveWinners({ a: 40, b: 50, c: 30 }, players)).toEqual(['b']);
  });

  it('edge: a single positive total beats zeros', () => {
    expect(resolveWinners({ a: 0, b: 0, c: 10 }, players)).toEqual(['c']);
  });

  it('tie: every player sharing the best total wins', () => {
    expect(resolveWinners({ a: 50, b: 50, c: 30 }, players)).toEqual(['a', 'b']);
  });
});
