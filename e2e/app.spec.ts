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
