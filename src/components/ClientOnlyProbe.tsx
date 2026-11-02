/**
 * Prova, antes de existir qualquer tela de partida, que um componente pode
 * executar so no navegador e nunca durante o build (Principio IV).
 *
 * Tres coisas que este componente deliberadamente NAO faz:
 *
 * - Nao toca localStorage. Usar aqui violaria o escopo negativo da fase
 *   (FR-018) e deixaria uma chave orfa que a Fase 3 encontraria e teria que
 *   interpretar.
 * - Nao guarda estado de partida. Nao ha schema persistido nesta fase.
 * - Nao tenta ser bonito. A Fase 4 remove este componente.
 *
 * O que NAO e descartavel e o teste que o acompanha
 * (tests/static-build.test.ts). O componente e documentacao, e documentacao
 * nao impede regressao; o teste e o que faz o Principio IV falhar no CI.
 */
export default function ClientOnlyProbe() {
  // `screen` e inequivocamente indisponivel fora do navegador. Se esta linha
  // executasse durante o build, o build quebraria aqui -- que e exatamente a
  // deteccao que se quer.
  const largura = globalThis.screen.width;

  return (
    <p
      data-testid="client-only-probe"
      className="mt-6 rounded border border-current/20 px-3 py-2 text-sm"
    >
      Ilha <code>client:only</code> ativa. Largura de tela lida no navegador:{' '}
      <strong>{largura}px</strong>.
    </p>
  );
}
