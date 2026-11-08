import { defineGame } from '../../../../src/shell/game/contract';
import {
  computeTotals,
  resolveWinners,
  scoreRound,
  validateRound,
  type PointsRound,
} from './rules';
import RoundEntry from './RoundEntry';

export default defineGame<PointsRound>({
  id: 'lowest-wins',
  name: 'Menor Vence',
  minPlayers: 3,
  maxPlayers: 6,
  validateRound,
  scoreRound,
  computeTotals,
  resolveWinners,
  RoundEntry,
});
