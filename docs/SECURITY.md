# Segurança – Rota Fácil

O Rota Fácil não tem servidor, banco, login nem API. Os dados da planilha (endereços e rastreios de clientes) só existem na memória do navegador enquanto o entregador usa o app. Por isso vários riscos de back-end não se aplicam, e o foco é: nada sai do celular, nada perigoso entra pela planilha e as dependências estão em dia.

| Risco | Situação | Como o projeto trata |
| --- | --- | --- |
| Dados sensíveis (LGPD) | ✅ feito | A planilha é lida no navegador. Nenhum `fetch` com conteúdo, sem analytics, sem servidor. O `localStorage` guarda só preferências. |
| Vazamento por terceiros | ✅ feito | Fontes e bibliotecas vão dentro do app. A página não chama nenhum outro site. |
| Planilha real no repositório | ✅ feito | O `.gitignore` bloqueia `.xlsx`, `.xls` e `.csv` fora de `src/core/fixtures/`. Testes e prints usam dados inventados; a planilha real só entra pela variável `REAL_SHEET`. |
| XSS (planilha com HTML ou script) | ✅ feito | Todo texto da planilha é mostrado pelo React, que escapa o conteúdo. Não há `dangerouslySetInnerHTML`. |
| Arquivo malicioso ou corrompido | ✅ feito | Erros de leitura viram mensagem amigável e nada é gerado. SheetJS 0.20.3 corrige as falhas conhecidas de leitura (poluição de protótipo e ReDoS). Arquivo acima de 5 MB é recusado antes de ser lido, e cada aba é lida até 5.000 linhas (`src/core/limits.ts`); passou disso, aparece um aviso e nada é gerado. |
| Arquivo de saída errado | ✅ feito | A conferência relê o arquivo gerado e bloqueia o download se faltar pacote, se um rastreio repetir ou se CEP, cidade, estado, número ou coordenada não baterem. |
| Dependências vulneráveis | ✅ feito | `npm audit --omit=dev --audit-level=high` na CI e Dependabot semanal. |
| Actions comprometidas | ✅ feito | Actions de terceiros fixadas por SHA do commit. |
| Segredos no repositório | ✅ feito | O app não usa segredos. Gitleaks roda em todo PR. |
| Headers de segurança e CSP | ✅ feito | O GitHub Pages não deixa configurar cabeçalhos, então a CSP vai por `<meta>` no `index.html`, colocada no build (`vite.config.ts`). Só aceita scripts, estilos, fontes e conexões do próprio site; `connect-src 'self'` faz o navegador barrar qualquer envio para outro site. Um teste no navegador confere que o uso normal não é bloqueado e que um envio para fora é barrado. Pela `<meta>` não dá para usar `frame-ancestors` (proteção contra a página dentro de outra); como não há login nem botão perigoso, o risco é baixo. |
| Variáveis expostas no navegador | ⚪ ainda não se aplica | Não há variáveis de ambiente secretas. |
| Validação no back-end | ⚪ ainda não se aplica | Não há back-end. Toda entrada é validada no motor (`src/core/read.ts`). |
| SQL injection | ⚪ ainda não se aplica | Não há banco. |
| Autenticação fraca, tokens e sessão | ⚪ ainda não se aplica | Não há login. |
| IDOR | ⚪ ainda não se aplica | Não há recursos de outras pessoas. |
| Senhas no banco e força bruta | ⚪ ainda não se aplica | Não há senhas. |
| CSRF e CORS | ⚪ ainda não se aplica | Não há API. |
| Rate limit | ⚪ ainda não se aplica | Não há servidor. |
| Envio duplicado | ⚪ ainda não se aplica | Nada é enviado. Baixar duas vezes só gera o mesmo arquivo. |
| Upload | ⚪ ainda não se aplica | O arquivo escolhido não é enviado para lugar nenhum. |
| Planilha compartilhada por outro app | ✅ feito | O "Compartilhar" do Android entrega a planilha ao service worker do próprio app, sem servidor. Ela fica num cache temporário do navegador e é apagada assim que o app lê, e passa pelos mesmos limites de tamanho e linhas. |
| Vazamento de informação em erro | ✅ feito | Mensagens de erro são em português simples e não mostram detalhes internos. O detalhe vai só para o console do navegador. |
| Uso indevido de marca | ✅ feito | O app diz "compatível com planilhas da iMile" e "para importar no Spoke", e deixa claro que é independente. |
