/**
 * The shell's mascot: a smiling die (spec 004 FR-009, research D5), drawn
 * from the approved prototype with token fills only, so it follows no theme
 * and names no game. Decorative: hidden from assistive technology. It bobs
 * gently; the global reduced-motion rule stops it (research D7).
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
          <path
            d="M6 44 L10 10 L28 28 L40 4 L52 28 L70 10 L74 44 Z"
            className="fill-gold stroke-yellow-edge"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="30" r="5" className="fill-red" />
          <circle cx="22" cy="36" r="3.5" className="fill-blue" />
          <circle cx="58" cy="36" r="3.5" className="fill-green" />
        </svg>
      )}
      <svg viewBox="0 0 140 150" className="block w-full">
        <ellipse cx="70" cy="143" rx="42" ry="6" className="fill-face opacity-15" />
        <rect x="44" y="122" width="18" height="16" rx="8" className="fill-blue-edge" />
        <rect x="78" y="122" width="18" height="16" rx="8" className="fill-blue-edge" />
        <path
          d="M24 72 q-16 -10 -12 -32"
          className="fill-none stroke-die-edge"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <circle cx="12" cy="38" r="8" className="fill-die stroke-die-edge" strokeWidth="3" />
        <path
          d="M116 78 q14 6 13 22"
          className="fill-none stroke-die-edge"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <rect x="20" y="24" width="100" height="104" rx="28" className="fill-die-edge" />
        <rect x="20" y="16" width="100" height="104" rx="28" className="fill-die" />
        <g className="fill-pip">
          <circle cx="40" cy="36" r="7" />
          <circle cx="100" cy="36" r="7" />
          <circle cx="40" cy="102" r="7" />
          <circle cx="100" cy="102" r="7" />
        </g>
        <ellipse cx="56" cy="64" rx="7" ry="9" className="fill-face" />
        <ellipse cx="84" cy="64" rx="7" ry="9" className="fill-face" />
        <circle cx="58.5" cy="60" r="2.6" className="fill-die" />
        <circle cx="86.5" cy="60" r="2.6" className="fill-die" />
        <ellipse cx="44" cy="79" rx="7" ry="4.5" className="fill-red-hi opacity-75" />
        <ellipse cx="96" cy="79" rx="7" ry="4.5" className="fill-red-hi opacity-75" />
        <path
          d="M58 80 Q70 92 82 80"
          className="fill-red stroke-face"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
