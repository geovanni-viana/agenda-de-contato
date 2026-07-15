/**
 * service-worker.js
 * Fica entre o app e a rede: guarda o "app shell" (HTML, manifest, ícones)
 * em cache para que a Agenda de Contatos abra normalmente offline.
 *
 * Estratégia:
 * - install  -> pré-armazena o app shell numa cache versionada.
 * - activate -> remove caches de versões antigas.
 * - fetch    -> "stale-while-revalidate": responde com o que já está em
 *               cache (rápido, funciona offline) e, em paralelo, busca uma
 *               versão nova na rede para atualizar a cache silenciosamente.
 *               Se não houver cache nem rede, cai para index.html (útil em
 *               navegações diretas).
 *
 * Como os contatos em si vivem no LocalStorage (não na rede), o app funciona
 * 100% offline depois da primeira visita.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `agenda-de-contatos-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('agenda-de-contatos-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Só cuida de requisições GET dentro da própria origem.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      if (cached) {
        // Atualiza em segundo plano, mas responde já com o que temos.
        networkFetch;
        return cached;
      }

      const fromNetwork = await networkFetch;
      if (fromNetwork) return fromNetwork;

      // Sem cache e sem rede: para navegações, cai para o app shell.
      if (request.mode === 'navigate') {
        return cache.match('./index.html');
      }

      return Response.error();
    })
  );
});
