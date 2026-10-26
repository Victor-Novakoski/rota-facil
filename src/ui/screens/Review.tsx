import { useState } from 'react';
import { findByFinal, MIN_SEARCH_DIGITS } from '../../core';
import type { AddressEdit, DuplicatePair, RouteAppProfile, RouteResult, Stop } from '../../core/types';
import { Banner } from '../components/ui';
import { DuplicateCard } from '../components/DuplicateCard';
import { StopCard } from '../components/StopCard';

interface Props {
  result: RouteResult;
  app: RouteAppProfile;
  isExample: boolean;
  fileName: string;
  /** Paradas marcadas como conferidas e pares marcados como lugares diferentes (guardados no App). */
  checked: ReadonlySet<string>;
  apart: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onApart: (key: string) => void;
  /** Troca o endereço dos pacotes de uma parada; o App refaz paradas, arquivo e conferência. O rótulo vai no "Desfazer". */
  onEdit: (waybills: string[], edit: AddressEdit, label: string) => void;
}

/** Chave que não muda quando as paradas são refeitas depois de uma edição. */
const keyOf = (s: Stop) => s.packages[0]?.waybill ?? String(s.no);
const pairKey = (d: DuplicatePair) => d.stops.map(keyOf).join('|');

export function Review({ result, app, isExample, fileName, checked, apart, onToggle, onApart, onEdit }: Props) {
  const { packages, stops, check, noAddress, duplicates } = result;
  const [query, setQuery] = useState('');
  const typed = query.replace(/\D/g, '');
  const found = findByFinal(stops, query);
  const maybeSame = duplicates.filter((d) => !apart.has(pairKey(d)));
  // parada editada continua na lista de avisos, para o entregador ver o que mudou
  const warned = stops.filter((s) => s.warnings.length || s.edited);
  const multi = stops.filter((s) => s.packages.length > 1);
  const pending = stops.filter((s) => s.warnings.length && !checked.has(keyOf(s))).length + maybeSame.length;
  const card = (s: Stop, extra: { showWarnings?: boolean; found?: string[] } = {}) => (
    <StopCard
      key={keyOf(s)}
      stop={s}
      {...extra}
      checked={extra.showWarnings && checked.has(keyOf(s))}
      onToggle={extra.showWarnings ? () => onToggle(keyOf(s)) : undefined}
      onEdit={(edit) => onEdit(s.packages.map((p) => p.waybill), edit, 'Editar endereço')}
    />
  );

  return (
    <main className="screen review">
      {isExample ? (
        <p className="example-flag">Isto é um EXEMPLO com endereços inventados. Não use na rua.</p>
      ) : (
        <p className="muted small file-name">{fileName} · suas edições ficam guardadas neste celular até amanhã</p>
      )}

      {check.ok && !noAddress.length && (
        <Banner tone="ok" title={`Conferido: ${packages.length} pacotes, nenhum perdido`}>
          <p>Todos os rastreios, CEPs e números batem com a planilha{stops.some((s) => s.edited) ? ' e com o que você editou' : ''}.</p>
        </Banner>
      )}
      {check.ok && noAddress.length > 0 && (
        <Banner tone="bad" title={`Conferido: ${packages.length} pacotes no arquivo. ${noAddress.length} ficou de fora.`}>
          <p>Estes pacotes vieram sem endereço na planilha. Adicione na mão no app de rota:</p>
          <ul>{noAddress.map((w) => <li key={w}>Rastreio {w}</li>)}</ul>
        </Banner>
      )}
      {!check.ok && (
        <Banner tone="bad" title="Erro na conferência. O arquivo não foi liberado.">
          <p>Por segurança, nada foi gerado. Mande um print desta tela para quem cuida do app.</p>
          <ul>{check.errors.slice(0, 8).map((e) => <li key={e}>{e}</li>)}</ul>
        </Banner>
      )}

      <div className="tiles">
        <div className="tile"><b>{packages.length}</b><span>pacotes</span></div>
        <div className="tile"><b>{stops.length}</b><span>paradas</span></div>
        <div className={`tile${pending ? ' warn' : ''}`}><b>{pending}</b><span>{pending === 1 ? 'aviso' : 'avisos'}</span></div>
      </div>

      {app.freeStopLimit && stops.length > app.freeStopLimit && (
        <p className="note-info">
          São {stops.length} paradas. O plano grátis do {app.name} aceita até {app.freeStopLimit} por rota, então precisa do plano pago.
        </p>
      )}

      <section className="group search" aria-label="Achar pacote pelo final do rastreio">
        <label className="field">
          Achar pacote pelo final do rastreio
          <input
            type="search"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex.: os 4 números grandes da etiqueta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {typed.length >= MIN_SEARCH_DIGITS && found.length === 0 && (
          <p className="muted" role="status">Nenhum pacote termina em {typed}. Confira o número na etiqueta.</p>
        )}
        {found.length > 1 && (
          <p className="note-info" role="status">
            {found.length} paradas têm pacote terminando em {typed}. Confira o rastreio inteiro na etiqueta.
          </p>
        )}
        {found.length > 0 && <ul className="stops">{found.map((m) => card(m.stop, { found: m.waybills }))}</ul>}
      </section>
      {maybeSame.length > 0 && (
        <section className="group">
          <h2>Pode ser o mesmo endereço</h2>
          <p className="muted">O nome da rua veio escrito de jeitos diferentes. Se for a mesma casa, junte para virar uma parada só.</p>
          <ul className="stops">
            {maybeSame.map((d) => (
              <DuplicateCard
                key={pairKey(d)}
                pair={d}
                onMerge={(keep) => onEdit(d.stops[1 - keep].packages.map((p) => p.waybill), { line1: d.stops[keep].line1 }, 'Juntar numa parada')}
                onDismiss={() => onApart(pairKey(d))}
              />
            ))}
          </ul>
        </section>
      )}

      {warned.length > 0 && (
        <section className="group">
          <h2>Avisos para conferir</h2>
          <p className="muted">Não impedem a rota. Olhe estas paradas com mais atenção. Se o pacote mostra um número que a planilha não tem, toque em Editar endereço.</p>
          <ul className="stops">{warned.map((s) => card(s, { showWarnings: true }))}</ul>
        </section>
      )}

      {multi.length > 0 && (
        <section className="group">
          <h2>Endereços com vários pacotes</h2>
          <ul className="stops">{multi.map((s) => card(s))}</ul>
        </section>
      )}

      <details className="group all">
        <summary>Ver todas as {stops.length} paradas</summary>
        <ul className="stops">{stops.map((s) => card(s))}</ul>
      </details>
    </main>
  );
}
