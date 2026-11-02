/// <reference types="vitest/config" />
// A referencia acima e necessaria: getViteConfig tipa o retorno como UserConfig
// do Vite, que nao conhece a chave `test`. Sem ela, `pnpm typecheck` reprova
// este arquivo com ts(2353).
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // Ambiente `node`, NAO `jsdom`.
    //
    // O Principio III manda que regra de pontuacao seja funcao pura, proibida
    // de tocar DOM. Rodar a suite inteira em jsdom esconderia exatamente essa
    // violacao: uma regra que lesse `document` passaria no teste. Com `node`,
    // ela falha.
    //
    // jsdom esta disponivel para ser pedido por arquivo, via comentario de
    // ambiente, quando um teste de componente precisar.
    environment: 'node',

    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
