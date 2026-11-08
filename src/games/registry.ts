/**
 * The game registry — the only file allowed to name or compare games
 * (constitution Principle II, research D8).
 *
 * Adding a game: create `src/games/<id>/` with `index.ts`, `rules.ts`,
 * `rules.test.ts`, `RoundEntry.tsx`, and its browser test (MECHE-MECHE is the
 * reference), then add one import and one entry to the array below. Nothing
 * else changes (spec 002 SC-001).
 */
import type { Game, Registry } from '../shell/game/contract';
import mecheMeche from './meche-meche';

export function createRegistry(games: readonly Game[]): Registry {
  const byId = new Map<string, Game>();

  for (const game of games) {
    if (byId.has(game.id)) {
      throw new Error(`Two games share the id "${game.id}".`);
    }
    byId.set(game.id, game);
  }

  const list = [...games];

  return {
    list: () => list,
    get: (id) => byId.get(id),
  };
}

export const registry: Registry = createRegistry([mecheMeche]);
