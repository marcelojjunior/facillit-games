/**
 * The winners' podium (spec 004 FR-013): steps laid out second, first, third,
 * the first the tallest; tied players stand on the same step. Everyone else
 * stays in the standings below it.
 */
import type { MatchView } from '../../match/store';
import { Medal } from './Medal';
import { podiumSteps } from './podiumSteps';
import { PointsBadge } from './PointsBadge';

const ORDER = [2, 1, 3] as const;
/**
 * Steps stretch to the tallest one and drop from the top, so the first place
 * is always the highest whatever the number of names on each step.
 */
const OFFSET = { 1: 'mt-0', 2: 'mt-6', 3: 'mt-10' } as const;

export function Podium({ view }: { readonly view: MatchView }) {
  const steps = podiumSteps(view.match.players, view.evaluation.positions);
  const laidOut = ORDER.flatMap((position) => steps.filter((step) => step.position === position));

  return (
    <div data-testid="podium" className="flex items-stretch justify-center gap-2">
      {laidOut.map((step) => (
        <div
          key={step.position}
          data-testid="podium-step"
          data-position={step.position}
          className={`card-3d flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-b-md px-1.5 pt-2 pb-4 ${OFFSET[step.position]}`}
        >
          <Medal position={step.position} />
          {step.players.map((player) => (
            <div key={player.id} className="flex w-full min-w-0 flex-col items-center gap-1">
              <b className="max-w-full truncate text-base font-extrabold" title={player.name}>
                {player.name}
              </b>
              <PointsBadge points={view.evaluation.totals[player.id] ?? 0} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
