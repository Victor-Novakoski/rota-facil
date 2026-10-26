# PRD – Rota Fácil

## Problema

Entregadores de última milha (iMile e outras transportadoras) usam apps de rota como o Spoke. A etiqueta do pacote só tem o rastreio no código de barras e no QR, sem endereço, então o app de rota não consegue ler. A base manda uma planilha com as entregas do dia, mas digitar 40 a 60 endereços na mão leva muito tempo, e os endereços vêm bagunçados (número repetido, complemento antes do número, vírgulas, rua sem número).

## Solução

Um app web, gratuito e instalável no celular, que:

1. Abre a planilha do dia que a base mandou.
2. Limpa os endereços com regras testadas (rua, número e complemento separados; nomes de rua conhecidos corrigidos).
3. Junta os pacotes do mesmo endereço numa parada só, com todos os rastreios nas notas.
4. Confere que nenhum pacote se perdeu.
5. Gera o arquivo no formato que o app de rota importa.

Tudo roda no próprio celular. Nenhum endereço ou rastreio sai do aparelho.

## Público

| Papel | Quem é | O que precisa |
| --- | --- | --- |
| Entregador (motorista ou motoboy) | Usa no celular, na rua, com uma mão e no sol | Converter a planilha em 1 minuto e confiar que nenhum pacote ficou de fora |
| Mantenedor | Victor | Adicionar transportadoras, apps de rota e correções de rua sem reescrever o app |

## Funcionalidades

| Funcionalidade | Situação |
| --- | --- |
| Ler planilha .xlsx da iMile | ✅ feito |
| Limpar endereço (regras 3.1 a 3.7 da referência técnica) | ✅ feito |
| Agrupar pacotes por endereço + CEP | ✅ feito |
| Arquivo do app de rota sem latitude e longitude, para o app achar a parada pelo endereço (que o entregador pode corrigir) | ✅ feito |
| Avisos em amarelo (sem número, dois números seguidos, endereço corrigido, faixa do CEP colada na rua) | ✅ feito |
| Marcar aviso como conferido | ✅ feito |
| Expandir abreviações no começo do nome da rua (R., Av., Pça, Cel., Mal., Dr....), para juntar a mesma casa escrita de jeitos diferentes | ✅ feito |
| Editar o endereço de uma parada na conferência (ex.: número da casa que está no pacote e não na planilha) | ✅ feito |
| Aviso quando a localização da planilha está longe das outras paradas (ex.: endereço de outra cidade) | ✅ feito |
| Sugerir juntar paradas do mesmo CEP e número com a rua escrita diferente ("Rua XV 72" e "R. XV de Novembro 72"), com confirmação do entregador | ✅ feito |
| Cartões das paradas sem "Parada N" (o número era só a ordem da planilha, não da rota) | ✅ feito |
| Notas do app de rota começando pelos 4 últimos dígitos de cada rastreio (o número grande da etiqueta) | ✅ feito |
| Achar o pacote na conferência digitando o final do rastreio, avisando quando dois pacotes têm o mesmo final | ✅ feito |
| Conferência obrigatória antes de liberar o arquivo | ✅ feito |
| Arquivo para o Spoke no Android (.xlsx) | ✅ feito |
| PDF para o "Import route manifest" do Spoke no iPhone | 🟡 parcial (gerado, ainda não testado no Spoke) |
| Passo a passo de importação no app | ✅ feito |
| Abrir a planilha direto do WhatsApp pelo "Compartilhar" do Android | 🟡 parcial (feito e testado no navegador, falta testar num Android de verdade) |
| Erro amigável com as colunas que faltam | ✅ feito |
| Instalar na tela inicial e usar sem internet | 🟡 parcial (feito, ainda não testado em celular de verdade) |
| Publicação no GitHub Pages | 🟡 parcial (ligado e publicado, falta conferir no celular) |
| Botão "Avisar um problema" pelo WhatsApp | 💭 a decidir (falta o número) |
| Outros apps de rota (Circuit, Google Maps ou outro) | 💭 a decidir (pesquisar quais aceitam 40+ paradas) |
| Outras transportadoras (Loggi, J&T, Shopee, Mercado Envios) | 💭 a decidir (precisa de planilha de exemplo de cada uma) |
| Modo carregamento (ler o código de barras e mostrar "parada 12 de 46") | 💭 a decidir |
| Mapa de conferência dos pontos | 💭 a decidir |
| Lista de correções de rua que cresce com o uso | 💭 a decidir |

## Fora do escopo por enquanto

- Servidor, cadastro, login ou qualquer dado guardado fora do celular.
- Analytics. Se um dia entrar, será só contagem de acessos, sem conteúdo.
- App nas lojas (Play Store e App Store). O app é instalado pelo navegador.
- Otimizar a rota. Isso é trabalho do app de rota.
