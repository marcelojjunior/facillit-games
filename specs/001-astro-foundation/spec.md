# Feature Specification: Technical foundation and static pipeline

**Feature Branch**: `astro`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Technical foundation of Facillit Games: create the empty application shell and the static build pipeline, with no game screen at all. Delivers an Astro project with static output, strict TypeScript, Tailwind, React enabled for client:only islands, managed by pnpm, with Vitest configured and running, and lint/format configured. The current POC (index.html, script.js, style.css) stays frozen and untouched. Does not include the GameDefinition contract, persistence schema, design system, screens or any game — that comes in the following phases. The verifiable goal is: pnpm install && pnpm build produces a static artifact publishable on a CDN, pnpm test runs Vitest successfully, and the configuration does not rule out client:only islands for match state."

## Note on the reader of this spec

The "user" of this feature is not the player: it is **whoever builds the
following phases** (Phase 3 — game contract, Phase 4 — design system, Phase 5 —
first game) and the **publishing pipeline**. The feature delivers no screen to
the end player.

The technologies named here are not decisions of this spec. They are
**inherited constraints** from the "Additional Constraints" section of the
constitution (`Fixed stack`), which can only be changed by amendment. This spec
treats them as input data, not as an implementation choice.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Static artifact reproducible from a fresh clone (Priority: P1)

Whoever takes over the following phases clones the repository on a clean
machine, runs a couple of documented commands and gets a directory of static
files ready to publish on a CDN — without configuring a server, without filling
in an environment variable, without a credential.

**Why this priority**: without this nothing afterwards can be published or
reviewed. It is the only deliverable of this phase without which all the others
are useless.

**Independent Test**: in a clean clone, install the dependencies and run the
build; verify that the output directory exists, contains a servable HTML
document and that the process exits with a success code without asking for any
configuration.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository with no dependencies installed and
   no environment variables defined, **When** the developer runs the install
   command followed by the build command, **Then** both finish successfully and
   a static output directory is produced.
2. **Given** the completed build, **When** the contents of the output directory
   are served by a static file server with no logic, **Then** the home page
   loads with no console error.
3. **Given** the completed build, **When** the artifact is inspected, **Then**
   there is no server function, handler, runtime adapter or file that requires
   execution on the server.

---

### User Story 2 - Test suite runnable from day one (Priority: P2)

Whoever implements Phase 3 needs to write a unit test for a scoring rule in the
very first commit. For that, the test runner has to exist, be configured and
prove that it runs — before any rule exists.

**Why this priority**: the constitution (Principle III) forbids a scoring rule
without a unit test. If the test runner is not ready in this phase, Phase 3
starts out violating the constitution or stops to configure it.

**Independent Test**: run the test command and verify that it reports at least
one executed test and exits with a success code.

**Acceptance Scenarios**:

1. **Given** the dependencies installed, **When** the developer runs the test
   command, **Then** the runner reports at least one executed test, zero
   failures, and exits with a success code.
2. **Given** an intentionally failing test, **When** the test command is run,
   **Then** it exits with an error code — that is, the command actually verifies
   something and does not pass empty.
3. **Given** a module written in TypeScript with strict typing, **When** a test
   imports it, **Then** the test resolves the module and its types without
   additional configuration.

---

### User Story 3 - The configuration proves that browser state only runs on the client (Priority: P3)

The shell needs to prove, before any match screen exists, that it is possible
to mount a component that only executes in the browser and **never** during the
build.

**Why this priority**: it is the most expensive trap in this codebase and a
non-negotiable principle (Principle IV). Discovering in Phase 5 that the
configuration does not support this means redoing the screens. Proving it now
costs one trivial component.

**Independent Test**: create a component that reads a browser-only API, mount
it as a client-only island, and verify that the build finishes successfully
(because the component did not execute during the build) and that the generated
HTML does not contain the component's markup.

**Acceptance Scenarios**:

1. **Given** a component that accesses an API available only in the browser,
   **When** the build is executed, **Then** the build finishes successfully and
   does not fail due to the absence of that API.
2. **Given** the HTML generated by the build, **When** it is inspected, **Then**
   the rendered markup of the client-only component is not present — confirming
   that nothing of it was rendered during the build.
3. **Given** the page served in the browser, **When** it loads, **Then** the
   component appears and reads the browser API with no error and no hydration
   mismatch warning in the console.

---

### User Story 4 - Lint and formatting with a consistent verdict (Priority: P4)

Any person or agent opening a PR gets the same style and static quality verdict
as the reviewer, by running a local command.

**Why this priority**: it keeps review from spending attention on formatting.
Useful, but the project moves forward without it — which is why it is the lowest
priority.

**Independent Test**: run the lint command and the format check command on a
clean tree and confirm that both pass; introduce an obvious violation and
confirm that the corresponding command fails.

**Acceptance Scenarios**:

1. **Given** the working tree freshly created by this feature, **When** the lint
   and format check commands are run, **Then** both finish successfully and with
   no warning.
2. **Given** a file with formatting outside the configured standard, **When**
   the format check is run, **Then** it exits with an error code pointing to the
   file.
3. **Given** a file with a type error, **When** the type check is run, **Then**
   it exits with an error code pointing to the file.

---

### Edge Cases

- **The published POC is changed by accident.** The POC (`index.html`,
  `script.js`, `style.css`) stays live until the Phase 6 cutover. Any change to
  these three files — including automatic reformatting by a style tool — is a
  failure. The lint and formatting configuration MUST exclude them.
- **The new application collides with the POC at the repository root.** The POC
  files live at the root. The new application needs to coexist with them without
  overwriting, and its build output directory cannot coincide with the root.
- **Build in an environment without network after installing.** The build MUST
  NOT depend on network access nor on an external service at build time.
- **Build in an environment without environment variables.** No environment
  variable or secret MUST be required to install, build or test.
- **Output directory and tool artifacts committed by accident.** The build
  output directory, the tool cache and `node_modules` MUST be ignored by version
  control.
- **Divergent package manager.** Installing with a manager different from the
  one fixed in the constitution produces a dependency tree different from the
  reviewed one; the repository MUST declare the expected manager.

## Requirements *(mandatory)*

### Functional Requirements

**Pipeline and artifact**

- **FR-001**: The repository MUST declare an install command and a build command
  that, in that order, produce a static artifact from a clean clone.
- **FR-002**: The build MUST produce exclusively static files publishable on a
  CDN — no server function, no runtime adapter, no resident process.
- **FR-003**: Install, build and tests MUST NOT require an environment variable,
  secret, credential or external service.
- **FR-004**: The repository MUST explicitly declare the package manager and its
  version, and MUST commit the corresponding lock file.
- **FR-005**: The application MUST have a minimal home page that loads without
  error, serving only as proof that the pipeline works. It MUST NOT contain game
  navigation, a game list, player registration or any scorekeeper element.

**Typing**

- **FR-006**: The type check MUST run in strict mode and MUST be available as
  its own command, failing with an error code on a type error.
- **FR-007**: Strict mode MUST NOT be relaxed per file, per directory or by a
  suppression directive.

**Tests**

- **FR-008**: The repository MUST declare a test command that runs the unit
  suite and exits with an error code when any test fails.
- **FR-009**: The suite MUST contain at least one test that actually executes,
  proving that the runner is operational — and not a command that passes empty.
- **FR-010**: The tests MUST resolve the project's TypeScript modules without
  additional per-test configuration.

**Client-side rendering**

- **FR-011**: The configuration MUST allow declaring a component as a
  client-only island, which does not execute even once during the build.
- **FR-012**: The feature MUST include a minimal probe component, mounted as a
  client-only island, that accesses an API available only in the browser and
  demonstrates that the build does not execute it. This component MUST NOT read
  or write match state and MUST NOT persist anything.
- **FR-013**: The foundation documentation MUST record, in the plan and in
  `AGENTS.md` if necessary, that match state belongs to a client-only island, so
  that the following phases do not need to rediscover it.

**Static quality**

- **FR-014**: The repository MUST declare a lint command and a format check
  command, both exiting with an error code on a violation.
- **FR-015**: Lint, formatting and type check MUST exclude `index.html`,
  `script.js` and `style.css` from scope, so that no tool changes them.

**POC freeze**

- **FR-016**: `index.html`, `script.js` and `style.css` MUST remain
  byte-for-byte identical to their state before this feature.
- **FR-017**: The new application MUST coexist in the same tree as the POC
  without overwriting any of the three files, and its build output directory
  MUST be distinct from the repository root.

**Negative scope (verifiable)**

- **FR-018**: This feature MUST NOT introduce the game definition contract,
  persisted schema, local storage reads or writes, design system, product color
  tokens, nor any game folder.

### Key Entities

Not applicable: this feature introduces no persisted data and no domain entity.
The persisted schema is Phase 3 scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a clean clone, two documented commands produce a publishable
  static artifact, in an environment with no environment variable defined.
- **SC-002**: The artifact can be served by a static file server with no logic
  at all and the home page loads with zero console errors.
- **SC-003**: The test command reports at least one executed test and zero
  failures; introducing a deliberate failure makes the command exit with an
  error.
- **SC-004**: The type check command rejects a deliberately introduced type
  error.
- **SC-005**: The build completes successfully even containing a component that
  accesses a browser-only API, and the generated HTML does not contain that
  component's markup.
- **SC-006**: The diff of this feature against the previous state shows zero
  changed lines in `index.html`, `script.js` and `style.css`.
- **SC-007**: Lint and format check pass on the delivered tree, with no
  suppressed warning and no per-file exception beyond the POC freeze.
- **SC-008**: A search of the artifact and the application code finds no
  reference to local storage, to persisted schema nor to a game name.

## Assumptions

- The reader of this spec is whoever implements the following phases, not the
  end player. The feature delivers no value visible to the player — by
  decision, not by omission.
- The technologies are a constraint of the constitution (`Fixed stack`), not a
  choice of this spec. Changing them requires an amendment, not a spec change.
- Production publishing is outside this feature. Creating the project on the
  hosting platform is a human step, decided in the parent issue; here it is
  enough that the local build produces a valid static artifact and that no
  server configuration or credential is required.
- The delivered home page is disposable: Phase 4 replaces it with the design
  system and the real screens. Investing in appearance now is waste.
- The client-only island probe component is also disposable, but the **test**
  that the build does not render it must survive, because it guards Principle
  IV against regression.
- The "zero console error" and hydration check is done manually in this phase.
  Automated browser testing is not in the scope of the foundation.
- The POC and the new application coexist on the same branch until the Phase 6
  cutover; the cutover is not in the scope of this feature.
