import type { WarningKind } from './types';

/**
 * O que cada aviso amarelo quer dizer, para a tela de Ajuda.
 * É um Record: aviso novo sem explicação aqui não passa no typecheck.
 */
export const WARNING_HELP: Record<WarningKind, { title: string; text: string }> = {
  noNumber: {
    title: 'Sem número',
    text: 'o cliente não escreveu o número da casa. Veja o número na etiqueta e use **Editar endereço**.',
  },
  twoNumbers: {
    title: 'Dois números seguidos',
    text: 'o cliente escreveu dois números (ex.: "1807 464") sem dizer qual é o apartamento ou a sala. O Rota Fácil usou o primeiro como número da casa. Confira na etiqueta e, se for o outro, use **Editar endereço**.',
  },
  reordered: {
    title: 'Complemento antes do número',
    text: 'o cliente escreveu, por exemplo, "apto 91 430". O Rota Fácil usou o último número como o da casa. Confira se ficou certo.',
  },
  nameFixed: {
    title: 'Nome da rua corrigido',
    text: 'o Rota Fácil arrumou um nome de rua conhecido. Confira se ficou certo.',
  },
  zipRange: {
    title: 'Faixa do CEP',
    text: 'o endereço tinha algo como "de 1001 a 2999", que é a faixa de números do CEP e não o número da casa. Isso foi tirado: confira o número na etiqueta.',
  },
  oddZip: {
    title: 'CEP estranho',
    text: 'o CEP da planilha não está no formato 00000-000. O app de rota pode errar o lugar: confira o CEP na etiqueta.',
  },
  oddCoords: {
    title: 'Localização fora do Brasil',
    text: 'o ponto que veio na planilha está estranho, então o endereço pode estar errado. O app de rota procura pelo endereço escrito: confira se a parada caiu no lugar certo.',
  },
  farCoords: {
    title: 'Localização longe das outras',
    text: 'o ponto que veio na planilha fica muito longe do resto da rota. Pode ser endereço errado ou de outra cidade: confira se a parada caiu no lugar certo.',
  },
};

/** Cartão que não é um aviso de parada, mas também aparece na conferência. */
export const SAME_PLACE_HELP = {
  title: 'Pode ser o mesmo endereço',
  text: 'duas paradas têm o mesmo CEP e número, mas a rua está escrita de jeito diferente. Escolha o endereço certo e toque em **Juntar numa parada**, ou toque em **São lugares diferentes**.',
};
