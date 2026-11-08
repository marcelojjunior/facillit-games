/**
 * US3 — a wrong round can be fixed (spec 003 US3 scenarios 1–4, FR-004a,
 * FR-005, FR-008, Edge Cases: rename during the match).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { lowestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import { errorCopy, fixRoundCopy, headings, labels } from './copy';
import MatchApp from './MatchApp';

const ANA = { id: 'p-ana', name: 'Ana' };
const BRUNO = { id: 'p-bruno', name: 'Bruno' };
const CARLA = { id: 'p-carla', name: 'Carla' };

function round(ana: number, bruno: number, carla: number) {
  return { points: { [ANA.id]: ana, [BRUNO.id]: bruno, [CARLA.id]: carla } };
}

function seed(rounds: unknown[], draft?: unknown): void {
  const match: Match = {
    gameId: lowestWins.id,
    status: 'in_progress',
    players: [ANA, BRUNO, CARLA],
    rounds,
    ...(draft === undefined ? {} : { draft }),
  };
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function stored(): Match {
  const raw = localStorage.getItem(STORAGE_KEY);
  return (JSON.parse(raw ?? 'null') as { match: Match }).match;
}

function row(screen: RenderResult, name: string) {
  return screen.getByTestId('standings').getByTestId('standing-row').filter({ hasText: name });
}

async function openFix(screen: RenderResult, index: number): Promise<void> {
  await screen.getByTestId('open-history').click();
  await screen.getByTestId('history-round').nth(index).click();
  await expect.element(screen.getByText(fixRoundCopy(index + 1))).toBeVisible();
}

async function openMenuItem(screen: RenderResult, label: string): Promise<void> {
  await screen.getByRole('button', { name: labels.moreActions, exact: true }).click();
  await screen.getByRole('button', { name: label, exact: true }).click();
}

const ROUNDS = [round(1, 2, 3), round(4, 5, 6), round(7, 8, 9)];
const DRAFT = { points: { [ANA.id]: 99 } };

beforeEach(() => {
  localStorage.clear();
});

describe('fixing a confirmed round (US3 1, 2, 4)', () => {
  it('saving changes only that round and the totals, and keeps the draft', async () => {
    seed(ROUNDS, DRAFT);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await expect.element(row(screen, 'Ana')).toMatchTextContent(/12$/);

    await openFix(screen, 0);
    const sheet = screen.getByRole('dialog');
    await expect.element(sheet.getByLabelText('Ana', { exact: true })).toHaveValue('1');
    await sheet.getByLabelText('Ana', { exact: true }).fill('-10');
    await screen.getByTestId('save-fix').click();

    await expect.element(row(screen, 'Ana')).toMatchTextContent(/1$/);
    expect(stored().rounds).toEqual([round(-10, 2, 3), ROUNDS[1], ROUNDS[2]]);
    expect(stored().draft).toEqual(DRAFT);
    await expect
      .element(screen.getByTestId('round-entry').getByLabelText('Ana', { exact: true }))
      .toHaveValue('99');
  });

  it('an invalid fix shows the reasons and changes nothing', async () => {
    seed(ROUNDS, DRAFT);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await openFix(screen, 1);
    const sheet = screen.getByRole('dialog');
    await sheet.getByLabelText('Bruno', { exact: true }).fill('-');
    await screen.getByTestId('save-fix').click();

    await expect
      .element(sheet.getByText('Os pontos de Bruno precisam ser um número inteiro.'))
      .toBeVisible();
    expect(stored().rounds).toEqual(ROUNDS);
    // The draft's own entry shows no rejection: the reasons belong to the fix.
    expect(screen.getByTestId('confirm-round').element().parentElement?.textContent).not.toContain(
      labels.roundProblems,
    );
  });

  it('cancel changes nothing and keeps the draft', async () => {
    seed(ROUNDS, DRAFT);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await openFix(screen, 2);
    await screen.getByRole('dialog').getByLabelText('Carla', { exact: true }).fill('0');
    await screen.getByRole('button', { name: labels.cancel, exact: true }).click();

    expect(stored().rounds).toEqual(ROUNDS);
    expect(stored().draft).toEqual(DRAFT);
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('removing the last round (US3 3, FR-008)', () => {
  it('asks first; cancel keeps it, confirm removes it', async () => {
    seed(ROUNDS);
    const screen = await render(<MatchApp registry={testRegistry} />);

    await openMenuItem(screen, labels.removeLastRound);
    await expect.element(screen.getByText(headings.removeLastRound)).toBeVisible();
    await screen.getByRole('button', { name: labels.cancel, exact: true }).click();
    expect(stored().rounds).toHaveLength(3);

    await openMenuItem(screen, labels.removeLastRound);
    await screen.getByTestId('confirm-remove-last').click();
    await expect.element(row(screen, 'Ana')).toMatchTextContent(/5$/);
    expect(stored().rounds).toEqual(ROUNDS.slice(0, 2));
  });
});

describe('full history (FR-004a)', () => {
  it('opens at the latest round and keeps names visible', async () => {
    seed(Array.from({ length: 30 }, (_, index) => round(index, 1, 2)));
    const screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByTestId('open-history').click();

    const headers = screen.getByTestId('history-round');
    expect(headers.elements()).toHaveLength(30);
    await expect.element(headers.last()).toBeInViewport();
    const name = screen.getByRole('dialog').getByRole('rowheader', { name: 'Ana' });
    await expect.element(name).toBeInViewport();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it('every round header is a 44 px target', async () => {
    seed(ROUNDS);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await screen.getByTestId('open-history').click();
    for (const header of screen.getByTestId('history-round').elements()) {
      const box = header.getBoundingClientRect();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('renaming during the match (FR-005, Edge Cases)', () => {
  it('updates the name everywhere, including the winner screen', async () => {
    seed(ROUNDS);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await openMenuItem(screen, labels.renamePlayer);
    await screen.getByRole('dialog').getByRole('button', { name: 'Bruno', exact: true }).click();
    await screen.getByLabelText(labels.newName).fill('Beto');
    await screen.getByRole('button', { name: labels.save, exact: true }).click();

    await expect.element(row(screen, 'Beto')).toBeVisible();
    await screen.getByTestId('open-history').click();
    await expect
      .element(screen.getByRole('dialog').getByRole('rowheader', { name: 'Beto' }))
      .toBeVisible();
    await screen.getByRole('button', { name: labels.close, exact: true }).click();

    await screen.getByTestId('finish-match').click();
    await screen.getByTestId('confirm-finish').click();
    await expect.element(screen.getByTestId('standings')).toMatchTextContent('Beto');
  });

  it('rejects a duplicate name, ignoring case, and changes nothing', async () => {
    seed(ROUNDS);
    const screen = await render(<MatchApp registry={testRegistry} />);
    await openMenuItem(screen, labels.renamePlayer);
    await screen.getByRole('dialog').getByRole('button', { name: 'Bruno', exact: true }).click();
    await screen.getByLabelText(labels.newName).fill('ana');
    await screen.getByRole('button', { name: labels.save, exact: true }).click();

    await expect
      .element(screen.getByRole('dialog').getByText(errorCopy.duplicate_name))
      .toBeVisible();
    expect(stored().players.map((player) => player.name)).toEqual(['Ana', 'Bruno', 'Carla']);
  });
});
