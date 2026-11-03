import { describe, expect, it } from 'vitest';

import { testRegistry } from '../../../tests/fixtures/games/registry';
import { STORAGE_KEY, serializeState, type StorageLike } from './persistence';
import { createMatchStore, type MatchStore, type StorageEventSource } from './store';

/** In-memory storage. `failWrites` simulates a full or blocked storage. */
function fakeStorage(initial: string | null = null) {
  const data = new Map<string, string>();
  if (initial !== null) {
    data.set(STORAGE_KEY, initial);
  }
  const calls = { setItem: 0, removeItem: 0 };
  const storage = {
    failWrites: false,
    failReads: false,
    onWrite: (): void => undefined,
    getItem(key: string) {
      if (storage.failReads) {
        throw new Error('SecurityError');
      }
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      calls.setItem++;
      storage.onWrite();
      if (storage.failWrites) {
        throw new Error('QuotaExceededError');
      }
      data.set(key, value);
    },
    removeItem(key: string) {
      calls.removeItem++;
      data.delete(key);
    },
  } satisfies StorageLike & Record<string, unknown>;
  return { storage, data, calls };
}

/** A stand-in for `window` that lets a test play "another tab wrote". */
function fakeEvents() {
  const listeners = new Set<(event: StorageEvent) => void>();
  const events: StorageEventSource = {
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  function otherTabWrote(key: string, newValue: string | null) {
    const event = { key, newValue } as StorageEvent;
    listeners.forEach((listener) => listener(event));
  }
  return { events, otherTabWrote, listeners };
}

function createStore(storage: StorageLike | null, events = fakeEvents().events): MatchStore {
  let next = 0;
  return createMatchStore({
    registry: testRegistry,
    storage,
    createId: () => `p${++next}`,
    events,
  });
}

/** Ranks in roster order, for `highest-wins`. */
function ranksInOrder(store: MatchStore) {
  const players = store.getState()?.match.players ?? [];
  return { ranks: Object.fromEntries(players.map((player, i) => [player.id, i + 1])) };
}

function playing(store: MatchStore) {
  store.createMatch('highest-wins');
  store.addPlayer('Ana');
  store.addPlayer('Bia');
  store.start();
}

describe('match store — survives a closed tab (US2)', () => {
  it('reload after every operation returns the same match (SC-003)', () => {
    const { storage } = fakeStorage();
    const store = createStore(storage);
    const steps: [string, () => unknown][] = [
      ['createMatch', () => store.createMatch('highest-wins')],
      ['addPlayer', () => store.addPlayer('Ana')],
      ['addPlayer', () => store.addPlayer('Bia')],
      ['addPlayer', () => store.addPlayer('Caio')],
      ['removePlayer', () => store.removePlayer('p3')],
      ['renamePlayer', () => store.renamePlayer('p1', 'Aninha')],
      ['start', () => store.start()],
      ['updateDraft', () => store.updateDraft({ ranks: { p1: 1 } })],
      ['confirmRound', () => store.confirmRound(ranksInOrder(store))],
      ['confirmRound', () => store.confirmRound(ranksInOrder(store))],
      ['replaceRound', () => store.replaceRound(0, { ranks: { p1: 2, p2: 1 } })],
      ['removeLastRound', () => store.removeLastRound()],
      ['finish', () => store.finish()],
      ['createRematch', () => store.createRematch()],
      ['discardMatch', () => store.discardMatch()],
    ];

    for (const [name, run] of steps) {
      expect(run(), name).toMatchObject({ ok: true, persisted: true });
      expect(createStore(storage).getState()?.match, name).toEqual(store.getState()?.match);
    }
  });

  it('restores a started match with no rounds as in progress (US2 acceptance 2)', () => {
    const { storage } = fakeStorage();
    playing(createStore(storage));

    expect(createStore(storage).getState()?.match.status).toBe('in_progress');
  });

  it('writes to storage before the state changes and before subscribers run (FR-018)', () => {
    const { storage } = fakeStorage();
    const store = createStore(storage);
    const seen: string[] = [];
    storage.onWrite = () => seen.push(`write, state=${store.getState() === null ? 'old' : 'new'}`);
    store.subscribe(() => seen.push('notify'));

    store.createMatch('highest-wins');

    expect(seen).toEqual(['write, state=old', 'notify']);
  });

  it('persists the draft, and rejects one that cannot be stored (FR-018a)', () => {
    const { storage, calls } = fakeStorage();
    const store = createStore(storage);
    playing(store);

    store.updateDraft({ ranks: { p1: 1 } });
    expect(createStore(storage).getState()?.match.draft).toEqual({ ranks: { p1: 1 } });

    const writes = calls.setItem;
    for (const bad of [{ f: () => 1 }, { n: 1n }, { x: undefined }, Number.NaN]) {
      expect(store.updateDraft(bad)).toEqual({ ok: false, error: { code: 'invalid_draft' } });
    }
    expect(calls.setItem).toBe(writes);
    expect(store.getState()?.match.draft).toEqual({ ranks: { p1: 1 } });
  });

  it('keeps working in memory when a write fails, and recovers on the next write (FR-021)', () => {
    const { storage, data } = fakeStorage();
    const store = createStore(storage);
    playing(store);
    const lastGood = data.get(STORAGE_KEY);

    storage.failWrites = true;
    expect(store.confirmRound(ranksInOrder(store))).toEqual({ ok: true, persisted: false });
    expect(store.getState()?.match.rounds).toHaveLength(1);
    expect(data.get(STORAGE_KEY)).toBe(lastGood);
    expect(createStore(storage).getState()?.match.rounds).toHaveLength(0);

    storage.failWrites = false;
    expect(store.updateDraft({ partial: true })).toEqual({ ok: true, persisted: true });
    expect(createStore(storage).getState()?.match.rounds).toHaveLength(1);
  });

  it('a failed operation writes nothing and notifies no one', () => {
    const { storage, calls } = fakeStorage();
    const store = createStore(storage);
    let notified = 0;
    store.subscribe(() => notified++);

    expect(store.createMatch('no-such-game')).toEqual({
      ok: false,
      error: { code: 'game_not_found' },
    });
    expect(calls.setItem).toBe(0);
    expect(notified).toBe(0);
  });

  it('returns the same state object between operations', () => {
    const store = createStore(fakeStorage().storage);
    playing(store);

    expect(store.getState()).toBe(store.getState());
  });

  it('unsubscribe stops notifications', () => {
    const store = createStore(fakeStorage().storage);
    let notified = 0;
    const unsubscribe = store.subscribe(() => notified++);
    store.createMatch('highest-wins');
    unsubscribe();
    store.addPlayer('Ana');

    expect(notified).toBe(1);
  });

  it('starts empty, without throwing, when no storage exists (FR-024)', () => {
    const store = createMatchStore({ registry: testRegistry });

    expect(store.getState()).toBeNull();
    expect(store.createMatch('highest-wins')).toEqual({ ok: true, persisted: false });
  });
});

describe('match store — tabs stay in sync (FR-021a)', () => {
  it('takes the match another tab saved, notifies, and does not write back', () => {
    const { storage, calls } = fakeStorage();
    const { events, otherTabWrote } = fakeEvents();
    const store = createStore(storage, events);
    let notified = 0;
    store.subscribe(() => notified++);

    const otherTab = createStore(fakeStorage().storage);
    playing(otherTab);
    otherTabWrote(STORAGE_KEY, serializeState(otherTab.getState()?.match ?? null));

    expect(store.getState()?.match).toEqual(otherTab.getState()?.match);
    expect(notified).toBe(1);
    expect(calls.setItem).toBe(0);
  });

  it('ignores changes to other keys', () => {
    const { events, otherTabWrote } = fakeEvents();
    const store = createStore(fakeStorage().storage, events);
    let notified = 0;
    store.subscribe(() => notified++);

    otherTabWrote('something-else', '{}');

    expect(notified).toBe(0);
  });

  it('goes back to no match when another tab clears the key', () => {
    const { storage } = fakeStorage();
    const { events, otherTabWrote } = fakeEvents();
    const store = createStore(storage, events);
    playing(store);

    otherTabWrote(STORAGE_KEY, null);

    expect(store.getState()).toBeNull();
  });

  it('dispose stops listening to other tabs', () => {
    const { events, listeners } = fakeEvents();
    const store = createStore(fakeStorage().storage, events);
    expect(listeners.size).toBe(1);

    store.dispose();

    expect(listeners.size).toBe(0);
  });
});

describe('match store — scores are always right (US3)', () => {
  it('a tie for the best total makes every tied player a winner', () => {
    const store = createStore(fakeStorage().storage);
    playing(store);
    store.confirmRound({ ranks: { p1: 1, p2: 2 } });
    store.confirmRound({ ranks: { p1: 2, p2: 1 } });
    store.finish();

    expect(store.getState()?.evaluation).toMatchObject({
      totals: { p1: 30, p2: 30 },
      winners: ['p1', 'p2'],
    });
  });

  it('finishing with zero rounds makes every player a winner (FR-004)', () => {
    const store = createStore(fakeStorage().storage);
    playing(store);
    store.finish();

    expect(store.getState()?.evaluation.winners).toEqual(['p1', 'p2']);
  });

  it("an invalid round returns the game's reasons unchanged (US3 acceptance 1)", () => {
    const store = createStore(fakeStorage().storage);
    playing(store);

    expect(store.confirmRound({ ranks: { p1: 1, p2: 9 } })).toEqual({
      ok: false,
      error: {
        code: 'invalid_round',
        reasons: [
          {
            code: 'rank_out_of_range',
            message: 'A colocação de Bia precisa estar entre 1 e 2.',
          },
        ],
      },
    });
  });
});

describe('match store — fixing a wrong round (US4)', () => {
  it('totals follow a replaced and a removed round, and both survive a reload', () => {
    const { storage } = fakeStorage();
    const store = createStore(storage);
    playing(store);
    store.confirmRound({ ranks: { p1: 1, p2: 2 } }); // 20 / 10
    store.confirmRound({ ranks: { p1: 1, p2: 2 } }); // 20 / 10
    store.confirmRound({ ranks: { p1: 2, p2: 1 } }); // 10 / 20

    store.replaceRound(1, { ranks: { p1: 2, p2: 1 } });
    expect(store.getState()?.evaluation.totals).toEqual({ p1: 40, p2: 50 });
    expect(createStore(storage).getState()?.match.rounds).toEqual(store.getState()?.match.rounds);

    store.removeLastRound();
    expect(store.getState()?.evaluation.totals).toEqual({ p1: 30, p2: 30 });
    expect(createStore(storage).getState()?.match.rounds).toHaveLength(2);
  });
});
