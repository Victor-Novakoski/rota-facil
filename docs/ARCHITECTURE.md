# Arquitetura – Rota Fácil

Tudo roda no navegador do celular. Não existe servidor nem banco de dados. O GitHub Pages só entrega os arquivos do app; a planilha nunca sai do aparelho.

## Fluxo

```
Planilha .xlsx da base
        │  (escolhida pelo entregador, lida no próprio celular)
        ▼
src/core/limits.ts        recusa arquivo acima de 5 MB ou com mais de 5.000 linhas
        ▼
src/core/spreadsheet.ts   lê as abas (SheetJS)
        ▼
src/core/read.ts          acha o cabeçalho do perfil da transportadora
                          e transforma cada linha em pacote
        ▼
src/core/address.ts       limpa o endereço: rua + número | complemento
        ▼
src/core/group.ts         junta pacotes com o mesmo endereço + CEP
                          e calcula os avisos; as notas começam pelos
                          4 últimos dígitos de cada rastreio
                          (src/core/edit.ts: se o entregador editar um endereço
                          na tela, os pacotes mudam e tudo daqui para baixo roda de novo)
        ▼
src/core/far.ts           aviso da parada com o ponto no mapa longe das outras
src/core/duplicates.ts    acha paradas do mesmo CEP e número com a rua escrita
                          diferente; juntar usa o mesmo caminho da edição
src/core/search.ts        acha a parada pelo final do rastreio (busca da conferência)
        ▼
src/core/index.ts         monta o arquivo com o perfil do app de rota
        ▼
src/core/verify.ts        relê o arquivo gerado e compara com a entrada
        │                 ── se não bater, o download fica bloqueado
        ▼
Download: .xlsx (Android) ou PDF (iPhone, src/core/pdf.ts)
```

## Stack

| Parte | Escolha |
| --- | --- |
| Linguagem | TypeScript (estrito) |
| Tela | React 19 |
| Build | Vite |
| App instalável e sem internet | vite-plugin-pwa (Workbox) |
| Ler e gravar planilha | SheetJS 0.20.3 (pacote oficial) |
| PDF | jsPDF |
| Fontes | Atkinson Hyperlegible e Barlow Condensed, dentro do app (Fontsource) |
| Testes | Vitest + Testing Library; Playwright no navegador |
| Lint | ESLint com typescript-eslint (`--max-warnings=0`) |
| Hospedagem | GitHub Pages |
| CI | GitHub Actions |

## Pastas

| Pasta | Papel |
| --- | --- |
| `src/core/` | O motor. Regras de endereço, agrupamento, conferência e geração dos arquivos. Não sabe nada de tela. |
| `src/core/carriers/` | Um perfil por transportadora: nome e colunas da planilha. |
| `src/core/route-apps/` | Um perfil por app de rota: cabeçalhos, montagem de cada linha, nome do arquivo e passo a passo. |
| `src/core/fixtures/` | Planilhas de teste com dados inventados. |
| `src/ui/` | Telas e componentes React. Usa o motor; nunca lê planilha direto. |
| `src/ui/screens/` | Uma tela por arquivo: Onboarding, Home, Review, Help, About. |
| `src/ui/components/` | Peças reaproveitadas: ícones, faixa de conferência, cartão de parada. |
| `src/ui/navigation.ts` | Liga as telas ao histórico do navegador (botão voltar do celular). |
| `src/ui/shared.ts` + `public/share-target.js` | Planilha que chega pelo "Compartilhar" do Android: o service worker guarda num cache temporário e o app lê e apaga. |
| `e2e/` | Testes no navegador (Playwright). |
| `public/` | Ícones do app. |
| `scripts/` | Utilitários (gerar ícones). |
| `docs/` | Documentação do projeto. |

O motor (`src/core/index.ts`) é carregado só quando o entregador abre uma planilha, e o jsPDF só quando ele pede o PDF. Assim a primeira tela abre rápido.

## Telas

Não há rotas de URL; o app troca de tela por estado. Cada troca de tela também vira uma entrada no histórico do navegador (`src/ui/navigation.ts`, sem mudar o endereço), para o voltar do celular trocar de tela em vez de fechar o app. Ajuda e Sobre trocam entre si sem empilhar, e o início fica sempre na primeira entrada: voltar do início fecha o app.

| Tela | Arquivo | Quando aparece |
| --- | --- | --- |
| Boas-vindas | `screens/Onboarding.tsx` | Só na primeira abertura (lembrado no `localStorage`) |
| Início | `screens/Home.tsx` | Ao abrir; botão "Abrir planilha do dia" |
| Conferência | `screens/Review.tsx` | Depois de ler a planilha; botões de download embaixo |
| Ajuda | `screens/Help.tsx` | Botão "Ajuda" no topo |
| Sobre | `screens/About.tsx` | Botão "Sobre" no topo |

## Perfis

Adicionar uma transportadora ou um app de rota é criar um perfil novo. O motor não muda.

- `CarrierProfile` (`src/core/types.ts`): `id`, `name`, `compat` e `columns` (campo interno → cabeçalho exato na planilha).
- `RouteAppProfile`: `headers`, `toRow(stop)`, `cols` (usado na conferência), `sheetFileName`, `pdfFileName` opcional, `freeStopLimit` opcional e `howTo`.
