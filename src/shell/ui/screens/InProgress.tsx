/**
 * In progress: round number, compact standings, the game's own round entry,
 * and the confirm bar (FR-004, FR-009–FR-011, research D10 of spec 003).
 *
 * The round entry comes from the match's game, through the registry; the
 * shell never knows which game it is (Principle II).
 *
 * Rare actions (rename, remove the last round, abandon) sit behind the "more" button;
 * the full history opens from the standings (FR-004a, FR-005, FR-008).
 */
import { useState } from 'react';

import type { RoundRejection } from '../../game/contract';
import type { MatchStore, MatchView } from '../../match/store';
import { headings, labels, roundCopy } from '../copy';
import type { Act } from '../MatchApp';
import { AbandonDialog } from '../parts/AbandonDialog';
import { ConfirmBar } from '../parts/ConfirmBar';
import { Dialog } from '../parts/Dialog';
import { FixSheet } from '../parts/FixSheet';
import { FlagIcon, MoreIcon } from '../parts/icons';
import { RenameDialog } from '../parts/RenameDialog';
import { ScoreTable } from '../parts/ScoreTable';
import { Standings } from '../parts/Standings';
import { dangerButton, iconButton, primaryButton, secondaryButton } from '../parts/styles';

type Overlay =
  'none' | 'finish' | 'history' | 'menu' | 'rename' | 'remove-last' | 'fix' | 'abandon';

interface InProgressProps {
  readonly view: MatchView;
  readonly store: MatchStore;
  readonly act: Act;
  readonly error: string | null;
  readonly reasons: readonly RoundRejection[];
}

export function InProgress({ view, store, act, error, reasons }: InProgressProps) {
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [fixIndex, setFixIndex] = useState(0);
  const close = () => setOverlay('none');
  const { game, match } = view;
  const { RoundEntry } = game;
  const problems = reasons.length > 0 || error !== null;
  // Another tab may remove the round being fixed: the sheet then just closes.
  const fixing = overlay === 'fix' && fixIndex < match.rounds.length;

  return (
    // Room for the fixed bar, which grows when it lists problems.
    <section className={`flex flex-col gap-5 ${problems ? 'pb-72' : 'pb-28'}`}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-display font-semibold">{roundCopy(match.rounds.length + 1)}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="finish-match"
            onClick={() => setOverlay('finish')}
            className={secondaryButton}
          >
            <FlagIcon />
            {labels.finish}
          </button>
          <button
            type="button"
            aria-label={labels.moreActions}
            onClick={() => setOverlay('menu')}
            className={iconButton}
          >
            <MoreIcon />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-ink-muted">{labels.standings}</h2>
          <button
            type="button"
            data-testid="open-history"
            onClick={() => setOverlay('history')}
            className="min-h-11 px-2 text-sm font-semibold text-accent"
          >
            {labels.openHistory}
          </button>
        </div>
        <Standings view={view} onOpen={() => setOverlay('history')} />
      </div>

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

      <Dialog open={overlay === 'history'} title={headings.history} onClose={close}>
        <ScoreTable
          view={view}
          onPickRound={(index) => {
            setFixIndex(index);
            setOverlay('fix');
          }}
        />
        <button type="button" onClick={close} className={secondaryButton}>
          {labels.close}
        </button>
      </Dialog>

      {fixing && (
        <FixSheet
          key={fixIndex}
          view={view}
          store={store}
          act={act}
          index={fixIndex}
          onClose={close}
        />
      )}

      <Dialog open={overlay === 'menu'} title={labels.moreActions} onClose={close}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOverlay('rename')}
            className={`${secondaryButton} justify-start`}
          >
            {labels.renamePlayer}
          </button>
          <button
            type="button"
            disabled={match.rounds.length === 0}
            onClick={() => setOverlay('remove-last')}
            className={`${secondaryButton} justify-start`}
          >
            {labels.removeLastRound}
          </button>
          <button
            type="button"
            onClick={() => setOverlay('abandon')}
            className={`${secondaryButton} justify-start text-danger`}
          >
            {labels.abandon}
          </button>
        </div>
      </Dialog>

      <AbandonDialog
        open={overlay === 'abandon'}
        onClose={close}
        onConfirm={() => act(() => store.discardMatch())}
      />

      {overlay === 'rename' && <RenameDialog view={view} store={store} act={act} onClose={close} />}

      <Dialog
        open={overlay === 'remove-last' && match.rounds.length > 0}
        title={headings.removeLastRound}
        onClose={close}
      >
        <div className="flex gap-3">
          <button type="button" onClick={close} className={`${secondaryButton} flex-1`}>
            {labels.cancel}
          </button>
          <button
            type="button"
            data-testid="confirm-remove-last"
            onClick={() => {
              if (act(() => store.removeLastRound()).ok) {
                close();
              }
            }}
            className={`${dangerButton} flex-1`}
          >
            {labels.remove}
          </button>
        </div>
      </Dialog>

      <Dialog open={overlay === 'finish'} title={headings.finish} onClose={close}>
        <ScoreTable view={view} />
        <div className="flex gap-3">
          <button type="button" onClick={close} className={`${secondaryButton} flex-1`}>
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
