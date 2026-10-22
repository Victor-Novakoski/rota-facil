# Rota Fácil

App web gratuito para entregadores de última milha. Ele abre a planilha de entregas do dia que a base manda, arruma os endereços, junta os pacotes do mesmo lugar e gera o arquivo para importar no app de rotas.

- Compatível com planilhas da iMile.
- Gera arquivo para importar no Spoke (planilha no Android, lista em PDF no iPhone).
- Instalável no celular e funciona sem internet depois da primeira abertura.

O Rota Fácil é independente e não tem ligação com a iMile, com o Spoke nem com nenhuma transportadora.

## Privacidade

Tudo roda no navegador do celular. Não existe servidor, cadastro nem analytics. A planilha nunca sai do aparelho (LGPD).

## Como o código está organizado

```
src/core/             o "motor": regras de endereço, agrupamento e conferência (sem tela)
  address.ts          limpeza do endereço (regras 3.1 a 3.7 da referência técnica)
  group.ts            junta pacotes do mesmo endereço + avisos
  verify.ts           conferência obrigatória do arquivo gerado
  carriers/           um arquivo por transportadora
  route-apps/         um arquivo por app de rota
src/ui/               as telas (React)
tests/                testes do motor (Vitest)
e2e/                  testes no navegador (Playwright)
```

### Adicionar uma transportadora

1. Crie `src/core/carriers/<nome>.ts` com o nome e as colunas da planilha dela (veja `imile.ts`).
2. Coloque na lista em `src/core/carriers/index.ts`.
3. Adicione uma planilha de exemplo **inventada** em `tests/fixtures/` e um teste.

### Adicionar um app de rota

1. Crie `src/core/route-apps/<nome>.ts` com os cabeçalhos, a montagem de cada linha e o passo a passo (veja `spoke.ts`).
2. Coloque na lista em `src/core/route-apps/index.ts`.

## Desenvolvimento

Precisa de Node 20 ou mais novo.

```bash
npm install
npm run dev          # abre o app em modo de desenvolvimento
npm test             # testes do motor
npm run test:e2e     # testes no navegador
npm run build        # gera o site em dist/
```

Para testar com uma planilha real **sem colocá-la no repositório**:

```bash
REAL_SHEET="/caminho/da/planilha.xlsx" REAL_EXPECT="57/46" npm test
```

Planilhas reais têm endereços de clientes e **nunca** devem ser enviadas para o GitHub. O `.gitignore` bloqueia arquivos `.xlsx` fora de `tests/fixtures/`.

## Publicação

Cada mudança na branch `main` passa pelos testes e é publicada no GitHub Pages pelo workflow `.github/workflows/deploy.yml`.

O que mudou em cada versão está no [CHANGELOG](CHANGELOG.md).
