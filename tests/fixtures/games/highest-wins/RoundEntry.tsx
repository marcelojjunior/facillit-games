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
                  // The shell's 3D buttons (spec 004 contracts/ui-parts.md); selected = blue.
                  className={`btn-3d flex-1 px-0 ${selected ? 'btn-blue' : 'btn-plain'}`}
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
