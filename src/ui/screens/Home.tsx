import { CARRIERS } from '../../core/carriers';
import { ROUTE_APPS } from '../../core/route-apps';
import type { CarrierProfile, RouteAppProfile } from '../../core/types';
import { Icon } from '../components/ui';

interface Props {
  carrier: CarrierProfile;
  app: RouteAppProfile;
  onCarrier: (id: string) => void;
  onApp: (id: string) => void;
  onExample: () => void;
}

export function Home({ carrier, app, onCarrier, onApp, onExample }: Props) {
  return (
    <main className="screen home">
      <section className="hero">
        <h1>Planilha do dia vira rota pronta.</h1>
        <p className="lead">Abra a planilha que a base mandou. O Rota Fácil separa os endereços, junta os pacotes do mesmo lugar e gera o arquivo para o app de rota.</p>
      </section>

      <p className="privacy">
        <Icon name="lock" size={20} />
        <span>
          <b>Seus dados não saem do celular.</b> A planilha é lida aqui mesmo no aparelho. Nenhum endereço ou rastreio é enviado para lugar nenhum.
        </span>
      </p>

      <section className="card setup" aria-label="Configuração">
        <label className="field">
          <span>Planilha de</span>
          <select id="carrier" value={carrier.id} onChange={(e) => onCarrier(e.target.value)} disabled={CARRIERS.length < 2}>
            {CARRIERS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Importar no</span>
          <select id="routeapp" value={app.id} onChange={(e) => onApp(e.target.value)} disabled={ROUTE_APPS.length < 2}>
            {ROUTE_APPS.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
        <p className="muted small">{carrier.compat} {app.compat}</p>
      </section>

      <button type="button" className="linkbtn" onClick={onExample}>
        Ver como funciona com um exemplo
      </button>
    </main>
  );
}
