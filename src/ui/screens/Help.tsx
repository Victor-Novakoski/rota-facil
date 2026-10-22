import type { HowToSection, RouteAppProfile } from '../../core/types';
import { Rich } from '../components/ui';
import type { Platform } from '../lib';

function Steps({ section }: { section: HowToSection }) {
  return (
    <section className="card">
      <h2>{section.title}</h2>
      <ol className="how">
        {section.steps.map((s) => <li key={s}><Rich text={s} /></li>)}
      </ol>
    </section>
  );
}

export function Help({ app, platform }: { app: RouteAppProfile; platform: Platform }) {
  const { android, iphone, notes } = app.howTo;
  const sections = platform === 'iphone' && iphone ? [iphone, android] : [android, iphone].filter(Boolean) as HowToSection[];
  return (
    <main className="screen">
      <h1>Como importar no {app.name}</h1>
      {sections.map((s) => <Steps key={s.title} section={s} />)}
      {notes?.map((n) => <p key={n} className="note-info">{n}</p>)}
      <section className="card">
        <h2>O que os avisos amarelos querem dizer</h2>
        <ul className="plain-list">
          <li><b>Sem número:</b> o cliente não escreveu o número da casa. O ponto no mapa vem da localização da planilha.</li>
          <li><b>Sem localização:</b> a planilha veio sem o ponto no mapa. O app de rota procura pelo endereço escrito, então confira se caiu no lugar certo.</li>
          <li><b>Endereço corrigido:</b> o Rota Fácil arrumou o nome da rua ou a ordem do número. Confira se ficou certo.</li>
        </ul>
      </section>
    </main>
  );
}
