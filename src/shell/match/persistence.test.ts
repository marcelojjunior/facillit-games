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
