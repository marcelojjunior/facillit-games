/**
 * Fix a confirmed round (US3, research D6 of spec 003): the game's own round
 * entry edits a local copy; "Salvar" replaces the round, "Cancelar" drops it.
 * The draft of the round being typed is never touched (FR-011), and a reload
 * while fixing loses only this unsaved fix (SC-003).
 */
import { useState } from 'react';

import type { RoundRejection } from '../../game/contract';
import type { MatchStore, MatchView } from '../../match/store';
import { errorCopy, fixRoundCopy, labels } from '../copy';
import type { Act } from '../MatchApp';
import { Dialog } from './Dialog';
import { primaryButton, secondaryButton } from './styles';

interface FixSheetProps {
  readonly view: MatchView;
  readonly store: MatchStore;
  readonly act: Act;
  readonly index: number;
  readonly onClose: () => void;
}

export function FixSheet({ view, store, act, index, onClose }: FixSheetProps) {
  const [value, setValue] = useState<unknown>(() => view.match.rounds[index]);
  const [reasons, setReasons] = useState<readonly RoundRejection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { RoundEntry } = view.game;

  const save = () => {
    const result = act(() => store.replaceRound(index, value), { local: true });
    if (result.ok) {
      onClose();
    } else if (result.error.code === 'invalid_round') {
      setReasons(result.error.reasons);
    } else {
      setError(errorCopy[result.error.code]);
    }
  };

  return (
    <Dialog open title={fixRoundCopy(index + 1)} onClose={onClose}>
      <RoundEntry
        players={view.match.players}
        rounds={view.match.rounds.slice(0, index)}
        value={value}
        onChange={(next) => {
          setValue(next);
          setReasons([]);
          setError(null);
        }}
        reasons={reasons}
      />
      {(reasons.length > 0 || error !== null) && (
        <div role="alert" className="rounded-card border border-danger p-3 text-sm text-danger">
          {reasons.map((reason) => (
            <p key={`${reason.code}:${reason.message}`}>{reason.message}</p>
          ))}
          {error !== null && <p>{error}</p>}
        </div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className={`${secondaryButton} flex-1`}>
          {labels.cancel}
        </button>
        <button
          type="button"
          data-testid="save-fix"
          onClick={save}
          className={`${primaryButton} flex-1`}
        >
          {labels.save}
        </button>
      </div>
    </Dialog>
  );
}
