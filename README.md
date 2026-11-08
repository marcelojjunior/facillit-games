# Facillit Games

A platform of **scorekeepers, one per game**. The shell (player registration,
round navigation, cumulative table, persistence) is shared; each game declares
its own scoring rule.

100% client-side: no backend, no API, no authentication. Data only in
`localStorage`.

- **How to work in this repo:** [`AGENTS.md`](AGENTS.md)
- **The rule that governs everything:** [`.specify/memory/constitution.md`](.specify/memory/constitution.md)

## Current state

The rewrite is in progress. Two sets of files coexist at the root:

| | What it is |
|---|---|
| `index.html`, `script.js`, `style.css` | **Frozen POC.** Published and live until the cutover. **Do not apply new bug fixes** — the known bugs are acceptance criteria for the rewrite. |
| `src/`, `tests/`, and the configuration | The new application (Astro). Foundation, game contract, persisted match store, and the game screens in a casual-mobile-game style (3D buttons, sky/night scene, the die mascot) delivered, plus **MECHE-MECHE**, the first game ([`specs/005-meche-meche/`](specs/005-meche-meche/)), playable on `/`. |

The foundation is specified in
[`specs/001-astro-foundation/`](specs/001-astro-foundation/), the game
contract and match store in
[`specs/002-game-contract/`](specs/002-game-contract/), the game-style look
in [`specs/004-game-style-ui/`](specs/004-game-style-ui/), and the design system
and screens in [`specs/003-shell-screens/`](specs/003-shell-screens/). To add a game, read
[`contracts/game-contract.md`](specs/002-game-contract/contracts/game-contract.md).

## Requirements

- **Node `>=22.23.4`.** This is not "current LTS": it is the real floor declared
  by `astro@7.4.4`. Node 25 (odd, non-LTS) is outside Vitest's range.
- **pnpm**, at the `packageManager` version. Use Corepack.

No environment variable, `.env` file, or credential is needed — by principle,
not by accident.

### Browser tests need Chromium, once per machine

`pnpm test` runs two Vitest projects: `unit` (Node) and `browser` (a real
headless Chromium at 360×640, for the `*.browser.test.tsx` files, because
44 px targets and horizontal scroll can only be measured with a layout
engine). `playwright` is pinned at **1.63.0**; install its browser once:

```sh
pnpm exec playwright install chromium
```

Without it, the `browser` project fails with "Executable doesn't exist".

## Playing the screens before a real game exists

The shipped registry is empty until Phase 5. Under `pnpm dev` only, a
development page offers the two test-only games:

```text
http://localhost:4321/dev/test-games
```

Use `pnpm dev --host` and the machine's IP to open it on a phone. The page is
injected by `astro.config.mjs` only for `astro dev`; `pnpm build` never
contains it. Both pages share `localStorage`, so opening `/` discards a test
match with a "game no longer available" notice — expected.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Development server with HMR |
| `pnpm build` | Generates the static artifact in `dist/` |
| `pnpm preview` | Serves `dist/` as static files |
| `pnpm test` | Unit and browser suites, single run |
| `pnpm test:watch` | Suite in watch mode |
| `pnpm typecheck` | Strict-mode type check |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier, writing |
| `pnpm format:check` | Prettier, check only |

The contract of these commands (what each one guarantees, and what it does
**not**) is in
[`specs/001-astro-foundation/contracts/commands.md`](specs/001-astro-foundation/contracts/commands.md).
Phases 3 to 6 depend on these names: renaming them is a breaking change.

> `tests/static-build.test.ts` reads `dist/index.html`. Run `pnpm build` before
> `pnpm test`, or the test fails with instructions to do so. It fails on purpose
> instead of passing empty — a test that passes without an artifact gives false
> confidence.

## Three things that will cost you time if nobody warns you

### 1. TypeScript is on `6.0.x` on purpose. Do not move to the 7 line.

`latest` is `7.0.2`, but the two tools that read our types do not support the 7
line:

```
@astrojs/check@0.9.12      typescript: ^5.0.0 || ^6.0.0
typescript-eslint@8.72.1   typescript: >=4.8.4 <6.1.0
```

The intersection is `6.0.x`. Upgrading now breaks `pnpm typecheck` and
type-aware lint.

**Condition to upgrade**: `@astrojs/check` **and** `typescript-eslint` release
the TS 7 peer. Until then, a careless `pnpm update` breaks the pipeline.

### 2. There is no `tailwind.config.js`. Do not create one.

Tailwind 4 is configured in CSS. Design tokens go in
[`src/styles/global.css`](src/styles/global.css), with `@theme`, and their
values in [`src/styles/tokens.ts`](src/styles/tokens.ts) (a test keeps both in
sync and checks contrast). The 3D buttons are the `btn-3d` classes in the same
file.

The typeface, Baloo 2, is a single self-hosted file in
[`src/assets/fonts/`](src/assets/fonts/) under the SIL Open Font License
(`OFL.txt` beside it). Do not link Google Fonts or any CDN: the app makes no
request to another host (constitution Principle I), and
`tests/static-build.test.ts` fails if `dist/` references one.

The `@astrojs/tailwind` integration **does not work** here: its latest version
declares `astro: ^3||^4||^5` and `tailwindcss: ^3.0.24` — incompatible in two
dimensions with Astro 7 + Tailwind 4. Tailwind comes in as a Vite plugin, in
`astro.config.mjs`.

### 3. `tsconfig.json` excludes the POC on purpose. Removing the `exclude` breaks the typecheck.

The `astro/tsconfigs/base` preset brings `allowJs: true` with
`include: ["${configDir}/**/*"]`. Without the exclusions, the 16 KB of
`script.js` enter the TypeScript program and `pnpm typecheck` starts failing on
errors in a file the constitution forbids fixing.

The same three exclusions exist in `eslint.config.js` and `.prettierignore`. The
Prettier one is the most important: unlike lint, `pnpm format` **writes**.

## Match state must be a `client:only` island

Astro renders at build time, where `localStorage` does not exist. Every screen
with match state **must** be a `client:only` island.

With `client:load` you get a hydration mismatch and an empty-screen flash on
every open — which is the normal use of the app: phone on the table, tab
discarded by the browser. This is Principle IV of the constitution.

This does not depend on you remembering: `tests/static-build.test.ts` runs
against the built HTML and fails if the island (`MatchApp`, the only one)
renders at build time, and `tests/island-directives.test.ts` fails on any
directive other than `client:only="react"`.

## Prettier formats code, not prose

`*.md`, `.specify/`, and `.claude/` are in `.prettierignore`. Reason found in
practice: without it, the first `pnpm format` rewrote 15 documentation files,
including the YAML frontmatter of the Spec Kit skills — which are maintained by
the CLI pinned at 1.2.5, and whose diff the constitution requires being able to
review.

## Language

Code, comments, docs, specs, commits, and PRs are in English. Only what the end
user sees is in Brazilian Portuguese. See constitution Principle IX.

## Favicon and link previews

The favicon is the mascot die (`public/favicon.svg`). The link-preview image
(`public/og.png`, 1200×630) and the iOS home-screen icon
(`public/apple-touch-icon.png`) are rendered from the mascot sprite with the
project's Chromium; regenerate them after changing the mascot or the palette:

```sh
node scripts/render-share-images.mjs
```

On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` (set by Vercel at build time)
makes the share URLs absolute; local builds use relative URLs.

## Deploy

Vercel, static. Astro with `output: 'static'` is detected automatically:
**no adapter, no environment variable, no configuration**.

Creating the project on Vercel is a human step. If `pnpm build` passes locally,
the artifact is ready.
