import { describe, expect, it } from 'vitest';

import { testRegistry } from '../../../tests/fixtures/games/registry';
import {
  addPlayer,
  confirmRound,
  createMatch,
  createRematch,
  finish,
  removePlayer,
  renamePlayer,
  start,
  type MatchContext,
} from './match';
import type { Match, MatchResult } from './types';

function context(): MatchContext {
  let next = 0;
  return { registry: testRegistry, createId: () => `p${++next}` };
}

/** Unwraps a successful result, failing the test with the error otherwise. */
function ok<M extends Match | null>(result: MatchResult<M>): M {
  if (!result.ok) {
    throw new Error(`expected success, got ${JSON.stringify(result.error)}`);
  }
  return result.match;
}

function errorCode(result: MatchResult<Match | null>): string | undefined {
  return result.ok ? undefined : result.error.code;
}

/** A `highest-wins` match (2–4 players) with the given names, still setting up. */
function setUp(names: readonly string[], ctx = context()): Match {
  let match = ok(createMatch(null, 'highest-wins', ctx));
  for (const name of names) {
    match = ok(addPlayer(match, name, ctx));
  }
  return match;
}

function inProgress(names: readonly string[] = ['Ana', 'Bia'], ctx = context()): Match {
  return ok(start(setUp(names, ctx), ctx));
}

/** A valid `highest-wins` round: players finish in roster order. */
function ranksInOrder(match: Match) {
  return { ranks: Object.fromEntries(match.players.map((player, i) => [player.id, i + 1])) };
}

describe('createMatch', () => {
  it('creates an empty match in setting_up', () => {
    expect(ok(createMatch(null, 'highest-wins', context()))).toEqual({
      gameId: 'highest-wins',
      status: 'setting_up',
      players: [],
      rounds: [],
    });
  });

  it('rejects an unregistered game (FR-009)', () => {
    expect(errorCode(createMatch(null, 'no-such-game', context()))).toBe('game_not_found');
  });

  it('rejects while another match is setting up or in progress (FR-011a)', () => {
    expect(errorCode(createMatch(setUp([]), 'lowest-wins', context()))).toBe('match_in_progress');
    expect(errorCode(createMatch(inProgress(), 'lowest-wins', context()))).toBe(
      'match_in_progress',
    );
  });

  it('replaces a finished match', () => {
    const ctx = context();
    const finished = ok(finish(inProgress(['Ana', 'Bia'], ctx), ctx));

    expect(ok(createMatch(finished, 'lowest-wins', ctx)).gameId).toBe('lowest-wins');
  });
});

describe('addPlayer (FR-014, FR-022)', () => {
  it('adds a player with a new id and the trimmed name as typed', () => {
    const match = setUp(['  Maria de Souza  ']);

    expect(match.players).toEqual([{ id: 'p1', name: 'Maria de Souza' }]);
  });

  it('rejects at the game maximum', () => {
    expect(errorCode(addPlayer(setUp(['A', 'B', 'C', 'D']), 'E', context()))).toBe('roster_full');
  });

  it.each([
    ['blank_name', '   '],
    ['name_too_long', 'x'.repeat(31)],
    ['invalid_name', 'Ana\u0007'],
    ['duplicate_name', 'ana'],
    ['duplicate_name', ' ANA '],
  ])('rejects with %s for %j', (code, name) => {
    expect(errorCode(addPlayer(setUp(['Ana']), name, context()))).toBe(code);
  });

  it('counts Unicode code points, not UTF-16 units', () => {
    // 30 emoji are 60 UTF-16 units but 30 code points.
    expect(addPlayer(setUp([]), '😀'.repeat(30), context()).ok).toBe(true);
    expect(errorCode(addPlayer(setUp([]), '😀'.repeat(31), context()))).toBe('name_too_long');
  });

  it('treats accents as different names', () => {
    expect(addPlayer(setUp(['José']), 'Jose', context()).ok).toBe(true);
  });

  it('does not mutate the input match', () => {
    const match = setUp(['Ana']);
    const snapshot = structuredClone(match);

    addPlayer(match, 'Bia', context());
    addPlayer(match, 'ana', context());

    expect(match).toEqual(snapshot);
  });
});

describe('renamePlayer', () => {
  it('renames while setting up and in progress, keeping the id', () => {
    const ctx = context();
    const renamed = ok(renamePlayer(setUp(['Ana', 'Bia'], ctx), 'p1', 'Aninha', ctx));
    expect(renamed.players[0]).toEqual({ id: 'p1', name: 'Aninha' });

    const playing = inProgress(['Ana', 'Bia'], ctx);
    expect(
      ok(renamePlayer(playing, playing.players[1]?.id ?? '', 'Bea', ctx)).players[1]?.name,
    ).toBe('Bea');
  });

  it('allows renaming to the own name or a case variant (FR-022)', () => {
    expect(renamePlayer(setUp(['Ana']), 'p1', 'ANA', context()).ok).toBe(true);
  });

  it('rejects a name taken by another player', () => {
    expect(errorCode(renamePlayer(setUp(['Ana', 'Bia']), 'p1', 'bia', context()))).toBe(
      'duplicate_name',
    );
  });

  it('rejects an unknown player and a finished match', () => {
    const ctx = context();
    expect(errorCode(renamePlayer(setUp(['Ana']), 'nope', 'X', ctx))).toBe('player_not_found');

    const finished = ok(finish(inProgress(['Ana', 'Bia'], ctx), ctx));
    expect(errorCode(renamePlayer(finished, 'p1', 'X', ctx))).toBe('invalid_status');
  });
});

describe('removePlayer', () => {
  it('removes while setting up', () => {
    expect(ok(removePlayer(setUp(['Ana', 'Bia']), 'p1', context())).players).toEqual([
      { id: 'p2', name: 'Bia' },
    ]);
  });

  it('rejects an unknown player, and any removal once started', () => {
    expect(errorCode(removePlayer(setUp(['Ana']), 'nope', context()))).toBe('player_not_found');
    expect(errorCode(removePlayer(inProgress(), 'p1', context()))).toBe('invalid_status');
  });
});

describe('start (FR-014)', () => {
  it('starts within the game limits', () => {
    expect(inProgress(['Ana', 'Bia']).status).toBe('in_progress');
  });

  it('rejects below the minimum', () => {
    expect(errorCode(start(setUp(['Ana']), context()))).toBe('roster_too_small');
  });

  it('rejects above the maximum', () => {
    // The roster can only exceed the maximum if the game's limits changed
    // since it was built; simulate that with a raw match.
    const crowded: Match = {
      gameId: 'highest-wins',
      status: 'setting_up',
      players: ['A', 'B', 'C', 'D', 'E'].map((name) => ({ id: name, name })),
      rounds: [],
    };
    expect(errorCode(start(crowded, context()))).toBe('roster_too_large');
  });
});

describe('confirmRound (FR-015, FR-015a)', () => {
  it('records a valid round and clears the draft', () => {
    const match: Match = { ...inProgress(), draft: { anything: true } };

    const next = ok(confirmRound(match, ranksInOrder(match), context()));

    expect(next.rounds).toEqual([ranksInOrder(match)]);
    expect(next).not.toHaveProperty('draft');
  });

  it("returns the game's reasons unchanged and keeps the draft", () => {
    const match: Match = { ...inProgress(), draft: { partial: 1 } };

    const result = confirmRound(match, { ranks: { p1: 1 } }, context());

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'invalid_round',
        reasons: [{ code: 'missing_player', message: 'Falta a colocação de Bia.' }],
      },
    });
    expect(match.draft).toEqual({ partial: 1 });
  });

  it('validates against the current roster by id, so a rename does not matter', () => {
    const ctx = context();
    const match = ok(renamePlayer(inProgress(['Ana', 'Bia'], ctx), 'p1', 'Aninha', ctx));

    expect(confirmRound(match, ranksInOrder(match), ctx).ok).toBe(true);
  });

  it('rejects a round that cannot be stored as JSON', () => {
    const match = inProgress();

    expect(errorCode(confirmRound(match, { ranks: { p1: 1, p2: 2n } }, context()))).toBe(
      'invalid_round',
    );
  });
});

describe('finish and rematch', () => {
  it('finishes, even with zero rounds', () => {
    expect(ok(finish(inProgress(), context())).status).toBe('finished');
  });

  it('a finished match accepts no round changes (FR-017)', () => {
    const ctx = context();
    const finished = ok(finish(inProgress(['Ana', 'Bia'], ctx), ctx));

    expect(errorCode(confirmRound(finished, ranksInOrder(finished), ctx))).toBe('invalid_status');
  });

  it('a rematch keeps game, names, and order, with no rounds (FR-017a)', () => {
    const ctx = context();
    let match = inProgress(['Ana', 'Bia', 'Caio'], ctx);
    match = ok(confirmRound(match, ranksInOrder(match), ctx));
    match = ok(finish(match, ctx));

    const rematch = ok(createRematch(match, ctx));

    expect(rematch).toEqual({
      gameId: 'highest-wins',
      status: 'setting_up',
      players: match.players,
      rounds: [],
    });
  });

  it('a rematch is only possible from a finished match', () => {
    expect(errorCode(createRematch(inProgress(), context()))).toBe('invalid_status');
  });
});

describe('state guards', () => {
  it('every operation except createMatch fails with no_match when there is no match', () => {
    const ctx = context();
    const results = [
      addPlayer(null, 'Ana', ctx),
      renamePlayer(null, 'p1', 'Ana', ctx),
      removePlayer(null, 'p1', ctx),
      start(null, ctx),
      confirmRound(null, {}, ctx),
      finish(null, ctx),
      createRematch(null, ctx),
    ];

    expect(results.map(errorCode)).toEqual(Array(results.length).fill('no_match'));
  });

  it('operations outside their allowed states fail with invalid_status', () => {
    const ctx = context();
    const settingUp = setUp(['Ana', 'Bia'], ctx);
    const playing = inProgress(['Ana', 'Bia'], ctx);

    expect(
      [
        confirmRound(settingUp, {}, ctx),
        finish(settingUp, ctx),
        addPlayer(playing, 'Caio', ctx),
        start(playing, ctx),
      ].map(errorCode),
    ).toEqual(['invalid_status', 'invalid_status', 'invalid_status', 'invalid_status']);
  });
});
