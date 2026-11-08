/**
 * The game contract (constitution Principles II, III, V).
 *
 * A game is written against its own round type `R` through `GameDefinition<R>`.
 * `defineGame` closes over `R` and returns a `Game`, which has no type
 * parameter, so the registry can hold games of different shapes without `any`
 * (research D2). The shell only ever sees `Game`.
 *
 * See specs/002-game-contract/contracts/game-contract.md and, for the round
 * entry and positions, specs/003-shell-screens/contracts/round-entry.md.
 */
import type { ComponentType } from 'react'; // type-only: rules load no React runtime

export interface PlayerRef {
  readonly id: string;
  readonly name: string;
}

/** Points keyed by player id. */
export type Scores = Readonly<Record<string, number>>;

export interface RoundRejection {
  /** Stable English identifier, e.g. 'rank_out_of_range'. */
  readonly code: string;
  /** Portuguese text shown to the player as is. */
  readonly message: string;
}

export type RoundValidation<R> =
  | { readonly ok: true; readonly round: R }
  | { readonly ok: false; readonly reasons: readonly RoundRejection[] };

/**
 * What the shell gives a game's round entry (research D1 of spec 003). The
 * entry is a controlled editor of one round as a JSON-serializable value; it
 * renders no submit button, because the shell owns confirm, save, and cancel.
 */
export interface RoundEntryProps {
  /** Match players, in roster order. */
  readonly players: readonly PlayerRef[];
  /**
   * The stored draft, or the stored input of the round being fixed. May be
   * `undefined` or any shape an earlier version stored: render an empty entry
   * for anything unrecognised, never throw (FR-012).
   */
  readonly value: unknown;
  /** Report every edit. The value MUST be JSON-serializable. */
  readonly onChange: (value: unknown) => void;
  /** Reasons from the last rejected confirm or save; may be empty. */
  readonly reasons: readonly RoundRejection[];
}

export type RoundEntryComponent = ComponentType<RoundEntryProps>;

/**
 * What a game declares. The four rule functions MUST be pure (FR-005): no
 * storage, DOM, clock, randomness, input mutation, or module-level state.
 *
 * Property syntax (not method syntax) on purpose: it keeps parameter checks
 * contravariant under `strictFunctionTypes`, so a mismatched game does not
 * type-check by accident (research D2).
 */
export interface GameDefinition<R> {
  /** kebab-case, equal to the game's folder name (FR-001). */
  readonly id: string;
  /** Display name, Portuguese (user-facing copy). */
  readonly name: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  /** The only way a value becomes an `R` (research D1). Never throws on bad input. */
  readonly validateRound: (input: unknown, players: readonly PlayerRef[]) => RoundValidation<R>;
  readonly scoreRound: (round: R, players: readonly PlayerRef[]) => Scores;
  readonly computeTotals: (roundScores: readonly Scores[], players: readonly PlayerRef[]) => Scores;
  /** Winner ids; more than one on a tie (FR-004). */
  readonly resolveWinners: (totals: Scores, players: readonly PlayerRef[]) => readonly string[];
  /** The game's own screen piece for entering a round (spec 003, FR-009). */
  readonly RoundEntry: RoundEntryComponent;
  /** Decorative picture for the game list badge; the shell's trophy when absent (spec 006). */
  readonly Icon?: ComponentType;
}

export type RoundVerdict =
  { readonly ok: true } | { readonly ok: false; readonly reasons: readonly RoundRejection[] };

export type Evaluation =
  | {
      readonly ok: true;
      readonly roundScores: readonly Scores[];
      readonly totals: Scores;
      readonly winners: readonly string[];
      /**
       * Position of each player (1 = best), keyed by id: winners are 1, the
       * winners among the rest come next, and so on. Ties share a position and
       * skip the following ones (1, 1, 3). Zero rounds → everyone is 1.
       */
      readonly positions: Scores;
    }
  | {
      readonly ok: false;
      readonly roundIndex: number;
      readonly reasons: readonly RoundRejection[];
    };

/** A game as the shell sees it: no round type, only closed results. */
export interface Game {
  readonly id: string;
  readonly name: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly validateRound: (input: unknown, players: readonly PlayerRef[]) => RoundVerdict;
  readonly evaluate: (rounds: readonly unknown[], players: readonly PlayerRef[]) => Evaluation;
  readonly RoundEntry: RoundEntryComponent;
  readonly Icon?: ComponentType;
}

/** Implemented in src/games/registry.ts; typed here so the shell never imports from src/games/. */
export interface Registry {
  readonly list: () => readonly Game[];
  readonly get: (id: string) => Game | undefined;
}

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Programming errors (FR-009a): a broken game declaration or a rule function
 * that breaks the contract. They throw so the game's own tests catch them;
 * player input and stored data never reach this path.
 */
function contractError(gameId: string, message: string): Error {
  return new Error(`Game "${gameId}" breaks the game contract: ${message}`);
}

function assertScores(
  gameId: string,
  source: string,
  scores: Scores,
  players: readonly PlayerRef[],
): void {
  const expected = new Set(players.map((player) => player.id));
  const actual = Object.keys(scores);

  for (const id of actual) {
    if (!expected.has(id)) {
      throw contractError(gameId, `${source} returned a score for unknown player "${id}".`);
    }
    const value = scores[id];
    if (!Number.isInteger(value)) {
      throw contractError(gameId, `${source} returned ${String(value)}, not a finite integer.`);
    }
  }
  if (actual.length !== expected.size) {
    throw contractError(gameId, `${source} must return exactly one score per player.`);
  }
}

export function defineGame<R>(definition: GameDefinition<R>): Game {
  const { id, name, minPlayers, maxPlayers } = definition;

  if (!KEBAB_CASE.test(id)) {
    throw contractError(id, 'id must be kebab-case.');
  }
  if (!Number.isInteger(minPlayers) || !Number.isInteger(maxPlayers)) {
    throw contractError(id, 'player limits must be integers.');
  }
  if (minPlayers < 1 || minPlayers > maxPlayers) {
    throw contractError(id, 'player limits must satisfy 1 <= minPlayers <= maxPlayers.');
  }
  if (typeof definition.RoundEntry !== 'function') {
    throw contractError(id, 'RoundEntry must be a component.');
  }
  if (definition.Icon !== undefined && typeof definition.Icon !== 'function') {
    throw contractError(id, 'Icon, when present, must be a component.');
  }

  /**
   * Positions by peeling winners (research D2 of spec 003): the game's own
   * resolveWinners decides every place, so the shell never needs to know
   * whether the highest or the lowest total wins.
   */
  const positionsOf = (
    totals: Scores,
    players: readonly PlayerRef[],
    firstWinners: readonly string[],
  ): Scores => {
    const positions: Record<string, number> = {};
    let remaining = [...players];
    let next: readonly string[] = firstWinners;
    while (remaining.length > 0) {
      const winners = new Set(next);
      const peeled = remaining.filter((player) => winners.has(player.id));
      if (peeled.length === 0 || peeled.length !== winners.size) {
        throw contractError(id, 'resolveWinners must return at least one of the given players.');
      }
      const position = players.length - remaining.length + 1;
      for (const player of peeled) {
        positions[player.id] = position;
      }
      remaining = remaining.filter((player) => !winners.has(player.id));
      if (remaining.length > 0) {
        next = definition.resolveWinners(totals, remaining);
      }
    }
    return positions;
  };

  const validate = (input: unknown, players: readonly PlayerRef[]): RoundValidation<R> => {
    const result = definition.validateRound(input, players);
    if (!result.ok && result.reasons.length === 0) {
      throw contractError(id, 'validateRound rejected a round without any reason.');
    }
    return result;
  };

  return {
    id,
    name,
    minPlayers,
    maxPlayers,

    validateRound: (input, players) => {
      const result = validate(input, players);
      return result.ok ? { ok: true } : { ok: false, reasons: result.reasons };
    },

    evaluate: (rounds, players) => {
      const roundScores: Scores[] = [];

      for (const [roundIndex, input] of rounds.entries()) {
        const result = validate(input, players);
        if (!result.ok) {
          return { ok: false, roundIndex, reasons: result.reasons };
        }
        const scores = definition.scoreRound(result.round, players);
        assertScores(id, 'scoreRound', scores, players);
        roundScores.push(scores);
      }

      const totals = definition.computeTotals(roundScores, players);
      assertScores(id, 'computeTotals', totals, players);

      // FR-004: with no rounds played, everyone is tied, whatever the game's
      // winner direction or starting totals.
      if (rounds.length === 0) {
        const everyone = players.map((player) => player.id);
        const positions = Object.fromEntries(everyone.map((playerId) => [playerId, 1]));
        return { ok: true, roundScores, totals, winners: everyone, positions };
      }

      const winners = definition.resolveWinners(totals, players);
      return {
        ok: true,
        roundScores,
        totals,
        winners,
        positions: positionsOf(totals, players, winners),
      };
    },

    RoundEntry: definition.RoundEntry,
    ...(definition.Icon === undefined ? {} : { Icon: definition.Icon }),
  };
}
