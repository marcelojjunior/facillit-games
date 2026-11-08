/**
 * Source of the inline script that sets the theme before first paint
 * (FR-020, SC-008, research D7 of spec 003). A module would run too late: the
 * page would paint in the device theme first, then flip.
 *
 * The parsing and resolving logic is not copied by hand: the source of the
 * two self-contained functions in preference.ts is inlined here, so the
 * script and the module cannot disagree (boot.test.ts checks it).
 *
 * It reads only the theme key, never match state (Principle IV).
 */
import { parseThemeChoice, resolveTheme, THEME_KEY } from './preference';

export function bootScript(): string {
  return `(function () {
  var parse = ${parseThemeChoice.toString()};
  var resolve = ${resolveTheme.toString()};
  var raw = null;
  try { raw = localStorage.getItem(${JSON.stringify(THEME_KEY)}); } catch (e) {}
  var dark = false;
  try { dark = matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
  var theme = resolve(parse(raw), dark);
  var root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`;
}
