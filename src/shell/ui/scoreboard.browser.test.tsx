/**
 * US4 of spec 004 — scores read as a game scoreboard (FR-011, FR-012,
 * SC-007): totals as "N pts" with their sign, positions as medals shared on
 * ties, and never a coin.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { lowestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import MatchApp from './MatchApp';

const players = ['Ana', 'Bruno', 'Carla', 'Davi'].map((name) => ({ id: `p-${name}`, name }));

function seedPoints(points: readonly number[]): void {
  const round = {
    points: Object.fromEntries(players.map((player, index) => [player.id, points[index] ?? 0])),
  };
  const match: Match = { gameId: lowestWins.id, status: 'in_progress', players, rounds: [round] };
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function texts(testId: string): string[] {
  return [...document.querySelectorAll(`[data-testid="standings"] [data-testid="${testId}"]`)].map(
    (element) => element.textContent ?? '',
  );
}

function medals(): (string | null)[] {
  return [...document.querySelectorAll('[data-testid="standings"] [data-testid="medal"]')].map(
    (element) => element.getAttribute('data-medal'),
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('the scoreboard (FR-011, FR-012, SC-007)', () => {
  it('shows every total as "N pts", keeping the sign', async () => {
    // Lowest wins: Ana -25 (1st), Bruno and Carla 10 (2nd, shared), Davi 30 (4th).
    seedPoints([-25, 10, 10, 30]);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByTestId('standings')).toBeVisible();

    const points = texts('points');
    expect(points).toHaveLength(4);
    for (const text of points) {
      expect(text).toMatch(/^-?\d+ pts$/);
    }
    expect(points[0]).toBe('-25 pts');
  });

  it('gives medals by position, shared on a tie, and a plain badge from 4th', async () => {
    seedPoints([-25, 10, 10, 30]);
    await render(<MatchApp registry={testRegistry} />);
    expect(medals()).toEqual(['gold', 'silver', 'silver', 'plain']);
    expect(texts('medal')).toEqual(['1º', '2º', '2º', '4º']);
  });

  it('shares gold on a tie for first', async () => {
    seedPoints([5, 5, 9, 12]);
    await render(<MatchApp registry={testRegistry} />);
    expect(medals().slice(0, 2)).toEqual(['gold', 'gold']);
  });

  it('never draws a coin', async () => {
    seedPoints([1, 2, 3, 4]);
    const screen = await render(<MatchApp registry={testRegistry} />);
    const standings = screen.getByTestId('standings').element();
    expect(standings.querySelectorAll('img')).toHaveLength(0);
    expect(standings.innerHTML).not.toMatch(/coin|moeda/i);
  });
});
