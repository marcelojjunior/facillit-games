/**
 * US2 — the match survives a closed tab (SC-003, spec 003 US2 scenarios 1–6).
 *
 * "Reopening" is an unmount and a fresh mount over the same localStorage: the
 * new store reads storage at creation, exactly as a reloaded page does.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, lowestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { createRegistry } from '../../games/registry';
import { serializeState, STORAGE_KEY, type StorageLike } from '../match/persistence';
import type { Match } from '../match/types';
import { discardCopy, roundCopy } from './copy';
import MatchApp from './MatchApp';

const ANA = { id: 'p-ana', name: 'Ana' };
const BRUNO = { id: 'p-bruno', name: 'Bruno' };

const inProgress: Match = {
  gameId: highestWins.id,
  status: 'in_progress',
  players: [ANA, BRUNO],
  rounds: [{ ranks: { [ANA.id]: 1, [BRUNO.id]: 2 } }],
};

function seed(match: Match): void {
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

/** The screen of the very first committed render, before any effect could change it. */
function firstScreen(screen: RenderResult): string | undefined {
  return screen.container.querySelector<HTMLElement>('[data-testid="match-app"]')?.dataset.screen;
}

async function reopen(screen: RenderResult, element = <MatchApp registry={testRegistry} />) {
  await screen.unmount();
  return render(element);
}

beforeEach(() => {
  localStorage.clear();
});

describe('reopening restores the same screen (SC-003)', () => {
  it('setup: same game and players', async () => {
    seed({ gameId: lowestWins.id, status: 'setting_up', players: [ANA], rounds: [] });
    let screen = await render(<MatchApp registry={testRegistry} />);
    expect(firstScreen(screen)).toBe('setup');

    screen = await reopen(screen);
    expect(firstScreen(screen)).toBe('setup');
    await expect.element(screen.getByText(lowestWins.name, { exact: false })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Ana', exact: true })).toBeVisible();
  });

  it('in progress: same rounds and the half-entered draft', async () => {
    seed(inProgress);
    let screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByRole('button', { name: 'Ana: 2º lugar', exact: true }).click();

    screen = await reopen(screen);
    expect(firstScreen(screen)).toBe('in-progress');
    await expect.element(screen.getByText(roundCopy(2), { exact: true })).toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Ana: 2º lugar', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(screen.getByRole('button', { name: 'Bruno: 1º lugar', exact: true }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('winner: the winner screen with its actions', async () => {
    seed({ ...inProgress, status: 'finished' });
    let screen = await render(<MatchApp registry={testRegistry} />);
    screen = await reopen(screen);
    expect(firstScreen(screen)).toBe('winner');
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent('Ana');
    await expect.element(screen.getByTestId('rematch')).toBeVisible();
    await expect.element(screen.getByTestId('new-match')).toBeVisible();
  });
});

describe('discarded data (FR-015)', () => {
  it('a match of a game no longer registered: notice once, then the game list', async () => {
    seed(inProgress);
    let screen = await render(<MatchApp registry={createRegistry([lowestWins])} />);
    expect(firstScreen(screen)).toBe('game-list');
    await expect
      .element(screen.getByTestId('discard-notice'))
      .toMatchTextContent(discardCopy.unknown_game);

    screen = await reopen(screen, <MatchApp registry={createRegistry([lowestWins])} />);
    expect(screen.getByTestId('discard-notice').elements()).toHaveLength(0);
  });

  it('corrupted data: notice once, gone after dismiss and reopen', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    let screen = await render(<MatchApp registry={testRegistry} />);
    const notice = screen.getByTestId('discard-notice');
    await expect.element(notice).toMatchTextContent(discardCopy.unreadable);

    await notice.getByRole('button').click();
    await expect.element(notice).not.toBeInTheDocument();

    screen = await reopen(screen);
    expect(screen.getByTestId('discard-notice').elements()).toHaveLength(0);
  });
});

describe('storage refuses to save (FR-016)', () => {
  it('warns after an unsaved operation and clears after a saved one', async () => {
    let failing = true;
    const storage: StorageLike = {
      getItem: (key) => localStorage.getItem(key),
      removeItem: (key) => localStorage.removeItem(key),
      setItem: (key, value) => {
        if (failing) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        localStorage.setItem(key, value);
      },
    };
    const screen = await render(<MatchApp registry={testRegistry} storage={storage} />);
    expect(screen.getByTestId('not-saved-warning').elements()).toHaveLength(0);

    await screen.getByTestId('game-option').first().click();
    await expect.element(screen.getByTestId('not-saved-warning')).toBeVisible();
    // Play goes on: the operation still happened in memory.
    await expect.element(screen.getByTestId('match-app')).toHaveAttribute('data-screen', 'setup');

    failing = false;
    await screen.getByTestId('player-name-input').fill('Ana');
    await screen.getByTestId('add-player').click();
    await expect.element(screen.getByTestId('not-saved-warning')).not.toBeInTheDocument();
  });
});

describe('another tab (FR-018)', () => {
  it('shows a round confirmed elsewhere without a reload', async () => {
    seed(inProgress);
    const screen = await render(<MatchApp registry={testRegistry} />);
    const ana = screen.getByTestId('standing-row').filter({ hasText: 'Ana' });
    await expect.element(ana).toMatchTextContent(/20 pts$/);

    const newValue = serializeState({
      ...inProgress,
      rounds: [...inProgress.rounds, { ranks: { [ANA.id]: 1, [BRUNO.id]: 2 } }],
    });
    localStorage.setItem(STORAGE_KEY, newValue);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue }));

    await expect.element(ana).toMatchTextContent(/40 pts$/);
    await expect.element(screen.getByText(roundCopy(3), { exact: true })).toBeVisible();
  });
});
