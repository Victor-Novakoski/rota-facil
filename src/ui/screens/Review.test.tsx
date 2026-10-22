// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { buildRoute, convertRows, editPackages, findCarrier, findRouteApp } from '../../core';
import { EXAMPLE_ROWS } from '../example';
import { Review } from './Review';

const app = findRouteApp('spoke');
const result = convertRows(EXAMPLE_ROWS, findCarrier('imile'), app);
const noop = () => {};

/** Faz o papel do App: guarda o resultado e refaz tudo a cada edição. */
function Editable() {
  const [r, setR] = useState(result);
  return (
    <Review
      result={r}
      app={app}
      isExample={false}
      fileName="rota.xlsx"
      onEdit={(waybills, edit) => setR(buildRoute(editPackages(r.packages, waybills, edit), r.noAddress, app))}
    />
  );
}

const warnCard = (text: string) => screen.getAllByText(text)[0].closest('li') as HTMLElement;

describe('Review', () => {
  it('mostra a conferência, os totais e o aviso de exemplo', () => {
    render(<Review result={result} app={app} isExample fileName="Exemplo" onEdit={noop} />);
    expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    expect(screen.getByText('Isto é um EXEMPLO com endereços inventados. Não use na rua.')).toBeInTheDocument();
    expect(screen.getByText('pacotes').previousSibling).toHaveTextContent('10');
    expect(screen.getByText('paradas').previousSibling).toHaveTextContent('8');
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('5');
  });

  it('marcar um aviso como conferido diminui a contagem', async () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Marcar como conferido' })[0]);
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: '✓ Conferido' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('bloqueia e explica quando a conferência falha', () => {
    const broken = { ...result, check: { ok: false, errors: ['O arquivo tem 9 pacotes, mas a planilha tem 10.'], total: 9, stops: 8 } };
    render(<Review result={broken} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Erro na conferência. O arquivo não foi liberado.');
    expect(screen.getByText('O arquivo tem 9 pacotes, mas a planilha tem 10.')).toBeInTheDocument();
  });

  it('avisa o limite do plano grátis do app de rota', () => {
    render(<Review result={result} app={{ ...app, freeStopLimit: 5 }} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    expect(screen.getByText(/O plano grátis do Spoke aceita até 5 por rota/)).toBeInTheDocument();
  });

  it('não mostra "Parada N" nos cartões', () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    expect(screen.queryByText(/Parada \d/)).not.toBeInTheDocument();
  });

  it('editar o endereço põe o número, tira o aviso e marca "editado por você"', async () => {
    render(<Editable />);
    const card = warnCard('Rua dos Testes');
    await userEvent.click(within(card).getByRole('button', { name: 'Editar endereço' }));
    const street = within(card).getByLabelText('Rua e número');
    expect(within(card).getByLabelText('Complemento')).toHaveValue('Consultório odontológico');
    await userEvent.clear(street);
    await userEvent.type(street, 'Rua dos Testes, 50');
    await userEvent.click(within(card).getByRole('button', { name: 'Salvar' }));

    const edited = warnCard('Rua dos Testes, 50');
    expect(within(edited).getByText('editado por você')).toBeInTheDocument();
    expect(within(edited).queryByText('Sem número no endereço.')).not.toBeInTheDocument();
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
    expect(screen.getByText('paradas').previousSibling).toHaveTextContent('8');
    expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
  });

  it('não deixa salvar sem rua e cancelar não muda nada', async () => {
    render(<Editable />);
    const card = warnCard('Rua dos Testes');
    await userEvent.click(within(card).getByRole('button', { name: 'Editar endereço' }));
    await userEvent.clear(within(card).getByLabelText('Rua e número'));
    await userEvent.click(within(card).getByRole('button', { name: 'Salvar' }));
    expect(within(card).getByRole('alert')).toHaveTextContent('Escreva a rua e o número.');
    await userEvent.click(within(card).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('editado por você')).not.toBeInTheDocument();
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('5');
  });

  it('parada com vários pacotes só edita a rua e o número', async () => {
    render(<Editable />);
    const card = warnCard('Rua das Flores, 120');
    await userEvent.click(within(card).getByRole('button', { name: 'Editar endereço' }));
    expect(within(card).queryByLabelText('Complemento')).not.toBeInTheDocument();
    expect(within(card).getByText('Complementos: apto 302 / Loja Exemplo / Apartamento 1001')).toBeInTheDocument();
  });

  it('acha a parada pelo final do rastreio e destaca o pacote', async () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    const search = screen.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
    await userEvent.type(within(search).getByRole('searchbox'), '0022');
    const card = within(search).getByText('Rua das Flores, 120').closest('li') as HTMLElement;
    expect(within(card).getByText('apto 302 / Loja Exemplo / Apartamento 1001')).toBeInTheDocument();
    expect(within(card).getByText('0022').parentElement).toHaveClass('found');
    expect(within(card).getByText('0011').parentElement).not.toHaveClass('found');
  });

  it('avisa quando nenhum pacote tem aquele final', async () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    const search = screen.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
    await userEvent.type(within(search).getByRole('searchbox'), '9999');
    expect(within(search).getByRole('status')).toHaveTextContent('Nenhum pacote termina em 9999.');
  });

  it('mostra as duas paradas quando dois pacotes têm o mesmo final', async () => {
    const twin = { ...result.stops[7], packages: [{ ...result.stops[7].packages[0], waybill: '7770000000022' }] };
    render(<Review result={{ ...result, stops: [...result.stops, twin] }} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} />);
    const search = screen.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
    await userEvent.type(within(search).getByRole('searchbox'), '0022');
    expect(within(search).getByRole('status')).toHaveTextContent('2 paradas têm pacote terminando em 0022. Confira o rastreio inteiro na etiqueta.');
    expect(within(search).getAllByRole('listitem')).toHaveLength(2);
  });
});
