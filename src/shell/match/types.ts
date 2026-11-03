/**
 * Match model (specs/002-game-contract/data-model.md).
 */
import type { PlayerRef, RoundRejection } from '../game/contract';

/**
 * A participant. `id` is opaque, assigned on add, never changes (research D5).
 * `name`: "Trimmed; not blank; ≤ 30 Unicode code points; no control
 * characters; unique in the match ignoring case, not accents; stored as typed"
 * (FR-022).
 */
export type Player = PlayerRef;

/** "Explicit; never inferred from rounds" (FR-012). */
export type MatchStatus = 'setting_up' | 'in_progress' | 'finished';

export interface Match {
  readonly gameId: string;
  readonly status: MatchStatus;
  /** Order of addition; kept by a rematch (FR-017a). */
  readonly players: readonly Player[];
  /** Confirmed round inputs, as accepted by the game, in play order (FR-002). */
  readonly rounds: readonly unknown[];
  /** The round being filled in; only while in progress (FR-018a). */
  readonly draft?: unknown;
}

export type MatchErrorCode =
  | 'game_not_found'
  | 'match_in_progress'
  | 'no_match'
  | 'invalid_status'
  | 'roster_full'
  | 'roster_too_small'
  | 'roster_too_large'
  | 'blank_name'
  | 'name_too_long'
  | 'invalid_name'
  | 'duplicate_name'
  | 'player_not_found'
  | 'round_not_found'
  | 'invalid_draft';

export type MatchError =
  | { readonly code: 'invalid_round'; readonly reasons: readonly RoundRejection[] }
  | { readonly code: MatchErrorCode };

export type MatchResult<M extends Match | null = Match> =
  { readonly ok: true; readonly match: M } | { readonly ok: false; readonly error: MatchError };
