import { useState } from 'react';
import type { RouteAppProfile, RouteResult } from '../../core/types';
import { Banner } from '../components/ui';
import { StopCard } from '../components/StopCard';

interface Props {
  result: RouteResult;
  app: RouteAppProfile;
  isExample: boolean;
  fileName: string;
}

export function Review({ result, app, isExample, fileName }: Props) {
  const { packages, stops, check, noAddress } = result;
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const warned = stops.filter((s) => s.warnings.length);
  const multi = stops.filter((s) => s.packages.length > 1);
  const pending = warned.filter((s) => !checked.has(s.no)).length;
  const toggle = (no: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });

  return (
    <main className="screen review">
      {isExample ? (
        <p className="example-flag">Isto é um EXEMPLO com endereços inventados. Não use na rua.</p>
      ) : (
        <p className="muted small file-name">{fileName}</p>
      )}

      {check.ok && !noAddress.length && (
        <Banner tone="ok" title={`Conferido: ${packages.length} pacotes, nenhum perdido`}>
          <p>Todos os rastreios, CEPs, números e localizações batem com a planilha.</p>
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

      {warned.length > 0 && (
        <section className="group">
          <h2>Avisos para conferir</h2>
          <p className="muted">Não impedem a rota. Olhe estas paradas com mais atenção.</p>
          <ul className="stops">
            {warned.map((s) => (
              <StopCard key={s.no} stop={s} showWarnings checked={checked.has(s.no)} onToggle={() => toggle(s.no)} />
            ))}
          </ul>
        </section>
      )}

      {multi.length > 0 && (
        <section className="group">
          <h2>Endereços com vários pacotes</h2>
          <ul className="stops">
            {multi.map((s) => <StopCard key={s.no} stop={s} />)}
          </ul>
        </section>
      )}

      <details className="group all">
        <summary>Ver todas as {stops.length} paradas</summary>
        <ul className="stops">
          {stops.map((s) => <StopCard key={s.no} stop={s} />)}
        </ul>
      </details>
    </main>
  );
}
