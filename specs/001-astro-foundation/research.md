# Phase 0 — Research: Fundação técnica e pipeline estático

**Feature**: `specs/001-astro-foundation/`
**Data da apuração**: 2026-11-02
**Método**: consulta direta ao registry (`npm view`) e inspeção do tarball
publicado, não memória do modelo. Todas as versões abaixo foram lidas do
registry nesta data.

> **Por que isso importa.** A constituição fixa a stack por *nome de camada*
> (Astro, TypeScript, Tailwind, React, Vitest, pnpm), não por versão. A escolha
> de versão é desta fase, e três das combinações "óbvias" não funcionam. O que
> segue é o resultado de verificar em vez de supor.

---

## Decisão 1 — TypeScript fica em `6.0.3`, não no `latest` (`7.0.2`)

**Decisão**: pinar `typescript@6.0.3`.

**Rationale**: `latest` é `7.0.2`, mas as duas ferramentas que precisam ler
nossos tipos ainda não suportam a linha 7:

| Pacote | Peer declarado em `typescript` | Aceita 6.0.3? | Aceita 7.0.2? |
|---|---|---|---|
| `@astrojs/check@0.9.12` | `^5.0.0 \|\| ^6.0.0` | sim | **não** |
| `typescript-eslint@8.72.1` | `>=4.8.4 <6.1.0` | sim | **não** |

A interseção das duas faixas é exatamente `6.0.x`. `6.0.3` é a maior release
estável dessa linha (`6.1.x` já estouraria o teto do `typescript-eslint`).

**Alternatives considered**:

- **`typescript@7.0.2` (o `latest`)** — rejeitado. Quebraria `astro check` e o
  lint com tipos. Entregaria uma fundação em que o comando de verificação de
  tipos não roda, que é o oposto do objetivo da fase.
- **`typescript@5.9.x`** — rejeitado. Também é compatível, mas abre mão de um
  major de melhorias sem ganho nenhum; `6.0.3` é o teto compatível e é estável.
- **Abrir mão do `typescript-eslint`** para poder usar TS 7 — rejeitado.
  Trocaria lint com informação de tipos (o que realmente pega `any` implícito e
  promessa não aguardada, exigidos pelo Princípio V) por um número de versão
  maior. Mau negócio.

**Consequência registrada**: `typescript` fica pinado com faixa `~6.0.3`, e
subir para a linha 7 passa a ser uma decisão que depende de `@astrojs/check` e
`typescript-eslint` liberarem o peer. Isso vai para o `README` da fundação.

---

## Decisão 2 — Tailwind entra por `@tailwindcss/vite`, e `@astrojs/tailwind` está fora

**Decisão**: `tailwindcss@4.3.3` + `@tailwindcss/vite@4.3.3`, registrado como
plugin Vite dentro de `astro.config.mjs`. Estilos importados via `@import
"tailwindcss"` em um CSS global.

**Rationale**: a integração histórica `@astrojs/tailwind` não serve mais. Sua
última versão publicada é `6.0.2`, e os peers são:

```
astro:       ^3.0.0 || ^4.0.0 || ^5.0.0      (estamos em Astro 7)
tailwindcss: ^3.0.24                          (queremos Tailwind 4.3.3)
```

Ou seja, ela é incompatível em **duas** dimensões ao mesmo tempo. Tailwind 4
abandonou o pipeline de PostCSS com `tailwind.config.js` em favor de um plugin
de bundler e de configuração em CSS; o caminho suportado em Astro é registrar
`@tailwindcss/vite` em `vite.plugins`.

**Alternatives considered**:

- **`@astrojs/tailwind` + Tailwind 3** — rejeitado. Exigiria segurar Tailwind
  uma major atrás e ainda assim o peer de `astro` não fecha com Astro 7. Seria
  dívida nascida pronta, bem no arquivo que a Fase 4 (design system) mais vai
  mexer.
- **PostCSS manual com `@tailwindcss/postcss`** — rejeitado. Funciona, mas
  adiciona um arquivo de configuração e um passo de pipeline sem ganho sobre o
  plugin de Vite, que o Astro já carrega.

**Pegadinha herdada**: não existe `tailwind.config.js` neste projeto. Quem
chegar na Fase 4 procurando por ele e não achar deve ler isto: os tokens de
design vão em CSS, com `@theme`. Registrado no `README` da fundação.

---

## Decisão 3 — `tsconfig` estende `astro/tsconfigs/strictest`, e exclui a POC explicitamente

**Decisão**: `extends: "astro/tsconfigs/strictest"`, com `exclude` explícito de
`script.js`, `index.html`, `style.css` e `dist`.

**Rationale**: dois achados da inspeção do tarball do Astro 7.4.4.

**(a) `strictest` é um superset útil, não ruído.** Os presets publicados são
`base` → `strict` → `strictest`. O `strict` só adiciona `strict: true`. O
`strictest` adiciona, entre outros, `noUncheckedIndexedAccess` e
`exactOptionalPropertyTypes`. Esses dois são exatamente as travas que a Fase 3
vai querer ao ler payload de `localStorage` possivelmente corrompido
(Princípio VII manda degradar com segurança) e ao modelar o contrato
`GameDefinition` sem `any` (Princípio V). Adotar `strictest` agora é mais
barato do que apertar depois, quando já houver código escrito contra a regra
frouxa.

**(b) `astro/tsconfigs/base` contém uma armadilha direta contra o congelamento
da POC.** O preset traz:

```json
"allowJs": true,
"include": ["${configDir}/.astro/types.d.ts", "${configDir}/**/*"]
```

Com `allowJs: true` e um `include` de `**/*`, o `script.js` da POC — 16 KB de
JavaScript de 2026 sem nenhuma tipagem — entra no programa do TypeScript. O
`astro check` passaria a reprovar por erros num arquivo que a constituição
proíbe corrigir (Princípio de branches: *"a POC [...] MUST NOT receber correção
de bug novo"*). Seria um impasse: o comando de tipos só passaria violando o
congelamento.

A saída é `exclude` explícito. Isso é a razão real por trás de FR-015, que na
spec parecia só higiene de formatação.

**Alternatives considered**:

- **`astro/tsconfigs/strict`** — rejeitado por (a). Atende a constituição ao pé
  da letra, mas deixa de graça as travas que a Fase 3 vai pedir.
- **`allowJs: false` em vez de `exclude`** — rejeitado. Resolveria o `script.js`
  por acidente, mas de forma frágil: qualquer `.js` legítimo que a gente venha a
  precisar (um arquivo de config, por exemplo) voltaria a quebrar, e o motivo
  real ficaria invisível. `exclude` nomeia a POC e documenta a intenção.
- **Mover a POC para uma subpasta** — rejeitado. A POC está publicada no
  GitHub Pages servindo da raiz; mover é o cutover da Fase 6, não desta fase.

---

## Decisão 4 — Vitest usa `getViteConfig` de `astro/config`

**Decisão**: `vitest.config.ts` com `getViteConfig({ test: { ... } })`,
importado de `astro/config`.

**Rationale**: confirmado por inspeção do tarball — `astro@7.4.4` exporta
`./config` → `dist/config/entrypoint.js`, que reexporta
`{ defineConfig, getViteConfig }`. Usar esse helper faz os testes herdarem a
resolução de módulos, os aliases e os plugins do projeto (incluindo
`@tailwindcss/vite` e o JSX de React), em vez de manter uma segunda
configuração de bundler que inevitavelmente divergiria.

Isso atende FR-010 ("os testes MUST resolver módulos TypeScript do projeto sem
configuração adicional por teste") pela construção, não por tentativa.

**Alternatives considered**:

- **`vitest.config.ts` autônomo com `defineConfig` do Vitest** — rejeitado.
  Funciona hoje para uma função pura, mas duplica resolução de módulo. No
  momento em que a Fase 3 tiver um teste que importa um módulo com alias, as
  duas configurações divergem e o erro aparece longe da causa.
- **Ambiente `jsdom` para toda a suíte** — rejeitado como padrão. As regras de
  pontuação do Princípio III são funções puras: proibidas de tocar DOM. Rodar a
  suíte inteira em `jsdom` esconderia uma violação justamente onde ela importa —
  uma regra que toca DOM passaria no teste. O padrão é `node`; `jsdom` fica
  disponível para ser pedido por arquivo, via comentário de ambiente, quando um
  teste de componente precisar.

---

## Decisão 5 — React 19 com `@astrojs/react@7.1.2`, e um peer que NÃO deve ser declarado

> **Corrigida durante a implementação.** A primeira versão desta decisão
> mandava declarar `oxc-transform-react@^0.156.0` explicitamente, por dois
> erros de leitura — ambos pegos pelo `pnpm install`. A correção está abaixo,
> com o erro preservado, porque o erro é a parte instrutiva. O Princípio VIII
> exige atualizar a spec no mesmo PR quando a realidade a contraria.

**Decisão**: `@astrojs/react@7.1.2` + `react@19.3.1` + `react-dom@19.3.1` +
`@types/react@19.3.0` + `@types/react-dom@19.3.0`. **`oxc-transform-react`
não é declarado.**

**Rationale**: os peers de `@astrojs/react@7.1.2` são:

```
react, react-dom:               ^17.0.2 || ^18.0.0 || ^19.0.0
@types/react, @types/react-dom: ^17.0.50 || ^18.0.21 || ^19.0.0
oxc-transform-react:            ^0.145.0   (optional: true)
```

React 19 está dentro da faixa. O item que chamou atenção foi
`oxc-transform-react`, e os dois erros foram estes:

**Erro 1 — `^` em versão `0.x` não faz o que parece.** A anotação original
dizia que `0.156.0` satisfaz `^0.145.0`. Não satisfaz: para versões `0.x`, o
caret trava a **minor**, então `^0.145.0` significa `>=0.145.0 <0.146.0` — uma
única versão. Declarar `0.156.0` criou aviso de peer imediatamente.

**Erro 2 — e não há versão que resolva.** Ao investigar o aviso, apareceu um
conflito mais fundo: `@astrojs/react@7.1.2` depende de
`@vitejs/plugin-react@^6.1.2`, cujo peer é `oxc-transform-react: ^0.152.0`
(`>=0.152.0 <0.153.0`). As duas faixas são **disjuntas** — `^0.145.0` e
`^0.152.0` não têm interseção. Nenhuma versão única satisfaz as duas. É
inconsistência do upstream: `@astrojs/react` declara um peer uma minor atrás do
que sua própria dependência exige.

**A saída é não declarar.** Os dois declarantes marcam
`peerDependenciesMeta: { 'oxc-transform-react': { optional: true } }`. O peer é
opcional em ambos: nada o exige, o build funciona sem ele, e declará-lo era a
única forma de *criar* um aviso insolúvel. Depois de remover,
`pnpm peers check` responde "No peer dependency issues found", e `pnpm build`,
`pnpm test` e `pnpm typecheck` passam.

**A lição que vale para as fases seguintes**: a tentação aqui foi ser
caprichoso — "declarar o peer explicitamente é mais rigoroso que confiar em
`auto-install-peers`". O raciocínio soava bem e estava errado em duas camadas.
Ler `peerDependenciesMeta` antes de declarar qualquer peer custa uma consulta e
evita as duas.

**Alternatives considered**:

- **Declarar `oxc-transform-react@0.145.0`** (satisfazendo `@astrojs/react`) —
  rejeitado. Deixa `@vitejs/plugin-react`, que é quem de fato usa a transformação
  de JSX, com peer insatisfeito. Resolveria a declaração e não a realidade.
- **Declarar `oxc-transform-react@0.152.0`** (satisfazendo
  `@vitejs/plugin-react`) — rejeitado pelo espelho do anterior: apaga o aviso
  que importa e mantém o outro. Qualquer escolha aqui deixa um aviso permanente
  no `install` de um peer que ninguém precisa.
- **Preact em vez de React** — rejeitado. Seria mais leve e tentador para um
  app mobile-first, mas a constituição fixa React em `Additional Constraints`.
  Trocar exige emenda, e não há motivo técnico nesta fase para propor uma.

---

## Decisão 6 — Node: piso real é `22.23.4`, não "LTS atual"

**Decisão**: declarar `engines.node: ">=22.23.4"` e fixar o pnpm via
`packageManager`.

**Rationale**: lido do registry:

- `astro@7.4.4` → `engines: { node: ">=22.23.4", npm: ">=9.6.5", pnpm: ">=7.1.0" }`
- `vitest@5.0.5` → `engines: { node: "^22.12.0 || ^24.0.0 || >=26.0.0" }`

O piso efetivo é o do Astro. O ambiente desta máquina é Node `v24.22.2` e pnpm
`11.23.0`, ambos dentro das faixas — mas a faixa do Vitest tem um detalhe que
vale registrar: ela é uma lista de majors, não um `>=`. Node 25 (ímpar, não-LTS)
está **fora**. Declarar o piso no `package.json` faz o `install` avisar em vez
de falhar obscuramente depois.

`packageManager` atende FR-004 e faz o Corepack usar a versão revisada, em vez
de produzir uma árvore de dependências diferente da que passou no review.

**Alternatives considered**:

- **Não declarar `engines`** — rejeitado. Transfere para o próximo
  desenvolvedor a descoberta de um piso que já custou uma consulta.
- **Declarar `engines.node: ">=22"`** — rejeitado por ser falso: `22.0`–`22.23.3`
  não satisfazem o Astro.

---

## Decisão 7 — A prova de ilha `client:only` é um teste, não só um componente

**Decisão**: entregar (a) uma ilha `client:only` trivial que lê uma API só de
navegador e (b) um **teste automatizado que roda o build e afirma que a marcação
dessa ilha não está no HTML gerado**.

**Rationale**: FR-012 pede o componente de prova, e a spec já observa que o
componente é descartável mas o teste não é. O motivo: um componente de prova é
documentação, e documentação não impede regressão. Se alguém na Fase 5 trocar
`client:only` por `client:load` — que é a falha mais provável, porque
`client:load` é o default que todo tutorial mostra — nada reclama. O build passa.
O defeito aparece como "flash de tela vazia", num celular, em cima da mesa,
longe de quem escreveu a linha.

Um teste que lê o HTML construído e exige ausência da marcação transforma o
Princípio IV em algo que falha no CI. É a diferença entre um princípio escrito e
um princípio vigente.

Esse teste também é o que faz `pnpm test` ser mais que trivial, atendendo FR-009
(“ao menos um teste que execute de fato”) com substância em vez de um
`expect(true).toBe(true)`.

**Alternatives considered**:

- **Só o componente, sem teste** — rejeitado pelo motivo acima. Era o caminho
  mais curto e deixaria a armadilha exatamente tão viva quanto antes.
- **Teste de navegador real (Playwright) verificando ausência de hydration
  mismatch** — rejeitado para esta fase. É a verificação mais fiel, mas traz um
  runner de navegador, binários e tempo de CI para uma fase cujo objetivo é a
  casca. A spec já registra em Assumptions que a checagem de console é manual
  aqui. Fica como candidato honesto para a Fase 4, quando houver tela de verdade
  para valer o custo.
- **Lint rule proibindo `client:load`** — considerado e **adiado**, não
  rejeitado. É complementar e provavelmente certo, mas escrever regra de ESLint
  para diretiva de template Astro é trabalho de pesquisa própria, e o Princípio
  IV só se aplica a componentes que leem estado de partida — que não existem
  nesta fase. Registrado como recomendação para a Fase 3, quando o store nascer
  e a regra puder ser escrita contra um alvo concreto.

---

## Versões apuradas (2026-11-02)

| Pacote | `latest` no registry | Adotado | Motivo de divergir do `latest` |
|---|---|---|---|
| `astro` | 7.4.4 | 7.4.4 | — |
| `@astrojs/react` | 7.1.2 | 7.1.2 | — |
| `@astrojs/check` | 0.9.12 | 0.9.12 | — |
| `react` / `react-dom` | 19.3.1 | 19.3.1 | — |
| `@types/react` / `-dom` | 19.3.0 | 19.3.0 | — |
| `oxc-transform-react` | 0.156.0 | **não instalado** | peer `optional` com faixas disjuntas no upstream (Decisão 5) |
| `@types/node` | 26.6.6 | 24.19.2 | achado na implementação; ver abaixo |
| `tailwindcss` | 4.3.3 | 4.3.3 | — |
| `@tailwindcss/vite` | 4.3.3 | 4.3.3 | substitui `@astrojs/tailwind` (Decisão 2) |
| `typescript` | **7.0.2** | **6.0.3** | teto de `@astrojs/check` e `typescript-eslint` (Decisão 1) |
| `vitest` | 5.0.5 | 5.0.5 | — |
| `eslint` | 10.14.0 | 10.14.0 | — |
| `typescript-eslint` | 8.72.1 | 8.72.1 | — |
| `eslint-plugin-astro` | 3.2.1 | 3.2.1 | peers: `eslint>=10`, `typescript-eslint>=8.61` — fecham |
| `prettier` | 3.9.10 | 3.9.10 | — |
| `prettier-plugin-astro` | 1.1.2 | 1.1.2 | — |
| `jsdom` | 30.1.3 | 30.1.3 | disponível por arquivo, não padrão (Decisão 4) |

**`@astrojs/tailwind`**: última publicada `6.0.2`. **Não adotado** — peers
incompatíveis em duas dimensões (Decisão 2).

---

## Unknowns — resolvidos na implementação

Nenhum `NEEDS CLARIFICATION` da Technical Context ficou aberto.

As duas incertezas de execução registradas na Fase 0 foram resolvidas. Ficam
aqui com o resultado real, não com a pergunta — deixá-las "em aberto" depois de
respondidas faria a próxima pessoa repetir a investigação.

1. **Peers de a11y de `eslint-plugin-astro@3.2.1`** — ✅ **nada a declarar.**
   O `pnpm install` não exigiu `eslint-plugin-jsx-a11y` nem
   `eslint-plugin-jsx-a11y-x`, e `pnpm peers check` responde "No peer dependency
   issues found". A redundância aparente nos peers declarados não se traduz em
   exigência de instalação. O palpite de declarar os dois teria adicionado duas
   dependências desnecessárias.

2. **`astro check` com `typescript@6.0.3`** — ✅ **funciona.** `pnpm typecheck`
   roda e reporta `Result (8 files): 0 errors, 0 warnings, 0 hints`. O plano de
   contingência (descer para `typescript@5.9.x`) **não** foi necessário e fica
   registrado apenas como resposta pré-aprovada caso uma atualização futura
   quebre a combinação. Em nenhuma hipótese relaxar `strict` — seria violação do
   Princípio V.

---

## Achados da implementação (não previstos na Fase 0)

Cinco coisas que só apareceram ao rodar os comandos. Registradas porque todas
custariam tempo a quem repetisse o caminho.

1. **`@types/node` é necessário e não vem por transitividade.** Os testes usam
   `node:fs` e `node:url`; sem `@types/node`, `astro check` reprova com
   `ts(2591)`. Adotado `24.19.2` (linha `^24`) em vez do `latest` `26.6.6`, para
   casar com o Node 24 do ambiente — tipos de uma major à frente do runtime
   descrevem APIs que não existem na execução.

2. **`getViteConfig` não tipa a chave `test`.** Ele devolve `UserConfig` do
   Vite, que não conhece `test`, e o typecheck reprova com `ts(2353)`. A correção
   é `/// <reference types="vitest/config" />` no topo de `vitest.config.ts`.
   Isso não enfraquece a Decisão 4 — o helper continua sendo o jeito certo de
   herdar a resolução de módulos; só precisa da referência de tipos.

3. **`tseslint.config()` está deprecated em `typescript-eslint@8.72.1`.** Usá-la
   faz `astro check` reportar um hint `ts(6387)` em todo typecheck. A substituta
   é `defineConfig` de `eslint/config`, que o ESLint 10 já fornece. Com ela o
   typecheck fica em `0 hints`.

4. **Regras de lint com tipos vazam para os `.astro` e derrubam o `pnpm lint`.**
   Espalhar `...tseslint.configs.recommendedTypeChecked` na raiz da flat config
   faz as regras tipadas alcançarem arquivos `.astro`, que usam
   `astro-eslint-parser`. Esse parser não repassa `parserOptions.project` ao
   `@typescript-eslint/parser`, e o ESLint morre com erro de infraestrutura
   (`exit 2`, "you have used a rule which requires type information") em vez de
   apontar defeito de código. A correção é escopar o preset tipado dentro de um
   bloco `files: ['**/*.{ts,tsx}']` com `extends`, e deixar
   `astro.configs.recommended` cuidar dos `.astro` sem tipos.

5. **`pnpm format` alcança bem mais do que código, e isso é nocivo aqui.** Na
   primeira execução, o Prettier reescreveu 15 arquivos de documentação —
   incluindo `.claude/skills/speckit-*/SKILL.md` com o *quoting* do frontmatter
   YAML, e as tabelas de `AGENTS.md` esticadas para mais de 100 colunas. Os
   arquivos do Spec Kit são mantidos pelo CLI fixado em 1.2.5, e a constituição
   exige poder revisar o diff do `init`; reformatá-los torna esse diff ilegível.
   Decisão: `.prettierignore` passa a excluir `*.md`, `.specify/` e `.claude/`
   — **o Prettier formata código neste repositório, não prosa.** Quebra de linha
   em documentação é decisão de quem escreve.

   Vale notar o que *não* aconteceu: a POC (`index.html`, `script.js`,
   `style.css`) saiu intacta da primeira execução, com hash idêntico. As três
   linhas de exclusão previstas em FR-016 funcionaram. O vazamento foi em
   arquivos que a Fase 0 não tinha pensado em proteger.
