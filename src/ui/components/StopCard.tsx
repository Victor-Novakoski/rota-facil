import type { Stop } from '../../core/types';

interface Props {
  stop: Stop;
  showWarnings?: boolean;
  checked?: boolean;
  onToggle?: () => void;
}

export function StopCard({ stop, showWarnings, checked, onToggle }: Props) {
  const warn = showWarnings && stop.warnings.length > 0;
  return (
    <li className={`stop${warn ? ' warn' : ''}${checked ? ' done' : ''}`}>
      <div className="stop-head">
        <span className="stop-no">Parada {stop.no}</span>
        {stop.packages.length > 1 && <span className="pill">{stop.packages.length} pacotes</span>}
      </div>
      <div className="stop-addr">{stop.line1}</div>
      {stop.line2 && <div className="stop-comp">{stop.line2}</div>}
      {warn && (
        <ul className="stop-why">
          {stop.warnings.map((w) => (
            <li key={w.kind + w.text}>{w.text}</li>
          ))}
        </ul>
      )}
      <div className="stop-tracks">
        {stop.packages.map((p) => (
          <span key={p.waybill}>
            {p.waybill.slice(0, -4)}
            <b>{p.waybill.slice(-4)}</b>
          </span>
        ))}
      </div>
      {warn && onToggle && (
        <button type="button" className={`check-btn${checked ? ' on' : ''}`} aria-pressed={checked} onClick={onToggle}>
          {checked ? '✓ Conferido' : 'Marcar como conferido'}
        </button>
      )}
    </li>
  );
}
