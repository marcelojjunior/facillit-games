/**
 * US1 of spec 004 — the app feels like a casual mobile game (FR-004, FR-006).
 *
 * Every visible button on every screen and overlay is a 3D game button
 * (`btn-3d`) or a raised card (`card-3d`); the only exceptions are the theme
 * control's options and inline text actions marked `data-inline-action`, so a
 * new flat button cannot slip in unnoticed. Text uses the self-hosted game
 * typeface.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import { labels } from './copy';
import MatchApp from './MatchApp';

const players = [
  { id: 'p-ana', name: 'Ana' },
  { id: 'p-bruno', name: 'Bruno' },
];
const round = { ranks: { 'p-ana': 1, 'p-bruno': 2 } };

function seed(match: Match): void {
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

/** Visible buttons inside the app that are neither 3D buttons nor raised cards. */
function flatButtons(): string[] {
  return [...document.querySelectorAll<HTMLElement>('[data-testid="match-app"] button')]
    .filter((button) => button.checkVisibility())
    .filter((button) => !button.closest('[data-testid="theme-control"]'))
    .filter((button) => !button.hasAttribute('data-inline-action'))
    .filter((button) => !button.classList.contains('btn-3d'))
    .filter((button) => !button.classList.contains('card-3d'))
    .map((button) => button.outerHTML.slice(0, 100));
}

function expectGameButtons(where: string): void {
  expect(flatButtons(), `${where}: buttons not in the game style`).toEqual([]);
}

function button(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true });
}

beforeEach(() => {
  localStorage.clear();
});

describe('3D buttons everywhere (FR-004)', () => {
  it('game list, with the discard notice', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByTestId('discard-notice')).toBeVisible();
    expectGameButtons('game list + notice');
  });

  it('setup and its abandon dialog', async () => {
    seed({ gameId: highestWins.id, status: 'setting_up', players, rounds: [] });
    const screen = await render(<MatchApp registry={testRegistry} />);
    expectGameButtons('setup');
    await button(screen, labels.abandon).click();
    expectGameButtons('setup: abandon');
  });

  it('in progress and every overlay', async () => {
    seed({ gameId: highestWins.id, status: 'in_progress', players, rounds: [round, round] });
    const screen = await render(<MatchApp registry={testRegistry} />);
    expectGameButtons('in progress');

    await button(screen, 'Ana: 1º lugar').click();
    await screen.getByTestId('confirm-round').click();
    await expect.element(screen.getByRole('alert')).toBeVisible();
    expectGameButtons('in progress: rejection');

    await screen.getByTestId('open-history').click();
    expectGameButtons('history');
    await screen.getByTestId('history-round').first().click();
    expectGameButtons('fix sheet');
    await button(screen, labels.cancel).click();

    await button(screen, labels.moreActions).click();
    expectGameButtons('menu');
    await button(screen, labels.renamePlayer).click();
    expectGameButtons('rename: pick');
    await screen.getByRole('dialog').getByRole('button', { name: 'Bruno', exact: true }).click();
    expectGameButtons('rename: form');
    await button(screen, labels.cancel).click();

    await button(screen, labels.moreActions).click();
    await button(screen, labels.removeLastRound).click();
    expectGameButtons('remove last round');
    await button(screen, labels.cancel).click();

    await screen.getByTestId('finish-match').click();
    expectGameButtons('finish');
    await screen.getByTestId('confirm-finish').click();
    await expect.element(screen.getByTestId('winner-names')).toBeVisible();
    expectGameButtons('winner');
  });
});

describe('the game typeface (FR-006)', () => {
  it('headings use the self-hosted Baloo 2, and it loads', async () => {
    const screen = await render(<MatchApp registry={testRegistry} />);
    const heading = screen.getByRole('heading', { level: 1 }).element();
    expect(getComputedStyle(heading).fontFamily).toMatch(/^"?Baloo 2"?/);

    const faces = await document.fonts.load('800 20px "Baloo 2"');
    expect(faces.length).toBeGreaterThan(0);
    expect(document.fonts.check('800 20px "Baloo 2"')).toBe(true);
  });
});
