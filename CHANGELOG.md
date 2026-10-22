# O que mudou

## 2.2.0 – 2026-10-22

Melhorias que surgiram no começo do teste na rua. Ainda falta testar num Android e num iPhone de verdade.

- As notas do Spoke começam com os 4 últimos números de cada rastreio, os mesmos que aparecem grandes na etiqueta.
- Na conferência dá para achar um pacote digitando o final do rastreio. Se dois pacotes têm o mesmo final, o app mostra os dois e avisa.
- Aviso amarelo quando o ponto no mapa de uma parada está longe das outras (por exemplo, em outra cidade).
- O app sugere juntar paradas do mesmo CEP e número com a rua escrita de outro jeito ("Rua XV 72" e "R. XV de Novembro 72"). O entregador escolhe o endereço que fica ou diz que são lugares diferentes.
- Os testes no navegador da CI rodam numa imagem que já tem o navegador: de uns 5 minutos para 1.
- Abreviações no começo do endereço (R., Av., Pça, Cel., Mal., Dr. e outras) são escritas por extenso. Assim a mesma casa escrita de dois jeitos vira uma parada só.
- A planilha que chegou no WhatsApp abre direto no Rota Fácil: segure a mensagem, toque em Compartilhar e escolha Rota Fácil (Android, com o app instalado).
- Ajuda com o passo a passo para abrir a planilha do WhatsApp no Android e no iPhone.
- Dá para editar o endereço de uma parada na conferência (por exemplo, pôr o número da casa que está no pacote). O app refaz as paradas, o arquivo e a conferência, e marca "editado por você".
- Os cartões das paradas não mostram mais "Parada 1, 2, 3", que era só a ordem da planilha.

## 2.1.0 – 2026-10-22

MVP fechado: pronto para o teste na rua.

- Proteção da página (CSP): o navegador só deixa o app falar com o próprio site, então nenhum dado consegue sair do celular nem por engano.
- Planilha acima de 5 MB ou com mais de 5.000 linhas é recusada com uma mensagem clara, para não travar o celular.
- SheetJS atualizado para a versão oficial 0.20.3, que corrige falhas de segurança na leitura de planilhas.
- Padrões de trabalho do projeto: pasta `docs/`, template de PR, CI com nomes em português, Dependabot, Makefile e ESLint.
- Testes das telas com Testing Library; testes agora ficam ao lado dos arquivos.
- README com prints e roteiro de teste.

## 2.0.0 – 2026-10-22

Primeira versão como projeto profissional (React + Vite).

- Mesmas regras de endereço da versão 1, agora com testes automáticos.
- Telas novas: boas-vindas, início, conferência, ajuda e sobre.
- Botão principal sempre embaixo, ao alcance do polegar.
- Avisos amarelos podem ser marcados como "conferido".
- Os 4 últimos números do rastreio aparecem em destaque, como na etiqueta.
- No iPhone, o botão de PDF aparece primeiro; no Android, o da planilha.
- Instalável no celular e funciona sem internet.
- Lembra a transportadora e o app de rota usados da última vez.
- Fontes e bibliotecas vão dentro do app: nenhum acesso a sites de terceiros.

## 1.0.0 – 2026-10-22

Versão inicial em um arquivo HTML único.
