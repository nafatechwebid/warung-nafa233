// =========================================================
// KONFIGURASI SUPABASE - Warung Nafa233
// Ambil nilai ini dari Supabase Dashboard > Project Settings > API
// =========================================================
const SUPABASE_URL = "https://sdsxrlgkdmzyltbwkoif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkc3hybGdrZG16eWx0Yndrb2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODE3NzIsImV4cCI6MjEwNDk1Nzc3Mn0.T7eWW0YnbExFAKUHl2EuUP78p-FEIkCExlSCyftr9ds";

// Cek dulu apakah library Supabase (dari CDN) berhasil dimuat.
// Kalau gagal (misal diblokir VPN/jaringan/ad-blocker), kasih pesan jelas
// di layar alih-alih error teknis membingungkan seperti
// "Cannot read properties of undefined (reading 'signInWithPassword')".
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML =
      '<div style="padding:24px;font-family:sans-serif;color:#c0392b;">' +
      '⚠️ Gagal memuat library Supabase dari CDN.<br><br>' +
      'Kemungkinan penyebab: VPN, ad-blocker, atau koneksi internet sedang memblokir akses ke cdn.jsdelivr.net.<br><br>' +
      'Coba matikan VPN/ad-blocker, lalu muat ulang halaman ini.' +
      '</div>';
  });
  throw new Error("Library Supabase (window.supabase) tidak ditemukan. Cek koneksi/VPN/ad-blocker.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Batas waktu pembayaran tunai (menit) sebelum otomatis pindah ke QRIS
const CASH_PAYMENT_TIMEOUT_MINUTES = 5;

// Batas maksimal jumlah produk berbeda
const MAX_PRODUCTS = 100;

// Nomor WhatsApp Warung Nafa233 (dipakai untuk tombol "Hubungi Admin")
const NOMOR_WA_PEMILIK = "62895367093942"; // format: kode negara tanpa + dan tanpa 0 di depan
