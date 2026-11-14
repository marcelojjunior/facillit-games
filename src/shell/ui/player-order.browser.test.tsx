/**
 * Reorder players in setup (spec 010 US1, US2, SC-002–SC-004). The real app
 * with the test-only games, at 360×640, over the browser's own localStorage.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { createRegistry } from '../../games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import { labels } from './copy';
import MatchApp from './MatchApp';

function button(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true });
}

/** The names in the setup list, top to bottom. */
function listed(screen: RenderResult): string[] {
  return [...screen.container.querySelectorAll('li button[title]')].map(
    (element) => element.textContent ?? '',
  );
}

function stored(): Match {
  return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { match: Match }).match;
}

function seed(match: Match): void {
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

const players = ['Ana', 'Bia', 'Caio'].map((name) => ({ id: `p-${name}`, name }));

beforeEach(() => {
  localStorage.clear();
});

describe('reorder players in setup (spec 010 US1)', () => {
  it('moves players with the arrows, disabled at the ends, and keeps the order on reload', async () => {
    seed({ gameId: highestWins.id, status: 'setting_up', players, rounds: [] });
    let screen = await render(<MatchApp registry={testRegistry} />);

    await expect.element(button(screen, `${labels.moveUp} Ana`)).toBeDisabled();
    await expect.element(button(screen, `${labels.moveDown} Caio`)).toBeDisabled();
    await expect.element(button(screen, `${labels.moveDown} Ana`)).toBeEnabled();

    await button(screen, `${labels.moveUp} Caio`).click();
    await button(screen, `${labels.moveUp} Caio`).click();
    await expect.poll(() => listed(screen)).toEqual(['Caio', 'Ana', 'Bia']);
    await expect.element(button(screen, `${labels.moveUp} Caio`)).toBeDisabled();
    expect(stored().players.map((player) => player.name)).toEqual(['Caio', 'Ana', 'Bia']);

    await screen.unmount();
    screen = await render(<MatchApp registry={testRegistry} />);
    await expect.poll(() => listed(screen)).toEqual(['Caio', 'Ana', 'Bia']);

    await screen.getByTestId('start-match').click();
    expect(stored().players.map((player) => player.name)).toEqual(['Caio', 'Ana', 'Bia']);
    expect(
      screen.container.querySelectorAll(`[aria-label^="${labels.moveUp} "]`),
      'no arrows once started',
    ).toHaveLength(0);
  });

  it('fits 10 long names at 360 px: no sideways scroll, every button ≥ 44×44 (SC-004)', async () => {
    const wide = createRegistry([{ ...highestWins, id: 'wide', maxPlayers: 10 }]);
    const ten = Array.from({ length: 10 }, (_, index) => ({
      id: `p${index}`,
      name: `Jogadora número ${index + 1} da Silva`,
    }));
    seed({ gameId: 'wide', status: 'setting_up', players: ten, rounds: [] });
    const screen = await render(<MatchApp registry={wide} />);

    await expect.element(button(screen, `${labels.moveDown} ${ten[0]?.name ?? ''}`)).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const small = [...screen.container.querySelectorAll('li button')]
      .map((element) => element.getBoundingClientRect())
      .filter((box) => box.width < 43.5 || box.height < 43.5);
    expect(small).toEqual([]);
  });
});

describe('reorder for a rematch (spec 010 US2)', () => {
  it('opens the rematch in the previous order and moves the first player to the end', async () => {
    seed({
      gameId: highestWins.id,
      status: 'finished',
      players,
      rounds: [{ ranks: { 'p-Ana': 1, 'p-Bia': 2, 'p-Caio': 3 } }],
    });
    const screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByTestId('rematch').click();
    await expect.poll(() => listed(screen)).toEqual(['Ana', 'Bia', 'Caio']);

    // Two taps move Ana from first to last (SC-002).
    await button(screen, `${labels.moveDown} Ana`).click();
    await button(screen, `${labels.moveDown} Ana`).click();
    await expect.poll(() => listed(screen)).toEqual(['Bia', 'Caio', 'Ana']);

    await screen.getByTestId('start-match').click();
    expect(stored()).toMatchObject({ status: 'in_progress', rounds: [] });
    expect(stored().players.map((player) => player.name)).toEqual(['Bia', 'Caio', 'Ana']);
  });
});
