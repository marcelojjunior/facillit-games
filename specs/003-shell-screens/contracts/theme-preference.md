# Contract: Theme preference storage

**Consumers**: the pre-paint boot script, the theme control, tests.
Principle VII applies: this is persisted data.

## Key and envelope

```text
facillit-games:theme  →  { "schemaVersion": 1, "theme": "auto" | "light" | "dark" }
```

- Separate key from `facillit-games:state` (the match); same `facillit-games:`
  namespace (spec 002 FR-023).
- Written only when the player picks a value in the theme control.
- Never written, read, or cleared by match operations (`discardMatch`,
  `finish`, `createRematch`) (FR-020a).

## Reading

```ts
// src/shell/theme/preference.ts
type ThemeChoice = 'auto' | 'light' | 'dark';
type EffectiveTheme = 'light' | 'dark';

readThemeChoice(storage: StorageLike | null): ThemeChoice
writeThemeChoice(storage: StorageLike | null, choice: ThemeChoice): { persisted: boolean }
resolveTheme(choice: ThemeChoice, prefersDark: boolean): EffectiveTheme
```

| Stored value | `readThemeChoice` |
|---|---|
| missing key | `auto` |
| not JSON, not an object | `auto` |
| `schemaVersion` ≠ 1 | `auto` |
| `theme` not one of the three | `auto` |
| storage access throws | `auto` |
| valid | the stored `theme` |

No notice is shown for any fallback (FR-020a); an invalid value is left in
place until the next write overwrites it.

`writeThemeChoice` never throws: a failed write returns `{ persisted: false }`
and the choice still applies for the page's lifetime.

## Applying

- The effective theme is set as `data-theme="light" | "dark"` on `<html>`,
  plus `style.colorScheme` with the same value (native controls and scrollbars
  follow).
- Before first paint: the inline boot script (research D7) runs
  `readThemeChoice` + `resolveTheme` with the same code as the module (its body
  is generated from it at build time).
- In `auto`, a `prefers-color-scheme` change re-applies the theme without
  reload (SC-008).
- Other open tabs apply a new choice on their next load; no live cross-tab sync.

## Future versions

An incompatible change bumps `schemaVersion`; older values then read as `auto`
— an explicit decision to discard, allowed by Principle VII, because losing a
theme choice costs one tap.
