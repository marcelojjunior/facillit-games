# Implementation Plan: Technical foundation and static pipeline

**Branch**: `astro` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-astro-foundation/spec.md`

**Issue**: MJR-9 (Phase 2 of the restructuring plan, MJR-8 rev. 2)

## Summary

Deliver the application's empty shell and the static build pipeline, with no
game screen at all: Astro 7 with `output: 'static'`, TypeScript in strict mode,
Tailwind 4 via the Vite plugin, React 19 enabled for islands, Vitest running, and
lint/format/typecheck configured — all coexisting in the same tree as the frozen
POC, without touching it.

The technical approach came out of the [Phase 0 research](./research.md), which changed three
choices relative to the "install the latest of everything" path:

1. **TypeScript stays at `6.0.3`, not `7.0.2`.** `@astrojs/check` accepts
   `^5 || ^6` and `typescript-eslint` accepts `<6.1.0`; the intersection is `6.0.x`.
   Taking `latest` would deliver a foundation whose typecheck command does not run.
2. **`@astrojs/tailwind` is out.** Its latest version has peers incompatible
   in two dimensions at once (`astro: ^3||^4||^5` and `tailwindcss: ^3`).
   Tailwind comes in through `@tailwindcss/vite`, and **there is no `tailwind.config.js`**
   in this project.
3. **The `tsconfig` must explicitly exclude the POC.** The
   `astro/tsconfigs/base` preset brings `allowJs: true` with `include: ["**/*"]`, which
   drags `script.js` (16 KB of untyped JS) into the TypeScript
   program. Without `exclude`, `astro check` would only pass by fixing the POC — which the
   constitution forbids.

The delivery goes beyond the minimum on one deliberate point: the `client:only`
island proof is **an automated test** that runs the build and asserts that the
island's markup is not in the generated HTML, not just a sample component.
This turns Principle IV from a written principle into a principle that fails in
CI, and it is the only real defense against someone swapping `client:only` for `client:load`
in Phase 5 — which is the most likely mistake, because `client:load` is the default in every
tutorial.

## Technical Context

**Language/Version**: TypeScript `6.0.3` (compatible ceiling — see
[research.md, Decision 1](./research.md)), in `astro/tsconfigs/strictest` mode

**Primary Dependencies**: Astro `7.4.4` (`output: 'static'`),
`@astrojs/react@7.1.2` + React `19.3.1`, `tailwindcss@4.3.3` via
`@tailwindcss/vite@4.3.3`, `@astrojs/check@0.9.12`

**Storage**: none in this phase. The application neither reads nor writes `localStorage`
(FR-018). The persisted schema is Phase 3 scope.

**Testing**: Vitest `5.0.5`, configured via `getViteConfig` from `astro/config`;
default environment `node` (not `jsdom` — see [research.md, Decision 4](./research.md))

**Target Platform**: modern browsers, mobile-first; static artifact
served by a CDN. No server runtime.

**Project Type**: static web application (single project)

**Performance Goals**: there is no numeric goal in this phase — there is no product
screen to measure. The structural goal is that the artifact require no
server-side execution, which keeps the response cost on the CDN.

**Constraints**: zero backend, zero environment variables, zero credentials
(Principle I). Node floor `>=22.23.4` (a real requirement of `astro@7.4.4`); pnpm
pinned via `packageManager`.

**Scale/Scope**: one disposable home page, one proof island, one set
of pipeline scripts. Zero product screens, zero games.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution evaluated: `.specify/memory/constitution.md` v1.0.0 (ratified
2026-11-02).

### Pre-Phase 0 evaluation

| Principle | Applies? | Verdict | How this phase complies |
|---|---|---|---|
| **I — Pure Client-Side** *(NON-NEGOTIABLE)* | yes | **PASS** | `output: 'static'`, no adapter, no server function. FR-002/FR-003 forbid environment variables and external services. The principle's verification (`grep` for `fetch(`) is trivially satisfied: there is no network call at all. |
| **II — A Game Is a Plugin** *(NON-NEGOTIABLE)* | **not yet** | **N/A — and protected** | There is no game, registry or `src/games/` in this phase; the contract is Phase 3. The real risk is the shell being born with a hook to a specific game. FR-005 and FR-018 forbid it as a verifiable requirement, and SC-008 mandates searching the artifact for game names. |
| **III — A Scoring Rule Is a Pure, Tested Function** *(NON-NEGOTIABLE)* | **not yet** | **N/A — and enabled** | No rule exists. This phase's obligation is to not let Phase 3 start without a test runner: FR-008/FR-009/FR-010. The choice of the `node` environment (not `jsdom`) is deliberate so that a rule that touches the DOM **fails** the test instead of passing. |
| **IV — Match State Is a `client:only` Island** | yes | **PASS — with reinforcement** | There is no state in this phase, so the principle could not be violated. But the configuration could make it unworkable. FR-011/FR-012 require the proof, and Decision 7 of the research elevates it to an automated test against the built HTML. |
| **V — TypeScript `strict`** | yes | **PASS — above the minimum** | `astro/tsconfigs/strictest`, which is a superset of `strict: true`, adding `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. FR-007 forbids relaxing per file or per directive. Zero `any` and zero `@ts-ignore` in the delivery. |
| **VI — Mobile-First** | **partially** | **PASS by not compromising** | There is no product screen, so there is no layout to design nor touch target to measure. What this phase owes is not to get in the way: the home page declares a correct `viewport` and the global CSS does not fix a minimum width. Dark mode and tokens are Phase 4. **This phase does not claim compliance with the principle** — it only creates no obstacle. |
| **VII — The Persisted Schema Is Versioned** | **not yet** | **N/A** | Nothing is persisted (FR-018). The principle starts to apply in Phase 3. This phase writes no key to `localStorage`, not even a test one. |
| **VIII — Spec Before Code** *(NON-NEGOTIABLE)* | yes | **PASS** | `specs/001-astro-foundation/spec.md` was committed in `61cc74a`, **before** any line of implementation. The cycle was actually run: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. |

### Development Workflow Gates

| Gate | Verdict | Note |
|---|---|---|
| **Spec gate** | **PASS** | `spec.md` committed in `61cc74a` before implementation. Issue MJR-9 cites the spec path in the report. |
| **Test gate** | **N/A** | No scoring rule created or changed. The gate starts to bite in Phase 3. |
| **Constitution gate** | **PASS** | This section is filled in. See Complexity Tracking below. |
| **Git conventions** | **PASS** | Work on the `astro` branch, derived from `chore/spec-kit` (see note below). POC untouched — FR-016 and SC-006. |

**Note on the branch base**: `astro` came off `chore/spec-kit` (`7009b10`),
which carries Phase 1 and is 1 commit ahead of `origin/main`. Branching from
`main` would leave the branch without the constitution and without the Spec Kit skills,
making the Spec gate unworkable. Confirmation was requested from the CEO in issue MJR-9 and
the base can be rebased if he prefers another.

### Additional constraints

| Constraint | Verdict | Note |
|---|---|---|
| **Fixed stack** | **PASS** | All layers are the pinned ones: static Astro, strict TS, Tailwind, React in islands, Vitest, pnpm, static on Vercel. **No amendment is needed.** Replacing `@astrojs/tailwind` with `@tailwindcss/vite` is **not** a layer change — the layer is "Tailwind", and it is still Tailwind; what changed is the integration mechanism, which the constitution does not pin. |
| **Paperclip ↔ Spec Kit boundary** | **PASS** | `tasks.md` is an internal checklist; no card was created in Paperclip by Spec Kit. `/speckit-taskstoissues` was not used. |
| **Pinned CLI** | **PASS** | Spec Kit stays at `1.2.5`; this phase does not touch `.specify/` beyond creating `specs/001-*`. |

### Post-Phase 1 re-evaluation (design)

Re-run after `research.md`, `data-model.md`, `contracts/` and `quickstart.md`.

**Verdict: PASS, with no violation to justify.** The design introduced no
new violation. Two changes the design brought that *improve* adherence:

- **Principle V got stronger, not weaker.** The research moved from
  `strict` to `strictest`. The constitution asks for the floor; the design delivers above
  it.
- **Principle IV gained enforcement.** It was a principle without automatic verification
  (the *Verification* written in the constitution is a manual `grep` for directives). The
  design adds a test that runs the build and checks the HTML — the principle now
  fails in CI.

One point the design **exposed** and that is worth recording as a finding, not as a violation:
Astro's `tsconfig`, by default, would have dragged the POC into the typecheck,
creating a direct conflict between the Type gate and the POC freeze
rule. The constitution did not foresee this interaction. It is not an amendment — it is a
runtime pitfall, and its place is `AGENTS.md § Known pitfalls`, where this phase
records it.

**No constitution amendment is proposed by this phase.**

## Project Structure

### Documentation (this feature)

```text
specs/001-astro-foundation/
├── spec.md              # Specification phase (committed in 61cc74a)
├── plan.md              # This file
├── research.md          # Phase 0 — 7 decisions with rejected alternatives
├── data-model.md        # Phase 1 — declares the absence of entities, with the reason
├── quickstart.md        # Phase 1 — validation script for the 8 SC
├── contracts/
│   └── commands.md      # Contract of the pipeline scripts (consumed by Phases 3-6)
├── checklists/
│   └── requirements.md  # Spec quality checklist, with 2 recorded caveats
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

The POC and the new application coexist at the root until the Phase 6 cutover. Files
marked **FROZEN** are not touched by this phase nor by any tool
it configures.

```text
.
├── index.html                      # FROZEN — published POC
├── script.js                       # FROZEN — published POC
├── style.css                       # FROZEN — published POC
│
├── package.json                    # scripts, engines, packageManager
├── pnpm-lock.yaml                  # versioned (FR-004)
├── pnpm-workspace.yaml             # required by pnpm for onlyBuiltDependencies
├── astro.config.mjs                # output: 'static' + @tailwindcss/vite + react
├── tsconfig.json                   # strictest + POC exclude
├── vitest.config.ts                # getViteConfig from astro/config
├── eslint.config.js                # flat config: ts + astro + jsx
├── .prettierrc.json / .prettierignore
├── .gitignore                      # + dist/, node_modules/, .astro/
│
├── src/
│   ├── pages/
│   │   └── index.astro             # minimal, disposable page (Phase 4 replaces it)
│   ├── layouts/
│   │   └── BaseLayout.astro        # viewport + global CSS import
│   ├── components/
│   │   └── ClientOnlyProbe.tsx     # proof island (FR-012), disposable
│   └── styles/
│       └── global.css              # @import "tailwindcss" — no tailwind.config.js
│
├── tests/
│   ├── smoke.test.ts               # proves the runner executes (FR-009)
│   └── static-build.test.ts        # runs the build, asserts the island is absent from the HTML
│
└── dist/                           # static artifact — ignored by git
```

**Structure Decision**: single project with the application in `src/` and the foundation
tests in `tests/`, coexisting at the root with the POC's three frozen files.

Two layout choices that are not arbitrary:

- **Foundation tests in `tests/`, not next to the code.** Principle III
  mandates that game rule tests live **next to** the code
  (`src/games/<id>/rules.test.ts`). This phase's tests are not game rules —
  they are pipeline tests. Separating them now prevents Phase 3 from finding a
  contradictory precedent in `src/` and concluding that rule tests also go in
  `tests/`.
- **`src/components/` exists, but `src/games/` does not.** Creating an empty `src/games/`
  now would seem helpful and would be a guess about Phase 3, which has not yet
  defined the contract. The folder is born with the first spec that justifies it.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No constitution violation to justify.** The Constitution Check passed
on all applicable principles, pre- and post-design, and this phase sits above the
floor on two of them (V and IV).

The two tables below are not violations — they are, respectively, deviations from
`latest` and deviations from the shortest path. They are recorded because a reviewer
who has not read the research will find both odd, and because the decision to upgrade
TypeScript depends on an external condition that someone needs to be able to find again.

### Deviations from the registry's `latest`

| Deviation | Why it is necessary | Simpler alternative rejected because |
|---|---|---|
| `typescript@6.0.3` instead of `7.0.2` (`latest`) | `@astrojs/check` accepts `^5 \|\| ^6`; `typescript-eslint@8.72.1` accepts `>=4.8.4 <6.1.0`. The intersection is `6.0.x`. | Taking `7.0.2` would deliver a foundation in which `pnpm typecheck` and type-aware lint do not run — the opposite of the phase's goal. Unblocker: `@astrojs/check` and `typescript-eslint` releasing the TS 7 peer. |
| `@tailwindcss/vite` instead of `@astrojs/tailwind` | `@astrojs/tailwind@6.0.2` declares `astro: ^3\|\|^4\|\|^5` and `tailwindcss: ^3.0.24` — incompatible in two dimensions with Astro 7 + Tailwind 4. | Holding Tailwind at v3 to use the "official" integration still would not close the `astro` peer, and it would be born one major behind in the file Phase 4 will edit the most. |
| `oxc-transform-react` **not** declared (correction to the original plan) | It is an `optional: true` peer in `@astrojs/react` and in `@vitejs/plugin-react`, with **disjoint** ranges (`^0.145.0` vs `^0.152.0`). No version satisfies both. | Declaring it — which was the original plan, because it seemed more rigorous — creates an unsolvable peer warning on `install` for a package nobody requires. Corrected during implementation; see [research.md, Decision 5](./research.md). |
| `@types/node@^24` instead of the `latest` `^26` | The tests use `node:fs`/`node:url`; without the types, `astro check` fails with `ts(2591)`. | The `^26` line would describe APIs of a runtime ahead of the environment's Node 24. |

### Work beyond the requested minimum

| Item | Why it was included | The minimum was rejected because |
|---|---|---|
| `tests/static-build.test.ts` — test that runs the build and asserts the island is absent from the HTML | Gives enforcement to Principle IV, whose verification in the constitution is a manual `grep`. | Only the proof component (what FR-012 asks for) is documentation, and documentation does not prevent regression. Swapping `client:only` for `client:load` would go through silently and the defect would show up on a phone, far from whoever wrote the line. |
| `astro/tsconfigs/strictest` instead of `strict` | Brings `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, which are exactly the locks Phase 3 will want when reading a corrupted payload (Principle VII) and when modeling `GameDefinition` without `any` (Principle V). | `strict` meets the constitution to the letter, but tightening later costs more: Phase 3 would already have code written against the loose rule. |
| Explicit POC `exclude` in the `tsconfig` | Without it `astro check` fails on errors in `script.js`, and the command would only pass by fixing the POC — forbidden by the constitution. | It is not optional: it is the difference between the pipeline working and hanging. Recorded here because it looks like hygiene and is a blocker. |

### Not done on purpose

| Item | Why not | When |
|---|---|---|
| ESLint rule forbidding `client:load` on a state component | Principle IV only applies to components that read match state, and none exist. Writing the rule now would be against an imaginary target. | Phase 3, when the store is born. Recommendation recorded. |
| Browser test (Playwright) for hydration mismatch | A more faithful check, but it brings a browser binary and CI time for a phase with no screen. The spec already records in Assumptions that the console check is manual here. | Phase 4, when there is a screen that justifies the cost. |
| Creating the project on Vercel | There is no Vercel connection available to agents in this instance; it is a human step, under decision in MJR-8. Static Astro is detected without an adapter and without environment variables. | Human step, outside this phase. |
| `src/games/`, registry, `GameDefinition`, `localStorage` store | FR-018. It would be a guess about a contract that Phase 3 has yet to define. | Phase 3. |
| Design system, color tokens, dark mode | FR-018. | Phase 4. |
