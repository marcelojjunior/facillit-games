# Implementation Plan: Cutover from the POC to the new app

**Branch**: `feature/cutover` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the POC's `index.html` with a small static redirect page, delete
`script.js` and `style.css`, add `.nojekyll`, lift the frozen-POC guards, and
update the docs. Then `develop` fast-forwards into `main`; GitHub Pages serves
the redirect page from the root of `main`.

## Technical Context

Plain HTML at the repository root (not part of the Astro build, which writes
`dist/`). No dependency. The test lives in `tests/static-build.test.ts`, which
already reads root files.

## Constitution Check

| Principle | Verdict | Note |
|---|---|---|
| I Pure client-side | PASS | A static page; it links to and redirects to our own app, loads nothing. |
| II–V | PASS | Not touched. |
| VI Mobile-first | PASS | 360 px, 44 px button. |
| VII Versioned schema | PASS | No storage. |
| VIII Spec before code | PASS | This spec committed before the change. |
| IX Language | PASS | Page copy in pt-BR; code and docs in English. |
| Git conventions | PASS | `main` reached by fast-forward from `develop` (FR-007). |

## Design

- **`index.html`**: `<html lang="pt-BR">`; in `<head>`, an inline script
  `location.replace('https://facillit-games.vercel.app/')` (FR-001; `replace`
  keeps the old page out of the back history). The body is the fallback: the
  title, the message, and `<a class="button" href="https://facillit-games.vercel.app/">`
  (FR-002). Inline CSS with the app's sky colors and system fonts (FR-003).
- **`.nojekyll`** at the root (FR-005): without it, GitHub Pages would run
  Jekyll over `specs/` and the docs, which may fail the Pages build on Liquid
  syntax.
- **Guards**: remove the POC entries from `.prettierignore`, `eslint.config.js`
  and `tsconfig.json`; replace the "frozen POC" tests with "redirect page"
  tests.
- **Docs**: README (repository table, the tsconfig pitfall), AGENTS.md
  (`main` section, pitfalls 4 and 5), CLAUDE.md (point 6).

## Files

```text
index.html                     # the redirect page (rewritten)
script.js, style.css           # deleted
.nojekyll                      # new, empty
.prettierignore, eslint.config.js, tsconfig.json   # POC exclusions removed
tests/static-build.test.ts     # frozen POC → redirect page
README.md, AGENTS.md, CLAUDE.md
```
