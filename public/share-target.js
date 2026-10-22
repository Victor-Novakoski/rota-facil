// Recebe a planilha que o entregador compartilhou com o Rota Fácil (por exemplo, do WhatsApp).
// Este arquivo roda dentro do service worker (importado pelo sw.js que o Workbox gera).
// A planilha não sai do celular: fica num cache temporário e o app apaga assim que lê.
// Os nomes abaixo precisam bater com src/ui/shared.ts.
const SHARE_CACHE = 'rota-facil-compartilhado';

self.addEventListener('fetch', (event) => {
  const scope = self.registration.scope;
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.pathname !== new URL('compartilhar', scope).pathname) return;

  event.respondWith(
    (async () => {
      const home = new URL('./', scope);
      try {
        const form = await event.request.formData();
        const file = form.getAll('planilha').find((f) => f instanceof File);
        const cache = await caches.open(SHARE_CACHE);
        const key = new URL('planilha-compartilhada', scope).href;
        await cache.delete(key);
        if (file) {
          await cache.put(key, new Response(file, { headers: { 'X-File-Name': encodeURIComponent(file.name) } }));
          home.searchParams.set('compartilhado', '1');
        } else {
          home.searchParams.set('compartilhado', 'vazio');
        }
      } catch {
        home.searchParams.set('compartilhado', 'erro');
      }
      return Response.redirect(home.href, 303);
    })(),
  );
});
