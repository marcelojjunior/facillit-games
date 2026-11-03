# Phase 1 — Contract: pipeline scripts

**Feature**: `specs/001-astro-foundation/`

The only interface this feature exposes is the **set of
`package.json` scripts**. There is no API, endpoint or data contract — the application is
static and client-side (Principle I).

This set is a real contract, not documentation: Phases 3 to 6, review
and the publishing pipeline depend on these names. Renaming or removing a script
from here is a breaking change and requires updating this spec in the same PR
(Principle VIII).

## Scripts

| Script | Does | Exits with an error when | Requirement |
|---|---|---|---|
| `pnpm install` | Installs dependencies from the versioned lockfile | lockfile diverges from `package.json`, or Node outside `engines` | FR-001, FR-004 |
| `pnpm build` | Generates the static artifact in `dist/` | any build error, including execution of a browser API at build time | FR-001, FR-002 |
| `pnpm dev` | Development server with HMR | port in use | convenience — not a done criterion |
| `pnpm preview` | Serves `dist/` as static files, with no logic | `dist/` missing | SC-002 |
| `pnpm typecheck` | Type checking in strict mode (`astro check`) | any type error | FR-006, SC-004 |
| `pnpm test` | Unit suite (Vitest, a single pass, no watch) | any failing test | FR-008, FR-009, SC-003 |
| `pnpm test:watch` | Vitest in watch mode, for development | — | convenience |
| `pnpm lint` | ESLint over `src/` and `tests/` | any lint error | FR-014, FR-015 |
| `pnpm format` | Prettier **writing** | — | convenience |
| `pnpm format:check` | Prettier **checking**, without writing | any file not matching the standard | FR-014, SC-007 |

## Contract invariants

These properties are what the following phases are entitled to assume. Breaking
any of them is a contract break, even if the script names stay the same.

1. **`pnpm test` is a single pass, not watch.** A `pnpm test` that enters watch mode
   hangs CI and hangs agent sessions. The interactive variant has its own name
   (`test:watch`).
2. **No script requires an environment variable, secret or credential** (FR-003,
   Principle I). Running with an empty environment is the tested case, not the degraded one.
3. **No script requires network access after `install`.** `build`, `test`,
   `typecheck`, `lint` and `format:check` run offline.
4. **`typecheck`, `lint` and `format:check` ignore `index.html`, `script.js` and
   `style.css`** (FR-015, FR-016). No tool may rewrite or fail
   the frozen POC. In particular, `pnpm format` does **not** change these files.
5. **`build` produces only static files** — no server function, no
   adapter, no resident process (FR-002).
6. **Each verification command really fails.** `test`, `typecheck`,
   `lint` and `format:check` must fail when faced with a deliberate defect; a
   command that passes vacuously does not fulfill the contract (FR-009, SC-003, SC-004,
   SC-007). The [quickstart.md](../quickstart.md) script exercises this.
7. **`build` fails if a browser API is executed at build time.**
   That is what makes a Principle IV violation visible in the pipeline instead of on the
   user's phone.

## What this contract deliberately does not pin

- **Output directory name** beyond `dist/` — it is Astro's default and the
  hosting platform detects it on its own. Pinning another would only create
  configuration to maintain.
- **Deploy script.** Publishing is a human step in this instance (no
  Vercel connection for agents) and the static build is detected automatically.
  A falsely helpful `pnpm deploy` would hide that the step is human.
- **Aggregating CI script** (`pnpm ci` or similar). Useful, but there is no CI
  configured yet; inventing the name now is a guess about a phase that has not started.
  Whoever configures CI composes it from the scripts above.
