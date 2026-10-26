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
  await expect(page.locator('.tile').nth(2)).toContainText('4');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^Rota Spoke \d{4}-\d{2}-\d{2}\.xlsx$/);
  const wb = XLSX.read(readFileSync(await download.path()));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  expect(rows).toHaveLength(9);
  expect(rows[0]).toEqual(['Address Line 1', 'Address Line 2', 'City', 'State', 'Zip/Postal Code', 'Country', 'Packages', 'Notes']);

  const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Gerar PDF para iPhone/ }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
});

test('o voltar do celular troca de tela em vez de fechar o app', async ({ page }) => {
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  await page.getByRole('button', { name: 'Ajuda' }).click();
  await page.getByRole('button', { name: 'Sobre' }).click();
  await page.goBack();
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: /Abrir planilha do dia/ })).toBeVisible();
  // a planilha nova entra normalmente depois de voltar
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
});

test('marcar aviso como conferido diminui a contagem', async ({ page }) => {
  await page.getByRole('button', { name: 'Ver como funciona com um exemplo' }).click();
  await expect(page.getByText('Isto é um EXEMPLO')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como conferido' }).first().click();
  await expect(page.locator('.tile').nth(2)).toContainText('3');
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
  await expect(page.locator('.tile').nth(2)).toContainText('3');
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  const wb = XLSX.read(readFileSync(await download.path()));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  expect(rows).toHaveLength(9);
  expect(rows.map((r) => r[0])).toContain('Rua dos Testes, 50');
});

test('as notas começam pelo final do rastreio e a busca acha a parada', async ({ page }) => {
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();

  const search = page.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
  await search.getByRole('searchbox').fill('0022');
  await expect(search.locator('.stop')).toHaveCount(1);
  await expect(search.locator('.stop')).toContainText('Rua das Flores, 120');
  await expect(search.locator('.found')).toHaveText('3320000000022');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  const wb = XLSX.read(readFileSync(await download.path()));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  expect(String(rows[1][7])).toMatch(/^0011, 0022, 0033 \| 3 PACOTES: /);
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

test('avisa a parada longe das outras e junta o mesmo endereço escrito de dois jeitos', async ({ page }) => {
  // planilha de exemplo + 3 entregas inventadas: uma com o ponto em outra cidade e duas na mesma casa
  const wb0 = XLSX.read(readFileSync(FIXTURE));
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb0.Sheets[wb0.SheetNames[0]], { header: 1 });
  const head = rows[0] as string[];
  const extra = (waybill: string, zip: string, address: string, lat: string, lon: string) =>
    head.map((h) => ({ 'Waybill No': waybill, 'Consignee Zip Code': zip, 'Consignee Province': 'Paraná', 'Consignee City': 'Curitiba', 'Consignee Area': 'Centro', 'Consignee Address': address, 'Consignee Latitude': lat, 'Consignee Longitude': lon })[h] ?? 'EXEMPLO');
  const ws = XLSX.utils.aoa_to_sheet([
    ...rows,
    extra('3320000000301', '80000-020', 'Rua XV 72 casa 2', '-25.43700', '-49.27700'),
    extra('3320000000302', '80000-020', 'R. XV de Novembro 72 apto 3', '-25.43700', '-49.27700'),
    extra('3320000000303', '80000-030', 'Rua Longe Demais 5', '-23.55000', '-46.63000'),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  await page.locator('#file').setInputFiles({ name: 'exemplo-avisos.xlsx', mimeType: 'application/octet-stream', buffer });

  await expect(page.getByText('Conferido: 13 pacotes, nenhum perdido')).toBeVisible();
  await expect(page.locator('.tile').nth(1)).toContainText('11');
  await expect(page.locator('.tile').nth(2)).toContainText('6');
  await expect(page.locator('.stop').filter({ hasText: 'Rua Longe Demais, 5' }).first()).toContainText('A localização da planilha está longe das outras paradas (uns 340 km)');
  await expect(page.getByRole('radio', { name: /Rua XV de Novembro, 72/ })).toBeChecked();
  if (process.env.SHOTS) {
    await page.getByRole('heading', { name: 'Pode ser o mesmo endereço' }).evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `${process.env.SHOTS}/1-sugestao.png` });
    await page.getByText('Rua Longe Demais, 5').first().evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${process.env.SHOTS}/2-longe.png` });
  }

  await page.getByRole('button', { name: 'Juntar numa parada' }).click();
  await expect(page.getByRole('heading', { name: 'Pode ser o mesmo endereço' })).toHaveCount(0);
  await expect(page.locator('.tile').nth(1)).toContainText('10');
  await expect(page.locator('.tile').nth(2)).toContainText('5');
  await expect(page.getByText('Conferido: 13 pacotes, nenhum perdido')).toBeVisible();
  if (process.env.SHOTS) {
    await page.locator('.stop').filter({ hasText: 'Rua XV de Novembro, 72' }).first().evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${process.env.SHOTS}/3-juntado.png` });
  }

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  const out = XLSX.read(readFileSync(await download.path()));
  const outRows = XLSX.utils.sheet_to_json<unknown[]>(out.Sheets[out.SheetNames[0]], { header: 1 });
  expect(outRows).toHaveLength(11);
  const merged = outRows.find((r) => r[0] === 'Rua XV de Novembro, 72');
  expect(merged?.[6]).toBe(2);
});

test('tira a faixa de números do CEP do endereço e avisa para conferir o número', async ({ page }) => {
  // entregas inventadas no formato que apareceu no teste na rua
  const head = ['Waybill No', 'Consignee Zip Code', 'Consignee Province', 'Consignee City', 'Consignee Area', 'Consignee Address', 'Delivery Associate', 'Consignee Longitude', 'Consignee Latitude'];
  const row = (waybill: string, address: string) => [waybill, '80000-040', 'Paraná', 'Curitiba', 'Centro', address, 'EXEMPLO', '-49.27000', '-25.43000'];
  const ws = XLSX.utils.aoa_to_sheet([
    head,
    row('49600000000901', 'Avenida Inventada- de 1001/1002 a 2999/3000 Apto 1305 2500'),
    row('3320000000902', 'Rua Exemplo (Torre Azul) 117 Ap 1020'),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  await page.locator('#file').setInputFiles({ name: 'exemplo-faixa.xlsx', mimeType: 'application/octet-stream', buffer });

  await expect(page.getByText('Conferido: 2 pacotes, nenhum perdido')).toBeVisible();
  const stop = page.locator('.stop').filter({ hasText: 'Avenida Inventada, 2500' }).first();
  await expect(stop).toContainText('faixa de números do CEP');
  if (process.env.SHOTS) {
    await stop.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${process.env.SHOTS}/1-faixa-do-cep.png` });
  }

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Baixar para o Spoke/ }).click()]);
  const out = XLSX.read(readFileSync(await download.path()));
  const outRows = XLSX.utils.sheet_to_json<unknown[]>(out.Sheets[out.SheetNames[0]], { header: 1 });
  expect(outRows.slice(1).map((r) => [r[0], r[1]])).toEqual([
    ['Avenida Inventada, 2500', 'Apto 1305'],
    ['Rua Exemplo, 117', 'Torre Azul Ap 1020'],
  ]);
});

test('recarregar a página não perde as edições e dá para desfazer', async ({ page }) => {
  await page.locator('#file').setInputFiles(FIXTURE);
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  const card = page.locator('.stop').filter({ hasText: 'Rua dos Testes' }).first();
  await card.getByRole('button', { name: 'Editar endereço' }).click();
  await page.locator('.stop-edit').getByLabel('Rua e número').fill('Rua dos Testes, 50');
  await page.locator('.stop-edit').getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: 'Desfazer: Editar endereço' })).toBeVisible();
  if (process.env.SHOTS) {
    await page.locator('.stop').filter({ hasText: 'Rua dos Testes, 50' }).first().evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${process.env.SHOTS}/1-desfazer.png` });
  }

  // recarregou sem querer: volta direto na conferência, com a edição
  await page.reload();
  await expect(page.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeVisible();
  await expect(page.locator('.stop').filter({ hasText: 'Rua dos Testes, 50' }).first()).toContainText('editado por você');

  // no início, a planilha continua aberta
  await page.getByRole('button', { name: /Nova planilha/ }).click();
  const resume = page.getByRole('region', { name: 'Planilha aberta' });
  await expect(resume).toContainText('1 endereço editado');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/2-voltar-para-conferencia.png` });
  await resume.getByRole('button', { name: 'Voltar para a conferência' }).click();
  await expect(page.locator('.stop').filter({ hasText: 'Rua dos Testes, 50' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Sobre' }).click();
  await page.getByRole('button', { name: 'Apagar agora os dados deste celular' }).click();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/3-apagar-dados.png`, fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: /Voltar/ }).click();
  await expect(page.getByRole('button', { name: /Abrir planilha do dia/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Planilha aberta' })).toHaveCount(0);
});
