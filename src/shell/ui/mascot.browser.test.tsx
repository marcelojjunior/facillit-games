/**
 * US3 of spec 004 — the die mascot greets, helps with a rejected round, and
 * celebrates (FR-009, FR-010). Decorative: hidden from assistive technology
 * and never on top of a control or a heading.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { highestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { createRegistry } from '../../games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import MatchApp from './MatchApp';

const players = [
  { id: 'p-ana', name: 'Ana' },
  { id: 'p-bruno', name: 'Bruno' },
];

function seed(match: Match): void {
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function overlaps(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** The visible mascot: decorative, and clear of every control and heading. */
function expectClearMascot(where: string): HTMLElement {
  const mascots = [...document.querySelectorAll<HTMLElement>('[data-testid="mascot"]')].filter(
    (element) => element.checkVisibility(),
  );
  expect(mascots, `${where}: one visible mascot`).toHaveLength(1);
  const mascot = mascots[0] as HTMLElement;
  expect(mascot.getAttribute('aria-hidden')).toBe('true');
  const box = mascot.getBoundingClientRect();
  const blocked = [...document.querySelectorAll<HTMLElement>('button, input, h1, h2')]
    .filter((element) => element.checkVisibility())
    .filter((element) => overlaps(box, element.getBoundingClientRect()))
    .map((element) => element.outerHTML.slice(0, 80));
  expect(blocked, `${where}: mascot covers`).toEqual([]);
  return mascot;
}

beforeEach(() => {
  localStorage.clear();
});

describe('the mascot (FR-009, FR-010)', () => {
  it('greets on the game list, also when no game is available', async () => {
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByTestId('mascot')).toBeVisible();
    expectClearMascot('game list');
    await screen.unmount();

    const empty = await render(<MatchApp registry={createRegistry([])} />);
    await expect.element(empty.getByTestId('mascot')).toBeVisible();
    expectClearMascot('empty game list');
  });

  it('appears beside the reasons of a rejected round, and leaves after a good one', async () => {
    seed({ gameId: highestWins.id, status: 'in_progress', players, rounds: [] });
    const screen = await render(<MatchApp registry={testRegistry} />);
    expect(screen.getByTestId('mascot').elements()).toHaveLength(0);

    await screen.getByRole('button', { name: 'Ana: 1º lugar', exact: true }).click();
    await screen.getByTestId('confirm-round').click();
    await expect.element(screen.getByRole('alert').getByTestId('mascot')).toBeVisible();
    expectClearMascot('rejection');

    await screen.getByRole('button', { name: 'Bruno: 2º lugar', exact: true }).click();
    await screen.getByTestId('confirm-round').click();
    await expect.element(screen.getByTestId('mascot')).not.toBeInTheDocument();
  });

  it('wears a crown on the winner screen', async () => {
    seed({
      gameId: highestWins.id,
      status: 'finished',
      players,
      rounds: [{ ranks: { 'p-ana': 1, 'p-bruno': 2 } }],
    });
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(screen.getByTestId('mascot')).toHaveAttribute('data-crown', 'true');
    expectClearMascot('winner');
  });
});
