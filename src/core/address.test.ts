import { describe, expect, it } from 'vitest';
import { cleanAddress } from '.';

// Todos os endereços aqui são inventados ou casos genéricos da referência técnica.
describe('cleanAddress', () => {
  it.each([
    // [entrada, line1, line2]
    ['Rua das Flores 120 apto 302', 'Rua das Flores, 120', 'apto 302'],
    ['Rua das Flores,120,Apartamento 1001', 'Rua das Flores, 120', 'Apartamento 1001'], // 3.1 vírgulas
    ['Avenida Exemplo 45 45', 'Avenida Exemplo, 45', ''], // 3.4 número repetido
    ["Rua Teste de Leão 45 8'andar sala 803,Centro", 'Rua Teste de Leão, 45', "8'andar sala 803"], // 3.5 Centro
    ['Marechal Exemplo apto 91 430', 'Marechal Exemplo, 430', 'apto 91'], // 3.6
    ['Rua Pinto Exemplo Apê 201 260', 'Rua Pinto Exemplo, 260', 'Apê 201'], // 3.6
    ['Rua dos Testes Consultório odontológico', 'Rua dos Testes', 'Consultório odontológico (sem número)'], // 3.7
    ['Rua Modelo s/n Loja 343', 'Rua Modelo', 's/n Loja 343'],
    ['Avenida 7 de Setembro 100 sala 2', 'Avenida 7 de Setembro, 100', 'sala 2'],
    ['Rua Exemplo nº 55', 'Rua Exemplo, 55', ''],
    ['Rua Exemplo Apartamento 811', 'Rua Exemplo', 'Apartamento 811 (sem número)'],
    ['Rua Exemplo 450 apto 45', 'Rua Exemplo, 450', 'apto 45'], // não confunde 45 com 450
  ])('%s', (raw, line1, line2) => {
    const r = cleanAddress(raw, 'Centro');
    expect(r.line1).toBe(line1);
    expect(r.line2).toBe(line2);
  });

  it.each([
    // abreviações no começo do nome da rua
    ['R. Cel. Inventado 100 ap 3', 'Rua Coronel Inventado, 100', 'ap 3'],
    ['Av. Mal. Exemplo 45', 'Avenida Marechal Exemplo, 45', ''],
    ['Pça Exemplo 10 loja 2', 'Praça Exemplo, 10', 'loja 2'],
    ['R Dr Fictício 22', 'Rua Doutor Fictício, 22', ''],
    ['Rua Ver. Exemplo 4', 'Rua Vereador Exemplo, 4', ''],
    ['Trav. Teste 9 apto 12 bl B', 'Travessa Teste, 9', 'apto 12 bl B'],
    ['R 15 de Novembro 300', 'Rua 15 de Novembro, 300', ''],
    // o que não é para mexer
    ['Rua Exemplo 120 Dr. Fulano consultório', 'Rua Exemplo, 120', 'Dr. Fulano consultório'], // complemento fica igual
    ['Rua Cel 12', 'Rua Cel, 12', ''], // título sem nome depois não é título
    ['Rua das Flores Dr. Exemplo 5', 'Rua das Flores Dr. Exemplo, 5', ''], // só no começo
  ])('abreviação: %s', (raw, line1, line2) => {
    const r = cleanAddress(raw, 'Centro');
    expect(r.line1).toBe(line1);
    expect(r.line2).toBe(line2);
    expect(r.flags.fixes).toEqual([]);
  });

  it('o mesmo endereço escrito abreviado ou por extenso fica igual', () => {
    expect(cleanAddress('R. Cel. Inventado 100').line1).toBe(cleanAddress('Rua Coronel Inventado 100').line1);
  });

  it('corrige nomes conhecidos e avisa', () => {
    expect(cleanAddress('Marechal Deodoro 262').line1).toBe('Rua Marechal Deodoro, 262');
    expect(cleanAddress('barão de rio branco 10').line1).toBe('Rua Barão do Rio Branco, 10');
    expect(cleanAddress('Rua Candido Lopes 1').flags.fixes).toHaveLength(1);
  });

  it('não avisa correção quando o nome já está certo', () => {
    expect(cleanAddress('Rua Pedro Ivo 64').flags.fixes).toHaveLength(0);
    expect(cleanAddress('Rua Marechal Deodoro 1').flags.fixes).toHaveLength(0);
  });

  it('marca os casos especiais', () => {
    expect(cleanAddress('Marechal Exemplo apto 91 430').flags.reordered).toBe(true);
    expect(cleanAddress('Rua Modelo s/n').flags.noNumber).toBe(true);
    expect(cleanAddress('Avenida Exemplo 45 45').flags.dupRemoved).toBe(true);
  });
});
