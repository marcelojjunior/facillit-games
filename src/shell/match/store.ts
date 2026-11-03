/**
 * The match store (specs/002-game-contract/contracts/match-store.md).
 *
 * A thin effectful wrapper around the pure operations of `match.ts`
 * (research D4): run the operation, WRITE it, then swap the state and notify.
 * It also follows other tabs through the browser's `storage` event (D10) and
 * keeps the discard notice in memory only (D11).
 *
 * Create it only in the browser, inside a `client:only` island (FR-024): it
 * reads storage once, at creation.
 */
import type { Game, Registry, Scores } from '../game/contract';
import * as ops from './match';
import {
  parsePersistedState,
  safeStorage,
  serializeState,
  STORAGE_KEY,
  type DiscardNotice,
  type StorageLike,
} from './persistence';
import type { Match, MatchError, MatchResult } from './types';

/** The part of `window` the store uses to follow other tabs. */
export interface StorageEventSource {
  addEventListener(type: 'storage', listener: (event: StorageEvent) => void): void;
  removeEventListener(type: 'storage', listener: (event: StorageEvent) => void): void;
}

export interface MatchStoreOptions {
  readonly registry: Registry;
  /** Default: the browser's localStorage, safely accessed; null = none. */
  readonly storage?: StorageLike | null;
  /** Default: `crypto.randomUUID`. */
  readonly createId?: () => string;
  /** Default: `window`, when there is one. */
  readonly events?: StorageEventSource;
}

export interface MatchView {
  readonly match: Match;
  readonly game: Game;
  /** Derived on every change, never stored (FR-016). */
  readonly evaluation: {
    readonly roundScores: readonly Scores[];
    readonly totals: Scores;
    /** Meaningful once the match is finished. */
    readonly winners: readonly string[];
  };
}

export type OperationResult =
  | { readonly ok: true; readonly persisted: boolean }
  | { readonly ok: false; readonly error: MatchError };

export interface MatchStore {
  getState(): MatchView | null;
  subscribe(listener: () => void): () => void;
  getDiscardNotice(): DiscardNotice | null;
  acknowledgeDiscardNotice(): void;
  dispose(): void;

  createMatch(gameId: string): OperationResult;
  addPlayer(name: string): OperationResult;
  renamePlayer(playerId: string, name: string): OperationResult;
  removePlayer(playerId: string): OperationResult;
  start(): OperationResult;
  updateDraft(draft: unknown): OperationResult;
  confirmRound(input: unknown): OperationResult;
  replaceRound(index: number, input: unknown): OperationResult;
  removeLastRound(): OperationResult;
  finish(): OperationResult;
  createRematch(): OperationResult;
  discardMatch(): OperationResult;
}

function defaultEvents(): StorageEventSource | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

export function createMatchStore(options: MatchStoreOptions): MatchStore {
  const { registry } = options;
  const storage = options.storage === undefined ? safeStorage() : options.storage;
  const events = options.events ?? defaultEvents();
  const context: ops.MatchContext = {
    registry,
    createId: options.createId ?? (() => crypto.randomUUID()),
  };

  const listeners = new Set<() => void>();
  let match: Match | null = null;
  let view: MatchView | null = null;
  let notice: DiscardNotice | null = null;

  function toView(next: Match | null): MatchView | null {
    if (next === null) {
      return null;
    }
    const game = registry.get(next.gameId);
    const evaluation = game?.evaluate(next.rounds, next.players);
    if (game === undefined || evaluation === undefined || !evaluation.ok) {
      // Unreachable: every stored or mutated match went through the game.
      throw new Error(`Match for "${next.gameId}" cannot be evaluated.`);
    }
    const { roundScores, totals, winners } = evaluation;
    return { match: next, game, evaluation: { roundScores, totals, winners } };
  }

  function commit(next: Match | null): void {
    match = next;
    view = toView(next);
    listeners.forEach((listener) => listener());
  }

  function read(): string | null {
    try {
      return storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null; // FR-020: storage not accessible → initial state, no notice
    }
  }

  function write(next: Match | null): boolean {
    if (storage === null) {
      return false;
    }
    try {
      storage.setItem(STORAGE_KEY, serializeState(next));
      return true;
    } catch {
      return false; // FR-021: memory still advances; the caller is told
    }
  }

  /** Load path shared by creation and other-tab changes. Never writes back. */
  function load(raw: string | null): void {
    const result = parsePersistedState(raw, registry);
    if (result.notice !== null) {
      notice = result.notice;
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // Nothing else to do: the bad data is ignored either way.
      }
    }
    match = result.match;
    view = toView(match);
  }

  function apply(run: (current: Match | null) => MatchResult<Match | null>): OperationResult {
    const result = run(match);
    if (!result.ok) {
      return result;
    }
    const persisted = write(result.match); // persist, then commit (FR-018)
    commit(result.match);
    return { ok: true, persisted };
  }

  const onStorage = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY) {
      return;
    }
    load(event.newValue);
    listeners.forEach((listener) => listener());
  };

  load(read());
  events?.addEventListener('storage', onStorage);

  return {
    getState: () => view,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getDiscardNotice: () => notice,
    acknowledgeDiscardNotice() {
      notice = null;
      listeners.forEach((listener) => listener());
    },
    dispose() {
      events?.removeEventListener('storage', onStorage);
    },

    createMatch: (gameId) => apply((m) => ops.createMatch(m, gameId, context)),
    addPlayer: (name) => apply((m) => ops.addPlayer(m, name, context)),
    renamePlayer: (id, name) => apply((m) => ops.renamePlayer(m, id, name, context)),
    removePlayer: (id) => apply((m) => ops.removePlayer(m, id, context)),
    start: () => apply((m) => ops.start(m, context)),
    updateDraft: (draft) => apply((m) => ops.updateDraft(m, draft, context)),
    confirmRound: (input) => apply((m) => ops.confirmRound(m, input, context)),
    replaceRound: (index, input) => apply((m) => ops.replaceRound(m, index, input, context)),
    removeLastRound: () => apply((m) => ops.removeLastRound(m, context)),
    finish: () => apply((m) => ops.finish(m, context)),
    createRematch: () => apply((m) => ops.createRematch(m, context)),
    discardMatch: () => apply(() => ({ ok: true, match: null })),
  };
}
