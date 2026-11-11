/* App shell do álbum: versionado e restrito a arquivos estáticos da mesma origem. */
const CACHE_NAME = 'panini-album-check-2026-v2';
const CACHE_PREFIX = 'panini-album-check-2026-';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/data/panini_world_cup_2026.json',
  '/images-cards/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// O Vite nomeia JavaScript/CSS por hash. Sem buscá-los durante install,
// o navegador pode instalar o PWA e falhar no PRIMEIRO acesso offline.
async function discoverBundledAssets() {
  const response = await fetch('/', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível preparar o shell do app');
  const html = await response.text();
  return [...new Set(
    Array.from(html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.(?:js|css))["']/g))
      .map((match) => match[1])
  )];
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const bundle = await discoverBundledAssets();
    // Uma instalação incompleta não deve substituir o worker anterior.
    if (!bundle.some((path) => path.endsWith('.js'))) {
      throw new Error('Build sem entrypoint JavaScript');
    }
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([...APP_SHELL, ...bundle]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function staticRequest(url) {
  return url.pathname === '/' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.startsWith('/images-cards/') ||
    url.pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !staticRequest(url)) return;

  const navigation = request.mode === 'navigate';
  const networkFirst = navigation ||
    url.pathname.startsWith('/data/') ||
    url.pathname.endsWith('/manifest.json');

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (!networkFirst && cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      if (cached) return cached;
      if (navigation) {
        const root = await cache.match('/');
        if (root) return root;
      }
      return new Response('Recurso indisponível offline', { status: 503 });
    }
  })());
});
