// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  beforeEach(() => localStorage.clear());

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
});
