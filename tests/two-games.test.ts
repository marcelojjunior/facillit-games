import { describe, expect, it } from 'vitest';

import {
  addPlayer,
  confirmRound,
  createMatch,
  finish,
  start,
  type MatchContext,
} from '../src/shell/match/match';
import type { Match, MatchResult } from '../src/shell/match/types';
import { testRegistry } from './fixtures/games/registry';

/**
 * User Story 1: two games with different limits, round shapes, and winner
 * directions run through the SAME shell calls. Nothing below branches on which
 * game is being played except the inputs a screen would collect.
 */

function ok<M extends Match | null>(result: MatchResult<M>): M {
  if (!result.ok) {
    throw new Error(`expected success, got ${JSON.stringify(result.error)}`);
  }
  return result.match;
}

function playFullMatch(gameId: string, names: readonly string[], rounds: readonly unknown[]) {
  let next = 0;
  const ctx: MatchContext = { registry: testRegistry, createId: () => `p${++next}` };

  let match = ok(createMatch(null, gameId, ctx));
  for (const name of names) {
    match = ok(addPlayer(match, name, ctx));
  }
  match = ok(start(match, ctx));
  for (const round of rounds) {
    match = ok(confirmRound(match, round, ctx));
  }
  match = ok(finish(match, ctx));

  const game = testRegistry.get(gameId);
  const evaluation = game?.evaluate(match.rounds, match.players);
  return { match, evaluation };
}

describe('two games, one shell', () => {
  it('lists both games with their names and limits, in registration order', () => {
    expect(
      testRegistry.list().map(({ id, name, minPlayers, maxPlayers }) => ({
        id,
        name,
        minPlayers,
        maxPlayers,
      })),
    ).toEqual([
      { id: 'highest-wins', name: 'Maior Vence', minPlayers: 2, maxPlayers: 4 },
      { id: 'lowest-wins', name: 'Menor Vence', minPlayers: 3, maxPlayers: 6 },
    ]);
  });

  it('plays a full highest-wins match', () => {
    const { match, evaluation } = playFullMatch(
      'highest-wins',
      ['Ana', 'Bia'],
      [
        { ranks: { p1: 1, p2: 2 } }, // Ana 20, Bia 10
        { ranks: { p1: 2, p2: 1 } }, // Ana 10, Bia 20
        { ranks: { p1: 1, p2: 1 } }, // shared first: 20 each
      ],
    );

    expect(match.status).toBe('finished');
    expect(evaluation).toMatchObject({
      ok: true,
      totals: { p1: 50, p2: 50 },
      winners: ['p1', 'p2'],
    });
  });

  it('plays a full lowest-wins match', () => {
    const { match, evaluation } = playFullMatch(
      'lowest-wins',
      ['Ana', 'Bia', 'Caio'],
      [
        { points: { p1: 5, p2: 2, p3: 9 } },
        { points: { p1: 1, p2: 8, p3: -4 } },
        { points: { p1: 0, p2: 3, p3: 1 } },
      ],
    );

    expect(match.status).toBe('finished');
    expect(evaluation).toMatchObject({
      ok: true,
      totals: { p1: 6, p2: 13, p3: 6 },
      winners: ['p1', 'p3'],
    });
  });

  it('rejects a game that is not registered', () => {
    const ctx: MatchContext = { registry: testRegistry, createId: () => 'x' };

    expect(createMatch(null, 'meche-meche', ctx)).toEqual({
      ok: false,
      error: { code: 'game_not_found' },
    });
  });
});
