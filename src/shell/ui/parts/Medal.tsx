/**
 * A position as a medal (spec 004 FR-012): gold, silver, bronze, then a plain
 * badge. Players sharing a position share its medal, because the position
 * itself is shared (spec 003 research D2).
 */
import { positionCopy } from '../copy';

const MEDALS = {
  1: { kind: 'gold', className: 'bg-gold text-on-warm' },
  2: { kind: 'silver', className: 'bg-silver text-on-warm' },
  3: { kind: 'bronze', className: 'bg-bronze text-on-warm' },
} as const;

export function Medal({ position }: { readonly position: number }) {
  const medal = position === 1 || position === 2 || position === 3 ? MEDALS[position] : undefined;
  return (
    <span
      data-testid="medal"
      data-medal={medal?.kind ?? 'plain'}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold tabular-nums shadow-[inset_0_-3px_0_var(--color-die-edge)] ${medal?.className ?? 'bg-surface-sunken text-ink'}`}
    >
      {positionCopy(position)}
    </span>
  );
}
