/**
 * LEVA, the second game (specs/007-leva). A plugin: this folder plus one line
 * in src/games/registry.ts; it uses the round history and the unit of game
 * contract revision 4.
 */
import { defineGame } from '../../shell/game/contract';
import Icon from './Icon';
import RoundEntry from './RoundEntry';
import { computeTotals, resolveWinners, scoreRound, validateRound, type LevaRound } from './rules';

export default defineGame<LevaRound>({
  id: 'leva',
  name: 'LEVA',
  minPlayers: 2,
  maxPlayers: 10,
  validateRound,
  scoreRound,
  computeTotals,
  resolveWinners,
  RoundEntry,
  Icon,
  unit: { one: 'vida', other: 'vidas' },
});
