// Service worker : réseau d'abord, cache en secours pour le hors ligne.
const CACHE = 'mykitchen-v4'; // à incrémenter dès qu'un fichier change
const FICHIERS = [
  './', './index.html', './manifest.json',
  './css/style.css', './css/components.css',
  './js/app.js', './js/matching.js', './js/recipes.js', './js/storage.js', './js/ui.js',
  './assets/icons/icon.svg', './assets/icons/icon-maskable.svg',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png', './assets/icons/apple-touch-icon.png',
];
// Au-delà de ce délai (ms), un réseau trop lent cède la place à la copie en cache
const DELAI_RESEAU = 4000;

const POLICES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

/** Polices Google : cache d'abord, dans un cache conservé entre les versions. */
async function police(requete) {
  // Si le stockage est indisponible, la police vient simplement du réseau
  const cache = await caches.open('polices-mykitchen').catch(() => null);
  const enCache = await cache?.match(requete);
  if (enCache) return enCache;
  const reponse = await fetch(requete);
  if (reponse.ok) await cache?.put(requete, reponse.clone()).catch(() => {});
  return reponse;
}

self.addEventListener('install', (evenement) => {
  // `reload` contourne le cache HTTP pour ne pas précharger d'anciens fichiers
  evenement.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

// Premier passage : met en cache les polices chargées avant la prise de contrôle
self.addEventListener('message', (evenement) => {
  const adresses = evenement.data?.polices;
  if (!Array.isArray(adresses)) return;
  evenement.waitUntil(Promise.all(adresses
    .filter((a) => typeof a === 'string' && POLICES.some((origine) => a.startsWith(`${origine}/`)))
    .map((a) => police(new Request(a)).catch(() => {}))));
});

// Supprime les anciens caches de l'application
self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(caches.keys()
    .then((cles) => Promise.all(cles
      .filter((c) => c.startsWith('mykitchen-') && c !== CACHE)
      .map((c) => caches.delete(c))))
    .then(() => self.clients.claim()));
});

/** Copie en cache d'une requête (ou la page d'accueil pour une navigation). */
async function secours(requete) {
  try {
    const cache = await caches.open(CACHE);
    const enCache = await cache.match(requete, { ignoreSearch: true });
    if (enCache) return enCache;
    return requete.mode === 'navigate' ? await cache.match('./index.html') : undefined;
  } catch {
    return undefined; // stockage indisponible : le réseau reste utilisable
  }
}

function repondre(evenement) {
  const { request } = evenement;
  const reseau = fetch(request);
  // Seules les réponses complètes, directes et sans paramètres sont mises en cache
  // (évite un cache qui grossit sans limite ou une page de portail captif redirigée).
  // La copie est faite avant que la page ne lise la réponse.
  const copie = reseau.then((reponse) => (
    reponse.status === 200 && !reponse.redirected && !new URL(request.url).search ? reponse.clone() : null));
  // Garde le service worker actif jusqu'à la fin de l'écriture ; un échec est sans effet
  evenement.waitUntil(copie
    .then(async (c) => c && (await caches.open(CACHE)).put(request, c))
    .catch(() => {}));

  evenement.respondWith((async () => {
    let minuterie;
    // Réseau trop lent : la copie en cache répond, s'il y en a une
    const lent = new Promise((resoudre) => {
      minuterie = setTimeout(async () => {
        const enCache = await secours(request);
        if (enCache) resoudre(enCache);
      }, DELAI_RESEAU);
    });
    try {
      const reponse = await Promise.race([reseau, lent]);
      // Panne du serveur : mieux vaut la copie en cache
      if (reponse.status >= 500) return (await secours(request)) ?? reponse;
      return reponse;
    } catch {
      return (await secours(request)) ?? Response.error();
    } finally {
      clearTimeout(minuterie);
    }
  })());
}

self.addEventListener('fetch', (evenement) => {
  const { request } = evenement;
  if (request.method !== 'GET') return;
  const { origin } = new URL(request.url);
  if (origin === self.location.origin) repondre(evenement);
  else if (POLICES.includes(origin)) evenement.respondWith(police(request));
});
