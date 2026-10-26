import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { findCarrier } from '../core/carriers';
import { checkFileSize } from '../core/limits';
import { findRouteApp } from '../core/route-apps';
import { FriendlyError, type AddressEdit, type Package, type RouteResult } from '../core/types';
import { Banner, Icon, Logo } from './components/ui';
import { EXAMPLE_ROWS } from './example';
import { loadCore, loadPdf } from './lazy';
import { detectPlatform, prefs, readFile, saveFile, today } from './lib';
import { About } from './screens/About';
import { Help } from './screens/Help';
import { useScreenHistory } from './navigation';
import { clearReview, readReview, saveReview, type SavedReview } from './session';
import { onLaunchFile, takeSharedFile } from './shared';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Review } from './screens/Review';

interface Loaded { result: RouteResult; isExample: boolean; fileName: string }
/** "Conferido" e "São lugares diferentes" ficam aqui, e não na tela, para não sumirem ao abrir a Ajuda. */
interface Marks { checked: Set<string>; apart: Set<string> }
/** O que o "Desfazer" volta: os pacotes de antes da edição, ou um "São lugares diferentes". */
type Undo = { label: string; packages: Package[] } | { label: string; apart: string };

const NO_MARKS: Marks = { checked: new Set(), apart: new Set() };
const MAX_UNDO = 20;
interface Problem { message: string; details: string[] }

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function App() {
  const platform = useMemo(() => detectPlatform(), []);
  const [onboarded, setOnboarded] = useState(() => prefs.get('onboarded') === '1');
  const [carrierId, setCarrierId] = useState(() => prefs.get('carrier') ?? '');
  const [appId, setAppId] = useState(() => prefs.get('routeApp') ?? '');
  const carrier = findCarrier(carrierId);
  const app = findRouteApp(appId);

  const nav = useScreenHistory();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  const [undo, setUndo] = useState<Undo[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; bad?: boolean; howTo?: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { go } = nav;
  // Conferência sem planilha carregada (trocou a transportadora, ou abriu de novo o app) mostra o início
  const screen = nav.screen === 'review' && !loaded ? 'home' : nav.screen;
  const fail = (e: unknown, fallback: string) => {
    if (e instanceof FriendlyError) setProblem({ message: e.message, details: e.details });
    else {
      console.error(e);
      setProblem({ message: fallback, details: [] });
    }
    go('home');
  };

  /** Troca a planilha aberta: zera marcas e desfazer, e a guardada no celular passa a ser a nova. */
  const open = (next: Loaded | null, nextMarks: Marks = NO_MARKS) => {
    setLoaded(next);
    setMarks(nextMarks);
    setUndo([]);
    if (!next || next.isExample) clearReview();
  };

  // o que o entregador perderia se abrisse outra planilha agora
  const edits = loaded && !loaded.isExample ? loaded.result.packages.filter((p) => p.edited).length : 0;
  const worked = edits > 0 || marks.checked.size > 0 || marks.apart.size > 0;
  const confirmDiscard = () =>
    !worked ||
    window.confirm(
      edits
        ? `Você editou ${edits === 1 ? '1 endereço' : `${edits} endereços`} na planilha aberta. Abrir outra e perder as edições?`
        : 'Você já conferiu parte da planilha aberta. Abrir outra e perder o que marcou?',
    );

  const changeCarrier = (id: string) => {
    if (!confirmDiscard()) return;
    setCarrierId(id);
    prefs.set('carrier', id);
    open(null);
  };
  // trocar o app de rota não perde nada: os mesmos pacotes viram o arquivo do outro app
  async function changeApp(id: string) {
    setAppId(id);
    prefs.set('routeApp', id);
    if (!loaded) return;
    try {
      const { buildRoute } = await loadCore();
      const { packages, noAddress } = loaded.result;
      setLoaded({ ...loaded, result: buildRoute(packages, noAddress, findRouteApp(id)) });
    } catch (e) {
      console.error(e);
      open(null);
    }
  }
  const finishOnboarding = () => { prefs.set('onboarded', '1'); setOnboarded(true); };

  async function onFile(file: File | undefined) {
    if (!file || !confirmDiscard()) return;
    setProblem(null);
    setToast(null);
    setBusy(true);
    try {
      checkFileSize(file.size);
      let data: ArrayBuffer;
      try {
        data = await readFile(file);
      } catch {
        throw new FriendlyError('Não consegui abrir esse arquivo. Escolha a planilha .xlsx que a base mandou.');
      }
      const { convertFile } = await loadCore();
      let result: RouteResult;
      try {
        result = convertFile(data, carrier, app);
      } catch (e) {
        if (e instanceof FriendlyError) throw e;
        throw new FriendlyError('Não consegui ler esse arquivo como planilha. Escolha a planilha .xlsx que a base mandou. Nenhum arquivo foi gerado.');
      }
      open({ result, isExample: false, fileName: file.name });
      go('review');
    } catch (e) {
      fail(e, 'Algo deu errado ao ler a planilha. Nenhum arquivo foi gerado.');
    } finally {
      setBusy(false);
    }
  }

  // Planilha que chegou pelo "Compartilhar" ou pelo "Abrir com" do celular
  const openFromOutside = useEffectEvent((shared: { file: File } | { problem: string }) => {
    finishOnboarding();
    if ('file' in shared) void onFile(shared.file);
    else setProblem({ message: shared.problem, details: [] });
  });
  useEffect(() => {
    void takeSharedFile().then((shared) => shared && openFromOutside(shared));
    onLaunchFile((file) => openFromOutside({ file }));
  }, []);

  async function onExample() {
    if (!confirmDiscard()) return;
    setProblem(null);
    setToast(null);
    try {
      const { convertRows } = await loadCore();
      open({ result: convertRows(EXAMPLE_ROWS, carrier, app), isExample: true, fileName: 'Exemplo' });
      go('review');
    } catch (e) {
      fail(e, 'Algo deu errado no exemplo.');
    }
  }

  // A conferência de hoje que ficou guardada no celular volta sozinha (ex.: a página recarregou sem querer)
  const restore = useEffectEvent((saved: SavedReview, core: typeof import('../core')) => {
    if (loaded) return; // já abriu outra planilha (ex.: chegou pelo "Compartilhar")
    if (saved.carrierId !== carrier.id) {
      clearReview();
      return;
    }
    setLoaded({ result: core.buildRoute(saved.packages, saved.noAddress, app), isExample: false, fileName: saved.fileName });
    setMarks({ checked: new Set(saved.checked), apart: new Set(saved.apart) });
  });
  useEffect(() => {
    const saved = readReview();
    if (!saved) return;
    loadCore()
      .then((core) => restore(saved, core))
      .catch((e: unknown) => {
        console.error(e);
        clearReview();
      });
  }, []);

  // Guarda a cada mudança. Só no celular, nada é enviado; o exemplo não é guardado
  useEffect(() => {
    if (!loaded || loaded.isExample) return;
    saveReview({
      carrierId: carrier.id,
      fileName: loaded.fileName,
      packages: loaded.result.packages,
      noAddress: loaded.result.noAddress,
      checked: [...marks.checked],
      apart: [...marks.apart],
    });
  }, [loaded, marks, carrier.id]);

  const pushUndo = (u: Undo) => setUndo((prev) => [...prev, u].slice(-MAX_UNDO));

  async function rebuild(packages: Package[]) {
    if (!loaded) return;
    const { buildRoute } = await loadCore();
    setLoaded({ ...loaded, result: buildRoute(packages, loaded.result.noAddress, app) });
    // arquivo baixado antes da mudança ficou velho
    setToast((t) => (t && !t.bad ? { text: 'Endereço alterado. Baixe o arquivo de novo antes de importar.' } : null));
  }

  async function onEdit(waybills: string[], edit: AddressEdit, label: string) {
    if (!loaded) return;
    try {
      const { editPackages } = await loadCore();
      const { packages } = loaded.result;
      await rebuild(editPackages(packages, waybills, edit));
      pushUndo({ label, packages });
    } catch (e) {
      console.error(e);
      setToast({ text: e instanceof FriendlyError ? e.message : 'Não consegui alterar o endereço.', bad: true });
    }
  }

  const toggleChecked = (key: string) =>
    setMarks((m) => {
      const checked = new Set(m.checked);
      if (checked.has(key)) checked.delete(key);
      else checked.add(key);
      return { ...m, checked };
    });
  const markApart = (key: string) => {
    setMarks((m) => ({ ...m, apart: new Set(m.apart).add(key) }));
    pushUndo({ label: 'São lugares diferentes', apart: key });
  };

  async function onUndo() {
    const last = undo.at(-1);
    if (!last) return;
    setUndo((prev) => prev.slice(0, -1));
    if ('apart' in last) {
      setMarks((m) => {
        const apart = new Set(m.apart);
        apart.delete(last.apart);
        return { ...m, apart };
      });
      return;
    }
    try {
      await rebuild(last.packages);
    } catch (e) {
      console.error(e);
      setToast({ text: e instanceof FriendlyError ? e.message : 'Não consegui desfazer.', bad: true });
    }
  }

  // a parte do PDF carrega assim que a conferência abre: depois disso fica na memória e uma atualização do app
  // no meio do dia não a tira mais (antes ela só carregava no toque do botão e podia já não existir)
  const hasPdf = !!loaded && !!app.pdfFileName;
  useEffect(() => {
    if (hasPdf) loadPdf().catch(() => {});
  }, [hasPdf]);

  const prefix = loaded?.isExample ? 'EXEMPLO ' : '';
  const canExport = !!loaded && loaded.result.check.ok;

  function downloadSheet() {
    if (!loaded || !canExport) return;
    const name = prefix + app.sheetFileName(today().iso);
    saveFile(name, new Blob([loaded.result.sheet], { type: XLSX_MIME }));
    setToast({ text: platform === 'android' ? `Pronto: “${name}” foi para a pasta Downloads.` : `Pronto: “${name}” foi salvo.`, howTo: true });
  }
  async function downloadPdf() {
    if (!loaded || !canExport || !app.pdfFileName) return;
    let buildManifestPdf;
    try {
      ({ buildManifestPdf } = await loadPdf());
    } catch (e) {
      setToast({ text: e instanceof FriendlyError ? e.message : 'Não consegui carregar o PDF.', bad: true });
      return;
    }
    try {
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
  // no Android o PDF é só um link discreto: quem usa é o iPhone
  const pdfBtn = (primary: boolean) =>
    !app.pdfFileName ? null : primary ? (
      <button key="pdf" type="button" className="btn" onClick={() => void downloadPdf()} disabled={!canExport}>
        <Icon name="pdf" size={26} />
        <span className="lbl">Gerar PDF para iPhone<small>lista de endereços</small></span>
      </button>
    ) : (
      <button key="pdf" type="button" className="linkbtn pdf-link" onClick={() => void downloadPdf()} disabled={!canExport}>
        Gerar PDF para iPhone
      </button>
    );

  if (!onboarded) return <Onboarding onDone={finishOnboarding} />;

  return (
    <div className="shell">
      <header className="topbar">
        {screen === 'home' ? (
          <div className="brand"><Logo size={36} /><span>Rota Fácil</span></div>
        ) : (
          <button type="button" className="iconbtn" onClick={() => (screen === 'review' ? go('home') : nav.back())}>
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
        {screen === 'home' && (
          <Home
            carrier={carrier}
            app={app}
            onCarrier={changeCarrier}
            onApp={(id) => void changeApp(id)}
            onExample={() => void onExample()}
            open={loaded && !loaded.isExample ? { fileName: loaded.fileName, packages: loaded.result.packages.length, edits } : undefined}
            onResume={() => go('review')}
          />
        )}
        {screen === 'review' && loaded && (
          <Review
            result={loaded.result}
            app={app}
            isExample={loaded.isExample}
            fileName={loaded.fileName}
            checked={marks.checked}
            apart={marks.apart}
            onToggle={toggleChecked}
            onApart={markApart}
            onEdit={(w, e, label) => void onEdit(w, e, label)}
          />
        )}
        {screen === 'help' && <Help app={app} platform={platform} />}
        {screen === 'about' && <About onErase={() => open(null)} />}
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
          {toast && (
            <p className={`toast${toast.bad ? ' bad' : ''}`} role="status">
              {toast.text}
              {toast.howTo && (
                <>
                  {' '}
                  <button type="button" className="linkbtn inline" onClick={() => go('help')}>Como importar no {app.name}</button>
                </>
              )}
            </p>
          )}
          {undo.length > 0 && (
            <button type="button" className="linkbtn undo" onClick={() => void onUndo()}>
              Desfazer: {undo.at(-1)?.label}
            </button>
          )}
          {platform === 'iphone' && app.pdfFileName ? [pdfBtn(true), sheetBtn(false)] : [sheetBtn(true), pdfBtn(false)]}
        </footer>
      )}
    </div>
  );
}
