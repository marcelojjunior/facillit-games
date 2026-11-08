# Contract: UI parts of the game style

**Consumers**: the screens of spec 003, browser tests, Phase 5 (a game's
`RoundEntry` may use the button classes; it must not import these parts).

## Button classes (`src/styles/global.css`, research D10)

| Class | Use |
|---|---|
| `.btn-3d` | base: raised, rounded, label bold ≥ 19 px, `min-height: 3rem`, sinks 4 px while `:active`, flat and dimmed when `:disabled` |
| `.btn-green` | confirm round, start, save, rematch, add |
| `.btn-blue` | new match, open history, selected choice in a round entry |
| `.btn-red` | finish, abandon, remove |
| `.btn-purple`, `.btn-orange`, `.btn-yellow` | available; warm ones use `on-warm` text |
| `.btn-plain` | neutral actions (cancel, keep playing, menu items) on `surface-raised` with a `line` edge |

`parts/styles.ts` keeps its exported names (`primaryButton`, `secondaryButton`,
`iconButton`, `textInput`) mapped to these classes, so screens and fixture
entries keep compiling, and adds `dangerButton` (`btn-3d btn-red`) for
destructive actions. Square icon buttons stay ≥ 44×44.

## Parts

### `Mascot` — `parts/Mascot.tsx`

```ts
interface MascotProps { readonly crown?: boolean; readonly className?: string }
```

Inline SVG, token fills, `aria-hidden="true"`, `data-testid="mascot"`
(`data-crown="true"` with a crown). Gentle bob via class, removed under
reduced motion. Never wraps or overlaps a control.

### `PointsBadge` — `parts/PointsBadge.tsx`

```ts
interface PointsBadgeProps { readonly points: number }
```

Renders `<span data-testid="points">{points}<small> pts</small></span>` on
`purple` with `on-color`. Text content reads `"<points> pts"`, sign kept,
number never wraps.

### `Medal` — `parts/Medal.tsx`

```ts
interface MedalProps { readonly position: number }
```

`data-testid="medal"`, `data-medal="gold" | "silver" | "bronze" | "plain"`,
text `"<position>º"`. Gold/silver/bronze use `on-warm` text.

### `Podium` — `parts/Podium.tsx` + `parts/podium.ts`

`podiumSteps(view)` per data-model; the component renders
`data-testid="podium"` with one `data-testid="podium-step"`
(`data-position="1|2|3"`) per step, each with a `Medal`, every player's name
(truncated, full name in `title`) and a `PointsBadge`.

### `Confetti` — `parts/Confetti.tsx`

Decorative pieces in family colors, deterministic positions, `aria-hidden`,
`data-testid="confetti"`, class `motion-reduce:hidden` (not displayed under
reduced motion).

### `Scene` — `src/components/Scene.astro`

Static, in `BaseLayout`, behind the page (`position: fixed`, `z-index: -1`,
`aria-hidden`, `pointer-events: none`), scene tokens only.

## Placement per screen

| Screen | Changes |
|---|---|
| Header (all) | title in the game treatment (white with a `blue-edge` outline); theme control as a raised segmented control |
| Game list | mascot + greeting bubble; game options as raised cards with a colored icon badge and a green play disc |
| Setup | raised cards; add = green, start = green, abandon = plain |
| In progress | round title as a purple ribbon; standings rows with `Medal` and `PointsBadge`; confirm bar green `.btn-3d`; rejection box with a small `Mascot` |
| Overlays | dialogs as raised cards on the scrim; buttons per the class table |
| Winner | red ribbon heading, crowned `Mascot`, winners' names, `Podium`, standings, `Confetti`, rematch green, new match blue |

## Stable test hooks

All of spec 003 stay. New: `mascot`, `points`, `medal`, `podium`,
`podium-step`, `confetti`.
