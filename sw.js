// バージョン（キャッシュ名）は version.js で管理する。画面の表示と共通
importScripts('./version.js');
const CACHE = self.APP_CACHE;   // 例：tag-palette-rev37
const FILES = ['./', './index.html', './version.js', './manifest.json', './sw.js', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './ogp.png'];

self.addEventListener('install', (e) => {
  // ブラウザのHTTPキャッシュを通さず、必ずサーバーから最新を取る
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// ネット優先（毎回サーバーに更新を確認）・オフライン時はキャッシュ
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        // 共有で開いたとき（?text=… 付き）はキャッシュに溜めない
        if (res.ok && !new URL(e.request.url).search) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
