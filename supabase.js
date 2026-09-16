// =========================================================
// KONFIGURASI SUPABASE - Warung Nafa233
// Ambil nilai ini dari Supabase Dashboard > Project Settings > API
// =========================================================
const SUPABASE_URL = "https://sdsxrlgkdmzyltbwkoif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkc3hybGdrZG16eWx0Yndrb2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODE3NzIsImV4cCI6MjEwNDk1Nzc3Mn0.T7eWW0YnbExFAKUHl2EuUP78p-FEIkCExlSCyftr9ds";

// ---------- DIAGNOSTIK ON-PAGE (sementara, buat troubleshooting) ----------
function tampilkanDiagnostik(pesan, warna) {
  const tampilkan = () => {
    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:99999;padding:10px 14px;" +
      "font-family:monospace;font-size:12px;white-space:pre-wrap;" +
      "background:" + (warna || "#222") + ";color:#fff;";
    box.textContent = pesan;
    document.body.prepend(box);
  };
  if (document.body) tampilkan();
  else document.addEventListener("DOMContentLoaded", tampilkan);
}

let diagnostikTeks = "DIAGNOSTIK SUPABASE:\n";
diagnostikTeks += "window.supabase ada? " + (!!window.supabase) + "\n";
diagnostikTeks += "tipe window.supabase: " + typeof window.supabase + "\n";
if (window.supabase) {
  diagnostikTeks += "window.supabase.createClient tipe: " + typeof window.supabase.createClient + "\n";
  diagnostikTeks += "isi kunci window.supabase: " + Object.keys(window.supabase).join(", ") + "\n";
}

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  diagnostikTeks += "\n⚠️ LIBRARY GAGAL DIMUAT dari CDN.";
  tampilkanDiagnostik(diagnostikTeks, "#c0392b");
  throw new Error("Library Supabase (window.supabase) tidak ditemukan.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

diagnostikTeks += "\nClient berhasil dibuat.\n";
diagnostikTeks += "tipe supabase.auth: " + typeof supabase.auth + "\n";
diagnostikTeks += "tipe supabase.auth?.signInWithPassword: " + typeof (supabase.auth && supabase.auth.signInWithPassword);
tampilkanDiagnostik(diagnostikTeks, supabase.auth ? "#27ae60" : "#c0392b");

// Batas waktu pembayaran tunai (menit) sebelum otomatis pindah ke QRIS
const CASH_PAYMENT_TIMEOUT_MINUTES = 5;

// Batas maksimal jumlah produk berbeda
const MAX_PRODUCTS = 100;

// Nomor WhatsApp Warung Nafa233 (dipakai untuk tombol "Hubungi Admin")
const NOMOR_WA_PEMILIK = "62895367093942"; // format: kode negara tanpa + dan tanpa 0 di depan
