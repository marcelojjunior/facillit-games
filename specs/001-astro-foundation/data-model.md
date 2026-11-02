# Phase 1 — Data Model: Fundação técnica e pipeline estático

**Feature**: `specs/001-astro-foundation/`

## Nenhuma entidade de domínio, por decisão

Esta feature **não introduz nenhum dado persistido, nenhuma entidade de domínio
e nenhuma leitura ou escrita em `localStorage`**. FR-018 e SC-008 tornam isso
verificável: uma busca no código e no artefato não deve encontrar referência a
armazenamento local nem a schema persistido.

Este arquivo existe para registrar a ausência como escolha, não como esquecimento.

## Por que não antecipar o modelo

Seria tentador desenhar aqui o `GameDefinition` e o schema de `localStorage` —
eles já estão razoavelmente claros na mente de quem leu a constituição, e a
Fase 3 vai precisar deles de qualquer forma. Dois motivos para não fazer isso:

1. **A constituição manda spec antes de código, e o inverso também vale: não
   escreva código antes da spec que o governa.** O Princípio VIII trata regra de
   jogo e schema persistido como material de ciclo completo. Um modelo escrito
   aqui, numa spec cujo escopo negativo o proíbe (FR-018), nasceria sem spec
   própria — e seria exatamente o atalho que o princípio existe para fechar.

2. **Um modelo escrito agora seria um palpite com aparência de decisão.** O
   risco não é errar; é acertar parcialmente. A Fase 3 encontraria um
   `data-model.md` plausível, escrito pela mesma pessoa, e teria todo incentivo
   para tratá-lo como ponto de partida em vez de reexaminar o problema. O custo
   aparece depois, quando o segundo jogo não couber no contrato e a casca
   precisar mudar — que é precisamente a propriedade que a constituição existe
   para proteger.

## O que esta fase deixa pronto para o modelo da Fase 3

Sem desenhar o modelo, a fundação remove três obstáculos concretos para quem o
desenhar:

| Obstáculo removido | Como | Onde |
|---|---|---|
| Modelar schema persistido sem travas de tipo | `astro/tsconfigs/strictest` ativa `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` — o que força tratar explicitamente payload ausente ou corrompido, exigência do Princípio VII | [research.md, Decisão 3](./research.md) |
| Escrever regra pura sem corredor de teste | Vitest configurado e provadamente executando, com ambiente padrão `node` — uma regra que toque DOM **falha**, em vez de passar silenciosa | [research.md, Decisão 4](./research.md) |
| Descobrir tarde que estado não pode renderizar no build | Ilha `client:only` provada, com teste que roda o build e afirma ausência da marcação no HTML | [research.md, Decisão 7](./research.md) |

## Estado efêmero desta fase

A ilha de prova (`ClientOnlyProbe.tsx`) lê uma API só de navegador para
demonstrar que não executa no build. Para evitar leitura errada do seu papel:

- Ela **não** persiste nada e **não** usa `localStorage` — usar seria violar
  FR-018 e criar uma chave órfã que a Fase 3 encontraria e teria que interpretar.
- A API que ela lê é escolhida por ser inequivocamente indisponível fora do
  navegador, não por relação com o domínio.
- Ela é **descartável**: a Fase 4 a remove ao entregar as telas reais. O
  **teste** que a acompanha não é descartável — ele é o que guarda o Princípio IV
  contra regressão e deve sobreviver à remoção do componente, apontando então
  para a primeira ilha real de estado de partida.

## Nenhuma chave de `localStorage` reservada

Esta fase **não** reserva prefixo, namespace nem `schemaVersion` inicial. A
convenção de nomes de chave e o versionamento pertencem à spec da Fase 3, junto
com o caminho de migração que o Princípio VII exige. Reservar um nome aqui
criaria um compromisso sem a decisão que o justifica.
