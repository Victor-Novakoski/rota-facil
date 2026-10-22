/** Data de hoje em dois formatos: 2026-10-22 (nome de arquivo) e 22/10/2026 (tela e PDF). */
export function today() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    iso: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    br: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`,
  };
}

export type Platform = 'android' | 'iphone';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return iOS ? 'iphone' : 'android';
}

/** Baixa um arquivo gerado no próprio aparelho. Nada é enviado para fora. */
export function saveFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 5000);
}

/** Preferências pequenas (última transportadora, onboarding visto). Só no aparelho. */
export const prefs = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(`rota-facil:${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(`rota-facil:${key}`, value);
    } catch {
      /* navegador sem armazenamento: segue sem lembrar */
    }
  },
};

export function readFile(file: File): Promise<ArrayBuffer> {
  if (file.arrayBuffer) return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}
