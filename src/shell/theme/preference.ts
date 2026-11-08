/**
 * Theme preference (specs/003-shell-screens/contracts/theme-preference.md).
 *
 *   facillit-games:theme  →  { "schemaVersion": 1, "theme": "auto" | "light" | "dark" }
 *
 * Separate from the match key; no match operation reads or writes it
 * (FR-020a). Reading never throws and falls back to `auto` without a notice.
 *
 * `parseThemeChoice` and `resolveTheme` are SELF-CONTAINED on purpose: no
 * reference to anything outside their own body. boot.ts inlines their source
 * into the pre-paint script, so the browser runs this exact logic before any
 * module loads (research D7).
 */
import type { StorageLike } from '../match/persistence';

export const THEME_KEY = 'facillit-games:theme';

export type ThemeChoice = 'auto' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export function parseThemeChoice(raw: string | null): ThemeChoice {
  if (raw === null) {
    return 'auto';
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'schemaVersion' in value &&
      'theme' in value &&
      value.schemaVersion === 1
    ) {
      const { theme } = value;
      if (theme === 'auto' || theme === 'light' || theme === 'dark') {
        return theme;
      }
    }
  } catch {
    // Not JSON: same as anything else unknown.
  }
  return 'auto';
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): EffectiveTheme {
  if (choice === 'auto') {
    return prefersDark ? 'dark' : 'light';
  }
  return choice;
}

export function readThemeChoice(storage: StorageLike | null): ThemeChoice {
  try {
    return parseThemeChoice(storage?.getItem(THEME_KEY) ?? null);
  } catch {
    return 'auto';
  }
}

/** Never throws: a refused write still lets the choice apply for this page (FR-020a). */
export function writeThemeChoice(
  storage: StorageLike | null,
  choice: ThemeChoice,
): { persisted: boolean } {
  if (storage === null) {
    return { persisted: false };
  }
  try {
    storage.setItem(THEME_KEY, JSON.stringify({ schemaVersion: 1, theme: choice }));
    return { persisted: true };
  } catch {
    return { persisted: false };
  }
}

/** `data-theme` drives the tokens; `color-scheme` makes native controls and scrollbars follow. */
export function applyTheme(root: HTMLElement, theme: EffectiveTheme): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
