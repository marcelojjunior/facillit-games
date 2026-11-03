/// <reference types="vitest/config" />
// The reference above is required: getViteConfig types its return value as
// Vite's UserConfig, which does not know the `test` key. Without it,
// `pnpm typecheck` fails this file with ts(2353).
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // `node` environment, NOT `jsdom`.
    //
    // Principle III requires a scoring rule to be a pure function, forbidden
    // from touching the DOM. Running the whole suite in jsdom would hide
    // exactly that violation: a rule that read `document` would pass the test.
    // With `node`, it fails.
    //
    // jsdom is available to be requested per file, via an environment comment,
    // when a component test needs it.
    environment: 'node',

    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
