import { describe, expect, it } from 'vitest';

import type { StorageLike } from '../match/persistence';
import {
  readThemeChoice,
  resolveTheme,
  THEME_KEY,
  writeThemeChoice,
  type ThemeChoice,
} from './preference';

/** In-memory storage holding `raw` under the theme key. */
function storageWith(raw: string | null): StorageLike & { saved: Map<string, string> } {
  const saved = new Map<string, string>(raw === null ? [] : [[THEME_KEY, raw]]);
  return {
    saved,
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => void saved.set(key, value),
    removeItem: (key) => void saved.delete(key),
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
  removeItem: () => {
    throw new Error('denied');
  },
};

describe('readThemeChoice (contracts/theme-preference.md, reading table)', () => {
  it.each([
    ['missing key', null],
    ['not JSON', '{nope'],
    ['not an object', '"dark"'],
    ['array', '[1]'],
    ['wrong schemaVersion', '{"schemaVersion":2,"theme":"dark"}'],
    ['no schemaVersion', '{"theme":"dark"}'],
    ['unknown theme', '{"schemaVersion":1,"theme":"sepia"}'],
    ['theme not a string', '{"schemaVersion":1,"theme":1}'],
  ])('%s → auto', (_, raw) => {
    expect(readThemeChoice(storageWith(raw))).toBe('auto');
  });

  it('throwing storage → auto', () => {
    expect(readThemeChoice(throwing)).toBe('auto');
  });

  it('no storage → auto', () => {
    expect(readThemeChoice(null)).toBe('auto');
  });

  it.each<ThemeChoice>(['auto', 'light', 'dark'])('valid %s → stored value', (theme) => {
    expect(readThemeChoice(storageWith(JSON.stringify({ schemaVersion: 1, theme })))).toBe(theme);
  });
});

describe('writeThemeChoice', () => {
  it('writes the versioned envelope under its own key', () => {
    const storage = storageWith(null);
    expect(writeThemeChoice(storage, 'dark')).toEqual({ persisted: true });
    expect(JSON.parse(storage.saved.get(THEME_KEY) ?? '')).toEqual({
      schemaVersion: 1,
      theme: 'dark',
    });
    expect(readThemeChoice(storage)).toBe('dark');
  });

  it('never throws: a refused write reports persisted false', () => {
    expect(writeThemeChoice(throwing, 'light')).toEqual({ persisted: false });
    expect(writeThemeChoice(null, 'light')).toEqual({ persisted: false });
  });

  it('uses a key separate from the match', () => {
    expect(THEME_KEY).toBe('facillit-games:theme');
  });
});

describe('resolveTheme', () => {
  it.each([
    ['auto', false, 'light'],
    ['auto', true, 'dark'],
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
  ] as const)('%s with prefersDark=%s → %s', (choice, prefersDark, expected) => {
    expect(resolveTheme(choice, prefersDark)).toBe(expected);
  });
});
