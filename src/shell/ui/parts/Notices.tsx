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
          className="card-3d flex items-center gap-3 py-2 pr-2 pl-4 text-sm font-semibold"
        >
          <p className="min-w-0 flex-1">{discardCopy[discard.reason]}</p>
          <button
            type="button"
            onClick={onDismissDiscard}
            className="btn-3d btn-plain min-h-11 shrink-0 px-3"
          >
            {labels.dismiss}
          </button>
        </div>
      )}
      {notSaved && (
        <p
          data-testid="not-saved-warning"
          role="status"
          className="rounded-card bg-surface-raised px-4 py-3 text-sm font-semibold text-danger shadow-[0_0.3rem_0_var(--color-red-edge)]"
        >
          {labels.notSaved}
        </p>
      )}
    </div>
  );
}
