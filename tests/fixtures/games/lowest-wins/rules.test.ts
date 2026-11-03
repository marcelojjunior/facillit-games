import { describe, expect, it } from 'vitest';

import { computeTotals, resolveWinners, scoreRound, validateRound } from './rules';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bia' },
  { id: 'c', name: 'Caio' },
];

describe('lowest-wins validateRound', () => {
  it('normal: accepts one integer per player, negatives included', () => {
    expect(validateRound({ points: { a: 5, b: -3, c: 0 } }, players)).toEqual({
      ok: true,
      round: { points: { a: 5, b: -3, c: 0 } },
    });
  });

  it('edge: rejects non-integers, non-finite values, missing and unknown players', () => {
    const codes = [
      { points: { a: 1.5, b: 0, c: 0 } },
      { points: { a: Number.NaN, b: 0, c: 0 } },
      { points: { a: Number.POSITIVE_INFINITY, b: 0, c: 0 } },
      { points: { a: '1', b: 0, c: 0 } },
      { points: { a: 1, b: 0 } },
      { points: { a: 1, b: 0, c: 0, z: 0 } },
      42,
    ].map((input) => {
      const result = validateRound(input, players);
      return result.ok ? 'ok' : result.reasons[0]?.code;
    });

    expect(codes).toEqual([
      'invalid_points',
      'invalid_points',
      'invalid_points',
      'invalid_points',
      'missing_player',
      'unknown_player',
      'not_an_object',
    ]);
  });

  it('tie: accepts equal points for several players', () => {
    expect(validateRound({ points: { a: 7, b: 7, c: 7 } }, players).ok).toBe(true);
  });
});

describe('lowest-wins scoreRound', () => {
  it('normal: returns the points as entered', () => {
    expect(scoreRound({ points: { a: 5, b: 2, c: 9 } }, players)).toEqual({ a: 5, b: 2, c: 9 });
  });

  it('edge: keeps negative points', () => {
    expect(scoreRound({ points: { a: -10, b: 0, c: 3 } }, players)).toEqual({ a: -10, b: 0, c: 3 });
  });

  it('tie: equal entries give equal points', () => {
    expect(scoreRound({ points: { a: 4, b: 4, c: 1 } }, players)).toEqual({ a: 4, b: 4, c: 1 });
  });
});

describe('lowest-wins computeTotals', () => {
  it('normal: sums every round', () => {
    expect(
      computeTotals(
        [
          { a: 5, b: 2, c: 9 },
          { a: 1, b: 8, c: -4 },
        ],
        players,
      ),
    ).toEqual({ a: 6, b: 10, c: 5 });
  });

  it('edge: no rounds gives zero for everyone', () => {
    expect(computeTotals([], players)).toEqual({ a: 0, b: 0, c: 0 });
  });

  it('tie: equal totals stay equal', () => {
    expect(
      computeTotals(
        [
          { a: 5, b: 3, c: 1 },
          { a: 0, b: 2, c: 4 },
        ],
        players,
      ),
    ).toEqual({ a: 5, b: 5, c: 5 });
  });
});

describe('lowest-wins resolveWinners', () => {
  it('normal: the lowest total wins', () => {
    expect(resolveWinners({ a: 6, b: 10, c: 5 }, players)).toEqual(['c']);
  });

  it('edge: a negative total beats zero', () => {
    expect(resolveWinners({ a: 0, b: -1, c: 0 }, players)).toEqual(['b']);
  });

  it('tie: every player sharing the lowest total wins', () => {
    expect(resolveWinners({ a: 3, b: 3, c: 8 }, players)).toEqual(['a', 'b']);
  });
});
