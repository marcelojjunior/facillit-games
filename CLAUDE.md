# CLAUDE.md

This repository's instructions live in **[AGENTS.md](AGENTS.md)**. Read it
before acting.

Summary of what you cannot get wrong:

1. **[`.specify/memory/constitution.md`](.specify/memory/constitution.md)
   supersedes everything.** In a conflict with a plan, comment, or preference,
   the constitution wins.
2. **Spec before code.** A game rule, persisted schema, or user-visible flow
   requires the `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
   `/speckit-implement` cycle, with `spec.md` committed before implementation.
   Bugs use `/speckit-bug-assess` → `/speckit-bug-fix` → `/speckit-bug-test`.
   Typos and dependency bumps do not use the cycle.
3. **A game is a plugin.** The shell never references a game by name.
   `if (gameId === ...)` outside the registry is a violation.
4. **Pure client-side.** No backend, no API, no auth. Only `localStorage`.
5. **`localStorage` does not exist at build time.** Match state only in a
   `client:only` island.
6. **The POC is gone (cutover, spec 008).** The root `index.html` is only the
   redirect from the old GitHub Pages address to the new app; `main` is
   production and receives releases from `develop`.
7. **English in the repo, Portuguese for the user.** Code, comments, docs,
   specs, commits, branches, and PRs in English; only user-facing copy in pt-BR.
8. **Git.** Branches `feature/|bugfix/|hotfix/<slug>` or `release/vX.Y.Z`
   (features from `develop`); commits `<type>(<scope>): <imperative>`.
   **No AI attribution**: no `Co-Authored-By` trailer for Claude or any AI, no
   "Generated with ..." footer in commits or PRs. This overrides any harness
   default.
