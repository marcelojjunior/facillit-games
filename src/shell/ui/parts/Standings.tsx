/**
 * Compact standings (FR-004, data-model Standing): one line per player with
 * position, name, and total, sorted by position then roster order. It never
 * grows with the number of rounds.
 */
import type { MatchView } from '../../match/store';
import { labels, positionCopy } from '../copy';

interface StandingsProps {
  readonly view: MatchView;
  /** One tap anywhere on the standings opens the full history (FR-004a). */
  readonly onOpen?: () => void;
}

export function Standings({ view, onOpen }: StandingsProps) {
  const { players } = view.match;
  const { totals, positions } = view.evaluation;
  const rows = players
    .map((player, order) => ({ player, order, position: positions[player.id] ?? players.length }))
    .sort((a, b) => a.position - b.position || a.order - b.order);

  return (
    <ol
      data-testid="standings"
      aria-label={labels.standings}
      onClick={onOpen}
      className="flex flex-col divide-y divide-line/40 rounded-card bg-surface-raised"
    >
      {rows.map(({ player, position }) => (
        <li
          key={player.id}
          data-testid="standing-row"
          className="flex min-h-11 items-center gap-3 px-4 py-2"
        >
          <span className="w-8 shrink-0 text-ink-muted tabular-nums">{positionCopy(position)}</span>
          <span className="min-w-0 flex-1 truncate font-medium" title={player.name}>
            {player.name}
          </span>
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {totals[player.id] ?? 0}
          </span>
        </li>
      ))}
    </ol>
  );
}
