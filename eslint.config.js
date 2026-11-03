import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

// `defineConfig` comes from ESLint 10 itself. Do not use `tseslint.config()`:
// the function is marked deprecated in typescript-eslint 8.72 and `astro check`
// reports it as a hint on every typecheck.
export default defineConfig([
  {
    // The POC (index.html, script.js, style.css) stays frozen and published
    // until the Phase 6 cutover. No tool in this repository may fail it or
    // rewrite it (FR-015/FR-016 of spec 001).
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'index.html',
      'script.js',
      'style.css',
      // Maintained by the Spec Kit CLI, pinned at 1.2.5. Linting here would
      // create drift against the `init` diff, which the constitution requires
      // being able to review.
      '.specify/',
    ],
  },

  {
    // Type-aware lint ONLY on .ts/.tsx.
    //
    // Spreading `recommendedTypeChecked` at the root of the config makes the
    // typed rules also reach .astro files, which use astro-eslint-parser. The
    // Astro parser does not pass `parserOptions.project` on to
    // @typescript-eslint/parser, and lint dies with an infrastructure error
    // ("you have used a rule which requires type information") instead of
    // pointing at a code defect.
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // .astro rules, without type information, for the reason above.
  ...astro.configs.recommended,
]);
