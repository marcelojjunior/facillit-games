/**
 * Round entry of the fixture game `lowest-wins`: a free integer per player,
 * negatives allowed. A controlled editor of `{ points: Record<playerId,
 * number | string> }`: text that is not yet a whole number (e.g. "-") is kept
 * as a string so typing is never lost, and validateRound rejects it with the
 * game's own message (specs/003-shell-screens/contracts/round-entry.md).
 */
import { useId } from 'react';

import type { RoundEntryProps } from '../../../../src/shell/game/contract';

const WHOLE_NUMBER = /^-?\d+$/;

function readPoints(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || !('points' in value)) {
    return {};
  }
  const { points } = value;
  return typeof points === 'object' && points !== null ? { ...points } : {};
}

function shown(point: unknown): string {
  return typeof point === 'number' || typeof point === 'string' ? String(point) : '';
}

export default function RoundEntry({ players, value, onChange }: RoundEntryProps) {
  const points = readPoints(value);
  // Unique per instance: the fix sheet and the draft entry can be on screen together.
  const idPrefix = useId();

  return (
    <div className="flex flex-col gap-3">
      {players.map((player) => {
        const inputId = `${idPrefix}-${player.id}`;
        return (
          <div key={player.id} className="flex items-center gap-3">
            <label
              htmlFor={inputId}
              className="min-w-0 flex-1 truncate text-lg font-bold text-ink"
              title={player.name}
            >
              {player.name}
            </label>
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={shown(points[player.id])}
              onChange={(event) => {
                const text = event.target.value.trim();
                const next = { ...points };
                if (text === '') {
                  delete next[player.id];
                } else {
                  next[player.id] = WHOLE_NUMBER.test(text) ? Number(text) : text;
                }
                onChange({ points: next });
              }}
              className="min-h-12 w-24 rounded-control border-2 border-line bg-surface-raised px-3 text-right text-xl font-bold text-ink"
            />
          </div>
        );
      })}
    </div>
  );
}
