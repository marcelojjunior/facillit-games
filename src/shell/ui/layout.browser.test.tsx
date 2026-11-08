/**
 * Principle VI, measured (SC-002, SC-004, SC-007, SC-008, FR-020, FR-020a,
 * FR-022–FR-024): every screen and overlay at 360×640, with 7 players and 30
 * rounds, plus the theme control.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, lowestWins } from '../../../tests/fixtures/games/registry';
import LowestWinsEntry from '../../../tests/fixtures/games/lowest-wins/RoundEntry';
import * as lowestRules from '../../../tests/fixtures/games/lowest-wins/rules';
import { createRegistry } from '../../games/registry';
import { defineGame, type PlayerRef } from '../game/contract';
import { serializeState, STORAGE_KEY, type StorageLike } from '../match/persistence';
import type { Match } from '../match/types';
import { THEME_KEY } from '../theme/preference';
import { labels } from './copy';
import MatchApp from './MatchApp';

/** Same rules as lowest-wins, room for 8: the widest table a test game allows. */
const manyPlayers = defineGame<lowestRules.PointsRound>({
  id: 'many-players',
  name: 'Muitos Jogadores',
  minPlayers: 2,
  maxPlayers: 8,
  validateRound: lowestRules.validateRound,
  scoreRound: lowestRules.scoreRound,
  computeTotals: lowestRules.computeTotals,
  resolveWinners: lowestRules.resolveWinners,
  RoundEntry: LowestWinsEntry,
});
const registry = createRegistry([manyPlayers, highestWins, lowestWins]);

const SEVEN: PlayerRef[] = [
  'Maria Eduarda Albuquerque Silv',
  'Bruno',
  'Carla',
  'Davi',
  'Eva',
  'Fábio',
  'Gabriela',
].map((name, index) => ({ id: `p${index}`, name }));

const THIRTY_ROUNDS = Array.from({ length: 30 }, (_, round) => ({
  points: Object.fromEntries(SEVEN.map((player, index) => [player.id, ((round * index) % 23) - 7])),
}));

function seed(match: Match): void {
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

const inProgress: Match = {
  gameId: manyPlayers.id,
  status: 'in_progress',
  players: SEVEN,
  rounds: THIRTY_ROUNDS,
};

/** Every visible tappable element ≥ 44×44, and no horizontal page scroll. */
function expectLayout(where: string): void {
  const visible = [
    ...document.querySelectorAll('button, a, input, select, [role="button"]'),
  ].filter((element) => element.checkVisibility());
  expect(visible.length, `${where}: no tappable element found`).toBeGreaterThan(3);
  const small = visible
    .map((element) => ({ element, box: element.getBoundingClientRect() }))
    .filter(({ box }) => box.width < 43.5 || box.height < 43.5)
    .map(({ element, box }) => `${element.outerHTML.slice(0, 80)} ${box.width}×${box.height}`);
  expect(small, `${where}: targets under 44×44 (SC-004)`).toEqual([]);
  expect(
    document.documentElement.scrollWidth,
    `${where}: horizontal page scroll (SC-007)`,
  ).toBeLessThanOrEqual(window.innerWidth);
  expect(
    document.querySelector('[data-testid="theme-control"]'),
    `${where}: theme control (FR-020)`,
  ).not.toBeNull();
}

function button(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true });
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterAll(async () => {
  await commands.emulateColorScheme('light');
});

describe('every screen and overlay at 360×640 (SC-002, SC-004, SC-007)', () => {
  it('game list, with and without the discard notice', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    const screen = await render(<MatchApp registry={registry} />);
    await expect.element(screen.getByTestId('discard-notice')).toBeVisible();
    expectLayout('game list + notice');
    await screen.getByTestId('discard-notice').getByRole('button').click();
    expectLayout('game list');
  });

  it('setup with 7 players and the abandon dialog', async () => {
    seed({ gameId: manyPlayers.id, status: 'setting_up', players: SEVEN, rounds: [] });
    const screen = await render(<MatchApp registry={registry} />);
    expectLayout('setup');
    await button(screen, labels.abandon).click();
    expectLayout('setup: abandon dialog');
  });

  it('in progress with 7 players and 30 rounds, and each overlay', async () => {
    seed(inProgress);
    const screen = await render(<MatchApp registry={registry} />);
    expectLayout('in progress');

    // SC-002: confirm reachable without scrolling.
    const confirm = screen.getByTestId('confirm-round').element().getBoundingClientRect();
    expect(confirm.top).toBeGreaterThanOrEqual(0);
    expect(confirm.bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(confirm.top).toBeGreaterThan(window.innerHeight / 2);
    // SC-007: one line per player, whatever the round count.
    const rows = screen.getByTestId('standing-row').elements();
    expect(rows).toHaveLength(7);
    for (const row of rows) {
      expect(row.getBoundingClientRect().height).toBeLessThan(60);
    }

    await screen.getByTestId('open-history').click();
    expectLayout('history');
    await screen.getByTestId('history-round').first().click();
    expectLayout('fix sheet');
    await button(screen, labels.cancel).click();

    await button(screen, labels.moreActions).click();
    expectLayout('menu');
    await button(screen, labels.renamePlayer).click();
    expectLayout('rename: pick');
    await screen.getByRole('dialog').getByRole('button', { name: 'Bruno', exact: true }).click();
    expectLayout('rename: form');
    await button(screen, labels.cancel).click();

    await button(screen, labels.moreActions).click();
    await button(screen, labels.removeLastRound).click();
    expectLayout('remove last round');
    await button(screen, labels.cancel).click();

    await button(screen, labels.moreActions).click();
    await button(screen, labels.abandon).click();
    expectLayout('abandon');
    await button(screen, labels.cancel).click();

    await screen.getByTestId('finish-match').click();
    expectLayout('finish confirmation');
    await screen.getByTestId('confirm-finish').click();
    await expect.element(screen.getByTestId('winner-names')).toBeVisible();
    expectLayout('winner');
  });

  it('in progress with a place-picking entry (4 players)', async () => {
    seed({
      gameId: highestWins.id,
      status: 'in_progress',
      players: SEVEN.slice(0, 4),
      rounds: [],
    });
    const screen = await render(<MatchApp registry={registry} />);
    await expect.element(screen.getByTestId('round-entry')).toBeVisible();
    expectLayout('highest-wins entry');
  });
});

describe('theme control (FR-020, FR-020a, SC-008)', () => {
  const theme = () => document.documentElement.dataset.theme;

  it('switches live and persists across a remount', async () => {
    const screen = await render(<MatchApp registry={registry} />);
    await button(screen, labels.themeDark).click();
    expect(theme()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(JSON.parse(localStorage.getItem(THEME_KEY) ?? '')).toEqual({
      schemaVersion: 1,
      theme: 'dark',
    });

    await screen.unmount();
    delete document.documentElement.dataset.theme;
    const again = await render(<MatchApp registry={registry} />);
    await expect.element(button(again, labels.themeDark)).toHaveAttribute('aria-pressed', 'true');
    expect(theme()).toBe('dark');
  });

  it('still switches when saving the choice fails', async () => {
    const refusing: StorageLike = {
      getItem: (key) => localStorage.getItem(key),
      removeItem: (key) => localStorage.removeItem(key),
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
    };
    const screen = await render(<MatchApp registry={registry} storage={refusing} />);
    await button(screen, labels.themeDark).click();
    expect(theme()).toBe('dark');
    await button(screen, labels.themeLight).click();
    expect(theme()).toBe('light');
  });

  it('in automatic, follows a device change without reload', async () => {
    const screen = await render(<MatchApp registry={registry} />);
    await button(screen, labels.themeAuto).click();

    await commands.emulateColorScheme('dark');
    await expect.poll(theme).toBe('dark');
    await commands.emulateColorScheme('light');
    await expect.poll(theme).toBe('light');

    // An explicit choice overrides the device.
    await button(screen, labels.themeDark).click();
    await commands.emulateColorScheme('light');
    expect(theme()).toBe('dark');
  });

  it('is never touched by match operations', async () => {
    localStorage.setItem(THEME_KEY, '{"schemaVersion":1,"theme":"dark"}');
    seed({ ...inProgress, status: 'finished' });
    const screen = await render(<MatchApp registry={registry} />);
    await screen.getByTestId('new-match').click();
    expect(localStorage.getItem(THEME_KEY)).toBe('{"schemaVersion":1,"theme":"dark"}');
  });
});
