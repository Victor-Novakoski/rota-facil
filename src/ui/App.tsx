import { useMemo, useRef, useState } from 'react';
import { findCarrier } from '../core/carriers';
import { findRouteApp } from '../core/route-apps';
import { FriendlyError, type RouteResult } from '../core/types';
import { Banner, Icon, Logo } from './components/ui';
import { EXAMPLE_ROWS } from './example';
import { detectPlatform, prefs, readFile, saveFile, today } from './lib';
import { About } from './screens/About';
import { Help } from './screens/Help';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Review } from './screens/Review';

type Screen = 'home' | 'review' | 'help' | 'about';
interface Loaded { result: RouteResult; isExample: boolean; fileName: string }
interface Problem { message: string; details: string[] }

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function App() {
  const platform = useMemo(() => detectPlatform(), []);
  const [onboarded, setOnboarded] = useState(() => prefs.get('onboarded') === '1');
  const [carrierId, setCarrierId] = useState(() => prefs.get('carrier') ?? '');
  const [appId, setAppId] = useState(() => prefs.get('routeApp') ?? '');
  const carrier = findCarrier(carrierId);
  const app = findRouteApp(appId);

  const [screen, setScreen] = useState<Screen>('home');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };
  const fail = (e: unknown, fallback: string) => {
    if (e instanceof FriendlyError) setProblem({ message: e.message, details: e.details });
    else {
      console.error(e);
      setProblem({ message: fallback, details: [] });
    }
    setLoaded(null);
    go('home');
  };

  const changeCarrier = (id: string) => { setCarrierId(id); prefs.set('carrier', id); setLoaded(null); };
  const changeApp = (id: string) => { setAppId(id); prefs.set('routeApp', id); setLoaded(null); };
  const finishOnboarding = () => { prefs.set('onboarded', '1'); setOnboarded(true); };

  async function onFile(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setToast(null);
    setBusy(true);
    try {
      let data: ArrayBuffer;
      try {
        data = await readFile(file);
      } catch {
        throw new FriendlyError('Não consegui abrir esse arquivo. Escolha a planilha .xlsx que a base mandou.');
      }
      let result: RouteResult;
      try {
        const { convertFile } = await import('../core');
        result = convertFile(data, carrier, app);
      } catch (e) {
        if (e instanceof FriendlyError) throw e;
        throw new FriendlyError('Não consegui ler esse arquivo como planilha. Escolha a planilha .xlsx que a base mandou. Nenhum arquivo foi gerado.');
      }
      setLoaded({ result, isExample: false, fileName: file.name });
      go('review');
    } catch (e) {
      fail(e, 'Algo deu errado ao ler a planilha. Nenhum arquivo foi gerado.');
    } finally {
      setBusy(false);
    }
  }

  async function onExample() {
    setProblem(null);
    setToast(null);
    try {
      const { convertRows } = await import('../core');
      setLoaded({ result: convertRows(EXAMPLE_ROWS, carrier, app), isExample: true, fileName: 'Exemplo' });
      go('review');
    } catch (e) {
      fail(e, 'Algo deu errado no exemplo.');
    }
  }

  const prefix = loaded?.isExample ? 'EXEMPLO ' : '';
  const canExport = !!loaded && loaded.result.check.ok;

  function downloadSheet() {
    if (!loaded || !canExport) return;
    const name = prefix + app.sheetFileName(today().iso);
    saveFile(name, new Blob([loaded.result.sheet], { type: XLSX_MIME }));
    setToast({ text: platform === 'android' ? `Pronto: “${name}” foi para a pasta Downloads.` : `Pronto: “${name}” foi salvo.` });
  }
  async function downloadPdf() {
    if (!loaded || !canExport || !app.pdfFileName) return;
    try {
      const { buildManifestPdf } = await import('../core/pdf');
      const name = prefix + app.pdfFileName(today().iso);
      saveFile(name, buildManifestPdf(loaded.result.stops, today().br));
      setToast({ text: `Pronto: “${name}” foi salvo.` });
    } catch (e) {
      console.error(e);
      setToast({ text: 'Não consegui gerar o PDF.', bad: true });
    }
  }

  const sheetBtn = (primary: boolean) => (
    <button key="sheet" type="button" className={`btn${primary ? '' : ' secondary'}`} onClick={downloadSheet} disabled={!canExport}>
      <Icon name="download" size={26} />
      <span className="lbl">Baixar para o {app.name}<small>planilha · Android</small></span>
    </button>
  );
  const pdfBtn = (primary: boolean) =>
    app.pdfFileName ? (
      <button key="pdf" type="button" className={`btn${primary ? '' : ' secondary'}`} onClick={() => void downloadPdf()} disabled={!canExport}>
        <Icon name="pdf" size={26} />
        <span className="lbl">Gerar PDF para iPhone<small>lista de endereços</small></span>
      </button>
    ) : null;

  if (!onboarded) return <Onboarding onDone={finishOnboarding} />;

  return (
    <div className="shell">
      <header className="topbar">
        {screen === 'home' ? (
          <div className="brand"><Logo size={36} /><span>Rota Fácil</span></div>
        ) : (
          <button type="button" className="iconbtn" onClick={() => go(screen === 'review' || !loaded ? 'home' : 'review')}>
            <Icon name="back" /> <span>{screen === 'review' ? 'Nova planilha' : 'Voltar'}</span>
          </button>
        )}
        <nav className="topnav" aria-label="Menu">
          <button type="button" className={`iconbtn${screen === 'help' ? ' active' : ''}`} onClick={() => go('help')}>
            <Icon name="help" /> <span>Ajuda</span>
          </button>
          <button type="button" className={`iconbtn${screen === 'about' ? ' active' : ''}`} onClick={() => go('about')}>
            <Icon name="info" /> <span>Sobre</span>
          </button>
        </nav>
      </header>

      <div className="content">
        {problem && screen === 'home' && (
          <Banner tone="bad" title="Não deu para usar essa planilha">
            <p>{problem.message}</p>
            {problem.details.length > 0 && <ul>{problem.details.map((d) => <li key={d}>{d}</li>)}</ul>}
          </Banner>
        )}
        {screen === 'home' && <Home carrier={carrier} app={app} onCarrier={changeCarrier} onApp={changeApp} onExample={() => void onExample()} />}
        {screen === 'review' && loaded && <Review result={loaded.result} app={app} isExample={loaded.isExample} fileName={loaded.fileName} />}
        {screen === 'help' && <Help app={app} platform={platform} />}
        {screen === 'about' && <About />}
      </div>

      <input
        ref={fileInput}
        id="file"
        type="file"
        className="visually-hidden"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }}
      />

      {screen === 'home' && (
        <footer className="actionbar">
          <button type="button" className="btn" id="pick" onClick={() => fileInput.current?.click()} disabled={busy}>
            <Icon name="file" size={26} />
            <span className="lbl">{busy ? 'Lendo a planilha…' : 'Abrir planilha do dia'}<small>a planilha .xlsx que a base mandou</small></span>
          </button>
        </footer>
      )}
      {screen === 'review' && loaded && (
        <footer className="actionbar">
          {toast && <p className={`toast${toast.bad ? ' bad' : ''}`} role="status">{toast.text}</p>}
          {platform === 'iphone' && app.pdfFileName ? [pdfBtn(true), sheetBtn(false)] : [sheetBtn(true), pdfBtn(false)]}
        </footer>
      )}
    </div>
  );
}
