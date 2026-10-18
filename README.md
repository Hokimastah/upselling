# Peluang Upselling Frozen Food

Dashboard presentasi untuk Divisi Pemasaran: tiga ide upselling ke pelanggan rutin,
berdasarkan data penjualan April–September 2020.

Halaman ini statis (HTML + CSS + JavaScript biasa, tanpa library dan tanpa proses build),
jadi bisa langsung di-host di GitHub Pages dari root repository.

## Isi repository

| Berkas | Fungsi |
|---|---|
| `index.html` | Halaman dashboard (narasi + grafik) |
| `dashboard/assets/style.css` | Tampilan, termasuk mode terang/gelap |
| `dashboard/assets/app.js` | Menggambar grafik SVG, kalkulator potensi, tabel target |
| `dashboard/assets/data.js` | Angka hasil analisis (dibuat otomatis, jangan diedit manual) |
| `dashboard/analisis/build_data.py` | Skrip yang menghitung semua angka dari file Excel |
| `dataset/` | 6 file Excel laporan penjualan (sumber data) |
| `.nojekyll` | Supaya GitHub Pages menyajikan file apa adanya |

## Deploy ke GitHub Pages

1. Commit dan push perubahan ke branch `main`.
2. Di GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
3. Setelah 1–2 menit dashboard tersedia di `https://<akun>.github.io/<nama-repo>/`.

Catatan: halaman memuat nama pelanggan (tabel target). Bila repository publik, nama tersebut
dapat dilihat siapa saja.

Untuk melihat secara lokal: buka `index.html` langsung di browser, atau jalankan
`python -m http.server` di folder ini lalu buka `http://localhost:8000`.

## Memperbarui angka

Semua angka (termasuk yang ada di kalimat narasi) dibaca dari `dashboard/assets/data.js`.
Bila data Excel berubah, jalankan ulang dari root repository:

```bash
pip install pandas openpyxl
python dashboard/analisis/build_data.py
```

Skrip membaca folder `dataset/` (atau lokasi lain lewat `--dataset "path"`), memeriksa bahwa total
tiap file cocok dengan baris total di Excel, lalu menulis ulang `dashboard/assets/data.js`.
Setelah memperbarui, naikkan angka `?v=` pada `index.html` agar browser tidak memakai versi lama dari cache.

## Alur cerita (Storytelling with Data)

1. **Konteks:** omzet naik-turun mengikuti Otak-Otak (22% omzet).
2. **Sasaran:** 98 pelanggan rutin menghasilkan 87% omzet.
3. **Peluang produk:** es krim sering dibeli ulang, tetapi baru dibeli 29% pelanggan rutin.
4. **Tiga program:** Coba Es Krim · Paket Otak-Otak + Olahan Ikan · Genapkan ke Dus.
5. **Potensi:** hingga Rp24,6 jt per bulan, dengan kalkulator skenario.
6. **Target:** daftar 89 pelanggan, 20 teratas memegang 64% potensi.
7. **Keputusan:** setujui pilot 3 bulan untuk 20 pelanggan prioritas, dengan kriteria keberhasilan dan pembanding.

Saat presentasi: tombol **→ / PageDown** pindah ke bagian berikutnya, **← / PageUp** ke bagian sebelumnya
(juga bekerja dengan clicker presentasi). Tekan **F11** untuk layar penuh.
