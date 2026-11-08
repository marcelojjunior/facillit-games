/**
 * Theme choice — automatic, light, dark — in the shared header, so it is on
 * every screen (FR-020, research D10 of spec 003). Applies at once; saving is
 * best effort and never blocks (FR-020a). In automatic it follows the device
 * live (SC-008). The pre-paint script already set the initial theme.
 */
import { useEffect, useState, type ReactNode } from 'react';

import type { StorageLike } from '../../match/persistence';
import {
  applyTheme,
  readThemeChoice,
  resolveTheme,
  writeThemeChoice,
  type ThemeChoice,
} from '../../theme/preference';
import { labels } from '../copy';
import { AutoThemeIcon, MoonIcon, SunIcon } from './icons';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const OPTIONS: readonly { choice: ThemeChoice; label: string; icon: ReactNode }[] = [
  { choice: 'auto', label: labels.themeAuto, icon: <AutoThemeIcon /> },
  { choice: 'light', label: labels.themeLight, icon: <SunIcon /> },
  { choice: 'dark', label: labels.themeDark, icon: <MoonIcon /> },
];

export function ThemeControl({ storage }: { readonly storage: StorageLike | null }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice(storage));

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => applyTheme(document.documentElement, resolveTheme(choice, media.matches));
    apply();
    if (choice !== 'auto') {
      return;
    }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [choice]);

  return (
    <div
      data-testid="theme-control"
      role="group"
      aria-label={labels.theme}
      className="card-3d flex gap-0.5 p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.choice}
          type="button"
          aria-label={option.label}
          title={option.label}
          aria-pressed={choice === option.choice}
          onClick={() => {
            setChoice(option.choice);
            writeThemeChoice(storage, option.choice);
          }}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted aria-pressed:bg-blue aria-pressed:text-on-color aria-pressed:shadow-[inset_0_-3px_0_var(--color-blue-edge)]"
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
