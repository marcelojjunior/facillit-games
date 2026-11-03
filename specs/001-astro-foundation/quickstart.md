# Phase 1 — Quickstart: validate the foundation

**Feature**: `specs/001-astro-foundation/`

Script to prove that the foundation works. Each step points to the success
criterion it verifies, so that a reviewer can check the spec instead of
trusting the report.

The order matters: steps 1 to 5 prove that the commands **pass**; steps 6
to 9 prove that they **fail**. The second half is the one that matters — a
verification command that never fails verifies nothing.

## Prerequisites

- Node `>=22.23.4` — the real floor of `astro@7.4.4`, not "current LTS". Check with
  `node -v`.
- Corepack enabled, or pnpm at the version declared in `packageManager`.
- **No** environment variables, `.env` file or credentials. The absence is
  part of what is being tested (FR-003).

## Part 1 — the commands pass

### 1. Install from a clean clone → SC-001

```sh
pnpm install
```

**Expected**: finishes successfully, using `pnpm-lock.yaml`. Does not ask for
configuration or environment variables.

Also confirm with `pnpm peers check`: the expected response is **"No peer
dependency issues found"**.

> If a warning about `oxc-transform-react` shows up, someone declared it as a
> dependency. Remove it. It is an `optional` peer in `@astrojs/react` and in
> `@vitejs/plugin-react`, with **disjoint** ranges — no version satisfies
> both, and declaring it is the only way to create the warning. See
> [research.md, Decision 5](./research.md).

### 2. Generate the static artifact → SC-001, FR-002

```sh
pnpm build
ls dist/
```

**Expected**: `dist/` exists and contains `index.html`. The build finishes with code
`0`.

**Check that there is no server runtime** (Principle I):

```sh
find dist -name '*.func' -o -name '_worker.js' -o -name 'entry.mjs' | head
```

**Expected**: empty output.

### 3. Serve the artifact with no logic → SC-002

```sh
pnpm preview
```

Open the printed URL. **Expected**: the page loads, the proof island appears with
the value read from the browser, and the console stays **free of errors and of hydration
mismatch warnings**.

> This check is manual in this phase, by a decision recorded in
> [spec.md § Assumptions](./spec.md). An automated browser test is a
> Phase 4 candidate.

### 4. Confirm that the island did not render at build time → SC-005, Principle IV

```sh
grep -c 'client-only-probe' dist/index.html
```

**Expected**: `0`. The island's rendered markup is **not** in the generated HTML —
that is what distinguishes `client:only` from `client:load`.

Step 5 checks the same thing automatically; do this one by hand once, to see
with your own eyes what the test asserts.

### 5. Run the suite, the typecheck and the lint → SC-003, SC-004, SC-007

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

**Expected**: all with code `0`. `pnpm test` reports **at least one test
run** and zero failures, and **does not enter watch mode**.

### 6. Confirm that the POC is untouched → SC-006, FR-016

```sh
git diff --stat chore/spec-kit -- index.html script.js style.css
```

**Expected**: empty output — zero lines changed in the three files.

Also run it **after** `pnpm format`, which is the command most likely to
rewrite the POC by accident:

```sh
pnpm format && git status --porcelain -- index.html script.js style.css
```

**Expected**: empty output.

### 7. Confirm the negative scope → SC-008, FR-018

```sh
grep -rniE 'localStorage|schemaVersion|GameDefinition|meche' dist/
```

**Expected**: empty output. This phase does not anticipate the game contract, the persisted
schema or any game by name.

> The search is over the **artifact** (`dist/`), not `src/` and `tests/`. Those two
> mention the terms in comments and in the very assertion that requires their
> absence (`tests/static-build.test.ts`) — grep there returns a false positive. What
> SC-008 means is that none of this reaches the browser, and that is what `dist/`
> answers. The same test performs this check automatically.

## Part 2 — the commands fail

Each step below introduces a deliberate defect, confirms that the
corresponding command **fails**, and undoes it. If any of them passes, the command is decorative and the
phase is not done.

### 8. The test runner really fails → SC-003, FR-009

Add to a test file:

```ts
it('falha de proposito', () => {
  expect(1).toBe(2);
});
```

```sh
pnpm test; echo "exit=$?"
```

**Expected**: `exit` other than `0`. Remove the test.

### 9. The typecheck fails on a type error → SC-004, FR-006

Add to a `.ts` file under `src/`:

```ts
const n: number = 'texto';
```

```sh
pnpm typecheck; echo "exit=$?"
```

**Expected**: `exit` other than `0`. Remove the line.

### 10. The formatting check fails → SC-007, FR-014

Break the indentation of a file in `src/` and run:

```sh
pnpm format:check; echo "exit=$?"
```

**Expected**: `exit` other than `0`, pointing at the file. Then:
`pnpm format` to restore.

### 11. The build fails on a browser API at build time → Principle IV

Swap `client:only` for `client:load` on the proof island in
`src/pages/index.astro` and run:

```sh
pnpm build; echo "exit=$?"
pnpm test; echo "exit=$?"
```

**Expected**: the build fails, **or** it passes and `pnpm test` fails on finding the
island's markup in `dist/index.html`. In either case, the pipeline
flags it — which is the point.

**This is the most important step of the script.** It is the only verification that
this project's central trap is covered by something that fails
automatically, and not merely documented. Revert the directive when done.

## Phase done criteria (summary)

| Criterion from issue MJR-9 | Verified in |
|---|---|
| `pnpm install && pnpm build` generates a static artifact | steps 1 and 2 |
| `pnpm test` runs Vitest successfully | step 5 (and step 8 proves it fails) |
| `specs/NNN-*/spec.md` committed and `plan.md` with Constitution Check | `61cc74a`; [plan.md § Constitution Check](./plan.md) |
| No POC file changed | step 6 |
