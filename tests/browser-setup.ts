// Browser tests measure layout (44 px targets, overflow, the confirm bar in
// reach), so they must render with the real stylesheet. In the app it comes
// from BaseLayout.astro, which these tests never render.
import '../src/styles/global.css';

declare module 'vitest/browser' {
  interface BrowserCommands {
    /** Emulates the device's prefers-color-scheme (vitest.config.ts). */
    emulateColorScheme: (colorScheme: 'light' | 'dark') => Promise<void>;
    /** Emulates the device's prefers-reduced-motion (vitest.config.ts). */
    emulateReducedMotion: (reducedMotion: 'reduce' | 'no-preference') => Promise<void>;
  }
}
