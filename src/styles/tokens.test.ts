import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { boundaryPairs, colors, textPairs, type ColorName } from './tokens';

/**
 * The design-token guard (FR-019, FR-021, research D7 and D15 of spec 003).
 *
 * tokens.ts is the single source of the color values; global.css must carry
 * the same values, and every declared pair must meet WCAG 2.2 AA in both
 * themes. Contrast is computed here, from the values, not from screenshots.
 */

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const css = readFileSync(join(repoRoot, 'src/styles/global.css'), 'utf8');

/** The `--color-*` declarations inside the first block that follows `header`. */
function colorVariables(header: string): Record<string, string> {
  const start = css.indexOf(header);
  if (start === -1) {
    throw new Error(`global.css has no "${header}" block.`);
  }
  const open = css.indexOf('{', start);
  const body = css.slice(open + 1, css.indexOf('}', open));
  const found: Record<string, string> = {};
  for (const match of body.matchAll(/--color-([a-z-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined && value.trim() !== 'initial') {
      found[name] = value.trim().toLowerCase();
    }
  }
  return found;
}

function luminance(hex: string): number {
  const digits = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const names = Object.keys(colors) as ColorName[];
const themes = ['light', 'dark'] as const;

describe('color tokens (FR-019)', () => {
  it.each(names)('%s has a six-digit hex value in both themes', (name) => {
    expect(colors[name].light).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors[name].dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('names carry no numeric suffix (research D7)', () => {
    expect(names.filter((name) => /\d/.test(name))).toEqual([]);
  });

  it('global.css @theme matches the light values of tokens.ts', () => {
    const expected = Object.fromEntries(names.map((name) => [name, colors[name].light]));
    expect(colorVariables('@theme')).toEqual(expected);
  });

  it('global.css dark overrides match the dark values of tokens.ts', () => {
    const expected = Object.fromEntries(names.map((name) => [name, colors[name].dark]));
    expect(colorVariables("[data-theme='dark']")).toEqual(expected);
  });
});

describe('contrast, WCAG 2.2 AA (FR-021, SC-004)', () => {
  it.each(themes.flatMap((theme) => textPairs.map(([fg, bg]) => [theme, fg, bg] as const)))(
    '%s: text %s on %s is at least 4.5:1',
    (theme, fg, bg) => {
      expect(contrast(colors[fg][theme], colors[bg][theme])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(themes.flatMap((theme) => boundaryPairs.map(([fg, bg]) => [theme, fg, bg] as const)))(
    '%s: boundary %s on %s is at least 3:1',
    (theme, fg, bg) => {
      expect(contrast(colors[fg][theme], colors[bg][theme])).toBeGreaterThanOrEqual(3);
    },
  );
});

describe('no literal colors in components (FR-019)', () => {
  const PALETTE =
    /-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
  const LITERALS = [/#[0-9a-f]{3,8}\b/i, /\brgba?\(/, /\bhsla?\(/, PALETTE];

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  }

  const files = ['src/shell/ui', 'src/components', 'tests/fixtures/games']
    .flatMap((dir) => walk(join(repoRoot, dir)))
    .filter((path) => /\.(tsx?|astro)$/.test(path) && !/\.test\.tsx?$/.test(path));

  it('recognises the forbidden forms', () => {
    const flagged = (line: string) => LITERALS.some((pattern) => pattern.test(line));
    expect(flagged('bg-[#fff]')).toBe(true);
    expect(flagged('text-red-500')).toBe(true);
    expect(flagged('color: rgb(0 0 0)')).toBe(true);
    expect(flagged('bg-surface-raised text-ink')).toBe(false);
  });

  it('scans the component folders', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no component uses a literal color', () => {
    const found = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          LITERALS.some((pattern) => pattern.test(line))
            ? [`${relative(repoRoot, file)}:${index + 1}: ${line.trim()}`]
            : [],
        ),
    );
    expect(found).toEqual([]);
  });
});
