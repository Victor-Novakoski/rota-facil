// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { takeSharedFile } from './shared';

// Cache Storage de mentira, só na memória
function fakeCaches(entries: Record<string, Response> = {}) {
  const store = new Map(Object.entries(entries));
  const cache = {
    match: vi.fn(async (k: string) => store.get(k)),
    delete: vi.fn(async (k: string) => store.delete(k)),
  };
  vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
  return { store, cache };
}

const KEY = `${window.location.origin}/planilha-compartilhada`;

describe('planilha compartilhada', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));
  afterEach(() => vi.unstubAllGlobals());

  it('app aberto normalmente não faz nada', async () => {
    fakeCaches();
    expect(await takeSharedFile()).toBeNull();
  });

  it('pega a planilha, apaga a cópia e limpa o endereço', async () => {
    const { store } = fakeCaches({ [KEY]: new Response('conteudo', { headers: { 'X-File-Name': encodeURIComponent('Entregas do dia.xlsx') } }) });
    window.history.replaceState(null, '', '/?compartilhado=1');
    const r = await takeSharedFile();
    expect(r && 'file' in r && r.file.name).toBe('Entregas do dia.xlsx');
    expect(r && 'file' in r && (await r.file.text())).toBe('conteudo');
    expect(store.size).toBe(0);
    expect(window.location.search).toBe('');
  });

  it('avisa quando o compartilhamento veio sem arquivo', async () => {
    fakeCaches();
    window.history.replaceState(null, '', '/?compartilhado=vazio');
    expect(await takeSharedFile()).toEqual({ problem: expect.stringContaining('Não consegui receber') });
  });

  it('avisa quando a cópia sumiu', async () => {
    fakeCaches();
    window.history.replaceState(null, '', '/?compartilhado=1');
    expect(await takeSharedFile()).toEqual({ problem: expect.stringContaining('Não consegui receber') });
  });
});
