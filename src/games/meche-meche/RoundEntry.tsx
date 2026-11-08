/**
 * MECHE-MECHE round entry (spec 005 FR-012–FR-014, research D4): per player,
 * one button per score on offer, "—" for no score, and a +10 toggle. A score
 * taken by another player is disabled and struck through. Controlled from
 * `value` (`{ scores, bonus }`); anything else renders as an empty round
 * (spec 003 round-entry contract). The shell's 3D buttons and tokens only.
 */
import type { RoundEntryProps } from '../../shell/game/contract';
import { scoresOnOffer } from './rules';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The draft as far as it can be read; unreadable parts count as empty. */
function read(value: unknown): { scores: Record<string, number>; bonus: string[] } {
  const scores: Record<string, number> = {};
  const bonus: string[] = [];
  if (isRecord(value)) {
    if (isRecord(value.scores)) {
      for (const [id, score] of Object.entries(value.scores)) {
        if (typeof score === 'number') {
          scores[id] = score;
        }
      }
    }
    const raw: unknown = value.bonus;
    if (Array.isArray(raw)) {
      const items: readonly unknown[] = raw;
      bonus.push(...items.filter((id): id is string => typeof id === 'string'));
    }
  }
  return { scores, bonus };
}

export default function RoundEntry({ players, value, onChange }: RoundEntryProps) {
  const { scores, bonus } = read(value);
  const offer = scoresOnOffer(players.length);
  const nameOf = new Map(players.map((player) => [player.id, player.name]));
  const holderOf = new Map(Object.entries(scores).map(([id, score]) => [score, id]));

  const setScore = (id: string, score: number | null) => {
    const next = { ...scores };
    if (score === null) {
      delete next[id];
    } else {
      next[id] = score;
    }
    onChange({ scores: next, bonus });
  };

  return (
    <div className="flex flex-col gap-3">
      {players.map((player) => {
        const mine = scores[player.id];
        const hasBonus = bonus.includes(player.id);
        return (
          <div
            key={player.id}
            className="flex flex-col gap-2 rounded-control bg-surface-sunken p-2"
          >
            <div className="flex items-center gap-2 pl-1">
              <span className="min-w-0 flex-1 truncate text-lg font-bold" title={player.name}>
                {player.name}
              </span>
              <button
                type="button"
                aria-pressed={hasBonus}
                aria-label={`Bônus de +10 para ${player.name}`}
                onClick={() =>
                  onChange({
                    scores,
                    bonus: hasBonus
                      ? bonus.filter((id) => id !== player.id)
                      : [...bonus, player.id],
                  })
                }
                className={`btn-3d px-3 ${hasBonus ? 'btn-yellow' : 'btn-plain'}`}
              >
                +10
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {offer.map((score) => {
                const holder = holderOf.get(score);
                const takenBy = holder === player.id ? undefined : nameOf.get(holder ?? '');
                const isMine = mine === score;
                return (
                  <button
                    key={score}
                    type="button"
                    disabled={takenBy !== undefined}
                    aria-pressed={isMine}
                    aria-label={
                      takenBy === undefined
                        ? `${player.name}: ${score} pontos`
                        : `${player.name}: ${score} pontos, já é de ${takenBy}`
                    }
                    onClick={() => setScore(player.id, isMine ? null : score)}
                    className={`btn-3d px-0 ${isMine ? 'btn-blue' : 'btn-plain'} ${
                      takenBy === undefined ? '' : 'line-through'
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={mine === undefined}
                aria-label={`${player.name}: sem pontuação`}
                onClick={() => setScore(player.id, null)}
                className="btn-3d btn-plain px-0 text-ink-muted"
              >
                —
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
