import { describe, expect, it } from 'vitest';

import { defineGame, type Game } from '../shell/game/contract';
import { createRegistry, registry } from './registry';

function stubGame(id: string): Game {
  return defineGame<null>({
    id,
    name: id,
    minPlayers: 1,
    maxPlayers: 2,
    validateRound: () => ({ ok: true, round: null }),
    scoreRound: (_round, players) => Object.fromEntries(players.map((p) => [p.id, 0])),
    computeTotals: (_scores, players) => Object.fromEntries(players.map((p) => [p.id, 0])),
    resolveWinners: (_totals, players) => players.map((p) => p.id),
    RoundEntry: () => null,
  });
}

describe('createRegistry', () => {
  const first = stubGame('first-game');
  const second = stubGame('second-game');

  it('lists games in registration order', () => {
    expect(createRegistry([first, second]).list()).toEqual([first, second]);
    expect(createRegistry([second, first]).list()).toEqual([second, first]);
  });

  it('resolves a game by id', () => {
    expect(createRegistry([first, second]).get('second-game')).toBe(second);
  });

  it('returns undefined for an unknown id instead of failing (FR-009)', () => {
    expect(createRegistry([first]).get('missing-game')).toBeUndefined();
  });

  it('throws on a duplicate id, a programming error (FR-007, FR-009a)', () => {
    expect(() => createRegistry([first, stubGame('first-game')])).toThrow();
  });
});

describe('production registry', () => {
  it('lists MECHE-MECHE and LEVA (spec 005 FR-017, spec 007 FR-021)', () => {
    const games = registry.list();
    expect(games.map((game) => game.id)).toEqual(['meche-meche', 'leva']);
    expect(games[0]).toMatchObject({ name: 'MECHE-MECHE', minPlayers: 2, maxPlayers: 7 });
    // A card game shows its own picture on the game list (spec 006 FR-006).
    expect(games[0]?.Icon).toBeTypeOf('function');
    expect(games[0]?.unit).toBeUndefined();
    expect(games[1]).toMatchObject({
      name: 'LEVA',
      minPlayers: 2,
      maxPlayers: 10,
      unit: { one: 'vida', other: 'vidas' },
    });
    expect(games[1]?.Icon).toBeTypeOf('function');
  });
});
