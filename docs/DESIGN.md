# Design – Rota Fácil

O app é usado na rua, com uma mão, muitas vezes no sol. Tudo parte daí: alto contraste, letra grande, botão principal sempre embaixo, uma tarefa por tela.

## Cores

Definidas como variáveis em `src/ui/styles.css`, com versão clara e escura (segue o modo do celular).

| Variável | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--bg` | `#eef2ee` | `#0e1412` | Fundo |
| `--surface` | `#ffffff` | `#17201c` | Cartões e barra de ações |
| `--ink` | `#111a16` | `#eef3ef` | Texto |
| `--muted` | `#4f5d56` | `#a3b3ab` | Texto secundário |
| `--go` | `#0a6a4e` | `#34b787` | Ação principal, marca |
| `--warn-bg` / `--warn-line` | `#fff0a0` / `#c99700` | `#3b3109` / `#e0b73a` | Avisos em amarelo |
| `--bad-bg` / `--bad-line` | `#fde1dd` / `#c4321f` | `#3d1612` / `#ff8a7a` | Erro e conferência que falhou |
| `--ok-bg` / `--ok-line` | `#d8f2e4` / `#1f8a5f` | `#0f3122` / `#4fd19c` | Conferência ok e privacidade |
| `--info-bg` | `#e2ebf6` | `#13263c` | Exemplo e avisos informativos |

Amarelo, vermelho e verde são estados, não decoração: amarelo pede atenção, vermelho bloqueia, verde confirma.

## Tipografia

| Papel | Fonte | Por quê |
| --- | --- | --- |
| Títulos, números e botões | Barlow Condensed 600/700 | Condensada e firme, inspirada em placas de trânsito; números grandes cabem em pouco espaço |
| Texto | Atkinson Hyperlegible 400/700 | Feita para leitura difícil: letras bem diferentes entre si (1, l, I; 0, O) |

As fontes vão dentro do app. Nenhuma requisição ao Google Fonts.

## Componentes base

| Componente | Onde | Regra |
| --- | --- | --- |
| Botão principal (`.btn`) | Barra de ações embaixo | Pelo menos 64 px de altura; um por tela |
| Botão secundário (`.btn.secondary`) | Barra de ações | Contorno, 52 px |
| Faixa de conferência (`Banner`) | Topo da conferência | Verde quando passou, vermelha quando bloqueou |
| Números (`.tile`) | Conferência | Pacotes, paradas e avisos pendentes; avisos ficam amarelos se houver algum |
| Cartão de parada (`StopCard`) | Conferência | Endereço em negrito, complemento, avisos, rastreios com os 4 últimos números em destaque (iguais aos da etiqueta) |
| Barra de ações (`.actionbar`) | Fixa embaixo | Respeita a área segura do celular |

## Acessibilidade

- Alvos de toque com pelo menos 44 px.
- Foco visível em todos os controles (contorno amarelo de 3 px).
- Estado de "conferido" com `aria-pressed`; faixa de erro com `role="alert"`.
- Ícones decorativos com `aria-hidden`.
- Respeita "reduzir movimento" do sistema.
- Textos em português simples, sem termos técnicos.
