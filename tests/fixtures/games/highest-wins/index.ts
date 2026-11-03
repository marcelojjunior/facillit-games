import { defineGame } from '../../../../src/shell/game/contract';
import { computeTotals, resolveWinners, scoreRound, validateRound, type RanksRound } from './rules';

export default defineGame<RanksRound>({
  id: 'highest-wins',
  name: 'Maior Vence',
  minPlayers: 2,
  maxPlayers: 4,
  validateRound,
  scoreRound,
  computeTotals,
  resolveWinners,
});
