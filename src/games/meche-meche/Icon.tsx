/**
 * MECHE-MECHE on the game list: three playing cards in a fan (spec 006
 * FR-006, contracts/game-icon.md). White strokes (`currentColor`), faces
 * filled with the badge color (`var(--badge)`) so the back cards hide behind
 * the front one; a heart on the front card.
 */
export default function Icon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="var(--badge)"
    >
      <rect x="7" y="4" width="10" height="14" rx="1.8" transform="rotate(-22 12 20)" />
      <rect x="7" y="4" width="10" height="14" rx="1.8" />
      <g transform="rotate(22 12 20)">
        <rect x="7" y="4" width="10" height="14" rx="1.8" />
        <path
          d="M12 14.2c-1.6-1.1-2.6-2-2.6-3.1 0-.8.6-1.4 1.3-1.4.6 0 1 .3 1.3.8.3-.5.7-.8 1.3-.8.7 0 1.3.6 1.3 1.4 0 1.1-1 2-2.6 3.1z"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </svg>
  );
}
