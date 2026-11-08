import { describe, expect, it } from 'vitest';

import {
  computeTotals,
  resolveWinners,
  scoreRound,
  scoresOnOffer,
  validateRound,
  type MecheRound,
} from './rules';

/**
 * MECHE-MECHE rules (specs/005-meche-meche/data-model.md, research D2).
 * Principle III: a normal, an edge, and a tie case for each rule function.
 */

const players = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu'].map((name) => ({
  id: `p-${name}`,
  name,
}));
const [ana, bia, caio, duda, edu] = players.map((player) => player.id) as [
  string,
  string,
  string,
  string,
  string,
];

function round(scores: Record<string, number>, bonus: string[] = []): MecheRound {
  return { scores, bonus };
}

function rejectionCode(input: unknown, roster = players): string | undefined {
  const result = validateRound(input, roster);
  return result.ok ? undefined : result.reasons[0]?.code;
}

describe('scoresOnOffer (FR-004)', () => {
  it.each([
    [2, [20, 10]],
    [3, [30, 20, 10]],
    [5, [50, 40, 30, 20, 10]],
    [7, [70, 60, 50, 40, 30, 20, 10]],
  ])('%i players → %j', (count, expected) => {
    expect(scoresOnOffer(count)).toEqual(expected);
  });
});

describe('validateRound (FR-005–FR-007, FR-010)', () => {
  it('normal: accepts a full round, filling both keys', () => {
    const input = { scores: { [ana]: 50, [bia]: 40, [caio]: 30, [duda]: 20, [edu]: 10 } };
    expect(validateRound(input, players)).toEqual({
      ok: true,
      round: { scores: input.scores, bonus: [] },
    });
  });

  it('edge: accepts an empty round, leftover scores, and a bonus with no score', () => {
    expect(validateRound({}, players)).toEqual({ ok: true, round: round({}) });
    expect(validateRound({ scores: { [ana]: 20 } }, players).ok).toBe(true);
    expect(validateRound({ bonus: [edu] }, players)).toEqual({
      ok: true,
      round: round({}, [edu]),
    });
  });

  it('tie: accepts two players with no score and both with the bonus', () => {
    expect(validateRound({ bonus: [ana, bia] }, players).ok).toBe(true);
  });

  it.each([
    ['a number', 42, 'invalid_shape'],
    ['null', null, 'invalid_shape'],
    ['an array', [1], 'invalid_shape'],
    ['scores not an object', { scores: [50] }, 'invalid_shape'],
    ['an unknown player in scores', { scores: { 'p-zeca': 50 } }, 'unknown_player'],
    ['a score not on offer', { scores: { [ana]: 60 } }, 'score_not_on_offer'],
    ['a score that is not a whole number', { scores: { [ana]: 15.5 } }, 'score_not_on_offer'],
    ['a score given twice', { scores: { [ana]: 50, [bia]: 50 } }, 'score_taken_twice'],
    ['bonus not an array', { bonus: 'p-Ana' }, 'invalid_shape'],
    ['bonus with a non-string', { bonus: [1] }, 'invalid_shape'],
    ['an unknown player in bonus', { bonus: ['p-zeca'] }, 'unknown_player'],
    ['a bonus given twice', { bonus: [ana, ana] }, 'bonus_twice'],
  ])('rejects %s', (_, input, code) => {
    expect(rejectionCode(input)).toBe(code);
  });

  it('names the score and the player in Portuguese', () => {
    const offer = validateRound({ scores: { [ana]: 60 } }, players);
    const twice = validateRound({ scores: { [ana]: 50, [bia]: 50 } }, players);
    const message = (result: ReturnType<typeof validateRound>) =>
      result.ok ? '' : (result.reasons[0]?.message ?? '');
    expect(message(offer)).toContain('60');
    expect(message(offer)).toContain('5 jogadores');
    expect(message(twice)).toContain('50');
    expect(message(validateRound({ bonus: [ana, ana] }, players))).toContain('Ana');
  });

  it('a score on offer depends on the number of players', () => {
    expect(rejectionCode({ scores: { [ana]: 30 } }, players.slice(0, 2))).toBe(
      'score_not_on_offer',
    );
  });
});

describe('scoreRound (FR-008)', () => {
  it('normal: score plus bonus', () => {
    const scores = scoreRound(round({ [ana]: 50, [bia]: 40 }, [ana]), players);
    expect(scores).toEqual({ [ana]: 60, [bia]: 40, [caio]: 0, [duda]: 0, [edu]: 0 });
  });

  it('edge: no score with bonus is worth 10; an empty round is all 0', () => {
    expect(scoreRound(round({}, [edu]), players)[edu]).toBe(10);
    expect(Object.values(scoreRound(round({}), players))).toEqual([0, 0, 0, 0, 0]);
  });

  it('tie: two players can end a round with the same value', () => {
    const scores = scoreRound(round({ [ana]: 20, [bia]: 10 }, [bia]), players);
    expect(scores[ana]).toBe(scores[bia]);
  });
});

describe('computeTotals (FR-008)', () => {
  it('normal: sums each player over the rounds', () => {
    const rounds = [
      { [ana]: 50, [bia]: 40, [caio]: 0, [duda]: 0, [edu]: 10 },
      { [ana]: 40, [bia]: 50, [caio]: 20, [duda]: 30, [edu]: 10 },
    ];
    expect(computeTotals(rounds, players)).toEqual({
      [ana]: 90,
      [bia]: 90,
      [caio]: 20,
      [duda]: 30,
      [edu]: 20,
    });
  });

  it('edge: no rounds → all 0', () => {
    expect(Object.values(computeTotals([], players))).toEqual([0, 0, 0, 0, 0]);
  });

  it('tie: equal sums stay equal', () => {
    const totals = computeTotals([{ [ana]: 30, [bia]: 30 }], players.slice(0, 2));
    expect(totals[ana]).toBe(totals[bia]);
  });
});

describe('resolveWinners (FR-009)', () => {
  it('normal: the highest total wins', () => {
    expect(resolveWinners({ [ana]: 130, [bia]: 90, [caio]: 110 }, players.slice(0, 3))).toEqual([
      ana,
    ]);
  });

  it('edge: a single player in the list wins alone', () => {
    expect(resolveWinners({ [edu]: 0 }, [players[4] ?? players[0]!])).toEqual([edu]);
  });

  it('tie: every player with the highest total wins', () => {
    expect(resolveWinners({ [ana]: 130, [bia]: 130, [caio]: 110 }, players.slice(0, 3))).toEqual([
      ana,
      bia,
    ]);
  });
});
