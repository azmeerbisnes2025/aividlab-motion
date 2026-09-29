# 📘 Panduan aividlab-motion (Bahasa Melayu)

Buat **video motion graphic** & **auto edit video UGC** (potong senyap + caption TikTok + sticker) terus dari komputer anda. Percuma, render dalam komputer sendiri.

> Oleh [aividlab.shop](https://aividlab.shop)

---

## 1. Apa yang anda perlukan

| Komputer | Boleh? |
|---|---|
| Windows 10/11 | ✅ melalui **WSL** (lihat langkah 2A) |
| Mac (M1/M2/M3/Intel) | ✅ |
| Linux / VPS Ubuntu | ✅ |
| Telefon / Chromebook | ❌ |

Minimum: RAM 4GB, ruang kosong 3GB. Lebih banyak CPU = render lebih laju.

---

## 2. Install (sekali sahaja, ~5-10 minit)

### 2A. Windows — pasang WSL dulu
1. Tekan butang **Start**, taip `PowerShell`, klik kanan → **Run as administrator**
2. Taip: `wsl --install` → Enter
3. **Restart** komputer
4. Selepas restart, tetingkap **Ubuntu** akan terbuka → cipta username & password (password tak nampak masa taip, itu normal)
5. Teruskan ke langkah 2C dalam tetingkap Ubuntu tu

### 2B. Mac — pasang Homebrew dulu
1. Buka **Terminal** (Cmd+Space → taip Terminal)
2. Tampal command dari https://brew.sh → Enter → ikut arahan

### 2C. Install aividlab-motion (semua komputer)
Tampal command ni dalam terminal → Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/azmeerbisnes2025/aividlab-motion/main/install.sh | bash
```

Tunggu sampai keluar **BERJAYA ✅**. Kemudian **tutup & buka semula terminal**.

Semak semua OK:
```bash
motion doctor
```

---

## 3. Cara guna

### 🎬 A. Video motion graphic (tanpa rakaman)

**Langkah 1** — Minta AI tuliskan skrip. Buka ChatGPT / Claude / DeepSeek / Gemini, tampal prompt dari fail [`PROMPT-AI.md`](PROMPT-AI.md), tukar bahagian produk anda.

**Langkah 2** — Simpan jawapan AI sebagai fail `iklan.json`:
```bash
nano iklan.json
```
Tampal → tekan `Ctrl+O`, Enter, `Ctrl+X`.

**Langkah 3** — Render:
```bash
motion render iklan.json -o iklan.mp4
```

**Langkah 4** — Ambil video:
- Windows: buka File Explorer, taip `\\wsl$\Ubuntu\home\<username>` di address bar
- Mac/Linux: fail ada dalam folder semasa

💡 Nak tengok dulu sebelum render penuh (laju):
```bash
motion sheet iklan.json -o preview.png
```

### ✂️ B. Auto edit video UGC (video anda bercakap)

Letak video dalam folder, kemudian:
```bash
motion ugc video-saya.mp4 --headline "Stop scroll!" --cta "Beli sekarang" --lang ms -o siap.mp4
```
Ia akan: potong bahagian senyap ✂️, tambah caption ikut perkataan 💬, zoom automatik 🔍, hook di depan & CTA di belakang 🎯.

Pilihan tambahan:
| Pilihan | Contoh | Maksud |
|---|---|---|
| `--sticker` | `--sticker "PROMO"` | sticker di awal |
| `--captions` | `pop` / `karaoke` / `boxed` / `minimal` / `off` | gaya caption |
| `--theme` | `aividlab` / `midnight` / `sunset` / `luxe` / `candy` / `mono` | warna & font |
| `--ratio` | `9:16` / `1:1` / `4:5` / `16:9` | saiz video |
| `--draft` | | render laju separuh resolusi (untuk test) |

### 🔥 C. UGC + motion graphic (paling power)
Guna JSON dengan scene `ugc` di tengah. Contoh: `examples/ugc-combo.json`.

---

## 4. Masalah biasa

| Masalah | Penyelesaian |
|---|---|
| `motion: command not found` | Tutup & buka semula terminal. Atau: `source ~/.bashrc` |
| Render lambat | Normal di laptop biasa (~1-3 min per 10 saat video). Guna `--draft` untuk test |
| Caption salah eja | Tambah `--lang ms` (Melayu) atau `--lang en` |
| `asset not found` | Pastikan nama fail video/gambar betul & dalam folder yang sama dengan JSON |
| Lain-lain | Jalankan `motion doctor`, screenshot, hantar ke group sokongan |

**Update ke versi terbaru:** jalankan semula command install (2C).

---

Mahu terus siap tanpa install? Guna **[aividlab.shop](https://aividlab.shop)** — video AI, gambar produk, dan banyak lagi dalam satu app.
