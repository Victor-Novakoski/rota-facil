# Regras do projeto – Rota Fácil

Baseadas nos padrões de trabalho do Victor, adaptadas a um app só de front-end (sem API, banco ou Docker). Se uma regra atrapalhar, a gente conversa e muda aqui.

## Escopo

- Funcionalidade nova só é feita depois de estar no `PRD.md` e no `TASKS.md`.
- Uma tarefa por vez, só da etapa atual. Melhoria que aparece no caminho vira item novo no `TASKS.md`.
- Nada de dependência, serviço ou camada nova "para o futuro". Dependência nova é explicada antes e registrada no `MEMORY.md`.
- Tudo roda no navegador. Servidor, analytics e envio de dados da planilha estão fora de cogitação.

## Código

- Identificadores em inglês; comentários, docs, textos da tela, mensagens de erro e commits em português.
- Respeitar as camadas do `ARCHITECTURE.md`: o motor (`src/core/`) não importa nada de `src/ui/`; as telas usam o motor e nunca leem planilha direto.
- Só `src/core/spreadsheet.ts` conversa com o SheetJS.
- Transportadora nova é um perfil em `src/core/carriers/`; app de rota novo é um perfil em `src/core/route-apps/`.
- TypeScript estrito, sem `any` sem um comentário dizendo o porquê.
- Lint limpo: `npm run lint` (ESLint `--max-warnings=0`) e `npm run typecheck`.

## Segurança

Checklist para toda mudança:

- [ ] Nenhum dado da planilha sai do celular: sem `fetch`, analytics ou serviço externo com conteúdo.
- [ ] Nenhuma planilha real, endereço real ou nome de cliente no repositório, em teste, em commit, em print ou em mensagem. Testes e prints só com dados inventados.
- [ ] Nada de `dangerouslySetInnerHTML` com dado da planilha. O React escapa o texto; não contornar.
- [ ] `localStorage` só para preferências (transportadora, app de rota, boas-vindas vistas). Nunca dados da planilha.
- [ ] Nenhum segredo no código. O app não tem variáveis secretas.
- [ ] Dependência nova é necessária, mantida e passa no `npm audit --omit=dev --audit-level=high`.
- [ ] Não usar nome ou logo de transportadora ou app de rota como se fossem nossos. Pode: "compatível com planilhas da iMile", "para importar no Spoke".
- [ ] Nada de código, nome de cliente ou padrão interno de outra empresa. O repositório é público.

## Testes

- Regra de endereço nova ou alterada tem teste em `src/core/address.test.ts`.
- O exemplo inventado precisa continuar dando 10 pacotes, 8 paradas e conferência ok (`src/core/convert.test.ts`).
- Bug corrigido ganha um teste que falhava antes da correção.
- Telas: Vitest + Testing Library, teste ao lado do arquivo, testando o que o entregador vê.
- Fluxos completos no navegador: Playwright em `e2e/`.
- Planilha real só pela variável `REAL_SHEET`, fora do repositório (veja o README).
- `npm test` passando antes de qualquer commit.

## Git

- Autor dos commits: `Victor Novakoski <106678659+Victor-Novakoski@users.noreply.github.com>`. Sem linhas de atribuição ao Claude.
- `main` é o que está publicado; `develop` junta o trabalho da próxima versão. Ninguém faz push direto nelas.
- Branch de trabalho nasce da `develop` com o tipo no nome (`feat/...`, `fix/...`, `docs/...`, `chore/...`, `ci/...`) e o PR vai para a `develop`.
- Release (`develop` → `main`) só quando o Victor pedir, com título `chore(release): <nome da etapa>`, sempre com merge commit.
- Feature → `develop` com squash. Para atualizar a branch: `git pull --rebase origin develop`.
- Conventional Commits em português com assunto minúsculo: `tipo(escopo): assunto`. Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `style`, `build`, `ci`, `chore`, `revert`. Quebra de compatibilidade leva `!`.
- Commits pequenos, um assunto por commit. Nunca commitar `node_modules`, `dist` ou planilhas (o `.gitignore` bloqueia `.xlsx` fora de `src/core/fixtures/`).
- Nada que não dá para desfazer (force push, reescrever histórico) sem o ok do Victor.

## Documentação

- `TASKS.md`: item concluído é marcado no mesmo PR.
- `MEMORY.md`: toda decisão com trade-off (biblioteca, regra de endereço, o que foi descartado).
- `ARCHITECTURE.md` e `DESIGN.md`: atualizados quando muda pasta, tela, perfil ou componente base.
- `CHANGELOG.md` e versão no `package.json` a cada release.

## Definição de pronto

Uma tarefa está pronta quando:

- funciona no `npm run dev` e no build (`npm run build && npm run preview`);
- tem testes e `npm test`, `npm run test:e2e`, `npm run lint` e `npm run typecheck` passam;
- o checklist de segurança acima foi revisado;
- os docs foram atualizados e o item está marcado no `TASKS.md`;
- foi testada no navegador de verdade, com prints quando mudou tela;
- passou por uma revisão adversarial (planilha vazia, colunas faltando, arquivo que não é planilha, endereço estranho, centenas de linhas).
