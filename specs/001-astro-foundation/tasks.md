---

description: "Task list for 001-astro-foundation"
---

# Tasks: Technical foundation and static pipeline

**Input**: Design documents from `/specs/001-astro-foundation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/commands.md](./contracts/commands.md)

**Tests**: included. Not a TDD preference — the spec asks for them as a requirement
(FR-008, FR-009, FR-012) and [research.md, Decision 7](./research.md) elevates the
`client:only` island proof to an automated test.

**Organization**: grouped by user story, in the spec's priority order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (separate files, no pending dependency)
- **[Story]**: the user story the task belongs to (US1–US4)
- Paths are relative to the repository root

## Rule that applies to every task in this list

**`index.html`, `script.js` and `style.css` are untouchable.** No task below
edits them, and the tool configuration tasks must actively exclude them — the
default of at least two tools would include them. See
[research.md, Decision 3](./research.md).

---

## Phase 1: Setup

- [X] T001 Create `package.json` at the root with `name: "facillit-games"`,
  `type: "module"`, `private: true`, `engines.node: ">=22.23.4"` (the real floor of
  `astro@7.4.4`, not "current LTS") and `packageManager: "pnpm@11.23.0"` per
  FR-004 and [research.md, Decision 6](./research.md)

- [X] T002 Declare in `package.json` the 10 contract scripts, with exactly the
  names from [contracts/commands.md](./contracts/commands.md): `dev`, `build`,
  `preview`, `typecheck`, `test`, `test:watch`, `lint`, `format`,
  `format:check`. **`test` MUST be `vitest run`** (a single pass), never `vitest`
  — a `pnpm test` that enters watch mode hangs CI and hangs agent sessions
  (contract invariant 1)

- [X] T003 Install runtime dependencies at the versions established in
  [research.md](./research.md): `astro@7.4.4`, `@astrojs/react@7.1.2`,
  `react@19.3.1`, `react-dom@19.3.1`, `tailwindcss@4.3.3`,
  `@tailwindcss/vite@4.3.3`. **Do not** install `@astrojs/tailwind`: its peers
  are `astro: ^3||^4||^5` and `tailwindcss: ^3.0.24`, incompatible in two
  dimensions (Decision 2)

- [X] T004 Install development dependencies: `typescript@~6.0.3`
  (**not** the `latest` `7.0.2` — ceiling of `@astrojs/check` and `typescript-eslint`,
  Decision 1), `@astrojs/check@0.9.12`, `@types/react@19.3.0`,
  `@types/react-dom@19.3.0`, `oxc-transform-react@^0.156.0` (explicit peer of
  `@astrojs/react`, declared so as not to depend on `auto-install-peers`, Decision
  5), `vitest@5.0.5`

- [X] T005 Install quality tools: `eslint@10.14.0`,
  `typescript-eslint@8.72.1`, `eslint-plugin-astro@3.2.1`, `prettier@3.9.10`,
  `prettier-plugin-astro@1.1.2`. `eslint-plugin-astro@3.2.1` declares a11y peers
  (`eslint-plugin-jsx-a11y` **and** `eslint-plugin-jsx-a11y-x`) that look
  redundant: install **whatever `pnpm install` requires** and record the
  result in `research.md § Unknowns` instead of guessing

- [X] T006 Update `.gitignore` adding `node_modules/`, `dist/` and
  `.astro/`, and confirm that `pnpm-lock.yaml` is **not** ignored (FR-004 requires
  the lockfile to be versioned)

- [X] T007 Run `pnpm install` and confirm it finishes without an unmet peer
  warning. A peer warning here is a defect, not noise: it is the symptom of
  incomplete T004/T005

**Checkpoint**: `pnpm install` passes from the versioned tree.

---

## Phase 2: Foundational

**Blocks all user stories.** Without these files no command runs.

- [X] T008 Create `astro.config.mjs` with `defineConfig` from `astro/config`,
  `output: 'static'` (Principle I), the `react()` integration from `@astrojs/react`, and
  `vite.plugins: [tailwindcss()]` importing from `@tailwindcss/vite`. **No
  adapter** — an adapter would introduce a server runtime and violate FR-002

- [X] T009 Create `tsconfig.json` with `extends: "astro/tsconfigs/strictest"`
  (superset of `strict: true`, brings `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` for Phase 3) and an **explicit** `exclude` of
  `script.js`, `index.html`, `style.css`, `dist`, `node_modules`.
  **The `exclude` is not hygiene, it is a blocker**: the `astro/tsconfigs/base` preset brings
  `allowJs: true` with `include: ["${configDir}/**/*"]`, which drags the 16 KB of
  `script.js` into the TypeScript program; without `exclude`, `pnpm typecheck` would only
  pass by fixing the POC, which the constitution forbids (Decision 3)

- [X] T010 [P] Create `src/styles/global.css` with `@import "tailwindcss";` and nothing
  else. **Do not create `tailwind.config.js`** — Tailwind 4 is configured through CSS
  (`@theme`), and an empty config file would send Phase 4 to the wrong place

- [X] T011 [P] Create `src/layouts/BaseLayout.astro` with `lang="pt-BR"`,
  `<meta name="viewport" content="width=device-width, initial-scale=1">` and
  an import of `../styles/global.css`. Mobile-first is Principle VI; this phase does not
  deliver layout, but it cannot be born with the wrong viewport

- [X] T012 Create `vitest.config.ts` using `getViteConfig` from `astro/config`
  (export confirmed in `astro@7.4.4`), with `test.environment: 'node'`.
  **`node`, not `jsdom`** — a scoring rule is a pure function forbidden from touching
  the DOM (Principle III); running the suite in `jsdom` by default would hide
  exactly that violation (Decision 4). `test.include` covering
  `tests/**/*.test.ts` and `src/**/*.test.ts`

- [X] T013 [P] Create `eslint.config.js` (flat config) composing
  `typescript-eslint` with type-aware checking and `eslint-plugin-astro`, with
  `ignores` for `dist`, `.astro`, `node_modules`, `index.html`, `script.js`,
  `style.css` (FR-015)

- [X] T014 [P] Create `.prettierrc.json` with `plugins:
  ["prettier-plugin-astro"]`, and `.prettierignore` listing `dist`, `.astro`,
  `pnpm-lock.yaml`, `index.html`, `script.js`, `style.css`.
  **The `.prettierignore` is the POC's most fragile defense**: `pnpm format` writes,
  and without this exclusion it reformats the three frozen files without warning
  (FR-016)

**Checkpoint**: configuration complete; the commands exist and can run.

---

## Phase 3: User Story 1 — Reproducible static artifact (P1) 🎯 MVP

**Goal**: two documented commands, from a clean clone, produce a static
directory publishable on a CDN, with no environment variable.

**Independent test**: `pnpm install && pnpm build`; `dist/` exists with
`index.html`; `find dist -name '*.func' -o -name '_worker.js' -o -name
'entry.mjs'` outputs nothing.

- [X] T015 [US1] Create `src/pages/index.astro` using `BaseLayout`, with a
  title and a sentence stating that it is the platform's foundation.
  **MUST NOT** contain game navigation, a game list, player registration
  or any scorekeeper element (FR-005, FR-018). This page is
  disposable: Phase 4 replaces it — investing in looks now is waste

- [X] T016 [US1] Run `pnpm build` and confirm exit code `0` and `dist/`
  containing `index.html` (SC-001)

- [X] T017 [US1] Confirm the absence of a server runtime in the artifact:
  `find dist -name '*.func' -o -name '_worker.js' -o -name 'entry.mjs'` must
  output nothing (FR-002, Principle I)

- [X] T018 [US1] Run `pnpm preview`, open the page and confirm it loads
  with zero console errors (SC-002). Manual check by a decision recorded in
  [spec.md § Assumptions](./spec.md)

**Checkpoint**: US1 delivered — there is a publishable artifact. This is the phase's MVP.

---

## Phase 4: User Story 2 — Runnable test suite (P2)

**Goal**: the test runner exists, is configured and proves that it runs,
so that Phase 3 does not start by violating Principle III or by stopping to
configure it.

**Independent test**: `pnpm test` reports ≥1 test run and zero failures;
inserting a deliberate failure makes the command exit with an error.

- [X] T019 [P] [US2] Create `tests/smoke.test.ts` with a test that imports a
  TypeScript module from the project and asserts something about it, proving that tests
  resolve project modules without per-file configuration (FR-010).
  **Do not** use `expect(true).toBe(true)`: it would not prove module resolution and
  would leave FR-009 met only in appearance

- [X] T020 [US2] Run `pnpm test` and confirm code `0`, ≥1 test run, and
  that the command **finishes** instead of entering watch mode (SC-003, contract
  invariant 1)

- [X] T021 [US2] Verify that the runner really fails: temporarily insert
  `expect(1).toBe(2)`, confirm an exit code other than
  `0`, and remove it (SC-003, FR-009). A test command that never fails
  verifies nothing

- [X] T022 [US2] Run `pnpm typecheck` and confirm code `0`. If it fails due to
  a TypeScript version incompatibility, the recorded answer is to go down to
  `typescript@5.9.x` (still within both tools' peers) and
  **never** relax `strict`, which would violate Principle V
  ([research.md § Unknowns](./research.md))

- [X] T023 [US2] Verify that the typecheck fails: temporarily insert
  `const n: number = 'texto';` in a `.ts` file under `src/`, confirm an exit other
  than `0`, and remove it (SC-004)

**Checkpoint**: US2 delivered — Phase 3 can write a rule test in its first
commit.

---

## Phase 5: User Story 3 — Proven `client:only` island (P3)

**Goal**: prove, before any match screen exists, that a component
can run only in the browser and never at build time — and keep that guarded by a
test, not by documentation.

**Independent test**: the build passes even though the component reads a
browser-only API, and `dist/index.html` does not contain the component's markup.

- [X] T024 [US3] Create `src/components/ClientOnlyProbe.tsx`: a React component
  that reads an API unequivocally unavailable outside the browser and renders it
  inside an element with `data-testid="client-only-probe"`.
  **MUST NOT** touch `localStorage` or persist anything — using `localStorage`
  here would violate FR-018 and leave an orphan key that Phase 3 would find and
  have to interpret ([data-model.md](./data-model.md))

- [X] T025 [US3] Mount the island in `src/pages/index.astro` with the
  **`client:only="react"`** directive. `client:load` produces a hydration mismatch and a flash of
  empty screen on every open — which is the app's normal use, a phone on the table with the
  tab discarded by the browser (Principle IV)

- [X] T026 [US3] Run `pnpm build` and confirm that it **passes**. If it failed due to
  a missing browser API, that would mean the island ran at build time and the
  directive is wrong (SC-005)

- [X] T027 [US3] Create `tests/static-build.test.ts`: reads `dist/index.html` and
  asserts that it does **not** contain `client-only-probe`, failing with a message that
  explains what the absence means. The test MUST fail with a clear instruction
  if `dist/` does not exist, instead of passing vacuously — a test that passes without an
  artifact is worse than no test.
  **This is the phase's most important task**: FR-012 only asks for the component, and
  a component is documentation. Documentation does not prevent regression. If someone in
  Phase 5 swaps `client:only` for `client:load` — the most likely mistake, because
  `client:load` is the default in every tutorial — only this test catches it (Decision 7)

- [X] T028 [US3] Run `pnpm test` and confirm that both tests pass, with the
  build already generated

- [X] T029 [US3] Verify that the guard bites: temporarily swap
  `client:only` for `client:load` in `src/pages/index.astro`, run
  `pnpm build && pnpm test`, confirm that the build fails **or** that
  `static-build.test.ts` fails, and revert.
  **If both pass, the phase is not done** — the project's central trap
  remains uncovered and Principle IV is still just text

- [X] T030 [US3] Open `pnpm preview` and confirm that the island appears, reads the browser
  API, and the console stays free of errors and **free of hydration mismatch warnings**
  (US3, scenario 3)

**Checkpoint**: US3 delivered — Principle IV now fails in CI instead of on the
user's phone.

---

## Phase 6: User Story 4 — Lint and formatting (P4)

**Goal**: the same style verdict for whoever opens the PR and whoever reviews it, via a
local command.

**Independent test**: `pnpm lint` and `pnpm format:check` pass on the
delivered tree; a deliberate violation makes the corresponding command fail.

- [X] T031 [US4] Run `pnpm lint` and fix whatever it flags **in the new code**.
  Resolving a warning by suppressing it is a violation of FR-015 and Principle V

- [X] T032 [US4] Run `pnpm format` and then
  `git status --porcelain -- index.html script.js style.css`.
  **The output MUST be empty.** If the POC files show up, the
  `.prettierignore` from T014 is incomplete and the published POC has just been
  rewritten (FR-016, SC-006)

- [X] T033 [US4] Run `pnpm format:check` and confirm code `0`

- [X] T034 [US4] Verify that the formatting check fails: break the
  indentation of a file under `src/`, confirm an exit other than `0`, and
  restore with `pnpm format` (SC-007)

**Checkpoint**: all user stories delivered.

---

## Phase 7: Polish & Cross-Cutting

- [X] T035 Confirm the POC freeze definitively:
  `git diff --stat chore/spec-kit -- index.html script.js style.css` **MUST**
  output nothing (SC-006, FR-016, done criterion 4 of issue MJR-9)

- [X] T036 Confirm the negative scope:
  `grep -rniE 'localStorage|schemaVersion|GameDefinition|meche' src/ tests/ dist/`
  **MUST** output nothing (FR-018, SC-008)

- [X] T037 [P] Create `README.md` documenting the commands, the Node floor, and the
  **three gotchas that would cost time to whoever comes next**: (a) TypeScript
  is on `6.0.x` on purpose, with the exact condition for upgrading — `@astrojs/check`
  and `typescript-eslint` releasing the TS 7 peer; (b) **there is no
  `tailwind.config.js`**, Tailwind 4 is configured through `@theme` in CSS; (c) the
  `tsconfig` excludes the POC on purpose, and removing the `exclude` breaks the typecheck

- [X] T038 [P] Add to `AGENTS.md § Known pitfalls` the pitfall that
  this phase's design exposed and that the constitution did not foresee: Astro's
  `tsconfig`, by default (`allowJs: true` + `include: ["**/*"]`), drags the POC into
  the typecheck, putting the Type gate in direct conflict with the POC
  freeze rule. It is a runtime pitfall, not an amendment — its place is
  `AGENTS.md` ([plan.md § Post-Phase 1 re-evaluation](./plan.md))

- [X] T039 Run the full [quickstart.md](./quickstart.md) script on a
  clean tree (`rm -rf node_modules dist && pnpm install`), including Part 2,
  which proves that the commands fail. The Part 2 steps are the ones that actually
  validate the phase; the Part 1 steps only show that it is not obviously broken

- [X] T040 Record in `research.md § Unknowns` the actual outcome of the two
  execution risks: which a11y peers `pnpm install` required (T005) and whether
  `astro check` worked with `typescript@6.0.3` (T022). Leaving the uncertainties
  recorded as "open" after having resolved them makes the next person
  repeat the investigation

---

## Dependencies

```text
Phase 1 (Setup: T001–T007)
        │
        ▼
Phase 2 (Foundational: T008–T014)   ← blocks all stories
        │
        ├────────────┬────────────┬────────────┐
        ▼            ▼            ▼            ▼
   US1 (P1)      US2 (P2)     US3 (P3)     US4 (P4)
  T015–T018     T019–T023    T024–T030    T031–T034
        │            │            │            │
        └────────────┴────────────┴────────────┘
                     │
                     ▼
        Phase 7 (Polish: T035–T040)
```

**Real dependencies between stories** (they are not as independent as the
template suggests, and it is better to say so than to find out midway):

- **US3 depends on US1.** `tests/static-build.test.ts` (T027) reads
  `dist/index.html`. Without US1's build there is nothing to assert.
- **US3 depends on US2.** The island proof is a test; without a configured test
  runner (T012, T020) it does not run.
- **US4 is the only truly independent one.** Lint and format pass without a build and without
  tests.
- **US1 and US2 are independent of each other** and can go in parallel after
  Phase 2.

Recommended order: **US1 → US2 → US3 → US4**, which is the spec's priority
order and also the order in which the dependencies resolve. A convenient
coincidence, not design.

## Parallel Opportunities

Within Phase 2, four configuration files do not touch each other:

```sh
# T010, T011, T013, T014 in parallel
T010  src/styles/global.css
T011  src/layouts/BaseLayout.astro
T013  eslint.config.js
T014  .prettierrc.json + .prettierignore
```

In Phase 7, T037 (`README.md`) and T038 (`AGENTS.md`) are separate and
independent files.

**Where parallelism does not help**: the verification tasks (T016–T018,
T020–T023, T026–T030, T031–T034) are almost all sequential commands over the
same tree. Running them "in parallel" would only scramble the output.

## Implementation Strategy

**MVP = US1.** `pnpm install && pnpm build` producing a publishable `dist/`. It is the
only item without which nothing afterwards can be published or reviewed.

**Recommended increment**: Phase 1 → Phase 2 → US1 (commit) → US2 (commit) →
US3 (commit) → US4 (commit) → Phase 7 (commit). Each commit leaves the tree in a
state in which the already existing commands pass.

**The step that cannot be cut if time gets tight**: T029 — the verification
that the Principle IV guard bites. Skipping T037/T038 costs documentation; skipping
T029 delivers a foundation that *seems* to protect the project's central trap and
does not. If something has to go, let it go from Phase 7, never from T027/T029.

---

## Execution result (2026-11-02)

40/40 tasks completed. On a clean tree (`rm -rf node_modules dist .astro`),
with `--frozen-lockfile` and an environment without variables:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0, `pnpm peers check` with no pending issues |
| `pnpm build` | exit 0, `dist/` with 5 files, no server runtime |
| `pnpm test` | exit 0, **10 tests** in 2 files |
| `pnpm typecheck` | exit 0, `0 errors, 0 warnings, 0 hints` |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | exit 0 |

**The negative checks, which are the ones that matter:**

| Defect introduced | Command | Result |
|---|---|---|
| test `expect(1).toBe(2)` | `pnpm test` | exit 1 ✅ |
| `const n: number = 'texto'` | `pnpm typecheck` | exit 1 ✅ |
| broken indentation | `pnpm format:check` | exit 1 ✅ |
| **`client:only` → `client:load`** | `pnpm build` | **exit 1** ✅ — failed in prerender, inside `ClientOnlyProbe` |
| **`client:only` → `client:load`** | `pnpm test` | **exit 1** ✅ |

T029 worked at **two** layers, and it is worth recording how: the build broke
on its own when trying to render `globalThis.screen` in prerender, and the test broke
right after. The project's central trap is covered by something that fails
automatically.

### Where execution diverged from the plan

Three tasks had a different outcome than expected. All three are corrected
in [research.md](./research.md) in the same commit, as Principle VIII requires.

1. **T004 — `oxc-transform-react` was NOT declared.** The plan said to
   declare it. Wrong at two layers: `^0.145.0` on a `0.x` version locks the minor
   (so `0.156.0` never satisfied it), and the peer is `optional: true` in
   `@astrojs/react` **and** in `@vitejs/plugin-react`, with disjoint ranges
   (`^0.145.0` vs `^0.152.0`). No version satisfies both — declaring it was the
   only way to create the warning. Removed; `pnpm peers check` stays clean.

2. **T005 — no a11y peer was needed.** The uncertainty recorded in
   Phase 0 resolved to "nothing to declare".

3. **T014 — the `.prettierignore` needed much more than the POC's three
   lines.** The POC came out intact from the first run of `pnpm format` (identical
   hash — the three planned lines worked), but Prettier rewrote
   15 documentation files that Phase 0 had not thought to protect,
   including the YAML frontmatter of the Spec Kit skills. `*.md`, `.specify/` and
   `.claude/` were added to the exclusion: **Prettier formats code in this repository,
   not prose.**

In addition, four adjustments that the plan did not foresee and that typecheck/lint
required: `@types/node` (the tests use `node:fs`), a `vitest/config` type
reference in `vitest.config.ts`, replacing `tseslint.config()` with
`defineConfig` from `eslint/config` (the former is deprecated), and scoping the
typed lint rules to `**/*.{ts,tsx}` so they do not break lint on the
`.astro` files. All documented in
[research.md § Implementation findings](./research.md).
