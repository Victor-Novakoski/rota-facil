.DEFAULT_GOAL := help
.PHONY: help setup dev test test-e2e lint build preview icons

help: ## Mostra os comandos disponíveis
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

setup: ## Instala as dependências
	npm ci

dev: ## Abre o app em modo de desenvolvimento (http://localhost:5173)
	npm run dev

test: ## Testes do motor e das telas (Vitest)
	npm test

test-e2e: ## Testes no navegador (Playwright)
	npm run test:e2e

lint: ## ESLint sem warnings e checagem de tipos
	npm run lint
	npm run typecheck

build: ## Gera o site em dist/
	npm run build

preview: ## Serve o build de dist/ localmente
	npm run preview

icons: ## Gera os ícones PNG a partir de public/favicon.svg
	node scripts/make-icons.mjs
