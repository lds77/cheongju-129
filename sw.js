const CACHE_NAME = 'jikji-transport-v1';
const urlsToCache = [
  './app.html',
  './manifest.json',
  './index.html'
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열림');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('캐시 추가 실패:', err);
      })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }

        // 없으면 네트워크에서 가져오기
        return fetch(event.request).then(
          response => {
            // 유효하지 않은 응답은 캐시하지 않음
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 응답을 복사하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // 오프라인이고 캐시도 없으면 기본 페이지 반환
          return caches.match('./app.html');
        });
      })
  );
});
