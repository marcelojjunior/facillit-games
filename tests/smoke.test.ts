import { describe, expect, it } from 'vitest';

import ClientOnlyProbe from '../src/components/ClientOnlyProbe';

/**
 * Prova que o corredor de testes esta operante (FR-009) e que resolve modulos
 * TypeScript do projeto sem configuracao por arquivo (FR-010).
 *
 * Nao e `expect(true).toBe(true)` de proposito: aquilo atenderia FR-009 na
 * aparencia e nao provaria nada. Importar um .tsx exercita de fato a cadeia que
 * a Fase 3 vai depender -- resolucao de modulo, transformacao de JSX e a
 * configuracao herdada de getViteConfig.
 */
describe('corredor de testes', () => {
  it('resolve um modulo TypeScript do projeto', () => {
    expect(ClientOnlyProbe).toBeTypeOf('function');
  });

  it('roda em ambiente sem DOM, para que regra de pontuacao impura falhe', () => {
    // O Principio III proibe regra de pontuacao de tocar DOM. O ambiente
    // padrao e `node` justamente para que uma regra impura FALHE no teste em
    // vez de passar silenciosa num jsdom complacente.
    //
    // Se esta asercao quebrar, alguem trocou o ambiente default para jsdom e
    // desarmou a verificacao do Principio III sem perceber.
    expect(globalThis).not.toHaveProperty('document');
  });
});
