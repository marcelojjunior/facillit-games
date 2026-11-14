/**
 * LEVA rules (specs/007-leva, data-model.md): every player starts with 5
 * lives; in each round each player guesses how many tricks they will take and
 * loses the difference to what they took; at 0 lives a player is out; the
 * most lives win.
 *
 * Pure (Principle III): no DOM, storage, clock, or randomness; input stays
 * `unknown` until checked.
 */
import type {
  GameDefinition,
  PlayerRef,
  RoundRejection,
  RoundValidation,
  Scores,
} from '../../shell/game/contract';

export const STARTING_LIVES = 5;

/** One round as stored: its cards, and the guess and result of each player who played it. */
export interface LevaRound {
  readonly cards: number;
  readonly guesses: Readonly<Record<string, number>>;
  readonly taken: Readonly<Record<string, number>>;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectAll(reasons: RoundRejection[]): RoundValidation<LevaRound> {
  return { ok: false, reasons };
}

function reject(code: string, message: string): RoundValidation<LevaRound> {
  return rejectAll([{ code, message }]);
}

export function cardsLabel(cards: number): string {
  return cards === 1 ? '1 carta' : `${cards} cartas`;
}

export const validateRound: GameDefinition<LevaRound>['validateRound'] = (input, players) => {
  if (!isRecord(input)) {
    return reject('invalid_shape', 'Rodada em formato inválido.');
  }
  const { cards } = input;
  const guesses = input.guesses ?? {};
  const taken = input.taken ?? {};
  if (
    typeof cards !== 'number' ||
    !Number.isInteger(cards) ||
    cards < 1 ||
    !isRecord(guesses) ||
    !isRecord(taken)
  ) {
    return reject('invalid_shape', 'Rodada em formato inválido.');
  }
  if (Object.keys(guesses).length === 0) {
    return reject('no_players', 'A rodada não tem jogadores.');
  }
  const known = new Set(players.map((player) => player.id));
  if ([...Object.keys(guesses), ...Object.keys(taken)].some((id) => !known.has(id))) {
    return reject('unknown_player', 'A rodada cita um jogador que não está na partida.');
  }

  const inRange = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= cards;

  const reasons: RoundRejection[] = [];
  const outGuesses: Record<string, number> = {};
  const outTaken: Record<string, number> = {};
  for (const player of players) {
    const guess = guesses[player.id];
    const took = taken[player.id];
    if (guess === undefined && took === undefined) {
      continue;
    }
    if (guess === undefined) {
      reasons.push({ code: 'missing_guess', message: `Falta o palpite de ${player.name}.` });
    } else if (took === undefined) {
      reasons.push({ code: 'missing_taken', message: `Falta quantas ${player.name} levou.` });
    } else if (!inRange(guess) || !inRange(took)) {
      reasons.push({
        code: 'value_out_of_range',
        message: `${player.name}: o valor tem que ser de 0 a ${cards}.`,
      });
    } else {
      outGuesses[player.id] = guess;
      outTaken[player.id] = took;
    }
  }
  if (reasons.length > 0) {
    return rejectAll(reasons);
  }

  // ponytail: no limit on the total taken; the owner wants any entry scored (spec 007 FR-007).
  return { ok: true, round: { cards, guesses: outGuesses, taken: outTaken } };
};

export const scoreRound: GameDefinition<LevaRound>['scoreRound'] = (round, players) =>
  Object.fromEntries(
    players.map((player) => {
      const guess = round.guesses[player.id];
      const took = round.taken[player.id];
      return [
        player.id,
        guess === undefined || took === undefined ? 0 : 0 - Math.abs(guess - took),
      ];
    }),
  );

export const computeTotals: GameDefinition<LevaRound>['computeTotals'] = (roundScores, players) =>
  Object.fromEntries(
    players.map((player) => [
      player.id,
      Math.max(
        0,
        roundScores.reduce((sum, scores) => sum + (scores[player.id] ?? 0), STARTING_LIVES),
      ),
    ]),
  );

export const resolveWinners: GameDefinition<LevaRound>['resolveWinners'] = (totals, players) => {
  const best = Math.max(...players.map((player) => totals[player.id] ?? 0));
  return players.filter((player) => totals[player.id] === best).map((player) => player.id);
};

/**
 * The first player of `among` (ids) found going forward in cyclic roster order
 * from `fromId`, inclusive (spec 009 FR-003); `undefined` when `among` is empty.
 */
export function firstFrom(
  players: readonly PlayerRef[],
  fromId: string,
  among: readonly string[],
): PlayerRef | undefined {
  const start = Math.max(
    0,
    players.findIndex((player) => player.id === fromId),
  );
  return players
    .map((_, offset) => players[(start + offset) % players.length])
    .find((player): player is PlayerRef => player !== undefined && among.includes(player.id));
}

/** `playing` rotated to begin at the starter; unchanged if the starter is not in it. */
export function fromStarter(
  playing: readonly PlayerRef[],
  starterId: string | undefined,
): readonly PlayerRef[] {
  const at = playing.findIndex((player) => player.id === starterId);
  return at <= 0 ? playing : [...playing.slice(at), ...playing.slice(0, at)];
}

export interface NextRound {
  readonly cards: number;
  /** Players with lives left, in roster order. */
  readonly alive: readonly PlayerRef[];
  readonly lives: Scores;
  /** The id the next rotation starts from: the player after the last starter (spec 009). */
  readonly from: string;
  /** Who guesses first in the next round: `firstFrom(players, from, alive)`. */
  readonly starter: PlayerRef | undefined;
}

/**
 * The round to deal after the stored `rounds` (spec 007 research D4): 1 card
 * at the start, else one more than the round before, also after an
 * elimination (FR-010 as revised). Rounds the rules do not accept are skipped,
 * and do not advance the starter either (spec 009 FR-005). Each round's
 * starter is picked among that round's own players (spec 009 FR-003).
 */
export function nextRound(rounds: readonly unknown[], players: readonly PlayerRef[]): NextRound {
  const scores: Scores[] = [];
  let cards = 1;
  let from = players[0]?.id ?? '';
  for (const input of rounds) {
    const result = validateRound(input, players);
    if (result.ok) {
      scores.push(scoreRound(result.round, players));
      cards = result.round.cards + 1;
      const starter = firstFrom(players, from, Object.keys(result.round.guesses));
      const at = players.findIndex((player) => player.id === starter?.id);
      from = players[(at + 1) % players.length]?.id ?? from;
    }
  }
  const lives = computeTotals(scores, players);
  const alive = players.filter((player) => (lives[player.id] ?? 0) > 0);
  const starter = firstFrom(
    players,
    from,
    alive.map((player) => player.id),
  );
  return { cards, alive, lives, from, starter };
}
