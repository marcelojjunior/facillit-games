/**
 * Spec 007, game contract revision 4 (contracts/game-contract-rev4.md), shell
 * side: the round entry receives the rounds before the one it edits, and the
 * standings show a game's unit ("pts" without one).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import * as lowestRules from '../../../tests/fixtures/games/lowest-wins/rules';
import { createRegistry } from '../../games/registry';
import { defineGame, type GameDefinition, type RoundEntryProps } from '../game/contract';
import { serializeState, STORAGE_KEY } from '../match/persistence';
import type { Match } from '../match/types';
import { fixRoundCopy } from './copy';
import MatchApp from './MatchApp';

const ANA = { id: 'p-ana', name: 'Ana' };
const BIA = { id: 'p-bia', name: 'Bia' };

/** Shows how many earlier rounds it was given. */
function SeenRounds({ rounds }: RoundEntryProps) {
  return <p data-testid="seen-rounds">{rounds.length}</p>;
}

function game(extra: Partial<GameDefinition<lowestRules.PointsRound>> = {}) {
  return defineGame({
    id: 'rev-four',
    name: 'Rev Four',
    minPlayers: 2,
    maxPlayers: 4,
    validateRound: lowestRules.validateRound,
    scoreRound: lowestRules.scoreRound,
    computeTotals: lowestRules.computeTotals,
    resolveWinners: lowestRules.resolveWinners,
    RoundEntry: SeenRounds,
    ...extra,
  });
}

function seed(points: readonly number[][]): void {
  const match: Match = {
    gameId: 'rev-four',
    status: 'in_progress',
    players: [ANA, BIA],
    rounds: points.map(([ana, bia]) => ({ points: { [ANA.id]: ana, [BIA.id]: bia } })),
  };
  localStorage.setItem(STORAGE_KEY, serializeState(match));
}

function badge(screen: RenderResult, name: string) {
  return screen
    .getByTestId('standings')
    .getByTestId('standing-row')
    .filter({ hasText: name })
    .getByTestId('points');
}

beforeEach(() => {
  localStorage.clear();
});

describe('rounds given to the entry (FR-002)', () => {
  it('gives the next round every confirmed round', async () => {
    seed([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const screen = await render(<MatchApp registry={createRegistry([game()])} />);
    await expect
      .element(screen.getByTestId('round-entry').getByTestId('seen-rounds'))
      .toHaveTextContent('3');
  });

  it('gives a fixed round only the rounds before it', async () => {
    seed([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const screen = await render(<MatchApp registry={createRegistry([game()])} />);
    await screen.getByTestId('open-history').click();
    await screen.getByTestId('history-round').nth(1).click();
    await expect.element(screen.getByText(fixRoundCopy(2))).toBeVisible();
    await expect
      .element(screen.getByRole('dialog').getByTestId('seen-rounds'))
      .toHaveTextContent('1');
  });
});

describe('unit of totals (FR-003)', () => {
  it('shows the game unit, singular for 1', async () => {
    seed([[1, 5]]);
    const unit = { one: 'vida', other: 'vidas' };
    const screen = await render(<MatchApp registry={createRegistry([game({ unit })])} />);
    await expect.element(badge(screen, 'Ana')).toHaveTextContent('1 vida');
    await expect.element(badge(screen, 'Bia')).toHaveTextContent('5 vidas');
  });

  it('shows "pts" for a game without a unit', async () => {
    seed([[1, 5]]);
    const screen = await render(<MatchApp registry={createRegistry([game()])} />);
    await expect.element(badge(screen, 'Bia')).toHaveTextContent('5 pts');
  });
});
