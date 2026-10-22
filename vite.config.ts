import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// No GitHub Pages o site fica em /rota-facil/. O workflow de publicação define BASE_PATH.
const base = process.env.BASE_PATH ?? '/';

// Regras de segurança da página (Content Security Policy). O GitHub Pages não deixa configurar
// cabeçalhos, então elas vão numa <meta> do index.html. Só entram no build: o modo de
// desenvolvimento do Vite usa script inline e conexão com o próprio computador.
// connect-src 'self' garante que a página não consegue mandar nada para outro site.
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const SHEET_TYPES = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

function contentSecurityPolicy(): Plugin {
  return {
    name: 'rota-facil-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
  };
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    contentSecurityPolicy(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rota Fácil',
        short_name: 'Rota Fácil',
        description: 'Transforma a planilha de entregas do dia num arquivo pronto para o app de rotas. Tudo no seu celular.',
        lang: 'pt-BR',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#eef2ee',
        theme_color: '#0a6a4e',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Rota Fácil na lista "Compartilhar" do Android (com o app instalado).
        // O pedido é atendido por public/share-target.js, dentro do celular.
        share_target: {
          action: `${base}compartilhar`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: { files: [{ name: 'planilha', accept: [...SHEET_TYPES, '.xlsx', '.xls'] }] },
        },
        // "Abrir com" nos sistemas que aceitam apps web para abrir arquivos.
        file_handlers: [
          { action: base, accept: { [SHEET_TYPES[0]]: ['.xlsx'], [SHEET_TYPES[1]]: ['.xls'] } },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], importScripts: ['share-target.js'] },
    }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
  },
});
