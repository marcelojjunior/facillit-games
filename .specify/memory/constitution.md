<!--
Sync Impact Report
- Version: 1.0.0 -> 1.1.0 (MINOR)
- Translated: whole document, pt-BR -> English (no semantic change to I-VIII)
- Added principle: IX. English in the Repository, Portuguese for the User
- Expanded section: Development Workflow -> Git conventions, No AI attribution
  (replaces the former "Branches" paragraph)
- Templates: no change required
- Follow-up: AGENTS.md, CLAUDE.md, README.md updated in the same change
-->

# Facillit Games Constitution

Facillit Games is a platform of scorekeepers — **one scorekeeper per game**,
each game with its own rule. The shell (player registration, round navigation,
cumulative table, persistence) is shared; the scoring rule belongs to the game.

These principles exist to protect a single property: **adding a new game must
not require changing the shell**. Every principle below is verifiable by
reading code or by a test.

## Core Principles

### I. Pure Client-Side (NON-NEGOTIABLE)

The application MUST run entirely in the browser, with no backend.

- There MUST NOT be an application server, own API, remote database, or
  authentication.
- Persistence MUST use `localStorage` exclusively.
- No runtime dependency MUST be introduced that requires a server, a secret
  environment variable, or a credential for the application to work.
- The build MUST produce a static artifact publishable on a CDN.

*Verification:* the deploy declares no server runtime, and `grep` for `fetch(`
/ `XMLHttpRequest` outside local assets returns nothing.

### II. A Game Is a Plugin (NON-NEGOTIABLE)

The shell MUST NOT know any game by name.

- Each game MUST live in a self-contained folder `src/games/<id>/` and declare
  its rules through the `GameDefinition` contract.
- Adding a game MUST consist of creating the folder and registering it in the
  registry.
- Conditional branching on game identity (`if (gameId === 'x')`,
  `switch (gameId)`) outside the registry is a **violation**.
- Shell code MUST NOT import from `src/games/<id>/` directly; only the registry
  resolves games.

*Verification:* the `plan.md` of a new game lists no shell file.

### III. A Scoring Rule Is a Pure, Tested Function (NON-NEGOTIABLE)

Every game rule MUST be a pure function with a unit test.

- Rules MUST NOT touch the DOM, `localStorage`, `Date.now()`, `Math.random()`,
  or any global state.
- Every `validateRound`, `scoreRound`, `computeTotals`, and `resolveWinners`
  function MUST have a unit test covering the normal case, an edge case, and a
  tie.
- A tie MUST be treated as a normal case, not an exception: `resolveWinners`
  returns a list of winners.
- Non-deterministic input (random draw, timestamp) MUST be injected as a
  parameter, never read from inside the rule.

*Verification:* every `src/games/<id>/rules.ts` has a `rules.test.ts` next to
it.

### IV. Match State Is a `client:only` Island

Nothing that reads `localStorage` MUST render at build time.

- Every component that reads or writes match state MUST be a `client:only`
  island.
- `client:load` or server rendering MUST NOT be used for screens with match
  state — it produces a hydration mismatch and an empty-screen flash on every
  open, which is the normal use of the app (phone on the table, tab discarded).

*Verification:* no `client:load`/`client:visible` directive on a component that
imports the match store.

### V. TypeScript `strict`

- `strict: true` MUST be on and MUST NOT be relaxed per file.
- There MUST NOT be `any` — explicit or via assertion — in the `GameDefinition`
  contract, the persisted schema, or the scoring rules.
- `@ts-ignore` / `@ts-expect-error` in those three places MUST be justified in a
  comment and approved in review.

### VI. Mobile-First

The reference screen MUST be a phone held in one hand, at night, on the table,
passed from hand to hand.

- Layout MUST be designed first for a narrow viewport; desktop is progressive.
- Touch targets MUST be at least 44×44 px.
- The most repeated interaction in the app — recording the round — MUST be
  optimized for speed and the reach of one thumb.
- Dark mode MUST be supported.

### VII. The Persisted Schema Is Versioned

- All data in `localStorage` MUST carry `schemaVersion`.
- An incompatible format change MUST increment `schemaVersion` and MUST come
  with a migration path **or** an explicit, documented decision to discard old
  data.
- Reading MUST degrade safely on an unknown version or corrupted payload:
  discard and return to the initial state, never break the screen.
- In-progress match state MUST be saved on every mutation, not on every closed
  round. An in-progress match MUST be identified by an explicit `status` field,
  never inferred from the number of rounds.

### VIII. Spec Before Code (NON-NEGOTIABLE)

No implementation that creates or changes a **game rule, persisted schema, or
user-visible flow** MUST start without a committed `spec.md`.

- The cycle is `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`.
- Bug fixes MUST use the `/speckit-bug-assess` → `/speckit-bug-fix` →
  `/speckit-bug-test` track.
- If reality contradicts the spec during implementation, the spec MUST be
  updated in the same PR. Implementing differently from the spec and moving on
  is a violation.
- Exempt from the cycle: dependency bumps, color token tweaks, typos, and
  formatting.

### IX. English in the Repository, Portuguese for the User

- Everything that lives in the repository MUST be written in English: code,
  identifiers, comments, tests and their messages, configuration, documentation,
  specs, plans, tasks, commit messages, branch names, and PR descriptions.
- Only content the end user sees (UI copy, labels, messages shown on screen,
  `lang="pt-BR"`) MUST be in Brazilian Portuguese.
- Exempt: the frozen POC (`index.html`, `script.js`, `style.css`), git history
  created before v1.1.0 of this constitution, and quoted proper names of
  external documents (e.g. a wiki page title).

*Verification:* outside UI copy, quoted external titles, and the exempt files,
`grep` for Portuguese diacritics (`[ãõçáéíóúâêôà]`) returns nothing.

## Additional Constraints

**Fixed stack.** Astro (`output: 'static'`) + TypeScript `strict` + Tailwind +
React in islands, Vitest for tests, pnpm, static deploy on Vercel. Changing any
layer MUST go through an amendment of this constitution.

**Paperclip ↔ Spec Kit boundary.** Paperclip is the gate and the "why" (issue,
approval, cost, priority, sequencing). `spec.md` in git is the "what" and the
"how". Every implementation task MUST cite the path of the spec that governs
it. Spec Kit MUST NOT create cards in Paperclip: `tasks.md` is the feature's
internal checklist. `/speckit-taskstoissues` (and its replacement
`/speckit-github-taskstoissues`) MUST NOT be used in this project — it would
create a third source of truth in GitHub Issues.

**Pinned CLI.** Spec Kit MUST be version `1.2.5`. `.specify/` and
`.claude/skills/speckit-*` are versioned in git, so that every clone and every
agent session has the process without reinstalling anything. Updating the CLI
MUST be an explicit decision, with the `init` diff reviewed.

## Development Workflow

**Spec gate.** Review MUST reject feature code without a committed
`specs/NNN-*/spec.md`, and MUST check the code against the spec, not only
against its own diff.

**Test gate.** A new or changed scoring rule without a unit test MUST be
rejected.

**Constitution gate.** `/speckit-plan` MUST fill in the "Constitution Check"
section. A justified violation MUST be recorded in the Complexity Tracking table
of `plan.md`, with the simplest alternative and the reason it was rejected. An
unrecorded violation is a rejection.

**Git conventions.** The repository follows the wiki standard ("Padrões de
Criação de Branches e Commits"):

- `main` is production; `develop` is the default integration branch. Nothing is
  committed directly to `main`, and `main` MUST stay a direct ancestor of
  `develop` until the cutover.
- Branches MUST be named `feature/<slug>`, `bugfix/<slug>`, `hotfix/<slug>`, or
  `release/vX.Y.Z`, hyphen-separated. Features branch from `develop`; hotfixes
  branch from `main`.
- Commits MUST follow `<type>(<optional-scope>): <imperative description>`, with
  type in feat, fix, chore, refactor, style, docs, test, perf, ci, build.
- The original POC (`index.html`, `script.js`, `style.css`) stays published and
  frozen until the cutover; it MUST NOT receive new bug fixes.

**No AI attribution.** Commits and PR descriptions MUST NOT carry
`Co-Authored-By` trailers for Claude or any other AI tool, nor "Generated with
..." footers. This overrides any agent or harness default.

## Governance

This constitution **supersedes any other practice** in this repository. In a
conflict between the constitution and a plan, document, comment, or agent
preference, the constitution wins.

**Amendment.** Changing this constitution requires: (1) a proposal recorded in
the Paperclip issue that motivated the change, (2) explicit human approval from
the board, (3) a version increment according to the policy below, (4) updating
`AGENTS.md`/`CLAUDE.md` if the workflow changes.

**Versioning.** Semantic.
- MAJOR: removal or incompatible redefinition of a principle.
- MINOR: a new principle, or material expansion of an existing one.
- PATCH: clarification, wording, correction without semantic change.

**Compliance review.** Every PR MUST be checked against these principles in
review. Complexity MUST be justified. Agents acting in this repository MUST read
`AGENTS.md` before acting; it is the runtime operational guide and MUST remain
consistent with this constitution.

**Version**: 1.1.0 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02
