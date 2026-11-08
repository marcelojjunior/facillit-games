import { describe, expect, it } from 'vitest';

import { bootScript } from './boot';
import { readThemeChoice, resolveTheme, THEME_KEY } from './preference';

/**
 * The inline script that sets the theme before first paint (FR-020, research
 * D7) must decide exactly what the module decides. It runs here against fake
 * globals, the way the browser runs it: as plain source, with no imports.
 */

interface FakeRoot {
  dataset: Record<string, string>;
  style: { colorScheme?: string };
}

function run(stored: string | null, prefersDark: boolean, storageThrows = false): FakeRoot {
  const root: FakeRoot = { dataset: {}, style: {} };
  const localStorage = {
    getItem: (key: string) => {
      if (storageThrows) {
        throw new Error('denied');
      }
      return key === THEME_KEY ? stored : null;
    },
  };
  const matchMedia = (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
  });
  const document = { documentElement: root };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- running the generated source is the test
  const script = new Function('localStorage', 'matchMedia', 'document', bootScript()) as (
    ...globals: unknown[]
  ) => void;
  script(localStorage, matchMedia, document);
  return root;
}

const STORED = [
  null,
  'garbage',
  '{"schemaVersion":2,"theme":"dark"}',
  '{"schemaVersion":1,"theme":"auto"}',
  '{"schemaVersion":1,"theme":"light"}',
  '{"schemaVersion":1,"theme":"dark"}',
];

describe('theme boot script', () => {
  it.each(STORED.flatMap((stored) => [false, true].map((dark) => [stored, dark] as const)))(
    'stored %s, prefersDark=%s: same theme as the module',
    (stored, prefersDark) => {
      const storage = {
        getItem: () => stored,
        setItem: () => undefined,
        removeItem: () => undefined,
      };
      const expected = resolveTheme(readThemeChoice(storage), prefersDark);
      const root = run(stored, prefersDark);
      expect(root.dataset.theme).toBe(expected);
      expect(root.style.colorScheme).toBe(expected);
    },
  );

  it('never throws on a throwing storage, and falls back to the device', () => {
    expect(run(null, true, true).dataset.theme).toBe('dark');
    expect(run(null, false, true).dataset.theme).toBe('light');
  });

  it('reads only the theme key, never the match', () => {
    expect(bootScript()).not.toContain('facillit-games:state');
  });
});
