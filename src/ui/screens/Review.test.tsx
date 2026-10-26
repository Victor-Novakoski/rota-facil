// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { buildRoute, convertRows, editPackages, findCarrier, findRouteApp, type RouteResult } from '../../core';
import { EXAMPLE_ROWS } from '../example';
import { Review } from './Review';

const app = findRouteApp('spoke');
const result = convertRows(EXAMPLE_ROWS, findCarrier('imile'), app);
const noop = () => {};

/** Faz o papel do App: guarda o resultado e refaz tudo a cada edição. */
function Editable({ start = result }: { start?: RouteResult }) {
  const [r, setR] = useState(start);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [apart, setApart] = useState<ReadonlySet<string>>(new Set());
  return (
    <Review
      result={r}
      app={app}
      isExample={false}
      fileName="rota.xlsx"
      checked={checked}
      apart={apart}
      onToggle={(k) => setChecked((prev) => (prev.has(k) ? new Set([...prev].filter((x) => x !== k)) : new Set(prev).add(k)))}
      onApart={(k) => setApart((prev) => new Set(prev).add(k))}
      onEdit={(waybills, edit) => setR(buildRoute(editPackages(r.packages, waybills, edit), r.noAddress, app))}
    />
  );
}
/** Sem marcas: para os testes que só olham a tela. */
const still = { checked: new Set<string>(), apart: new Set<string>(), onToggle: noop, onApart: noop };

const warnCard = (text: string) => screen.getAllByText(text)[0].closest('li') as HTMLElement;

describe('Review', () => {
  it('mostra a conferência, os totais e o aviso de exemplo', () => {
    render(<Review result={result} app={app} isExample fileName="Exemplo" onEdit={noop} {...still} />);
    expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    expect(screen.getByText('Isto é um EXEMPLO com endereços inventados. Não use na rua.')).toBeInTheDocument();
    expect(screen.getByText('pacotes').previousSibling).toHaveTextContent('10');
    expect(screen.getByText('paradas').previousSibling).toHaveTextContent('8');
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
  });

  it('marcar um aviso como conferido diminui a contagem', async () => {
    render(<Editable />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Marcar como conferido' })[0]);
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: '✓ Conferido' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('bloqueia e explica quando a conferência falha', () => {
    const broken = { ...result, check: { ok: false, errors: ['O arquivo tem 9 pacotes, mas a planilha tem 10.'], total: 9, stops: 8 } };
    render(<Review result={broken} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} {...still} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Erro na conferência. O arquivo não foi liberado.');
    expect(screen.getByText('O arquivo tem 9 pacotes, mas a planilha tem 10.')).toBeInTheDocument();
  });

  it('avisa o limite do plano grátis do app de rota', () => {
    render(<Review result={result} app={{ ...app, freeStopLimit: 5 }} isExample={false} fileName="rota.xlsx" onEdit={noop} {...still} />);
    expect(screen.getByText(/O plano grátis do Spoke aceita até 5 por rota/)).toBeInTheDocument();
  });

  it('não mostra "Parada N" nos cartões', () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} {...still} />);
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
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('3');
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
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
  });

  it('parada com vários pacotes só edita a rua e o número', async () => {
    render(<Editable />);
    const card = warnCard('Rua das Flores, 120');
    await userEvent.click(within(card).getByRole('button', { name: 'Editar endereço' }));
    expect(within(card).queryByLabelText('Complemento')).not.toBeInTheDocument();
    expect(within(card).getByText('Complementos: apto 302 / Loja Exemplo / Apartamento 1001')).toBeInTheDocument();
  });

  it('acha a parada pelo final do rastreio e destaca o pacote', async () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} {...still} />);
    const search = screen.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
    await userEvent.type(within(search).getByRole('searchbox'), '0022');
    const card = within(search).getByText('Rua das Flores, 120').closest('li') as HTMLElement;
    expect(within(card).getByText('apto 302 / Loja Exemplo / Apartamento 1001')).toBeInTheDocument();
    expect(within(card).getByText('0022').parentElement).toHaveClass('found');
    expect(within(card).getByText('0011').parentElement).not.toHaveClass('found');
  });

  it('avisa quando nenhum pacote tem aquele final', async () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} {...still} />);
    const search = screen.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
    await userEvent.type(within(search).getByRole('searchbox'), '9999');
    expect(within(search).getByRole('status')).toHaveTextContent('Nenhum pacote termina em 9999.');
  });

  it('mostra as duas paradas quando dois pacotes têm o mesmo final', async () => {
    const twin = { ...result.stops[7], packages: [{ ...result.stops[7].packages[0], waybill: '7770000000022' }] };
    render(<Review result={{ ...result, stops: [...result.stops, twin] }} app={app} isExample={false} fileName="rota.xlsx" onEdit={noop} {...still} />);
    const search = screen.getByRole('region', { name: 'Achar pacote pelo final do rastreio' });
    await userEvent.type(within(search).getByRole('searchbox'), '0022');
    expect(within(search).getByRole('status')).toHaveTextContent('2 paradas têm pacote terminando em 0022. Confira o rastreio inteiro na etiqueta.');
    expect(within(search).getAllByRole('listitem')).toHaveLength(2);
  });

  describe('pode ser o mesmo endereço', () => {
    // exemplo + duas entregas inventadas no mesmo CEP, com o nome da rua escrito de dois jeitos
    const extra = (w: string, address: string) => ['33200000003' + w, '80000-020', 'Paraná', 'Curitiba', 'Centro', address, 'EXEMPLO', '-49.27700', '-25.43700'];
    const twice = convertRows([...EXAMPLE_ROWS, extra('01', 'Rua XV 72 casa 2'), extra('02', 'R. XV de Novembro 72 apto 3')], findCarrier('imile'), app);

    it('mostra as duas formas, sugere a mais completa e conta como aviso', () => {
      render(<Editable start={twice} />);
      expect(screen.getByRole('heading', { name: 'Pode ser o mesmo endereço' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Rua XV de Novembro, 72/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /Rua XV, 72/ })).not.toBeChecked();
      expect(screen.getByText('paradas').previousSibling).toHaveTextContent('10');
      expect(screen.getByText('avisos').previousSibling).toHaveTextContent('5');
    });

    it('juntar vira uma parada só, marcada "editado por você", e a conferência continua ok', async () => {
      render(<Editable start={twice} />);
      await userEvent.click(screen.getByRole('button', { name: 'Juntar numa parada' }));
      expect(screen.queryByRole('heading', { name: 'Pode ser o mesmo endereço' })).not.toBeInTheDocument();
      expect(screen.getByText('paradas').previousSibling).toHaveTextContent('9');
      expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
      const merged = warnCard('Rua XV de Novembro, 72');
      expect(within(merged).getByText('2 pacotes')).toBeInTheDocument();
      expect(within(merged).getByText('editado por você')).toBeInTheDocument();
      expect(screen.getByText('Conferido: 12 pacotes, nenhum perdido')).toBeInTheDocument();
    });

    it('dá para escolher o outro endereço', async () => {
      render(<Editable start={twice} />);
      await userEvent.click(screen.getByRole('radio', { name: /Rua XV, 72/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Juntar numa parada' }));
      expect(within(warnCard('Rua XV, 72')).getByText('2 pacotes')).toBeInTheDocument();
      expect(screen.getByText('paradas').previousSibling).toHaveTextContent('9');
    });

    it('"São lugares diferentes" some com a sugestão e não junta nada', async () => {
      render(<Editable start={twice} />);
      await userEvent.click(screen.getByRole('button', { name: 'São lugares diferentes' }));
      expect(screen.queryByRole('heading', { name: 'Pode ser o mesmo endereço' })).not.toBeInTheDocument();
      expect(screen.getByText('paradas').previousSibling).toHaveTextContent('10');
      expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
    });
  });
});
