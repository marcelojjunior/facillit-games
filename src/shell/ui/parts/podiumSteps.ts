/**
 * The podium's steps (spec 004 research D6, data-model "Podium step"): one
 * step per position 1, 2, 3 that exists, each with every player at that
 * position in roster order. Ties share a step; a missing position (1, 1, 3
 * has no 2) has no step. Pure, so it is tested in node.
 */
import type { PlayerRef, Scores } from '../../game/contract';

export interface PodiumStep {
  readonly position: 1 | 2 | 3;
  readonly players: readonly PlayerRef[];
}

const PLACES = [1, 2, 3] as const;

export function podiumSteps(players: readonly PlayerRef[], positions: Scores): PodiumStep[] {
  return PLACES.map((position) => ({
    position,
    players: players.filter((player) => positions[player.id] === position),
  })).filter((step) => step.players.length > 0);
}
