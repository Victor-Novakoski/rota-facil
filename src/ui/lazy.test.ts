import { describe, expect, it } from 'vitest';
import { FriendlyError } from '../core/types';
import { loadPart, UPDATED_MESSAGE } from './lazy';

describe('carregar partes do app', () => {
  it('parte que sumiu depois de uma atualização pede para fechar e abrir o app', async () => {
    const gone = () => Promise.reject(new TypeError('Failed to fetch dynamically imported module'));
    await expect(loadPart(gone)).rejects.toEqual(new FriendlyError(UPDATED_MESSAGE));
  });

  it('parte que existe carrega normal', async () => {
    await expect(loadPart(() => Promise.resolve({ ok: 1 }))).resolves.toEqual({ ok: 1 });
  });
});
