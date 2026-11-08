/**
 * Production binding: the app with the real registry. The only component that
 * imports src/games/registry (plan, Structure Decision of spec 003).
 */
import { registry } from '../games/registry';
import MatchApp from '../shell/ui/MatchApp';

export default function MatchIsland() {
  return <MatchApp registry={registry} />;
}
