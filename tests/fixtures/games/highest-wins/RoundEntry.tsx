/**
 * Round entry of the fixture game `highest-wins`: each player picks a place,
 * 1..n. A controlled editor of `{ ranks: Record<playerId, number> }`
 * (specs/003-shell-screens/contracts/round-entry.md).
 */
import type { RoundEntryProps } from '../../../../src/shell/game/contract';

function readRanks(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || !('ranks' in value)) {
    return {};
  }
  const { ranks } = value;
  return typeof ranks === 'object' && ranks !== null ? { ...ranks } : {};
}

export default function RoundEntry({ players, value, onChange, reasons }: RoundEntryProps) {
  const ranks = readRanks(value);
  const places = players.map((_, index) => index + 1);

  return (
    <div className="flex flex-col gap-3">
      {players.map((player) => (
        <fieldset key={player.id} className="flex flex-col gap-1">
          <legend className="truncate text-sm text-ink-muted" title={player.name}>
            Colocação de {player.name}
          </legend>
          <div className="flex gap-2">
            {places.map((place) => {
              const selected = ranks[player.id] === place;
              return (
                <button
                  key={place}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${player.name}: ${place}º lugar`}
                  onClick={() => onChange({ ranks: { ...ranks, [player.id]: place } })}
                  className={`min-h-11 min-w-11 flex-1 rounded-control border text-base font-semibold ${
                    selected
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-line bg-surface-raised text-ink'
                  }`}
                >
                  {place}º
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {reasons.length > 0 && <span className="sr-only">{reasons.length} problema(s)</span>}
    </div>
  );
}
