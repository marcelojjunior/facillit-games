import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { RoundEntryHarness, submitControls } from '../round-entry-harness';
import lowestWins from '.';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bruno' },
  { id: 'c', name: 'Carla' },
];
const { RoundEntry } = lowestWins;

function inputValues(root: HTMLElement): string[] {
  return [...root.querySelectorAll('input')].map((input) => input.value);
}

describe('lowest-wins RoundEntry (contracts/round-entry.md)', () => {
  it('renders an empty value with empty inputs', async () => {
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={players} emitted={[]} />,
    );
    expect(inputValues(screen.container)).toEqual(['', '', '']);
    expect(submitControls(screen.container)).toEqual([]);
  });

  it('renders a valid value', async () => {
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={players}
        initial={{ points: { a: -3, b: 0, c: 12 } }}
        emitted={[]}
      />,
    );
    expect(inputValues(screen.container)).toEqual(['-3', '0', '12']);
  });

  it.each([42, { points: 'x' }, null, 'texto', [1, 2]])(
    'renders garbage %j as an empty entry, without throwing',
    async (garbage) => {
      const screen = await render(
        <RoundEntryHarness Entry={RoundEntry} players={players} initial={garbage} emitted={[]} />,
      );
      await expect.element(screen.getByLabelText('Ana', { exact: true })).toBeVisible();
      expect(inputValues(screen.container)).toEqual(['', '', '']);
    },
  );

  it('keeps a partial "-" while typing a negative number', async () => {
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={players} emitted={[]} />,
    );
    await screen.getByLabelText('Ana', { exact: true }).fill('-');
    await expect.element(screen.getByLabelText('Ana', { exact: true })).toHaveValue('-');
  });

  it('emits a value the game accepts after a normal interaction', async () => {
    const emitted: unknown[] = [];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={players} emitted={emitted} />,
    );
    await screen.getByLabelText('Ana', { exact: true }).fill('-5');
    await screen.getByLabelText('Bruno', { exact: true }).fill('0');
    await screen.getByLabelText('Carla', { exact: true }).fill('17');

    expect(lowestWins.validateRound(emitted.at(-1), players)).toEqual({ ok: true });
    expect(JSON.parse(JSON.stringify(emitted.at(-1)))).toEqual(emitted.at(-1));
  });
});
