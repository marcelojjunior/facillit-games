/**
 * A total as a game score: "30 pts", sign kept (spec 004 FR-011). Never a
 * coin, which would read as money. White on purple meets 4.5:1, so the small
 * "pts" stays legible (tokens.ts).
 */
import type { TotalUnit } from '../../game/contract';
import { labels } from '../copy';

interface PointsBadgeProps {
  readonly points: number;
  /** The game's unit (spec 007 FR-003); "pts" when absent. */
  readonly unit?: TotalUnit | undefined;
}

export function PointsBadge({ points, unit }: PointsBadgeProps) {
  const label = unit === undefined ? labels.points : Math.abs(points) === 1 ? unit.one : unit.other;
  return (
    <span
      data-testid="points"
      className="inline-flex shrink-0 items-baseline justify-center gap-0.5 rounded-control bg-purple px-2.5 py-0.5 whitespace-nowrap text-on-color tabular-nums shadow-[0_0.2rem_0_var(--color-purple-edge)]"
    >
      <span className="text-xl leading-tight font-extrabold">{points}</span>
      <small className="text-xs font-bold"> {label}</small>
    </span>
  );
}
