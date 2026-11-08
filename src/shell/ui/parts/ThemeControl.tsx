/**
 * The theme button, in the shared header so it is on every screen (spec 004
 * FR-017a, research D13; replaces spec 003's three options).
 *
 * With nothing chosen (`auto`), the theme follows the device and changes with
 * it; a device that says nothing means light. A tap stores the opposite of
 * what is shown, which then wins over the device. Saving is best effort and
 * never blocks (spec 003 FR-020a). The pre-paint script already set the
 * first frame's theme.
 */
import { useEffect, useState } from 'react';

import type { StorageLike } from '../../match/persistence';
import {
  applyTheme,
  readThemeChoice,
  resolveTheme,
  writeThemeChoice,
  type ThemeChoice,
} from '../../theme/preference';
import { labels } from '../copy';
import { MoonIcon, SunIcon } from './icons';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function deviceMedia(): MediaQueryList | null {
  try {
    return window.matchMedia(DARK_QUERY);
  } catch {
    return null; // no preference available: light (resolveTheme with false)
  }
}

export function ThemeControl({ storage }: { readonly storage: StorageLike | null }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice(storage));
  const [prefersDark, setPrefersDark] = useState(() => deviceMedia()?.matches ?? false);
  const theme = resolveTheme(choice, prefersDark);

  useEffect(() => {
    applyTheme(document.documentElement, theme);
  }, [theme]);

  useEffect(() => {
    const media = deviceMedia();
    if (media === null) {
      return;
    }
    const follow = () => setPrefersDark(media.matches);
    media.addEventListener('change', follow);
    return () => media.removeEventListener('change', follow);
  }, []);

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? labels.themeToDark : labels.themeToLight;

  return (
    <button
      type="button"
      data-testid="theme-control"
      aria-label={label}
      title={label}
      onClick={() => {
        setChoice(next);
        writeThemeChoice(storage, next);
      }}
      className="btn-3d btn-plain size-12 px-0"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
