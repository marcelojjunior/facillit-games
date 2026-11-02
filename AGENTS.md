# Facillit Games — guia para agentes

Leia este arquivo antes de agir neste repositório.

## O que este projeto é

Uma plataforma de **marcadores de pontuação, um por jogo**. A casca (cadastro de
jogadores, navegação de rodadas, tabela acumulada, persistência) é
compartilhada; cada jogo declara a sua própria regra de pontuação através do
contrato `GameDefinition`.

O primeiro jogo é o **MECHE-MECHE**. O projeto é 100% client-side: sem backend,
sem API, sem autenticação, dados só em `localStorage`.

**A propriedade que todo trabalho aqui tem que preservar:** adicionar um jogo
novo não deve exigir alteração na casca.

## A regra que governa tudo

[`.specify/memory/constitution.md`](.specify/memory/constitution.md) é a
constituição do projeto. Ela supersede plano, comentário, documento e
preferência de agente. Em conflito, a constituição vence.

Se você vai escrever código, leia a constituição primeiro. Ela é curta e todos
os princípios são verificáveis.

## Fluxo obrigatório: Spec antes de código

Este repositório usa [GitHub Spec Kit](https://github.com/github/spec-kit).
Os comandos estão instalados como skills em `.claude/skills/speckit-*` e são
versionados em git — não precisa instalar nada para usá-los.

### Faixa 1 — ciclo completo

Para qualquer coisa que **crie ou altere regra de jogo, schema persistido ou
fluxo visível ao usuário** (jogo novo, mudança de pontuação, tela nova):

```
/speckit-specify  →  /speckit-clarify (opcional, recomendado)
                  →  /speckit-plan
                  →  /speckit-tasks
                  →  /speckit-implement
```

Opcionais que valem a pena: `/speckit-checklist` depois do plan,
`/speckit-analyze` antes do implement.

### Faixa 2 — correção de bug

```
/speckit-bug-assess  →  /speckit-bug-fix  →  /speckit-bug-test
```

Relatórios ficam em `.specify/bugs/<slug>/`.

### Faixa 3 — fora do processo

Bump de dependência, ajuste de token de cor, typo, formatação. Commit direto
com review normal. **Não** rode o ciclo completo para isso.

### Não use

`/speckit-taskstoissues` (e a substituta `/speckit-github-taskstoissues`).
Elas criam GitHub Issues, o que seria uma terceira fonte de verdade ao lado do
Paperclip e das specs. Veja a fronteira abaixo.

## Fronteira Paperclip ↔ Spec Kit

Os dois são "lugar onde mora especificação". Sem regra, divergem em silêncio.
A regra é:

| | Paperclip | Spec Kit (git) |
|---|---|---|
| Responde | **por quê** e **quem/quando** | **o quê** e **como** |
| Contém | issue, aprovação, custo, prioridade, sequência de fases | `spec.md`, `plan.md`, `tasks.md` |
| Granularidade | fase / feature | requisito / tarefa |

- Nenhuma task de implementação começa sem `spec.md` **commitado**.
- A task do Paperclip **cita o caminho da spec** que a governa
  (ex: `specs/003-meche-meche/spec.md`).
- O review confere o código **contra a spec**, não só contra o diff.
- Se a realidade contrariar a spec durante a implementação, **atualize a spec no
  mesmo PR**. Implementar diferente e seguir é violação.
- Spec Kit **não** cria cards no Paperclip. `tasks.md` é checklist interno da
  feature.

## CLI do Spec Kit

A versão está fixada em **1.2.5**. Você só precisa do CLI para `init` e para
gerenciar extensões — o ciclo do dia a dia usa as skills já versionadas.

```sh
uvx --from git+https://github.com/github/spec-kit.git@v1.2.5 specify <comando>
```

Use `uvx` (sem instalação persistente) em vez de `uv tool install`: sessões de
agente costumam ter `HOME` isolado e efêmero, então um `uv tool install` não
sobrevive à sessão nem vale para as outras.

Atualizar a versão é decisão explícita, com o diff do `init` revisado — nunca
pegue o `latest`.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Astro, `output: 'static'` |
| Linguagem | TypeScript `strict` |
| Ilhas | React, `client:only` para estado de partida |
| Estilo | Tailwind + design tokens |
| Testes | Vitest nas regras de pontuação |
| Deploy | Vercel, estático |
| Gerenciador | pnpm |

Trocar qualquer camada exige emenda da constituição.

## Armadilhas conhecidas

1. **`localStorage` não existe no build.** Astro renderiza no servidor/build.
   Toda tela com estado de partida tem que ser ilha `client:only`. Com
   `client:load` dá hydration mismatch e flash de tela vazia a cada abertura —
   que é o uso normal (celular na mesa, aba descartada pelo navegador).
2. **Empate é caso normal.** `resolveWinners` retorna lista, não um jogador.
3. **Grave a cada mutação.** Partida em andamento se identifica por campo
   `status` explícito, nunca inferida da quantidade de rodadas.
4. **A POC está congelada.** `index.html`, `script.js` e `style.css` são a POC
   original, publicada e no ar até o cutover. Não corrija bug novo nela; os
   bugs conhecidos são critério de aceite da reescrita.

## Versionado ou não

- **Em git:** `.specify/` (constituição, templates, scripts, registry de
  extensões), `specs/**`, `.claude/skills/speckit-*`. Sem isso o processo não
  existe em um clone novo.
- **Fora do git:** `.claude/settings.local.json` (permissões locais),
  `.specify/extensions/.cache/`, e o que o `.specify/.gitignore` (mantido pelo
  CLI) já cobre.
