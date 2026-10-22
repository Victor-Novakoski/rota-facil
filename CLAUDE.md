# Rota Fácil – instruções para o Claude

As regras completas estão em `docs/RULES.md`. O essencial:

- O dono do projeto (Victor) não é programador. Responda em português simples, com o resultado primeiro.
- Antes de mudanças grandes, diga em poucas linhas o que vai fazer. Antes de qualquer coisa que não dá para desfazer (force push, reescrever histórico), peça o ok.
- Privacidade é obrigatória: tudo roda no navegador. Nada de servidor, analytics ou chamadas a sites de terceiros com dados da planilha.
- NUNCA coloque planilhas reais ou endereços reais no repositório, em testes, em commits, em prints ou em mensagens. Só dados inventados (`src/core/fixtures/`). Planilha real só via `REAL_SHEET`.
- Não use nome ou logo de transportadoras ou apps de rota como se fossem nossos.
- Siga o `docs/TASKS.md`: só a etapa atual, uma tarefa por vez.

## Git

- Autor: `git config user.name "Victor Novakoski"` e `git config user.email "106678659+Victor-Novakoski@users.noreply.github.com"`.
- Sem `Co-Authored-By`, `Claude-Session` ou qualquer linha de atribuição nos commits.
- Branch nasce da `develop` (`feat/...`, `fix/...`, `docs/...`, `chore/...`, `ci/...`) e o PR vai para a `develop`. Nunca push direto na `main` ou na `develop`.
- Conventional Commits em português, assunto minúsculo. O título do PR segue o mesmo padrão.
- Depois de abrir o PR, acompanhe a CI até ficar verde. Quem faz o merge é o Victor.

## Antes de abrir PR

- `npm run lint`, `npm run typecheck`, `npm test` e `npm run test:e2e` passando.
- Regra de endereço nova tem teste; o exemplo inventado continua dando 10 pacotes / 8 paradas.
- Docs atualizados (`TASKS`, `MEMORY` e o que mais mudou).
- Revisão adversarial do próprio código e prints quando mudar tela.
