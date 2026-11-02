# CLAUDE.md

As instruções deste repositório vivem em **[AGENTS.md](AGENTS.md)**. Leia antes
de agir.

Resumo do que não dá para errar:

1. **[`.specify/memory/constitution.md`](.specify/memory/constitution.md)
   supersede tudo.** Em conflito com plano, comentário ou preferência, a
   constituição vence.
2. **Spec antes de código.** Regra de jogo, schema persistido ou fluxo visível
   ao usuário exigem o ciclo `/speckit-specify` → `/speckit-plan` →
   `/speckit-tasks` → `/speckit-implement`, com `spec.md` commitado antes da
   implementação. Bug usa `/speckit-bug-assess` → `/speckit-bug-fix` →
   `/speckit-bug-test`. Typo e bump de dependência não usam o ciclo.
3. **Jogo é plugin.** A casca nunca referencia um jogo por nome. `if (gameId
   === ...)` fora do registry é violação.
4. **Client-side puro.** Sem backend, sem API, sem auth. Só `localStorage`.
5. **`localStorage` não existe no build.** Estado de partida só em ilha
   `client:only`.
6. **A POC está congelada.** `index.html`, `script.js`, `style.css` seguem no ar
   até o cutover e não recebem correção nova.
