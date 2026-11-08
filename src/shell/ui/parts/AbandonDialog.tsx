/**
 * Abandoning a match asks first (FR-008): cancel changes nothing; confirm
 * discards the match and the game list appears.
 */
import { headings, labels } from '../copy';
import { Dialog } from './Dialog';
import { secondaryButton } from './styles';

interface AbandonDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function AbandonDialog({ open, onClose, onConfirm }: AbandonDialogProps) {
  return (
    <Dialog open={open} title={headings.abandon} onClose={onClose}>
      <p className="text-ink-muted">{labels.abandonWarning}</p>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className={`${secondaryButton} flex-1`}>
          {labels.cancel}
        </button>
        <button
          type="button"
          data-testid="confirm-abandon"
          onClick={onConfirm}
          className="flex min-h-12 flex-1 items-center justify-center rounded-control bg-danger px-5 font-semibold text-danger-ink"
        >
          {labels.abandonConfirm}
        </button>
      </div>
    </Dialog>
  );
}
