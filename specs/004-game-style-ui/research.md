# Research: Game-style visual identity

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Decisions are numbered so tasks and code comments can cite them
(`spec 004 research D3`).

## D1 — Baloo 2 as one committed, self-hosted variable font

**Decision**: commit `baloo-2-latin-wght-normal.woff2` (Baloo 2 variable,
weights 400–800, Latin subset, 33 188 bytes, from Fontsource 5.3.0) and its
`OFL.txt` under `src/assets/fonts/`. `global.css` declares it with
`@font-face { font-family: "Baloo 2"; font-weight: 400 800;
font-display: swap; unicode-range: <latin>; src: url(...) format("woff2") }`.
`BaseLayout` preloads the same file (`<link rel="preload" as="font"
type="font/woff2" crossorigin>`, URL from a Vite `?url` import so it matches
the hashed asset). The font stack is `"Baloo 2", ui-rounded, "Arial Rounded MT
Bold", "Nunito", system-ui, sans-serif`.

**Rationale**:

- Principle I: served from the app's own origin; no Google Fonts or CDN.
- The Latin subset covers U+0000–00FF, which includes every Portuguese letter
  (ã, õ, ç, á, é, í, ó, ú, â, ê, ô, à). No other subset is needed.
- One variable file covers every weight the screens use (500–800).
- Preload plus `swap` shows text at once in a rounded fallback and swaps in
  the font early, usually before the island mounts.

**Supersedes**: spec 003 research D8 ("system font, no web font"). That
decision is amended in the same change, pointing here.

**Alternatives rejected**: `@fontsource-variable/baloo-2` (ships all subsets
into `dist/`, a dependency for one file); Google Fonts link (Principle I);
static weights (three files instead of one, larger in total).

## D2 — Color token families, fixed across themes

**Decision**: `tokens.ts` splits tokens into **themed** (a light and a dark
value) and **fixed** (one value in both themes):

- Themed (existing names kept): `surface`, `surface-raised`, `surface-sunken`,
  `ink`, `ink-muted`, `line`, `accent`, `danger`; new scene tokens `sky-top`,
  `sky-bottom`, `hill-back`, `hill-front`, `cloud`, `star`.
- Fixed: the six families `green`, `blue`, `red`, `orange`, `yellow`,
  `purple`, each as `<name>`, `<name>-edge`, `<name>-hi`; `on-color` (white
  text on a family) and `on-warm` (dark text on orange, yellow, and medals);
  medals `gold`, `silver`, `bronze`; mascot `die`, `die-edge`, `pip`, `face`.

`accent-ink` and `danger-ink` are removed (their role moves to `on-color`).
Values start from the prototype and are darkened where contrast requires
(D3). `global.css` declares fixed tokens once in `@theme` and themed tokens in
`@theme` (light) and `[data-theme='dark']`; `tokens.test.ts` checks both.

**Rationale**: the spec requires button colors identical in both themes
(FR-008); modelling that as "fixed" makes the test enforce it instead of
duplicating values.

## D3 — Contrast: three pair kinds

**Decision**: `tokens.ts` declares three pair lists, each checked in both
themes:

- `textPairs` (≥ 4.5:1): any text below 18.66 px bold — `ink`, `ink-muted`,
  `accent`, `danger` on each surface; `on-color` on `purple` (the "pts" label
  is small); `on-warm` on `gold`, `silver`, `bronze`, `orange`, `yellow`.
- `largeTextPairs` (≥ 3:1): bold text ≥ 18.66 px, which is every 3D button
  label — `on-color` on `green`, `blue`, `red`, `purple`; `on-warm` on
  `orange`, `yellow`.
- `boundaryPairs` (≥ 3:1): `line` on each surface.

Text on a 3D button is checked against the family **base** tone: the label
sits on the lower half, where the gradient has reached the base (prototype:
highlight at 0 %, base from 48 %). A button label MUST therefore be ≥ 19 px
bold, which `.btn-3d` enforces.

**Consequence recorded**: the prototype's green (`#3fb43f`) and orange text
treatment fail these ratios; the plan's values are darker (e.g. green near
`#2e9b38` for ≥ 3:1 with white). The spec allows shifts for contrast.

## D4 — The scene is static markup in the layout

**Decision**: `src/components/Scene.astro` draws the sky gradient, clouds,
hills, and stars as one inline SVG plus a CSS gradient, `position: fixed`
behind everything (`z-index: -1`, `aria-hidden`, `pointer-events: none`),
included by `BaseLayout`. Every fill is a scene token; stars use `star`, which
is transparent in the light theme, and clouds use `cloud`, which is
transparent in the dark theme. Hills sit at the bottom of the viewport on
every screen.

**Rationale**: the boot script sets `data-theme` before first paint and the
scene reads only tokens, so the first frame already shows the right scene
(FR-017), including the loading frame. Drawing it in the island would paint a
bare background first.

**Alternatives rejected**: scene inside `MatchApp` (late, and re-rendered on
every store change); a background image (a request and a file per theme).

## D5 — The mascot is one SVG component

**Decision**: `Mascot.tsx` draws the die from the prototype (white body with an
edge, four red pips, face, arms) as inline SVG with token fills only, props
`{ crown?: boolean; className?: string }`, `aria-hidden` and
`data-testid="mascot"`. A gentle bob animation comes from a CSS class, which
the reduced-motion rule turns off (D7). Placements: next to the greeting on the
game list, inside the rejection box in the confirm bar (small, 44 px), and
with the crown above the winners on the winner screen.

**Rationale**: one drawing, three places; tokens keep it theme-correct; no
image request.

## D6 — Podium groups by position

**Decision**: a pure helper `podiumSteps(players, positions)` (in
`parts/podiumSteps.ts`; a file named `podium.ts` would collide with
`Podium.tsx` on case-insensitive file systems) returns up to three steps for
positions 1, 2, 3 that exist, each with the players at that position in roster
order (positions come from `evaluation.positions`, spec 003 D2). The component
lays them out second–first–third; a step with several players lists every
name. Positions 1, 1, 3 give two steps (gold with two names, bronze); two
players give at most two steps.

**Rationale**: FR-013 and the tie edge cases; pure so it is tested in `node`.

## D7 — One reduced-motion rule

**Decision**: `global.css` ends with
`@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation:
none !important; transition: none !important; } }`, and `Confetti` is not
rendered at all under reduced motion (`motion-reduce:hidden`). Buttons still
show the pressed position instantly.

**Rationale**: SC-006 asks for zero animated elements; a global rule cannot be
forgotten by a new part.

## D8 — Testing the new look

**Decision**:

- `tokens.test.ts`: themed/fixed parity with `global.css`, fixed tokens absent
  from the dark block, the three pair kinds, the literal-color scan unchanged.
- `tests/static-build.test.ts`: the font file is in `dist/` and ≤ 80 kB in
  total; `dist/index.html` preloads it; no `http(s)://` URL in `dist/` HTML or
  CSS except the SVG namespace; island JS ≤ 80 kB gzipped (turns the spec 003
  T050 measurement into a test).
- Browser tests, one per story (`look`, `mascot`, `scoreboard`, `winner`
  `.browser.test.tsx` in `src/shell/ui/`): buttons and font; mascot on game list, rejection,
  and winner (with crown), never intersecting a button or input; totals read
  `^-?\d+ pts$` in standings and podium; medals per position with shared
  medals on ties; podium step counts for 1-1-3 and two players; with reduced
  motion emulated, `document.getAnimations()` is empty on the winner screen
  and no confetti is rendered.
- A new browser command `emulateReducedMotion` beside `emulateColorScheme`.
- Every spec 003 test runs unchanged in what it asserts (SC-002); only
  selectors that named removed classes may change.

## D11 — Keeping the island under 80 kB

**Context**: the island already ships 77.6 kB gzipped (spec 003 research D13),
almost all of it React; the new parts add markup only, but 2.4 kB of headroom
is thin and the budget test (D8) fails only at the end.

**Decision**: measure after Phase 2 and after US1 (tasks T010, T017). Keep the
added code small by construction:

- The mascot is one SVG with a crown group shown by a prop, not separate
  drawings per moment.
- Confetti is one element whose pieces come from CSS (pseudo-elements and
  `nth-child` positions over a short fixed list), with no per-piece props or
  arrays in JavaScript.
- The scene lives in the static layout, so it costs the island nothing.
- No new runtime dependency.

**If a measurement passes 78 kB**: first move decorative SVG that never
changes (mascot body, crown) into a static sprite in the layout referenced
with `<use href="#...">`, so it leaves the island bundle; record the new
measurement here. Raising the budget is not an option without amending the
plan of spec 003.

## D12 — Found during implementation

- **Measurements** (`pnpm build`, gzip -9): island JS 77 593 bytes after
  Phase 2, 77 895 after US1, **79 254 after US5** (budget 81 920, i.e. 80 KiB);
  the D11 fallback was not needed, but only ~2.6 KiB of headroom remain. The
  font ships as one 33 188-byte file.
- **D11 fallback applied** (before spec 005 added MECHE-MECHE, spec 005
  task T005): the mascot's drawing moved to a static sprite
  (`src/components/MascotSprite.astro`) referenced with `<use>`; island JS
  went from 79 162 to 78 741 bytes gzipped.
- **Contrast on the sky**: small or muted text on the scene failed or was
  fragile, so only headings sit on the sky (pairs `ink` on `sky-top` and
  `sky-bottom` added to `textPairs`); everything smaller is on a raised card
  (setup, standings, the round entry).
- **Finish as an icon**: the round ribbon, a labelled "Finalizar", and the
  more button did not fit 360 px; finish is a red square icon button whose
  accessible name is still "Finalizar".
- **Game cards show only the name**: the player-count line was dropped (setup
  shows it) because a spec 003 test reads the option's exact text.
- **Flat-button guard**: `look.browser.test.tsx` fails on any visible button
  that is neither `btn-3d` nor `card-3d`; inline text actions opt out with
  `data-inline-action` (only "tap a name to rename" in setup today).
- **Podium**: steps stretch to the tallest and drop from the top, so first
  place stays highest when a tied step lists more names; confetti sits behind
  the content (`-z-5`, above the scene).
- **`podiumSteps.ts`**: named so because `podium.ts` collides with
  `Podium.tsx` on case-insensitive file systems (macOS), which broke module
  resolution.
- **Tests reading totals** anchor on `"<n> pts"` now, the one adjustment SC-002
  allows; no expected number changed.
- **External URL check** ignores comments: Tailwind's license banner cites its
  site but fetches nothing.

## D13 — One theme button (owner review)

**Decision**: `ThemeControl` becomes one `btn-3d btn-plain` square button
(`data-testid="theme-control"`) showing the moon in light and the sun in dark.
It keeps the stored choice in state (`readThemeChoice`, unchanged), resolves
the effective theme with `resolveTheme(choice, prefersDark)` (unchanged), and
on tap stores the opposite of the effective theme with `writeThemeChoice`. In
`auto` it follows `prefers-color-scheme` changes live, as before. The boot
script already resolves `auto` with a missing or failing `matchMedia` to
light, so no change there.

**Rationale**: the owner's rule (spec Clarifications); the storage contract of
spec 003 keeps working, since `auto` is still what "nothing chosen" reads as.
A player can no longer go back to automatic from the UI; accepted by the owner.

## D14 — Centering a 3D button

**Decision**: `.btn-3d` is `inline-flex`, so `mx-auto` alone does not center
it; the confirm bar's button adds `flex` (block-level flex), so its
`max-w-md` box centers in the bar at any width. A browser test checks the
button's center against the viewport's at a wide viewport.

## D9 — No external URL in the artifact

**Decision**: covered by the static-build check in D8. It replaces the manual
"no CDN" promise of spec 003 D8 with a test, now that a font file exists.

## D10 — Buttons as one CSS component with color modifiers

**Decision**: `global.css` defines `.btn-3d` in `@layer components` (gradient
from `--btn-hi` to `--btn`, `box-shadow` bottom edge in `--btn-edge`, top
gloss, `min-height: 3rem`, bold ≥ 19 px label, pressed state
`translateY(4px)` with a shorter edge, disabled state flat and dimmed) and
modifiers `.btn-green`, `.btn-blue`, `.btn-red`, `.btn-purple`,
`.btn-orange`, `.btn-yellow` (warm ones switch the label to `on-warm`), plus
`.btn-plain` (surface-raised with a `line` edge) for neutral actions.
`parts/styles.ts` maps the existing class lists to these (`primaryButton` →
green, `secondaryButton` → plain, destructive → red, `iconButton` → plain
square). Colors per action: confirm round, start, save, rematch = green;
new match, history = blue; finish, abandon, remove = red; selected places in
round entries = blue.

**Rationale**: one place to tune the 3D look; components keep using class
lists, so screens change little; no literal color leaves `global.css`.
