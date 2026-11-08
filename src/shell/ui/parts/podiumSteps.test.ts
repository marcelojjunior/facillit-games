import { describe, expect, it } from 'vitest';

import { podiumSteps } from './podiumSteps';

/** Every row of the podium table in specs/004-game-style-ui/data-model.md. */
const A = { id: 'a', name: 'Ana' };
const B = { id: 'b', name: 'Bruno' };
const C = { id: 'c', name: 'Carla' };
const D = { id: 'd', name: 'Davi' };

const names = (steps: ReturnType<typeof podiumSteps>) =>
  steps.map((step) => [step.position, step.players.map((player) => player.name)]);

describe('podiumSteps (spec 004 research D6)', () => {
  it('1, 2, 3, 4 → three steps; the 4th stays off the podium', () => {
    expect(names(podiumSteps([A, B, C, D], { a: 1, b: 2, c: 3, d: 4 }))).toEqual([
      [1, ['Ana']],
      [2, ['Bruno']],
      [3, ['Carla']],
    ]);
  });

  it('1, 1, 3 → the tie shares the top step; no second step', () => {
    expect(names(podiumSteps([A, B, C], { a: 1, b: 1, c: 3 }))).toEqual([
      [1, ['Ana', 'Bruno']],
      [3, ['Carla']],
    ]);
  });

  it('1, 2, 2 → the second step holds both', () => {
    expect(names(podiumSteps([A, B, C], { a: 1, b: 2, c: 2 }))).toEqual([
      [1, ['Ana']],
      [2, ['Bruno', 'Carla']],
    ]);
  });

  it('two players tied → one step', () => {
    expect(names(podiumSteps([A, B], { a: 1, b: 1 }))).toEqual([[1, ['Ana', 'Bruno']]]);
  });

  it('two players → two steps', () => {
    expect(names(podiumSteps([A, B], { a: 1, b: 2 }))).toEqual([
      [1, ['Ana']],
      [2, ['Bruno']],
    ]);
  });

  it('keeps roster order inside a step, whatever the positions object order', () => {
    expect(names(podiumSteps([A, B], { b: 1, a: 1 }))).toEqual([[1, ['Ana', 'Bruno']]]);
  });
});
