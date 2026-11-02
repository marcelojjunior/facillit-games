---

description: "Task list for 001-astro-foundation"
---

# Tasks: Fundação técnica e pipeline estático

**Input**: Design documents from `/specs/001-astro-foundation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/commands.md](./contracts/commands.md)

**Tests**: incluídos. Não é preferência de TDD — a spec os pede como requisito
(FR-008, FR-009, FR-012) e o [research.md, Decisão 7](./research.md) eleva a
prova de ilha `client:only` a teste automatizado.

**Organization**: agrupadas por user story, na ordem de prioridade da spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependência pendente)
- **[Story]**: a user story a que a tarefa pertence (US1–US4)
- Caminhos são relativos à raiz do repositório

## Regra que vale para toda tarefa desta lista

**`index.html`, `script.js` e `style.css` são intocáveis.** Nenhuma tarefa abaixo
os edita, e as tarefas de configuração de ferramenta precisam excluí-los
ativamente — o default de pelo menos duas ferramentas os incluiria. Ver
[research.md, Decisão 3](./research.md).

---

## Phase 1: Setup

- [X] T001 Criar `package.json` na raiz com `name: "facillit-games"`,
  `type: "module"`, `private: true`, `engines.node: ">=22.23.4"` (piso real de
  `astro@7.4.4`, não "LTS atual") e `packageManager: "pnpm@11.23.0"` conforme
  FR-004 e [research.md, Decisão 6](./research.md)

- [X] T002 Declarar em `package.json` os 10 scripts do contrato, exatamente com
  os nomes de [contracts/commands.md](./contracts/commands.md): `dev`, `build`,
  `preview`, `typecheck`, `test`, `test:watch`, `lint`, `format`,
  `format:check`. **`test` MUST ser `vitest run`** (uma passada), nunca `vitest`
  — um `pnpm test` que entra em watch trava CI e trava sessão de agente
  (invariante 1 do contrato)

- [X] T003 Instalar dependências de runtime nas versões apuradas em
  [research.md](./research.md): `astro@7.4.4`, `@astrojs/react@7.1.2`,
  `react@19.3.1`, `react-dom@19.3.1`, `tailwindcss@4.3.3`,
  `@tailwindcss/vite@4.3.3`. **Não** instalar `@astrojs/tailwind`: seus peers
  são `astro: ^3||^4||^5` e `tailwindcss: ^3.0.24`, incompatíveis em duas
  dimensões (Decisão 2)

- [X] T004 Instalar dependências de desenvolvimento: `typescript@~6.0.3`
  (**não** o `latest` `7.0.2` — teto de `@astrojs/check` e `typescript-eslint`,
  Decisão 1), `@astrojs/check@0.9.12`, `@types/react@19.3.0`,
  `@types/react-dom@19.3.0`, `oxc-transform-react@^0.156.0` (peer explícito de
  `@astrojs/react`, declarado para não depender de `auto-install-peers`, Decisão
  5), `vitest@5.0.5`

- [X] T005 Instalar ferramentas de qualidade: `eslint@10.14.0`,
  `typescript-eslint@8.72.1`, `eslint-plugin-astro@3.2.1`, `prettier@3.9.10`,
  `prettier-plugin-astro@1.1.2`. `eslint-plugin-astro@3.2.1` declara peers de
  a11y (`eslint-plugin-jsx-a11y` **e** `eslint-plugin-jsx-a11y-x`) que parecem
  redundantes: instalar **o que o `pnpm install` exigir** e registrar o
  resultado em `research.md § Unknowns` em vez de adivinhar

- [X] T006 Atualizar `.gitignore` acrescentando `node_modules/`, `dist/` e
  `.astro/`, e confirmar que `pnpm-lock.yaml` **não** está ignorado (FR-004 exige
  o lock versionado)

- [X] T007 Rodar `pnpm install` e confirmar que termina sem aviso de peer não
  satisfeito. Aviso de peer aqui é defeito, não ruído: é o sintoma de T004/T005
  incompletas

**Checkpoint**: `pnpm install` passa a partir da árvore versionada.

---

## Phase 2: Foundational

**Bloqueia todas as user stories.** Sem estes arquivos nenhum comando roda.

- [X] T008 Criar `astro.config.mjs` com `defineConfig` de `astro/config`,
  `output: 'static'` (Princípio I), integração `react()` de `@astrojs/react`, e
  `vite.plugins: [tailwindcss()]` importando de `@tailwindcss/vite`. **Nenhum
  adapter** — adapter introduziria runtime de servidor e violaria FR-002

- [X] T009 Criar `tsconfig.json` com `extends: "astro/tsconfigs/strictest"`
  (superset de `strict: true`, traz `noUncheckedIndexedAccess` e
  `exactOptionalPropertyTypes` para a Fase 3) e `exclude` **explícito** de
  `script.js`, `index.html`, `style.css`, `dist`, `node_modules`.
  **O `exclude` não é higiene, é bloqueio**: o preset `astro/tsconfigs/base` traz
  `allowJs: true` com `include: ["${configDir}/**/*"]`, o que arrasta os 16 KB de
  `script.js` para o programa do TypeScript; sem `exclude`, `pnpm typecheck` só
  passaria corrigindo a POC, que a constituição proíbe (Decisão 3)

- [X] T010 [P] Criar `src/styles/global.css` com `@import "tailwindcss";` e nada
  mais. **Não criar `tailwind.config.js`** — Tailwind 4 configura por CSS
  (`@theme`), e um arquivo de config vazio mandaria a Fase 4 ao lugar errado

- [X] T011 [P] Criar `src/layouts/BaseLayout.astro` com `lang="pt-BR"`,
  `<meta name="viewport" content="width=device-width, initial-scale=1">` e
  import de `../styles/global.css`. Mobile-first é Princípio VI; esta fase não
  entrega layout, mas não pode nascer com viewport errado

- [X] T012 Criar `vitest.config.ts` usando `getViteConfig` de `astro/config`
  (export confirmado em `astro@7.4.4`), com `test.environment: 'node'`.
  **`node`, não `jsdom`** — regra de pontuação é função pura proibida de tocar
  DOM (Princípio III); rodar a suíte em `jsdom` por default esconderia
  exatamente essa violação (Decisão 4). `test.include` cobrindo
  `tests/**/*.test.ts` e `src/**/*.test.ts`

- [X] T013 [P] Criar `eslint.config.js` (flat config) compondo
  `typescript-eslint` com checagem por tipo e `eslint-plugin-astro`, com
  `ignores` de `dist`, `.astro`, `node_modules`, `index.html`, `script.js`,
  `style.css` (FR-015)

- [X] T014 [P] Criar `.prettierrc.json` com `plugins:
  ["prettier-plugin-astro"]`, e `.prettierignore` listando `dist`, `.astro`,
  `pnpm-lock.yaml`, `index.html`, `script.js`, `style.css`.
  **O `.prettierignore` é a defesa mais frágil da POC**: `pnpm format` escreve,
  e sem essa exclusão ele reformata os três arquivos congelados sem avisar
  (FR-016)

**Checkpoint**: configuração completa; os comandos existem e podem rodar.

---

## Phase 3: User Story 1 — Artefato estático reproduzível (P1) 🎯 MVP

**Goal**: dois comandos documentados, a partir de um clone limpo, produzem um
diretório estático publicável em CDN, sem variável de ambiente.

**Independent test**: `pnpm install && pnpm build`; `dist/` existe com
`index.html`; `find dist -name '*.func' -o -name '_worker.js' -o -name
'entry.mjs'` sai vazio.

- [X] T015 [US1] Criar `src/pages/index.astro` usando `BaseLayout`, com um
  título e uma frase declarando que é a fundação da plataforma.
  **MUST NOT** conter navegação de jogo, lista de jogos, cadastro de jogadores
  nem elemento de marcador de pontuação (FR-005, FR-018). Esta página é
  descartável: a Fase 4 a substitui — investir em aparência agora é desperdício

- [X] T016 [US1] Rodar `pnpm build` e confirmar código de saída `0` e `dist/`
  contendo `index.html` (SC-001)

- [X] T017 [US1] Confirmar ausência de runtime de servidor no artefato:
  `find dist -name '*.func' -o -name '_worker.js' -o -name 'entry.mjs'` deve
  sair vazio (FR-002, Princípio I)

- [X] T018 [US1] Rodar `pnpm preview`, abrir a página e confirmar que carrega
  com zero erro de console (SC-002). Checagem manual por decisão registrada em
  [spec.md § Assumptions](./spec.md)

**Checkpoint**: US1 entregue — há artefato publicável. Este é o MVP da fase.

---

## Phase 4: User Story 2 — Suíte de testes executável (P2)

**Goal**: o corredor de testes existe, está configurado e prova que executa,
para que a Fase 3 não comece violando o Princípio III nem parando para
configurá-lo.

**Independent test**: `pnpm test` relata ≥1 teste executado e zero falhas;
inserir uma falha proposital faz o comando sair com erro.

- [X] T019 [P] [US2] Criar `tests/smoke.test.ts` com um teste que importe um
  módulo TypeScript do projeto e afirme algo sobre ele, provando que os testes
  resolvem módulos do projeto sem configuração por arquivo (FR-010).
  **Não** usar `expect(true).toBe(true)`: não provaria resolução de módulo e
  deixaria FR-009 atendido só na aparência

- [X] T020 [US2] Rodar `pnpm test` e confirmar código `0`, ≥1 teste executado, e
  que o comando **termina** em vez de entrar em watch (SC-003, invariante 1 do
  contrato)

- [X] T021 [US2] Verificar que o corredor reprova de verdade: inserir
  temporariamente `expect(1).toBe(2)`, confirmar código de saída diferente de
  `0`, e remover (SC-003, FR-009). Um comando de teste que nunca falha não
  verifica nada

- [X] T022 [US2] Rodar `pnpm typecheck` e confirmar código `0`. Se falhar por
  incompatibilidade de versão de TypeScript, a resposta registrada é descer para
  `typescript@5.9.x` (ainda dentro dos peers de ambas as ferramentas) e
  **nunca** relaxar `strict`, que violaria o Princípio V
  ([research.md § Unknowns](./research.md))

- [X] T023 [US2] Verificar que o typecheck reprova: inserir temporariamente
  `const n: number = 'texto';` em um `.ts` de `src/`, confirmar saída diferente
  de `0`, e remover (SC-004)

**Checkpoint**: US2 entregue — a Fase 3 pode escrever teste de regra no primeiro
commit.

---

## Phase 5: User Story 3 — Ilha `client:only` comprovada (P3)

**Goal**: provar, antes de existir qualquer tela de partida, que um componente
pode executar só no navegador e nunca no build — e deixar isso guardado por
teste, não por documentação.

**Independent test**: o build passa apesar do componente ler API só de
navegador, e `dist/index.html` não contém a marcação do componente.

- [X] T024 [US3] Criar `src/components/ClientOnlyProbe.tsx`: componente React
  que lê uma API inequivocamente indisponível fora do navegador e a renderiza
  dentro de um elemento com `data-testid="client-only-probe"`.
  **MUST NOT** tocar `localStorage` nem persistir nada — usar `localStorage`
  aqui violaria FR-018 e deixaria uma chave órfã que a Fase 3 encontraria e
  teria que interpretar ([data-model.md](./data-model.md))

- [X] T025 [US3] Montar a ilha em `src/pages/index.astro` com a diretiva
  **`client:only="react"`**. `client:load` produz hydration mismatch e flash de
  tela vazia a cada abertura — que é o uso normal do app, celular na mesa com a
  aba descartada pelo navegador (Princípio IV)

- [X] T026 [US3] Rodar `pnpm build` e confirmar que **passa**. Se falhasse por
  API de navegador ausente, significaria que a ilha executou no build e a
  diretiva está errada (SC-005)

- [X] T027 [US3] Criar `tests/static-build.test.ts`: lê `dist/index.html` e
  afirma que **não** contém `client-only-probe`, falhando com mensagem que
  explique o que a ausência significa. O teste MUST falhar com instrução clara
  se `dist/` não existir, em vez de passar vazio — um teste que passa sem
  artefato é pior que nenhum teste.
  **Esta é a tarefa mais importante da fase**: FR-012 só pede o componente, e
  componente é documentação. Documentação não impede regressão. Se alguém na
  Fase 5 trocar `client:only` por `client:load` — o erro mais provável, porque
  `client:load` é o default de todo tutorial — só este teste acusa (Decisão 7)

- [X] T028 [US3] Rodar `pnpm test` e confirmar que os dois testes passam, com o
  build já gerado

- [X] T029 [US3] Verificar que a guarda morde: trocar temporariamente
  `client:only` por `client:load` em `src/pages/index.astro`, rodar
  `pnpm build && pnpm test`, confirmar que o build falha **ou** que
  `static-build.test.ts` falha, e reverter.
  **Se os dois passarem, a fase não está pronta** — a armadilha central do
  projeto segue descoberta e o Princípio IV continua sendo só texto

- [X] T030 [US3] Abrir `pnpm preview` e confirmar que a ilha aparece, lê a API
  de navegador e o console fica sem erro e **sem aviso de hydration mismatch**
  (US3, cenário 3)

**Checkpoint**: US3 entregue — o Princípio IV passa a falhar no CI em vez de no
celular do usuário.

---

## Phase 6: User Story 4 — Lint e formatação (P4)

**Goal**: veredito de estilo igual para quem abre o PR e para quem revisa, por
comando local.

**Independent test**: `pnpm lint` e `pnpm format:check` passam na árvore
entregue; uma violação proposital faz o comando correspondente falhar.

- [X] T031 [US4] Rodar `pnpm lint` e corrigir o que acusar **no código novo**.
  Resolver aviso suprimindo-o é violação de FR-015 e do Princípio V

- [X] T032 [US4] Rodar `pnpm format` e em seguida
  `git status --porcelain -- index.html script.js style.css`.
  **A saída MUST ser vazia.** Se os arquivos da POC aparecerem, o
  `.prettierignore` de T014 está incompleto e a POC publicada acabou de ser
  reescrita (FR-016, SC-006)

- [X] T033 [US4] Rodar `pnpm format:check` e confirmar código `0`

- [X] T034 [US4] Verificar que a verificação de formatação reprova: estragar a
  indentação de um arquivo de `src/`, confirmar saída diferente de `0`, e
  restaurar com `pnpm format` (SC-007)

**Checkpoint**: todas as user stories entregues.

---

## Phase 7: Polish & Cross-Cutting

- [X] T035 Confirmar o congelamento da POC de forma definitiva:
  `git diff --stat chore/spec-kit -- index.html script.js style.css` **MUST**
  sair vazio (SC-006, FR-016, critério de pronto 4 da issue MJR-9)

- [X] T036 Confirmar o escopo negativo:
  `grep -rniE 'localStorage|schemaVersion|GameDefinition|meche' src/ tests/ dist/`
  **MUST** sair vazio (FR-018, SC-008)

- [X] T037 [P] Criar `README.md` documentando os comandos, o piso de Node, e as
  **três pegadinhas que custariam tempo a quem chegar depois**: (a) TypeScript
  está em `6.0.x` de propósito, com a condição exata para subir — `@astrojs/check`
  e `typescript-eslint` liberarem o peer de TS 7; (b) **não existe
  `tailwind.config.js`**, Tailwind 4 configura por `@theme` em CSS; (c) o
  `tsconfig` exclui a POC de propósito, e remover o `exclude` trava o typecheck

- [X] T038 [P] Acrescentar a `AGENTS.md § Armadilhas conhecidas` a armadilha que
  o design desta fase expôs e que a constituição não previa: o `tsconfig` do
  Astro, por default (`allowJs: true` + `include: ["**/*"]`), arrasta a POC para
  o typecheck, colocando o Gate de tipos em conflito direto com a regra de
  congelamento da POC. É armadilha de runtime, não emenda — o lugar dela é
  `AGENTS.md` ([plan.md § Re-avaliação pós-Fase 1](./plan.md))

- [X] T039 Rodar o roteiro completo de [quickstart.md](./quickstart.md) numa
  árvore limpa (`rm -rf node_modules dist && pnpm install`), incluindo a Parte 2,
  que prova que os comandos reprovam. Os passos da Parte 2 são os que de fato
  validam a fase; os da Parte 1 só mostram que ela não está obviamente quebrada

- [X] T040 Registrar em `research.md § Unknowns` o resultado real dos dois riscos
  de execução: quais peers de a11y o `pnpm install` exigiu (T005) e se
  `astro check` funcionou com `typescript@6.0.3` (T022). Deixar as incertezas
  registradas como "em aberto" depois de tê-las resolvido faz a próxima pessoa
  repetir a investigação

---

## Dependencies

```text
Phase 1 (Setup: T001–T007)
        │
        ▼
Phase 2 (Foundational: T008–T014)   ← bloqueia todas as stories
        │
        ├────────────┬────────────┬────────────┐
        ▼            ▼            ▼            ▼
   US1 (P1)      US2 (P2)     US3 (P3)     US4 (P4)
  T015–T018     T019–T023    T024–T030    T031–T034
        │            │            │            │
        └────────────┴────────────┴────────────┘
                     │
                     ▼
        Phase 7 (Polish: T035–T040)
```

**Dependências reais entre stories** (não são tão independentes quanto o
template sugere, e é melhor dizer isso do que descobrir no meio):

- **US3 depende de US1.** `tests/static-build.test.ts` (T027) lê
  `dist/index.html`. Sem o build de US1 não há o que afirmar.
- **US3 depende de US2.** A prova de ilha é um teste; sem corredor de testes
  configurado (T012, T020) ela não roda.
- **US4 é a única de fato independente.** Lint e format passam sem build e sem
  teste.
- **US1 e US2 são independentes entre si** e podem ir em paralelo depois da
  Phase 2.

Ordem recomendada: **US1 → US2 → US3 → US4**, que é a ordem de prioridade da
spec e também a ordem em que as dependências se resolvem. Coincidência
conveniente, não desenho.

## Parallel Opportunities

Dentro da Phase 2, quatro arquivos de configuração não se tocam:

```sh
# T010, T011, T013, T014 em paralelo
T010  src/styles/global.css
T011  src/layouts/BaseLayout.astro
T013  eslint.config.js
T014  .prettierrc.json + .prettierignore
```

Na Phase 7, T037 (`README.md`) e T038 (`AGENTS.md`) são arquivos distintos e
independentes.

**Onde o paralelismo não ajuda**: as tarefas de verificação (T016–T018,
T020–T023, T026–T030, T031–T034) são quase todas comandos sequenciais sobre a
mesma árvore. Rodá-las "em paralelo" só embaralharia a saída.

## Implementation Strategy

**MVP = US1.** `pnpm install && pnpm build` produzindo `dist/` publicável. É o
único item sem o qual nada depois pode ser publicado ou revisado.

**Incremento recomendado**: Phase 1 → Phase 2 → US1 (commit) → US2 (commit) →
US3 (commit) → US4 (commit) → Phase 7 (commit). Cada commit deixa a árvore num
estado em que os comandos já existentes passam.

**O passo que não pode ser cortado se o tempo apertar**: T029 — a verificação de
que a guarda do Princípio IV morde. Pular T037/T038 custa documentação; pular
T029 entrega uma fundação que *parece* proteger a armadilha central do projeto e
não protege. Se algo tiver que sair, que saia da Phase 7, nunca de T027/T029.

---

## Resultado da execução (2026-11-02)

40/40 tarefas concluídas. Numa árvore limpa (`rm -rf node_modules dist .astro`),
com `--frozen-lockfile` e ambiente sem variáveis:

| Comando | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0, `pnpm peers check` sem pendência |
| `pnpm build` | exit 0, `dist/` com 5 arquivos, nenhum runtime de servidor |
| `pnpm test` | exit 0, **10 testes** em 2 arquivos |
| `pnpm typecheck` | exit 0, `0 errors, 0 warnings, 0 hints` |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | exit 0 |

**As verificações negativas, que são as que importam:**

| Defeito introduzido | Comando | Resultado |
|---|---|---|
| teste `expect(1).toBe(2)` | `pnpm test` | exit 1 ✅ |
| `const n: number = 'texto'` | `pnpm typecheck` | exit 1 ✅ |
| indentação estragada | `pnpm format:check` | exit 1 ✅ |
| **`client:only` → `client:load`** | `pnpm build` | **exit 1** ✅ — falhou no prerender, dentro de `ClientOnlyProbe` |
| **`client:only` → `client:load`** | `pnpm test` | **exit 1** ✅ |

T029 funcionou em **duas** camadas, e vale registrar como: o build quebrou
sozinho ao tentar renderizar `globalThis.screen` no prerender, e o teste quebrou
em seguida. A armadilha central do projeto está coberta por algo que falha
automaticamente.

### Onde a execução divergiu do plano

Três tarefas tiveram resultado diferente do previsto. As três estão corrigidas
em [research.md](./research.md) no mesmo commit, como o Princípio VIII exige.

1. **T004 — `oxc-transform-react` NÃO foi declarado.** O plano mandava
   declará-lo. Errado em duas camadas: `^0.145.0` em versão `0.x` trava a minor
   (então `0.156.0` nunca satisfez), e o peer é `optional: true` em
   `@astrojs/react` **e** em `@vitejs/plugin-react`, com faixas disjuntas
   (`^0.145.0` vs `^0.152.0`). Nenhuma versão satisfaz as duas — declarar era a
   única forma de criar o aviso. Removido; `pnpm peers check` fica limpo.

2. **T005 — nenhum peer de a11y foi necessário.** A incerteza registrada na
   Fase 0 se resolveu para "nada a declarar".

3. **T014 — o `.prettierignore` precisou de muito mais que as três linhas da
   POC.** A POC saiu intacta da primeira execução de `pnpm format` (hash
   idêntico — as três linhas previstas funcionaram), mas o Prettier reescreveu
   15 arquivos de documentação que a Fase 0 não tinha pensado em proteger,
   incluindo o frontmatter YAML das skills do Spec Kit. `*.md`, `.specify/` e
   `.claude/` entraram na exclusão: **Prettier formata código neste repositório,
   não prosa.**

Além disso, quatro ajustes que o plano não previa e que o typecheck/lint
exigiram: `@types/node` (os testes usam `node:fs`), referência de tipos
`vitest/config` em `vitest.config.ts`, troca de `tseslint.config()` por
`defineConfig` de `eslint/config` (a primeira está deprecated), e escopar as
regras tipadas de lint a `**/*.{ts,tsx}` para que não derrubem o lint nos
`.astro`. Todos documentados em
[research.md § Achados da implementação](./research.md).
