// =========================================================
// SERVICE-WORKER.JS - Warung Nafa233
// PENTING: setiap kali deploy update (ganti file apapun),
// NAIKKAN angka versi di bawah ini (misal v1 -> v2) supaya
// HP pelanggan/admin otomatis ambil file terbaru, bukan
// file lama yang ke-cache.
// =========================================================
const CACHE_VERSION = "nafa233-v5";

const FILE_APP_SHELL = [
  "./index.html",
  "./admin.html",
  "./style.css",
  "./common.js",
  "./store.js",
  "./admin.js",
  "./config.js",
  "./supabase-js.min.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./notif-pesanan.wav"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(FILE_APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(namaCacheList =>
      Promise.all(
        namaCacheList
          .filter(nama => nama !== CACHE_VERSION)
          .map(nama => caches.delete(nama))
      )
    )
  );
  self.clients.claim();
});

// Strategi: network-first untuk data (supaya produk/pesanan selalu terbaru),
// cache-first untuk file app shell (HTML/CSS/JS) supaya tetap bisa dibuka
// walau koneksi internet lambat/putus.
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Jangan cache request ke Supabase (data harus selalu real-time)
  if (url.includes("supabase.co")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
