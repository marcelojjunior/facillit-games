import { createRegistry } from '../../../src/games/registry';
import highestWins from './highest-wins';
import lowestWins from './lowest-wins';

/** Registry for story tests. Never imported by src/ (FR-025). */
export const testRegistry = createRegistry([highestWins, lowestWins]);

export { highestWins, lowestWins };
