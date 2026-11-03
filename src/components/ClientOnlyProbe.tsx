/**
 * Proves, before any match screen exists, that a component can run only in
 * the browser and never during the build (Principle IV).
 *
 * Three things this component deliberately does NOT do:
 *
 * - It does not touch localStorage. Using it here would violate the phase's
 *   negative scope (FR-018) and leave an orphan key that Phase 3 would find
 *   and have to interpret.
 * - It does not hold match state. There is no persisted schema in this phase.
 * - It does not try to be pretty. Phase 4 removes this component.
 *
 * What is NOT disposable is the test that comes with it
 * (tests/static-build.test.ts). The component is documentation, and
 * documentation does not prevent regressions; the test is what makes
 * Principle IV fail in CI.
 */
export default function ClientOnlyProbe() {
  // `screen` is unambiguously unavailable outside the browser. If this line
  // ran during the build, the build would break here -- which is exactly the
  // detection we want.
  const screenWidth = globalThis.screen.width;

  return (
    <p
      data-testid="client-only-probe"
      className="mt-6 rounded border border-current/20 px-3 py-2 text-sm"
    >
      Ilha <code>client:only</code> ativa. Largura de tela lida no navegador:{' '}
      <strong>{screenWidth}px</strong>.
    </p>
  );
}
