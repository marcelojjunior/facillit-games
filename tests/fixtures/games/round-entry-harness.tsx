/**
 * Test harness for a game's RoundEntry (contracts/round-entry.md, rule 7 of
 * spec 003): holds the value the way the shell does, so a controlled entry
 * can be driven through several edits, and records every emitted value.
 */
import { useState } from 'react';

import type { PlayerRef, RoundEntryComponent } from '../../../src/shell/game/contract';

interface HarnessProps {
  readonly Entry: RoundEntryComponent;
  readonly players: readonly PlayerRef[];
  readonly initial?: unknown;
  readonly emitted: unknown[];
  /** Earlier confirmed rounds (spec 007 FR-002); none by default. */
  readonly rounds?: readonly unknown[];
}

export function RoundEntryHarness({ Entry, players, initial, emitted, rounds = [] }: HarnessProps) {
  const [value, setValue] = useState<unknown>(initial);
  return (
    <Entry
      players={players}
      rounds={rounds}
      value={value}
      onChange={(next) => {
        emitted.push(next);
        setValue(next);
      }}
      reasons={[]}
    />
  );
}

/** No submit of its own: the shell owns confirm, save, and cancel (rule 3). */
export function submitControls(root: HTMLElement): Element[] {
  return [...root.querySelectorAll('form, button[type="submit"], input[type="submit"]')];
}
