/**
 * Pure match operations (FR-013, research D4).
 *
 * Every function takes the current match (or null) and returns a new one, or
 * an error value. Nothing here reads storage, the clock, or randomness: player
 * ids come from `context.createId`. Inputs are never mutated. Allowed states
 * and error codes follow specs/002-game-contract/data-model.md.
 */
import type { Game, Registry } from '../game/contract';
import type { Match, MatchError, MatchErrorCode, MatchResult, MatchStatus, Player } from './types';

export interface MatchContext {
  readonly registry: Registry;
  readonly createId: () => string;
}

const MAX_NAME_LENGTH = 30;
const CONTROL_CHARACTER = /\p{Cc}/u;

function fail(code: MatchErrorCode): { ok: false; error: MatchError } {
  return { ok: false, error: { code } };
}

function succeed(match: Match): { ok: true; match: Match } {
  return { ok: true, match };
}

/** True for values that survive a JSON round trip unchanged (FR-018a). */
export function isJsonValue(value: unknown, seen: Set<object> = new Set()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value !== 'object' || seen.has(value)) {
    return false; // undefined, function, bigint, symbol, or a cycle
  }
  seen.add(value);
  const result = Array.isArray(value)
    ? value.every((item) => isJsonValue(item, seen))
    : (Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null) &&
      Object.values(value).every((item) => isJsonValue(item, seen));
  seen.delete(value);
  return result;
}

/** A detached copy, so later changes by the caller cannot reach the match. */
function jsonCopy(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Resolves the match's game and checks its status. Every operation except
 * createMatch goes through here first.
 */
function guard(
  match: Match | null,
  allowed: readonly MatchStatus[],
  context: MatchContext,
): { ok: true; match: Match; game: Game } | { ok: false; error: MatchError } {
  if (match === null) {
    return fail('no_match');
  }
  if (!allowed.includes(match.status)) {
    return fail('invalid_status');
  }
  const game = context.registry.get(match.gameId);
  if (game === undefined) {
    return fail('game_not_found');
  }
  return { ok: true, match, game };
}

/** FR-022 / research D9. Returns the name to store, or an error code. */
function checkName(
  raw: string,
  players: readonly Player[],
  exceptId?: string,
): { ok: true; name: string } | { ok: false; error: MatchError } {
  const name = raw.trim();
  if (name === '') {
    return fail('blank_name');
  }
  if (CONTROL_CHARACTER.test(name)) {
    return fail('invalid_name');
  }
  if ([...name].length > MAX_NAME_LENGTH) {
    return fail('name_too_long');
  }
  const taken = players.some(
    (player) =>
      player.id !== exceptId &&
      player.name.localeCompare(name, 'pt-BR', { sensitivity: 'accent' }) === 0,
  );
  if (taken) {
    return fail('duplicate_name');
  }
  return { ok: true, name };
}

function withoutDraft(match: Match): Match {
  return {
    gameId: match.gameId,
    status: match.status,
    players: match.players,
    rounds: match.rounds,
  };
}

/**
 * Validates a round input through the game. The input is stored as a JSON
 * copy, so what is in memory is exactly what will be persisted (SC-003).
 */
export function checkRound(
  game: Game,
  match: Match,
  input: unknown,
): { ok: true; round: unknown } | { ok: false; error: MatchError } {
  if (!isJsonValue(input)) {
    return {
      ok: false,
      error: {
        code: 'invalid_round',
        reasons: [{ code: 'not_serializable', message: 'Rodada em formato inválido.' }],
      },
    };
  }
  const round = jsonCopy(input);
  const verdict = game.validateRound(round, match.players);
  if (!verdict.ok) {
    return { ok: false, error: { code: 'invalid_round', reasons: verdict.reasons } };
  }
  return { ok: true, round };
}

export function createMatch(
  current: Match | null,
  gameId: string,
  context: MatchContext,
): MatchResult {
  if (current !== null && current.status !== 'finished') {
    return fail('match_in_progress');
  }
  if (context.registry.get(gameId) === undefined) {
    return fail('game_not_found');
  }
  return succeed({ gameId, status: 'setting_up', players: [], rounds: [] });
}

export function addPlayer(match: Match | null, name: string, context: MatchContext): MatchResult {
  const checked = guard(match, ['setting_up'], context);
  if (!checked.ok) {
    return checked;
  }
  if (checked.match.players.length >= checked.game.maxPlayers) {
    return fail('roster_full');
  }
  const valid = checkName(name, checked.match.players);
  if (!valid.ok) {
    return valid;
  }
  const player: Player = { id: context.createId(), name: valid.name };
  return succeed({ ...checked.match, players: [...checked.match.players, player] });
}

export function renamePlayer(
  match: Match | null,
  playerId: string,
  name: string,
  context: MatchContext,
): MatchResult {
  const checked = guard(match, ['setting_up', 'in_progress'], context);
  if (!checked.ok) {
    return checked;
  }
  if (!checked.match.players.some((player) => player.id === playerId)) {
    return fail('player_not_found');
  }
  const valid = checkName(name, checked.match.players, playerId);
  if (!valid.ok) {
    return valid;
  }
  return succeed({
    ...checked.match,
    players: checked.match.players.map((player) =>
      player.id === playerId ? { ...player, name: valid.name } : player,
    ),
  });
}

export function removePlayer(
  match: Match | null,
  playerId: string,
  context: MatchContext,
): MatchResult {
  const checked = guard(match, ['setting_up'], context);
  if (!checked.ok) {
    return checked;
  }
  const players = checked.match.players.filter((player) => player.id !== playerId);
  if (players.length === checked.match.players.length) {
    return fail('player_not_found');
  }
  return succeed({ ...checked.match, players });
}

export function start(match: Match | null, context: MatchContext): MatchResult {
  const checked = guard(match, ['setting_up'], context);
  if (!checked.ok) {
    return checked;
  }
  const count = checked.match.players.length;
  if (count < checked.game.minPlayers) {
    return fail('roster_too_small');
  }
  if (count > checked.game.maxPlayers) {
    return fail('roster_too_large');
  }
  return succeed({ ...checked.match, status: 'in_progress' });
}

export function updateDraft(
  match: Match | null,
  draft: unknown,
  context: MatchContext,
): MatchResult {
  const checked = guard(match, ['in_progress'], context);
  if (!checked.ok) {
    return checked;
  }
  if (!isJsonValue(draft)) {
    return fail('invalid_draft');
  }
  return succeed({ ...checked.match, draft: jsonCopy(draft) });
}

export function confirmRound(
  match: Match | null,
  input: unknown,
  context: MatchContext,
): MatchResult {
  const checked = guard(match, ['in_progress'], context);
  if (!checked.ok) {
    return checked;
  }
  const round = checkRound(checked.game, checked.match, input);
  if (!round.ok) {
    return round;
  }
  // FR-015a: confirming clears the draft.
  return succeed(
    withoutDraft({ ...checked.match, rounds: [...checked.match.rounds, round.round] }),
  );
}

export function replaceRound(
  match: Match | null,
  index: number,
  input: unknown,
  context: MatchContext,
): MatchResult {
  const checked = guard(match, ['in_progress'], context);
  if (!checked.ok) {
    return checked;
  }
  if (!Number.isInteger(index) || index < 0 || index >= checked.match.rounds.length) {
    return fail('round_not_found');
  }
  const round = checkRound(checked.game, checked.match, input);
  if (!round.ok) {
    return round;
  }
  // FR-015a: the draft is left untouched.
  return succeed({
    ...checked.match,
    rounds: checked.match.rounds.map((existing, i) => (i === index ? round.round : existing)),
  });
}

export function removeLastRound(match: Match | null, context: MatchContext): MatchResult {
  const checked = guard(match, ['in_progress'], context);
  if (!checked.ok) {
    return checked;
  }
  if (checked.match.rounds.length === 0) {
    return fail('round_not_found');
  }
  return succeed({ ...checked.match, rounds: checked.match.rounds.slice(0, -1) });
}

export function finish(match: Match | null, context: MatchContext): MatchResult {
  const checked = guard(match, ['in_progress'], context);
  if (!checked.ok) {
    return checked;
  }
  return succeed(withoutDraft({ ...checked.match, status: 'finished' }));
}

export function createRematch(match: Match | null, context: MatchContext): MatchResult {
  const checked = guard(match, ['finished'], context);
  if (!checked.ok) {
    return checked;
  }
  return succeed({
    gameId: checked.match.gameId,
    status: 'setting_up',
    players: checked.match.players,
    rounds: [],
  });
}
