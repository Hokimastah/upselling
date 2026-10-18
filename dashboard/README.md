# Peluang Upselling Frozen Food

Dashboard presentasi untuk Divisi Pemasaran: tiga ide upselling ke pelanggan rutin,
berdasarkan data penjualan April–September 2020.

Halaman ini statis (HTML + CSS + JavaScript biasa, tanpa library dan tanpa proses build),
jadi bisa langsung di-host di GitHub Pages.

## Isi folder

| Berkas | Fungsi |
|---|---|
| `index.html` | Halaman dashboard (narasi + grafik) |
| `assets/style.css` | Tampilan, termasuk mode terang/gelap |
| `assets/app.js` | Menggambar grafik SVG, kalkulator potensi, tabel target |
| `assets/data.js` | Angka hasil analisis (dibuat otomatis, jangan diedit manual) |
| `analisis/build_data.py` | Skrip yang menghitung semua angka dari file Excel |
| `.nojekyll` | Supaya GitHub Pages menyajikan file apa adanya |

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub (sebaiknya **private** bila nama pelanggan tidak boleh dilihat publik; GitHub Pages dari repo private butuh akun berbayar).
2. Unggah isi folder `dashboard` ini ke root repository:
   ```bash
   cd dashboard
   git init
   git add .
   git commit -m "Dashboard peluang upselling"
   git branch -M main
   git remote add origin https://github.com/<akun>/<nama-repo>.git
   git push -u origin main
   ```
3. Di GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
4. Setelah 1–2 menit dashboard tersedia di `https://<akun>.github.io/<nama-repo>/`.

Untuk melihat secara lokal tanpa GitHub: buka `index.html` langsung di browser, atau jalankan
`python -m http.server` di folder ini lalu buka `http://localhost:8000`.

## Memperbarui angka

Semua angka (termasuk yang ada di kalimat narasi) dibaca dari `assets/data.js`.
Bila data Excel berubah, jalankan ulang:

```bash
pip install pandas openpyxl
python analisis/build_data.py --dataset "path/ke/folder/dataset"
```

Tanpa `--dataset`, skrip mencari folder `dataset` di sebelah folder `dashboard`.
Skrip memeriksa bahwa total tiap file cocok dengan baris total di Excel, lalu menulis ulang `assets/data.js`.
Setelah memperbarui, naikkan angka `?v=` pada `index.html` agar browser tidak memakai versi lama dari cache.

## Alur cerita (Storytelling with Data)

1. **Konteks:** omzet naik-turun mengikuti Otak-Otak (22% omzet).
2. **Sasaran:** 98 pelanggan rutin menghasilkan 87% omzet.
3. **Peluang produk:** es krim sering dibeli ulang, tetapi baru dibeli 29% pelanggan rutin.
4. **Tiga program:** Coba Es Krim · Paket Otak-Otak + Olahan Ikan · Genapkan ke Dus.
5. **Potensi:** hingga Rp24,6 jt per bulan, dengan kalkulator skenario.
6. **Target:** daftar 89 pelanggan, 20 teratas memegang 64% potensi.
7. **Keputusan:** pilot 3 bulan dengan grup pembanding.
