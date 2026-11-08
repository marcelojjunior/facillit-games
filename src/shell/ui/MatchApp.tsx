/**
 * The app: the only island (research D3 of spec 003). It owns the match store
 * and picks one screen from the stored `status` alone (FR-001).
 *
 * Create it only in the browser (`client:only="react"`, Principle IV): the
 * store reads storage synchronously at creation, so the first render is
 * already the right screen and a reopened match never flashes the game list.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Registry, RoundRejection } from '../game/contract';
import type { StorageLike } from '../match/persistence';
import { createMatchStore, type MatchView, type OperationResult } from '../match/store';
import { errorCopy, labels } from './copy';
import { Notices } from './parts/Notices';
import { GameList } from './screens/GameList';
import { InProgress } from './screens/InProgress';
import { Setup } from './screens/Setup';
import { Winner } from './screens/Winner';

export interface MatchAppProps {
  readonly registry: Registry;
  /** Default: the browser's localStorage. Tests pass their own. */
  readonly storage?: StorageLike | null;
}

/** Runs a store operation through the one result handler; true when it succeeded. */
export type Act = (operation: () => OperationResult) => boolean;

type Screen = 'game-list' | 'setup' | 'in-progress' | 'winner';

function screenOf(state: MatchView | null): Screen {
  switch (state?.match.status) {
    case undefined:
      return 'game-list';
    case 'setting_up':
      return 'setup';
    case 'in_progress':
      return 'in-progress';
    case 'finished':
      return 'winner';
  }
}

const NO_REASONS: readonly RoundRejection[] = [];

export default function MatchApp({ registry, storage }: MatchAppProps) {
  // ponytail: created once per mount; under StrictMode's double effect the
  // cross-tab listener would be gone. Astro does not use StrictMode.
  const [{ store, subscribe, getSnapshot, getNotice }] = useState(() => {
    const created = createMatchStore(storage === undefined ? { registry } : { registry, storage });
    return {
      store: created,
      subscribe: (listener: () => void) => created.subscribe(listener),
      getSnapshot: () => created.getState(),
      getNotice: () => created.getDiscardNotice(),
    };
  });
  useEffect(() => () => store.dispose(), [store]);

  const state = useSyncExternalStore(subscribe, getSnapshot);
  // A separate snapshot: acknowledging the notice notifies without changing the match.
  const discardNotice = useSyncExternalStore(subscribe, getNotice);
  const screen = screenOf(state);

  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<readonly RoundRejection[]>(NO_REASONS);
  // FR-016: set by an unsaved operation, cleared by the next saved one.
  const [notSaved, setNotSaved] = useState(false);

  // Result handling (contracts/screens.md): success clears messages; a round
  // rejection goes to the entry with the draft kept; anything else is copy.
  const act: Act = (operation) => {
    const result = operation();
    if (result.ok) {
      setError(null);
      setReasons(NO_REASONS);
      setNotSaved(!result.persisted);
      return true;
    }
    if (result.error.code === 'invalid_round') {
      setError(null);
      setReasons(result.error.reasons);
    } else {
      setError(errorCopy[result.error.code]);
    }
    return false;
  };

  return (
    <div data-testid="match-app" data-screen={screen} className="min-h-dvh">
      <header className="flex min-h-14 items-center px-4">
        <span className="font-semibold">{labels.appTitle}</span>
      </header>
      <Notices
        discard={discardNotice}
        onDismissDiscard={() => store.acknowledgeDiscardNotice()}
        notSaved={notSaved}
      />
      <main className="mx-auto max-w-md px-4 pt-2">
        {state === null ? (
          <GameList
            games={registry.list()}
            onPick={(gameId) => act(() => store.createMatch(gameId))}
          />
        ) : screen === 'setup' ? (
          <Setup view={state} store={store} act={act} error={error} />
        ) : screen === 'in-progress' ? (
          <InProgress view={state} store={store} act={act} error={error} reasons={reasons} />
        ) : (
          <Winner view={state} store={store} act={act} />
        )}
      </main>
    </div>
  );
}
