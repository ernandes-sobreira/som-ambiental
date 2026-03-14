/* ================================================
   SoundScope — Service Worker
   Versão: 3.0

   O que este arquivo faz:
   1. INSTALA um cache com todos os arquivos do app
      na primeira vez que o usuário abre.
   2. INTERCEPTA requisições de rede: se o arquivo
      já está no cache, entrega offline sem precisar
      de conexão.
   3. ATUALIZA o cache automaticamente quando você
      mudar o CACHE_NAME abaixo (ex: v3.1 → v3.2).
   4. Garante que o app rode em contexto seguro,
      o que é exigido pelo navegador para liberar
      o acesso ao microfone via getUserMedia.
================================================ */

// ── Mude este nome sempre que atualizar o app ──
// O navegador vai baixar os arquivos novos e
// apagar o cache antigo automaticamente.
const CACHE_NAME = 'soundscope-v3.0';

// Arquivos que serão armazenados no cache
// (precisam existir no mesmo repositório)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Chart.js via CDN também entra no cache
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap',
];

/* ── INSTALL ─────────────────────────────────
   Evento disparado uma vez quando o SW é
   registrado pela primeira vez.
   Abre o cache e salva todos os ASSETS.
─────────────────────────────────────────── */
self.addEventListener('install', event => {
  console.log('[SW] Instalando cache:', CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // addAll faz o fetch de todos os arquivos e os
      // armazena. Se um falhar, a instalação inteira falha.
      // Por isso fonts/CDN estão separados — podem falhar
      // sem comprometer o app principal.
      return cache.addAll(['./index.html', './manifest.json'])
        .then(() => {
          // Tenta cachear recursos externos (falha silenciosa)
          const external = [
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
          ];
          return Promise.allSettled(external.map(url =>
            fetch(url).then(r => cache.put(url, r)).catch(() => {})
          ));
        });
    }).then(() => {
      // Ativa imediatamente sem esperar fechar outras abas
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE ────────────────────────────────
   Evento disparado quando o novo SW toma
   o controle. Remove caches antigos.
─────────────────────────────────────────── */
self.addEventListener('activate', event => {
  console.log('[SW] Ativando:', CACHE_NAME);

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // caches antigos
          .map(key => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim()) // assume controle imediato
  );
});

/* ── FETCH ───────────────────────────────────
   Intercepta TODA requisição de rede feita
   pelo app. Estratégia: Cache First.

   1. Busca no cache primeiro (resposta rápida).
   2. Se não encontrar, vai à rede.
   3. Salva a resposta da rede no cache para
      a próxima vez.
   4. Se a rede falhar e não tiver cache,
      retorna uma resposta de erro simples.

   EXCEÇÃO: Requisições ao Firebase (API do
   banco de dados) nunca passam pelo cache —
   precisam sempre ir à rede para ter dados
   atualizados em tempo real.
─────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase, Google APIs e fontes dinâmicas:
  // sempre vai à rede (network only)
  if (
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com/google.firestore') ||
    url.includes('firebaseapp.com') ||
    url.includes('identitytoolkit') ||
    url.includes('gstatic.com/firebasejs')
  ) {
    // Deixa passar direto para a rede
    return;
  }

  // Para tudo mais: Cache First com fallback à rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Encontrou no cache — entrega imediatamente
        // e atualiza o cache em background (stale-while-revalidate)
        const networkUpdate = fetch(event.request)
          .then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
              caches.open(CACHE_NAME).then(cache =>
                cache.put(event.request, response.clone())
              );
            }
            return response;
          })
          .catch(() => {}); // falha silenciosa se offline

        return cached; // entrega cache enquanto atualiza
      }

      // Não está no cache — busca na rede
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        // Salva no cache para uso futuro
        caches.open(CACHE_NAME).then(cache =>
          cache.put(event.request, response.clone())
        );
        return response;
      }).catch(() => {
        // Offline e sem cache — retorna página offline básica
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

/* ── MENSAGENS DO APP ────────────────────────
   Permite que o app force uma atualização
   do SW via postMessage (opcional).
─────────────────────────────────────────── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
