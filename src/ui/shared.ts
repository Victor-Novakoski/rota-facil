// Planilha que chegou de fora do app: pelo "Compartilhar" do Android (public/share-target.js)
// ou pelo "Abrir com" (File Handling, onde o navegador permitir). Nada sai do celular.

/** Precisam bater com public/share-target.js. */
export const SHARE_CACHE = 'rota-facil-compartilhado';
const SHARE_KEY = 'planilha-compartilhada';
const PARAM = 'compartilhado';

export type SharedResult = { file: File } | { problem: string } | null;

/**
 * Se o app abriu por um compartilhamento, pega a planilha, apaga a cópia temporária
 * e limpa o endereço da página. Devolve null quando o app abriu normalmente.
 */
export async function takeSharedFile(): Promise<SharedResult> {
  const url = new URL(window.location.href);
  const flag = url.searchParams.get(PARAM);
  if (!flag) return null;
  url.searchParams.delete(PARAM);
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);

  const problem = 'Não consegui receber a planilha compartilhada. Tente de novo ou toque em "Abrir planilha do dia".';
  if (flag !== '1' || !('caches' in window)) return { problem };
  try {
    const cache = await caches.open(SHARE_CACHE);
    const key = new URL(SHARE_KEY, new URL(import.meta.env.BASE_URL, window.location.origin)).href;
    const res = await cache.match(key);
    await cache.delete(key);
    if (!res) return { problem };
    const name = decodeURIComponent(res.headers.get('X-File-Name') ?? 'planilha.xlsx');
    return { file: new File([await res.arrayBuffer()], name) };
  } catch {
    return { problem };
  }
}

// File Handling API: ainda não está nos tipos do TypeScript.
interface LaunchParams { files: { getFile(): Promise<File> }[] }
interface LaunchQueue { setConsumer(consumer: (params: LaunchParams) => void): void }

/** Quando o navegador abre o app pelo "Abrir com", entrega o arquivo escolhido. */
export function onLaunchFile(handler: (file: File) => void): void {
  const queue = (window as Window & { launchQueue?: LaunchQueue }).launchQueue;
  queue?.setConsumer((params) => {
    const first = params.files[0];
    if (first) void first.getFile().then(handler, () => undefined);
  });
}
