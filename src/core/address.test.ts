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

  // Teste na rua: sites como o da Shein colam a faixa de números do CEP no nome da rua,
  // e o app de rota achava que o primeiro número da faixa era o da casa.
  it.each([
    ['Avenida Inventada- de 1001/1002 a 2999/3000 Apto 1305 2500', 'Avenida Inventada, 2500', 'Apto 1305'],
    ['Avenida Inventada- de 1001/1002 a 2999/3000 edificio azul, apto 904', 'Avenida Inventada', 'edificio azul apto 904 (sem número)'],
    ['Rua Fictícia - de 1395/1396 a 2049/2050 Apto 132', 'Rua Fictícia', 'Apto 132 (sem número)'],
    ['Rua Fictícia- de 1395/1396 a 2049/2050, 1766, Apto 132', 'Rua Fictícia, 1766', 'Apto 132'],
    ['Rua Fictícia de 1395/1396 a 2049/2050 1766', 'Rua Fictícia, 1766', ''], // sem o hífen
    ['Rua Modelo - até 999/1000 45 casa 2', 'Rua Modelo, 45', 'casa 2'],
    ['Rua Modelo - de 1001/1002 ao fim 1500', 'Rua Modelo, 1500', ''],
    ['Rua Modelo - lado ímpar 77', 'Rua Modelo, 77', ''],
    ['Rua Modelo - de 101 a 299 - lado ímpar 151', 'Rua Modelo, 151', ''],
  ])('faixa do CEP: %s', (raw, line1, line2) => {
    const r = cleanAddress(raw, 'Centro');
    expect(r.line1).toBe(line1);
    expect(r.line2).toBe(line2);
    expect(r.flags.zipRange).toBe(true);
  });

  it('não confunde nome de rua com faixa do CEP', () => {
    for (const raw of ['Rua 7 de Setembro 100', 'Rua Dois de Julho 10 apto 2', 'Rua do Lado Par 12']) {
      expect(cleanAddress(raw).flags.zipRange).toBe(false);
    }
    expect(cleanAddress('Rua 7 de Setembro 100').line1).toBe('Rua 7 de Setembro, 100');
  });

  // Teste na rua: o Spoke tirou o número de "Rua X (Edifício Y), 117"
  it.each([
    ['Rua Exemplo (Torre Azul) 117 Ap 1020', 'Rua Exemplo, 117', 'Torre Azul Ap 1020'],
    ['Rua Exemplo (Bloco 2) 50', 'Rua Exemplo, 50', 'Bloco 2'], // número dentro do parêntese não é o da casa
    ['Rua Exemplo 50 apto 3 (fundos)', 'Rua Exemplo, 50', 'apto 3 (fundos)'], // depois do número fica onde está
    ['Rua Exemplo (Torre 50 apto 3', 'Rua Exemplo (Torre, 50', 'apto 3'], // parêntese sem fechar: não esconde o número
  ])('parênteses na rua vão para o complemento: %s', (raw, line1, line2) => {
    const r = cleanAddress(raw, 'Centro');
    expect(r.line1).toBe(line1);
    expect(r.line2).toBe(line2);
  });

  // Revisão: "Rua 7, 100" e "Rua 7, 200" viravam as duas "Rua, 7" e caíam numa parada só
  it.each([
    ['Rua 7, 100', 'Rua 7, 100', ''],
    ['Rua 7 200 apto 3', 'Rua 7, 200', 'apto 3'],
    ['R. 10 150', 'Rua 10, 150', ''],
    ['Rua 7 apto 91 430', 'Rua 7, 430', 'apto 91'],
    ['Rodovia SC 401 5000', 'Rodovia SC 401, 5000', ''],
    ['SC 401 7000 galpão 2', 'SC 401, 7000', 'galpão 2'],
    ['BR 116 km 30', 'BR 116, km 30', ''],
    ['Rua 7', 'Rua 7', '(sem número)'], // só o nome: sem número da casa
    ['Rua 7 apto 3', 'Rua 7', 'apto 3 (sem número)'],
  ])('número no nome da rua: %s', (raw, line1, line2) => {
    const r = cleanAddress(raw, 'Centro');
    expect(r.line1).toBe(line1);
    expect(r.line2).toBe(line2);
  });

  it('marca os casos especiais', () => {
    expect(cleanAddress('Marechal Exemplo apto 91 430').flags.reordered).toBe(true);
    expect(cleanAddress('Rua Modelo s/n').flags.noNumber).toBe(true);
    expect(cleanAddress('Avenida Exemplo 45 45').flags.dupRemoved).toBe(true);
  });

  it.each([
    ['Rua Inventada 1807 464', true], // o caso que motivou o aviso
    ['Rua Inventada, 300, 12', true],
    ['Rua 7 100 200', true], // número no nome da rua continua pulado
    ['Rua Inventada 300', false],
    ['Rua Inventada 300 apto 12', false],
    ['Rua Inventada apto 91 430', false], // complemento antes do número já tem aviso próprio
    ['Avenida Exemplo 45 45', false], // número repetido
    ['Rua 7 100', false],
    ['BR 116 km 30 5', false],
    ["Rua Inventada 45 8'andar", false],
    ['Rua Inventada 10 41999998888', false], // telefone não é número de casa
    ['Rua Inventada 10 80000000', false], // CEP também não
    ['Rua Inventada s/n 12', false],
  ])('dois números seguidos: %s', (raw, expected) => {
    expect(cleanAddress(raw, 'Centro').flags.twoNumbers).toBe(expected);
  });

  it('dois números seguidos: usa o primeiro e põe o outro no complemento', () => {
    const r = cleanAddress('Rua Inventada 1807 464', 'Centro');
    expect([r.line1, r.line2]).toEqual(['Rua Inventada, 1807', '464']);
  });
});
