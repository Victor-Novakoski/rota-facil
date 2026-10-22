import type { RouteAppProfile } from '../types';

export const spoke: RouteAppProfile = {
  id: 'spoke',
  name: 'Spoke',
  compat: 'Gera arquivo para importar no Spoke.',
  freeStopLimit: 10,
  // Cabeçalhos exatos que o Spoke reconheceu sozinho (referência técnica, seção 2)
  headers: ['Address Line 1', 'Address Line 2', 'City', 'State', 'Zip/Postal Code', 'Country', 'Latitude', 'Longitude', 'Packages', 'Notes'],
  toRow: (s) => [s.line1, s.line2 || null, s.city, s.state, s.zip, 'Brasil', s.lat, s.lon, s.packages.length, s.notes],
  cols: {
    line1: 'Address Line 1',
    line2: 'Address Line 2',
    city: 'City',
    state: 'State',
    zip: 'Zip/Postal Code',
    lat: 'Latitude',
    lon: 'Longitude',
    packages: 'Packages',
    notes: 'Notes',
  },
  sheetFileName: (d) => `Rota Spoke ${d}.xlsx`,
  pdfFileName: (d) => `Rota Spoke iPhone ${d}.pdf`,
  howTo: {
    android: {
      title: 'No Android',
      steps: [
        'Toque em **Baixar para o Spoke**. O arquivo vai para a pasta **Downloads**.',
        'Abra o Spoke e crie uma rota nova.',
        'Toque no menu **⠇** (três pontinhos) e escolha **Import spreadsheet**.',
        'Escolha o arquivo **Rota Spoke** com a data de hoje.',
        'Quando perguntar o que mais quer ver ao chegar, marque só **Address Line 2**, **Notes** e **Packages**.',
        'Confira a quantidade de paradas e otimize a rota.',
      ],
    },
    iphone: {
      title: 'No iPhone',
      steps: [
        'Toque em **Gerar PDF para iPhone** e salve em **Arquivos**.',
        'No Spoke, crie uma rota nova e escolha **Import route manifest**.',
        'Escolha o PDF. O Spoke lê os endereços sozinho.',
        'Confira se a quantidade de paradas bate. No iPhone os rastreios não vão junto: use a lista do Rota Fácil para saber quais pacotes ficam em cada parada.',
      ],
    },
    notes: ['O plano grátis do Spoke aceita até 10 paradas por rota. Para mais que isso, precisa do plano pago.'],
  },
};
