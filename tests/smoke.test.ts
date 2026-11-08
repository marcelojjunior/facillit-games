import { describe, expect, it } from 'vitest';

import MatchIsland from '../src/components/MatchIsland';

/**
 * Proves that the test runner works (FR-009) and that it resolves the
 * project's TypeScript modules without per-file configuration (FR-010).
 *
 * It is not `expect(true).toBe(true)` on purpose: that would satisfy FR-009 in
 * appearance and prove nothing. Importing a .tsx actually exercises the chain
 * Phase 3 will depend on -- module resolution, JSX transformation, and the
 * configuration inherited from getViteConfig.
 */
describe('test runner', () => {
  it('resolves a project TypeScript module', () => {
    expect(MatchIsland).toBeTypeOf('function');
  });

  it('runs in an environment without DOM, so an impure scoring rule fails', () => {
    // Principle III forbids a scoring rule from touching the DOM. The default
    // environment is `node` precisely so that an impure rule FAILS the test
    // instead of passing silently in a lenient jsdom.
    //
    // If this assertion breaks, someone switched the default environment to
    // jsdom and disarmed the Principle III check without noticing.
    expect(globalThis).not.toHaveProperty('document');
  });
});
