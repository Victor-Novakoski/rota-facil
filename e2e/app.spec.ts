import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';

const FIXTURE = 'src/core/fixtures/exemplo-imile-ficticio.xlsx';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pular' }).click();
});

test('converte a planilha de exemplo e baixa o arquivo do Spoke', async ({ page }) => {
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  await expect(page.locator('.tile').nth(1)).toContainText('8');
  await expect(page.locator('.tile').nth(2)).toContainText('5');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^Rota Spoke \d{4}-\d{2}-\d{2}\.xlsx$/);
  const wb = XLSX.read(readFileSync(await download.path()));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  expect(rows).toHaveLength(9);
  expect(rows[0]).toEqual(['Address Line 1', 'Address Line 2', 'City', 'State', 'Zip/Postal Code', 'Country', 'Latitude', 'Longitude', 'Packages', 'Notes']);

  const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Gerar PDF para iPhone/ }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
});

test('marcar aviso como conferido diminui a contagem', async ({ page }) => {
  await page.getByRole('button', { name: 'Ver como funciona com um exemplo' }).click();
  await expect(page.getByText('Isto é um EXEMPLO')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como conferido' }).first().click();
  await expect(page.locator('.tile').nth(2)).toContainText('4');
});

test('editar o endereço refaz a conferência e o arquivo baixado já sai com o número', async ({ page }) => {
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  await expect(page.getByText(/Parada \d/)).toHaveCount(0);

  const card = page.locator('.stop').filter({ hasText: 'Rua dos Testes' }).first();
  await card.getByRole('button', { name: 'Editar endereço' }).click();
  // durante a edição o endereço fica dentro do campo, então o cartão é achado pelo formulário
  const form = page.locator('.stop-edit');
  await form.getByLabel('Rua e número').fill('Rua dos Testes, 50');
  await form.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('.stop').filter({ hasText: 'Rua dos Testes, 50' }).first()).toContainText('editado por você');
  await expect(page.locator('.tile').nth(2)).toContainText('4');
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  const wb = XLSX.read(readFileSync(await download.path()));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  expect(rows).toHaveLength(9);
  expect(rows.map((r) => r[0])).toContain('Rua dos Testes, 50');
});

test('planilha errada mostra as colunas que faltam', async ({ page }) => {
  const ws = XLSX.utils.aoa_to_sheet([['Waybill No', 'Endereco'], ['1', 'x']]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  await page.locator('#file').setInputFiles({ name: 'errada.xlsx', mimeType: 'application/octet-stream', buffer });
  await expect(page.getByText('Não deu para usar essa planilha')).toBeVisible();
  await expect(page.getByText('Consignee Address')).toBeVisible();
});

test('arquivo que não é planilha mostra erro amigável', async ({ page }) => {
  await page.locator('#file').setInputFiles({ name: 'foto.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('isso não é uma planilha') });
  await expect(page.getByText('Não deu para usar essa planilha')).toBeVisible();
});

test('regras de segurança da página: nada bloqueado no uso normal e nenhum envio para outro site', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { violations: string[] }).violations.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto('/');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /connect-src 'self'/);
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Gerar PDF para iPhone/ }).click()]);
  expect(await page.evaluate(() => (window as unknown as { violations: string[] }).violations)).toEqual([]);

  // Uma tentativa de mandar dados para fora é barrada pelo navegador
  const sent = await page.evaluate(() => fetch('https://example.com/', { method: 'POST', body: 'teste' }).then(() => 'enviado', () => 'bloqueado'));
  expect(sent).toBe('bloqueado');
  await expect.poll(() => page.evaluate(() => (window as unknown as { violations: string[] }).violations)).toEqual(['connect-src https://example.com/']);
});

test('arquivo grande demais é recusado', async ({ page }) => {
  await page.locator('#file').setInputFiles({ name: 'enorme.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.alloc(6 * 1024 * 1024) });
  await expect(page.getByText(/grande demais \(6 MB\)/)).toBeVisible();
});

test('planilha compartilhada pelo celular (ex.: WhatsApp) abre direto no app', async ({ page }) => {
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.share_target).toMatchObject({ action: '/compartilhar', method: 'POST', enctype: 'multipart/form-data' });

  // espera o service worker assumir a página, como no app instalado
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });

  // o Android manda a planilha do mesmo jeito: um POST com o arquivo
  const bytes = [...readFileSync(FIXTURE)];
  const landed = await page.evaluate(async (data) => {
    const form = new FormData();
    form.append('planilha', new File([new Uint8Array(data)], 'Entregas.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const res = await fetch('/compartilhar', { method: 'POST', body: form });
    return res.url;
  }, bytes);
  expect(landed).toMatch(/\/\?compartilhado=1$/);

  await page.goto(landed);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  expect(new URL(page.url()).search).toBe('');
  // a cópia temporária foi apagada
  expect(await page.evaluate(async () => (await (await caches.open('rota-facil-compartilhado')).keys()).length)).toBe(0);
});
