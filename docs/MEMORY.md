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

## 22/10/2026 — Etapa 2 (Segurança)

- **CSP só no build.** O modo de desenvolvimento do Vite usa script inline e conexão com o próprio computador, que a CSP bloquearia. Um plugin pequeno no `vite.config.ts` coloca a `<meta>` só no arquivo publicado, e o teste no navegador roda nessa versão.
- **CSP sem `'unsafe-inline'`.** O app não tem script nem estilo inline (o React aplica `style` pelo JavaScript, que a CSP permite). Mais rígido sem custo.
- **Limite de 5 MB e 5.000 linhas.** A planilha real de um dia (57 pacotes) tem uns 9 KB, então os limites ficam muito acima do uso normal. O limite de linhas existe porque um .xlsx é compactado: um arquivo pequeno pode virar milhões de linhas ao abrir. O tamanho é conferido antes de ler o arquivo; as linhas, durante a leitura.

## 22/10/2026 — Etapa 3 (Teste na rua)

- **Planilha do WhatsApp pelo "Compartilhar".** No primeiro teste, o Victor não conseguiu achar a planilha: o WhatsApp novo guarda os documentos numa pasta só dele, que não aparece no seletor de arquivos. A solução foi o Web Share Target: com o app instalado, o Rota Fácil aparece na lista "Compartilhar" do Android. O pedido é atendido pelo service worker (`public/share-target.js`), dentro do próprio celular. A planilha fica num cache temporário e o app apaga a cópia assim que lê. Descartado: pedir para passar pelo Google Drive, porque dá mais trabalho e manda a planilha para fora do celular.
- **"Abrir com" (File Handling) entrou junto, sem garantia.** Não custa nada declarar, mas não há confirmação de que o Chrome no Android mostra apps web nessa lista. O caminho garantido é o "Compartilhar".
- **iPhone não tem isso.** O Safari não aceita apps web na lista de compartilhar. A Ajuda explica o caminho "Salvar em Arquivos".
- **Cartões sem "Parada N".** O número seguia a ordem da planilha, não a ordem da rota, e o Victor viu que isso confunde o entregador. Quem define a ordem é o app de rota. O PDF do iPhone continua numerado, porque lá é só uma lista para o Spoke ler.
- **Editar o endereço na conferência, não no Spoke.** O pacote às vezes tem o número da casa que a planilha não tem. Corrigir no Spoke passa batido; no Rota Fácil a parada fica marcada "editado por você", o app junta de novo os pacotes, gera o arquivo de novo e refaz a conferência. A conferência compara os números com o que o entregador digitou, em vez da planilha. A edição fica só na memória (nada salvo, nada enviado). Parada com vários pacotes só edita rua e número, porque cada pacote tem o seu complemento. CEP, cidade e ponto no mapa continuam os da planilha.
- **Abreviações expandidas só no começo do nome da rua.** "R. Cel. Fulano 100" e "Rua Coronel Fulano 100" viravam duas paradas para a mesma casa. Agora o tipo (R., Av., Pça, Al., Trav....) e os títulos logo depois (Cel., Mal., Dr., Gen., Ver....) são escritos por extenso. Não mexe no complemento ("Dr. Fulano consultório" depois do número fica igual), nem num título sem nome depois ("Rua Cel 12"). Não gera aviso amarelo, porque abreviação é comum e encheria a tela; a conferência continua garantindo que nenhum número some. Fica na lista `STREET_TYPES` / `NAME_TITLES` em `src/core/address.ts`, para ampliar com uma linha.
- **Parada longe das outras: mais de 15 km do meio da rota e mais de 4 vezes a distância normal.** O meio da rota é a mediana dos pontos, para um ponto errado não puxar o meio para perto dele. Os 15 km evitam aviso para quem atende bairros vizinhos; o "4 vezes" deixa uma rota rural espalhada sem aviso à toa e ainda pega o ponto que caiu em outra cidade. Precisa de pelo menos 3 paradas no mapa para comparar. Ponto fora do Brasil fica só com o aviso dele.
- **Endereço repetido escrito de outro jeito: só sugere, quem junta é o entregador.** Mesmo CEP, mesmo número e nome da rua parecido (um nome cabe inteiro no outro, como "XV" e "XV de Novembro", ou até 2 letras trocadas num nome de 6 letras ou mais). O tipo (Rua, Av.) e "de/da/do" não contam. Juntar automático seria arriscado em cidade pequena, onde um CEP só cobre várias ruas. Juntar usa o mesmo caminho da edição: os pacotes ganham o endereço escolhido, cada um mantém o seu complemento, e o app refaz as paradas, o arquivo e a conferência. "São lugares diferentes" vale só enquanto a planilha está aberta. Sugere o nome mais completo. Fica de fora: "15" e "XV" escritos de jeitos diferentes (número romano).
