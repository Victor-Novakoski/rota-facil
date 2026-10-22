/** Campos que o motor precisa de cada pacote, seja qual for a transportadora. */
export type PackageField = 'waybill' | 'zip' | 'state' | 'city' | 'area' | 'address' | 'lat' | 'lon';

export interface AddressFlags {
  /** Correções de nome aplicadas, no formato "antes → depois". */
  fixes: string[];
  noNumber: boolean;
  /** O complemento vinha antes do número ("apto 91 430"). */
  reordered: boolean;
  dupRemoved: boolean;
}

export interface CleanAddress {
  line1: string;
  line2: string;
  flags: AddressFlags;
}

export interface Package extends CleanAddress {
  waybill: string;
  rawAddress: string;
  area: string;
  zip: string;
  city: string;
  state: string;
  lat: number | null;
  lon: number | null;
  /** O entregador trocou o endereço na tela de conferência. */
  edited?: boolean;
}

export type WarningKind = 'noCoords' | 'oddCoords' | 'farCoords' | 'noNumber' | 'nameFixed' | 'reordered' | 'oddZip';

export interface Warning {
  kind: WarningKind;
  text: string;
}

export interface Stop {
  no: number;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  area: string;
  lat: number | null;
  lon: number | null;
  packages: Package[];
  notes: string;
  warnings: Warning[];
  /** Algum pacote desta parada teve o endereço trocado pelo entregador. */
  edited: boolean;
}

/** Endereço digitado pelo entregador. Sem complemento, cada pacote mantém o seu. */
export interface AddressEdit {
  line1: string;
  line2?: string;
}

export type Cell = string | number | null;

/** Perfil de transportadora: diz quais colunas a planilha dela tem. */
export interface CarrierProfile {
  id: string;
  name: string;
  /** Frase curta mostrada na tela, ex.: "Compatível com planilhas da iMile." */
  compat: string;
  /** Campo interno -> cabeçalho exato na planilha. */
  columns: Record<PackageField, string>;
}

export interface HowToSection {
  title: string;
  /** Passos curtos. Trechos entre **asteriscos** aparecem em negrito. */
  steps: string[];
}

/** Perfil de app de rota: diz como montar o arquivo que o app importa. */
export interface RouteAppProfile {
  id: string;
  name: string;
  compat: string;
  /** Limite de paradas do plano grátis, se houver. */
  freeStopLimit?: number;
  headers: string[];
  toRow: (stop: Stop) => Cell[];
  /** Nome das colunas da saída usadas na conferência. */
  cols: Record<'line1' | 'line2' | 'city' | 'state' | 'zip' | 'lat' | 'lon' | 'packages' | 'notes', string>;
  sheetFileName: (isoDate: string) => string;
  /** Só para apps que leem uma lista em PDF (ex.: Spoke no iPhone). */
  pdfFileName?: (isoDate: string) => string;
  howTo: { android: HowToSection; iphone?: HowToSection; notes?: string[] };
}

export interface VerifyResult {
  ok: boolean;
  errors: string[];
  total: number;
  stops: number;
}

/** Duas paradas do mesmo CEP e mesmo número com o nome da rua escrito diferente. */
export interface DuplicatePair {
  stops: [Stop, Stop];
  /** Qual das duas tem o endereço mais completo (o app sugere juntar nela). */
  suggested: 0 | 1;
}

export interface RouteResult {
  packages: Package[];
  /** Rastreios que vieram sem endereço e ficaram de fora. */
  noAddress: string[];
  stops: Stop[];
  /** Paradas que podem ser o mesmo lugar; o entregador decide se junta. */
  duplicates: DuplicatePair[];
  sheet: ArrayBuffer;
  check: VerifyResult;
}

/** Erro com mensagem pronta para mostrar ao entregador. */
export class FriendlyError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = 'FriendlyError';
    this.details = details;
  }
}
