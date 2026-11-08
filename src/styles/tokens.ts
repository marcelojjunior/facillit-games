/**
 * Color design tokens: the single source of their values (research D15 of
 * spec 003). `global.css` declares the same values as CSS variables, and
 * `tokens.test.ts` fails if the two drift or if a pair below loses contrast.
 *
 * Names carry no numeric suffix (research D7), so the literal-color check can
 * tell them from Tailwind's default palette.
 */

export interface ColorToken {
  readonly light: string;
  readonly dark: string;
}

export const colors = {
  surface: { light: '#f6f4ef', dark: '#131513' },
  'surface-raised': { light: '#ffffff', dark: '#1e211f' },
  'surface-sunken': { light: '#ebe8e1', dark: '#0c0d0c' },
  ink: { light: '#1b1a17', dark: '#ecebe6' },
  'ink-muted': { light: '#57534b', dark: '#a8a69e' },
  line: { light: '#858076', dark: '#73776f' },
  accent: { light: '#1d6b57', dark: '#63c7a9' },
  'accent-ink': { light: '#ffffff', dark: '#062a20' },
  danger: { light: '#b42318', dark: '#f4877d' },
  'danger-ink': { light: '#ffffff', dark: '#2a0a06' },
} as const satisfies Record<string, ColorToken>;

export type ColorName = keyof typeof colors;

type Pair = readonly [foreground: ColorName, background: ColorName];

const surfaces = ['surface', 'surface-raised', 'surface-sunken'] as const;

/** Text on a background: WCAG AA ≥ 4.5:1 in both themes (FR-021). */
export const textPairs: readonly Pair[] = [
  ...surfaces.flatMap((bg): Pair[] => [
    ['ink', bg],
    ['ink-muted', bg],
    ['accent', bg],
    ['danger', bg],
  ]),
  ['accent-ink', 'accent'],
  ['danger-ink', 'danger'],
];

/** Essential UI boundaries (input borders, selected state): ≥ 3:1 (FR-021). */
export const boundaryPairs: readonly Pair[] = surfaces.flatMap((bg): Pair[] => [
  ['line', bg],
  ['accent', bg],
]);
