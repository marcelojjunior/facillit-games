import { describe, expect, it } from 'vitest';

import {
  computeTotals,
  firstFrom,
  fromStarter,
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

  it('accepts results adding up to more than the cards (owner, after testing)', () => {
    expect(
      codes(round(2, { [ana]: 1, [bia]: 1, [caio]: 0 }, { [ana]: 1, [bia]: 1, [caio]: 1 })),
    ).toEqual([]);
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
      from: ana,
      starter: players[0],
    });
  });

  it('deals one more card after a round with no player out', () => {
    const rounds = [round(1, all, all), round(2, all, all)];
    expect(nextRound(rounds, players).cards).toBe(3);
  });

  it('keeps counting cards after a round that put a player out, and drops them', () => {
    const rounds = [
      round(1, all, { ...all, [caio]: 1 }), // Caio missed by 1 → 4
      round(2, { ...all, [caio]: 2 }, { ...all, [ana]: 1 }), // Caio −2 → 2, Ana −1 → 4
      round(3, { ...all, [caio]: 3 }, all), // Caio −3 → 0: out
    ];
    const next = nextRound(rounds, players);
    expect(next.cards).toBe(4);
    expect(next.alive.map((player) => player.id)).toEqual([ana, bia, duda]);
    expect(next.lives).toEqual({ [ana]: 4, [bia]: 5, [caio]: 0, [duda]: 5 });
  });

  it('keeps counting cards after two players out in the same round', () => {
    const rounds = [round(5, { ...all, [ana]: 5, [bia]: 5 }, all)];
    const next = nextRound(rounds, players);
    expect(next.cards).toBe(6);
    expect(next.alive.map((player) => player.id)).toEqual([caio, duda]);
  });

  it('follows the last round, even one stored with 1 card after an elimination', () => {
    // Matches saved before FR-010 was revised reset to 1 card; they go on from there.
    const out = round(5, { ...all, [ana]: 5 }, all);
    const rest = { [bia]: 0, [caio]: 0, [duda]: 0 };
    expect(nextRound([out, round(1, rest, rest)], players).cards).toBe(2);
  });

  it('skips stored rounds the rules do not accept', () => {
    expect(nextRound([round(1, all, all), { nonsense: true }], players).cards).toBe(2);
  });
});

describe('round starter (spec 009 FR-002–FR-005)', () => {
  const ids = (list: readonly { id: string }[]) => list.map((player) => player.id);
  const exact = (who: readonly string[]) => Object.fromEntries(who.map((id) => [id, 0]));
  /** The starter of each round 1…rounds.length + 1, as `nextRound` derives it. */
  const starters = (rounds: readonly unknown[], roster = players) =>
    rounds
      .map((_, k) => nextRound(rounds.slice(0, k), roster).starter?.id)
      .concat(nextRound(rounds, roster).starter?.id);

  describe('firstFrom', () => {
    it('finds the first of `among` going forward from `fromId`, inclusive', () => {
      expect(firstFrom(players, bia, [ana, bia, duda])?.id).toBe(bia);
      expect(firstFrom(players, caio, [ana, bia, duda])?.id).toBe(duda);
    });

    it('wraps from the last player to the first', () => {
      expect(firstFrom(players, duda, [ana, bia])?.id).toBe(ana);
    });

    it('returns undefined when `among` is empty', () => {
      expect(firstFrom(players, ana, [])).toBeUndefined();
    });
  });

  describe('fromStarter', () => {
    it('rotates the list to begin at the starter', () => {
      expect(ids(fromStarter(players, caio))).toEqual([caio, duda, ana, bia]);
    });

    it('keeps the list when the starter is missing or unknown', () => {
      expect(ids(fromStarter(players, undefined))).toEqual(ids(players));
      expect(ids(fromStarter(players.slice(0, 2), caio))).toEqual([ana, bia]);
    });
  });

  it('rotates A, B, C, A among 3 players with nobody out', () => {
    const three = players.slice(0, 3);
    const all = exact(ids(three));
    const rounds = [round(1, all, all), round(2, all, all), round(3, all, all)];
    expect(starters(rounds, three)).toEqual([ana, bia, caio, ana]);
  });

  it('alternates between 2 players', () => {
    const two = players.slice(0, 2);
    const all = exact(ids(two));
    expect(starters([round(1, all, all), round(2, all, all)], two)).toEqual([ana, bia, ana]);
  });

  it('skips the starter once they are out: D, A, B, D after C', () => {
    const all = exact(ids(players));
    const rest = exact([ana, bia, duda]);
    const rounds = [
      round(1, { ...all, [caio]: 1 }, all), // A starts; Caio −1 → 4
      round(2, { ...all, [caio]: 2 }, all), // B starts; Caio −2 → 2
      round(3, { ...all, [caio]: 3 }, all), // C starts; Caio −3 → 0: out
      round(4, rest, rest),
      round(5, rest, rest),
      round(6, rest, rest),
    ];
    expect(starters(rounds)).toEqual([ana, bia, caio, duda, ana, bia, duda]);
  });

  it('skips the starter and the next in line out together: D, A, D', () => {
    const all = exact(ids(players));
    const rest = exact([ana, duda]);
    const rounds = [
      round(1, all, all), // A starts
      round(5, { ...all, [bia]: 5, [caio]: 5 }, all), // B starts; Bia and Caio −5 → 0
      round(3, rest, rest),
      round(4, rest, rest),
    ];
    expect(starters(rounds)).toEqual([ana, bia, duda, ana, duda]);
  });

  it('does not advance on a round the rules reject', () => {
    const all = exact(ids(players));
    expect(nextRound([round(1, all, all), { nonsense: true }], players).starter?.id).toBe(bia);
  });

  it("gives back the removed last round's starter", () => {
    const all = exact(ids(players));
    const rounds = [round(1, all, all), round(2, all, all)];
    expect(starters(rounds)[1]).toBe(bia);
    expect(nextRound(rounds.slice(0, -1), players).starter?.id).toBe(bia);
  });

  it('does not depend on names (FR-008)', () => {
    const all = exact(ids(players));
    const renamed = players.map((player) => ({ ...player, name: `${player.name}!` }));
    const rounds = [round(1, all, all), round(2, all, all)];
    expect(starters(rounds, renamed)).toEqual(starters(rounds));
  });

  it("picks each stored round's starter among its own players (a fixed round revived one)", () => {
    // Round 2 was stored without Bia; lives now say she is alive.
    const all = exact(ids(players));
    const noBia = exact([ana, caio, duda]);
    const rounds = [round(1, all, all), round(2, noBia, noBia)];
    // Round 2 starts with Caio (after Ana, Bia did not play), so round 3 with Duda.
    expect(
      firstFrom(
        players,
        nextRound(rounds.slice(0, 1), players).from,
        ids(players.filter((p) => p.id !== bia)),
      )?.id,
    ).toBe(caio);
    expect(nextRound(rounds, players).starter?.id).toBe(duda);
  });

  it('counts a stored player whom lives put out before the round (analyze C1)', () => {
    const all = exact(ids(players));
    const rounds = [round(5, { ...all, [bia]: 5 }, all), round(2, all, all)];
    // Lives say Bia is out after round 1, yet round 2 was stored with her.
    const before = nextRound(rounds.slice(0, 1), players);
    expect(before.starter?.id).toBe(caio);
    expect(firstFrom(players, before.from, ids(players))?.id).toBe(bia);
    expect(nextRound(rounds, players).starter?.id).toBe(caio);
  });

  it('names the last player alive, and nobody when all are out', () => {
    const two = players.slice(0, 2);
    const all = exact(ids(two));
    expect(nextRound([round(5, { ...all, [ana]: 5 }, all)], two).starter?.id).toBe(bia);
    expect(nextRound([round(5, { [ana]: 5, [bia]: 5 }, all)], two).starter).toBeUndefined();
  });
});
