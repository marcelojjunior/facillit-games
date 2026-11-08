import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  boundaryPairs,
  fixed,
  largeTextPairs,
  textPairs,
  themed,
  type FixedName,
  type Pair,
  type TokenName,
  type ThemedName,
} from './tokens';

/**
 * The design-token guard (spec 004 contracts/visual-tokens.md; spec 003
 * FR-019, FR-021).
 *
 * tokens.ts is the single source of the color values. global.css must carry
 * the same values: themed tokens in both theme blocks, fixed tokens (the same
 * in both themes, spec 004 FR-008) only in `@theme`. Every declared pair must
 * meet its WCAG 2.2 AA ratio in both themes; contrast is computed here from
 * the values, not from screenshots.
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

const themedNames = Object.keys(themed) as ThemedName[];
const fixedNames = Object.keys(fixed) as FixedName[];
const themes = ['light', 'dark'] as const;
type Theme = (typeof themes)[number];

function valueOf(name: TokenName, theme: Theme): string {
  return name in fixed ? fixed[name as FixedName] : themed[name as ThemedName][theme];
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

const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

describe('color tokens (FR-005, FR-018)', () => {
  it.each(themedNames)('themed %s has a hex value in both themes', (name) => {
    expect(themed[name].light).toMatch(HEX);
    expect(themed[name].dark).toMatch(HEX);
  });

  it.each(fixedNames)('fixed %s has one hex value', (name) => {
    expect(fixed[name]).toMatch(HEX);
  });

  it('a name is either themed or fixed, never both', () => {
    expect(themedNames.filter((name) => (fixedNames as string[]).includes(name))).toEqual([]);
  });

  it('names carry no numeric suffix (spec 003 research D7)', () => {
    expect([...themedNames, ...fixedNames].filter((name) => /\d/.test(name))).toEqual([]);
  });

  it('global.css @theme holds every fixed value and the light themed values', () => {
    const expected = {
      ...Object.fromEntries(fixedNames.map((name) => [name, fixed[name]])),
      ...Object.fromEntries(themedNames.map((name) => [name, themed[name].light])),
    };
    expect(colorVariables('@theme')).toEqual(expected);
  });

  it('global.css dark block holds the dark themed values and no fixed token (FR-008)', () => {
    const expected = Object.fromEntries(themedNames.map((name) => [name, themed[name].dark]));
    expect(colorVariables("[data-theme='dark']")).toEqual(expected);
  });

  it('night surfaces are never lighter than the night sky (spec 004 US2)', () => {
    const sky = Math.max(luminance(themed['sky-top'].dark), luminance(themed['sky-bottom'].dark));
    for (const surface of ['surface', 'surface-raised', 'surface-sunken'] as const) {
      expect(luminance(themed[surface].dark), surface).toBeLessThanOrEqual(sky);
    }
  });

  it('cloud vanishes at night and stars by day (spec 004 research D4)', () => {
    expect(themed.cloud.dark.slice(7)).toBe('00');
    expect(themed.star.light.slice(7)).toBe('00');
  });
});

describe('contrast, WCAG 2.2 AA (FR-015, SC-003)', () => {
  const cases = (pairs: readonly Pair[]) =>
    themes.flatMap((theme) => pairs.map(([fg, bg]) => [theme, fg, bg] as const));

  it('no pair uses a translucent token', () => {
    const all = [...textPairs, ...largeTextPairs, ...boundaryPairs].flat();
    for (const theme of themes) {
      expect(all.filter((name) => valueOf(name, theme).length !== 7)).toEqual([]);
    }
  });

  it.each(cases(textPairs))('%s: text %s on %s is at least 4.5:1', (theme, fg, bg) => {
    expect(contrast(valueOf(fg, theme), valueOf(bg, theme))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(cases(largeTextPairs))(
    '%s: large bold text %s on %s is at least 3:1',
    (theme, fg, bg) => {
      expect(contrast(valueOf(fg, theme), valueOf(bg, theme))).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(cases(boundaryPairs))('%s: boundary %s on %s is at least 3:1', (theme, fg, bg) => {
    expect(contrast(valueOf(fg, theme), valueOf(bg, theme))).toBeGreaterThanOrEqual(3);
  });
});

describe('no literal colors in components (FR-018)', () => {
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
    expect(flagged('bg-surface-raised text-ink btn-red')).toBe(false);
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
