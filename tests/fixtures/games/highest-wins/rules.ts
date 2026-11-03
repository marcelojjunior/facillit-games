/**
 * Fixture game `highest-wins` — exists only to test the shell (research D8).
 *
 * Each round records every player's finishing place, 1..n (n = number of
 * players). Shared places are allowed: two players tied for 2nd both get 2.
 * Place p is worth (n - p + 1) * 10 points. Highest total wins.
 */
import type {
  GameDefinition,
  RoundRejection,
  RoundValidation,
} from '../../../../src/shell/game/contract';

export interface RanksRound {
  readonly ranks: Readonly<Record<string, number>>;
}

function reject(code: string, message: string): RoundValidation<RanksRound> {
  const reason: RoundRejection = { code, message };
  return { ok: false, reasons: [reason] };
}

export const validateRound: GameDefinition<RanksRound>['validateRound'] = (input, players) => {
  if (typeof input !== 'object' || input === null || !('ranks' in input)) {
    return reject('not_an_object', 'Rodada em formato inválido.');
  }
  const { ranks } = input;
  if (typeof ranks !== 'object' || ranks === null) {
    return reject('not_an_object', 'Rodada em formato inválido.');
  }

  const known = new Set(players.map((player) => player.id));
  for (const id of Object.keys(ranks)) {
    if (!known.has(id)) {
      return reject('unknown_player', 'A rodada cita um jogador que não está na partida.');
    }
  }

  const result: Record<string, number> = {};
  for (const player of players) {
    const rank: unknown = Reflect.get(ranks, player.id);
    if (rank === undefined) {
      return reject('missing_player', `Falta a colocação de ${player.name}.`);
    }
    if (typeof rank !== 'number' || !Number.isInteger(rank)) {
      return reject('invalid_rank', `A colocação de ${player.name} precisa ser um número inteiro.`);
    }
    if (rank < 1 || rank > players.length) {
      return reject(
        'rank_out_of_range',
        `A colocação de ${player.name} precisa estar entre 1 e ${players.length}.`,
      );
    }
    result[player.id] = rank;
  }

  return { ok: true, round: { ranks: result } };
};

export const scoreRound: GameDefinition<RanksRound>['scoreRound'] = (round, players) => {
  const scores: Record<string, number> = {};
  for (const player of players) {
    const rank = round.ranks[player.id] ?? players.length;
    scores[player.id] = (players.length - rank + 1) * 10;
  }
  return scores;
};

export const computeTotals: GameDefinition<RanksRound>['computeTotals'] = (
  roundScores,
  players,
) => {
  const totals: Record<string, number> = {};
  for (const player of players) {
    totals[player.id] = roundScores.reduce((sum, scores) => sum + (scores[player.id] ?? 0), 0);
  }
  return totals;
};

export const resolveWinners: GameDefinition<RanksRound>['resolveWinners'] = (totals, players) => {
  const best = Math.max(...players.map((player) => totals[player.id] ?? 0));
  return players.filter((player) => totals[player.id] === best).map((player) => player.id);
};
