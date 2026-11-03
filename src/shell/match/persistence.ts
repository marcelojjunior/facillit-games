/**
 * Persisted state: one namespaced key, one versioned envelope (research D6).
 *
 *   facillit-games:state  →  { "schemaVersion": 1, "match": Match | null }
 *
 * Reading never throws. Anything that does not pass the load validation of
 * specs/002-game-contract/data-model.md is discarded with a reason (FR-020,
 * FR-020a). No `any`, no casts: values stay `unknown` until a guard narrows
 * them (Principle V).
 */
import type { Registry } from '../game/contract';
import { checkName } from './match';
import type { Match, MatchStatus, Player } from './types';

export const STORAGE_KEY = 'facillit-games:state';

const SCHEMA_VERSION = 1;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type DiscardReason =
  'unreadable' | 'wrong_shape' | 'unsupported_version' | 'unknown_game' | 'invalid_round';

export interface DiscardNotice {
  readonly reason: DiscardReason;
}

export interface LoadResult {
  readonly match: Match | null;
  /** Set when stored data was discarded; null when there was nothing to discard. */
  readonly notice: DiscardNotice | null;
}

const STATUSES: readonly MatchStatus[] = ['setting_up', 'in_progress', 'finished'];

/**
 * The browser's localStorage, or null. Reading the property itself throws in
 * some private-mode browsers, and it does not exist during the build (FR-024).
 */
export function safeStorage(): StorageLike | null {
  try {
    const storage: unknown = Reflect.get(globalThis, 'localStorage');
    return isStorageLike(storage) ? storage : null;
  } catch {
    return null;
  }
}

function isStorageLike(value: unknown): value is StorageLike {
  return (
    isRecord(value) &&
    typeof value.getItem === 'function' &&
    typeof value.setItem === 'function' &&
    typeof value.removeItem === 'function'
  );
}

export function serializeState(match: Match | null): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, match });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStatus(value: unknown): value is MatchStatus {
  return STATUSES.some((status) => status === value);
}

/** Players with string ids and names, unique ids, and names that meet FR-022. */
function parsePlayers(value: unknown): Player[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const players: Player[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
      return null;
    }
    const { id, name } = item;
    if (players.some((player) => player.id === id)) {
      return null;
    }
    const checked = checkName(name, players);
    if (!checked.ok || checked.name !== name) {
      return null;
    }
    players.push({ id, name });
  }
  return players;
}

function parseMatch(value: unknown): Match | null {
  if (!isRecord(value) || typeof value.gameId !== 'string' || !isStatus(value.status)) {
    return null;
  }
  const players = parsePlayers(value.players);
  if (players === null || !Array.isArray(value.rounds)) {
    return null;
  }
  const rounds: unknown[] = value.rounds;
  const match: Match = { gameId: value.gameId, status: value.status, players, rounds };
  // FR-018a: the draft is never validated; any JSON value is kept.
  return 'draft' in value && value.draft !== undefined ? { ...match, draft: value.draft } : match;
}

function discard(reason: DiscardReason): LoadResult {
  return { match: null, notice: { reason } };
}

/** The seven load steps of data-model.md, in order. Never throws. */
export function parsePersistedState(raw: string | null, registry: Registry): LoadResult {
  if (raw === null) {
    return { match: null, notice: null };
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return discard('unreadable');
  }

  if (!isRecord(envelope) || !('schemaVersion' in envelope) || !('match' in envelope)) {
    return discard('wrong_shape');
  }

  switch (envelope.schemaVersion) {
    case SCHEMA_VERSION:
      break;
    // Future migrations go here: `case 1: envelope = migrateFrom1(envelope)`.
    default:
      return discard('unsupported_version');
  }

  if (envelope.match === null) {
    return { match: null, notice: null };
  }

  const match = parseMatch(envelope.match);
  if (match === null) {
    return discard('wrong_shape');
  }

  const game = registry.get(match.gameId);
  if (game === undefined) {
    return discard('unknown_game');
  }

  if (!game.evaluate(match.rounds, match.players).ok) {
    return discard('invalid_round');
  }

  return { match, notice: null };
}
