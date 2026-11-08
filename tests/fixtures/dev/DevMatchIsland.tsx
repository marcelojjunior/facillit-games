/**
 * Development-only binding: the app with the test-only games (FR-029a,
 * research D5 of spec 003). Lives in tests/ so src/ never imports fixtures.
 */
import MatchApp from '../../../src/shell/ui/MatchApp';
import { testRegistry } from '../games/registry';

export default function DevMatchIsland() {
  return <MatchApp registry={testRegistry} />;
}
