# Implementation Plan: Game-style visual identity

**Branch**: `feature/ui-redesign` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-game-style-ui/spec.md`

**Note on the branch name**: `setup-plan.sh` reports `004-game-style-ui`
because Spec Kit derives it from the feature directory. The real git branch
follows the repository convention (`feature/<slug>`, AGENTS.md § Git).

## Summary

Restyle the screens of spec 003 as a casual mobile game, following the
approved [prototype](./prototype.html), with no change to flows, the game
contract, or persisted schemas. The look lives almost entirely in CSS: new
color token families (base, edge, highlight) that are the same in both themes,
a reusable 3D button class, and a sky/night scene drawn once in the static
layout so it is right from the first frame. Baloo 2 ships as one committed,
self-hosted variable font file (Latin subset, 33 kB). Four small shell parts
are added: the die mascot, the points badge, the medal, and the podium. Every
test of spec 003 keeps its assertions; new tests cover tokens, fonts, motion,
the mascot, and the scoreboard.

## Technical Context

**Language/Version**: TypeScript `~6.0.3` (`strictest`), TSX, CSS (Tailwind 4)

**Primary Dependencies**: Astro 7.4.4, React 19.3.1, Tailwind 4.3.3 (all
existing). **No new dependency**: the font file is committed with its OFL
license (research D1).

**Storage**: unchanged — `facillit-games:state` and `facillit-games:theme`
(spec 003); no new key.

**Testing**: Vitest `unit` (node) and `browser` (Chromium, 360×640) projects,
as in spec 003. The browser command `emulateColorScheme` gains a sibling for
reduced motion (research D8).

**Target Platform**: mobile browsers first (last 2 versions of Chrome Android
and Safari iOS); desktop as a wider layout.

**Project Type**: static web app (Astro, one page, one island)

**Performance Goals**: island JS ≤ 80 kB gzipped (spec 003: 77.6 kB today; this
feature adds markup and classes only, target ≤ 80 kB); font ≤ 80 kB total
(33 kB planned); no layout shift when the font swaps in (fallback metrics
close to Baloo 2, research D1).

**Constraints**: no runtime request to another host (Principle I); no literal
colors in components (spec 003 FR-019); `client:only="react"` only; the shell
names no game; match and theme schemas unchanged; every spec 003 test keeps
what it asserts.

**Scale/Scope**: 4 screens and 7 overlays restyled; 5 new shell parts
(Mascot, PointsBadge, Medal, Podium, Confetti) and 1 static component (Scene);
~25 new color tokens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | How this plan complies |
|---|---|---|
| **I — Pure Client-Side** *(NON-NEGOTIABLE)* | **PASS** | The font is a file in the build output, served from the app's own origin (D1); no Google Fonts, no CDN. The scene and mascot are inline SVG. A test fails on any external URL in `dist/` CSS or HTML (D9). |
| **II — A Game Is a Plugin** *(NON-NEGOTIABLE)* | **PASS** | Mascot, scene, badge, medal, and podium are shell parts that read only `MatchView`; none names a game. `tests/shell-boundary.test.ts` unchanged and still green. |
| **III — Pure, Tested Rules** *(NON-NEGOTIABLE)* | **PASS** | No rule function changes. Podium grouping (D6) is a pure helper with a unit test. |
| **IV — `client:only` Island** | **PASS** | The scene is static markup in `BaseLayout` (no state, no storage), so it renders at build time on purpose; the island and its fallback are unchanged. `static-build` and `island-directives` tests unchanged in what they assert. |
| **V — TypeScript `strict`** | **PASS** | No change to the contract or schemas; new parts are typed props. |
| **VI — Mobile-First** | **PASS** | 3D buttons keep ≥ 44 px (most grow); the layout test of spec 003 walks every restyled screen at 360×640; reduced motion removes all animation (D7). |
| **VII — Versioned Schema** | **PASS** | No persisted data changes. |
| **VIII — Spec Before Code** *(NON-NEGOTIABLE)* | **PASS** | `spec.md` committed before this plan. Spec 003 research D8 (system font) is amended in the same change that adds the font (D1). |
| **IX — English repo, pt-BR user** | **PASS** | New copy ("pts", the mascot greeting) goes to `src/shell/ui/copy.ts`; everything else in English. |
| **Spec gate / Test gate** | **PASS** | Each FR maps to a test (quickstart table). |

No violation to record.

### Post-design re-check

Re-evaluated after the contracts: drawing the scene in the static layout (D4)
is build-time markup, which Principle IV allows because it holds no match
state; the island stays `client:only`. Adding the font file is not a new stack
layer. All gates still pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-game-style-ui/
├── spec.md
├── plan.md                 # this file
├── research.md             # D1–D10
├── data-model.md
├── quickstart.md
├── prototype.html          # approved visual reference (frozen, not shipped)
├── contracts/
│   ├── visual-tokens.md    # token families, scene, medal, mascot tokens; contrast pairs
│   └── ui-parts.md         # Mascot, PointsBadge, Medal, Podium, Confetti, Scene, button classes
├── checklists/requirements.md
└── tasks.md                # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── assets/fonts/
│   ├── baloo-2-latin-wght-normal.woff2   # 33 kB, variable 400–800 (D1)
│   └── OFL.txt                           # font license, shipped with it
├── layouts/BaseLayout.astro    # + font preload, + <Scene /> behind the page
├── components/
│   ├── Scene.astro             # static sky/night scene, tokens only (D4)
│   └── LoadingFrame.astro      # restyled title
├── styles/
│   ├── global.css              # @font-face, family tokens, scene tokens,
│   │                           # .btn-3d + color modifiers, reduced-motion rule
│   ├── tokens.ts               # themed + fixed tokens, text/large-text/boundary pairs
│   └── tokens.test.ts          # extended (D3)
└── shell/ui/
    ├── copy.ts                 # + points label, greeting
    ├── parts/
    │   ├── styles.ts           # button class lists now map to .btn-3d variants
    │   ├── Mascot.tsx          # the die, optional crown (D5)
    │   ├── PointsBadge.tsx     # "N pts" (FR-011)
    │   ├── Medal.tsx           # gold/silver/bronze/plain (FR-012)
    │   ├── Podium.tsx (+ podium.ts, podium.test.ts)   # D6
    │   ├── Confetti.tsx        # CSS-only pieces (FR-014)
    │   └── …                   # existing parts restyled
    ├── screens/                # restyled; GameList greets, Winner celebrates
    └── *.browser.test.tsx      # + identity.browser.test.tsx (mascot, badge, medals, podium, motion)

tests/
├── static-build.test.ts        # + font served locally, no external URL, size budgets (D9)
└── browser-setup.ts            # + emulateReducedMotion command typing
```

**Structure Decision**: same single Astro project. The look sits in
`global.css` (one place to restyle), the new visuals are shell parts under
`src/shell/ui/parts/`, and the only new `.astro` file is the static scene.

## Complexity Tracking

No constitution violation. One choice recorded for reviewers:

| Choice | Why | Simpler alternative rejected because |
|---|---|---|
| Commit the font file instead of a package | One 33 kB file, Latin only; no dependency to pin, audit, or upgrade | `@fontsource-variable/baloo-2` ships every subset into `dist/` and its CSS pulls them all in; a package for one file is overkill |
