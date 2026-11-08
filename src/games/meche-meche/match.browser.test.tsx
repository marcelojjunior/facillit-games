/**
 * MECHE-MECHE end to end through the real screens (spec 005 SC-001, SC-004,
 * US1–US3, research D3). Lives in the game folder so no shell file names the
 * game. Totals are hand-computed constants, never recomputed by the rules.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { serializeState, STORAGE_KEY } from '../../shell/match/persistence';
import type { Match } from '../../shell/match/types';
import { labels, roundCopy } from '../../shell/ui/copy';
import MatchApp from '../../shell/ui/MatchApp';
import { createRegistry } from '../registry';
import mecheMeche from '.';

const registry = createRegistry([mecheMeche]);
const FIVE = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu'];

async function open(): Promise<RenderResult> {
  return render(<MatchApp registry={registry} />);
}

async function expectScreen(screen: RenderResult, name: string) {
  await expect.element(screen.getByTestId('match-app')).toHaveAttribute('data-screen', name);
}

async function startMatch(screen: RenderResult, names: readonly string[]) {
  await screen.getByTestId('game-option').filter({ hasText: 'MECHE-MECHE' }).click();
  for (const name of names) {
    await screen.getByTestId('player-name-input').fill(name);
    await screen.getByTestId('add-player').click();
    await expect.element(screen.getByTestId('player-name-input')).toHaveValue('');
  }
  await screen.getByTestId('start-match').click();
  await expectScreen(screen, 'in-progress');
}

function button(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true });
}

/** One round: who took which score, and who got +10. */
async function playRound(
  screen: RenderResult,
  next: number,
  scores: Readonly<Record<string, number>>,
  bonus: readonly string[] = [],
) {
  for (const [name, score] of Object.entries(scores)) {
    await button(screen, `${name}: ${score} pontos`).click();
  }
  for (const name of bonus) {
    await button(screen, `Bônus de +10 para ${name}`).click();
  }
  await screen.getByTestId('confirm-round').click();
  await expect.element(screen.getByText(roundCopy(next), { exact: true })).toBeVisible();
}

function row(screen: RenderResult, name: string) {
  return screen.getByTestId('standings').getByTestId('standing-row').filter({ hasText: name });
}

function medalOf(screen: RenderResult, name: string): string | undefined {
  return (
    row(screen, name).element().querySelector<HTMLElement>('[data-testid="medal"]')?.dataset
      .medal ?? undefined
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('a full MECHE-MECHE match (SC-001, US1)', () => {
  it('matches the hand-computed totals, positions, and shared win', async () => {
    const screen = await open();
    await startMatch(screen, FIVE);

    await playRound(screen, 2, { Ana: 50, Bia: 40, Caio: 30 }, ['Edu']);
    await playRound(screen, 3, { Bia: 50, Ana: 40, Duda: 30, Caio: 20, Edu: 10 });
    await playRound(screen, 4, { Caio: 50, Edu: 40, Ana: 10 }, ['Bia', 'Duda']);

    // Renaming during the match keeps the total with the player (FR-011),
    // and the name shows exactly as typed (POC bug: re-capitalized).
    await button(screen, labels.moreActions).click();
    await button(screen, labels.renamePlayer).click();
    await screen.getByRole('dialog').getByRole('button', { name: 'Caio', exact: true }).click();
    await screen.getByLabelText(labels.newName).fill('José da Silva');
    await button(screen, labels.save).click();

    await playRound(screen, 5, { Edu: 50, Duda: 40, Bia: 30, Ana: 20, 'José da Silva': 10 }, [
      'Ana',
    ]);

    const expected: Record<string, [number, string]> = {
      Ana: [130, 'gold'],
      Bia: [130, 'gold'],
      'José da Silva': [110, 'bronze'],
      Edu: [110, 'bronze'],
      Duda: [80, 'plain'],
    };
    for (const [name, [total, medal]] of Object.entries(expected)) {
      await expect.element(row(screen, name)).toMatchTextContent(new RegExp(`${total} pts$`));
      expect(medalOf(screen, name), name).toBe(medal);
    }

    await screen.getByTestId('finish-match').click();
    await screen.getByTestId('confirm-finish').click();
    await expectScreen(screen, 'winner');
    const winners = screen.getByTestId('winner-names');
    await expect.element(winners).toMatchTextContent(labels.sharedWin);
    await expect.element(winners).toMatchTextContent('Ana');
    await expect.element(winners).toMatchTextContent('Bia');

    // The rounds survive the winner screen (POC bug: erased before showing).
    for (const [name, [total]] of Object.entries(expected)) {
      await expect.element(row(screen, name)).toMatchTextContent(new RegExp(`${total} pts$`));
    }
    await expect.element(screen.getByTestId('podium')).toMatchTextContent('José da Silva');
  });

  it('a rematch with 3 players offers 30, 20, 10', async () => {
    const screen = await open();
    await startMatch(screen, FIVE);
    await screen.getByTestId('finish-match').click();
    await screen.getByTestId('confirm-finish').click();
    await screen.getByTestId('rematch').click();
    await expectScreen(screen, 'setup');
    await button(screen, `${labels.remove} Duda`).click();
    await button(screen, `${labels.remove} Edu`).click();
    await screen.getByTestId('start-match').click();

    await expect.element(button(screen, 'Ana: 30 pontos')).toBeVisible();
    await expect.element(button(screen, 'Ana: 10 pontos')).toBeVisible();
    expect(button(screen, 'Ana: 40 pontos').elements()).toHaveLength(0);
  });
});

describe('the POC bugs do not come back (SC-004, US3)', () => {
  it('a name with markup shows as text', async () => {
    const screen = await open();
    await startMatch(screen, ['<b>Ana</b>', 'Bia']);
    await expect.element(row(screen, '<b>Ana</b>')).toBeVisible();
    expect(screen.getByTestId('match-app').element().querySelector('b:not([title])')).toBeNull();
    expect(
      [...screen.getByTestId('match-app').element().querySelectorAll('b')].filter(
        (element) => element.textContent === 'Ana',
      ),
    ).toEqual([]);
  });

  it('a match with zero rounds reopens on the round screen', async () => {
    let screen = await open();
    await startMatch(screen, ['Ana', 'Bia']);
    await screen.unmount();
    screen = await open();
    await expectScreen(screen, 'in-progress');
  });

  it('a half-entered round with a bonus reopens intact', async () => {
    let screen = await open();
    await startMatch(screen, ['Ana', 'Bia', 'Caio']);
    await button(screen, 'Ana: 30 pontos').click();
    await button(screen, 'Bônus de +10 para Caio').click();
    await screen.unmount();

    screen = await open();
    await expect.element(button(screen, 'Ana: 30 pontos')).toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(button(screen, 'Bônus de +10 para Caio'))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('a confirmed round can be fixed from the history', async () => {
    const players = [
      { id: 'p-ana', name: 'Ana' },
      { id: 'p-bia', name: 'Bia' },
    ];
    const match: Match = {
      gameId: mecheMeche.id,
      status: 'in_progress',
      players,
      rounds: [{ scores: { 'p-ana': 20, 'p-bia': 10 }, bonus: [] }],
    };
    localStorage.setItem(STORAGE_KEY, serializeState(match));
    const screen = await open();
    await expect.element(row(screen, 'Ana')).toMatchTextContent(/20 pts$/);

    await screen.getByTestId('open-history').click();
    await screen.getByTestId('history-round').first().click();
    const sheet = screen.getByRole('dialog');
    await sheet.getByRole('button', { name: 'Ana: sem pontuação', exact: true }).click();
    await sheet.getByRole('button', { name: 'Bônus de +10 para Ana', exact: true }).click();
    await screen.getByTestId('save-fix').click();

    await expect.element(row(screen, 'Ana')).toMatchTextContent(/10 pts$/);
    await expect.element(row(screen, 'Bia')).toMatchTextContent(/10 pts$/);
  });
});
