/**
 * LEVA end to end through the real screens (spec 007 SC-001, SC-004, US1,
 * US2). Lives in the game folder so no shell file names the game. Lives are
 * hand-computed constants, never recomputed by the rules.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { roundCopy } from '../../shell/ui/copy';
import MatchApp from '../../shell/ui/MatchApp';
import { createRegistry } from '../registry';
import leva from '.';

const registry = createRegistry([leva]);

async function open(): Promise<RenderResult> {
  return render(<MatchApp registry={registry} />);
}

async function expectScreen(screen: RenderResult, name: string) {
  await expect.element(screen.getByTestId('match-app')).toHaveAttribute('data-screen', name);
}

function tap(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true }).click();
}

function row(screen: RenderResult, name: string) {
  return screen.getByTestId('standings').getByTestId('standing-row').filter({ hasText: name });
}

const label = (cards: number, n: number, step: 'palpite' | 'levou') =>
  cards > 1
    ? String(n)
    : step === 'palpite'
      ? n === 1
        ? 'Leva'
        : 'Não leva'
      : n === 1
        ? 'Levou'
        : 'Não levou';

async function guess(screen: RenderResult, cards: number, guesses: Record<string, number>) {
  await expect
    .element(screen.getByTestId('leva-cards'))
    .toHaveTextContent(cards === 1 ? '1 carta' : `${cards} cartas`);
  for (const [name, n] of Object.entries(guesses)) {
    await tap(screen, `${name}: palpite ${label(cards, n, 'palpite')}`);
  }
}

async function result(
  screen: RenderResult,
  next: number,
  cards: number,
  taken: Record<string, number>,
) {
  await screen.getByTestId('leva-step').click();
  for (const [name, n] of Object.entries(taken)) {
    await tap(screen, `${name}: levou ${label(cards, n, 'levou')}`);
  }
  await screen.getByTestId('confirm-round').click();
  await expect.element(screen.getByText(roundCopy(next), { exact: true })).toBeVisible();
}

async function expectLives(screen: RenderResult, lives: Record<string, number>) {
  for (const [name, n] of Object.entries(lives)) {
    await expect
      .element(row(screen, name))
      .toMatchTextContent(new RegExp(`${n} ${n === 1 ? 'vida' : 'vidas'}$`));
  }
}

function playing(screen: RenderResult): string[] {
  return [
    ...screen
      .getByTestId('round-entry')
      .element()
      .querySelectorAll('[data-testid="leva-player"] [title]'),
  ].map((element) => element.textContent ?? '');
}

beforeEach(() => {
  localStorage.clear();
});

describe('a full LEVA match (SC-001, SC-004)', () => {
  it('matches the hand-computed lives, cards, and winner', async () => {
    let screen = await open();
    await screen.getByTestId('game-option').filter({ hasText: 'LEVA' }).click();
    for (const name of ['Ana', 'Bia', 'Caio', 'Duda']) {
      await screen.getByTestId('player-name-input').fill(name);
      await screen.getByTestId('add-player').click();
      await expect.element(screen.getByTestId('player-name-input')).toHaveValue('');
    }
    await screen.getByTestId('start-match').click();
    await expectScreen(screen, 'in-progress');
    await expectLives(screen, { Ana: 5, Bia: 5, Caio: 5, Duda: 5 });

    // Round 1, 1 card: everybody right → 5 5 5 5.
    await guess(screen, 1, { Ana: 1, Bia: 0, Caio: 0, Duda: 0 });
    await result(screen, 2, 1, { Ana: 1, Bia: 0, Caio: 0, Duda: 0 });
    await expectLives(screen, { Ana: 5, Bia: 5, Caio: 5, Duda: 5 });

    // Round 2, 2 cards: Bia 2/0 −2, Caio 0/1 −1, Duda 2/0 −2 → 5 3 4 3.
    await guess(screen, 2, { Ana: 1, Bia: 2, Caio: 0, Duda: 2 });
    await result(screen, 3, 2, { Ana: 1, Bia: 0, Caio: 1, Duda: 0 });
    await expectLives(screen, { Ana: 5, Bia: 3, Caio: 4, Duda: 3 });

    // Round 3, 3 cards, one trick cancelled (2 of 3 taken): Ana 0/1 −1,
    // Bia 3/0 −3, Duda 3/0 −3 → 4 0 4 0. Bia and Duda are out.
    await guess(screen, 3, { Ana: 0, Bia: 3, Caio: 1, Duda: 3 });
    await result(screen, 4, 3, { Ana: 1, Bia: 0, Caio: 1, Duda: 0 });
    await expectLives(screen, { Ana: 4, Bia: 0, Caio: 4, Duda: 0 });
    expect(playing(screen)).toEqual(['Ana', 'Caio']);

    // Round 4 back to 1 card. The guesses survive a reload (SC-004).
    await guess(screen, 1, { Ana: 1, Caio: 1 });
    await screen.unmount();
    screen = await open();
    await expect
      .element(screen.getByRole('button', { name: 'Caio: palpite Leva', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    // Caio 1/0 −1 → 4 3.
    await result(screen, 5, 1, { Ana: 1, Caio: 0 });
    await expectLives(screen, { Ana: 4, Caio: 3 });

    // Round 5, 2 cards: Ana 1/0 −1, Caio 0/2 −2 → 3 1.
    await guess(screen, 2, { Ana: 1, Caio: 0 });
    await result(screen, 6, 2, { Ana: 0, Caio: 2 });
    await expectLives(screen, { Ana: 3, Caio: 1 });

    // Round 6, 3 cards: Caio 2/0 −2, floored at 0 → 3 0. Ana is left.
    await guess(screen, 3, { Ana: 1, Caio: 2 });
    await result(screen, 7, 3, { Ana: 1, Caio: 0 });
    await expectLives(screen, { Ana: 3, Bia: 0, Caio: 0, Duda: 0 });
    await expect.element(screen.getByTestId('leva-over')).toMatchTextContent('Vitória de Ana!');
    await expect.element(screen.getByTestId('confirm-round')).toBeDisabled();

    await screen.getByTestId('finish-match').click();
    await screen.getByTestId('confirm-finish').click();
    await expectScreen(screen, 'winner');
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent('Ana');
    await expect.element(screen.getByTestId('podium')).toMatchTextContent('3 vidas');
  });

  it('rejects results adding up to more than the cards', async () => {
    const screen = await open();
    await screen.getByTestId('game-option').filter({ hasText: 'LEVA' }).click();
    for (const name of ['Ana', 'Bia']) {
      await screen.getByTestId('player-name-input').fill(name);
      await screen.getByTestId('add-player').click();
      await expect.element(screen.getByTestId('player-name-input')).toHaveValue('');
    }
    await screen.getByTestId('start-match').click();
    await guess(screen, 1, { Ana: 1, Bia: 1 });
    await screen.getByTestId('leva-step').click();
    await tap(screen, 'Ana: levou Levou');
    await tap(screen, 'Bia: levou Levou');
    await screen.getByTestId('confirm-round').click();
    await expect
      .element(screen.getByText('Foram levadas 2 voltas, mas a rodada tem 1 carta.'))
      .toBeVisible();
  });
});
