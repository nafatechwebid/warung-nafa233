// =========================================================
// ADMIN.JS - Warung Nafa233 (sisi admin) - versi Supabase Auth
// =========================================================

let produkList = [];
let pesananList = [];
let ulasanList = [];
let gambarBase64Sementara = null;
let qrisBase64Sementara = null;
let chatChannelAdmin = null;
let idPesananChatAdminAktif = null;

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("batasProdukTampil").textContent = MAX_PRODUCTS;
  document.getElementById("waAdminBtnAdmin").href = `https://wa.me/${NOMOR_WA_PEMILIK}`;

  const { data } = await sb.auth.getSession();
  if (data.session) {
    masukAdmin();
  }

  document.getElementById("fGambar").addEventListener("change", e => {
    if (e.target.files[0]) {
      fileKeBase64(e.target.files[0], b64 => {
        gambarBase64Sementara = b64;
        const img = document.getElementById("previewGambar");
        img.src = b64;
        img.classList.remove("hidden");
      });
    }
  });

  document.getElementById("fQris").addEventListener("change", e => {
    if (e.target.files[0]) {
      fileKeBase64(e.target.files[0], b64 => {
        qrisBase64Sementara = b64;
        const img = document.getElementById("previewQris");
        img.src = b64;
        img.classList.remove("hidden");
      });
    }
  });

  daftarkanServiceWorkerAdmin();
});

// ---------- LOGIN ADMIN (Supabase Auth beneran) ----------
async function loginAdmin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPass").value;
  const errBox = document.getElementById("adminLoginError");

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) {
    errBox.textContent = "Login gagal: " + error.message;
    return;
  }
  errBox.textContent = "";
  masukAdmin();
}

function logoutAdmin() {
  sb.auth.signOut().then(() => location.reload());
}

function masukAdmin() {
  document.getElementById("adminLoginBox").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  document.getElementById("btnKeluarAdmin").classList.remove("hidden");
  muatProdukAdmin();
  muatPesananAdmin();
  muatPengaturanAdmin();
  muatUlasanAdmin();
}

function gantiTabAdmin(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.add("hidden"));
  document.getElementById("tab" + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove("hidden");
  document.querySelectorAll(".tab-nav .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
}

// ---------- PRODUK ----------
function toggleSuhuField() {
  const kat = document.getElementById("fKategori").value;
  document.getElementById("suhuFieldBox").classList.toggle("hidden", kat !== "minuman");
}

async function muatProdukAdmin() {
  const muat = async () => {
    const { data } = await sb.from("produk").select("*").order("nama");
    produkList = data || [];
    document.getElementById("jumlahProdukSaatIni").textContent = produkList.length;
    renderProdukAdmin();
  };
  await muat();

  sb.channel("produk-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "produk" }, muat)
    .subscribe();
}

function renderProdukAdmin() {
  const cari = document.getElementById("cariProduk").value.toLowerCase();
  const wrap = document.getElementById("listProdukAdmin");
  const list = produkList.filter(p => p.nama.toLowerCase().includes(cari));

  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada produk.</p>`;
    return;
  }

  wrap.innerHTML = list.map(p => `
    <div class="admin-produk-row">
      ${p.gambar ? `<img src="${p.gambar}" class="admin-produk-thumb">` : `<div class="admin-produk-thumb placeholder">🍽️</div>`}
      <div class="admin-produk-detail">
        <strong>${p.nama}</strong> ${!p.aktif ? '<span class="badge-nonaktif">Nonaktif</span>' : ""}
        <div class="muted">${labelKategori(p.kategori)} ${p.suhu ? "· " + labelSuhu(p.suhu) : ""}</div>
        <div class="muted">${formatRupiah(p.harga)} · Stok: <input type="number" value="${p.stok}" class="stok-inline" onchange="updateStokCepat('${p.id}', this.value)"></div>
      </div>
      <div class="admin-produk-aksi">
        <button onclick="editProduk('${p.id}')">Edit</button>
        <button class="btn-danger" onclick="hapusProduk('${p.id}')">Hapus</button>
      </div>
    </div>
  `).join("");
}

async function updateStokCepat(id, val) {
  await sb.from("produk").update({ stok: parseInt(val) || 0 }).eq("id", id);
}

async function simpanProduk() {
  const id = document.getElementById("editId").value;
  const nama = document.getElementById("fNama").value.trim();
  const kategori = document.getElementById("fKategori").value;
  const suhu = kategori === "minuman" ? document.getElementById("fSuhu").value : null;
  const harga = parseInt(document.getElementById("fHarga").value);
  const stok = parseInt(document.getElementById("fStok").value);
  const catatan = document.getElementById("fCatatan").value.trim();
  const aktif = document.getElementById("fAktif").checked;
  const errBox = document.getElementById("produkError");

  if (!nama || isNaN(harga) || isNaN(stok)) {
    errBox.textContent = "Nama, harga, dan stok wajib diisi dengan benar.";
    return;
  }
  if (!id && produkList.length >= MAX_PRODUCTS) {
    errBox.textContent = `Batas maksimal ${MAX_PRODUCTS} produk sudah tercapai.`;
    return;
  }
  errBox.textContent = "";

  const data = { nama, kategori, suhu, harga, stok, catatan, aktif };
  if (gambarBase64Sementara) data.gambar = gambarBase64Sementara;

  const { error } = id
    ? await sb.from("produk").update(data).eq("id", id)
    : await sb.from("produk").insert(data);

  if (error) {
    errBox.textContent = "Gagal menyimpan: " + error.message;
    return;
  }
  resetFormProduk();
}

function editProduk(id) {
  const p = produkList.find(x => x.id === id);
  if (!p) return;
  document.getElementById("editId").value = p.id;
  document.getElementById("fKategori").value = p.kategori;
  toggleSuhuField();
  if (p.suhu) document.getElementById("fSuhu").value = p.suhu;
  document.getElementById("fNama").value = p.nama;
  document.getElementById("fHarga").value = p.harga;
  document.getElementById("fStok").value = p.stok;
  document.getElementById("fCatatan").value = p.catatan || "";
  document.getElementById("fAktif").checked = p.aktif;
  if (p.gambar) {
    document.getElementById("previewGambar").src = p.gambar;
    document.getElementById("previewGambar").classList.remove("hidden");
  }
  window.scrollTo(0, 0);
}

function resetFormProduk() {
  document.getElementById("editId").value = "";
  document.getElementById("fNama").value = "";
  document.getElementById("fHarga").value = "";
  document.getElementById("fStok").value = "";
  document.getElementById("fCatatan").value = "";
  document.getElementById("fAktif").checked = true;
  document.getElementById("previewGambar").classList.add("hidden");
  gambarBase64Sementara = null;
}

async function hapusProduk(id) {
  if (!confirm("Hapus produk ini?")) return;
  await sb.from("produk").delete().eq("id", id);
}

// ---------- PESANAN ----------
async function muatPesananAdmin() {
  const muat = async () => {
    const { data } = await sb.from("pesanan").select("*").order("created_at", { ascending: false });
    pesananList = data || [];
    renderPesananAdmin();
  };
  await muat();

  sb.channel("pesanan-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "pesanan" }, muat)
    .subscribe();
}

function renderPesananAdmin() {
  const filter = document.getElementById("filterStatusPesanan").value;
  const wrap = document.getElementById("listPesananAdmin");
  let list = pesananList;
  if (filter !== "semua") list = list.filter(p => p.status === filter);

  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">Tidak ada pesanan.</p>`;
    return;
  }

  wrap.innerHTML = list.map(p => {
    const beralihOtomatis = p.batas_waktu_tunai && p.metode_bayar === "qris";
    return `
    <div class="admin-pesanan-card">
      <div class="pesanan-header">
        <strong>${p.nama_pelanggan}</strong> (${p.wa_pelanggan})
        <span class="badge-status">${p.status.replace("_", " ")}</span>
      </div>
      <div class="muted">Waktu pesan: ${formatWaktu(p.created_at)}</div>
      <div class="muted">Jam ambil: ${p.jam_ambil} · Metode bayar: ${p.metode_bayar}</div>
      ${beralihOtomatis ? `<div class="preview-catatan">⚠️ Awalnya bayar tunai, tapi 5 menit habis sebelum dibayar sehingga sistem otomatis pindah ke QRIS. Kalau pelanggan ternyata sudah/tetap bayar tunai langsung di warung, klik tombol di bawah.</div>` : ""}
      <ul class="pesanan-items">
        ${p.items.map(i => `<li>${i.nama} x${i.qty} — ${formatRupiah(i.harga * i.qty)}</li>`).join("")}
      </ul>
      <div><strong>Total: ${formatRupiah(p.total)}</strong></div>
      <div class="preview-catatan">📝 ${p.catatan}</div>
      <div class="pesanan-aksi">
        <select onchange="updateStatusPesanan('${p.id}', this.value)">
          <option value="menunggu_bayar" ${p.status === "menunggu_bayar" ? "selected" : ""}>Menunggu Bayar</option>
          <option value="dibayar" ${p.status === "dibayar" ? "selected" : ""}>Dibayar</option>
          <option value="diproses" ${p.status === "diproses" ? "selected" : ""}>Diproses</option>
          <option value="selesai" ${p.status === "selesai" ? "selected" : ""}>Selesai</option>
          <option value="dibatalkan" ${p.status === "dibatalkan" ? "selected" : ""}>Dibatalkan</option>
        </select>
        <button onclick="bukaChatAdmin('${p.id}', '${p.nama_pelanggan.replace(/'/g, "")}')">💬 Chat</button>
        ${beralihOtomatis ? `<button class="btn-approve" onclick="setujuiPembayaranTunai('${p.id}')">✅ Setujui Bayar Tunai</button>` : ""}
      </div>
    </div>
  `;
  }).join("");
}

async function setujuiPembayaranTunai(id) {
  if (!confirm("Konfirmasi: pelanggan sudah bayar TUNAI langsung di warung? Status akan diubah jadi Dibayar dan metode bayar dikembalikan ke Tunai.")) return;
  await sb.from("pesanan").update({ metode_bayar: "tunai", status: "dibayar" }).eq("id", id);
}

async function updateStatusPesanan(id, status) {
  await sb.from("pesanan").update({ status }).eq("id", id);
}

// ---------- PENGATURAN ----------
async function muatPengaturanAdmin() {
  const { data } = await sb.from("pengaturan").select("*").eq("id", "toko").single();
  if (!data) return;
  if (data.qris_url) {
    document.getElementById("previewQris").src = data.qris_url;
    document.getElementById("previewQris").classList.remove("hidden");
  }
  if (data.bank1) {
    document.getElementById("bank1Nama").value = data.bank1.bank || "";
    document.getElementById("bank1Nomor").value = data.bank1.nomor || "";
    document.getElementById("bank1AtasNama").value = data.bank1.atasNama || "";
  }
  if (data.bank2) {
    document.getElementById("bank2Nama").value = data.bank2.bank || "";
    document.getElementById("bank2Nomor").value = data.bank2.nomor || "";
    document.getElementById("bank2AtasNama").value = data.bank2.atasNama || "";
  }
}

async function simpanQris() {
  if (!qrisBase64Sementara) { alert("Pilih gambar QRIS dulu."); return; }
  const { error } = await sb.from("pengaturan").update({ qris_url: qrisBase64Sementara }).eq("id", "toko");
  if (!error) alert("QRIS berhasil disimpan.");
}

async function simpanRekening() {
  const bank1 = {
    bank: document.getElementById("bank1Nama").value.trim(),
    nomor: document.getElementById("bank1Nomor").value.trim(),
    atasNama: document.getElementById("bank1AtasNama").value.trim()
  };
  const bank2 = {
    bank: document.getElementById("bank2Nama").value.trim(),
    nomor: document.getElementById("bank2Nomor").value.trim(),
    atasNama: document.getElementById("bank2AtasNama").value.trim()
  };

  const data = {};
  if (bank1.bank && bank1.nomor) data.bank1 = bank1;
  if (bank2.bank && bank2.nomor) data.bank2 = bank2;

  const { error } = await sb.from("pengaturan").update(data).eq("id", "toko");
  if (!error) document.getElementById("pengaturanSukses").textContent = "Data rekening disimpan.";
}

// ---------- ULASAN ----------
async function muatUlasanAdmin() {
  const muat = async () => {
    const { data } = await sb.from("ulasan").select("*").order("created_at", { ascending: false });
    ulasanList = data || [];
    renderUlasanAdmin();
  };
  await muat();

  sb.channel("ulasan-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "ulasan" }, muat)
    .subscribe();
}

function renderUlasanAdmin() {
  const wrap = document.getElementById("listUlasanAdmin");
  document.getElementById("jumlahUlasan").textContent = ulasanList.length;

  if (ulasanList.length > 0) {
    const rata = ulasanList.reduce((s, u) => s + u.rating, 0) / ulasanList.length;
    document.getElementById("rataRating").textContent = rata.toFixed(1);
  }

  if (ulasanList.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada ulasan.</p>`;
    return;
  }

  wrap.innerHTML = ulasanList.map(u => `
    <div class="admin-ulasan-row">
      <strong>${u.nama_pelanggan}</strong> — ${"★".repeat(u.rating)}${"☆".repeat(5 - u.rating)}
      <div class="muted">${formatWaktu(u.created_at)}</div>
      ${u.komentar ? `<p>${u.komentar}</p>` : `<p class="muted">Tanpa komentar.</p>`}
    </div>
  `).join("");
}

// ---------- CHAT ----------
async function bukaChatAdmin(idPesanan, namaPelanggan) {
  idPesananChatAdminAktif = idPesanan;
  document.getElementById("chatIdPesananAdmin").textContent = "#" + idPesanan.slice(0, 6);
  document.getElementById("chatNamaPelangganAdmin").textContent = "Pelanggan: " + namaPelanggan;
  document.getElementById("chatModalAdmin").classList.remove("hidden");

  const muat = async () => {
    const { data } = await supabase
      .from("chat")
      .select("*")
      .eq("pesanan_id", idPesanan)
      .order("created_at", { ascending: true });
    renderChatMessagesAdmin(data || []);
  };
  await muat();

  if (chatChannelAdmin) sb.removeChannel(chatChannelAdmin);
  chatChannelAdmin = sb.channel("chat-admin-" + idPesanan)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat", filter: `pesanan_id=eq.${idPesanan}` }, muat)
    .subscribe();
}

function renderChatMessagesAdmin(list) {
  const wrap = document.getElementById("chatMessagesAdmin");
  if (list.length === 0) {
    wrap.innerHTML = `<p class="muted">Belum ada pesan dari pelanggan ini.</p>`;
  } else {
    wrap.innerHTML = list.map(m => `
      <div class="chat-bubble ${m.pengirim === "admin" ? "chat-kanan" : "chat-kiri"}">
        <div class="chat-nama">${m.pengirim === "admin" ? "Warung Nafa233" : "Pelanggan"}</div>
        <div>${m.pesan}</div>
      </div>
    `).join("");
  }
  wrap.scrollTop = wrap.scrollHeight;
}

async function kirimChatAdmin() {
  const input = document.getElementById("chatInputPesanAdmin");
  const pesan = input.value.trim();
  if (!pesan || !idPesananChatAdminAktif) return;

  await sb.from("chat").insert({
    pesanan_id: idPesananChatAdminAktif,
    pengirim: "admin",
    pesan: pesan
  });
  input.value = "";
}

function tutupChatAdmin() {
  document.getElementById("chatModalAdmin").classList.add("hidden");
  if (chatChannelAdmin) { sb.removeChannel(chatChannelAdmin); chatChannelAdmin = null; }
  idPesananChatAdminAktif = null;
}

// ---------- PWA ----------
function daftarkanServiceWorkerAdmin() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}
