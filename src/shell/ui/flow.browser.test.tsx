/**
 * US1 — play a full match on one phone (SC-001, spec 003 US1 scenarios 1–9
 * and Edge Cases). Renders the real app with the test-only games, at 360×640,
 * over the browser's own localStorage.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import { highestWins, lowestWins, testRegistry } from '../../../tests/fixtures/games/registry';
import { createRegistry } from '../../games/registry';
import type { Game } from '../game/contract';
import { STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import { errorCopy, headings, labels, missingPlayersCopy, roundCopy } from './copy';
import MatchApp from './MatchApp';

type Screen = RenderResult;

beforeEach(() => {
  localStorage.clear();
});

function storedMatch(): Match {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    throw new Error('Nothing stored.');
  }
  const { match } = JSON.parse(raw) as { match: Match };
  return match;
}

async function openApp(): Promise<Screen> {
  return render(<MatchApp registry={testRegistry} />);
}

async function expectScreen(screen: Screen, name: string): Promise<void> {
  await expect.element(screen.getByTestId('match-app')).toHaveAttribute('data-screen', name);
}

async function pickGame(screen: Screen, game: Game): Promise<void> {
  await screen.getByTestId('game-option').filter({ hasText: game.name }).click();
  await expectScreen(screen, 'setup');
}

async function addPlayers(screen: Screen, names: readonly string[]): Promise<void> {
  for (const name of names) {
    await screen.getByTestId('player-name-input').fill(name);
    await screen.getByTestId('add-player').click();
    await expect.element(screen.getByTestId('player-name-input')).toHaveValue('');
  }
}

async function startMatch(screen: Screen, game: Game, names: readonly string[]): Promise<void> {
  await pickGame(screen, game);
  await addPlayers(screen, names);
  await screen.getByTestId('start-match').click();
  await expectScreen(screen, 'in-progress');
}

/** One round of `highest-wins`: a place per player. */
async function enterPlaces(screen: Screen, places: Readonly<Record<string, number>>) {
  for (const [name, place] of Object.entries(places)) {
    await screen.getByRole('button', { name: `${name}: ${place}º lugar`, exact: true }).click();
  }
}

/** One round of `lowest-wins`: points per player. */
async function enterPoints(screen: Screen, points: Readonly<Record<string, number>>) {
  for (const [name, value] of Object.entries(points)) {
    await screen.getByLabelText(name, { exact: true }).fill(String(value));
  }
}

async function confirmRound(screen: Screen, nextRound: number): Promise<void> {
  await screen.getByTestId('confirm-round').click();
  await expect.element(screen.getByText(roundCopy(nextRound), { exact: true })).toBeVisible();
}

async function finishMatch(screen: Screen): Promise<void> {
  await screen.getByTestId('finish-match').click();
  await screen.getByTestId('confirm-finish').click();
  await expectScreen(screen, 'winner');
}

/** The winner screen shows what the game's own rules compute. */
async function expectResultMatchesRules(screen: Screen, game: Game): Promise<void> {
  const match = storedMatch();
  const evaluation = game.evaluate(match.rounds, match.players);
  if (!evaluation.ok) {
    throw new Error('Stored rounds do not evaluate.');
  }
  for (const player of match.players) {
    const row = screen.getByTestId('standing-row').filter({ hasText: player.name });
    await expect
      .element(row)
      .toMatchTextContent(new RegExp(`${evaluation.totals[player.id]} pts$`));
  }
  for (const id of evaluation.winners) {
    const winner = match.players.find((player) => player.id === id);
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent(winner?.name ?? '');
  }
}

const FOUR = ['Ana', 'Bruno', 'Carla', 'Davi'] as const;

describe('game list (FR-002)', () => {
  it('lists every game in registry order', async () => {
    const screen = await openApp();
    await expectScreen(screen, 'game-list');
    await expect.element(screen.getByText(headings.gameList)).toBeVisible();
    const names = screen
      .getByTestId('game-option')
      .elements()
      .map((element) => element.textContent);
    expect(names).toEqual([highestWins.name, lowestWins.name]);
  });

  it('says no game is available when the registry is empty', async () => {
    const screen = await render(<MatchApp registry={createRegistry([])} />);
    await expect.element(screen.getByText(labels.noGames)).toBeVisible();
    expect(screen.getByTestId('game-option').elements()).toHaveLength(0);
  });
});

describe('setup (FR-003)', () => {
  it('rejects a duplicate name, ignoring case', async () => {
    const screen = await openApp();
    await pickGame(screen, highestWins);
    await addPlayers(screen, ['Ana']);
    await screen.getByTestId('player-name-input').fill('ana');
    await screen.getByTestId('add-player').click();
    await expect.element(screen.getByText(errorCopy.duplicate_name)).toBeVisible();
    expect(storedMatch().players).toHaveLength(1);
  });

  it('blocks start below the minimum and says how many are missing', async () => {
    const screen = await openApp();
    await pickGame(screen, lowestWins); // min 3
    await addPlayers(screen, ['Ana', 'Bruno']);
    await expect.element(screen.getByTestId('start-match')).toBeDisabled();
    await expect.element(screen.getByText(missingPlayersCopy(1))).toBeVisible();
  });

  it('blocks adding at the maximum and says the roster is full', async () => {
    const screen = await openApp();
    await pickGame(screen, highestWins); // max 4
    await addPlayers(screen, FOUR);
    await expect.element(screen.getByTestId('add-player')).toBeDisabled();
    await expect.element(screen.getByText(errorCopy.roster_full)).toBeVisible();
    await expect.element(screen.getByTestId('start-match')).toBeEnabled();
  });

  it('keeps a 30-character name inside the screen, full text in title', async () => {
    const long = 'Maria Eduarda Albuquerque Silv';
    expect(long).toHaveLength(30);
    const screen = await openApp();
    await startMatch(screen, highestWins, [long, 'Bruno']);
    await expect.element(screen.getByTitle(long).first()).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });
});

describe('a full match (SC-001)', () => {
  it('highest-wins: 4 players × 5 rounds ends on the rules-computed winner', async () => {
    const screen = await openApp();
    await startMatch(screen, highestWins, FOUR);
    await expect.element(screen.getByText(roundCopy(1), { exact: true })).toBeVisible();

    for (let round = 1; round <= 5; round++) {
      const last = round === 5;
      await enterPlaces(screen, {
        Ana: last ? 2 : 1,
        Bruno: last ? 1 : 2,
        Carla: 3,
        Davi: 4,
      });
      await confirmRound(screen, round + 1);
    }

    await finishMatch(screen);
    await expectResultMatchesRules(screen, highestWins);
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent('Ana');
    await expect.element(screen.getByTestId('winner-names')).not.toMatchTextContent('Bruno');
  });

  it('lowest-wins: 4 players × 5 rounds, negative total shown with its sign', async () => {
    const screen = await openApp();
    await startMatch(screen, lowestWins, FOUR);

    for (let round = 1; round <= 5; round++) {
      await enterPoints(screen, { Ana: -5, Bruno: 10, Carla: 3, Davi: 0 });
      await confirmRound(screen, round + 1);
    }

    const ana = screen.getByTestId('standing-row').filter({ hasText: 'Ana' });
    await expect.element(ana).toMatchTextContent(/-25 pts$/);

    await finishMatch(screen);
    await expectResultMatchesRules(screen, lowestWins);
    await expect.element(screen.getByTestId('winner-names')).toMatchTextContent('Ana');
  });
});

describe('in progress (FR-004, FR-005)', () => {
  it('shows every game reason on an invalid confirm and keeps the draft', async () => {
    const screen = await openApp();
    await startMatch(screen, highestWins, ['Ana', 'Bruno']);
    await enterPlaces(screen, { Ana: 1 });
    await screen.getByTestId('confirm-round').click();

    await expect.element(screen.getByText('Falta a colocação de Bruno.')).toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Ana: 1º lugar', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect.element(screen.getByText(roundCopy(1), { exact: true })).toBeVisible();
    expect(storedMatch().rounds).toHaveLength(0);
  });

  it('offers no way to add or remove players', async () => {
    const screen = await openApp();
    await startMatch(screen, highestWins, ['Ana', 'Bruno']);
    expect(screen.getByTestId('add-player').elements()).toHaveLength(0);
    expect(screen.getByTestId('player-name-input').elements()).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: `${labels.remove} Ana`, exact: true }).elements(),
    ).toHaveLength(0);
  });

  it('shows the full table before finishing and lets the group keep playing', async () => {
    const screen = await openApp();
    await startMatch(screen, highestWins, ['Ana', 'Bruno']);
    await enterPlaces(screen, { Ana: 1, Bruno: 2 });
    await confirmRound(screen, 2);

    await screen.getByTestId('finish-match').click();
    await expect.element(screen.getByText(headings.finish)).toBeVisible();
    await expect.element(screen.getByRole('dialog').getByText('Ana')).toBeVisible();
    await screen.getByRole('button', { name: labels.keepPlaying, exact: true }).click();
    await expectScreen(screen, 'in-progress');
  });
});

describe('winner (FR-007)', () => {
  it('names every tied player as a shared win', async () => {
    const screen = await openApp();
    await startMatch(screen, highestWins, ['Ana', 'Bruno', 'Carla']);
    await enterPlaces(screen, { Ana: 1, Bruno: 1, Carla: 3 });
    await confirmRound(screen, 2);
    await finishMatch(screen);

    const names = screen.getByTestId('winner-names');
    await expect.element(names).toMatchTextContent(labels.sharedWin);
    await expect.element(names).toMatchTextContent('Ana');
    await expect.element(names).toMatchTextContent('Bruno');
    await expect.element(names).not.toMatchTextContent('Carla');
    await expectResultMatchesRules(screen, highestWins);
  });

  it('treats a match finished with zero rounds as everyone tied', async () => {
    const screen = await openApp();
    await startMatch(screen, highestWins, ['Ana', 'Bruno']);
    await finishMatch(screen);
    await expect.element(screen.getByText(headings.tie)).toBeVisible();
  });
});
