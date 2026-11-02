# Facillit Games Constitution

Facillit Games é uma plataforma de marcadores de pontuação — **um marcador por
jogo**, cada jogo com sua própria regra. A casca (cadastro de jogadores,
navegação de rodadas, tabela acumulada, persistência) é compartilhada; a regra
de pontuação pertence ao jogo.

Estes princípios existem para proteger uma única propriedade: **adicionar um
jogo novo não deve exigir alteração na casca**. Todo princípio abaixo é
verificável por leitura de código ou por teste.

## Core Principles

### I. Client-Side Puro (NON-NEGOTIABLE)

A aplicação MUST funcionar inteiramente no navegador, sem backend.

- MUST NOT existir servidor de aplicação, API própria, banco de dados remoto ou
  autenticação.
- Persistência MUST usar exclusivamente `localStorage`.
- MUST NOT ser introduzida dependência de runtime que exija servidor, variável
  de ambiente secreta ou credencial para a aplicação funcionar.
- O build MUST produzir artefato estático publicável em CDN.

*Verificação:* o deploy não declara runtime de servidor e `grep` por `fetch(`
/ `XMLHttpRequest` fora de assets locais não retorna nada.

### II. Jogo é Plugin (NON-NEGOTIABLE)

A casca MUST NOT conhecer nenhum jogo por nome.

- Cada jogo MUST viver em uma pasta autocontida `src/games/<id>/` e declarar
  suas regras através do contrato `GameDefinition`.
- Adicionar um jogo MUST consistir em criar a pasta e registrá-la no registry.
- Ramificação condicional por identidade de jogo (`if (gameId === 'x')`,
  `switch (gameId)`) fora do registry é **violação**.
- Código da casca MUST NOT importar de `src/games/<id>/` diretamente; só o
  registry resolve jogos.

*Verificação:* o `plan.md` de um jogo novo não lista nenhum arquivo da casca.

### III. Regra de Pontuação é Função Pura e Testada (NON-NEGOTIABLE)

Toda regra de jogo MUST ser função pura com teste unitário.

- Regras MUST NOT tocar DOM, `localStorage`, `Date.now()`, `Math.random()` ou
  qualquer estado global.
- Toda função de `validateRound`, `scoreRound`, `computeTotals` e
  `resolveWinners` MUST ter teste unitário cobrindo caso normal, borda e empate.
- Empate MUST ser tratado como caso normal, não exceção: `resolveWinners`
  retorna lista de vencedores.
- Entrada não determinística (sorteio, timestamp) MUST ser injetada como
  parâmetro, nunca lida de dentro da regra.

*Verificação:* cada `src/games/<id>/rules.ts` tem `rules.test.ts` ao lado.

### IV. Estado de Partida é Ilha `client:only`

Nada que leia `localStorage` MUST renderizar no build.

- Todo componente que lê ou escreve estado de partida MUST ser ilha
  `client:only`.
- MUST NOT ser usado `client:load` ou renderização de servidor para telas com
  estado de partida — produz hydration mismatch e flash de tela vazia a cada
  abertura, que é o uso normal do app (celular na mesa, aba descartada).

*Verificação:* nenhuma diretiva `client:load`/`client:visible` em componente
que importe o store de partida.

### V. TypeScript `strict`

- `strict: true` MUST estar ativo e MUST NOT ser relaxado por arquivo.
- MUST NOT existir `any` — explícito ou via assertion — no contrato
  `GameDefinition`, no schema persistido ou nas regras de pontuação.
- `@ts-ignore` / `@ts-expect-error` nesses três lugares MUST ser justificado em
  comentário e aprovado em review.

### VI. Mobile-First

A tela de referência MUST ser celular segurado com uma mão, à noite, em cima da
mesa, passando de mão em mão.

- Layout MUST ser projetado primeiro para viewport estreita; desktop é
  progressivo.
- Alvos de toque MUST ter no mínimo 44×44 px.
- A interação mais repetida do app — registrar a rodada — MUST ser otimizada
  para velocidade e alcance de um polegar.
- Dark mode MUST ser suportado.

### VII. Schema Persistido é Versionado

- Todo dado em `localStorage` MUST carregar `schemaVersion`.
- Mudança incompatível de formato MUST incrementar `schemaVersion` e MUST vir
  com caminho de migração **ou** decisão explícita e documentada de descartar
  dados antigos.
- Leitura MUST degradar com segurança diante de versão desconhecida ou payload
  corrompido: descarta e volta ao estado inicial, nunca quebra a tela.
- Estado de partida em andamento MUST ser gravado a cada mutação, não a cada
  rodada fechada. Partida em andamento MUST ser identificada por campo
  `status` explícito, nunca inferida da quantidade de rodadas.

### VIII. Spec Antes de Código (NON-NEGOTIABLE)

Nenhuma implementação que crie ou altere **regra de jogo, schema persistido ou
fluxo visível ao usuário** MUST começar sem `spec.md` commitado.

- O ciclo é `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`.
- Correção de bug MUST usar a faixa `/speckit-bug-assess` →
  `/speckit-bug-fix` → `/speckit-bug-test`.
- Se a realidade contrariar a spec durante a implementação, a spec MUST ser
  atualizada no mesmo PR. Implementar diferente da spec e seguir é violação.
- Isentos do ciclo: bump de dependência, ajuste de token de cor, typo e
  formatação.

## Additional Constraints

**Stack fixa.** Astro (`output: 'static'`) + TypeScript `strict` + Tailwind +
React em ilhas, Vitest para testes, pnpm, deploy estático na Vercel. Trocar
qualquer camada MUST passar por emenda desta constituição.

**Fronteira Paperclip ↔ Spec Kit.** Paperclip é o portão e o "por quê" (issue,
aprovação, custo, prioridade, sequência). `spec.md` em git é o "o quê" e o
"como". Toda task de implementação MUST citar o caminho da spec que a governa.
Spec Kit MUST NOT criar cards no Paperclip: `tasks.md` é checklist interno da
feature. `/speckit-taskstoissues` (e sua substituta
`/speckit-github-taskstoissues`) MUST NOT ser usado neste projeto — criaria uma
terceira fonte de verdade em GitHub Issues.

**CLI fixado.** Spec Kit MUST ser a versão `1.2.5`. `.specify/` e
`.claude/skills/speckit-*` são versionados em git, para que todo clone e toda
sessão de agente tenham o processo sem reinstalar nada. Atualizar o CLI MUST ser
decisão explícita, com o diff do `init` revisado.

## Development Workflow

**Gate de spec.** Review MUST reprovar código de feature sem `specs/NNN-*/spec.md`
commitado, e MUST conferir o código contra a spec, não só contra o próprio
diff.

**Gate de teste.** Regra de pontuação nova ou alterada sem teste unitário MUST
ser reprovada.

**Gate de constituição.** `/speckit-plan` MUST preencher a seção "Constitution
Check". Violação justificada MUST ser registrada na tabela de Complexity
Tracking do `plan.md`, com a alternativa mais simples e o motivo da recusa.
Violação não registrada é reprovação.

**Branches.** Trabalho de feature MUST sair de branch própria. A POC original
(`index.html`, `script.js`, `style.css`) permanece publicada e congelada até o
cutover; MUST NOT receber correção de bug novo.

## Governance

Esta constituição **supersede qualquer outra prática** deste repositório. Em
conflito entre constituição e plano, documento, comentário ou preferência de
agente, a constituição vence.

**Emenda.** Alterar esta constituição exige: (1) proposta registrada na issue
do Paperclip que motivou a mudança, (2) aprovação humana explícita do board,
(3) incremento de versão conforme a política abaixo, (4) atualização de
`AGENTS.md`/`CLAUDE.md` se o fluxo mudar.

**Versionamento.** Semântico.
- MAJOR: remoção ou redefinição incompatível de um princípio.
- MINOR: novo princípio, ou expansão material de um existente.
- PATCH: esclarecimento, redação, correção sem mudança de semântica.

**Revisão de conformidade.** Todo PR MUST ser verificado contra estes
princípios no review. Complexidade MUST ser justificada. Agentes atuando neste
repositório MUST ler `AGENTS.md` antes de agir; ele é o guia operacional de
runtime e MUST permanecer consistente com esta constituição.

**Version**: 1.0.0 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02
