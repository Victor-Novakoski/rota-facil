// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { findRouteApp } from '../../core';
import { SAME_PLACE_HELP, WARNING_HELP } from '../../core/warnings';
import { Help } from './Help';

describe('Ajuda', () => {
  it('explica todos os avisos amarelos, inclusive o de dois números', () => {
    render(<Help app={findRouteApp('spoke')} platform="android" />);
    for (const h of [...Object.values(WARNING_HELP), SAME_PLACE_HELP]) {
      expect(screen.getByText(`${h.title}:`)).toBeInTheDocument();
    }
    expect(screen.getByText('Dois números seguidos:')).toBeInTheDocument();
    expect(screen.getByText('Faixa do CEP:')).toBeInTheDocument();
    expect(screen.getByText('Pode ser o mesmo endereço:')).toBeInTheDocument();
  });
});
