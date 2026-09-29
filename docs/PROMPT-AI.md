# 🤖 Prompt siap untuk AI (ChatGPT / Claude / DeepSeek / Gemini / Qwen)

Salin **semua** dalam kotak di bawah, tampal ke AI, tukar bahagian `[PRODUK SAYA]`.

```
Kau pengarah kreatif iklan video pendek. Tulis SATU spec JSON untuk engine "aividlab-motion".
Balas JSON SAHAJA, tanpa penerangan.

PRODUK SAYA:
- Nama: [contoh: Tudung Satin Aira]
- Harga: [contoh: RM49, harga asal RM79]
- Kelebihan: [contoh: tak panas, tak perlu iron, 12 warna]
- Sasaran: [contoh: wanita bekerja 25-40]
- Website/WhatsApp: [contoh: aira.my]
- Gambar produk (jika ada, nama fail): [contoh: tudung.png atau kosongkan]

PERATURAN:
- ratio "9:16", theme pilih satu: aividlab | midnight | sunset | luxe | candy | mono
- 7-9 scene, jumlah 20-30 saat. Mula dengan "hook", akhir dengan "cta".
- Teks PENDEK: headline maksimum 6 perkataan, item senarai maksimum 5 perkataan.
- Bahasa Melayu santai, gaya iklan Malaysia.
- Jenis scene yang dibenarkan SAHAJA:
  hook     {headline, sub?, emoji?, highlight?}
  kinetic  {lines:[2-4 baris pendek], highlight?}
  stat     {value:"10,000+", label, sub?}
  product  {src, headline, sub?, features:[max 4]}
  bullets  {headline, items:[max 5]}
  compare  {headline, left:{label, items[]}, right:{label, items[]}}
  quote    {quote, author, role?, rating:5}
  steps    {headline, steps:[max 4]}
  chart    {headline, data:[{label, value}], suffix?}
  price    {headline, price, oldPrice?, badge?, sub?}
  image    {src, headline?, sub?}
  logo     {src?, headline, sub?}
  cta      {headline, button, url?}
- "highlight" = perkataan dalam headline yang nak diwarnakan.

Format:
{"ratio":"9:16","theme":"...","transition":"slide","scenes":[ ... ]}
```

---

### Untuk video UGC + motion
Tambah ayat ni dalam prompt:
```
Letak scene ke-2 sebagai:
{"type":"ugc","src":"video-saya.mp4","captions":"pop","language":"ms",
 "overlays":[{"type":"sticker","text":"...","at":0.5},{"type":"cta","text":"...","at":6}]}
```

### Tips
- AI bagi teks panjang? Tak apa, engine potong & betulkan sendiri.
- Tak puas hati? Balas AI: *"buat lebih punchy, tukar theme sunset"*.
- Pengguna AI agent (Hermes / Claude Code / OpenClaw): skill dah dipasang automatik — cakap sahaja *"buat video motion graphic promo produk X"*.
