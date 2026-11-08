import { describe, expect, it } from 'vitest';

import {
  computeTotals,
  nextRound,
  resolveWinners,
  scoreRound,
  STARTING_LIVES,
  validateRound,
  type LevaRound,
} from './rules';

/**
 * LEVA rules (specs/007-leva/data-model.md, research D2–D4).
 * Principle III: a normal, an edge, and a tie case for each rule function.
 */

const players = ['Ana', 'Bia', 'Caio', 'Duda'].map((name) => ({ id: `p-${name}`, name }));
const [ana, bia, caio, duda] = players.map((player) => player.id) as [
  string,
  string,
  string,
  string,
];

function round(
  cards: number,
  guesses: Record<string, number>,
  taken: Record<string, number>,
): LevaRound {
  return { cards, guesses, taken };
}

function codes(input: unknown): string[] {
  const result = validateRound(input, players);
  return result.ok ? [] : result.reasons.map((reason) => reason.code);
}

function messages(input: unknown): string[] {
  const result = validateRound(input, players);
  return result.ok ? [] : result.reasons.map((reason) => reason.message);
}

describe('validateRound (FR-006, FR-007)', () => {
  it('accepts a full round and returns only cards, guesses, and taken', () => {
    const input = { ...round(2, { [ana]: 1, [bia]: 0 }, { [ana]: 1, [bia]: 1 }), step: 'taken' };
    expect(validateRound(input, players)).toEqual({
      ok: true,
      round: round(2, { [ana]: 1, [bia]: 0 }, { [ana]: 1, [bia]: 1 }),
    });
  });

  it('accepts results adding up to less than the cards, even 0 (cards cancelled)', () => {
    expect(codes(round(3, { [ana]: 1, [bia]: 1 }, { [ana]: 1, [bia]: 0 }))).toEqual([]);
    expect(codes(round(1, { [ana]: 1, [bia]: 0 }, { [ana]: 0, [bia]: 0 }))).toEqual([]);
  });

  it('accepts results adding up to exactly the cards', () => {
    expect(codes(round(2, { [ana]: 2, [bia]: 0 }, { [ana]: 1, [bia]: 1 }))).toEqual([]);
  });

  it.each([
    ['not an object', null],
    ['an array', []],
    ['cards missing', { guesses: { [ana]: 0 }, taken: { [ana]: 0 } }],
    ['cards 0', round(0, { [ana]: 0 }, { [ana]: 0 })],
    ['cards not whole', round(1.5, { [ana]: 0 }, { [ana]: 0 })],
    ['guesses not an object', { cards: 1, guesses: [1], taken: {} }],
  ])('rejects %s as invalid_shape', (_label, input) => {
    expect(codes(input)).toEqual(['invalid_shape']);
  });

  it('rejects a round with no players', () => {
    expect(codes(round(1, {}, {}))).toEqual(['no_players']);
  });

  it('rejects a player not in the match', () => {
    expect(codes(round(1, { 'p-zé': 0 }, { 'p-zé': 0 }))).toEqual(['unknown_player']);
  });

  it('names every player missing a result', () => {
    const input = { cards: 2, guesses: { [ana]: 1, [bia]: 0 } };
    expect(codes(input)).toEqual(['missing_taken', 'missing_taken']);
    expect(messages(input)).toEqual(['Falta quantas Ana levou.', 'Falta quantas Bia levou.']);
  });

  it('names a player with a result but no guess', () => {
    expect(messages(round(2, { [ana]: 1 }, { [ana]: 1, [bia]: 0 }))).toEqual([
      'Falta o palpite de Bia.',
    ]);
  });

  it.each([
    ['a guess above the cards', round(2, { [ana]: 3 }, { [ana]: 0 })],
    ['a negative result', round(2, { [ana]: 0 }, { [ana]: -1 })],
    ['a result not whole', round(2, { [ana]: 0 }, { [ana]: 0.5 })],
  ])('rejects %s', (_label, input) => {
    expect(codes(input)).toEqual(['value_out_of_range']);
  });

  it('rejects results adding up to more than the cards', () => {
    const input = round(2, { [ana]: 1, [bia]: 1, [caio]: 0 }, { [ana]: 1, [bia]: 1, [caio]: 1 });
    expect(codes(input)).toEqual(['too_many_taken']);
    expect(messages(input)).toEqual(['Foram levadas 3 voltas, mas a rodada tem 2 cartas.']);
  });
});

describe('scoreRound (FR-008)', () => {
  it('takes the difference between guess and result from each player', () => {
    // Guessed 2 took 0 → −2; guessed 0 took 1 → −1; guessed right → 0.
    expect(
      scoreRound(
        round(3, { [ana]: 2, [bia]: 0, [caio]: 1 }, { [ana]: 0, [bia]: 1, [caio]: 1 }),
        players,
      ),
    ).toEqual({ [ana]: -2, [bia]: -1, [caio]: 0, [duda]: 0 });
  });

  it('charges nothing to players who did not play the round', () => {
    expect(scoreRound(round(1, { [ana]: 1 }, { [ana]: 1 }), players)).toEqual({
      [ana]: 0,
      [bia]: 0,
      [caio]: 0,
      [duda]: 0,
    });
  });

  it('charges everyone the same when all miss by the same (everybody guessed 0)', () => {
    expect(
      scoreRound(round(2, { [ana]: 0, [bia]: 0 }, { [ana]: 1, [bia]: 1 }), players.slice(0, 2)),
    ).toEqual({ [ana]: -1, [bia]: -1 });
  });
});

describe('computeTotals (FR-009)', () => {
  it('starts every player at 5 lives', () => {
    expect(STARTING_LIVES).toBe(5);
    expect(computeTotals([], players)).toEqual({ [ana]: 5, [bia]: 5, [caio]: 5, [duda]: 5 });
  });

  it('subtracts the lives lost', () => {
    expect(
      computeTotals(
        [
          { [ana]: -2, [bia]: 0, [caio]: -1, [duda]: 0 },
          { [ana]: -1, [bia]: 0, [caio]: 0, [duda]: 0 },
        ],
        players,
      ),
    ).toEqual({ [ana]: 2, [bia]: 5, [caio]: 4, [duda]: 5 });
  });

  it('never goes below 0 (1 life, misses by 3)', () => {
    expect(
      computeTotals(
        [
          { [ana]: -4, [bia]: 0, [caio]: 0, [duda]: 0 },
          { [ana]: -3, [bia]: 0, [caio]: 0, [duda]: 0 },
        ],
        players,
      )[ana],
    ).toBe(0);
  });
});

describe('resolveWinners (FR-012)', () => {
  it('the most lives win', () => {
    expect(resolveWinners({ [ana]: 2, [bia]: 0, [caio]: 0, [duda]: 0 }, players)).toEqual([ana]);
  });

  it('equal most lives share', () => {
    expect(resolveWinners({ [ana]: 3, [bia]: 3, [caio]: 1, [duda]: 0 }, players)).toEqual([
      ana,
      bia,
    ]);
  });

  it('everyone at 0 shares', () => {
    expect(resolveWinners({ [ana]: 0, [bia]: 0, [caio]: 0, [duda]: 0 }, players)).toEqual([
      ana,
      bia,
      caio,
      duda,
    ]);
  });
});

describe('nextRound (FR-010, FR-011, research D4)', () => {
  const all = { [ana]: 0, [bia]: 0, [caio]: 0, [duda]: 0 };

  it('deals 1 card to everyone at the start', () => {
    expect(nextRound([], players)).toEqual({
      cards: 1,
      alive: players,
      lives: { [ana]: 5, [bia]: 5, [caio]: 5, [duda]: 5 },
    });
  });

  it('deals one more card after a round with no player out', () => {
    const rounds = [round(1, all, all), round(2, all, all)];
    expect(nextRound(rounds, players).cards).toBe(3);
  });

  it('goes back to 1 card after a round that put a player out, and drops them', () => {
    const rounds = [
      round(1, all, { ...all, [caio]: 1 }), // Caio missed by 1 → 4
      round(2, { ...all, [caio]: 2 }, { ...all, [ana]: 1 }), // Caio −2 → 2, Ana −1 → 4
      round(3, { ...all, [caio]: 3 }, all), // Caio −3 → 0: out
    ];
    const next = nextRound(rounds, players);
    expect(next.cards).toBe(1);
    expect(next.alive.map((player) => player.id)).toEqual([ana, bia, duda]);
    expect(next.lives).toEqual({ [ana]: 4, [bia]: 5, [caio]: 0, [duda]: 5 });
  });

  it('goes back to 1 card after two players out in the same round', () => {
    const rounds = [round(5, { ...all, [ana]: 5, [bia]: 5 }, all)];
    const next = nextRound(rounds, players);
    expect(next.cards).toBe(1);
    expect(next.alive.map((player) => player.id)).toEqual([caio, duda]);
  });

  it('counts up again after the reset', () => {
    const out = round(5, { ...all, [ana]: 5 }, all);
    const rest = { [bia]: 0, [caio]: 0, [duda]: 0 };
    expect(nextRound([out, round(1, rest, rest)], players).cards).toBe(2);
  });

  it('skips stored rounds the rules do not accept', () => {
    expect(nextRound([round(1, all, all), { nonsense: true }], players).cards).toBe(2);
  });
});
