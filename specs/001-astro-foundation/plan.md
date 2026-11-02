# Implementation Plan: Fundação técnica e pipeline estático

**Branch**: `astro` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-astro-foundation/spec.md`

**Issue**: MJR-9 (Fase 2 do plano de reestruturação, MJR-8 rev. 2)

## Summary

Entregar a casca vazia da aplicação e o pipeline de build estático, sem nenhuma
tela de jogo: Astro 7 com `output: 'static'`, TypeScript em modo estrito,
Tailwind 4 via plugin de Vite, React 19 habilitado para ilhas, Vitest rodando, e
lint/format/typecheck configurados — tudo convivendo na mesma árvore que a POC
congelada, sem tocá-la.

A abordagem técnica saiu da [pesquisa de Fase 0](./research.md), que mudou três
escolhas em relação ao caminho "instalar o latest de tudo":

1. **TypeScript fica em `6.0.3`, não `7.0.2`.** `@astrojs/check` aceita
   `^5 || ^6` e `typescript-eslint` aceita `<6.1.0`; a interseção é `6.0.x`.
   Pegar o `latest` entregaria uma fundação cujo comando de typecheck não roda.
2. **`@astrojs/tailwind` está fora.** Sua última versão tem peers incompatíveis
   em duas dimensões ao mesmo tempo (`astro: ^3||^4||^5` e `tailwindcss: ^3`).
   Tailwind entra por `@tailwindcss/vite`, e **não existe `tailwind.config.js`**
   neste projeto.
3. **O `tsconfig` precisa excluir a POC explicitamente.** O preset
   `astro/tsconfigs/base` traz `allowJs: true` com `include: ["**/*"]`, o que
   arrasta `script.js` (16 KB de JS sem tipagem) para dentro do programa do
   TypeScript. Sem `exclude`, `astro check` só passaria corrigindo a POC — que a
   constituição proíbe.

A entrega vai além do mínimo em um ponto deliberado: a prova de ilha
`client:only` é **um teste automatizado** que roda o build e afirma que a
marcação da ilha não está no HTML gerado, não apenas um componente de exemplo.
Isso transforma o Princípio IV de princípio escrito em princípio que falha no
CI, e é a única defesa real contra alguém trocar `client:only` por `client:load`
na Fase 5 — que é o erro mais provável, porque `client:load` é o default de todo
tutorial.

## Technical Context

**Language/Version**: TypeScript `6.0.3` (teto compatível — ver
[research.md, Decisão 1](./research.md)), em modo `astro/tsconfigs/strictest`

**Primary Dependencies**: Astro `7.4.4` (`output: 'static'`),
`@astrojs/react@7.1.2` + React `19.3.1`, `tailwindcss@4.3.3` via
`@tailwindcss/vite@4.3.3`, `@astrojs/check@0.9.12`

**Storage**: nenhum nesta fase. A aplicação não lê nem escreve `localStorage`
(FR-018). O schema persistido é escopo da Fase 3.

**Testing**: Vitest `5.0.5`, configurado por `getViteConfig` de `astro/config`;
ambiente padrão `node` (não `jsdom` — ver [research.md, Decisão 4](./research.md))

**Target Platform**: navegadores modernos, mobile-first; artefato estático
servido por CDN. Sem runtime de servidor.

**Project Type**: aplicação web estática (single project)

**Performance Goals**: não há meta numérica nesta fase — não existe tela de
produto para medir. A meta estrutural é que o artefato não exija nenhuma
execução no servidor, o que mantém o custo de resposta no CDN.

**Constraints**: zero backend, zero variável de ambiente, zero credencial
(Princípio I). Piso de Node `>=22.23.4` (exigência real de `astro@7.4.4`); pnpm
fixado via `packageManager`.

**Scale/Scope**: uma página inicial descartável, uma ilha de prova, um conjunto
de scripts de pipeline. Zero telas de produto, zero jogos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição avaliada: `.specify/memory/constitution.md` v1.0.0 (ratificada
2026-11-02).

### Avaliação pré-Fase 0

| Princípio | Aplica-se? | Veredito | Como esta fase atende |
|---|---|---|---|
| **I — Client-Side Puro** *(NON-NEGOTIABLE)* | sim | **PASS** | `output: 'static'`, sem adapter, sem função de servidor. FR-002/FR-003 proíbem variável de ambiente e serviço externo. Verificação do princípio (`grep` por `fetch(`) é trivialmente satisfeita: não há nenhuma chamada de rede. |
| **II — Jogo é Plugin** *(NON-NEGOTIABLE)* | **não ainda** | **N/A — e protegido** | Não há jogo, registry nem `src/games/` nesta fase; o contrato é Fase 3. O risco real é a casca nascer com um gancho a um jogo específico. FR-005 e FR-018 o proíbem como requisito verificável, e SC-008 manda buscar por nome de jogo no artefato. |
| **III — Regra de Pontuação Pura e Testada** *(NON-NEGOTIABLE)* | **não ainda** | **N/A — e habilitado** | Nenhuma regra existe. A obrigação desta fase é não deixar a Fase 3 começar sem corredor de testes: FR-008/FR-009/FR-010. A escolha de ambiente `node` (não `jsdom`) é deliberada para que uma regra que toque DOM **falhe** no teste em vez de passar. |
| **IV — Estado de Partida é Ilha `client:only`** | sim | **PASS — com reforço** | Não há estado nesta fase, então o princípio não poderia ser violado. Mas a configuração poderia inviabilizá-lo. FR-011/FR-012 exigem a prova, e a Decisão 7 da pesquisa a eleva a teste automatizado contra o HTML construído. |
| **V — TypeScript `strict`** | sim | **PASS — acima do mínimo** | `astro/tsconfigs/strictest`, que é superset de `strict: true`, adicionando `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`. FR-007 proíbe relaxar por arquivo ou por diretiva. Zero `any` e zero `@ts-ignore` na entrega. |
| **VI — Mobile-First** | **parcialmente** | **PASS por não comprometer** | Não há tela de produto, logo não há layout a projetar nem alvo de toque a medir. O que esta fase deve é não impedir: a página inicial declara `viewport` correto e o CSS global não fixa largura mínima. Dark mode e tokens são Fase 4. **Esta fase não reivindica atendimento ao princípio** — só não cria obstáculo. |
| **VII — Schema Persistido é Versionado** | **não ainda** | **N/A** | Nada é persistido (FR-018). O princípio passa a valer na Fase 3. Esta fase não escreve nenhuma chave em `localStorage`, nem de teste. |
| **VIII — Spec Antes de Código** *(NON-NEGOTIABLE)* | sim | **PASS** | `specs/001-astro-foundation/spec.md` foi commitado em `61cc74a`, **antes** de qualquer linha de implementação. O ciclo foi rodado de verdade: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. |

### Gates de Development Workflow

| Gate | Veredito | Observação |
|---|---|---|
| **Gate de spec** | **PASS** | `spec.md` commitado em `61cc74a` antes da implementação. A issue MJR-9 cita o caminho da spec no relato. |
| **Gate de teste** | **N/A** | Nenhuma regra de pontuação criada ou alterada. O gate passa a morder na Fase 3. |
| **Gate de constituição** | **PASS** | Esta seção está preenchida. Ver Complexity Tracking abaixo. |
| **Branches** | **PASS** | Trabalho em branch `astro`, derivada de `chore/spec-kit` (ver nota abaixo). POC intocada — FR-016 e SC-006. |

**Nota sobre a base da branch**: `astro` saiu de `chore/spec-kit` (`7009b10`),
que carrega a Fase 1 e está 1 commit à frente de `origin/main`. Ramificar de
`main` deixaria a branch sem a constituição e sem as skills do Spec Kit,
inviabilizando o Gate de spec. A confirmação foi pedida ao CEO na issue MJR-9 e
a base é rebaseável se ele preferir outra.

### Restrições adicionais

| Restrição | Veredito | Observação |
|---|---|---|
| **Stack fixa** | **PASS** | Todas as camadas são as fixadas: Astro estático, TS estrito, Tailwind, React em ilhas, Vitest, pnpm, estático na Vercel. **Nenhuma emenda é necessária.** A troca de `@astrojs/tailwind` por `@tailwindcss/vite` **não** é troca de camada — a camada é "Tailwind", e continua sendo Tailwind; mudou o mecanismo de integração, que a constituição não fixa. |
| **Fronteira Paperclip ↔ Spec Kit** | **PASS** | `tasks.md` é checklist interno; nenhum card foi criado no Paperclip pelo Spec Kit. `/speckit-taskstoissues` não foi usado. |
| **CLI fixado** | **PASS** | Spec Kit permanece em `1.2.5`; esta fase não toca `.specify/` além de criar `specs/001-*`. |

### Re-avaliação pós-Fase 1 (design)

Reexecutada após `research.md`, `data-model.md`, `contracts/` e `quickstart.md`.

**Veredito: PASS, sem violação a justificar.** O design não introduziu nenhuma
violação nova. Duas mudanças que o design trouxe e que *melhoram* a aderência:

- **Princípio V ficou mais forte, não mais fraco.** A pesquisa levou de
  `strict` para `strictest`. A constituição pede o piso; o design entrega acima
  dele.
- **Princípio IV ganhou execução.** Era um princípio sem verificação automática
  (a *Verificação* escrita na constituição é um `grep` manual por diretivas). O
  design adiciona um teste que roda o build e checa o HTML — o princípio agora
  falha no CI.

Um ponto que o design **expôs** e vale registrar como achado, não como violação:
o `tsconfig` do Astro, por default, teria arrastado a POC para o typecheck,
criando um conflito direto entre o Gate de tipos e a regra de congelamento da
POC. A constituição não previa essa interação. Não é emenda — é uma armadilha de
runtime, e o lugar dela é `AGENTS.md § Armadilhas conhecidas`, onde esta fase a
registra.

**Nenhuma emenda da constituição é proposta por esta fase.**

## Project Structure

### Documentation (this feature)

```text
specs/001-astro-foundation/
├── spec.md              # Fase de especificação (commitado em 61cc74a)
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — 7 decisões com alternativas rejeitadas
├── data-model.md        # Phase 1 — declara ausência de entidades, com motivo
├── quickstart.md        # Phase 1 — roteiro de validação dos 8 SC
├── contracts/
│   └── commands.md      # Contrato dos scripts de pipeline (consumido pelas Fases 3-6)
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec, com 2 ressalvas registradas
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

A POC e a nova aplicação coexistem na raiz até o cutover da Fase 6. Arquivos
marcados **CONGELADO** não são tocados por esta fase nem por nenhuma ferramenta
que ela configure.

```text
.
├── index.html                      # CONGELADO — POC publicada
├── script.js                       # CONGELADO — POC publicada
├── style.css                       # CONGELADO — POC publicada
│
├── package.json                    # scripts, engines, packageManager
├── pnpm-lock.yaml                  # versionado (FR-004)
├── pnpm-workspace.yaml             # exigido pelo pnpm para onlyBuiltDependencies
├── astro.config.mjs                # output: 'static' + @tailwindcss/vite + react
├── tsconfig.json                   # strictest + exclude da POC
├── vitest.config.ts                # getViteConfig de astro/config
├── eslint.config.js                # flat config: ts + astro + jsx
├── .prettierrc.json / .prettierignore
├── .gitignore                      # + dist/, node_modules/, .astro/
│
├── src/
│   ├── pages/
│   │   └── index.astro             # página mínima, descartável (Fase 4 substitui)
│   ├── layouts/
│   │   └── BaseLayout.astro        # viewport + import do CSS global
│   ├── components/
│   │   └── ClientOnlyProbe.tsx     # ilha de prova (FR-012), descartável
│   └── styles/
│       └── global.css              # @import "tailwindcss" — sem tailwind.config.js
│
├── tests/
│   ├── smoke.test.ts               # prova que o corredor executa (FR-009)
│   └── static-build.test.ts        # roda o build, afirma ausência da ilha no HTML
│
└── dist/                           # artefato estático — ignorado pelo git
```

**Structure Decision**: single project com a aplicação em `src/` e os testes de
fundação em `tests/`, convivendo na raiz com os três arquivos congelados da POC.

Duas escolhas de layout que não são arbitrárias:

- **Testes de fundação em `tests/`, não ao lado do código.** O Princípio III
  manda que teste de regra de jogo viva **ao lado** do código
  (`src/games/<id>/rules.test.ts`). Os testes desta fase não são regra de jogo —
  são testes do pipeline. Separá-los agora evita que a Fase 3 encontre um
  precedente contraditório em `src/` e conclua que teste de regra também vai em
  `tests/`.
- **`src/components/` existe, mas `src/games/` não.** Criar `src/games/` vazio
  agora pareceria prestativo e seria um palpite sobre a Fase 3, que ainda não
  definiu o contrato. A pasta nasce com a primeira spec que a justifique.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Nenhuma violação da constituição a justificar.** O Constitution Check passou
em todos os princípios aplicáveis, pré e pós-design, e esta fase fica acima do
piso em dois deles (V e IV).

As duas tabelas abaixo não são violações — são, respectivamente, desvios do
`latest` e desvios do caminho mais curto. Ficam registradas porque um revisor
que não leu a pesquisa vai estranhar as duas, e porque a decisão de subir
TypeScript depende de uma condição externa que alguém precisa poder reencontrar.

### Desvios do `latest` do registry

| Desvio | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| `typescript@6.0.3` em vez de `7.0.2` (`latest`) | `@astrojs/check` aceita `^5 \|\| ^6`; `typescript-eslint@8.72.1` aceita `>=4.8.4 <6.1.0`. A interseção é `6.0.x`. | Pegar `7.0.2` entregaria uma fundação em que `pnpm typecheck` e o lint com tipos não rodam — o oposto do objetivo da fase. Desbloqueio: `@astrojs/check` e `typescript-eslint` liberarem o peer de TS 7. |
| `@tailwindcss/vite` em vez de `@astrojs/tailwind` | `@astrojs/tailwind@6.0.2` declara `astro: ^3\|\|^4\|\|^5` e `tailwindcss: ^3.0.24` — incompatível em duas dimensões com Astro 7 + Tailwind 4. | Segurar Tailwind em v3 para usar a integração "oficial" ainda não fecharia o peer de `astro`, e nasceria uma major atrasado no arquivo que a Fase 4 mais vai editar. |
| `oxc-transform-react` declarado explicitamente | É peer de `@astrojs/react@7.1.2` e não vem embutido. | Confiar no `auto-install-peers` do pnpm faz o `install` de um clone limpo depender de configuração de máquina, contrariando FR-001. |

### Trabalho além do mínimo pedido

| Item | Por que foi incluído | O mínimo foi rejeitado porque |
|---|---|---|
| `tests/static-build.test.ts` — teste que roda o build e afirma ausência da ilha no HTML | Dá execução ao Princípio IV, cuja verificação na constituição é um `grep` manual. | Só o componente de prova (o que FR-012 pede) é documentação, e documentação não impede regressão. A troca de `client:only` por `client:load` passaria silenciosa e o defeito apareceria num celular, longe de quem escreveu a linha. |
| `astro/tsconfigs/strictest` em vez de `strict` | Traz `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`, que são exatamente as travas que a Fase 3 vai querer ao ler payload corrompido (Princípio VII) e ao modelar `GameDefinition` sem `any` (Princípio V). | `strict` atende a constituição ao pé da letra, mas apertar depois custa mais: a Fase 3 já teria código escrito contra a regra frouxa. |
| `exclude` explícito da POC no `tsconfig` | Sem isso `astro check` reprova por erros em `script.js`, e o comando só passaria corrigindo a POC — proibido pela constituição. | Não é opcional: é a diferença entre o pipeline funcionar e travar. Registrado aqui porque parece higiene e é bloqueio. |

### Não feito de propósito

| Item | Por que não | Quando |
|---|---|---|
| Regra de ESLint proibindo `client:load` em componente de estado | O Princípio IV só se aplica a componentes que leem estado de partida, e nenhum existe. Escrever a regra agora seria contra um alvo imaginário. | Fase 3, quando o store nascer. Recomendação registrada. |
| Teste de navegador (Playwright) para hydration mismatch | Verificação mais fiel, mas traz binário de navegador e tempo de CI para uma fase sem tela. A spec já registra em Assumptions que a checagem de console é manual aqui. | Fase 4, quando houver tela que justifique o custo. |
| Criar o projeto na Vercel | Não há conexão Vercel disponível para agentes nesta instância; é passo humano, em decisão no MJR-8. Astro estático é detectado sem adapter e sem variável de ambiente. | Passo humano, fora desta fase. |
| `src/games/`, registry, `GameDefinition`, store de `localStorage` | FR-018. Seria palpite sobre um contrato que a Fase 3 ainda vai definir. | Fase 3. |
| Design system, tokens de cor, dark mode | FR-018. | Fase 4. |
