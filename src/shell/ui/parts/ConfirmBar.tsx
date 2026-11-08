/**
 * The most repeated tap in the app (Principle VI): fixed to the bottom of the
 * viewport, in thumb reach on any round-entry height (FR-024, research D10).
 *
 * Double-submit guard (FR-017, research D11): two clicks can be queued before
 * React commits, and the second would confirm the stale draft again. A ref
 * lock ignores presses until the frame after the store has notified.
 */
import { useRef, type ReactNode } from 'react';

import { labels } from '../copy';
import { CheckIcon } from './icons';

interface ConfirmBarProps {
  readonly disabled: boolean;
  readonly onConfirm: () => void;
  /** Shown right above the button, so a rejection is never hidden behind the bar. */
  readonly children?: ReactNode;
}

export function ConfirmBar({ disabled, onConfirm, children }: ConfirmBarProps) {
  const locked = useRef(false);

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-line/40 bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto max-w-md">{children}</div>
      <button
        type="button"
        data-testid="confirm-round"
        disabled={disabled}
        onClick={() => {
          if (locked.current) {
            return;
          }
          locked.current = true;
          onConfirm();
          requestAnimationFrame(() => {
            locked.current = false;
          });
        }}
        className="btn-3d btn-green mx-auto min-h-14 w-full max-w-md text-xl"
      >
        <CheckIcon />
        {labels.confirmRound}
      </button>
    </div>
  );
}
