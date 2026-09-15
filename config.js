// =========================================================
// KONFIGURASI SUPABASE - Warung Nafa233
// Ambil nilai ini dari Supabase Dashboard > Project Settings > API
// =========================================================
const SUPABASE_URL = "GANTI_DENGAN_PROJECT_URL"; // contoh: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "GANTI_DENGAN_ANON_PUBLIC_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Batas waktu pembayaran tunai (menit) sebelum otomatis pindah ke QRIS
const CASH_PAYMENT_TIMEOUT_MINUTES = 5;

// Batas maksimal jumlah produk berbeda
const MAX_PRODUCTS = 100;

// Nomor WhatsApp Warung Nafa233 (dipakai untuk tombol "Hubungi Admin")
const NOMOR_WA_PEMILIK = "62895367093942"; // format: kode negara tanpa + dan tanpa 0 di depan
