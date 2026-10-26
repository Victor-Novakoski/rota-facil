# TASKS – Rota Fácil

**Etapa atual: 3 — Teste na rua**

Só se trabalha na etapa atual. O que surgir no caminho entra aqui antes de ser feito.

## Etapa 0 — Base

- [x] Versão 1 em HTML único, testada com a planilha de exemplo (10 pacotes, 8 paradas) e com uma planilha real (57 pacotes, 46 paradas)
- [x] Plano de produto ("Rota Fácil como produto") com a decisão por React + Vite sem servidor
- [x] Versão 2.0 em React + TypeScript + Vite, instalável e sem internet (PR #2)

## Etapa 1 — Setup do repositório

- [x] Branch `develop` criada a partir da `main`
- [x] Pasta `docs/` (PRD, TASKS, ARCHITECTURE, DESIGN, RULES, SECURITY, MEMORY)
- [x] Template de PR
- [x] CI com jobs em português e actions fixadas por SHA: Lint, tipos e build; Testes; Testes no navegador; Dependências; Segredos; Conventional Commits; PR para a main só da develop
- [x] Dependabot semanal (npm e GitHub Actions)
- [x] Makefile com `help`
- [x] ESLint sem warnings
- [x] Testes ao lado dos arquivos, com Testing Library nas telas
- [x] README no formato vitrine, com prints feitos com dados inventados
- [x] SheetJS atualizado para 0.20.3 (pacote oficial), sem alertas no `npm audit`
- [x] Testes no navegador da CI mais rápidos: imagem oficial do Playwright, que já tem o Chromium (antes levava uns 4 minutos só instalando)
- [x] Victor: ruleset das branches `main` e `develop` (ativo desde 22/10, conferido pelo GitHub em 26/10)
- [ ] Victor: conferir se a exclusão automática de branches está ligada (Settings → General → Automatically delete head branches)

## Etapa 2 — Segurança (v2.1.0)

- [x] Content Security Policy por `<meta>` no `index.html` (o GitHub Pages não deixa configurar cabeçalhos)
- [x] Limite de tamanho da planilha antes de ler (evitar travar o celular com arquivo enorme)
- [x] Limite de linhas por aba (um arquivo pequeno pode esconder muitas linhas compactadas)
- [x] Teste no navegador: nada bloqueado no uso normal e envio para outro site barrado
- [x] Revisar SECURITY.md e marcar o que muda

## Etapa 3 — Teste na rua (v2.2)

- [ ] Testar num Android de verdade: abrir, instalar na tela inicial, converter e importar no Spoke
- [ ] Testar num iPhone: PDF no "Import route manifest" do Spoke
- [ ] Uma semana de uso com o irmão do Victor e mais 3 a 5 entregadores
- [x] Abrir a planilha direto do WhatsApp: o Rota Fácil aparece no "Compartilhar" do Android (o WhatsApp novo não mostra os documentos no seletor de arquivos)
- [ ] Conferir num Android de verdade: compartilhar a planilha do WhatsApp com o Rota Fácil instalado
- [ ] Corrigir o que aparecer, cada correção com teste
- [x] Expandir abreviações no começo do nome da rua (R., Av., Pça, Cel., Mal., Dr....), sem mexer no complemento, para não separar a mesma casa em duas paradas
- [x] Tirar o "Parada N" dos cartões da conferência: o número era a ordem da planilha e confundia com a ordem da rota (o PDF continua numerado)
- [x] Editar o endereço de uma parada na conferência, para pôr o número da casa que está no pacote e não na planilha; refaz o agrupamento, o arquivo e a conferência, e marca "editado por você". Só na memória
- [x] Notas do Spoke começam pelos 4 últimos dígitos de cada rastreio ("0011, 0022 | 2 PACOTES: ..."), sem tirar o rastreio inteiro que a conferência usa
- [x] Busca na conferência pelo final do rastreio: mostra rua e complemento da parada; se dois pacotes têm o mesmo final, mostra os dois e avisa
- [x] Aviso amarelo quando o ponto no mapa de uma parada está longe das outras (mais de 15 km e 4 vezes mais longe que o normal da rota)
- [x] Sugerir juntar paradas do mesmo CEP e número com a rua escrita de outro jeito; o entregador escolhe o endereço que fica ou diz que são lugares diferentes
- [x] Botão voltar do Android troca de tela (Ajuda, Sobre, conferência → início) em vez de fechar o app, sem perder a planilha aberta
- [x] Teste na rua (24/10): tirar a faixa de números do CEP colada na rua ("- de 1001/1002 a 2999/3000") e avisar em amarelo para conferir o número
- [x] Teste na rua (24/10): nome do prédio entre parênteses sai da rua e vai para o complemento; endereço editado ganha a vírgula antes do número
- [x] Teste na rua (24/10): pacotes sem número na mesma rua e CEP só viram uma parada se o ponto no mapa também for o mesmo
- [x] Revisão final (24/10): rua com número no nome ("Rua 7, 100", "Rodovia SC 401 5000", "BR 116 km 30") não junta casas diferentes numa parada só
- [x] Revisão final (24/10): telefone ou CEP escrito no complemento e rastreio com letras não travam mais a conferência
- [x] Victor (25/10): tirar Latitude e Longitude do arquivo do Spoke, que dava preferência ao ponto da planilha e ignorava o endereço corrigido; o aviso "Sem localização" sai
- [x] Victor (26/10): aviso amarelo quando o endereço tem dois números seguidos sem "apto", "sala"... ("Rua X 1807 464"), para conferir qual é o número da casa
- [x] Revisão final, item 10: a Ajuda explica todos os avisos (faixa do CEP, CEP estranho, ponto longe, fora do Brasil, pode ser o mesmo endereço, dois números), gerada de uma lista só
- [x] Revisão final, item 4: testes que estragam o arquivo de propósito (cidade, estado, cabeçalho, rastreio repetido, quantidade de pacotes, número digitado perdido)
- [x] Revisão final, item 7: PDF do iPhone depois de atualizar o app (carregar o PDF quando a conferência abre; mensagem para fechar e abrir se falhar)
- [x] Marcas "Conferido" e "lugares diferentes" não podem sumir ao abrir a Ajuda e voltar (bug achado em 26/10)
- [x] Revisão final, item 6: desfazer depois de juntar paradas, "São lugares diferentes" e editar
- [x] Victor (26/10): guardar a conferência no celular até o fim do dia, para não perder as edições se a página recarregar; sem "puxar para recarregar"
- [x] Revisão final, item 5: "Voltar para a conferência" no início; perguntar antes de perder edições ao abrir outra planilha ou trocar transportadora/app
- [ ] Revisão final, itens 9 e 11: lista de avisos mais curta e "Como importar" depois de baixar
- [ ] No próximo teste: conferir se o Spoke acha bem as paradas só pelo endereço, e se as paradas com parênteses e as editadas aparecem com número
- [ ] Definir o número do WhatsApp para "Avisar um problema"

## Etapa 4 — Outros apps de rota (v2.3)

- [ ] Pesquisar quais apps de rota aceitam 40+ paradas de graça ou barato
- [ ] Perfil do primeiro app escolhido em `src/core/route-apps/`

## Etapa 5 — Outras transportadoras (v2.4)

- [ ] Conseguir planilhas de exemplo (com dados inventados) da Loggi, J&T, Shopee e Mercado Envios
- [ ] Um perfil por transportadora em `src/core/carriers/`

## Etapa 6 — Modo carregamento e mapa (v3)

- [ ] Ler o código de barras com a câmera e mostrar "parada 12 de 46 – endereço"
- [ ] Mapa de conferência dos pontos antes de importar

## Deploy

- [x] Workflow de publicação no GitHub Pages a cada merge na `main`
- [x] GitHub Pages ligado (a publicação da `main` rodou com sucesso em 22/10)
- [ ] Primeira publicação conferida no celular
