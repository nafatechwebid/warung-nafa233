// =========================================================
// SERVICE-WORKER.JS - Warung Nafa233
// PENTING: setiap kali deploy update (ganti file apapun),
// NAIKKAN angka versi di bawah ini (misal v1 -> v2) supaya
// HP pelanggan/admin otomatis ambil file terbaru, bukan
// file lama yang ke-cache.
// =========================================================
const CACHE_VERSION = "nafa233-v10";

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
  "./logo.png",
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

// Strategi: network-first untuk file kode (HTML/CSS/JS) supaya selalu
// pakai versi terbaru begitu ada koneksi, cache-first untuk aset statis
// (gambar/ikon/suara) yang jarang berubah. Data Supabase tidak di-cache
// sama sekali (selalu real-time).
self.addEventListener("fetch", event => {
  const url = event.request.url;

  if (url.includes("supabase.co")) return;

  const asetStatis = /\.(png|jpg|jpeg|wav|mp3|ico)$/i.test(url);

  if (asetStatis) {
    // Cache-first untuk aset statis
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(res => {
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  } else {
    // Network-first untuk HTML/CSS/JS supaya update selalu langsung kepakai
    event.respondWith(
      fetch(event.request)
        .then(res => {
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
