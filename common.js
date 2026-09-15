// =========================================================
// COMMON.JS - Warung Nafa233
// Fungsi & helper yang dipakai bersama oleh index.html (toko)
// dan admin.html (panel admin)
// =========================================================

const KATEGORI = {
  MAKANAN: "makanan",
  MINUMAN: "minuman",
  MIE_INSTAN: "mie_instan"
};

const SUHU = {
  HOT: "hot",
  COLD: "cold"
};

// ---------- FORMAT ----------
function formatRupiah(angka) {
  const n = Number(angka) || 0;
  return "Rp" + n.toLocaleString("id-ID");
}

function formatWaktu(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function labelKategori(kat) {
  if (kat === KATEGORI.MAKANAN) return "Makanan";
  if (kat === KATEGORI.MINUMAN) return "Minuman";
  if (kat === KATEGORI.MIE_INSTAN) return "Mie Instan";
  return kat;
}

function labelSuhu(suhu) {
  if (suhu === SUHU.HOT) return "🔥 Hangat/Panas";
  if (suhu === SUHU.COLD) return "🧊 Dingin";
  return "";
}

// Saran otomatis catatan khusus berdasarkan isi keranjang & jam ambil
function buatCatatanKesiapan(items, jamAmbil) {
  const adaMinumanHot = items.some(i => i.kategori === KATEGORI.MINUMAN && i.suhu === SUHU.HOT);
  const adaMinumanCold = items.some(i => i.kategori === KATEGORI.MINUMAN && i.suhu === SUHU.COLD);
  const adaMie = items.some(i => i.kategori === KATEGORI.MIE_INSTAN);

  const catatan = [];
  catatan.push(`Pesanan mohon disiapkan & diambil sekitar pukul ${jamAmbil}.`);
  if (adaMinumanHot) catatan.push("Minuman hangat/panas: mohon diseduh/disiapkan mendekati jam ambil agar tetap hangat saat diambil.");
  if (adaMinumanCold) catatan.push("Minuman dingin: mohon disiapkan dengan es mendekati jam ambil agar tetap dingin saat diambil.");
  if (adaMie) catatan.push("Mie instan: mohon dimasak mendekati jam ambil agar tetap hangat saat disantap.");
  return catatan.join(" ");
}

// ---------- SESI PELANGGAN (login nama + WA, disimpan di localStorage) ----------
function simpanSesiPelanggan(nama, wa) {
  localStorage.setItem("nafa233_nama", nama);
  localStorage.setItem("nafa233_wa", wa);
}

function ambilSesiPelanggan() {
  const nama = localStorage.getItem("nafa233_nama");
  const wa = localStorage.getItem("nafa233_wa");
  if (!nama || !wa) return null;
  return { nama, wa };
}

function keluarSesiPelanggan() {
  localStorage.removeItem("nafa233_nama");
  localStorage.removeItem("nafa233_wa");
}

// ---------- KERANJANG (disimpan di sessionStorage, per sesi kunjungan) ----------
function ambilKeranjang() {
  const raw = sessionStorage.getItem("nafa233_cart");
  return raw ? JSON.parse(raw) : [];
}

function simpanKeranjang(items) {
  sessionStorage.setItem("nafa233_cart", JSON.stringify(items));
}

function kosongkanKeranjang() {
  sessionStorage.removeItem("nafa233_cart");
}

function totalKeranjang(items) {
  return items.reduce((sum, i) => sum + i.harga * i.qty, 0);
}

// ---------- UTIL GAMBAR (disimpan sbg base64 di kolom text Postgres) ----------
function fileKeBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}
