/**
 * The full table: one row per player, one column per round plus the total,
 * names pinned on the left, horizontal scroll inside its own box that opens
 * at the latest round (FR-004a, FR-006, FR-023).
 */
import { useEffect, useRef } from 'react';

import type { MatchView } from '../../match/store';
import { fixRoundCopy, labels } from '../copy';

interface ScoreTableProps {
  readonly view: MatchView;
  /** When set, each round header is a button that opens that round for fixing. */
  readonly onPickRound?: (index: number) => void;
}

export function ScoreTable({ view, onPickRound }: ScoreTableProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const { players } = view.match;
  const { roundScores, totals } = view.evaluation;

  useEffect(() => {
    // Next frame: this effect runs before the parent Dialog's showModal(),
    // while the box still has no layout to scroll.
    const frame = requestAnimationFrame(() => {
      const box = scroller.current;
      if (box !== null) {
        box.scrollLeft = box.scrollWidth;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const cell = 'min-w-11 px-3 py-2 text-right tabular-nums';
  const pinned = 'sticky left-0 z-10 max-w-32 truncate bg-surface-raised px-3 py-2 text-left';

  return (
    <div ref={scroller} className="overflow-x-auto">
      <table className="w-full border-collapse text-base font-semibold">
        <thead>
          <tr className="border-b border-line/60 text-ink-muted">
            <th scope="col" className={pinned}>
              {labels.player}
            </th>
            {roundScores.map((_, index) => (
              <th key={index} scope="col" className={onPickRound ? 'p-0' : cell}>
                {onPickRound ? (
                  <button
                    type="button"
                    data-testid="history-round"
                    aria-label={fixRoundCopy(index + 1)}
                    onClick={() => onPickRound(index)}
                    className="btn-3d btn-blue my-1 min-h-11 px-2 tabular-nums"
                  >
                    {index + 1}
                  </button>
                ) : (
                  index + 1
                )}
              </th>
            ))}
            <th scope="col" className={`${cell} font-semibold text-ink`}>
              {labels.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-line/30">
              <th scope="row" className={`${pinned} font-medium`} title={player.name}>
                {player.name}
              </th>
              {roundScores.map((scores, index) => (
                <td key={index} className={cell}>
                  {scores[player.id] ?? 0}
                </td>
              ))}
              <td className={`${cell} font-semibold`}>{totals[player.id] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
