import { useState } from 'react';
import { Icon, type IconName, Logo } from '../components/ui';

const SLIDES: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'file', title: 'Abra a planilha do dia', text: 'Pegue a planilha que a base manda e abra no Rota Fácil. Ela fica só no seu celular.' },
  { icon: 'alert', title: 'Confira os avisos', text: 'O app arruma os endereços, junta os pacotes do mesmo lugar e mostra em amarelo o que vale conferir.' },
  { icon: 'download', title: 'Baixe e importe', text: 'Baixe o arquivo e importe no app de rota. O passo a passo fica sempre no botão Ajuda.' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <div className="ob-top">
        <Logo size={40} />
        <button type="button" className="linkbtn" onClick={onDone}>Pular</button>
      </div>
      <div className="ob-body">
        <div className="ob-icon"><Icon name={s.icon} size={56} /></div>
        <p className="ob-step">{i + 1} de {SLIDES.length}</p>
        <h1 id="ob-title">{s.title}</h1>
        <p className="lead">{s.text}</p>
      </div>
      <div className="ob-dots" aria-hidden="true">
        {SLIDES.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}
      </div>
      <button type="button" className="btn" onClick={() => (last ? onDone() : setI(i + 1))}>
        {last ? 'Começar' : 'Próximo'}
      </button>
    </div>
  );
}
