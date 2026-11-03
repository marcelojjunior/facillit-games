# Phase 0 — Research: Technical foundation and static pipeline

**Feature**: `specs/001-astro-foundation/`
**Date of survey**: 2026-11-02
**Method**: direct query to the registry (`npm view`) and inspection of the
published tarball, not model memory. All versions below were read from the
registry on this date.

> **Why this matters.** The constitution fixes the stack by *layer name*
> (Astro, TypeScript, Tailwind, React, Vitest, pnpm), not by version. The
> version choice belongs to this phase, and three of the "obvious" combinations
> do not work. What follows is the result of verifying instead of assuming.

---

## Decision 1 — TypeScript stays on `6.0.3`, not on `latest` (`7.0.2`)

**Decision**: pin `typescript@6.0.3`.

**Rationale**: `latest` is `7.0.2`, but the two tools that need to read our
types do not support the 7 line yet:

| Package | Declared peer on `typescript` | Accepts 6.0.3? | Accepts 7.0.2? |
|---|---|---|---|
| `@astrojs/check@0.9.12` | `^5.0.0 \|\| ^6.0.0` | yes | **no** |
| `typescript-eslint@8.72.1` | `>=4.8.4 <6.1.0` | yes | **no** |

The intersection of the two ranges is exactly `6.0.x`. `6.0.3` is the highest
stable release of that line (`6.1.x` would already break the
`typescript-eslint` ceiling).

**Alternatives considered**:

- **`typescript@7.0.2` (the `latest`)** — rejected. It would break `astro check`
  and type-aware lint. It would deliver a foundation in which the type check
  command does not run, which is the opposite of the phase's goal.
- **`typescript@5.9.x`** — rejected. Also compatible, but gives up a major's
  worth of improvements for no gain; `6.0.3` is the compatible ceiling and is
  stable.
- **Giving up `typescript-eslint`** to be able to use TS 7 — rejected. It would
  trade type-aware lint (what actually catches implicit `any` and unawaited
  promises, required by Principle V) for a bigger version number. Bad deal.

**Recorded consequence**: `typescript` is pinned with range `~6.0.3`, and moving
to the 7 line becomes a decision that depends on `@astrojs/check` and
`typescript-eslint` releasing the peer. This goes into the foundation `README`.

---

## Decision 2 — Tailwind comes in via `@tailwindcss/vite`, and `@astrojs/tailwind` is out

**Decision**: `tailwindcss@4.3.3` + `@tailwindcss/vite@4.3.3`, registered as a
Vite plugin inside `astro.config.mjs`. Styles imported via `@import
"tailwindcss"` in a global CSS.

**Rationale**: the historical `@astrojs/tailwind` integration no longer works.
Its last published version is `6.0.2`, and the peers are:

```
astro:       ^3.0.0 || ^4.0.0 || ^5.0.0      (we are on Astro 7)
tailwindcss: ^3.0.24                          (we want Tailwind 4.3.3)
```

That is, it is incompatible in **two** dimensions at once. Tailwind 4 dropped
the PostCSS pipeline with `tailwind.config.js` in favor of a bundler plugin and
CSS-based configuration; the supported path in Astro is registering
`@tailwindcss/vite` in `vite.plugins`.

**Alternatives considered**:

- **`@astrojs/tailwind` + Tailwind 3** — rejected. It would require holding
  Tailwind one major behind and even so the `astro` peer does not close with
  Astro 7. It would be debt born ready-made, right in the file that Phase 4
  (design system) will touch the most.
- **Manual PostCSS with `@tailwindcss/postcss`** — rejected. It works, but adds
  a configuration file and a pipeline step with no gain over the Vite plugin,
  which Astro already loads.

**Inherited gotcha**: there is no `tailwind.config.js` in this project. Whoever
reaches Phase 4 looking for it and does not find it should read this: the design
tokens go in CSS, with `@theme`. Recorded in the foundation `README`.

---

## Decision 3 — `tsconfig` extends `astro/tsconfigs/strictest`, and excludes the POC explicitly

**Decision**: `extends: "astro/tsconfigs/strictest"`, with an explicit `exclude`
of `script.js`, `index.html`, `style.css` and `dist`.

**Rationale**: two findings from inspecting the Astro 7.4.4 tarball.

**(a) `strictest` is a useful superset, not noise.** The published presets are
`base` → `strict` → `strictest`. `strict` only adds `strict: true`.
`strictest` adds, among others, `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`. These two are exactly the guards Phase 3 will want
when reading possibly corrupted `localStorage` payload (Principle VII mandates
degrading safely) and when modeling the `GameDefinition` contract without `any`
(Principle V). Adopting `strictest` now is cheaper than tightening later, when
there is already code written against the looser rule.

**(b) `astro/tsconfigs/base` contains a trap aimed squarely at the POC
freeze.** The preset ships:

```json
"allowJs": true,
"include": ["${configDir}/.astro/types.d.ts", "${configDir}/**/*"]
```

With `allowJs: true` and an `include` of `**/*`, the POC's `script.js` — 16 KB
of 2026 JavaScript with no typing at all — enters the TypeScript program.
`astro check` would start failing on errors in a file the constitution forbids
fixing (Development Workflow, Git conventions: *"it MUST NOT receive new bug fixes"*).
It would be a deadlock: the type command would only pass by violating the
freeze.

The way out is an explicit `exclude`. This is the real reason behind FR-015,
which in the spec looked like mere formatting hygiene.

**Alternatives considered**:

- **`astro/tsconfigs/strict`** — rejected because of (a). It meets the
  constitution to the letter, but leaves on the table, for free, the guards
  Phase 3 will ask for.
- **`allowJs: false` instead of `exclude`** — rejected. It would solve
  `script.js` by accident, but in a fragile way: any legitimate `.js` we may come
  to need (a config file, for example) would break again, and the real reason
  would be invisible. `exclude` names the POC and documents the intent.
- **Moving the POC to a subfolder** — rejected. The POC is published on GitHub
  Pages serving from the root; moving it is the Phase 6 cutover, not this phase.

---

## Decision 4 — Vitest uses `getViteConfig` from `astro/config`

**Decision**: `vitest.config.ts` with `getViteConfig({ test: { ... } })`,
imported from `astro/config`.

**Rationale**: confirmed by tarball inspection — `astro@7.4.4` exports
`./config` → `dist/config/entrypoint.js`, which re-exports
`{ defineConfig, getViteConfig }`. Using this helper makes the tests inherit the
project's module resolution, aliases and plugins (including
`@tailwindcss/vite` and React's JSX), instead of maintaining a second bundler
configuration that would inevitably diverge.

This meets FR-010 ("the tests MUST resolve the project's TypeScript modules
without additional per-test configuration") by construction, not by trial.

**Alternatives considered**:

- **Standalone `vitest.config.ts` with Vitest's `defineConfig`** — rejected. It
  works today for a pure function, but duplicates module resolution. The moment
  Phase 3 has a test that imports a module with an alias, the two configurations
  diverge and the error shows up far from the cause.
- **`jsdom` environment for the whole suite** — rejected as the default. The
  scoring rules of Principle III are pure functions: forbidden from touching the
  DOM. Running the whole suite in `jsdom` would hide a violation precisely where
  it matters — a rule that touches the DOM would pass the test. The default is
  `node`; `jsdom` stays available to be requested per file, via an environment
  comment, when a component test needs it.

---

## Decision 5 — React 19 with `@astrojs/react@7.1.2`, and a peer that must NOT be declared

> **Corrected during implementation.** The first version of this decision
> mandated declaring `oxc-transform-react@^0.156.0` explicitly, due to two
> reading errors — both caught by `pnpm install`. The correction is below, with
> the error preserved, because the error is the instructive part. Principle VIII
> requires updating the spec in the same PR when reality contradicts it.

**Decision**: `@astrojs/react@7.1.2` + `react@19.3.1` + `react-dom@19.3.1` +
`@types/react@19.3.0` + `@types/react-dom@19.3.0`. **`oxc-transform-react`
is not declared.**

**Rationale**: the peers of `@astrojs/react@7.1.2` are:

```
react, react-dom:               ^17.0.2 || ^18.0.0 || ^19.0.0
@types/react, @types/react-dom: ^17.0.50 || ^18.0.21 || ^19.0.0
oxc-transform-react:            ^0.145.0   (optional: true)
```

React 19 is within range. The item that drew attention was
`oxc-transform-react`, and the two errors were these:

**Error 1 — `^` on a `0.x` version does not do what it looks like.** The
original note said that `0.156.0` satisfies `^0.145.0`. It does not: for `0.x`
versions, the caret locks the **minor**, so `^0.145.0` means
`>=0.145.0 <0.146.0` — a single version. Declaring `0.156.0` created a peer
warning immediately.

**Error 2 — and there is no version that resolves it.** While investigating the
warning, a deeper conflict showed up: `@astrojs/react@7.1.2` depends on
`@vitejs/plugin-react@^6.1.2`, whose peer is `oxc-transform-react: ^0.152.0`
(`>=0.152.0 <0.153.0`). The two ranges are **disjoint** — `^0.145.0` and
`^0.152.0` have no intersection. No single version satisfies both. It is an
upstream inconsistency: `@astrojs/react` declares a peer one minor behind what
its own dependency requires.

**The way out is not to declare it.** Both declarers mark
`peerDependenciesMeta: { 'oxc-transform-react': { optional: true } }`. The peer
is optional in both: nothing requires it, the build works without it, and
declaring it was the only way to *create* an unsolvable warning. After removing
it, `pnpm peers check` answers "No peer dependency issues found", and
`pnpm build`, `pnpm test` and `pnpm typecheck` pass.

**The lesson that holds for the following phases**: the temptation here was to
be meticulous — "declaring the peer explicitly is more rigorous than relying on
`auto-install-peers`". The reasoning sounded good and was wrong on two levels.
Reading `peerDependenciesMeta` before declaring any peer costs one query and
avoids both.

**Alternatives considered**:

- **Declare `oxc-transform-react@0.145.0`** (satisfying `@astrojs/react`) —
  rejected. It leaves `@vitejs/plugin-react`, which is what actually uses the JSX
  transform, with an unsatisfied peer. It would solve the declaration and not
  reality.
- **Declare `oxc-transform-react@0.152.0`** (satisfying
  `@vitejs/plugin-react`) — rejected as the mirror of the previous one: it
  erases the warning that matters and keeps the other. Any choice here leaves a
  permanent warning on `install` for a peer nobody needs.
- **Preact instead of React** — rejected. It would be lighter and tempting for a
  mobile-first app, but the constitution fixes React in `Additional
  Constraints`. Changing it requires an amendment, and there is no technical
  reason in this phase to propose one.

---

## Decision 6 — Node: the real floor is `22.23.4`, not "current LTS"

**Decision**: declare `engines.node: ">=22.23.4"` and pin pnpm via
`packageManager`.

**Rationale**: read from the registry:

- `astro@7.4.4` → `engines: { node: ">=22.23.4", npm: ">=9.6.5", pnpm: ">=7.1.0" }`
- `vitest@5.0.5` → `engines: { node: "^22.12.0 || ^24.0.0 || >=26.0.0" }`

The effective floor is Astro's. This machine's environment is Node `v24.22.2`
and pnpm `11.23.0`, both within range — but Vitest's range has a detail worth
recording: it is a list of majors, not a `>=`. Node 25 (odd, non-LTS) is
**out**. Declaring the floor in `package.json` makes `install` warn instead of
failing obscurely later.

`packageManager` meets FR-004 and makes Corepack use the reviewed version,
instead of producing a dependency tree different from the one that passed
review.

**Alternatives considered**:

- **Not declaring `engines`** — rejected. It hands the next developer the
  discovery of a floor that has already cost a query.
- **Declaring `engines.node: ">=22"`** — rejected for being false:
  `22.0`–`22.23.3` do not satisfy Astro.

---

## Decision 7 — The `client:only` island proof is a test, not just a component

**Decision**: deliver (a) a trivial `client:only` island that reads a
browser-only API and (b) an **automated test that runs the build and asserts
that this island's markup is not in the generated HTML**.

**Rationale**: FR-012 asks for the probe component, and the spec already notes
that the component is disposable but the test is not. The reason: a probe
component is documentation, and documentation does not prevent regression. If
someone in Phase 5 swaps `client:only` for `client:load` — which is the most
likely failure, because `client:load` is the default every tutorial shows —
nothing complains. The build passes. The defect shows up as a "flash of empty
screen", on a phone, on top of the table, far from whoever wrote the line.

A test that reads the built HTML and requires the markup to be absent turns
Principle IV into something that fails in CI. It is the difference between a
written principle and an enforced principle.

This test is also what makes `pnpm test` more than trivial, meeting FR-009
(“at least one test that actually executes”) with substance instead of an
`expect(true).toBe(true)`.

**Alternatives considered**:

- **Only the component, no test** — rejected for the reason above. It was the
  shortest path and would leave the trap exactly as alive as before.
- **Real browser test (Playwright) checking for the absence of hydration
  mismatch** — rejected for this phase. It is the most faithful check, but
  brings a browser runner, binaries and CI time to a phase whose goal is the
  shell. The spec already records in Assumptions that the console check is
  manual here. It stays as an honest candidate for Phase 4, when there is a real
  screen to make the cost worthwhile.
- **Lint rule forbidding `client:load`** — considered and **deferred**, not
  rejected. It is complementary and probably right, but writing an ESLint rule
  for an Astro template directive is a research effort of its own, and Principle
  IV only applies to components that read match state — which do not exist in
  this phase. Recorded as a recommendation for Phase 3, when the store is born
  and the rule can be written against a concrete target.

---

## Surveyed versions (2026-11-02)

| Package | `latest` on the registry | Adopted | Reason for diverging from `latest` |
|---|---|---|---|
| `astro` | 7.4.4 | 7.4.4 | — |
| `@astrojs/react` | 7.1.2 | 7.1.2 | — |
| `@astrojs/check` | 0.9.12 | 0.9.12 | — |
| `react` / `react-dom` | 19.3.1 | 19.3.1 | — |
| `@types/react` / `-dom` | 19.3.0 | 19.3.0 | — |
| `oxc-transform-react` | 0.156.0 | **not installed** | `optional` peer with disjoint ranges upstream (Decision 5) |
| `@types/node` | 26.6.6 | 24.19.2 | found during implementation; see below |
| `tailwindcss` | 4.3.3 | 4.3.3 | — |
| `@tailwindcss/vite` | 4.3.3 | 4.3.3 | replaces `@astrojs/tailwind` (Decision 2) |
| `typescript` | **7.0.2** | **6.0.3** | ceiling of `@astrojs/check` and `typescript-eslint` (Decision 1) |
| `vitest` | 5.0.5 | 5.0.5 | — |
| `eslint` | 10.14.0 | 10.14.0 | — |
| `typescript-eslint` | 8.72.1 | 8.72.1 | — |
| `eslint-plugin-astro` | 3.2.1 | 3.2.1 | peers: `eslint>=10`, `typescript-eslint>=8.61` — they close |
| `prettier` | 3.9.10 | 3.9.10 | — |
| `prettier-plugin-astro` | 1.1.2 | 1.1.2 | — |
| `jsdom` | 30.1.3 | 30.1.3 | available per file, not default (Decision 4) |

**`@astrojs/tailwind`**: last published `6.0.2`. **Not adopted** — peers
incompatible in two dimensions (Decision 2).

---

## Unknowns — resolved during implementation

No `NEEDS CLARIFICATION` from the Technical Context remained open.

The two execution uncertainties recorded in Phase 0 were resolved. They stay
here with the real outcome, not with the question — leaving them "open" after
being answered would make the next person repeat the investigation.

1. **a11y peers of `eslint-plugin-astro@3.2.1`** — ✅ **nothing to declare.**
   `pnpm install` did not require `eslint-plugin-jsx-a11y` nor
   `eslint-plugin-jsx-a11y-x`, and `pnpm peers check` answers "No peer
   dependency issues found". The apparent redundancy in the declared peers does
   not translate into an installation requirement. The guess of declaring both
   would have added two unnecessary dependencies.

2. **`astro check` with `typescript@6.0.3`** — ✅ **works.** `pnpm typecheck`
   runs and reports `Result (8 files): 0 errors, 0 warnings, 0 hints`. The
   contingency plan (dropping to `typescript@5.9.x`) was **not** needed and is
   recorded only as a pre-approved response in case a future update breaks the
   combination. Under no circumstances relax `strict` — that would violate
   Principle V.

---

## Implementation findings (not foreseen in Phase 0)

Five things that only showed up when running the commands. Recorded because all
of them would cost time to whoever repeated the path.

1. **`@types/node` is required and does not come transitively.** The tests use
   `node:fs` and `node:url`; without `@types/node`, `astro check` fails with
   `ts(2591)`. Adopted `24.19.2` (line `^24`) instead of the `latest` `26.6.6`,
   to match the environment's Node 24 — types one major ahead of the runtime
   describe APIs that do not exist at execution time.

2. **`getViteConfig` does not type the `test` key.** It returns Vite's
   `UserConfig`, which does not know `test`, and typecheck fails with
   `ts(2353)`. The fix is `/// <reference types="vitest/config" />` at the top
   of `vitest.config.ts`. This does not weaken Decision 4 — the helper is still
   the right way to inherit module resolution; it just needs the types
   reference.

3. **`tseslint.config()` is deprecated in `typescript-eslint@8.72.1`.** Using it
   makes `astro check` report a `ts(6387)` hint on every typecheck. The
   replacement is `defineConfig` from `eslint/config`, which ESLint 10 already
   provides. With it, typecheck stays at `0 hints`.

4. **Type-aware lint rules leak into the `.astro` files and bring down
   `pnpm lint`.** Spreading `...tseslint.configs.recommendedTypeChecked` at the
   root of the flat config makes the typed rules reach `.astro` files, which use
   `astro-eslint-parser`. That parser does not pass `parserOptions.project` on
   to `@typescript-eslint/parser`, and ESLint dies with an infrastructure error
   (`exit 2`, "you have used a rule which requires type information") instead of
   pointing to a code defect. The fix is to scope the typed preset inside a
   `files: ['**/*.{ts,tsx}']` block with `extends`, and let
   `astro.configs.recommended` handle the `.astro` files without types.

5. **`pnpm format` reaches far more than code, and that is harmful here.** On
   the first run, Prettier rewrote 15 documentation files — including
   `.claude/skills/speckit-*/SKILL.md` with the YAML frontmatter *quoting*, and
   the `AGENTS.md` tables stretched to more than 100 columns. The Spec Kit files
   are maintained by the CLI pinned at 1.2.5, and the constitution requires
   being able to review the `init` diff; reformatting them makes that diff
   unreadable. Decision: `.prettierignore` now excludes `*.md`, `.specify/` and
   `.claude/` — **Prettier formats code in this repository, not prose.** Line
   wrapping in documentation is the writer's decision.

   Worth noting what did *not* happen: the POC (`index.html`, `script.js`,
   `style.css`) came out of the first run intact, with an identical hash. The
   three exclusion lines foreseen in FR-016 worked. The leak was in files that
   Phase 0 had not thought to protect.
