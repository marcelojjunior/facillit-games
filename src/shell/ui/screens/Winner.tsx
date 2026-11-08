/**
 * Finished: final standings and the winners the game resolved; more than one
 * winner is a shared win, naming every tied player (FR-007).
 *
 * ponytail: no celebration animation; the spec makes it optional. Add one
 * only under `prefers-reduced-motion: no-preference`.
 */
import type { MatchStore, MatchView } from '../../match/store';
import { headings, labels } from '../copy';
import type { Act } from '../MatchApp';
import { TrophyIcon } from '../parts/icons';
import { Standings } from '../parts/Standings';
import { primaryButton, secondaryButton } from '../parts/styles';

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
    <section className="flex flex-col gap-5 pb-8">
      <h1 className="text-display font-semibold">{tie ? headings.tie : headings.winner}</h1>

      <div
        data-testid="winner-names"
        className="flex items-center gap-3 rounded-card bg-green p-5 text-on-color"
      >
        <TrophyIcon />
        <p className="min-w-0 text-xl font-extrabold break-words">
          {tie ? labels.sharedWin : labels.winnerIs} {listFormat.format(names)}
        </p>
      </div>

      <Standings view={view} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-testid="rematch"
          onClick={() => act(() => store.createRematch())}
          className={primaryButton}
        >
          {labels.rematch}
        </button>
        <button
          type="button"
          data-testid="new-match"
          onClick={() => act(() => store.discardMatch())}
          className={secondaryButton}
        >
          {labels.newMatch}
        </button>
      </div>
    </section>
  );
}
