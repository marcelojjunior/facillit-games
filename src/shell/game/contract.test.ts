import { describe, expect, it } from 'vitest';

import { defineGame, type GameDefinition, type PlayerRef, type Scores } from './contract';

/**
 * A tiny game used only here: each round is `{ points: Record<id, number> }`,
 * totals are sums, highest total wins. It records the order its functions run
 * so the test can assert `evaluate` calls them as validate → score → totals →
 * winners (research D2).
 */
interface PointsRound {
  readonly points: Readonly<Record<string, number>>;
}

function makeGame(overrides: Partial<GameDefinition<PointsRound>> = {}) {
  const calls: string[] = [];

  const definition: GameDefinition<PointsRound> = {
    id: 'tiny-game',
    name: 'Jogo Pequeno',
    minPlayers: 2,
    maxPlayers: 4,
    validateRound: (input, players) => {
      calls.push('validate');
      if (typeof input !== 'object' || input === null || !('points' in input)) {
        return { ok: false, reasons: [{ code: 'not_an_object', message: 'Rodada inválida.' }] };
      }
      const { points } = input;
      if (typeof points !== 'object' || points === null) {
        return { ok: false, reasons: [{ code: 'not_an_object', message: 'Rodada inválida.' }] };
      }
      const record: Record<string, number> = {};
      for (const player of players) {
        const value: unknown = Reflect.get(points, player.id);
        if (typeof value !== 'number') {
          return {
            ok: false,
            reasons: [{ code: 'missing_player', message: `Faltam pontos de ${player.name}.` }],
          };
        }
        record[player.id] = value;
      }
      return { ok: true, round: { points: record } };
    },
    scoreRound: (round) => {
      calls.push('score');
      return round.points;
    },
    computeTotals: (roundScores, players) => {
      calls.push('totals');
      const totals: Record<string, number> = {};
      for (const player of players) {
        totals[player.id] = roundScores.reduce((sum, scores) => sum + (scores[player.id] ?? 0), 0);
      }
      return totals;
    },
    resolveWinners: (totals, players) => {
      calls.push('winners');
      const best = Math.max(...players.map((player) => totals[player.id] ?? 0));
      return players.filter((player) => totals[player.id] === best).map((player) => player.id);
    },
    ...overrides,
  };

  return { game: defineGame(definition), calls };
}

const players: readonly PlayerRef[] = [
  { id: 'p1', name: 'Ana' },
  { id: 'p2', name: 'Bia' },
];

describe('defineGame', () => {
  it('exposes the static fields', () => {
    const { game } = makeGame();

    expect(game).toMatchObject({
      id: 'tiny-game',
      name: 'Jogo Pequeno',
      minPlayers: 2,
      maxPlayers: 4,
    });
  });

  describe('validateRound', () => {
    it('accepts a valid round without exposing the typed round', () => {
      const { game } = makeGame();

      expect(game.validateRound({ points: { p1: 10, p2: 20 } }, players)).toEqual({ ok: true });
    });

    it("returns the game's reasons unchanged", () => {
      const { game } = makeGame();

      expect(game.validateRound({ points: { p1: 10 } }, players)).toEqual({
        ok: false,
        reasons: [{ code: 'missing_player', message: 'Faltam pontos de Bia.' }],
      });
    });
  });

  describe('evaluate', () => {
    it('returns round scores in order, totals, and winners', () => {
      const { game } = makeGame();

      const evaluation = game.evaluate(
        [{ points: { p1: 10, p2: 20 } }, { points: { p1: 30, p2: 5 } }],
        players,
      );

      expect(evaluation).toEqual({
        ok: true,
        roundScores: [
          { p1: 10, p2: 20 },
          { p1: 30, p2: 5 },
        ],
        totals: { p1: 40, p2: 25 },
        winners: ['p1'],
      });
    });

    it('calls the rule functions in the order validate → score → totals → winners', () => {
      const { game, calls } = makeGame();

      game.evaluate([{ points: { p1: 1, p2: 2 } }], players);

      expect(calls).toEqual(['validate', 'score', 'totals', 'winners']);
    });

    it('rejects at the first invalid stored round, with its index and reasons', () => {
      const { game } = makeGame();

      const evaluation = game.evaluate(
        [{ points: { p1: 1, p2: 2 } }, { points: { p1: 3 } }, 'garbage'],
        players,
      );

      expect(evaluation).toEqual({
        ok: false,
        roundIndex: 1,
        reasons: [{ code: 'missing_player', message: 'Faltam pontos de Bia.' }],
      });
    });

    it('makes every player a winner when there are no rounds (FR-004)', () => {
      // A lowest-wins game whose totals start above zero for one player would
      // otherwise pick a single winner from no play at all.
      const { game } = makeGame({
        computeTotals: (_scores, ps) => Object.fromEntries(ps.map((p, i) => [p.id, i])),
        resolveWinners: () => ['p1'],
      });

      const evaluation = game.evaluate([], players);

      expect(evaluation).toMatchObject({ ok: true, winners: ['p1', 'p2'] });
    });
  });

  describe('programming errors (FR-009a)', () => {
    it.each([
      ['a non-integer minPlayers', { minPlayers: 1.5 }],
      ['a non-integer maxPlayers', { maxPlayers: 3.5 }],
      ['minPlayers below 1', { minPlayers: 0 }],
      ['minPlayers above maxPlayers', { minPlayers: 5, maxPlayers: 4 }],
      ['an id that is not kebab-case', { id: 'Tiny_Game' }],
      ['an id with a trailing hyphen', { id: 'tiny-' }],
    ])('defineGame throws for %s', (_label, override) => {
      expect(() => makeGame(override)).toThrow();
    });

    const badScores: [string, (ps: readonly PlayerRef[]) => Scores][] = [
      ['a non-integer score', () => ({ p1: 1.5, p2: 0 })],
      ['a non-finite score', () => ({ p1: Number.POSITIVE_INFINITY, p2: 0 })],
      ['a missing player', () => ({ p1: 1 })],
      ['an id that is not in the match', () => ({ p1: 1, p2: 2, intruder: 3 })],
    ];

    it.each(badScores)('evaluate throws when scoreRound returns %s (FR-001a)', (_label, score) => {
      const { game } = makeGame({ scoreRound: (_round, ps) => score(ps) });

      expect(() => game.evaluate([{ points: { p1: 1, p2: 2 } }], players)).toThrow();
    });

    it.each(badScores)(
      'evaluate throws when computeTotals returns %s (FR-001a)',
      (_label, score) => {
        const { game } = makeGame({ computeTotals: (_scores, ps) => score(ps) });

        expect(() => game.evaluate([{ points: { p1: 1, p2: 2 } }], players)).toThrow();
      },
    );

    it('throws when a game rejects with an empty reasons list (FR-003)', () => {
      const { game } = makeGame({ validateRound: () => ({ ok: false, reasons: [] }) });

      expect(() => game.validateRound({}, players)).toThrow();
      expect(() => game.evaluate([{}], players)).toThrow();
    });
  });
});
