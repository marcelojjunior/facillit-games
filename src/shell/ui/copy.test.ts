import { describe, expect, it } from 'vitest';

import type { DiscardReason } from '../match/persistence';
import type { MatchError } from '../match/types';
import { discardCopy, errorCopy, rosterLimitCopy } from './copy';

// Typed as a Record over the union: a new code added to MatchError or
// DiscardReason without an entry here is a compile error, and the comparison
// below then fails until copy.ts has it too (SC-005, research D12).
const ALL_ERROR_CODES: Record<MatchError['code'], true> = {
  game_not_found: true,
  match_in_progress: true,
  no_match: true,
  invalid_status: true,
  roster_full: true,
  roster_too_small: true,
  roster_too_large: true,
  blank_name: true,
  name_too_long: true,
  invalid_name: true,
  duplicate_name: true,
  player_not_found: true,
  round_not_found: true,
  invalid_draft: true,
  invalid_round: true,
};

const ALL_DISCARD_REASONS: Record<DiscardReason, true> = {
  unreadable: true,
  wrong_shape: true,
  unsupported_version: true,
  unknown_game: true,
  invalid_round: true,
};

describe('copy (SC-005)', () => {
  it('has copy for every match error code', () => {
    expect(Object.keys(errorCopy).sort()).toEqual(Object.keys(ALL_ERROR_CODES).sort());
  });

  it('has copy for every discard reason', () => {
    expect(Object.keys(discardCopy).sort()).toEqual(Object.keys(ALL_DISCARD_REASONS).sort());
  });

  it.each([...Object.entries(errorCopy), ...Object.entries(discardCopy)])(
    '%s is a non-empty string',
    (_, text) => {
      expect(text.trim().length).toBeGreaterThan(0);
    },
  );

  it('interpolates the roster limits', () => {
    const text = rosterLimitCopy(3, 6);
    expect(text).toContain('3');
    expect(text).toContain('6');
  });
});
