# Facillit Games

Plataforma de **marcadores de pontuação, um por jogo**. A casca (cadastro de
jogadores, navegação de rodadas, tabela acumulada, persistência) é
compartilhada; cada jogo declara a sua própria regra de pontuação.

100% client-side: sem backend, sem API, sem autenticação. Dados só em
`localStorage`.

- **Como trabalhar neste repo:** [`AGENTS.md`](AGENTS.md)
- **A regra que governa tudo:** [`.specify/memory/constitution.md`](.specify/memory/constitution.md)

## Estado atual

A reescrita está em andamento. Dois conjuntos de arquivos coexistem na raiz:

| | O que é |
|---|---|
| `index.html`, `script.js`, `style.css` | **POC congelada.** Publicada e no ar até o cutover. **Não receba correção de bug novo** — os bugs conhecidos são critério de aceite da reescrita. |
| `src/`, `tests/`, e as configurações | A aplicação nova (Astro). Fundação entregue; sem telas de jogo ainda. |

A fundação é especificada em
[`specs/001-astro-foundation/`](specs/001-astro-foundation/).

## Requisitos

- **Node `>=22.23.4`.** Não é "LTS atual": é o piso real declarado por
  `astro@7.4.4`. Node 25 (ímpar, não-LTS) está fora da faixa do Vitest.
- **pnpm**, na versão de `packageManager`. Use Corepack.

Nenhuma variável de ambiente, arquivo `.env` ou credencial é necessária — por
princípio, não por acaso.

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento com HMR |
| `pnpm build` | Gera o artefato estático em `dist/` |
| `pnpm preview` | Serve `dist/` como arquivos estáticos |
| `pnpm test` | Suíte unitária, uma passada |
| `pnpm test:watch` | Suíte em watch |
| `pnpm typecheck` | Verificação de tipos em modo estrito |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier, escrevendo |
| `pnpm format:check` | Prettier, apenas verificando |

O contrato desses comandos (o que cada um garante, e o que **não** garante) está
em
[`specs/001-astro-foundation/contracts/commands.md`](specs/001-astro-foundation/contracts/commands.md).
As Fases 3 a 6 dependem desses nomes: renomear é mudança quebrável.

> `tests/static-build.test.ts` lê `dist/index.html`. Rode `pnpm build` antes de
> `pnpm test`, ou o teste falha com instrução para isso. Ele falha de propósito
> em vez de passar vazio — um teste que passa sem artefato dá confiança falsa.

## Três coisas que vão te custar tempo se ninguém avisar

### 1. TypeScript está em `6.0.x` de propósito. Não suba para a linha 7.

`latest` é `7.0.2`, mas as duas ferramentas que leem nossos tipos não suportam
a linha 7:

```
@astrojs/check@0.9.12      typescript: ^5.0.0 || ^6.0.0
typescript-eslint@8.72.1   typescript: >=4.8.4 <6.1.0
```

A interseção é `6.0.x`. Subir agora quebra `pnpm typecheck` e o lint com tipos.

**Condição para subir**: `@astrojs/check` **e** `typescript-eslint` liberarem o
peer de TS 7. Até lá, um `pnpm update` descuidado quebra o pipeline.

### 2. Não existe `tailwind.config.js`. Não crie um.

Tailwind 4 configura por CSS. Tokens de design vão em
[`src/styles/global.css`](src/styles/global.css), com `@theme`.

A integração `@astrojs/tailwind` **não serve** aqui: sua última versão declara
`astro: ^3||^4||^5` e `tailwindcss: ^3.0.24` — incompatível em duas dimensões
com Astro 7 + Tailwind 4. Tailwind entra como plugin de Vite, em
`astro.config.mjs`.

### 3. O `tsconfig.json` exclui a POC de propósito. Remover o `exclude` trava o typecheck.

O preset `astro/tsconfigs/base` traz `allowJs: true` com
`include: ["${configDir}/**/*"]`. Sem as exclusões, os 16 KB de `script.js`
entram no programa do TypeScript e `pnpm typecheck` passa a reprovar por erros
num arquivo que a constituição proíbe corrigir.

As mesmas três exclusões existem em `eslint.config.js` e `.prettierignore`. A
do Prettier é a mais importante: ao contrário do lint, `pnpm format` **escreve**.

## Estado de partida tem que ser ilha `client:only`

Astro renderiza no build, onde `localStorage` não existe. Toda tela com estado
de partida **tem** que ser ilha `client:only`.

Com `client:load` dá hydration mismatch e flash de tela vazia a cada abertura —
que é o uso normal do app: celular na mesa, aba descartada pelo navegador. É o
Princípio IV da constituição.

Isso não depende de você lembrar: `tests/static-build.test.ts` roda contra o
HTML construído e falha se a ilha renderizar no build.
`src/components/ClientOnlyProbe.tsx` é a prova viva, e é descartável — **o teste
não é**. Quando a primeira tela real de partida existir, reaponte o teste para
ela em vez de removê-lo.

## Prettier formata código, não prosa

`*.md`, `.specify/` e `.claude/` estão em `.prettierignore`. Motivo apurado na
prática: sem isso, o primeiro `pnpm format` reescreveu 15 arquivos de
documentação, incluindo o frontmatter YAML das skills do Spec Kit — que são
mantidas pelo CLI fixado em 1.2.5, e cujo diff a constituição exige poder
revisar.

## Deploy

Vercel, estático. O Astro com `output: 'static'` é detectado automaticamente:
**sem adapter, sem variável de ambiente, sem configuração**.

A criação do projeto na Vercel é passo humano. Se `pnpm build` passa localmente,
o artefato está pronto.
