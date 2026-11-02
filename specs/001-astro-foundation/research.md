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

## Decisão 5 — React 19 com `@astrojs/react@7.1.2`, e um peer que não é óbvio

**Decisão**: `@astrojs/react@7.1.2` + `react@19.3.1` + `react-dom@19.3.1` +
`@types/react@19.3.0` + `@types/react-dom@19.3.0`, e `oxc-transform-react`
declarado explicitamente.

**Rationale**: os peers de `@astrojs/react@7.1.2` são:

```
react, react-dom:              ^17.0.2 || ^18.0.0 || ^19.0.0
@types/react, @types/react-dom: ^17.0.50 || ^18.0.21 || ^19.0.0
oxc-transform-react:            ^0.145.0
```

React 19 está dentro da faixa. O item que surpreende é
`oxc-transform-react` — um peer de transformação JSX que não vem embutido.
Latest é `0.156.0`, que satisfaz `^0.145.0`. Vou declará-lo como
`devDependency` explícita em vez de confiar em resolução automática de peer:
`auto-install-peers` é comportamento de gerenciador, e depender dele faz o
`install` de um clone novo passar a depender de configuração de máquina — o que
contraria FR-001 ("a partir de um clone limpo").

**Alternatives considered**:

- **Deixar o peer para o `auto-install-peers` do pnpm** — rejeitado pelo motivo
  acima. Se o comportamento default mudar, ou se alguém tiver um `.npmrc`
  diferente, o build quebra num lugar que não parece ter mudado.
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
| `oxc-transform-react` | 0.156.0 | 0.156.0 | peer explícito de `@astrojs/react` |
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

## Unknowns remanescentes

Nenhum `NEEDS CLARIFICATION` da Technical Context ficou aberto.

Duas incertezas de execução ficam registradas como risco, não como bloqueio.
Ambas são verificadas pelo próprio `pnpm install` e `pnpm build` da fase — ou
seja, a fase falha ruidosamente se eu errei, em vez de passar escondendo:

1. **`eslint-plugin-astro@3.2.1` pede dois plugins de a11y** como peer
   (`eslint-plugin-jsx-a11y` **e** `eslint-plugin-jsx-a11y-x`). Declarar os dois
   parece redundante. Vou declarar o que o `install` exigir e registrar o
   resultado no plano, em vez de adivinhar agora.
2. **`astro check` com TS 6.0.3** é a combinação declarada como suportada pelo
   peer, mas peer satisfeito não é o mesmo que testado. Se `astro check` falhar
   por motivo de versão, a resposta registrada é descer para `typescript@5.9.x`
   (ainda dentro de ambos os peers) — e **não** relaxar `strict`, que seria
   violação do Princípio V.
