/**
 * Rename a player during the match (FR-005, Edge Cases): pick the player,
 * type the new name. Same rules and messages as setup (duplicate names,
 * ignoring case, are rejected and nothing changes).
 */
import { useState } from 'react';

import type { MatchStore, MatchView } from '../../match/store';
import { errorCopy, headings, labels } from '../copy';
import type { Act } from '../MatchApp';
import { Dialog } from './Dialog';
import { primaryButton, secondaryButton, textInput } from './styles';

interface RenameDialogProps {
  readonly view: MatchView;
  readonly store: MatchStore;
  readonly act: Act;
  readonly onClose: () => void;
}

export function RenameDialog({ view, store, act, onClose }: RenameDialogProps) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Another tab may have removed the match's player meanwhile: back to the list.
  const player = view.match.players.find((candidate) => candidate.id === playerId);

  return (
    <Dialog open title={headings.renamePlayer} onClose={onClose}>
      {player === undefined ? (
        <ul className="flex flex-col gap-2">
          {view.match.players.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => {
                  setPlayerId(candidate.id);
                  setName(candidate.name);
                }}
                className={`${secondaryButton} w-full justify-start truncate`}
                title={candidate.name}
              >
                {candidate.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const result = act(() => store.renamePlayer(player.id, name), { local: true });
            if (result.ok) {
              onClose();
            } else {
              setError(errorCopy[result.error.code]);
            }
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            {labels.newName}
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              maxLength={30}
              enterKeyHint="done"
              autoComplete="off"
              autoFocus
              className={textInput}
            />
          </label>
          {error !== null && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={`${secondaryButton} flex-1`}>
              {labels.cancel}
            </button>
            <button type="submit" className={`${primaryButton} flex-1`}>
              {labels.save}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
