/**
 * The app: the only island (research D3 of spec 003). It owns the match store
 * and picks one screen from the stored `status` alone (FR-001).
 *
 * Create it only in the browser (`client:only="react"`, Principle IV): the
 * store reads storage synchronously at creation, so the first render is
 * already the right screen and a reopened match never flashes the game list.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Registry } from '../game/contract';
import type { StorageLike } from '../match/persistence';
import { createMatchStore, type MatchView } from '../match/store';
import { labels } from './copy';

export interface MatchAppProps {
  readonly registry: Registry;
  /** Default: the browser's localStorage. Tests pass their own. */
  readonly storage?: StorageLike | null;
}

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

export default function MatchApp({ registry, storage }: MatchAppProps) {
  // ponytail: created once per mount; under StrictMode's double effect the
  // cross-tab listener would be gone. Astro does not use StrictMode.
  const [{ store, subscribe, getSnapshot }] = useState(() => {
    const created = createMatchStore(storage === undefined ? { registry } : { registry, storage });
    return {
      store: created,
      subscribe: (listener: () => void) => created.subscribe(listener),
      getSnapshot: () => created.getState(),
    };
  });
  useEffect(() => () => store.dispose(), [store]);

  const state = useSyncExternalStore(subscribe, getSnapshot);
  const screen = screenOf(state);

  return (
    <div data-testid="match-app" data-screen={screen} className="min-h-dvh">
      <header className="flex min-h-14 items-center px-4">
        <span className="font-semibold">{labels.appTitle}</span>
      </header>
      <main className="px-4">{screen}</main>
    </div>
  );
}
