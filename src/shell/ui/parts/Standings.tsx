/**
 * Compact standings (FR-004, data-model Standing): one line per player with
 * position, name, and total, sorted by position then roster order. It never
 * grows with the number of rounds.
 */
import type { ReactNode } from 'react';

import type { MatchView } from '../../match/store';
import { labels } from '../copy';
import { Medal } from './Medal';
import { PointsBadge } from './PointsBadge';

interface StandingsProps {
  readonly view: MatchView;
  /** One tap anywhere on the standings opens the full history (FR-004a). */
  readonly onOpen?: () => void;
  /** Shown in the card's title row, beside "Classificação". */
  readonly action?: ReactNode;
}

export function Standings({ view, onOpen, action }: StandingsProps) {
  const { players } = view.match;
  const { totals, positions } = view.evaluation;
  const rows = players
    .map((player, order) => ({ player, order, position: positions[player.id] ?? players.length }))
    .sort((a, b) => a.position - b.position || a.order - b.order);

  return (
    <div className="card-3d flex flex-col gap-1 p-2">
      {action !== undefined && (
        <div className="flex items-center justify-between gap-2 pl-2">
          <h2 className="text-sm font-bold text-ink-muted">{labels.standings}</h2>
          {action}
        </div>
      )}
      <ol
        data-testid="standings"
        aria-label={labels.standings}
        onClick={onOpen}
        className="flex flex-col divide-y divide-line/30"
      >
        {rows.map(({ player, position }) => (
          <li
            key={player.id}
            data-testid="standing-row"
            className="flex min-h-11 items-center gap-3 px-2 py-1.5"
          >
            <Medal position={position} />
            <span className="min-w-0 flex-1 truncate text-lg font-bold" title={player.name}>
              {player.name}
            </span>
            <PointsBadge points={totals[player.id] ?? 0} unit={view.game.unit} />
          </li>
        ))}
      </ol>
    </div>
  );
}
