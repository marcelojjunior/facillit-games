# Phase 1 — Quickstart: validar a fundação

**Feature**: `specs/001-astro-foundation/`

Roteiro para provar que a fundação funciona. Cada passo aponta para o critério
de sucesso que ele verifica, para que um revisor possa conferir a spec em vez de
confiar no relato.

A ordem importa: os passos 1 a 5 provam que os comandos **passam**; os passos 6
a 9 provam que eles **reprovam**. A segunda metade é a que importa — um comando
de verificação que nunca falha não verifica nada.

## Pré-requisitos

- Node `>=22.23.4` — piso real de `astro@7.4.4`, não "LTS atual". Confira com
  `node -v`.
- Corepack habilitado, ou pnpm na versão declarada em `packageManager`.
- **Nenhuma** variável de ambiente, arquivo `.env` ou credencial. A ausência é
  parte do que se está testando (FR-003).

## Parte 1 — os comandos passam

### 1. Instalar a partir de um clone limpo → SC-001

```sh
pnpm install
```

**Esperado**: termina com sucesso, usando `pnpm-lock.yaml`. Não pede
configuração nem variável de ambiente.

> Se aparecer aviso de peer não satisfeito, não ignore: `@astrojs/react` tem um
> peer não óbvio (`oxc-transform-react`) que deve estar declarado
> explicitamente. Ver [research.md, Decisão 5](./research.md).

### 2. Gerar o artefato estático → SC-001, FR-002

```sh
pnpm build
ls dist/
```

**Esperado**: `dist/` existe e contém `index.html`. O build termina com código
`0`.

**Confira que não há runtime de servidor** (Princípio I):

```sh
find dist -name '*.func' -o -name '_worker.js' -o -name 'entry.mjs' | head
```

**Esperado**: saída vazia.

### 3. Servir o artefato sem nenhuma lógica → SC-002

```sh
pnpm preview
```

Abra a URL impressa. **Esperado**: a página carrega, a ilha de prova aparece com
o valor lido do navegador, e o console fica **sem erro e sem aviso de hydration
mismatch**.

> Esta checagem é manual nesta fase, por decisão registrada em
> [spec.md § Assumptions](./spec.md). Teste de navegador automatizado é
> candidato da Fase 4.

### 4. Confirmar que a ilha não renderizou no build → SC-005, Princípio IV

```sh
grep -c 'client-only-probe' dist/index.html
```

**Esperado**: `0`. A marcação renderizada da ilha **não** está no HTML gerado —
é isso que distingue `client:only` de `client:load`.

O passo 5 verifica o mesmo automaticamente; faça este à mão uma vez, para ver
com os próprios olhos o que o teste afirma.

### 5. Rodar a suíte, o typecheck e o lint → SC-003, SC-004, SC-007

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

**Esperado**: todos com código `0`. `pnpm test` relata **ao menos um teste
executado** e zero falhas, e **não entra em modo watch**.

### 6. Confirmar que a POC está intocada → SC-006, FR-016

```sh
git diff --stat chore/spec-kit -- index.html script.js style.css
```

**Esperado**: saída vazia — zero linha alterada nos três arquivos.

Rode também **depois** de `pnpm format`, que é o comando com maior chance de
reescrever a POC por acidente:

```sh
pnpm format && git status --porcelain -- index.html script.js style.css
```

**Esperado**: saída vazia.

### 7. Confirmar o escopo negativo → SC-008, FR-018

```sh
grep -rniE 'localStorage|schemaVersion|GameDefinition|meche' src/ tests/ dist/
```

**Esperado**: saída vazia. Esta fase não antecipa o contrato de jogo, o schema
persistido nem nenhum jogo por nome.

## Parte 2 — os comandos reprovam

Cada passo abaixo introduz um defeito proposital, confirma que o comando
correspondente **falha**, e desfaz. Se algum passar, o comando é decorativo e a
fase não está pronta.

### 8. O corredor de testes reprova de verdade → SC-003, FR-009

Adicione a um arquivo de teste:

```ts
it('falha de proposito', () => {
  expect(1).toBe(2);
});
```

```sh
pnpm test; echo "exit=$?"
```

**Esperado**: `exit` diferente de `0`. Remova o teste.

### 9. O typecheck reprova um erro de tipo → SC-004, FR-006

Adicione a um arquivo `.ts` de `src/`:

```ts
const n: number = 'texto';
```

```sh
pnpm typecheck; echo "exit=$?"
```

**Esperado**: `exit` diferente de `0`. Remova a linha.

### 10. A verificação de formatação reprova → SC-007, FR-014

Estrague a indentação de um arquivo em `src/` e rode:

```sh
pnpm format:check; echo "exit=$?"
```

**Esperado**: `exit` diferente de `0`, apontando o arquivo. Depois:
`pnpm format` para restaurar.

### 11. O build reprova API de navegador em tempo de build → Princípio IV

Troque `client:only` por `client:load` na ilha de prova em
`src/pages/index.astro` e rode:

```sh
pnpm build; echo "exit=$?"
pnpm test; echo "exit=$?"
```

**Esperado**: o build falha, **ou** passa e `pnpm test` falha ao encontrar a
marcação da ilha em `dist/index.html`. Em qualquer dos dois casos, o pipeline
acusa — que é o ponto.

**Este é o passo mais importante do roteiro.** Ele é a única verificação de que
a armadilha central deste projeto está coberta por algo que falha
automaticamente, e não apenas documentada. Reverta a diretiva ao terminar.

## Critério de pronto da fase (resumo)

| Critério da issue MJR-9 | Verificado em |
|---|---|
| `pnpm install && pnpm build` gera artefato estático | passos 1 e 2 |
| `pnpm test` roda o Vitest com sucesso | passo 5 (e passo 8 prova que reprova) |
| `specs/NNN-*/spec.md` commitado e `plan.md` com Constitution Check | `61cc74a`; [plan.md § Constitution Check](./plan.md) |
| Nenhum arquivo da POC alterado | passo 6 |
