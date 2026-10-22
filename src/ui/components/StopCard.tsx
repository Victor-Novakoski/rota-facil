import { useState, type FormEvent } from 'react';
import { SEM_NUMERO } from '../../core/edit';
import type { AddressEdit, Stop } from '../../core/types';

interface Props {
  stop: Stop;
  showWarnings?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  onEdit?: (edit: AddressEdit) => void;
}

export function StopCard({ stop, showWarnings, checked, onToggle, onEdit }: Props) {
  const warn = showWarnings && stop.warnings.length > 0;
  const [editing, setEditing] = useState(false);
  return (
    <li className={`stop${warn ? ' warn' : ''}${checked ? ' done' : ''}`}>
      {(stop.packages.length > 1 || stop.edited) && (
        <div className="stop-head">
          {stop.packages.length > 1 && <span className="pill">{stop.packages.length} pacotes</span>}
          {stop.edited && <span className="pill edited">editado por você</span>}
        </div>
      )}
      {editing && onEdit ? (
        <EditForm
          stop={stop}
          onCancel={() => setEditing(false)}
          onSave={(edit) => {
            setEditing(false);
            onEdit(edit);
          }}
        />
      ) : (
        <>
          <div className="stop-addr">{stop.line1}</div>
          {stop.line2 && <div className="stop-comp">{stop.line2}</div>}
        </>
      )}
      {warn && !editing && (
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
      {!editing && (onEdit || (warn && onToggle)) && (
        <div className="stop-actions">
          {warn && onToggle && (
            <button type="button" className={`check-btn${checked ? ' on' : ''}`} aria-pressed={checked} onClick={onToggle}>
              {checked ? '✓ Conferido' : 'Marcar como conferido'}
            </button>
          )}
          {onEdit && (
            <button type="button" className="check-btn" onClick={() => setEditing(true)}>
              Editar endereço
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/** Com vários pacotes, cada um tem o seu complemento: aí só a rua e o número podem mudar. */
function EditForm({ stop, onSave, onCancel }: { stop: Stop; onSave: (e: AddressEdit) => void; onCancel: () => void }) {
  const single = stop.packages.length === 1;
  const [line1, setLine1] = useState(stop.line1);
  const startLine2 = stop.line2.replace(SEM_NUMERO, '');
  const [line2, setLine2] = useState(startLine2);
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!line1.trim()) {
      setError('Escreva a rua e o número.');
      return;
    }
    if (line1.trim() === stop.line1 && (!single || line2.trim() === startLine2)) {
      onCancel();
      return;
    }
    onSave(single ? { line1, line2 } : { line1 });
  }

  return (
    <form className="stop-edit" onSubmit={submit} noValidate>
      <label className="field">
        Rua e número
        <input value={line1} onChange={(e) => { setLine1(e.target.value); setError(''); }} autoComplete="off" autoFocus />
      </label>
      {single ? (
        <label className="field">
          Complemento
          <input value={line2} onChange={(e) => setLine2(e.target.value)} autoComplete="off" placeholder="apto, bloco, loja…" />
        </label>
      ) : (
        stop.line2 && <p className="small">Complementos: {stop.line2}</p>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="small">Só muda neste celular. O CEP e o ponto no mapa continuam os da planilha.</p>
      <div className="stop-actions">
        <button type="submit" className="check-btn on">Salvar</button>
        <button type="button" className="check-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
