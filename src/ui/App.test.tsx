// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeSheet } from '../core/spreadsheet';
import { App } from './App';
import { EXAMPLE_ROWS } from './example';

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

  describe('conferência guardada no celular', () => {
    // planilha inventada do repositório, aberta como se viesse do celular (o exemplo não é guardado)
    const fixture = () => new File([readFileSync('src/core/fixtures/exemplo-imile-ficticio.xlsx')], 'rota-do-dia.xlsx');
    const openSheet = async () => {
      await userEvent.upload(document.getElementById('file') as HTMLInputElement, fixture());
      expect(await screen.findByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    };
    const start = async () => {
      localStorage.setItem('rota-facil:onboarded', '1');
      render(<App />);
      await openSheet();
    };
    const editStreet = async (from: string, to: string) => {
      const card = screen.getAllByText(from)[0].closest('li') as HTMLElement;
      await userEvent.click(within(card).getByRole('button', { name: 'Editar endereço' }));
      const street = within(card).getByLabelText('Rua e número');
      await userEvent.clear(street);
      await userEvent.type(street, to);
      await userEvent.click(within(card).getByRole('button', { name: 'Salvar' }));
      expect(await screen.findAllByText(to)).not.toHaveLength(0);
    };

    it('"Conferido" não some ao abrir a Ajuda e voltar', async () => {
      await start();
      await userEvent.click(screen.getAllByRole('button', { name: 'Marcar como conferido' })[0]);
      await userEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
      await userEvent.click(screen.getByRole('button', { name: /Voltar/ }));
      expect(await screen.findByRole('button', { name: '✓ Conferido' })).toBeInTheDocument();
    });

    it('a página recarregou: volta na conferência com as edições e as marcas', async () => {
      await start();
      await editStreet('Rua dos Testes', 'Rua dos Testes, 50');
      await userEvent.click(screen.getAllByRole('button', { name: 'Marcar como conferido' })[0]);
      cleanup();

      render(<App />);
      expect(await screen.findAllByText('Rua dos Testes, 50')).not.toHaveLength(0);
      expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '✓ Conferido' })).toBeInTheDocument();
    });

    it('o app abriu no início: mostra "Voltar para a conferência"', async () => {
      await start();
      await editStreet('Rua dos Testes', 'Rua dos Testes, 50');
      cleanup();
      window.history.replaceState(null, '');

      render(<App />);
      const resume = await screen.findByRole('region', { name: 'Planilha aberta' });
      expect(resume).toHaveTextContent('rota-do-dia.xlsx continua aberta: 10 pacotes, 1 endereço editado.');
      await userEvent.click(within(resume).getByRole('button', { name: 'Voltar para a conferência' }));
      expect(await screen.findAllByText('Rua dos Testes, 50')).not.toHaveLength(0);
    });

    it('a conferência de outro dia é apagada', async () => {
      await start();
      cleanup();
      const saved = JSON.parse(localStorage.getItem('rota-facil:conferencia') ?? '{}') as Record<string, unknown>;
      localStorage.setItem('rota-facil:conferencia', JSON.stringify({ ...saved, day: '2000-01-01' }));
      window.history.replaceState(null, '');

      render(<App />);
      expect(screen.getByRole('button', { name: /Abrir planilha do dia/ })).toBeInTheDocument();
      await act(async () => {});
      expect(screen.queryByRole('region', { name: 'Planilha aberta' })).not.toBeInTheDocument();
      expect(localStorage.getItem('rota-facil:conferencia')).toBeNull();
    });

    it('"Apagar agora" no Sobre tira a planilha do celular', async () => {
      await start();
      await userEvent.click(screen.getByRole('button', { name: 'Sobre' }));
      await userEvent.click(screen.getByRole('button', { name: 'Apagar agora os dados deste celular' }));
      expect(screen.getByRole('status')).toHaveTextContent('nenhuma planilha guardada');
      expect(localStorage.getItem('rota-facil:conferencia')).toBeNull();
    });

    it('desfaz a edição', async () => {
      await start();
      await editStreet('Rua dos Testes', 'Rua dos Testes, 50');
      await userEvent.click(screen.getByRole('button', { name: 'Desfazer: Editar endereço' }));
      expect(await screen.findAllByText('Rua dos Testes')).not.toHaveLength(0);
      expect(screen.queryByText('Rua dos Testes, 50')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Desfazer/ })).not.toBeInTheDocument();
    });

    it('desfaz "Juntar numa parada" e "São lugares diferentes"', async () => {
      // exemplo + duas entregas inventadas no mesmo CEP, com a rua escrita de dois jeitos
      const extra = (w: string, address: string) => ['33200000003' + w, '80000-020', 'Paraná', 'Curitiba', 'Centro', address, 'EXEMPLO', '-49.27700', '-25.43700'];
      const sheet = writeSheet([...EXAMPLE_ROWS, extra('01', 'Rua XV 72 casa 2'), extra('02', 'R. XV de Novembro 72 apto 3')], 'Sheet1');
      localStorage.setItem('rota-facil:onboarded', '1');
      render(<App />);
      await userEvent.upload(document.getElementById('file') as HTMLInputElement, new File([sheet], 'dupla.xlsx'));
      expect(await screen.findByText('Conferido: 12 pacotes, nenhum perdido')).toBeInTheDocument();
      const stops = () => screen.getByText('paradas').previousSibling;
      expect(stops()).toHaveTextContent('10');

      await userEvent.click(screen.getByRole('button', { name: 'Juntar numa parada' }));
      await waitFor(() => expect(stops()).toHaveTextContent('9'));
      await userEvent.click(screen.getByRole('button', { name: 'Desfazer: Juntar numa parada' }));
      await waitFor(() => expect(stops()).toHaveTextContent('10'));
      expect(screen.getByRole('heading', { name: 'Pode ser o mesmo endereço' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'São lugares diferentes' }));
      expect(screen.queryByRole('heading', { name: 'Pode ser o mesmo endereço' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Desfazer: São lugares diferentes' }));
      expect(screen.getByRole('heading', { name: 'Pode ser o mesmo endereço' })).toBeInTheDocument();
    });

    it('pergunta antes de abrir outra planilha por cima das edições', async () => {
      await start();
      await editStreet('Rua dos Testes', 'Rua dos Testes, 50');
      await userEvent.click(screen.getByRole('button', { name: /Nova planilha/ }));

      const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
      await userEvent.upload(document.getElementById('file') as HTMLInputElement, fixture());
      expect(ask).toHaveBeenCalledWith('Você editou 1 endereço na planilha aberta. Abrir outra e perder as edições?');
      // disse não: a planilha editada continua lá
      expect(screen.getByRole('region', { name: 'Planilha aberta' })).toHaveTextContent('1 endereço editado');

      ask.mockReturnValue(true);
      await userEvent.upload(document.getElementById('file') as HTMLInputElement, fixture());
      expect(await screen.findByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
      expect(screen.queryByText('Rua dos Testes, 50')).not.toBeInTheDocument();
      ask.mockRestore();
    });
  });
});
