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

  const total = Object.values(outTaken).reduce((sum, value) => sum + value, 0);
  if (total > cards) {
    return reject(
      'too_many_taken',
      `Foram levadas ${total} voltas, mas a rodada tem ${cardsLabel(cards)}.`,
    );
  }
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

export interface NextRound {
  readonly cards: number;
  /** Players with lives left, in roster order. */
  readonly alive: readonly PlayerRef[];
  readonly lives: Scores;
}

/**
 * The round to deal after the stored `rounds` (research D4): 1 card at the
 * start and after any round that put a player out, else one more than the
 * round before. Rounds the rules do not accept are skipped.
 */
export function nextRound(rounds: readonly unknown[], players: readonly PlayerRef[]): NextRound {
  const scores: Scores[] = [];
  let cards = 1;
  let lives = computeTotals([], players);
  for (const input of rounds) {
    const result = validateRound(input, players);
    if (!result.ok) {
      continue;
    }
    scores.push(scoreRound(result.round, players));
    const after = computeTotals(scores, players);
    const someoneOut = players.some(
      (player) => (lives[player.id] ?? 0) > 0 && after[player.id] === 0,
    );
    cards = someoneOut ? 1 : result.round.cards + 1;
    lives = after;
  }
  return { cards, alive: players.filter((player) => (lives[player.id] ?? 0) > 0), lives };
}
