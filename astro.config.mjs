import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Principio I da constituicao: client-side puro. Sem adapter, sem funcao de
  // servidor. Qualquer adapter aqui transformaria o artefato em algo que exige
  // runtime e violaria o principio.
  output: 'static',

  integrations: [react()],

  vite: {
    // Tailwind 4 entra como plugin de Vite. A integracao @astrojs/tailwind NAO
    // serve: sua ultima versao declara `astro: ^3||^4||^5` e
    // `tailwindcss: ^3.0.24`, incompativel em duas dimensoes com Astro 7 +
    // Tailwind 4. Ver specs/001-astro-foundation/research.md, Decisao 2.
    //
    // Consequencia: NAO existe tailwind.config.js neste projeto. Tokens de
    // design vao em CSS, com @theme, em src/styles/global.css.
    plugins: [tailwindcss()],
  },
});
