import { afterEach, describe, expect, it, vi } from 'vitest';

import { testRegistry } from '../../../tests/fixtures/games/registry';
import { parsePersistedState, safeStorage, serializeState, STORAGE_KEY } from './persistence';
import type { Match } from './types';

const players = [
  { id: 'p1', name: 'Ana' },
  { id: 'p2', name: 'Bia' },
];

const match: Match = {
  gameId: 'highest-wins',
  status: 'in_progress',
  players,
  rounds: [{ ranks: { p1: 1, p2: 2 } }],
  draft: { ranks: { p1: 2 } },
};

describe('persistence — happy path (US2)', () => {
  it('uses a namespaced key (FR-023)', () => {
    expect(STORAGE_KEY).toBe('facillit-games:state');
  });

  it('writes a versioned envelope (FR-019)', () => {
    expect(JSON.parse(serializeState(match))).toEqual({ schemaVersion: 1, match });
  });

  it('round-trips a match, draft included', () => {
    expect(parsePersistedState(serializeState(match), testRegistry)).toEqual({
      match,
      notice: null,
    });
  });

  it('round-trips the empty state', () => {
    expect(parsePersistedState(serializeState(null), testRegistry)).toEqual({
      match: null,
      notice: null,
    });
  });

  it('treats a missing key as the initial state, with no notice', () => {
    expect(parsePersistedState(null, testRegistry)).toEqual({ match: null, notice: null });
  });
});

describe('safeStorage (FR-024)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when localStorage does not exist', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(safeStorage()).toBeNull();
  });

  it('returns null instead of throwing when reading localStorage throws', () => {
    // Some private-mode browsers throw on the property access itself.
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });

    expect(safeStorage()).toBeNull();
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('returns localStorage when it is available', () => {
    const fake = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    vi.stubGlobal('localStorage', fake);

    expect(safeStorage()).toBe(fake);
  });
});

describe('persistence — bad data is discarded with a reason (US5, FR-020)', () => {
  const envelope = (value: unknown) => JSON.stringify({ schemaVersion: 1, match: value });
  const withMatch = (patch: Record<string, unknown>) => envelope({ ...match, ...patch });

  it.each([
    ['unreadable', 'invalid JSON', '{not json'],
    ['wrong_shape', 'a JSON array', '[]'],
    ['wrong_shape', 'a JSON string', '"hello"'],
    ['wrong_shape', 'no schemaVersion', JSON.stringify({ match: null })],
    ['wrong_shape', 'no match', JSON.stringify({ schemaVersion: 1 })],
    ['unsupported_version', 'version 0', JSON.stringify({ schemaVersion: 0, match: null })],
    ['unsupported_version', 'a newer version', JSON.stringify({ schemaVersion: 2, match: null })],
    [
      'unsupported_version',
      'a string version',
      JSON.stringify({ schemaVersion: '1', match: null }),
    ],
    ['wrong_shape', 'a bad status', withMatch({ status: 'paused' })],
    ['wrong_shape', 'a missing gameId', withMatch({ gameId: undefined })],
    ['wrong_shape', 'rounds that are not an array', withMatch({ rounds: {} })],
    [
      'wrong_shape',
      'duplicate player ids',
      withMatch({ players: [players[0], { id: 'p1', name: 'Outra' }] }),
    ],
    ['wrong_shape', 'a blank name', withMatch({ players: [{ id: 'p1', name: '  ' }] })],
    [
      'wrong_shape',
      'a 31-code-point name',
      withMatch({ players: [{ id: 'p1', name: 'x'.repeat(31) }] }),
    ],
    ['wrong_shape', 'an untrimmed name', withMatch({ players: [{ id: 'p1', name: ' Ana' }] })],
    ['unknown_game', 'an unregistered game', withMatch({ gameId: 'removed-game' })],
    [
      'invalid_round',
      'a round the game rejects',
      withMatch({ rounds: [{ ranks: { p1: 9, p2: 1 } }] }),
    ],
  ])('%s: %s', (reason, _label, raw) => {
    expect(parsePersistedState(raw, testRegistry)).toEqual({ match: null, notice: { reason } });
  });

  it('keeps a stored round valid after its player is renamed (rounds use ids)', () => {
    const renamed = withMatch({ players: [{ id: 'p1', name: 'Aninha' }, players[1]] });

    expect(parsePersistedState(renamed, testRegistry).match?.players[0]?.name).toBe('Aninha');
  });

  it.each([null, 42, 'texto', [1, 2], { deep: { nested: true } }])(
    'accepts any JSON draft without validating it: %j',
    (draft) => {
      expect(parsePersistedState(withMatch({ draft }), testRegistry).notice).toBeNull();
    },
  );
});
