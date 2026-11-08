/**
 * The round-entry seam carries any game shape (SC-006, FR-013, US6).
 *
 * A third game is declared right here: a different round shape (who won the
 * round, not places or points) and its own RoundEntry. It plays a full match
 * through the same MatchApp the fixture games use, with no shell file
 * touched; tests/shell-boundary.test.ts keeps proving the shell names no game.
 */
import { beforeEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { createRegistry } from '../src/games/registry';
import {
  defineGame,
  type GameDefinition,
  type RoundEntryProps,
  type RoundRejection,
} from '../src/shell/game/contract';
import { roundCopy } from '../src/shell/ui/copy';
import MatchApp from '../src/shell/ui/MatchApp';

interface WinnerRound {
  readonly winner: string;
}

const rejection: RoundRejection = { code: 'no_winner', message: 'Escolha quem venceu a rodada.' };

const validateRound: GameDefinition<WinnerRound>['validateRound'] = (input, players) => {
  if (typeof input === 'object' && input !== null && 'winner' in input) {
    const { winner } = input;
    if (typeof winner === 'string' && players.some((player) => player.id === winner)) {
      return { ok: true, round: { winner } };
    }
  }
  return { ok: false, reasons: [rejection] };
};

function RoundWinnerEntry({ players, value, onChange }: RoundEntryProps) {
  const winner =
    typeof value === 'object' && value !== null && 'winner' in value ? value.winner : undefined;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-ink-muted">Quem venceu a rodada?</legend>
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          aria-pressed={winner === player.id}
          onClick={() => onChange({ winner: player.id })}
          className="min-h-11 rounded-control border border-line text-ink aria-pressed:bg-accent aria-pressed:text-accent-ink"
        >
          {player.name}
        </button>
      ))}
    </fieldset>
  );
}

const roundWinner = defineGame<WinnerRound>({
  id: 'round-winner',
  name: 'Quem Vence a Rodada',
  minPlayers: 2,
  maxPlayers: 5,
  validateRound,
  scoreRound: (round, players) =>
    Object.fromEntries(players.map((player) => [player.id, player.id === round.winner ? 1 : 0])),
  computeTotals: (roundScores, players) =>
    Object.fromEntries(
      players.map((player) => [
        player.id,
        roundScores.reduce((sum, scores) => sum + (scores[player.id] ?? 0), 0),
      ]),
    ),
  resolveWinners: (totals, players) => {
    const best = Math.max(...players.map((player) => totals[player.id] ?? 0));
    return players.filter((player) => totals[player.id] === best).map((player) => player.id);
  },
  RoundEntry: RoundWinnerEntry,
});

beforeEach(() => {
  localStorage.clear();
});

it('a game with its own round shape plays a full match through the same screens', async () => {
  const screen = await render(<MatchApp registry={createRegistry([roundWinner])} />);

  await screen.getByTestId('game-option').click();
  for (const name of ['Ana', 'Bruno']) {
    await screen.getByTestId('player-name-input').fill(name);
    await screen.getByTestId('add-player').click();
  }
  await screen.getByTestId('start-match').click();
  await expect.element(screen.getByText('Quem venceu a rodada?')).toBeVisible();

  // Nothing chosen yet: the shell's confirm stays disabled.
  await expect.element(screen.getByTestId('confirm-round')).toBeDisabled();
  await screen.getByRole('button', { name: 'Ana', exact: true }).click();
  await screen.getByTestId('confirm-round').click();
  await expect.element(screen.getByText(roundCopy(2), { exact: true })).toBeVisible();

  for (const [round, name] of [
    [3, 'Ana'],
    [4, 'Bruno'],
  ] as const) {
    await screen.getByRole('button', { name, exact: true }).click();
    await screen.getByTestId('confirm-round').click();
    await expect.element(screen.getByText(roundCopy(round), { exact: true })).toBeVisible();
  }

  await screen.getByTestId('finish-match').click();
  await screen.getByTestId('confirm-finish').click();
  await expect.element(screen.getByTestId('winner-names')).toMatchTextContent('Ana');
  await expect.element(screen.getByTestId('winner-names')).not.toMatchTextContent('Bruno');
  await expect
    .element(screen.getByTestId('standing-row').filter({ hasText: 'Ana' }))
    .toMatchTextContent(/2 pts$/);
});
