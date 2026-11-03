/**
 * The game registry — the only file allowed to name or compare games
 * (constitution Principle II, research D8).
 *
 * Adding a game: create `src/games/<id>/` with `index.ts`, `rules.ts`, and
 * `rules.test.ts`, then add one import and one entry to the array below.
 * Nothing else changes (SC-001).
 */
import type { Game, Registry } from '../shell/game/contract';

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

// ponytail: empty on purpose; MECHE-MECHE arrives in Phase 5 (specs/002, research D8).
export const registry: Registry = createRegistry([]);
