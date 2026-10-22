# Decisões – Rota Fácil

Decisões com trade-off e o porquê, por data e etapa.

## 22/10/2026 — Etapa 0 (Base)

- **Tudo no navegador, sem servidor.** Protege os endereços dos clientes (LGPD), não tem custo e funciona sem internet. Descartado: back-end para guardar rotas ou histórico.
- **v1 em HTML único com SheetJS e jsPDF por CDN.** Para validar a ideia rápido. Testada com a planilha de exemplo (10 pacotes → 8 paradas) e com uma planilha real (57 → 46).
- **Regras 3.6 e 3.7 da referência viraram automáticas.** "apto 91 430" vira número 430 + complemento "apto 91"; endereço sem número corta na primeira palavra de complemento (consultório, loja, apto...) e marca "(sem número)".
- **Números como "7 de Setembro" não são o número da casa.** Um número seguido de "de", "do" ou "da" é tratado como parte do nome da rua.
- **Número repetido só é removido quando é exatamente igual.** O script de referência apagava "45" de "450 apto"; o app compara a palavra inteira.
- **Conferência relê o arquivo gerado**, em vez de conferir só a lista na memória. Pega erro na gravação também.
- **React + Vite em vez de Next.js** (decidido pelo Victor). Next.js serve para sites com servidor; aqui só adicionaria peso.
- **PWA instalável.** Ícone na tela inicial sem passar por loja de apps, e funciona sem sinal.
- **Bibliotecas e fontes dentro do app**, sem CDN e sem Google Fonts. Se o CDN cair o app continua funcionando, e nenhum site de terceiro fica sabendo quem usa.
- **Motor carregado sob demanda.** O SheetJS e o jsPDF só baixam quando são usados, então a primeira tela abre rápido.
- **Plano gratuito do Spoke aceita só 10 paradas.** Isso pesa no produto: trazer outros apps de rota (Etapa 4) é tão importante quanto o visual.

## 22/10/2026 — Etapa 1 (Setup do repositório)

- **Padrões do Victor adotados**, sem as partes de back-end (API, banco, Docker, OpenAPI). O `docker compose up` foi trocado por `npm run dev` e `make dev`, porque não há serviços para subir.
- **Commits antigos da `main` ficam como estão.** Os 2 primeiros commits têm linhas de atribuição ao Claude; o Victor preferiu não reescrever o histórico.
- **SheetJS 0.20.3 pelo pacote oficial** (`cdn.sheetjs.com`). O pacote `xlsx` do npm parou na 0.18.5, que tem falhas conhecidas (poluição de protótipo e ReDoS ao ler arquivo malicioso). O SheetJS só publica as versões novas no próprio site. A integridade (sha512) está no `package-lock.json`. Descartado: espelhos não oficiais no npm.
- **TypeScript 6.0 em vez de 7.0.** O typescript-eslint ainda não aceita o TypeScript 7.
- **Conventional Commits conferido por um script na própria CI**, sem action de terceiro. Menos uma dependência para fixar e manter.
- **Testes ao lado dos arquivos.** As planilhas de teste inventadas ficam em `src/core/fixtures/`.
