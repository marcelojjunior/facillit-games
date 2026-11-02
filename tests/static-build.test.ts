import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A guarda do Principio IV.
 *
 * FR-012 pede apenas o componente de prova. Componente e documentacao, e
 * documentacao nao impede regressao: se alguem trocar `client:only` por
 * `client:load` em src/pages/index.astro -- o erro mais provavel, porque
 * `client:load` e o default de todo tutorial -- o build continua passando e o
 * defeito aparece como flash de tela vazia num celular, longe de quem escreveu
 * a linha.
 *
 * Este arquivo transforma o principio em algo que falha no CI.
 *
 * Quando a Fase 4 remover ClientOnlyProbe, este teste NAO deve ser removido:
 * deve ser reapontado para a primeira ilha real de estado de partida.
 */

const PROBE_MARKER = 'client-only-probe';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const indexHtmlPath = `${repoRoot}dist/index.html`;
const pocFiles = ['index.html', 'script.js', 'style.css'] as const;

describe('artefato estatico', () => {
  beforeAll(() => {
    if (!existsSync(indexHtmlPath)) {
      // Falhar com instrucao em vez de passar vazio. Um teste que passa sem
      // artefato e pior que nenhum teste: da confianca falsa.
      throw new Error(
        `dist/index.html nao existe. Rode \`pnpm build\` antes de \`pnpm test\`.\n` +
          `Este teste le o HTML construido e nao tem como se verificar sem ele.`,
      );
    }
  });

  it('nao renderiza a ilha client:only no build', () => {
    const html = readFileSync(indexHtmlPath, 'utf8');

    expect(
      html.includes(PROBE_MARKER),
      `dist/index.html contem "${PROBE_MARKER}", ou seja a ilha RENDERIZOU no build.\n` +
        `Isso significa que a diretiva em src/pages/index.astro deixou de ser\n` +
        `client:only. Com client:load, todo componente que le estado de partida\n` +
        `produz hydration mismatch e flash de tela vazia a cada abertura do app --\n` +
        `que e o uso normal (celular na mesa, aba descartada pelo navegador).\n` +
        `Principio IV da constituicao. Volte a diretiva para client:only.`,
    ).toBe(false);
  });

  it('entrega o codigo da ilha ao navegador, em vez de simplesmente omiti-la', () => {
    // Sem esta asercao o teste acima passaria tambem se a ilha tivesse sido
    // apagada por acidente -- o que seria "ausente do HTML" pelo motivo errado.
    // As duas juntas dizem: nao renderizou no build, MAS chega ao cliente.
    const html = readFileSync(indexHtmlPath, 'utf8');

    expect(html).toMatch(/<astro-island\b/);
  });

  it('nao contem runtime de servidor', () => {
    // Principio I: o artefato tem que ser publicavel em CDN. Qualquer um destes
    // arquivos indicaria que um adapter entrou no astro.config.mjs.
    for (const serverArtifact of ['_worker.js', 'entry.mjs']) {
      expect(existsSync(`${repoRoot}dist/${serverArtifact}`)).toBe(false);
    }
  });

  it('nao vaza localStorage, schema persistido nem nome de jogo', () => {
    // Escopo negativo da fase, verificavel (FR-018, SC-008). O contrato
    // GameDefinition e o schema versionado sao da Fase 3; antecipa-los aqui
    // seria palpite com aparencia de decisao.
    const html = readFileSync(indexHtmlPath, 'utf8');

    expect(html).not.toMatch(/localStorage|schemaVersion|GameDefinition/i);
  });
});

describe('POC congelada', () => {
  // A POC segue publicada e no ar ate o cutover da Fase 6. A defesa principal
  // sao as exclusoes em .prettierignore, eslint.config.js e tsconfig.json --
  // mas aquelas falham em silencio se alguem as remover. Esta falha alto.
  it.each(pocFiles)('%s continua existindo na raiz', (file) => {
    expect(existsSync(`${repoRoot}${file}`)).toBe(true);
  });

  it('nao e sobrescrita pelo artefato de build', () => {
    // dist/index.html e a aplicacao nova; index.html na raiz e a POC. Se o
    // diretorio de saida fosse a raiz, o build apagaria a POC publicada
    // (FR-017).
    const pocHtml = readFileSync(`${repoRoot}index.html`, 'utf8');

    expect(pocHtml).not.toMatch(/<astro-island\b/);
  });
});
