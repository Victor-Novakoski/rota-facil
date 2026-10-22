// Gera os ícones PNG do app a partir do desenho em public/favicon.svg.
// Uso: node scripts/make-icons.mjs   (precisa do Chromium do Playwright)
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();

async function render(file, size, { padded = false, rounded = true } = {}) {
  await page.setViewportSize({ width: size, height: size });
  const inner = padded ? Math.round(size * 0.7) : size;
  const body = rounded ? svg : svg.replace('rx="12"', 'rx="0"');
  await page.setContent(
    `<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:#0a6a4e">` +
      `<div style="width:${inner}px;height:${inner}px">${body.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: `public/${file}`, omitBackground: false });
}

await render('icon-192.png', 192, { rounded: false });
await render('icon-512.png', 512, { rounded: false });
await render('icon-maskable-512.png', 512, { padded: true, rounded: false });
await render('apple-touch-icon.png', 180, { rounded: false });
await browser.close();
console.log('Ícones gerados em public/');
