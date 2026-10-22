// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { convertRows, findCarrier, findRouteApp } from '../../core';
import { EXAMPLE_ROWS } from '../example';
import { Review } from './Review';

const app = findRouteApp('spoke');
const result = convertRows(EXAMPLE_ROWS, findCarrier('imile'), app);

describe('Review', () => {
  it('mostra a conferência, os totais e o aviso de exemplo', () => {
    render(<Review result={result} app={app} isExample fileName="Exemplo" />);
    expect(screen.getByText('Conferido: 10 pacotes, nenhum perdido')).toBeInTheDocument();
    expect(screen.getByText('Isto é um EXEMPLO com endereços inventados. Não use na rua.')).toBeInTheDocument();
    expect(screen.getByText('pacotes').previousSibling).toHaveTextContent('10');
    expect(screen.getByText('paradas').previousSibling).toHaveTextContent('8');
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('5');
  });

  it('marcar um aviso como conferido diminui a contagem', async () => {
    render(<Review result={result} app={app} isExample={false} fileName="rota.xlsx" />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Marcar como conferido' })[0]);
    expect(screen.getByText('avisos').previousSibling).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: '✓ Conferido' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('bloqueia e explica quando a conferência falha', () => {
    const broken = { ...result, check: { ok: false, errors: ['O arquivo tem 9 pacotes, mas a planilha tem 10.'], total: 9, stops: 8 } };
    render(<Review result={broken} app={app} isExample={false} fileName="rota.xlsx" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Erro na conferência. O arquivo não foi liberado.');
    expect(screen.getByText('O arquivo tem 9 pacotes, mas a planilha tem 10.')).toBeInTheDocument();
  });

  it('avisa o limite do plano grátis do app de rota', () => {
    render(<Review result={result} app={{ ...app, freeStopLimit: 5 }} isExample={false} fileName="rota.xlsx" />);
    expect(screen.getByText(/O plano grátis do Spoke aceita até 5 por rota/)).toBeInTheDocument();
  });
});
