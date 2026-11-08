/** No match yet: pick a game (FR-002). Every registry entry, in registry order. */
import type { Game } from '../../game/contract';
import { headings, labels } from '../copy';
import { PlayIcon, TrophyIcon } from '../parts/icons';

interface GameListProps {
  readonly games: readonly Game[];
  readonly onPick: (gameId: string) => void;
}

/** Badge colors cycle by position in the list, never by game (Principle II). */
const BADGES = ['bg-orange', 'bg-purple', 'bg-blue', 'bg-green'] as const;

export function GameList({ games, onPick }: GameListProps) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-display font-extrabold">{headings.gameList}</h1>
      {games.length === 0 ? (
        <p className="card-3d p-5 text-lg font-semibold text-ink-muted">{labels.noGames}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {games.map((game, index) => (
            <li key={game.id}>
              <button
                type="button"
                data-testid="game-option"
                onClick={() => onPick(game.id)}
                className="card-3d flex min-h-20 w-full items-center gap-4 px-4 py-3 text-left transition-transform active:translate-y-1"
              >
                <span
                  className={`flex size-13 shrink-0 items-center justify-center rounded-control text-on-color ${BADGES[index % BADGES.length] ?? 'bg-blue'}`}
                >
                  <TrophyIcon />
                </span>
                <span className="min-w-0 flex-1 truncate text-xl font-extrabold">{game.name}</span>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-green text-on-color shadow-[inset_0_-3px_0_var(--color-green-edge)]">
                  <PlayIcon />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
