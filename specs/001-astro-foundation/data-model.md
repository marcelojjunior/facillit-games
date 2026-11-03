# Phase 1 — Data Model: Technical foundation and static pipeline

**Feature**: `specs/001-astro-foundation/`

## No domain entity, by decision

This feature **introduces no persisted data, no domain entity and no read or
write to `localStorage`**. FR-018 and SC-008 make this verifiable: a search of
the code and the artifact must find no reference to local storage nor to a
persisted schema.

This file exists to record the absence as a choice, not as an oversight.

## Why not anticipate the model

It would be tempting to sketch the `GameDefinition` and the `localStorage`
schema here — they are already reasonably clear in the mind of anyone who has
read the constitution, and Phase 3 will need them anyway. Two reasons not to do
it:

1. **The constitution mandates spec before code, and the converse also holds:
   do not write code before the spec that governs it.** Principle VIII treats
   game rules and persisted schema as full-cycle material. A model written here,
   in a spec whose negative scope forbids it (FR-018), would be born without its
   own spec — and would be exactly the shortcut the principle exists to close.

2. **A model written now would be a guess that looks like a decision.** The
   risk is not getting it wrong; it is getting it partially right. Phase 3 would
   find a plausible `data-model.md`, written by the same person, and would have
   every incentive to treat it as a starting point instead of re-examining the
   problem. The cost shows up later, when the second game does not fit the
   contract and the shell has to change — which is precisely the property the
   constitution exists to protect.

## What this phase leaves ready for the Phase 3 model

Without designing the model, the foundation removes three concrete obstacles for
whoever designs it:

| Obstacle removed | How | Where |
|---|---|---|
| Modeling persisted schema without type guards | `astro/tsconfigs/strictest` enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` — which forces explicit handling of missing or corrupted payload, a requirement of Principle VII | [research.md, Decision 3](./research.md) |
| Writing a pure rule without a test runner | Vitest configured and provably running, with default `node` environment — a rule that touches the DOM **fails**, instead of passing silently | [research.md, Decision 4](./research.md) |
| Discovering late that state cannot render at build time | `client:only` island proven, with a test that runs the build and asserts the markup is absent from the HTML | [research.md, Decision 7](./research.md) |

## Ephemeral state in this phase

The probe island (`ClientOnlyProbe.tsx`) reads a browser-only API to
demonstrate that it does not execute at build time. To avoid misreading its
role:

- It does **not** persist anything and does **not** use `localStorage` — doing
  so would violate FR-018 and create an orphan key that Phase 3 would find and
  have to interpret.
- The API it reads is chosen because it is unequivocally unavailable outside the
  browser, not for any relation to the domain.
- It is **disposable**: Phase 4 removes it when delivering the real screens. The
  **test** that accompanies it is not disposable — it is what guards Principle
  IV against regression and must survive the removal of the component, then
  pointing at the first real match state island.

## No `localStorage` key reserved

This phase does **not** reserve a prefix, namespace or initial `schemaVersion`.
The key naming convention and versioning belong to the Phase 3 spec, together
with the migration path that Principle VII requires. Reserving a name here would
create a commitment without the decision that justifies it.
