/**
 * A modal on the native `<dialog>` (research D9 of spec 003): `showModal()`
 * gives focus trapping, `Esc`, and focus return to the opener for free.
 * Controlled by `open`; children render only while open, so hidden content is
 * never in the way of a tap or a test.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Only a close the user started (Esc): a close caused by `open` turning
      // false must not report back, or switching overlays would reset them.
      onClose={() => {
        if (open) {
          onClose();
        }
      }}
      // A tap on the backdrop targets the dialog itself; content sits in the inner div.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md rounded-card bg-surface-raised p-0 text-ink"
    >
      {open && (
        <div className="flex flex-col gap-4 p-5">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
