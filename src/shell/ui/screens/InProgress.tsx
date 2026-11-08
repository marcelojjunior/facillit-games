/**
 * In progress: round number, compact standings, the game's own round entry,
 * and the confirm bar (FR-004, FR-009–FR-011, research D10 of spec 003).
 *
 * The round entry comes from the match's game, through the registry; the
 * shell never knows which game it is (Principle II).
 */
import { useState } from 'react';

import type { RoundRejection } from '../../game/contract';
import type { MatchStore, MatchView } from '../../match/store';
import { headings, labels, roundCopy } from '../copy';
import type { Act } from '../MatchApp';
import { ConfirmBar } from '../parts/ConfirmBar';
import { Dialog } from '../parts/Dialog';
import { FlagIcon } from '../parts/icons';
import { ScoreTable } from '../parts/ScoreTable';
import { Standings } from '../parts/Standings';
import { primaryButton, secondaryButton } from '../parts/styles';

interface InProgressProps {
  readonly view: MatchView;
  readonly store: MatchStore;
  readonly act: Act;
  readonly error: string | null;
  readonly reasons: readonly RoundRejection[];
}

export function InProgress({ view, store, act, error, reasons }: InProgressProps) {
  const [finishing, setFinishing] = useState(false);
  const { game, match } = view;
  const { RoundEntry } = game;
  const problems = reasons.length > 0 || error !== null;

  return (
    // Room for the fixed bar, which grows when it lists problems.
    <section className={`flex flex-col gap-5 ${problems ? 'pb-72' : 'pb-28'}`}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-display font-semibold">{roundCopy(match.rounds.length + 1)}</h1>
        <button
          type="button"
          data-testid="finish-match"
          onClick={() => setFinishing(true)}
          className={secondaryButton}
        >
          <FlagIcon />
          {labels.finish}
        </button>
      </div>

      <Standings view={view} />

      <div data-testid="round-entry">
        <RoundEntry
          players={match.players}
          value={match.draft}
          onChange={(value) => act(() => store.updateDraft(value))}
          reasons={reasons}
        />
      </div>

      <ConfirmBar
        disabled={match.draft === undefined}
        onConfirm={() => act(() => store.confirmRound(match.draft))}
      >
        {problems && (
          <div
            role="alert"
            className="mb-3 max-h-40 overflow-y-auto rounded-card border border-danger bg-surface-raised p-3 text-sm text-danger"
          >
            {reasons.length > 0 && (
              <>
                <p className="font-medium">{labels.roundProblems}</p>
                <ul className="mt-1 list-disc pl-5">
                  {reasons.map((reason) => (
                    <li key={`${reason.code}:${reason.message}`}>{reason.message}</li>
                  ))}
                </ul>
              </>
            )}
            {error !== null && <p className="font-medium">{error}</p>}
          </div>
        )}
      </ConfirmBar>

      <Dialog open={finishing} title={headings.finish} onClose={() => setFinishing(false)}>
        <ScoreTable view={view} />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFinishing(false)}
            className={`${secondaryButton} flex-1`}
          >
            {labels.keepPlaying}
          </button>
          <button
            type="button"
            data-testid="confirm-finish"
            onClick={() => act(() => store.finish())}
            className={`${primaryButton} flex-1`}
          >
            {labels.finish}
          </button>
        </div>
      </Dialog>
    </section>
  );
}
