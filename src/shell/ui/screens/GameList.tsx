/** No match yet: pick a game (FR-002). Every registry entry, in registry order. */
import type { Game } from '../../game/contract';
import { headings, labels } from '../copy';

interface GameListProps {
  readonly games: readonly Game[];
  readonly onPick: (gameId: string) => void;
}

export function GameList({ games, onPick }: GameListProps) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-display font-semibold">{headings.gameList}</h1>
      {games.length === 0 ? (
        <p className="rounded-card bg-surface-raised p-4 text-ink-muted">{labels.noGames}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {games.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                data-testid="game-option"
                onClick={() => onPick(game.id)}
                className="flex min-h-16 w-full items-center rounded-card border border-line/60 bg-surface-raised px-5 text-left text-lg font-semibold"
              >
                {game.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
