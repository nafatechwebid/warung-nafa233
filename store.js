// =========================================================
// STORE.JS - Warung Nafa233 (sisi pelanggan) - versi Supabase
// =========================================================

let semuaProduk = [];
let tabAktif = "makanan";
let suhuAktif = "semua";
let ratingDipilih = 0;
let timerInterval = null;
let idPesananTerakhir = null;
let idPesananChatAktif = null;
let chatChannel = null;

// ---------- INIT ----------
window.addEventListener("DOMContentLoaded", () => {
  const wa = document.getElementById("waAdminBtn");
  wa.href = `https://wa.me/${NOMOR_WA_PEMILIK}?text=${encodeURIComponent("Halo Warung Nafa233, saya mau tanya-tanya.")}`;

  const sesi = ambilSesiPelanggan();
  if (sesi) {
    masukKeToko(sesi);
  }
  pasangBintang();
  daftarkanServiceWorker();
});

function login() {
  const nama = document.getElementById("inputNama").value.trim();
  const wa = document.getElementById("inputWa").value.trim();
  const errBox = document.getElementById("loginError");

  if (!nama || nama.length < 2) {
    errBox.textContent = "Nama wajib diisi.";
    return;
  }
  if (!/^0[0-9]{9,14}$/.test(wa)) {
    errBox.textContent = "Nomor WhatsApp tidak valid (contoh: 081234567890).";
    return;
  }
  errBox.textContent = "";
  simpanSesiPelanggan(nama, wa);
  masukKeToko({ nama, wa });
}

function masukKeToko(sesi) {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("tokoBox").classList.remove("hidden");
  document.getElementById("sesiInfo").innerHTML =
    `Halo, <strong>${sesi.nama}</strong> · <a href="#" onclick="keluar();return false;">Keluar</a>`;
  muatProduk();
  perbaruiTampilanKeranjang();
}

function keluar() {
  keluarSesiPelanggan();
  kosongkanKeranjang();
  location.reload();
}

// ---------- KATALOG ----------
async function muatProduk() {
  const { data, error } = await supabase
    .from("produk")
    .select("*")
    .eq("aktif", true)
    .order("nama");
  if (!error) {
    semuaProduk = data;
    renderProduk();
  }

  supabase.channel("produk-toko")
    .on("postgres_changes", { event: "*", schema: "public", table: "produk" }, () => muatProduk())
    .subscribe();
}

function gantiTab(tab) {
  document.getElementById("pesananSayaBox").classList.add("hidden");
  document.getElementById("daftarProduk").classList.remove("hidden");
  tabAktif = tab;
  suhuAktif = "semua";
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.getElementById("filterSuhu").classList.toggle("hidden", tab !== "minuman");
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.suhu === "semua"));
  renderProduk();
}

function filterSuhu(suhu) {
  suhuAktif = suhu;
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.suhu === suhu));
  renderProduk();
}

function renderProduk() {
  const wrap = document.getElementById("daftarProduk");
  let list = semuaProduk.filter(p => p.kategori === tabAktif);
  if (tabAktif === "minuman" && suhuAktif !== "semua") {
    list = list.filter(p => p.suhu === suhuAktif);
  }

  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada produk di kategori ini.</p>`;
    return;
  }

  wrap.innerHTML = list.map(p => `
    <div class="produk-card">
      ${p.gambar ? `<img src="${p.gambar}" class="produk-img">` : `<div class="produk-img placeholder">🍽️</div>`}
      <div class="produk-info">
        <h3>${p.nama}</h3>
        ${p.kategori === "minuman" ? `<span class="badge-suhu">${labelSuhu(p.suhu)}</span>` : ""}
        <p class="produk-harga">${formatRupiah(p.harga)}</p>
        <p class="produk-stok ${p.stok <= 0 ? "habis" : ""}">${p.stok > 0 ? "Stok: " + p.stok : "Stok habis"}</p>
        ${p.catatan ? `<p class="produk-catatan">📝 ${p.catatan}</p>` : ""}
        <button ${p.stok <= 0 ? "disabled" : ""} onclick="tambahKeKeranjang('${p.id}')">Tambah</button>
      </div>
    </div>
  `).join("");
}

// ---------- KERANJANG ----------
function tambahKeKeranjang(id) {
  const produk = semuaProduk.find(p => p.id === id);
  if (!produk) return;
  let items = ambilKeranjang();
  const ada = items.find(i => i.id === id);
  if (ada) {
    if (ada.qty >= produk.stok) { alert("Stok tidak mencukupi."); return; }
    ada.qty++;
  } else {
    items.push({
      id: produk.id,
      nama: produk.nama,
      harga: produk.harga,
      kategori: produk.kategori,
      suhu: produk.suhu || null,
      qty: 1
    });
  }
  simpanKeranjang(items);
  perbaruiTampilanKeranjang();
}

function ubahQty(id, delta) {
  let items = ambilKeranjang();
  const item = items.find(i => i.id === id);
  if (!item) return;
  const produk = semuaProduk.find(p => p.id === id);
  item.qty += delta;
  if (item.qty <= 0) {
    items = items.filter(i => i.id !== id);
  } else if (produk && item.qty > produk.stok) {
    item.qty = produk.stok;
  }
  simpanKeranjang(items);
  perbaruiTampilanKeranjang();
  renderIsiKeranjang();
}

function perbaruiTampilanKeranjang() {
  const items = ambilKeranjang();
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const total = totalKeranjang(items);
  const floatBox = document.getElementById("keranjangFloat");
  document.getElementById("jumlahItemCart").textContent = totalQty;
  document.getElementById("totalCart").textContent = formatRupiah(total);
  floatBox.classList.toggle("hidden", totalQty === 0);
}

function bukaKeranjang() {
  renderIsiKeranjang();
  document.getElementById("keranjangModal").classList.remove("hidden");
}

function renderIsiKeranjang() {
  const items = ambilKeranjang();
  const wrap = document.getElementById("isiKeranjang");
  if (items.length === 0) {
    wrap.innerHTML = `<p class="muted">Keranjang kosong.</p>`;
  } else {
    wrap.innerHTML = items.map(i => `
      <div class="cart-item">
        <div>
          <strong>${i.nama}</strong>
          ${i.suhu ? `<span class="badge-suhu-kecil">${labelSuhu(i.suhu)}</span>` : ""}
          <div class="muted">${formatRupiah(i.harga)} x ${i.qty}</div>
        </div>
        <div class="qty-control">
          <button onclick="ubahQty('${i.id}', -1)">-</button>
          <span>${i.qty}</span>
          <button onclick="ubahQty('${i.id}', 1)">+</button>
        </div>
      </div>
    `).join("");
  }
  document.getElementById("modalTotal").textContent = formatRupiah(totalKeranjang(items));
}

function tutupModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// ---------- CHECKOUT ----------
function lanjutCheckout() {
  const items = ambilKeranjang();
  if (items.length === 0) { alert("Keranjang masih kosong."); return; }
  tutupModal("keranjangModal");

  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  const jamDefault = now.toTimeString().slice(0, 5);
  document.getElementById("jamAmbil").value = jamDefault;
  perbaruiPreviewCatatan();

  muatPengaturanToko();
  tampilkanDetailBayar();
  document.getElementById("checkoutModal").classList.remove("hidden");
  document.getElementById("jamAmbil").oninput = perbaruiPreviewCatatan;
}

function perbaruiPreviewCatatan() {
  const items = ambilKeranjang();
  const jam = document.getElementById("jamAmbil").value || "-";
  document.getElementById("previewCatatanKesiapan").textContent = buatCatatanKesiapan(items, jam);
}

let pengaturanToko = {};
async function muatPengaturanToko() {
  const { data } = await supabase.from("pengaturan").select("*").eq("id", "toko").single();
  pengaturanToko = data || {};
  if (pengaturanToko.qris_url) {
    document.getElementById("qrisImg").src = pengaturanToko.qris_url;
    document.getElementById("qrisFallbackImg").src = pengaturanToko.qris_url;
  }
  renderRekening();
}

function renderRekening() {
  const rek = [pengaturanToko.bank1, pengaturanToko.bank2].filter(Boolean);
  const wrap = document.getElementById("daftarRekening");
  if (rek.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada data rekening dari admin.</p>`;
    return;
  }
  wrap.innerHTML = rek.map(r => `
    <div class="rekening-box">
      <strong>${r.bank}</strong><br>
      No. Rek: ${r.nomor}<br>
      a.n. ${r.atasNama}
    </div>
  `).join("");
}

function tampilkanDetailBayar() {
  const metode = document.getElementById("metodeBayar").value;
  document.getElementById("detailQris").classList.toggle("hidden", metode !== "qris");
  document.getElementById("detailTransfer").classList.toggle("hidden", metode !== "transfer");
  document.getElementById("detailTunai").classList.toggle("hidden", metode !== "tunai");
}

async function buatPesanan() {
  const sesi = ambilSesiPelanggan();
  const items = ambilKeranjang();
  const jamAmbil = document.getElementById("jamAmbil").value;
  const catatanTambahan = document.getElementById("catatanTambahan").value.trim();
  const metode = document.getElementById("metodeBayar").value;

  if (!jamAmbil) { alert("Isi jam pengambilan pesanan."); return; }

  const catatanKesiapan = buatCatatanKesiapan(items, jamAmbil);
  const catatanLengkap = catatanTambahan ? `${catatanKesiapan} Catatan tambahan: ${catatanTambahan}` : catatanKesiapan;

  const batasWaktuTunai = metode === "tunai"
    ? new Date(Date.now() + CASH_PAYMENT_TIMEOUT_MINUTES * 60000).toISOString()
    : null;

  const { data, error } = await supabase.rpc("buat_pesanan", {
    p_nama_pelanggan: sesi.nama,
    p_wa_pelanggan: sesi.wa,
    p_items: items,
    p_total: totalKeranjang(items),
    p_jam_ambil: jamAmbil,
    p_catatan: catatanLengkap,
    p_metode_bayar: metode,
    p_batas_waktu_tunai: batasWaktuTunai
  });

  if (error) {
    alert("Gagal membuat pesanan: " + error.message);
    return;
  }

  kosongkanKeranjang();
  perbaruiTampilanKeranjang();
  tutupModal("checkoutModal");

  document.getElementById("idPesananTampil").textContent = data.id;
  document.getElementById("catatanFinal").textContent = catatanLengkap;
  document.getElementById("statusPesananModal").classList.remove("hidden");
  idPesananTerakhir = data.id;

  if (metode === "tunai") {
    mulaiTimerTunai(data.id);
  } else {
    document.getElementById("timerTunaiBox").classList.add("hidden");
    document.getElementById("qrisFallbackBox").classList.add("hidden");
  }
}

function mulaiTimerTunai(idPesanan) {
  document.getElementById("timerTunaiBox").classList.remove("hidden");
  document.getElementById("qrisFallbackBox").classList.add("hidden");
  let sisaDetik = CASH_PAYMENT_TIMEOUT_MINUTES * 60;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    sisaDetik--;
    const m = String(Math.floor(sisaDetik / 60)).padStart(2, "0");
    const s = String(sisaDetik % 60).padStart(2, "0");
    document.getElementById("timerTunai").textContent = `${m}:${s}`;

    if (sisaDetik <= 0) {
      clearInterval(timerInterval);
      await supabase.rpc("alihkan_ke_qris", { p_pesanan_id: idPesanan });
      document.getElementById("timerTunaiBox").classList.add("hidden");
      document.getElementById("qrisFallbackBox").classList.remove("hidden");
    }
  }, 1000);
}

// ---------- PESANAN SAYA & CHAT ----------
async function bukaPesananSaya() {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === "pesanan_saya"));
  document.getElementById("filterSuhu").classList.add("hidden");
  document.getElementById("daftarProduk").classList.add("hidden");
  document.getElementById("pesananSayaBox").classList.remove("hidden");

  const sesi = ambilSesiPelanggan();
  if (!sesi) return;

  const muat = async () => {
    const { data } = await supabase
      .from("pesanan")
      .select("*")
      .eq("wa_pelanggan", sesi.wa)
      .order("created_at", { ascending: false });
    renderPesananSaya(data || []);
  };
  await muat();

  supabase.channel("pesanan-saya")
    .on("postgres_changes", { event: "*", schema: "public", table: "pesanan", filter: `wa_pelanggan=eq.${sesi.wa}` }, muat)
    .subscribe();
}

function renderPesananSaya(list) {
  const wrap = document.getElementById("listPesananSaya");
  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada riwayat pesanan.</p>`;
    return;
  }
  wrap.innerHTML = list.map(p => `
    <div class="pesanan-saya-card">
      <div class="pesanan-header">
        <strong>#${p.id.slice(0, 6)}</strong>
        <span class="badge-status">${p.status.replace("_", " ")}</span>
      </div>
      <div class="muted">${formatWaktu(p.created_at)} · Jam ambil: ${p.jam_ambil}</div>
      <div>Total: ${formatRupiah(p.total)}</div>
      <button onclick="bukaChat('${p.id}')">💬 Chat</button>
    </div>
  `).join("");
}

function bukaChatDariStatus() {
  if (idPesananTerakhir) bukaChat(idPesananTerakhir);
}

async function bukaChat(idPesanan) {
  idPesananChatAktif = idPesanan;
  document.getElementById("chatIdPesanan").textContent = "#" + idPesanan.slice(0, 6);
  document.getElementById("chatModal").classList.remove("hidden");

  const muat = async () => {
    const { data } = await supabase
      .from("chat")
      .select("*")
      .eq("pesanan_id", idPesanan)
      .order("created_at", { ascending: true });
    renderChatMessages(data || []);
  };
  await muat();

  if (chatChannel) supabase.removeChannel(chatChannel);
  chatChannel = supabase.channel("chat-" + idPesanan)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat", filter: `pesanan_id=eq.${idPesanan}` }, muat)
    .subscribe();
}

function renderChatMessages(list) {
  const wrap = document.getElementById("chatMessages");
  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada pesan. Mulai chat dengan penjual di sini.</p>`;
  } else {
    wrap.innerHTML = list.map(m => `
      <div class="chat-bubble ${m.pengirim === "pelanggan" ? "chat-kanan" : "chat-kiri"}">
        <div class="chat-nama">${m.pengirim === "pelanggan" ? "Kamu" : "Warung Nafa233"}</div>
        <div>${m.pesan}</div>
      </div>
    `).join("");
  }
  wrap.scrollTop = wrap.scrollHeight;
}

async function kirimChatPelanggan() {
  const input = document.getElementById("chatInputPesan");
  const pesan = input.value.trim();
  if (!pesan || !idPesananChatAktif) return;

  await supabase.from("chat").insert({
    pesanan_id: idPesananChatAktif,
    pengirim: "pelanggan",
    pesan: pesan
  });
  input.value = "";
}

function tutupChat() {
  document.getElementById("chatModal").classList.add("hidden");
  if (chatChannel) { supabase.removeChannel(chatChannel); chatChannel = null; }
  idPesananChatAktif = null;
}

// ---------- ULASAN ----------
function pasangBintang() {
  const spans = document.querySelectorAll("#bintangInput span");
  spans.forEach(sp => {
    sp.addEventListener("click", () => {
      ratingDipilih = parseInt(sp.dataset.v);
      spans.forEach(s => s.classList.toggle("aktif", parseInt(s.dataset.v) <= ratingDipilih));
    });
  });
}

async function kirimUlasan() {
  const sesi = ambilSesiPelanggan();
  const komentar = document.getElementById("komentarUlasan").value.trim();

  if (ratingDipilih === 0) { alert("Pilih bintang dulu ya."); return; }
  if (!sesi) { alert("Silakan login dulu untuk memberi ulasan."); return; }

  const { error } = await supabase.from("ulasan").insert({
    nama_pelanggan: sesi.nama,
    rating: ratingDipilih,
    komentar: komentar
  });

  if (!error) {
    document.getElementById("ulasanSukses").textContent = "Terima kasih atas ulasannya! ⭐";
    document.getElementById("komentarUlasan").value = "";
    ratingDipilih = 0;
    document.querySelectorAll("#bintangInput span").forEach(s => s.classList.remove("aktif"));
  }
}

// ---------- PWA: DAFTARKAN SERVICE WORKER ----------
function daftarkanServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(err => {
      console.log("Gagal daftar service worker:", err);
    });
  }
}
