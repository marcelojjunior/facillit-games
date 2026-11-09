---

description: "Task list for 008-cutover"
---

# Tasks: Cutover from the POC to the new app

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

Rules: tests first; before each commit the full gate (`pnpm build && pnpm test
&& pnpm typecheck && pnpm lint && pnpm format:check`); no AI attribution.

## US1 — The old address leads to the new app (P1)

- [X] T001 [US1] Replace the "frozen POC" block of `tests/static-build.test.ts` (expected to fail first): root `index.html` has `lang="pt-BR"`, a `location.replace('https://facillit-games.vercel.app/')` script, a link to `https://facillit-games.vercel.app/` in the body, the word "mudou", no `src=`/`href=` to any other host or file (FR-001–FR-003); `script.js` and `style.css` do not exist; `.nojekyll` exists (FR-005)
- [X] T002 [US1] Rewrite `index.html` as the redirect page per plan; make T001 pass
- [X] T003 [US1] Check the page at 360 px with scripts off (fallback, no sideways scroll, button ≥ 44 px) and with scripts on (lands on the new address)

## US2 — One source of truth (P2)

- [X] T004 [US2] Delete `script.js` and `style.css`; add an empty `.nojekyll`; remove the POC exclusions from `.prettierignore`, `eslint.config.js`, `tsconfig.json`
- [X] T005 [US2] Update README.md, AGENTS.md, CLAUDE.md for the state after the cutover (FR-006)
- [X] T006 Gate; PR into `develop`; after the owner's go-ahead, fast-forward `main` to `develop` (FR-007)
