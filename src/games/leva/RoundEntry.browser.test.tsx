/**
 * LEVA round entry (spec 007 FR-014–FR-019, research D5–D7; the round-entry
 * contract of spec 003, rule 7; the round starter of spec 009 FR-006, FR-007).
 */
import { describe, expect, it } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';

import {
  RoundEntryHarness,
  submitControls,
} from '../../../tests/fixtures/games/round-entry-harness';
import leva from '.';
import { validateRound } from './rules';

const names = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fabi', 'Gil', 'Hugo', 'Iara', 'Juca'];
const ten = names.map((name) => ({ id: `p-${name}`, name }));
const three = ten.slice(0, 3);
const [ana, bia, caio] = three.map((player) => player.id) as [string, string, string];
const { RoundEntry } = leva;

const zeros = (ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, 0]));
const everyone = [ana, bia, caio];

function tap(screen: RenderResult, name: string) {
  return screen.getByRole('button', { name, exact: true }).click();
}

function playerNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="leva-player"] [title]')].map(
    (element) => element.textContent ?? '',
  );
}

/** The names of the rows that carry the "Começa" mark. */
function starterNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="leva-player"]')]
    .filter((row) => row.textContent?.includes('Começa'))
    .map((row) => row.querySelector('[title]')?.textContent ?? '');
}

describe('LEVA RoundEntry', () => {
  it('starts with 1 card, "Leva"/"Não leva", 5 lives each, and no submit', async () => {
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} emitted={[]} />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('1 carta');
    await expect.element(screen.getByRole('button', { name: 'Ana: palpite Leva' })).toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Ana: palpite Não leva' }))
      .toBeVisible();
    expect(screen.getByText('5 vidas').elements()).toHaveLength(3);
    expect(submitControls(screen.container)).toEqual([]);
  });

  it('deals one more card after rounds with nobody out, with buttons 0 to cards', async () => {
    const rounds = [
      { cards: 1, guesses: zeros(everyone), taken: zeros(everyone) },
      { cards: 2, guesses: zeros(everyone), taken: { ...zeros(everyone), [ana]: 1 } },
    ];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={rounds} emitted={[]} />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('3 cartas');
    for (const n of ['0', '1', '2', '3']) {
      await expect
        .element(screen.getByRole('button', { name: `Ana: palpite ${n}`, exact: true }))
        .toBeVisible();
    }
    expect(screen.getByRole('button', { name: 'Ana: palpite 4', exact: true }).elements()).toEqual(
      [],
    );
    await expect.element(screen.getByText('4 vidas')).toBeVisible();
  });

  it('shows only the players with lives left, and keeps counting cards', async () => {
    const out = { cards: 5, guesses: { ...zeros(everyone), [bia]: 5 }, taken: zeros(everyone) };
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={[out]} emitted={[]} />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('6 cartas');
    expect(playerNames(screen.container)).toEqual(['Ana', 'Caio']);
    expect(starterNames(screen.container)).toEqual(['Caio']);
  });

  it('takes the guesses, then the results with each guess shown, and goes back keeping them', async () => {
    const emitted: unknown[] = [];
    const rounds = [{ cards: 1, guesses: zeros(everyone), taken: zeros(everyone) }];
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={rounds} emitted={emitted} />,
    );
    await tap(screen, 'Ana: palpite 2');
    await tap(screen, 'Bia: palpite 0');
    expect(emitted.at(-1)).toEqual({
      cards: 2,
      step: 'guess',
      guesses: { [ana]: 2, [bia]: 0 },
      taken: {},
    });

    await screen.getByTestId('leva-step').click();
    await expect.element(screen.getByText('Palpite: 2')).toBeVisible();
    await tap(screen, 'Ana: levou 1');
    await screen.getByTestId('leva-step').click();
    await expect
      .element(screen.getByRole('button', { name: 'Ana: palpite 2', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(emitted.at(-1)).toEqual({
      cards: 2,
      step: 'guess',
      guesses: { [ana]: 2, [bia]: 0 },
      taken: { [ana]: 1 },
    });
  });

  it('reads the 1-card results as "Levou"/"Não levou"', async () => {
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={three}
        initial={{ cards: 1, step: 'taken', guesses: { [ana]: 1 }, taken: {} }}
        emitted={[]}
      />,
    );
    await expect.element(screen.getByText('Palpite: Leva')).toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Ana: levou Não levou' }))
      .toBeVisible();
  });

  it.each([42, null, 'texto', [], { cards: 'x' }, { guesses: 5 }])(
    'renders garbage %j as an empty guesses step, without throwing',
    async (garbage) => {
      const screen = await render(
        <RoundEntryHarness Entry={RoundEntry} players={three} initial={garbage} emitted={[]} />,
      );
      await expect.element(screen.getByText('Palpites')).toBeVisible();
      expect(screen.container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    },
  );

  it('corrects a stale draft at once: derived cards, out-of-range values dropped', async () => {
    const emitted: unknown[] = [];
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={three}
        initial={{ cards: 3, step: 'guess', guesses: { [ana]: 3, [bia]: 1 }, taken: {} }}
        emitted={emitted}
      />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('1 carta');
    await expect
      .poll(() => emitted.at(-1))
      .toEqual({
        cards: 1,
        step: 'guess',
        guesses: { [bia]: 1 },
        taken: {},
      });
  });

  it('says who won with one player left, offers nothing, and clears a draft', async () => {
    const emitted: unknown[] = [];
    const out = {
      cards: 5,
      guesses: { ...zeros(everyone), [bia]: 5, [caio]: 5 },
      taken: zeros(everyone),
    };
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={three}
        rounds={[out]}
        initial={{ cards: 1, step: 'guess', guesses: {}, taken: {} }}
        emitted={emitted}
      />,
    );
    await expect.element(screen.getByTestId('leva-over')).toMatchTextContent('Vitória de Ana!');
    expect(screen.container.querySelectorAll('button')).toHaveLength(0);
    await expect.poll(() => emitted).toEqual([undefined]);
  });

  it('says nobody is left when everyone is out', async () => {
    const out = { cards: 5, guesses: { [ana]: 5, [bia]: 5, [caio]: 5 }, taken: zeros(everyone) };
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={[out]} emitted={[]} />,
    );
    await expect.element(screen.getByTestId('leva-over')).toMatchTextContent('Ninguém sobrou.');
  });

  it("when fixing, shows the stored round's own cards and players on the results step", async () => {
    const emitted: unknown[] = [];
    const before = [{ cards: 1, guesses: zeros(everyone), taken: zeros(everyone) }];
    // Stored with 4 cards and two players, unlike what the rounds before imply.
    const stored = { cards: 4, guesses: { [ana]: 2, [caio]: 1 }, taken: { [ana]: 2, [caio]: 0 } };
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={three}
        rounds={before}
        initial={stored}
        emitted={emitted}
      />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('4 cartas');
    await expect.element(screen.getByText('Quantas levou')).toBeVisible();
    expect(playerNames(screen.container)).toEqual(['Ana', 'Caio']);
    expect(starterNames(screen.container)).toEqual(['Caio']);
    await tap(screen, 'Caio: levou 1');
    expect(emitted).toEqual([
      {
        cards: 4,
        step: 'taken',
        guesses: { [ana]: 2, [caio]: 1 },
        taken: { [ana]: 2, [caio]: 1 },
        fixing: [ana, caio],
      },
    ]);
    expect(validateRound(emitted[0], three)).toEqual({
      ok: true,
      round: { cards: 4, guesses: { [ana]: 2, [caio]: 1 }, taken: { [ana]: 2, [caio]: 1 } },
    });
  });

  it('fits 10 players and 5 cards at 360 px: no sideways scroll, every target ≥ 44×44 (FR-018)', async () => {
    const all = ten.map((player) => player.id);
    const rounds = [1, 2, 3, 4].map((cards) => ({ cards, guesses: zeros(all), taken: zeros(all) }));
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={ten} rounds={rounds} emitted={[]} />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('5 cartas');
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const small = [...screen.container.querySelectorAll('button')]
      .map((button) => button.getBoundingClientRect())
      .filter((box) => box.width < 43.5 || box.height < 43.5);
    expect(small).toEqual([]);
  });

  it('marks round 3\'s starter "Começa" in setup order, in both steps (spec 009)', async () => {
    const rounds = [1, 2].map((cards) => ({
      cards,
      guesses: zeros(everyone),
      taken: zeros(everyone),
    }));
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={rounds} emitted={[]} />,
    );
    expect(playerNames(screen.container)).toEqual(['Ana', 'Bia', 'Caio']);
    expect(starterNames(screen.container)).toEqual(['Caio']);
    await screen.getByTestId('leva-step').click();
    await expect.element(screen.getByText('Quantas levou')).toBeVisible();
    expect(playerNames(screen.container)).toEqual(['Ana', 'Bia', 'Caio']);
    expect(starterNames(screen.container)).toEqual(['Caio']);
  });

  it('keeps the mark on a reopened draft, and the draft in roster order (research D3)', async () => {
    const emitted: unknown[] = [];
    const rounds = [{ cards: 1, guesses: zeros(everyone), taken: zeros(everyone) }];
    const screen = await render(
      <RoundEntryHarness
        Entry={RoundEntry}
        players={three}
        rounds={rounds}
        initial={{ cards: 2, step: 'guess', guesses: { [caio]: 1 }, taken: {} }}
        emitted={emitted}
      />,
    );
    expect(playerNames(screen.container)).toEqual(['Ana', 'Bia', 'Caio']);
    expect(starterNames(screen.container)).toEqual(['Bia']);
    await tap(screen, 'Ana: palpite 2');
    expect(Object.keys((emitted.at(-1) as { guesses: object }).guesses)).toEqual([ana, caio]);
  });

  it('never marks a player who is out', async () => {
    // Ana starts round 1; Caio is out in it; Bia starts round 2.
    const out = { cards: 5, guesses: { ...zeros(everyone), [caio]: 5 }, taken: zeros(everyone) };
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={[out]} emitted={[]} />,
    );
    expect(playerNames(screen.container)).toEqual(['Ana', 'Bia']);
    expect(starterNames(screen.container)).toEqual(['Bia']);
  });

  it('keeps the mark beside 10 long names at 360 px, no sideways scroll (FR-006, SC-003)', async () => {
    const long = ten.map((player) => ({ ...player, name: `${player.name} da Silva Albuquerque` }));
    const all = long.map((player) => player.id);
    const rounds = [1, 2, 3, 4].map((cards) => ({ cards, guesses: zeros(all), taken: zeros(all) }));
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={long} rounds={rounds} emitted={[]} />,
    );
    const mark = screen.getByText('Começa', { exact: true });
    await expect.element(mark).toBeVisible();
    expect(starterNames(screen.container)).toEqual(['Edu da Silva Albuquerque']);
    const box = mark.element().getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it('reaches every value from 0 to 12 with taps', async () => {
    const rounds = Array.from({ length: 11 }, (_, index) => ({
      cards: index + 1,
      guesses: zeros(everyone),
      taken: zeros(everyone),
    }));
    const screen = await render(
      <RoundEntryHarness Entry={RoundEntry} players={three} rounds={rounds} emitted={[]} />,
    );
    await expect.element(screen.getByTestId('leva-cards')).toHaveTextContent('12 cartas');
    for (let n = 0; n <= 12; n += 1) {
      await expect
        .element(screen.getByRole('button', { name: `Ana: palpite ${n}`, exact: true }))
        .toBeVisible();
    }
  });
});
