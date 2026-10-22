import { useEffect, useRef, useState } from 'react';

export type Screen = 'home' | 'review' | 'help' | 'about';
interface Entry { screen: Screen; depth: number }

const SCREENS: readonly Screen[] = ['home', 'review', 'help', 'about'];
const isMenu = (s: Screen) => s === 'help' || s === 'about';

function current(): Entry {
  const state: unknown = window.history.state;
  if (state && typeof state === 'object' && 'screen' in state && 'depth' in state) {
    const { screen, depth } = state as Entry;
    if (SCREENS.includes(screen) && Number.isInteger(depth) && depth >= 0) return { screen, depth };
  }
  return { screen: 'home', depth: 0 };
}

/**
 * Cada tela vira uma entrada no histórico do navegador, para o botão voltar do
 * celular trocar de tela em vez de fechar o app. Ajuda e Sobre trocam entre si
 * sem empilhar, e "início" volta até a primeira entrada do app.
 */
export function useScreenHistory() {
  const [entry, setEntry] = useState(current);
  const depth = useRef(entry.depth);

  useEffect(() => {
    window.history.replaceState(current(), '');
    const onPop = () => {
      const next = current();
      depth.current = next.depth;
      setEntry(next);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (screen: Screen) => {
    const from = current();
    if (screen === from.screen) return;
    if (screen === 'home' && depth.current > 0) {
      // o popstate é que mostra o início
      window.history.go(-depth.current);
      return;
    }
    const next: Entry = isMenu(screen) && isMenu(from.screen)
      ? { screen, depth: from.depth }
      : { screen, depth: from.depth + 1 };
    if (next.depth === from.depth) window.history.replaceState(next, '');
    else window.history.pushState(next, '');
    depth.current = next.depth;
    setEntry(next);
    window.scrollTo({ top: 0 });
  };

  // Voltar da tela faz o mesmo que o voltar do celular
  const back = () => {
    if (depth.current > 0) window.history.back();
    else {
      window.history.replaceState({ screen: 'home', depth: 0 }, '');
      setEntry({ screen: 'home', depth: 0 });
    }
  };

  return { screen: entry.screen, go, back };
}
