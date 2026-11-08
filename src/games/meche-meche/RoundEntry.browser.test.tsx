/**
 * MECHE-MECHE round entry (spec 005 FR-002, FR-012, FR-014, research D4; the
 * round-entry contract of spec 003, rule 7).
 */
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import {
  RoundEntryHarness,
  submitControls,
} from '../../../tests/fixtures/games/round-entry-harness';
import mecheMeche from '.';

const names = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fabi', 'Gil'];
const seven = names.map((name) => ({ id: `p-${name}`, name }));
const { RoundEntry } = mecheMeche;

function pressed(root: HTMLElement): string[] {
  return [...root.querySelectorAll('button[aria-pressed="true"]')].map(
    (button) => button.getAttribute('aria-label') ?? '',
  );
}

/** Everything pressed except the "no score" buttons, which start pressed. */
function chosen(root: HTMLElement): string[] {
  return pressed(root).filter((label) => !label.endsWith('sem pontuação'));
}

describe('MECHE-MECHE RoundEntry', () => {
  it('renders an empty round: every player with no score and no bonus', async () => {
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={seven} emitted={[]} />,
    );
    expect(chosen(screen.container)).toEqual([]);
    expect(pressed(screen.container)).toHaveLength(7);
    expect(submitControls(screen.container)).toEqual([]);
  });

  it('renders a valid value', async () => {
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={seven}
        initial={{ scores: { 'p-Ana': 70 }, bonus: ['p-Ana'] }}
        emitted={[]}
      />,
    );
    expect(chosen(screen.container).sort()).toEqual(['Ana: 70 pontos', 'Bônus de +10 para Ana']);
  });

  it.each([42, null, 'texto', [], { scores: 'x' }, { bonus: 5 }, { scores: { 'p-Ana': 'x' } }])(
    'renders garbage %j as an empty round, without throwing',
    async (garbage) => {
      const screen = await render(
        <RoundEntryHarness Entry={RoundEntry} players={seven} initial={garbage} emitted={[]} />,
      );
      await expect.element(screen.getByText('Ana', { exact: true })).toBeVisible();
      expect(chosen(screen.container)).toEqual([]);
    },
  );

  it('emits a round the rules accept after a normal interaction', async () => {
    const emitted: unknown[] = [];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={seven} emitted={emitted} />,
    );
    await screen.getByRole('button', { name: 'Ana: 70 pontos', exact: true }).click();
    await screen.getByRole('button', { name: 'Bia: 60 pontos', exact: true }).click();
    await screen.getByRole('button', { name: 'Bônus de +10 para Caio', exact: true }).click();

    const last = emitted.at(-1);
    expect(last).toEqual({ scores: { 'p-Ana': 70, 'p-Bia': 60 }, bonus: ['p-Caio'] });
    expect(mecheMeche.validateRound(last, seven)).toEqual({ ok: true });
  });

  it('shows a taken score as taken for the others, and frees it when given up', async () => {
    const emitted: unknown[] = [];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={seven} emitted={emitted} />,
    );
    await screen.getByRole('button', { name: 'Ana: 70 pontos', exact: true }).click();
    await expect
      .element(screen.getByRole('button', { name: 'Bia: 70 pontos, já é de Ana', exact: true }))
      .toBeDisabled();

    // Re-tapping her own score clears it.
    await screen.getByRole('button', { name: 'Ana: 70 pontos', exact: true }).click();
    expect(emitted.at(-1)).toEqual({ scores: {}, bonus: [] });
    await expect
      .element(screen.getByRole('button', { name: 'Bia: 70 pontos', exact: true }))
      .toBeEnabled();
  });

  it('"—" clears a score; the bonus toggles off again', async () => {
    const emitted: unknown[] = [];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={seven} emitted={emitted} />,
    );
    await screen.getByRole('button', { name: 'Bia: 60 pontos', exact: true }).click();
    await screen.getByRole('button', { name: 'Bia: sem pontuação', exact: true }).click();
    await screen.getByRole('button', { name: 'Bônus de +10 para Bia', exact: true }).click();
    await screen.getByRole('button', { name: 'Bônus de +10 para Bia', exact: true }).click();
    expect(emitted.at(-1)).toEqual({ scores: {}, bonus: [] });
  });

  it('fits 7 players at 360 px: no sideways scroll, every target ≥ 44×44 (FR-014)', async () => {
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={seven} emitted={[]} />,
    );
    await expect.element(screen.getByText('Gil', { exact: true })).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const small = [...screen.container.querySelectorAll('button')]
      .map((button) => button.getBoundingClientRect())
      .filter((box) => box.width < 43.5 || box.height < 43.5);
    expect(small).toEqual([]);
  });
});
