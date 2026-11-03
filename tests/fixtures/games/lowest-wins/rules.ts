/**
 * Fixture game `lowest-wins` — exists only to test the shell (research D8).
 *
 * Each round records a free integer per player (negatives allowed). Totals are
 * sums. The LOWEST total wins (FR-006).
 */
import type {
  GameDefinition,
  RoundRejection,
  RoundValidation,
} from '../../../../src/shell/game/contract';

export interface PointsRound {
  readonly points: Readonly<Record<string, number>>;
}

function reject(code: string, message: string): RoundValidation<PointsRound> {
  const reason: RoundRejection = { code, message };
  return { ok: false, reasons: [reason] };
}

export const validateRound: GameDefinition<PointsRound>['validateRound'] = (input, players) => {
  if (typeof input !== 'object' || input === null || !('points' in input)) {
    return reject('not_an_object', 'Rodada em formato inválido.');
  }
  const { points } = input;
  if (typeof points !== 'object' || points === null) {
    return reject('not_an_object', 'Rodada em formato inválido.');
  }

  const known = new Set(players.map((player) => player.id));
  for (const id of Object.keys(points)) {
    if (!known.has(id)) {
      return reject('unknown_player', 'A rodada cita um jogador que não está na partida.');
    }
  }

  const result: Record<string, number> = {};
  for (const player of players) {
    const value: unknown = Reflect.get(points, player.id);
    if (value === undefined) {
      return reject('missing_player', `Faltam os pontos de ${player.name}.`);
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return reject(
        'invalid_points',
        `Os pontos de ${player.name} precisam ser um número inteiro.`,
      );
    }
    result[player.id] = value;
  }

  return { ok: true, round: { points: result } };
};

export const scoreRound: GameDefinition<PointsRound>['scoreRound'] = (round, players) =>
  Object.fromEntries(players.map((player) => [player.id, round.points[player.id] ?? 0]));

export const computeTotals: GameDefinition<PointsRound>['computeTotals'] = (roundScores, players) =>
  Object.fromEntries(
    players.map((player) => [
      player.id,
      roundScores.reduce((sum, scores) => sum + (scores[player.id] ?? 0), 0),
    ]),
  );

export const resolveWinners: GameDefinition<PointsRound>['resolveWinners'] = (totals, players) => {
  const best = Math.min(...players.map((player) => totals[player.id] ?? 0));
  return players.filter((player) => totals[player.id] === best).map((player) => player.id);
};
