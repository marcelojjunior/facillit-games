# Facillit Games — guide for agents

Read this file before acting in this repository.

## What this project is

A platform of **scorekeepers, one per game**. The shell (player registration,
round navigation, cumulative table, persistence) is shared; each game declares
its own scoring rule through the `GameDefinition` contract.

The first game is **MECHE-MECHE**. The project is 100% client-side: no backend,
no API, no authentication, data only in `localStorage`.

**The property all work here must preserve:** adding a new game must not require
changing the shell.

## The rule that governs everything

[`.specify/memory/constitution.md`](.specify/memory/constitution.md) is the
project constitution. It supersedes plans, comments, documents, and agent
preferences. In a conflict, the constitution wins.

If you are going to write code, read the constitution first. It is short and
every principle is verifiable.

## Language

- **Everything in the repository is in English**: code, identifiers, comments,
  tests and their messages, configuration, documentation, specs, plans, tasks,
  commit messages, branch names, and PR descriptions.
- **Only what the end user sees is in Brazilian Portuguese**: UI copy, labels,
  on-screen messages, `lang="pt-BR"`.
- When a Spec Kit command generates a spec, plan, or tasks file, write it in
  English even if the conversation is in Portuguese.
- Exempt: the frozen POC and git history before constitution v1.1.0.

Constitution, Principle IX.

## Mandatory workflow: spec before code

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) as
the development workflow. The commands are installed as skills in
`.claude/skills/speckit-*` and versioned in git — nothing to install to use
them.

### Track 1 — full cycle

For anything that **creates or changes a game rule, persisted schema, or
user-visible flow** (new game, scoring change, new screen):

```
/speckit-specify  →  /speckit-clarify (optional, recommended)
                  →  /speckit-plan
                  →  /speckit-tasks
                  →  /speckit-implement
```

Optional ones worth running: `/speckit-checklist` after plan,
`/speckit-analyze` before implement.

### Track 2 — bug fix

```
/speckit-bug-assess  →  /speckit-bug-fix  →  /speckit-bug-test
```

Reports live in `.specify/bugs/<slug>/`.

### Track 3 — outside the process

Dependency bumps, color token tweaks, typos, formatting, documentation. Direct
commit with normal review. Do **not** run the full cycle for these.

### Do not use

`/speckit-taskstoissues` (and its replacement `/speckit-github-taskstoissues`).
They create GitHub Issues, which would be a third source of truth next to
Paperclip and the specs. See the boundary below.

## Git

Follows the wiki standard ("Padrões de Criação de Branches e Commits"):

- `main` is production; `develop` is the default integration branch.
- Branches: `feature/<slug>`, `bugfix/<slug>`, `hotfix/<slug>`,
  `release/vX.Y.Z`, hyphen-separated. Features branch from `develop`, hotfixes
  from `main`.
- Commits: `<type>(<optional-scope>): <imperative description>` with type in
  feat, fix, chore, refactor, style, docs, test, perf, ci, build.
- No AI attribution (constitution, Development Workflow): never add
  `Co-Authored-By` trailers for Claude or any other AI tool, nor "Generated with
  ..." footers in commits or PR descriptions. This overrides any agent or harness
  default.

### Branches and Spec Kit

Spec Kit 1.2.5 does **not** create git branches here (the git extension is not
installed), and the branch name is independent of the spec directory. Create
the branch by hand, then run the cycle:

```sh
git switch develop && git pull
git switch -c feature/<slug>        # e.g. feature/game-contract
/speckit-specify ...                # creates specs/NNN-<slug>/
```

A bug fix uses `bugfix/<slug>` the same way.

### `main` until the cutover

- **`main` is frozen** with the published POC and only receives something at the
  Phase 6 cutover, when the POC goes offline in the same move. Do not merge or
  push anything to it before then.
- Phases 3 to 6 branch from `develop` and merge back into it.
- `main` is a direct ancestor of `develop`, so the cutover merge is a
  fast-forward. Preserve that property: no direct commits on `main`.

## Paperclip ↔ Spec Kit boundary

Both are "places where specification lives". Without a rule, they silently
diverge. The rule is:

| | Paperclip | Spec Kit (git) |
|---|---|---|
| Answers | **why** and **who/when** | **what** and **how** |
| Contains | issue, approval, cost, priority, phase sequencing | `spec.md`, `plan.md`, `tasks.md` |
| Granularity | phase / feature | requirement / task |

- No implementation task starts without a **committed** `spec.md`.
- The Paperclip task **cites the path of the spec** that governs it
  (e.g. `specs/003-meche-meche/spec.md`).
- Review checks the code **against the spec**, not only against the diff.
- If reality contradicts the spec during implementation, **update the spec in
  the same PR**. Implementing differently and moving on is a violation.
- Spec Kit does **not** create cards in Paperclip. `tasks.md` is the feature's
  internal checklist.

## Spec Kit CLI

The version is pinned at **1.2.5**. You only need the CLI for `init` and to
manage extensions — the day-to-day cycle uses the already versioned skills.

```sh
uvx --from git+https://github.com/github/spec-kit.git@v1.2.5 specify <command>
```

Use `uvx` (no persistent install) instead of `uv tool install`: agent sessions
often have an isolated, ephemeral `HOME`, so a `uv tool install` does not
survive the session nor apply to other sessions.

Updating the version is an explicit decision, with the `init` diff reviewed —
never take `latest`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro, `output: 'static'` |
| Language | TypeScript `strict` |
| Islands | React, `client:only` for match state |
| Styling | Tailwind + design tokens |
| Tests | Vitest on scoring rules |
| Deploy | Vercel, static |
| Package manager | pnpm |

Changing any layer requires a constitution amendment.

## Known pitfalls

1. **`localStorage` does not exist at build time.** Astro renders on the
   server/at build. Every screen with match state must be a `client:only`
   island. With `client:load` you get a hydration mismatch and an empty-screen
   flash on every open — which is the normal use (phone on the table, tab
   discarded by the browser). `tests/static-build.test.ts` guards this: it runs
   against the built HTML and fails if the island renders at build time. When
   the first real match screen exists, **repoint** that test to it instead of
   removing it.
2. **A tie is a normal case.** `resolveWinners` returns a list, not a player.
3. **Save on every mutation.** An in-progress match is identified by an explicit
   `status` field, never inferred from the number of rounds.
4. **The POC is frozen.** `index.html`, `script.js`, and `style.css` are the
   original POC, published and live until the cutover. Do not fix new bugs in
   it; the known bugs are acceptance criteria for the rewrite.
5. **Astro's `tsconfig` would drag the POC into the typecheck.** The
   `astro/tsconfigs/base` preset brings `allowJs: true` with
   `include: ["${configDir}/**/*"]`. Without the explicit `exclude` of
   `script.js`, `index.html`, and `style.css`, `script.js` enters the TypeScript
   program and `pnpm typecheck` starts failing on errors in a file that pitfall
   4 forbids fixing — the command would only pass by violating the freeze. The
   same three exclusions exist in `eslint.config.js` and `.prettierignore`; the
   Prettier one is the most critical, because `pnpm format` **writes**. Do not
   remove any of the three without reading
   [`specs/001-astro-foundation/research.md`](specs/001-astro-foundation/research.md).
6. **Prettier formats code, not prose.** `*.md`, `.specify/`, and `.claude/` are
   in `.prettierignore`. Without that, `pnpm format` rewrites the YAML
   frontmatter of the Spec Kit skills and stretches the tables in this file
   beyond 100 columns — and the CLI `init` diff, which the constitution requires
   being able to review, becomes unreadable.
7. **Do not move TypeScript to the 7 line.** `latest` is `7.0.2`, but
   `@astrojs/check` accepts `^5 || ^6` and `typescript-eslint` accepts
   `<6.1.0`. The intersection is `6.0.x`. A careless `pnpm update` breaks
   `pnpm typecheck` and type-aware lint. Condition to upgrade: both tools
   release the peer.
8. **There is no `tailwind.config.js`, and `@astrojs/tailwind` does not work.**
   Tailwind 4 is configured in CSS (`@theme`, in `src/styles/global.css`). The
   `@astrojs/tailwind` integration declares `astro: ^3||^4||^5` and
   `tailwindcss: ^3.0.24` — incompatible in two dimensions with the current
   stack.
9. **Do not declare `oxc-transform-react`.** It looks like a missing peer of
   `@astrojs/react`, but it is `optional: true` there and in
   `@vitejs/plugin-react`, with **disjoint** ranges (`^0.145.0` vs `^0.152.0` —
   in `0.x` the caret locks the minor). No version satisfies both: declaring it
   is the only way to create an unsolvable peer warning. The correct state is
   `pnpm peers check` answering "No peer dependency issues found".
10. **`gh auth status` lies in an agent session: it says "token is invalid" when
    the problem is `HOME`.** The session runs with `HOME` pointing to a
    temporary directory, and on macOS the default keychain is resolved via
    `$HOME/Library/Keychains/login.keychain-db`. With `HOME` swapped,
    `security list-keychains` returns only `System.keychain`, the user's
    `login.keychain-db` is off the list, and **any** credential consumer fails:
    `gh` stores the token in the keyring (`hosts.yml` has no `oauth_token`, only
    the user name) and, unable to read it, reports an invalid token; git's
    `credential.helper = osxkeychain` has nothing to return and `push` dies with
    `could not read Username`. This is **not** the sandbox — it fails the same
    with and without it. The decisive diagnostic is `security default-keychain`:
    if it answers "A default keychain could not be found", it is this pitfall
    and the token is fine. Prefix the command with the host `HOME`, which the
    runtime already exposes:

    ```sh
    HOME="$PAPERCLIP_GITHUB_HOST_HOME" gh auth status
    HOME="$PAPERCLIP_GITHUB_HOST_HOME" \
      git -c credential.helper='!gh auth git-credential' push origin <branch>
    ```

    Use the per-command helper (`git -c`) instead of `gh auth setup-git`, which
    would write to the user's global `~/.gitconfig`. Do not conclude "there is no
    credential on this machine" without running `security default-keychain`
    first.

11. **Adding a game touches only its folder and the registry.** Create
    `src/games/<id>/` with `index.ts` (calling `defineGame`), `rules.ts`,
    `rules.test.ts` (normal, edge, and tie case for each of the four rule
    functions), `RoundEntry.tsx` (the game's own controlled editor of one
    round: no submit button, tolerant of any stored value, 44 px targets; it
    uses the shell's look — `btn-3d` plus a color modifier such as `btn-blue`
    for a selected choice and `btn-plain` otherwise, token utilities, never a
    literal color; see
    [`specs/004-game-style-ui/contracts/ui-parts.md`](specs/004-game-style-ui/contracts/ui-parts.md)), and `RoundEntry.browser.test.tsx` (empty, valid, and
    garbage values render; a normal interaction emits a value `validateRound`
    accepts). Then add one import and one array entry in
    `src/games/registry.ts`. Nothing else. `tests/shell-boundary.test.ts` fails
    if any file under `src/` outside `src/games/` imports a game folder or
    compares or switches on a game id, and checks that each game's `id` equals
    its folder name. Contracts:
    [`specs/002-game-contract/contracts/game-contract.md`](specs/002-game-contract/contracts/game-contract.md)
    and
    [`specs/003-shell-screens/contracts/round-entry.md`](specs/003-shell-screens/contracts/round-entry.md).
    `src/games/meche-meche/` is the reference game (rules, entry, and an
    end-to-end test inside its own folder); the fixture games' entries and
    `tests/fixtures/games/round-entry-harness.tsx` are smaller examples.
12. **The match store lives in `MatchApp`, the only island.**
    `src/shell/ui/MatchApp.tsx` creates it once per mount (lazy `useState`),
    reads it with `useSyncExternalStore`, and calls `dispose()` on unmount; it
    is rendered with `client:only="react"` from `src/components/MatchIsland.tsx`
    (production) and `tests/fixtures/dev/DevMatchIsland.tsx` (`/dev/test-games`,
    `pnpm dev` only). Do not create a second store or island.
    `createMatchStore` reads storage once, at creation, and follows other tabs
    through the `storage` event. It never throws on bad stored data: it starts
    empty and exposes `getDiscardNotice()`, which `MatchApp` shows once.
    Contract:
    [`specs/002-game-contract/contracts/match-store.md`](specs/002-game-contract/contracts/match-store.md).

## Versioned or not

- **In git:** `.specify/` (constitution, templates, scripts, extension
  registry), `specs/**`, `.claude/skills/speckit-*`. Without these the process
  does not exist in a fresh clone.
- **Outside git:** `.claude/settings.local.json` (local permissions),
  `.specify/extensions/.cache/`, and whatever `.specify/.gitignore` (maintained
  by the CLI) already covers.
