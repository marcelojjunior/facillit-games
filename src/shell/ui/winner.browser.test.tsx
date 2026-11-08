/**
 * US5 of spec 004 — the winner is celebrated (FR-013, FR-014, SC-006): ribbon
 * heading, crowned mascot, podium of the top places, confetti; nothing moves
 * when the device asks for reduced motion.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { highestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import { headings, labels } from './copy';
import MatchApp from './MatchApp';

const players = ['Ana', 'Bruno', 'Carla'].map((name) => ({ id: `p-${name}`, name }));

/** A finished `highest-wins` match with one round of these places. */
function seedFinished(places: readonly number[], roster = players): void {
  const ranks = Object.fromEntries(roster.map((player, index) => [player.id, places[index] ?? 1]));
  const match: Match = {
    gameId: highestWins.id,
    status: 'finished',
    players: roster,
    rounds: [{ ranks }],
  };
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function steps(): { position: string | null; text: string }[] {
  return [...document.querySelectorAll('[data-testid="podium-step"]')].map((step) => ({
    position: step.getAttribute('data-position'),
    text: step.textContent ?? '',
  }));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(async () => {
  await commands.emulateReducedMotion('no-preference');
});

describe('the winner screen (FR-013)', () => {
  it('celebrates a single winner with a ribbon, the podium, and confetti', async () => {
    seedFinished([1, 2, 3]);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByRole('heading', { name: headings.winner })).toBeVisible();
    await expect.element(screen.getByTestId('podium')).toBeVisible();
    expect(steps().map((step) => step.position)).toEqual(['2', '1', '3']);
    expect(steps().find((step) => step.position === '1')?.text).toContain('Ana');
    await expect.element(screen.getByTestId('confetti')).toBeVisible();
  });

  it('puts a tie for first on one step, still named as a shared win', async () => {
    seedFinished([1, 1, 3]);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent(labels.sharedWin);
    expect(steps().map((step) => step.position)).toEqual(['1', '3']);
    const top = steps().find((step) => step.position === '1')?.text ?? '';
    expect(top).toContain('Ana');
    expect(top).toContain('Bruno');
  });

  it('shows two steps for two players', async () => {
    seedFinished([1, 2], players.slice(0, 2));
    await render(<MatchApp registry={testRegistry} />);
    expect(steps()).toHaveLength(2);
  });
});

describe('reduced motion (FR-014, SC-006)', () => {
  it('drops the confetti and every animation, but keeps all the information', async () => {
    await commands.emulateReducedMotion('reduce');
    seedFinished([1, 2, 3]);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByTestId('podium')).toBeVisible();

    const confetti = screen.getByTestId('confetti').element();
    expect(confetti.checkVisibility()).toBe(false);
    expect(document.getAnimations()).toHaveLength(0);
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent('Ana');
    await expect.element(screen.getByTestId('rematch')).toBeVisible();
    await expect.element(screen.getByTestId('new-match')).toBeVisible();
  });
});
