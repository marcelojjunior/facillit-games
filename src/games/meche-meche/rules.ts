/**
 * MECHE-MECHE rules (specs/005-meche-meche, contracts/meche-meche-round.md),
 * as in the frozen POC: with N players a round offers N×10 down to 10; each
 * score goes to at most one player; a player may take none; any player may
 * also get +10; the highest total wins.
 *
 * Pure (Principle III): no DOM, storage, clock, or randomness; input stays
 * `unknown` until checked.
 */
import type { GameDefinition, RoundRejection, RoundValidation } from '../../shell/game/contract';

/** Who took which score, and who got the +10 bonus (research D1). */
export interface MecheRound {
  readonly scores: Readonly<Record<string, number>>;
  readonly bonus: readonly string[];
}

export function scoresOnOffer(players: number): number[] {
  return Array.from({ length: players }, (_, index) => (players - index) * 10);
}

function reject(code: string, message: string): RoundValidation<MecheRound> {
  const reason: RoundRejection = { code, message };
  return { ok: false, reasons: [reason] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const INVALID = 'Rodada em formato inválido.';
const UNKNOWN = 'A rodada cita um jogador que não está na partida.';

export const validateRound: GameDefinition<MecheRound>['validateRound'] = (input, players) => {
  if (!isRecord(input)) {
    return reject('invalid_shape', INVALID);
  }
  const rawScores = input.scores ?? {};
  const rawBonus: unknown = input.bonus ?? [];
  if (!isRecord(rawScores) || !Array.isArray(rawBonus)) {
    return reject('invalid_shape', INVALID);
  }

  const names = new Map(players.map((player) => [player.id, player.name]));
  const offer = scoresOnOffer(players.length);

  const scores: Record<string, number> = {};
  const taken = new Set<number>();
  for (const [id, value] of Object.entries(rawScores)) {
    if (!names.has(id)) {
      return reject('unknown_player', UNKNOWN);
    }
    if (typeof value !== 'number' || !offer.includes(value)) {
      return reject(
        'score_not_on_offer',
        `${String(value)} pontos não existe com ${players.length} jogadores.`,
      );
    }
    if (taken.has(value)) {
      return reject('score_taken_twice', `${value} pontos foi dado a mais de um jogador.`);
    }
    taken.add(value);
    scores[id] = value;
  }

  const items: readonly unknown[] = rawBonus;
  const bonus: string[] = [];
  for (const id of items) {
    if (typeof id !== 'string') {
      return reject('invalid_shape', INVALID);
    }
    const name = names.get(id);
    if (name === undefined) {
      return reject('unknown_player', UNKNOWN);
    }
    if (bonus.includes(id)) {
      return reject('bonus_twice', `${name} recebeu o bônus de +10 duas vezes.`);
    }
    bonus.push(id);
  }

  return { ok: true, round: { scores, bonus } };
};

export const scoreRound: GameDefinition<MecheRound>['scoreRound'] = (round, players) =>
  Object.fromEntries(
    players.map((player) => [
      player.id,
      (round.scores[player.id] ?? 0) + (round.bonus.includes(player.id) ? 10 : 0),
    ]),
  );

export const computeTotals: GameDefinition<MecheRound>['computeTotals'] = (roundScores, players) =>
  Object.fromEntries(
    players.map((player) => [
      player.id,
      roundScores.reduce((sum, scores) => sum + (scores[player.id] ?? 0), 0),
    ]),
  );

export const resolveWinners: GameDefinition<MecheRound>['resolveWinners'] = (totals, players) => {
  const best = Math.max(...players.map((player) => totals[player.id] ?? 0));
  return players.filter((player) => totals[player.id] === best).map((player) => player.id);
};
