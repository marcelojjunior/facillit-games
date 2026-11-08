/**
 * Spec 006 — the house button (US1), the setup layout (US2), and each game's
 * picture on the game list (US3, shell side).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import LowestWinsEntry from '../../../tests/fixtures/games/lowest-wins/RoundEntry';
import * as lowestRules from '../../../tests/fixtures/games/lowest-wins/rules';
import { createRegistry } from '../../games/registry';
import { defineGame } from '../game/contract';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match, MatchStatus } from '../match/types';
import { THEME_KEY } from '../theme/preference';
import { labels } from './copy';
import MatchApp from './MatchApp';

const players = [
  { id: 'p-ana', name: 'Ana' },
  { id: 'p-bia', name: 'Bia' },
];

function seed(status: MatchStatus): void {
  const match: Match = {
    gameId: highestWins.id,
    status,
    players,
    rounds: status === 'setting_up' ? [] : [{ ranks: { 'p-ana': 1, 'p-bia': 2 } }],
  };
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function stored(): unknown {
  return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"match":null}') as { match: unknown })
    .match;
}

async function expectScreen(screen: RenderResult, name: string) {
  await expect.element(screen.getByTestId('match-app')).toHaveAttribute('data-screen', name);
}

beforeEach(() => {
  localStorage.clear();
});

describe('the house button (FR-001–FR-003)', () => {
  it('is not on the game list', async () => {
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expectScreen(screen, 'game-list');
    expect(screen.getByTestId('home').elements()).toHaveLength(0);
  });

  it.each<MatchStatus>(['setting_up', 'in_progress'])(
    'from %s: warns the match is lost; cancel keeps it, confirm goes home',
    async (status) => {
      seed(status);
      localStorage.setItem(THEME_KEY, '{"schemaVersion":1,"theme":"dark"}');
      const screen = await render(<MatchApp registry={testRegistry} />);

      await screen.getByTestId('home').click();
      await expect.element(screen.getByRole('dialog')).toMatchTextContent(labels.homeLoses);
      await screen.getByRole('button', { name: labels.cancel, exact: true }).click();
      expect(stored()).not.toBeNull();

      await screen.getByTestId('home').click();
      await screen.getByTestId('confirm-home').click();
      await expectScreen(screen, 'game-list');
      expect(stored()).toBeNull();
      expect(localStorage.getItem(THEME_KEY)).toBe('{"schemaVersion":1,"theme":"dark"}');
    },
  );

  it('from the winner screen: says the finished match will be closed', async () => {
    seed('finished');
    const screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByTestId('home').click();
    await expect.element(screen.getByRole('dialog')).toMatchTextContent(labels.homeCloses);
    await screen.getByTestId('confirm-home').click();
    await expectScreen(screen, 'game-list');
  });
});

describe('setup layout (FR-004)', () => {
  it('stacks a full-width name field over a full-width add button', async () => {
    seed('setting_up');
    const screen = await render(<MatchApp registry={testRegistry} />);
    const input = screen.getByTestId('player-name-input').element().getBoundingClientRect();
    const add = screen.getByTestId('add-player').element().getBoundingClientRect();
    expect(Math.abs(input.width - add.width)).toBeLessThanOrEqual(1);
    expect(add.top).toBeGreaterThanOrEqual(input.bottom);
  });
});

describe('game pictures (FR-005)', () => {
  it("shows a game's own icon, and the trophy for one without", async () => {
    const withIcon = defineGame<lowestRules.PointsRound>({
      id: 'with-icon',
      name: 'Com Icone',
      minPlayers: 3,
      maxPlayers: 6,
      validateRound: lowestRules.validateRound,
      scoreRound: lowestRules.scoreRound,
      computeTotals: lowestRules.computeTotals,
      resolveWinners: lowestRules.resolveWinners,
      RoundEntry: LowestWinsEntry,
      Icon: () => <svg data-testid="game-icon" />,
    });
    const screen = await render(<MatchApp registry={createRegistry([withIcon, highestWins])} />);
    const options = screen.getByTestId('game-option');
    expect(options.first().element().querySelector('[data-testid="game-icon"]')).not.toBeNull();
    expect(options.last().element().querySelector('[data-testid="game-icon"]')).toBeNull();
    expect(options.last().element().querySelector('svg')).not.toBeNull();
  });
});

// `labels.home` names the button for assistive technology.
it('names the house button', async () => {
  seed('setting_up');
  const screen = await render(<MatchApp registry={testRegistry} />);
  await expect.element(screen.getByTestId('home')).toHaveAccessibleName(labels.home);
});
