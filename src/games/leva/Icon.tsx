/**
 * LEVA on the game list: a face with a card held on the forehead (spec 007,
 * contracts/game-icon.md of spec 006). White strokes (`currentColor`), the
 * card face filled with the badge color (`var(--badge)`).
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
      strokeLinecap="round"
      fill="none"
    >
      <circle cx="12" cy="15" r="7" />
      <circle cx="9.5" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M10 18.5q2 1.2 4 0" />
      <rect x="8.5" y="2" width="7" height="10" rx="1.4" fill="var(--badge)" />
      <path
        d="M12 9.2c-1.2-.8-2-1.5-2-2.3 0-.6.5-1.1 1-1.1.5 0 .8.2 1 .6.2-.4.5-.6 1-.6.5 0 1 .5 1 1.1 0 .8-.8 1.5-2 2.3z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
