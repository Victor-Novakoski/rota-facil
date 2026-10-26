// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FriendlyError } from '../core/types';
import { App } from './App';
import { loadPdf, UPDATED_MESSAGE } from './lazy';

vi.mock('./lazy', async (importOriginal) => {
  const real = await importOriginal<typeof import('./lazy')>();
  return { ...real, loadPdf: vi.fn(real.loadPdf) };
});

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '');
  });

  it('mostra as boas-vindas só na primeira vez', async () => {
    const { unmount } = render(<App />);
    expect(screen.getByText('Abra a planilha do dia')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pular' }));
    expect(screen.getByRole('button', { name: /Abrir planilha do dia/ })).toBeInTheDocument();
    unmount();
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Pular' })).not.toBeInTheDocument();
  });

  it('roda o exemplo e libera os botões de download', async () => {
    localStorage.setItem('rota-facil:onboarded', '1');
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver como funciona com um exemplo' }));
    expect(await screen.findByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Baixar para o Spoke/ })).toBeEnabled();
  });

  it('carrega o PDF assim que a conferência abre e, se o app foi atualizado, pede para fechar e abrir', async () => {
    localStorage.setItem('rota-facil:onboarded', '1');
    vi.mocked(loadPdf).mockClear();
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver como funciona com um exemplo' }));
    expect(await screen.findByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    expect(loadPdf).toHaveBeenCalledTimes(1);

    vi.mocked(loadPdf).mockRejectedValueOnce(new FriendlyError(UPDATED_MESSAGE));
    await userEvent.click(screen.getByRole('button', { name: /Gerar PDF para iPhone/ }));
    expect(await screen.findByText(UPDATED_MESSAGE)).toBeInTheDocument();
    // a conferência continua aberta: nada se perdeu
    expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
  });

  it('arquivo que não é planilha mostra erro amigável', async () => {
    localStorage.setItem('rota-facil:onboarded', '1');
    render(<App />);
    const file = new File(['isso não é uma planilha'], 'foto.xlsx');
    await userEvent.upload(document.getElementById('file') as HTMLInputElement, file);
    expect(await screen.findByText('Não deu para usar essa planilha')).toBeInTheDocument();
  });

  it('arquivo grande demais é recusado antes de ler', async () => {
    localStorage.setItem('rota-facil:onboarded', '1');
    render(<App />);
    const file = new File(['x'], 'enorme.xlsx');
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 });
    await userEvent.upload(document.getElementById('file') as HTMLInputElement, file);
    expect(await screen.findByText(/grande demais \(20 MB\)/)).toBeInTheDocument();
  });

  describe('botão voltar do celular', () => {
    // O voltar do Android vira um "popstate" do navegador
    const pressBack = async () => {
      await act(async () => {
        window.history.back();
        await new Promise((r) => window.addEventListener('popstate', r, { once: true }));
      });
    };
    const openExample = async () => {
      localStorage.setItem('rota-facil:onboarded', '1');
      render(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Ver como funciona com um exemplo' }));
      expect(await screen.findByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    };

    it('volta do Sobre para a conferência sem perder o resultado', async () => {
      await openExample();
      await userEvent.click(screen.getByRole('button', { name: 'Sobre' }));
      expect(screen.queryByText('Conferido: 10 pacotes, nenhum perdido')).not.toBeInTheDocument();
      await pressBack();
      expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    });

    it('volta da Ajuda para o início', async () => {
      localStorage.setItem('rota-facil:onboarded', '1');
      render(<App />);
      await userEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
      expect(screen.queryByRole('button', { name: /Abrir planilha do dia/ })).not.toBeInTheDocument();
      await pressBack();
      expect(screen.getByRole('button', { name: /Abrir planilha do dia/ })).toBeInTheDocument();
    });

    it('volta da conferência para escolher outra planilha', async () => {
      await openExample();
      await pressBack();
      expect(screen.getByRole('button', { name: /Abrir planilha do dia/ })).toBeInTheDocument();
    });

    it('Ajuda e Sobre não se empilham: voltar sai dos dois de uma vez', async () => {
      await openExample();
      await userEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
      await userEvent.click(screen.getByRole('button', { name: 'Sobre' }));
      await pressBack();
      expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    });

    it('o Voltar da tela também anda no histórico', async () => {
      await openExample();
      await userEvent.click(screen.getByRole('button', { name: 'Sobre' }));
      await userEvent.click(screen.getByRole('button', { name: /Voltar/ }));
      expect(await screen.findByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /Nova planilha/ }));
      expect(await screen.findByRole('button', { name: /Abrir planilha do dia/ })).toBeInTheDocument();
      // no início não sobra nada para trás dentro do app
      expect(window.history.state).toMatchObject({ screen: 'home', depth: 0 });
    });
  });
});
