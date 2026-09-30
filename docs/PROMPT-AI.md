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
- Bunyi efek (sfx) ada dalam engine: `whoosh | ding | pop | rumble`.
  Scene `hook`, `stat`, `price`, `steps`, `cta` dapat bunyi automatik. Scene lain: tambah `"sfx": "pop"`.
  Nak senyapkan scene yang dah automatik: `"sfx": false`. Terperinci: `{"sfx": {"name": "ding", "volume": 0.8, "at": 0.3}}`.

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

### Untuk video explainer (anda bercakap + grafik pop atas anda)
1. Jalankan `motion transcript video-saya.mp4 --lang ms` → salin hasil (masa + ayat).
2. Tampal ke AI bersama ayat ni:
```
Ini transkrip video aku (masa dalam saat). Tulis SATU spec JSON aividlab-motion:
satu scene {"type":"ugc","src":"video-saya.mp4","captions":"boxed","captionPosition":"bottom","language":"ms","overlays":[...]}
Setiap 2-3 saat letak SATU overlay ikut apa aku cakap masa tu. Jenis overlay:
  glitch   {text:"1 PERKATAAN", sub?}                 - pembuka / kata kunci besar
  emphasis {text:"baris putih", highlight:"baris berkotak"}
  number   {value:"1", text:"poin", sub?}             - bila sebut poin 1/2/3
  cards    {text:"tajuk", images:["a.png","b.png","c.png"]}
  flow     {text:"tajuk", items:["Hook","Proof","USP"]}  - langkah / proses
  focus    {src:"produk.png", text, sub?}             - tunjuk produk
  screen   {src:"screenshot.png", text}               - tunjuk app / website
  split    {src:"demo.mp4 atau gambar.png", text}      - contoh hasil atas, aku bawah
Setiap overlay ada "at" (saat dari transkrip) dan "duration" (1.5-3). Teks pendek, max 4 perkataan.
Balas JSON sahaja.
```

### Video promo / tutorial (anda bercakap dari mula sampai habis + tunjuk app anda)
1. Rakam 2-3 klip pendek (pembuka → tunjuk sistem → ajak subscribe/beli). Ambil screenshot app/website anda.
2. `motion transcript` setiap klip.
3. Minta AI ikut contoh `examples/tutorial-promo-multiclip.json`: guna `split` & `screen` dengan screenshot anda banyak kali, akhiri dengan scene `cta` pendek.
4. Caption salah eja jenama? Tambah `"captionFix": {"salah":"betul"}` dalam scene ugc.

### Tips
- AI bagi teks panjang? Tak apa, engine potong & betulkan sendiri.
- Tak puas hati? Balas AI: *"buat lebih punchy, tukar theme sunset"*.
- Pengguna AI agent (Hermes / Claude Code / OpenClaw): skill dah dipasang automatik — cakap sahaja *"buat video motion graphic promo produk X"*.
