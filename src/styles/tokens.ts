/**
 * Color design tokens: the single source of their values
 * (specs/004-game-style-ui/contracts/visual-tokens.md). `global.css` declares
 * the same values as CSS variables, and `tokens.test.ts` fails if the two
 * drift or if a pair below loses contrast.
 *
 * - `themed`: one value per theme (surfaces, text, the sky/night scene).
 * - `fixed`: the same in both themes (the game palette, text on color,
 *   medals, the mascot), so buttons never change color with the theme
 *   (spec 004 FR-008).
 *
 * Names carry no numeric suffix (spec 003 research D7), so the literal-color
 * check can tell them from Tailwind's default palette. Values start from the
 * approved prototype and are darkened where contrast requires (research D3).
 */

export interface ThemedToken {
  readonly light: string;
  readonly dark: string;
}

export const themed = {
  surface: { light: '#eef5f9', dark: '#1f2357' },
  'surface-raised': { light: '#ffffff', dark: '#2b3070' },
  'surface-sunken': { light: '#e3ecf3', dark: '#181b45' },
  ink: { light: '#23264f', dark: '#ffffff' },
  'ink-muted': { light: '#545a86', dark: '#c3c6f5' },
  line: { light: '#767c9f', dark: '#8389cc' },
  accent: { light: '#1b63c4', dark: '#8cc8ff' },
  danger: { light: '#c0262f', dark: '#ff8f87' },
  'sky-top': { light: '#6fd3f2', dark: '#141a4a' },
  'sky-bottom': { light: '#c8f5e4', dark: '#3a2c86' },
  'hill-back': { light: '#7ccf5a', dark: '#2c4f73' },
  'hill-front': { light: '#4cb847', dark: '#1f3b5c' },
  cloud: { light: '#ffffffd9', dark: '#ffffff00' },
  star: { light: '#ffffff00', dark: '#ffffffd9' },
} as const satisfies Record<string, ThemedToken>;

export const fixed = {
  green: '#2e9b38',
  'green-edge': '#1e6e27',
  'green-hi': '#6fd35a',
  blue: '#1f7fe0',
  'blue-edge': '#155ab0',
  'blue-hi': '#6cbcff',
  red: '#e0393f',
  'red-edge': '#a8202a',
  'red-hi': '#ff8a7a',
  orange: '#ff9d2e',
  'orange-edge': '#c8650f',
  'orange-hi': '#ffc46b',
  yellow: '#ffd23f',
  'yellow-edge': '#d39a0b',
  'yellow-hi': '#fff08a',
  purple: '#7e44d8',
  'purple-edge': '#55279e',
  'purple-hi': '#b98cff',
  'on-color': '#ffffff',
  'on-warm': '#3d2304',
  gold: '#ffc933',
  silver: '#cfd8e3',
  bronze: '#e09a5a',
  die: '#ffffff',
  'die-edge': '#d9e1ec',
  pip: '#e0393f',
  face: '#23264f',
} as const satisfies Record<string, string>;

export type ThemedName = keyof typeof themed;
export type FixedName = keyof typeof fixed;
export type TokenName = ThemedName | FixedName;

export type Pair = readonly [foreground: TokenName, background: TokenName];

const surfaces = ['surface', 'surface-raised', 'surface-sunken'] as const;

/** Text below 18.66 px bold: WCAG AA ≥ 4.5:1 in both themes. */
export const textPairs: readonly Pair[] = [
  ...surfaces.flatMap((bg): Pair[] => [
    ['ink', bg],
    ['ink-muted', bg],
    ['accent', bg],
    ['danger', bg],
  ]),
  // Headings sit directly on the scene; everything smaller goes on a card.
  ['ink', 'sky-top'],
  ['ink', 'sky-bottom'],
  ['on-color', 'purple'], // the small "pts" of the points badge
  ['on-warm', 'gold'],
  ['on-warm', 'silver'],
  ['on-warm', 'bronze'],
  ['on-warm', 'orange'],
  ['on-warm', 'yellow'],
];

/**
 * Bold text ≥ 18.66 px only (WCAG "large text"): ≥ 3:1. Every `.btn-3d`
 * label qualifies; it is checked against the family base, where the label sits.
 */
export const largeTextPairs: readonly Pair[] = [
  ['on-color', 'green'],
  ['on-color', 'blue'],
  ['on-color', 'red'],
  ['on-color', 'purple'],
  ['on-warm', 'orange'],
  ['on-warm', 'yellow'],
];

/** Essential UI boundaries (input borders, card edges): ≥ 3:1. */
export const boundaryPairs: readonly Pair[] = surfaces.map((bg): Pair => ['line', bg]);
