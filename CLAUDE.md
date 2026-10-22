# Rota Fácil – instruções para o Claude

- O dono do projeto não é programador. Explique mudanças em português simples, sem jargão.
- Antes de mudanças grandes, diga em poucas linhas o que vai fazer.
- Privacidade é obrigatória: tudo roda no navegador. Nada de servidor, analytics ou chamadas a sites de terceiros com dados da planilha.
- NUNCA coloque planilhas reais ou endereços reais no repositório, em testes, em commits ou em mensagens. Testes usam só dados inventados (`tests/fixtures/`). Planilha real só via `REAL_SHEET` (veja o README).
- Não use nome ou logo de transportadoras ou apps de rota como se fossem nossos. Pode dizer "compatível com planilhas da iMile" e "para importar no Spoke".
- Regras de endereço ficam em `src/core/` e sempre com teste em `tests/`. Toda mudança de regra precisa manter `npm test` passando, incluindo o exemplo de 10 pacotes / 8 paradas.
- Transportadoras novas: `src/core/carriers/`. Apps de rota novos: `src/core/route-apps/`.
- Atualize `CHANGELOG.md` e a versão em `package.json` a cada versão.
- Seja honesto sobre o que foi testado e o que não foi.
