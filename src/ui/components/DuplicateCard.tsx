import { useId, useState } from 'react';
import type { DuplicatePair } from '../../core/types';

interface Props {
  pair: DuplicatePair;
  /** Junta as duas paradas no endereço escolhido (0 ou 1). */
  onMerge: (keep: 0 | 1) => void;
  onDismiss: () => void;
}

const count = (n: number) => (n === 1 ? '1 pacote' : `${n} pacotes`);

/** Duas paradas que podem ser a mesma casa. O entregador escolhe o endereço que fica ou diz que são lugares diferentes. */
export function DuplicateCard({ pair, onMerge, onDismiss }: Props) {
  const [keep, setKeep] = useState<0 | 1>(pair.suggested);
  const name = useId();
  return (
    <li className="stop warn dup">
      <fieldset className="dup-pick">
        <legend className="small">Mesmo CEP ({pair.stops[0].zip}) e mesmo número. Qual endereço fica?</legend>
        {pair.stops.map((s, i) => (
          <label key={s.packages[0]?.waybill ?? i} className="dup-opt">
            <input type="radio" name={name} checked={keep === i} onChange={() => setKeep(i as 0 | 1)} />
            <span>
              <span className="stop-addr">{s.line1}</span>
              {s.line2 && <span className="stop-comp">{s.line2}</span>}
              <span className="small">{count(s.packages.length)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="stop-actions">
        <button type="button" className="check-btn on" onClick={() => onMerge(keep)}>Juntar numa parada</button>
        <button type="button" className="check-btn" onClick={onDismiss}>São lugares diferentes</button>
      </div>
    </li>
  );
}
