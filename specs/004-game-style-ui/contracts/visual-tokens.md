# Contract: Visual tokens

**Source of truth**: `src/styles/tokens.ts`. **Mirror**: `src/styles/global.css`.
**Guard**: `src/styles/tokens.test.ts`. Revises spec 003 research D7 and D15.

## Shape

```ts
// src/styles/tokens.ts
export const themed = {            // light and dark value
  surface: { light, dark }, 'surface-raised': …, 'surface-sunken': …,
  ink: …, 'ink-muted': …, line: …, accent: …, danger: …,
  'sky-top': …, 'sky-bottom': …, 'hill-back': …, 'hill-front': …,
  cloud: …,                         // transparent (#rrggbb00) in dark
  star: …,                          // transparent in light
} satisfies Record<string, { light: string; dark: string }>;

export const fixed = {             // one value, both themes
  green, 'green-edge', 'green-hi', blue, …, purple, 'purple-edge', 'purple-hi',
  'on-color', 'on-warm', gold, silver, bronze, die, 'die-edge', pip, face,
} satisfies Record<string, string>;

export const textPairs: readonly Pair[];       // ≥ 4.5:1
export const largeTextPairs: readonly Pair[];  // ≥ 3:1, bold ≥ 18.66 px only
export const boundaryPairs: readonly Pair[];   // ≥ 3:1
```

Values are `#rrggbb` or `#rrggbbaa` (the alpha form only for `cloud` and
`star`). Names carry no numeric suffix.

## CSS mirror

- `@theme`: `--color-*: initial;` then every fixed token and the light value of
  every themed token, as `--color-<name>`.
- `[data-theme='dark']`: the dark value of every themed token; **no** fixed
  token.
- Tailwind utilities follow from the names: `bg-green`, `text-on-warm`,
  `bg-gold`, `fill-[var(--color-pip)]` is NOT allowed in components (use the
  token utility, e.g. `fill-pip`).

## Pairs (checked in both themes)

| Kind | Foreground | Background |
|---|---|---|
| text | `ink`, `ink-muted`, `accent`, `danger` | `surface`, `surface-raised`, `surface-sunken` |
| text | `on-color` | `purple` (points badge, small "pts") |
| text | `on-warm` | `gold`, `silver`, `bronze`, `orange`, `yellow` |
| large text | `on-color` | `green`, `blue`, `red`, `purple` |
| large text | `on-warm` | `orange`, `yellow` |
| boundary | `line` | `surface`, `surface-raised`, `surface-sunken` |

Large-text pairs are valid only for bold labels ≥ 18.66 px; `.btn-3d`
guarantees that size (ui-parts contract).

## What the test checks

1. Every token value is a valid hex; fixed tokens are not redefined in the dark
   block; every themed token is in both blocks with matching values.
2. Every pair meets its ratio in both themes.
3. No literal color in `src/shell/ui/`, `src/components/` (`.tsx` and
   `.astro`), or `tests/fixtures/games/` (unchanged from spec 003).
