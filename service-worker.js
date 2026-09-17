// =========================================================
// SERVICE-WORKER.JS - Warung Nafa233
// Versi minimal: TIDAK menyimpan cache file apapun. Tujuannya
// cuma supaya situs memenuhi syarat "Install ke HP" (PWA).
// Semua file selalu diambil langsung dari server (tidak ada
// data offline/basi lagi) - lebih lambat sedikit dari internet
// biasa, tapi tidak akan pernah nyangkut di versi lama.
// =========================================================
const CACHE_VERSION = "nafa233-v11";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(namaCacheList =>
      Promise.all(namaCacheList.map(nama => caches.delete(nama)))
    )
  );
  self.clients.claim();
});

// Sengaja TIDAK ada fetch handler yang meng-cache apapun -
// semua request lewat langsung ke jaringan seperti biasa.
