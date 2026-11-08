/**
 * Finished: final standings and the winners the game resolved; more than one
 * winner is a shared win, naming every tied player (FR-007).
 *
 * Spec 004 FR-013/FR-014: a red ribbon heading, the crowned mascot, the
 * podium, and confetti that the device's reduced-motion setting removes.
 */
import type { MatchStore, MatchView } from '../../match/store';
import { headings, labels } from '../copy';
import type { Act } from '../MatchApp';
import { Confetti } from '../parts/Confetti';
import { Mascot } from '../parts/Mascot';
import { Podium } from '../parts/Podium';
import { Standings } from '../parts/Standings';

interface WinnerProps {
  readonly view: MatchView;
  readonly store: MatchStore;
  readonly act: Act;
}

const listFormat = new Intl.ListFormat('pt-BR', { type: 'conjunction' });

export function Winner({ view, store, act }: WinnerProps) {
  const { players } = view.match;
  const winners = new Set(view.evaluation.winners);
  const names = players.filter((player) => winners.has(player.id)).map((player) => player.name);
  const tie = names.length > 1;

  return (
    <section className="flex flex-col items-center gap-5 pb-8 text-center">
      <Confetti />
      <h1 className="ribbon ribbon-red mt-1">{tie ? headings.tie : headings.winner}</h1>
      <Mascot crown className="mt-6 w-28" />

      <p data-testid="winner-names" className="card-3d w-full px-4 py-3">
        <span className="block text-base font-bold text-ink-muted">
          {tie ? labels.sharedWin : labels.winnerIs}
        </span>
        <span className="block text-2xl font-extrabold break-words">
          {listFormat.format(names)}
        </span>
      </p>

      <div className="w-full">
        <Podium view={view} />
      </div>

      <div className="w-full text-left">
        <Standings view={view} />
      </div>

      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          data-testid="rematch"
          onClick={() => act(() => store.createRematch())}
          className="btn-3d btn-green min-h-14 text-xl"
        >
          {labels.rematch}
        </button>
        <button
          type="button"
          data-testid="new-match"
          onClick={() => act(() => store.discardMatch())}
          className="btn-3d btn-blue min-h-14 text-xl"
        >
          {labels.newMatch}
        </button>
      </div>
    </section>
  );
}
