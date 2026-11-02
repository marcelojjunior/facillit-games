import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

// `defineConfig` vem do proprio ESLint 10. Nao use `tseslint.config()`: a
// funcao esta marcada como deprecated em typescript-eslint 8.72 e `astro check`
// a reporta como hint em todo typecheck.
export default defineConfig([
  {
    // A POC (index.html, script.js, style.css) fica congelada e publicada ate
    // o cutover da Fase 6. Nenhuma ferramenta deste repositorio pode reprova-la
    // nem reescreve-la (FR-015/FR-016 da spec 001).
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'index.html',
      'script.js',
      'style.css',
      // Mantido pelo CLI do Spec Kit, fixado em 1.2.5. Lintar aqui criaria
      // divergencia contra o diff do `init`, que a constituicao exige poder
      // revisar.
      '.specify/',
    ],
  },

  {
    // Lint com informacao de tipos SO em .ts/.tsx.
    //
    // Espalhar `recommendedTypeChecked` na raiz da configuracao faz as regras
    // tipadas alcancarem tambem os .astro, que usam astro-eslint-parser. O
    // parser do Astro nao repassa `parserOptions.project` ao
    // @typescript-eslint/parser, e o lint morre com erro de infraestrutura
    // ("you have used a rule which requires type information") em vez de
    // apontar defeito de codigo.
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Regras de .astro, sem informacao de tipos, pelo motivo acima.
  ...astro.configs.recommended,
]);
