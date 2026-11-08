import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { RoundEntryHarness, submitControls } from '../round-entry-harness';
import highestWins from '.';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bruno' },
];
const { RoundEntry } = highestWins;

describe('highest-wins RoundEntry (contracts/round-entry.md)', () => {
  it('renders an empty value with nothing selected', async () => {
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={players} emitted={[]} />,
    );
    const pressed = screen.container.querySelectorAll('[aria-pressed="true"]');
    expect(pressed).toHaveLength(0);
    expect(submitControls(screen.container)).toEqual([]);
  });

  it('renders a valid value', async () => {
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={players}
        initial={{ ranks: { a: 2, b: 1 } }}
        emitted={[]}
      />,
    );
    await expect
      .element(screen.getByRole('button', { name: 'Ana: 2º lugar', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it.each([42, { ranks: 'x' }, null, 'texto', [1, 2]])(
    'renders garbage %j as an empty entry, without throwing',
    async (garbage) => {
      const screen = await render(
        <RoundEntryHarness Entry={RoundEntry} players={players} initial={garbage} emitted={[]} />,
      );
      await expect.element(screen.getByText('Colocação de Ana')).toBeVisible();
      expect(screen.container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    },
  );

  it('emits a value the game accepts after a normal interaction', async () => {
    const emitted: unknown[] = [];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={players} emitted={emitted} />,
    );
    await screen.getByRole('button', { name: 'Ana: 1º lugar', exact: true }).click();
    await screen.getByRole('button', { name: 'Bruno: 2º lugar', exact: true }).click();

    expect(highestWins.validateRound(emitted.at(-1), players)).toEqual({ ok: true });
    expect(JSON.parse(JSON.stringify(emitted.at(-1)))).toEqual(emitted.at(-1));
  });
});
