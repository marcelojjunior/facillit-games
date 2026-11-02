# Phase 1 — Contract: scripts de pipeline

**Feature**: `specs/001-astro-foundation/`

A única interface que esta feature expõe é o **conjunto de scripts de
`package.json`**. Não há API, endpoint nem contrato de dados — a aplicação é
estática e client-side (Princípio I).

Esse conjunto é contrato de verdade, não documentação: as Fases 3 a 6, o review
e o pipeline de publicação dependem desses nomes. Renomear ou remover um script
daqui é mudança quebrável e exige atualização desta spec no mesmo PR
(Princípio VIII).

## Scripts

| Script | Faz | Sai com erro quando | Requisito |
|---|---|---|---|
| `pnpm install` | Instala dependências a partir do lockfile versionado | lockfile divergente de `package.json`, ou Node fora de `engines` | FR-001, FR-004 |
| `pnpm build` | Gera o artefato estático em `dist/` | qualquer erro de build, incluindo execução de API de navegador em tempo de build | FR-001, FR-002 |
| `pnpm dev` | Servidor de desenvolvimento com HMR | porta ocupada | conveniência — não é critério de pronto |
| `pnpm preview` | Serve `dist/` como arquivos estáticos, sem lógica | `dist/` ausente | SC-002 |
| `pnpm typecheck` | Verificação de tipos em modo estrito (`astro check`) | qualquer erro de tipo | FR-006, SC-004 |
| `pnpm test` | Suíte unitária (Vitest, uma passada, sem watch) | qualquer teste falhando | FR-008, FR-009, SC-003 |
| `pnpm test:watch` | Vitest em watch, para desenvolvimento | — | conveniência |
| `pnpm lint` | ESLint sobre `src/` e `tests/` | qualquer erro de lint | FR-014, FR-015 |
| `pnpm format` | Prettier **escrevendo** | — | conveniência |
| `pnpm format:check` | Prettier **verificando**, sem escrever | qualquer arquivo fora do padrão | FR-014, SC-007 |

## Invariantes do contrato

Estas propriedades são o que as fases seguintes têm direito de assumir. Quebrar
qualquer uma é quebra de contrato, mesmo que os nomes dos scripts continuem iguais.

1. **`pnpm test` é uma passada, não watch.** Um `pnpm test` que entra em watch
   trava CI e trava sessão de agente. A variante interativa tem nome próprio
   (`test:watch`).
2. **Nenhum script exige variável de ambiente, segredo ou credencial** (FR-003,
   Princípio I). Rodar com ambiente vazio é o caso testado, não o degradado.
3. **Nenhum script exige rede depois do `install`.** `build`, `test`,
   `typecheck`, `lint` e `format:check` rodam offline.
4. **`typecheck`, `lint` e `format:check` ignoram `index.html`, `script.js` e
   `style.css`** (FR-015, FR-016). Nenhuma ferramenta pode reescrever ou reprovar
   a POC congelada. Em particular, `pnpm format` **não** altera esses arquivos.
5. **`build` produz só arquivos estáticos** — sem função de servidor, sem
   adapter, sem processo residente (FR-002).
6. **Cada comando de verificação reprova de verdade.** `test`, `typecheck`,
   `lint` e `format:check` devem falhar diante de um defeito proposital; um
   comando que passa vazio não cumpre o contrato (FR-009, SC-003, SC-004,
   SC-007). O roteiro de [quickstart.md](../quickstart.md) exercita isso.
7. **`build` falha se uma API de navegador for executada em tempo de build.**
   É o que torna a violação do Princípio IV visível no pipeline em vez de no
   celular do usuário.

## O que este contrato deliberadamente não fixa

- **Nome do diretório de saída** além de `dist/` — é o default do Astro e a
  plataforma de hospedagem o detecta sozinha. Fixar outro só criaria
  configuração para manter.
- **Script de deploy.** A publicação é passo humano nesta instância (sem
  conexão Vercel para agentes) e o build estático é detectado automaticamente.
  Um `pnpm deploy` falso-prestativo esconderia que o passo é humano.
- **Script de CI agregador** (`pnpm ci` ou similar). Útil, mas ainda não há CI
  configurado; inventar o nome agora é palpite sobre uma fase que não começou.
  Quem configurar CI compõe a partir dos scripts acima.
