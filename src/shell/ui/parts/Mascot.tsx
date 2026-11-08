/**
 * The shell's mascot: a smiling die (spec 004 FR-009, research D5). The
 * drawing lives once in the page as a static sprite
 * (`src/components/MascotSprite.astro`, spec 004 research D11) and is
 * referenced here, so it adds no weight to the island's script. Decorative:
 * hidden from assistive technology. It bobs gently; the global reduced-motion
 * rule stops it (research D7).
 */
interface MascotProps {
  /** On the winner screen. */
  readonly crown?: boolean;
  /** Size and placement from the caller (e.g. `w-24`). */
  readonly className?: string;
}

export function Mascot({ crown = false, className = '' }: MascotProps) {
  return (
    <span
      data-testid="mascot"
      data-crown={crown ? 'true' : undefined}
      aria-hidden="true"
      className={`mascot-bob relative inline-block shrink-0 ${className}`}
    >
      {crown && (
        <svg viewBox="0 0 80 50" className="absolute -top-[22%] left-[28%] w-[44%]">
          <use href="#mascot-crown" />
        </svg>
      )}
      <svg viewBox="0 0 140 150" className="block w-full">
        <use href="#mascot-die" />
      </svg>
    </span>
  );
}
