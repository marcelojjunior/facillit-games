/**
 * Setup: add, rename, and remove players within the game's limits (FR-003).
 */
import { useState } from 'react';

import type { MatchStore, MatchView } from '../../match/store';
import { errorCopy, headings, labels, missingPlayersCopy, rosterLimitCopy } from '../copy';
import type { Act } from '../MatchApp';
import { AbandonDialog } from '../parts/AbandonDialog';
import { PlusIcon, TrashIcon } from '../parts/icons';
import { iconButton, primaryButton, secondaryButton, textInput } from '../parts/styles';

interface SetupProps {
  readonly view: MatchView;
  readonly store: MatchStore;
  readonly act: Act;
  readonly error: string | null;
}

const MAX_NAME = 30;

export function Setup({ view, store, act, error }: SetupProps) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const { game, match } = view;
  const count = match.players.length;
  const full = count >= game.maxPlayers;
  const missing = game.minPlayers - count;

  return (
    <section className="flex flex-col gap-5 pb-8">
      <div>
        <h1 className="text-display font-semibold">{headings.setup}</h1>
        <p className="text-ink-muted">
          {game.name} · {rosterLimitCopy(game.minPlayers, game.maxPlayers)}
        </p>
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (act(() => store.addPlayer(name)).ok) {
            setName('');
          }
        }}
      >
        <label htmlFor="player-name" className="text-sm text-ink-muted">
          {labels.playerName}
        </label>
        <div className="flex gap-2">
          <input
            id="player-name"
            data-testid="player-name-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_NAME}
            enterKeyHint="done"
            autoComplete="off"
            autoCapitalize="words"
            disabled={full}
            className={textInput}
          />
          <button
            type="submit"
            data-testid="add-player"
            disabled={full}
            className={`${primaryButton} shrink-0`}
          >
            <PlusIcon />
            {labels.add}
          </button>
        </div>
        {full && <p className="text-sm text-ink-muted">{errorCopy.roster_full}</p>}
        {error !== null && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted tabular-nums">
          {count} / {game.maxPlayers}
        </p>
        <ul className="flex flex-col gap-2">
          {match.players.map((player) => (
            <li
              key={player.id}
              className="flex min-h-12 items-center gap-2 rounded-control bg-surface-raised pl-3"
            >
              {editing?.id === player.id ? (
                <form
                  className="flex min-w-0 flex-1 gap-2 py-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (act(() => store.renamePlayer(player.id, editing.name)).ok) {
                      setEditing(null);
                    }
                  }}
                >
                  <input
                    aria-label={`${labels.rename} ${player.name}`}
                    value={editing.name}
                    onChange={(event) => setEditing({ id: player.id, name: event.target.value })}
                    onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                    maxLength={MAX_NAME}
                    enterKeyHint="done"
                    autoFocus
                    className={textInput}
                  />
                  <button type="submit" className={`${secondaryButton} shrink-0`}>
                    {labels.ok}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing({ id: player.id, name: player.name })}
                  title={player.name}
                  className="min-h-11 min-w-0 flex-1 truncate text-left font-medium"
                >
                  {player.name}
                </button>
              )}
              <button
                type="button"
                aria-label={`${labels.remove} ${player.name}`}
                onClick={() => act(() => store.removePlayer(player.id))}
                className={iconButton}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        {missing > 0 && <p className="text-sm text-ink-muted">{missingPlayersCopy(missing)}</p>}
        <button
          type="button"
          data-testid="start-match"
          disabled={missing > 0 || count > game.maxPlayers}
          onClick={() => act(() => store.start())}
          className={primaryButton}
        >
          {labels.start}
        </button>
        <button type="button" onClick={() => setAbandoning(true)} className={secondaryButton}>
          {labels.abandon}
        </button>
      </div>

      <AbandonDialog
        open={abandoning}
        onClose={() => setAbandoning(false)}
        onConfirm={() => act(() => store.discardMatch())}
      />
    </section>
  );
}
