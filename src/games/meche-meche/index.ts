/**
 * MECHE-MECHE, the first real game (specs/005-meche-meche). A plugin: this
 * folder plus one line in src/games/registry.ts (spec 002 SC-001).
 */
import { defineGame } from '../../shell/game/contract';
import Icon from './Icon';
import RoundEntry from './RoundEntry';
import { computeTotals, resolveWinners, scoreRound, validateRound, type MecheRound } from './rules';

export default defineGame<MecheRound>({
  id: 'meche-meche',
  name: 'MECHE-MECHE',
  minPlayers: 2,
  maxPlayers: 7,
  validateRound,
  scoreRound,
  computeTotals,
  resolveWinners,
  RoundEntry,
  Icon,
});
