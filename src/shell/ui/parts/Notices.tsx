/**
 * Transient messages that are not part of the match (FR-015, FR-016): the
 * discard notice, shown until dismissed (then acknowledged in the store, so
 * it never comes back), and the not-saved warning, which never blocks play.
 */
import type { DiscardNotice } from '../../match/persistence';
import { discardCopy, labels } from '../copy';

interface NoticesProps {
  readonly discard: DiscardNotice | null;
  readonly onDismissDiscard: () => void;
  readonly notSaved: boolean;
}

export function Notices({ discard, onDismissDiscard, notSaved }: NoticesProps) {
  if (discard === null && !notSaved) {
    return null;
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pb-2">
      {discard !== null && (
        <div
          data-testid="discard-notice"
          role="alert"
          className="flex items-center gap-3 rounded-card border border-line bg-surface-raised py-2 pr-2 pl-4 text-sm"
        >
          <p className="min-w-0 flex-1">{discardCopy[discard.reason]}</p>
          <button
            type="button"
            onClick={onDismissDiscard}
            className="flex min-h-11 min-w-11 shrink-0 items-center rounded-control px-3 font-semibold text-accent"
          >
            {labels.dismiss}
          </button>
        </div>
      )}
      {notSaved && (
        <p
          data-testid="not-saved-warning"
          role="status"
          className="rounded-card border border-danger bg-surface-raised px-4 py-3 text-sm text-danger"
        >
          {labels.notSaved}
        </p>
      )}
    </div>
  );
}
