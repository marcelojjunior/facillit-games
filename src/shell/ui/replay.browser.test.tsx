/**
 * US4 — play again (spec 003 US4 scenarios 1–3, FR-007, FR-008).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match, MatchStatus } from '../match/types';
import { headings, labels } from './copy';
import MatchApp from './MatchApp';

const ANA = { id: 'p-ana', name: 'Ana' };
const BRUNO = { id: 'p-bruno', name: 'Bruno' };

function seed(status: MatchStatus): void {
  const match: Match = {
    gameId: highestWins.id,
    status,
    players: [ANA, BRUNO],
    rounds: status === 'setting_up' ? [] : [{ ranks: { [ANA.id]: 1, [BRUNO.id]: 2 } }],
  };
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function stored(): Match | null {
  return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"match":null}') as { match: Match })
    .match;
}

async function expectScreen(screen: RenderResult, name: string): Promise<void> {
  await expect.element(screen.getByTestId('match-app')).toHaveAttribute('data-screen', name);
}

function button(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true });
}

beforeEach(() => {
  localStorage.clear();
});

describe('winner screen (US4 1, 2)', () => {
  it('rematch: setup with the same game and players, no rounds, still editable', async () => {
    seed('finished');
    const screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByTestId('rematch').click();

    await expectScreen(screen, 'setup');
    await expect.element(screen.getByText(highestWins.name, { exact: false })).toBeVisible();
    expect(stored()?.players.map((player) => player.name)).toEqual(['Ana', 'Bruno']);
    expect(stored()?.rounds).toEqual([]);

    await screen.getByTestId('player-name-input').fill('Carla');
    await screen.getByTestId('add-player').click();
    await button(screen, `${labels.remove} Ana`).click();
    await expect.element(button(screen, 'Carla')).toBeVisible();
    expect(stored()?.players.map((player) => player.name)).toEqual(['Bruno', 'Carla']);
  });

  it('new match: the game list', async () => {
    seed('finished');
    const screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByTestId('new-match').click();
    await expectScreen(screen, 'game-list');
    expect(stored()).toBeNull();
  });
});

describe('abandon (US4 3, FR-008)', () => {
  it('from setup: cancel keeps everything, confirm shows the game list', async () => {
    seed('setting_up');
    const screen = await render(<MatchApp registry={testRegistry} />);

    await button(screen, labels.abandon).click();
    await expect.element(screen.getByText(headings.abandon)).toBeVisible();
    await button(screen, labels.cancel).click();
    await expectScreen(screen, 'setup');
    expect(stored()?.players).toHaveLength(2);

    await button(screen, labels.abandon).click();
    await screen.getByTestId('confirm-abandon').click();
    await expectScreen(screen, 'game-list');
    expect(stored()).toBeNull();
  });

  it('from in progress: through the more-options menu', async () => {
    seed('in_progress');
    const screen = await render(<MatchApp registry={testRegistry} />);

    await button(screen, labels.moreActions).click();
    await button(screen, labels.abandon).click();
    await button(screen, labels.cancel).click();
    await expectScreen(screen, 'in-progress');
    expect(stored()?.rounds).toHaveLength(1);

    await button(screen, labels.moreActions).click();
    await button(screen, labels.abandon).click();
    await screen.getByTestId('confirm-abandon').click();
    await expectScreen(screen, 'game-list');
    expect(stored()).toBeNull();
  });
});
