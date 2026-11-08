/**
 * Falling confetti on the winner screen (spec 004 FR-014). One element; the
 * pieces' colors, positions, and timing come from CSS (`.confetti` in
 * global.css), so the island ships almost no code for it (research D11).
 * Not displayed at all when the device asks for reduced motion.
 */
const PIECES = 14;

export function Confetti() {
  return (
    <div
      data-testid="confetti"
      aria-hidden="true"
      // Behind the content (above the scene, which sits at -z-10).
      className="confetti pointer-events-none fixed inset-0 -z-5 overflow-hidden motion-reduce:hidden"
    >
      {Array.from({ length: PIECES }, (_, index) => (
        <i key={index} />
      ))}
    </div>
  );
}
