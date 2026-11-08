/// <reference types="vitest/config" />
// The reference above is required: getViteConfig types its return value as
// Vite's UserConfig, which does not know the `test` key. Without it,
// `pnpm typecheck` fails this file with ts(2353).
import { defineBrowserCommand, playwright } from '@vitest/browser-playwright';
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          // `node` environment, NOT `jsdom`.
          //
          // Principle III requires a scoring rule to be a pure function,
          // forbidden from touching the DOM. Running the whole suite in jsdom
          // would hide exactly that violation: a rule that read `document`
          // would pass the test. With `node`, it fails.
          environment: 'node',
          include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // Real Chromium, because Principle VI is about layout: 44 px touch
          // targets, no horizontal scroll, the confirm button in thumb reach.
          // jsdom has no layout engine and cannot measure any of it
          // (specs/003-shell-screens/research.md, D13).
          name: 'browser',
          include: ['src/**/*.browser.test.tsx', 'tests/**/*.browser.test.tsx'],
          setupFiles: ['./tests/browser-setup.ts'],
          // Process CSS (Vitest skips it by default): sizes are what we test.
          css: true,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // The reference screen: a phone held in one hand (Principle VI).
            viewport: { width: 360, height: 640 },
            instances: [{ browser: 'chromium' }],
            commands: {
              // SC-008: the theme in `auto` must follow a device change live.
              emulateColorScheme: defineBrowserCommand<['light' | 'dark']>(
                async (context, colorScheme) => {
                  await context.page.emulateMedia({ colorScheme });
                },
              ),
              // Spec 004 SC-006: no animation remains under reduced motion.
              emulateReducedMotion: defineBrowserCommand<['reduce' | 'no-preference']>(
                async (context, reducedMotion) => {
                  await context.page.emulateMedia({ reducedMotion });
                },
              ),
            },
          },
        },
      },
    ],
  },
});
