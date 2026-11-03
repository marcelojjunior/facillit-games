import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Constitution Principle I: pure client-side. No adapter, no server
  // function. Any adapter here would turn the artifact into something that
  // requires a runtime and would violate the principle.
  output: 'static',

  integrations: [react()],

  vite: {
    // Tailwind 4 comes in as a Vite plugin. The @astrojs/tailwind integration
    // does NOT work: its latest version declares `astro: ^3||^4||^5` and
    // `tailwindcss: ^3.0.24`, incompatible in two dimensions with Astro 7 +
    // Tailwind 4. See specs/001-astro-foundation/research.md, Decision 2.
    //
    // Consequence: there is NO tailwind.config.js in this project. Design
    // tokens go in CSS, with @theme, in src/styles/global.css.
    plugins: [tailwindcss()],
  },
});
