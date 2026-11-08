# Research: Design system and shell screens

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Each decision lists what was chosen, why, and what was rejected. Decisions are
numbered so tasks and code comments can cite them (`research D3`).

## D1 — A game supplies its round entry as a controlled editor

**Decision**: `GameDefinition<R>` gains a required field `RoundEntry`: a React
component that edits one round as a JSON-serializable value. It receives
`players`, `value: unknown` (the stored draft, or the stored input of the round
being fixed), and `onChange(value: unknown)`. It renders **no submit button**:
the shell owns confirm, save, and cancel. `defineGame` passes the component
through to `Game` unchanged. The contract imports React **as a type only**
(`import type { ComponentType } from 'react'`), so rule modules and the
`node` test environment load no React runtime.

**Rationale**:

- FR-009/FR-010: the shell gets the component from the registry entry of the
  match's game, so it never names a game.
- Owning the confirm action in the shell is what makes FR-017 (one gesture,
  one round) and FR-024 (confirm in thumb reach) enforceable once, for every
  game, instead of trusting each game.
- `value: unknown` matches the store: drafts and stored rounds are `unknown`
  (spec 002 FR-018a). The game parses it with its own helper and falls back to
  an empty entry on anything it does not recognise (FR-012). No `any` crosses
  the contract (Principle V).
- The entry never touches storage (FR-010): every `onChange` becomes a store
  `updateDraft` (typing) or a local working value (fixing, D6).

**Alternatives rejected**:

- *A declarative field schema (the game lists inputs, the shell renders a
  form)*: MECHE-MECHE's round is not known to be a form; a schema language
  grows into a UI framework and every new input kind changes the shell —
  exactly what Principle II forbids.
- *A separate `src/games/round-entries.ts` map keyed by id*: a second registry
  that can drift from the first; and it is a second file naming games.
- *The entry renders its own submit*: each game would reimplement the
  double-submit guard and the sticky placement.

## D2 — The shell ranks players by repeated `resolveWinners`

**Decision** (revised during implementation): `Evaluation` (the result of
`Game.evaluate`) gains `positions`, each player's position keyed by player id,
and the store's `MatchView.evaluation` passes it through. It is computed in
`defineGame` by peeling winners: position 1 is
`resolveWinners(totals, all)`, position 2 is `resolveWinners(totals,
remaining)`, and so on. Players tied in a peel share the position (standard
competition ranking: 1, 1, 3).

**Why `evaluate` and not a separate `Game.rank`** (the first version of this
decision): `evaluate` already special-cases zero rounds (everyone wins); a
separate `rank(totals)` could not see the round count and would have
duplicated that rule in the shell. The first peel reuses the winners
`evaluate` already resolved.

**Rationale**: the compact standings (FR-004) show a position, but only the
game knows whether highest or lowest wins (spec 002 FR-006). Peeling reuses the
game's own pure function, so no new rule function is added to the contract and
no game has to change for ranking. It is pure and testable in `node`.

**Alternatives rejected**: a `direction: 'highest' | 'lowest'` field (a game
may rank by something else, e.g. fewest penalties then most points); sorting by
total in the shell (silently wrong for lowest-wins games).

## D3 — One island, screens selected by `status`

**Decision**: a single React island `MatchApp` rendered with
`client:only="react"` on the only page. It creates the store once (lazy
`useState` initializer), reads it with `useSyncExternalStore`, and selects the
screen from `getState()?.match.status` (FR-001). No client router, no URL
state: there is one match and the screen is a pure function of it.

**Rationale**: the store already guarantees a stable snapshot between
operations (match-store contract), which is what `useSyncExternalStore` needs.
The store reads storage synchronously when created, so the first client render
is already the right screen — no initial-screen flash (SC-003).

**Alternatives rejected**: one Astro page per screen (navigation would re-create
the store and each page would need its own island; the URL could disagree with
the stored `status`); a router library (a dependency for zero URL needs).

## D4 — The loading frame is the island's fallback slot

**Decision**: the page passes a static neutral frame (app header plus an empty
content area, no game list, no buttons) through Astro's `slot="fallback"` of
the `client:only` island (FR-030). `tests/static-build.test.ts` is repointed:
it asserts the fallback marker **is** in `dist/index.html` and the app marker
(`data-testid="match-app"`) and any screen copy are **not** (FR-026).

**Rationale**: without a fallback, the gap before hydration is a blank page;
with a fallback that looks like the game list, a reopened match would look
lost for a moment. A neutral frame is honest in both cases.

## D5 — Development-only page for the test-only games

**Decision**: a tiny local Astro integration in `astro.config.mjs` calls
`injectRoute` **only when `command === 'dev'`**, adding `/dev/test-games`. Its
entrypoint lives in `tests/fixtures/dev/` and renders a `DevMatchApp` island
that imports `MatchApp` from `src/` and passes it `testRegistry`. Production
builds never see the route, so the fixtures never reach `dist/` (existing
artifact guard, FR-029). `src/` still never imports `tests/` (spec 002 FR-025).

**Rationale**: clarification Q1 (manual play in dev only). The mechanism keeps
both guards intact without any `import.meta.env.DEV` branch inside `src/`.

**Consequence recorded**: dev and production pages share the storage key on
the same origin (`localhost`). A test-game match opened on `/` in dev is
discarded with the `unknown_game` notice — the designed behaviour, and only in
development.

**Alternatives rejected**: `import.meta.env.DEV ? fixtures : []` in
`src/games/registry.ts` (makes `src/` import `tests/`, and relies on dead-code
elimination to keep fixtures out of the artifact); a demo page in production
(rejected by Q1).

**Spec impact**: FR-029a is reworded in the same change to say "a
development-only page offers the test-only games".

## D6 — Fixing a round uses a local working value

**Decision**: opening a round for fixing copies its stored input into React
state; edits change only that state; save calls `replaceRound(index, value)`;
cancel drops it. The draft of the round being typed is never touched (FR-011).
A reload while fixing returns to the in-progress screen with the draft intact
and the fix discarded.

**Rationale**: persisting an in-progress fix needs a new field in the match
schema (Principle VII bump) for a seconds-long interaction. The draft — the
thing that costs effort to retype — is already persisted.

**Spec impact**: SC-003 is reworded in the same change: a reload while fixing
keeps every round and the draft; the unsaved fix is not restored.

## D7 — Theme: tokens as CSS variables, a pre-paint inline script

**Decision**:

- Tokens live in `src/styles/global.css` under Tailwind 4 `@theme` as CSS
  variables (`--color-surface`, `--color-ink`, `--color-accent`, …, spacing,
  radius, type scale). Color token names carry no numeric suffix
  (`surface-raised`, not `surface-100`), so the literal-color check can
  recognise Tailwind's default palette classes without false positives. Dark values override the same variables under
  `[data-theme='dark']`. A custom variant
  `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`
  keeps `dark:` available for rare cases. Components use token utilities only;
  a test fails on literal color utilities (`bg-[#…]`, `text-red-500`) in
  `src/` (FR-019).
- `BaseLayout` carries a `<script is:inline>` in `<head>` that reads the theme
  preference, resolves `auto` with `matchMedia('(prefers-color-scheme: dark)')`,
  and sets `data-theme` on `<html>` before first paint (FR-020, SC-008). The
  script body is produced from `src/shell/theme/boot.ts` at build time, so its
  parsing logic is one tested function, not a hand-copied string.
- The preference module (`src/shell/theme/preference.ts`) reads and writes
  `facillit-games:theme` = `{ "schemaVersion": 1, "theme": "auto" | "light" |
  "dark" }`, with the same safe-access pattern as match persistence; anything
  else reads as `auto` with no notice (FR-020a).
- In `auto`, a `matchMedia` change listener re-applies the theme live.

**Rationale**: an inline script is the only way to avoid a flash of the wrong
theme in a static page. It is not match state, so Principle IV does not apply;
it reads only the theme key.

**Alternatives rejected**: `prefers-color-scheme` media queries alone (cannot
honour a stored override); setting the theme from the React island (paints the
fallback in the wrong theme first).

## D8 — System font, inline SVG icons

**Decision**: the system UI font stack and a handful of inline SVG icons as
React components. No web font, no icon font, no CDN (Principle I; the POC's
Google Fonts and Font Awesome links are not carried over).

**Superseded for the typeface** by spec 004 research D1: the app now ships a
self-hosted Baloo 2 file (still no font host at runtime). The icons part of
this decision stands.

## D9 — Dialogs with native `<dialog>`

**Decision**: confirmations (finish, abandon, remove last round), the full
history, the rename form, and the fix-round sheet use `<dialog>` opened with
`showModal()`: focus trapping, `Esc`, and the backdrop come from the browser.
One small `Dialog` component wraps it.

**Alternatives rejected**: a headless UI library (dependency for four
dialogs); hand-rolled overlays (focus management bugs on mobile).

## D10 — Layout of the in-progress screen

**Decision**: a header (round number, finish, theme control, overflow menu),
the compact standings, the game's round entry, and a bottom action bar fixed to
the viewport bottom with the confirm button (FR-024). The overflow menu holds:
full history, rename player, remove last round, abandon match. The theme
control sits in the shared app header, so it is reachable from every screen
(FR-020), not only from the in-progress menu. Finishing
with zero rounds is allowed (spec 002 permits it; everyone ties, edge case).

**Rationale**: the confirm action is the most repeated tap (Principle VI); a
fixed bottom bar keeps it in thumb reach whatever the entry's height. Rare
actions move to the menu to keep the screen short.

**Found during implementation**: a rejection listed in the page flow, under
the round entry, ended up behind the fixed bar with three or more players, so
an invalid tap looked like it did nothing. The rejection list now sits inside
the bar, above the button. Also, Astro's dev toolbar floats over the same
bottom-center spot and swallowed taps on the confirm button under `pnpm dev`;
it is disabled in `astro.config.mjs` (`devToolbar.enabled: false`).

The full history is not in the overflow menu: a visible "Ver histórico"
button sits on the standings header, and a tap anywhere on the standings
opens it too (FR-004a asks for one tap). The menu keeps rename and remove last
round (and abandon, US4).

## D11 — Double-submit guard

**Decision**: the confirm handler holds a ref lock set on press and released on
the next animation frame after the store notifies; while locked, presses are
ignored. Confirm is also disabled when there is no draft.

**Rationale**: store operations are synchronous, but two `click` events can be
queued before React commits; the second would submit the cleared draft and
show a spurious rejection. The lock is cheap and testable with two dispatched
clicks.

## D12 — Copy lives in one typed module

**Decision**: `src/shell/ui/copy.ts` exports `errorCopy: Record<MatchError
['code'], string>` and `discardCopy: Record<DiscardNotice['reason'], string>`.
`Record` over the union makes a new code without copy a type error; a unit
test also asserts every value is a non-empty Portuguese string (SC-005).

## D13 — Browser tests with Vitest browser mode

**Decision**: add a second Vitest project, `browser`, using
`@vitest/browser-playwright` (same major as `vitest` 5.0.5) with Chromium,
for files named `*.browser.test.tsx`. These render `MatchApp` with the test
registry and a real `localStorage`, at a 360×640 viewport, and cover: a full
match per fixture game (SC-001), remount restores the same screen and draft
(SC-003), touch targets ≥ 44×44 (SC-004), no horizontal overflow (SC-007),
confirm button inside the viewport (SC-002), and theme switching (SC-008).
Contrast (SC-004) is checked by a pure unit test over the token pairs, not by
screenshots. The existing `node` project keeps rules, store, copy, theme, and
source-scanning tests.

**Rationale**: spec 001's plan deferred a browser test to "Phase 4, when there
is a screen that justifies the cost". jsdom has no layout, so sizes and
overflow cannot be measured there. Browser mode needs no dev server.

**Cost recorded**: a Chromium download for local runs (`playwright install
chromium`), and a few seconds per run.

**Found during implementation**: Vitest skips CSS by default and the
stylesheet is imported only by `BaseLayout.astro`, so browser tests rendered
unstyled markup and size checks measured nothing real. The browser project
now sets `css: true` and loads `src/styles/global.css` from
`tests/browser-setup.ts`.

**Bundle measured (T050, 2026-11-08)**: the island ships three files; gzip -9
sizes are 65.7 kB (React DOM client), 8.9 kB (`MatchIsland`: the shell
screens), and 3.0 kB (React), **77.6 kB in total**, under the 80 kB goal of
the plan. Almost all of it is React itself, so the margin is thin: a new
runtime dependency in the island needs a measurement before it lands.

**Alternatives rejected**: Playwright Test against `astro dev` (needs a server
and the dev-only page; slower, two runners); jsdom + Testing Library (cannot
measure layout, which is half of what Principle VI asks).

## D14 — Hydration rule as a source-scanning test

**Decision**: `tests/island-directives.test.ts` scans every `.astro` file under
`src/` and fails on any `client:load`, `client:idle`, `client:visible`,
`client:media`, or `server:defer` directive, and on any `client:only` whose
value is not `"react"`. (FR-028; deferred here by spec 002, research D7.)

**Rationale**: the app has exactly one island and it holds match state, so a
blanket rule is both simpler and stricter than tracing which component imports
the store. If a stateless island is ever needed, the rule gets an allow-list
with a reason.

## D15 — Contrast verified from tokens

**Decision**: `src/styles/tokens.ts` exports the color token values (the single
source); `global.css` is checked against it by a test, and a contrast test
computes WCAG ratios for every declared foreground/background pair in both
themes: ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries (FR-021).

**Alternatives rejected**: an axe run in the browser project (checks rendered
DOM only for elements present in the test, and needs another dependency).
