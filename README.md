# Peluang Upselling Frozen Food

Dashboard presentasi untuk Divisi Pemasaran. Analisis menggunakan enam laporan pembelian bulanan **April–September 2020** dan menyusun tiga peluang upselling untuk pelanggan rutin. Semua angka turunan di dashboard dibuat oleh `dashboard/analisis/build_data.py` dan dibaca dari `dashboard/assets/data.js`.

> Angka di halaman adalah analisis historis periode tersebut. Potensi program merupakan perkiraan berbasis pola pembelian, bukan hasil penjualan yang sudah terjadi.

## Isi repository

| Berkas | Fungsi |
|---|---|
| `index.html` | Narasi, delapan bagian dashboard, tabel metodologi |
| `dashboard/assets/style.css` | Tata letak, responsif, dan mode terang/gelap |
| `dashboard/assets/app.js` | Format angka, grafik SVG, kalkulator skenario, navigasi, dan tabel target |
| `dashboard/assets/data.js` | Hasil perhitungan otomatis; jangan diedit manual |
| `dashboard/analisis/build_data.py` | Pembacaan, pembersihan, pengelompokan, dan perhitungan data |
| `dataset/` | Enam file Excel sumber |
| `.nojekyll` | Meminta GitHub Pages menyajikan file apa adanya |

## Cerita yang dibawakan dashboard

Alur presentasi bergerak dari konteks ke keputusan:

1. **Omzet dan konsentrasi produk:** omzet bulanan memuncak pada Agustus; Otak-Otak menyumbang bagian penting dan penurunannya menjelaskan penurunan September.
2. **Segmen pelanggan:** pelanggan rutin membeli pada sedikitnya tiga bulan dan menjadi sasaran utama.
3. **Komposisi produk:** lima jenis produk terbesar memperlihatkan konsentrasi omzet.
4. **Pola pembelian produk:** penetrasi dan pembelian ulang menunjukkan jenis produk yang sudah diterima pelanggan rutin.
5. **Keranjang harian:** kombinasi produk dan median belanja memberi konteks untuk penawaran silang.
6. **Tiga program:** peluang es krim, olahan ikan, dan pembelian pack menuju satu dus.
7. **Perkiraan dan daftar target:** kalkulator mengubah potensi penuh menjadi beberapa tingkat keberhasilan; target diberi alasan yang bisa ditelusuri.
8. **Keputusan:** usulan pilot tiga bulan untuk 20 target teratas dan kriteria evaluasinya.

## Sumber data dan cara membaca file

`build_data.py` mensyaratkan tepat enam file `.xlsx` dan mengurutkannya berdasarkan nama bulan file (`april`, `mei`, `juni`, `juli`, `agustus`, `sep`). Untuk setiap file, skrip:

1. Memilih sheet pertama yang namanya diawali `_`. Sheet laporan lengkap ini dipakai agar baris tidak terhitung lagi dari sheet per merek.
2. Mencari baris yang kolom pertamanya bernilai `TGL`, lalu membaca delapan kolom berikutnya: `TGL`, `KODEBARA`, `NAMABARA`, `QTY`, `SATUAN`, `HARGA`, `JUMLAH`, `NAMA`.
3. Menganggap baris dengan tanggal yang dapat dibaca sebagai baris transaksi. Baris footer tanpa tanggal bukan transaksi; nilai total terakhir di footer dipakai sebagai pemeriksaan.
4. Mengubah `QTY`, `HARGA`, dan `JUMLAH` menjadi angka. Skrip berhenti dengan assertion bila jumlah `JUMLAH` transaksi tidak sama dengan total pada file Excel.
5. Menetapkan bulan analisis dari nama file. Tanggal transaksi tetap digunakan untuk analisis keranjang harian.

### Pembersihan dan nilai yang digunakan

- Nama pelanggan dibersihkan dengan menghapus kode awalan 1–3 huruf seperti `C - `, menghapus teks `(MITRAKU)`, merapikan spasi, dan mengubah nama menjadi bentuk judul. Contohnya, `C - ADEK FROZEN` digabung dengan `ADEK FROZEN`.
- Setelah pembersihan, nama `CASH` menjadi `Cash`. Semua penjualan Cash tetap masuk omzet dan komposisi kategori, tetapi Cash tidak dipakai untuk menghitung pelanggan bernama, pelanggan rutin, keranjang rutin, ataupun daftar target.
- **Omzet/penjualan bersih selalu memakai `JUMLAH`**, bukan `QTY × HARGA`. Kolom `JUMLAH` sudah mencerminkan nilai bersih pada sumber.
- Satuan `PAC` dinormalisasi menjadi `PACK`, dan `BALL` menjadi `BAL`.
- Jumlah pack dalam satu dus diambil dari akhiran nama barang yang cocok dengan pola `X <angka> PACK/PAK/PCS/PC/PAC`, misalnya `X 20 PACK`. Bila tidak ada pola tersebut, ukuran dus dianggap tidak diketahui.

## Pengelompokan jenis produk

Nama barang dipetakan ke jenis produk dengan aturan kata kunci berikut. **Aturan diperiksa berurutan; kecocokan pertama yang digunakan.** Barang yang tidak cocok masuk `Lainnya`.

| Urutan | Jenis | Kata kunci pada `NAMABARA` |
|---:|---|---|
| 1 | Kentang Goreng | `SHOESTRING`, `KENTANG`, `JULIENNE` |
| 2 | Es Krim | `8 LTR`, `YUMMI ES KRIM`, nama diawali `CONE` |
| 3 | Keju | `MOZZARELLA`, `PARMESAN`, `KANZLER SINGLES`, `CHEESE SAUCE` |
| 4 | Saus & Mayo | `SAUS`, `SAUCE`, `SAMBAL`, `MAYO`, `DELMONTE`, `BOLOGNA`, `EURO GOURMET` |
| 5 | Otak-Otak | `OTAK` |
| 6 | Kulit Lumpia | `KULIT`, `KILIT` |
| 7 | Dimsum & Camilan | `DIMSUM`, `SIOMAY`, `HAKAU`, `LUMPIA`, `WONTON`, `SAMOSA`, `PANSIT`, `CIRENG`, `SINGKONG`, `LI PAO`, `WEI WANG`, awalan `PK `, `MINI PAO`, `BATAGOR`, `TEMPURA GORENG`, `EMPEK`, `KEI ` |
| 8 | Bakso Ikan | `BAKSO IKAN`, `BASO IKAN`, `BAKSO UDANG`, `BOLA `, `PELOR`, `PILUS`, `BASO MIX IKAN`, `BAKSO OLAHAN IKAN` |
| 9 | Olahan Ikan Lain | `IKAN`, `FISH`, `UDANG`, `CRAB`, `KEPITING`, `LOBSTER`, `SALMON`, `SCALLOP`, `CHIKUWA`, `NAGA`, `DORI`, `TOFU`, `MINAKU`, `MITRAKU`, `SHIFUDO`, `SUNFISH`, `MANTUL`, `CEDEA`, `SUKI`, `DUMPLING`, `CUMI`, `STEAMBOAT` |
| 10 | Nugget | `NUGGET`, `DEN BAGUS`, `WING`, `AYAM GORENG`, `KARAGE`, `CRISPY` |
| 11 | Sosis | `SOSIS`, `STICK`, `SUKOI`, `BRATW`, `COCKTAIL` |
| 12 | Bakso Daging | `BAKSO`, `BASO` |
| 13 | Burger & Tortila | `BURGER`, `ROTI`, `ROLL 6`, `PLAIN ROLL`, `TORTILA`, `PATTIES` |

Pemetaan berbasis nama ini adalah klasifikasi untuk analisis, bukan master kategori dari sistem stok. Perubahan nama barang dapat mengubah hasil pengelompokan.

## Definisi metrik umum

### Ringkasan hasil dari file yang ada sekarang

Untuk enam file April–September 2020 di `dataset/`, generator saat ini membaca 6.778 baris transaksi dengan omzet Rp4.530.330.620, 268 SKU, dan 183 nama pelanggan setelah pembersihan (termasuk `Cash`). Ada 98 pelanggan rutin. Lima jenis produk terbesar menyumbang 72,9% omzet. Hasil estimasi tiga program adalah sekitar Rp9,65 juta, Rp6,88 juta, dan Rp8,11 juta per bulan (total Rp24,64 juta); gabungan target uniknya 89 pelanggan. Angka ini adalah cuplikan keluaran dataset saat ini; rumus di bawah tetap berlaku bila file diganti dan generator dijalankan ulang.

### Omzet, bulan, dan perubahan

- **Total omzet** = jumlah seluruh `JUMLAH` transaksi selama enam bulan.
- **Rata-rata omzet per bulan** = total omzet ÷ 6.
- **Omzet suatu jenis** = jumlah `JUMLAH` untuk baris yang diklasifikasikan ke jenis tersebut.
- **Porsi omzet** = omzet kelompok ÷ total omzet. Porsi Otak-Otak menggunakan seluruh baris Otak-Otak dibagi seluruh omzet. Porsi Minaku di antara Otak-Otak menggunakan baris dengan `KODEBARA = MIN-001` dibagi omzet Otak-Otak.
- Grafik bulanan memecah omzet menjadi Otak-Otak dan semua jenis lain. Perubahan September dihitung terpisah: perubahan omzet Otak-Otak = September − Agustus; perubahan produk lain = September − Agustus. Persentase naik/turun dua bulan dihitung dari perubahan dibagi nilai bulan pembanding.
- Pelanggan Otak-Otak grosir baru Agustus adalah pelanggan yang bulan pertamanya muncul di seluruh data adalah Agustus, memiliki baris Otak-Otak pada Agustus, dan total Otak-Otak Agustusnya sedikitnya Rp10 juta.

### Segmen pelanggan dan pelanggan baru

Aktivitas pelanggan dihitung sebagai banyaknya **bulan berbeda** yang memiliki transaksi, bukan banyaknya nota atau jumlah transaksi.

- **Rutin**: bukan Cash dan aktif pada ≥3 dari 6 bulan.
- **Sesekali**: bukan Cash dan aktif pada 1–2 dari 6 bulan.
- **Porsi omzet segmen** = omzet segmen ÷ seluruh omzet, termasuk omzet Cash pada penyebut.
- Bulan pertama pelanggan adalah bulan paling awal ia muncul. Baris pada bulan pertama tersebut ditandai `BARU`.
- Total pelanggan baru Mei–September menghitung pelanggan bernama non-Cash yang pertama kali muncul pada bulan-bulan itu. Porsi omzet pelanggan baru dihitung dari semua transaksi bertanda `BARU` selama Mei–September ÷ semua omzet Mei–September; omzet Cash tetap masuk penyebut dan bila relevan tetap ikut pembilang. Deret hitungan pelanggan baru per bulan menghitung nama berbeda bertanda `BARU` tanpa mengecualikan Cash (jika Cash pertama kali muncul pada salah satu bulan itu, ia ikut deret bulanan).

### Penetrasi dan pembelian ulang jenis produk

Analisis ini hanya menggunakan pelanggan rutin bernama dan mengabaikan jenis `Lainnya`.

- **Pembeli jenis** = pelanggan rutin yang memiliki minimal satu baris jenis tersebut selama enam bulan.
- **Penetrasi** = jumlah pembeli jenis ÷ jumlah pelanggan rutin.
- **Pembelian ulang** = proporsi pasangan pelanggan–jenis yang memiliki transaksi di ≥2 bulan berbeda ÷ semua pasangan pelanggan–jenis yang membeli produk itu. Jadi penyebutnya bukan seluruh pelanggan.
- Grafik komposisi omzet merangking semua jenis dari omzet terbesar. Lima teratas ditampilkan satu per satu; semua sisanya dijumlahkan sebagai kelompok lain. Persentase lima teratas memakai total omzet sebagai penyebut.

### Keranjang harian dan produk yang dibeli bersama

Sumber tidak memiliki nomor nota/faktur. Karena itu, **keranjang adalah proksi pelanggan × tanggal** untuk pelanggan rutin: semua baris milik pelanggan yang sama pada tanggal yang sama dijumlahkan. Beberapa nota pada pelanggan-tanggal yang sama dapat tergabung, dan transaksi berulang tidak dapat dibedakan.

- Nilai keranjang = jumlah `JUMLAH` semua baris pelanggan tersebut pada tanggal itu.
- Median keseluruhan dan median bulanan adalah median nilai keranjang; setiap pelanggan-tanggal dihitung sebagai satu observasi.
- Jenis pada keranjang adalah himpunan jenis yang muncul pada barisnya, tanpa `Lainnya`. Untuk pasangan, `Bakso Ikan` dan `Olahan Ikan Lain` disatukan menjadi `Olahan Ikan`.
- Setiap pasangan jenis yang berbeda dalam satu keranjang dihitung satu kali. Jika ada tiga jenis, keranjang menyumbang tiga pasangan. Hitungan adalah jumlah keranjang pelanggan-tanggal yang memuat pasangan, bukan jumlah unit, SKU, atau nota.
- Porsi keranjang Otak-Otak + olahan ikan = keranjang yang memiliki Otak-Otak dan salah satu dari Bakso Ikan/Olahan Ikan Lain ÷ semua keranjang yang memiliki Otak-Otak.

## Logika dan perhitungan tiga program

Semua program menggunakan pelanggan rutin. Periode pengamatan masing-masing adalah April–September 2020.

### Program 1 — Coba Es Krim

1. Untuk setiap pembeli es krim rutin, hitung porsi es krim = omzet es krim enam bulan ÷ seluruh omzet rutin pelanggan tersebut enam bulan.
2. Buang pelanggan yang porsinya ≥99% karena mereka merupakan toko yang hampir khusus menjual es krim; pola belanja mereka tidak dipakai sebagai pembanding cross-sell.
3. Ambil **median** porsi es krim pembeli campuran. Pada data ini ada 20 pembeli campuran; median yang digunakan sekitar 4,2%.
4. Target adalah pelanggan rutin yang tidak memiliki satu pun pembelian es krim selama periode data.
5. Potensi bulanan per target = (seluruh omzet pelanggan enam bulan ÷ 6) × median porsi es krim pembeli campuran. Potensi program = jumlah potensi semua target.

Median dipakai agar beberapa pelanggan dengan belanja sangat besar tidak menentukan asumsi porsi untuk semua pelanggan.

### Program 2 — Paket Otak-Otak + Olahan Ikan

1. Untuk tiap pelanggan rutin yang membeli Otak-Otak, jumlahkan omzet enam bulan untuk Otak-Otak dan untuk kelompok ikan. Kelompok ikan = `Bakso Ikan` + `Olahan Ikan Lain`.
2. Rasio ikan = omzet kelompok ikan ÷ omzet Otak-Otak.
3. Target adalah pembeli Otak-Otak dengan rasio ikan **<10%**. Pelanggan dengan rasio ≥10% adalah kelompok pembanding deskriptif; median rasionya ditampilkan sebagai konteks.
4. Asumsi potensi tambahan = 10% dari belanja Otak-Otak target. Potensi bulanan per target = (omzet Otak-Otak enam bulan ÷ 6) × 10%. Potensi program = jumlah potensi target.

Grafik perbandingan menampilkan median rasio ikan pada kelompok target dan median pada kelompok pembanding, masing-masing sebagai nilai olahan ikan per belanja Otak-Otak. Rasio target maksimum juga dipakai untuk memastikan kelompok target berada di bawah ambang 10%.

Asumsi 10% adalah skenario yang dipilih untuk perkiraan, bukan hasil eksperimen. Rasionya dibandingkan dengan kelompok pelanggan lain, tetapi itu tidak membuktikan paket akan menyebabkan pembelian tambahan.

### Program 3 — Genapkan ke Dus

**Menemukan peluang:**

1. Ambil baris pelanggan rutin dengan satuan `PACK`, ukuran per dus (`PER`) terbaca dari nama barang, dan `HARGA > 0`.
2. Jumlahkan `QTY` per pelanggan × SKU (`KODEBARA`) × bulan; simpan median `HARGA` pack untuk kelompok itu.
3. Rasio dus = total pack bulanan ÷ isi pack per dus (`PER`). Distribusi dihitung per observasi pelanggan–SKU–bulan pada rentang `<25%`, `25–<50%`, `50–<75%`, `75–<100%`, dan `≥100%` isi dus. Angka pelanggan unik pada setiap rentang dapat tumpang tindih antar rentang.
4. Peluang “dekat satu dus” adalah observasi dengan **50% ≤ rasio <100%**. Satu pelanggan dapat memiliki banyak kejadian produk-bulan.

**Menghitung potensi:**

- Kekurangan pack sampai satu dus = `PER − QTY`.
- Perkiraan nilai kekurangan per observasi = `(PER − QTY) × median HARGA pack`.
- Potensi bulanan per pelanggan = jumlah nilai kekurangan observasi yang memenuhi rentang 50–<100% selama periode ÷ 6.
- Potensi program = jumlah potensi bulanan pelanggan.

Rumus mengandaikan peluang menambah pack sampai satu dus terisi; ini belum memperhitungkan kesediaan pelanggan, stok, perubahan harga, maupun apakah pola pembelian berulang.

**Perbandingan harga per pack:** untuk SKU yang terjual dalam PACK dan DUS dengan ukuran per dus diketahui serta harga positif, hitung median harga PACK dan median (`HARGA DUS ÷ PER`) per SKU. Harga diambil dari semua pelanggan bernama non-Cash, bukan hanya pelanggan rutin. Selisih relatif per SKU = `harga median PACK ÷ harga median per-pack DUS − 1`. Dashboard melaporkan median selisih SKU dan porsi SKU dengan nilai absolut selisih ≤2%. Ini membandingkan harga pada data historis; tidak membuktikan harga adalah penyebab pelanggan membeli eceran.

## Potensi, daftar target, dan kalkulator

- Potensi penuh per program adalah penjumlahan estimasi bulanan per target menurut rumus program masing-masing. Seorang pelanggan dapat masuk beberapa program; estimasi antarprogram dijumlahkan karena mewakili mekanisme penawaran berbeda. Ini bukan proyeksi yang telah disesuaikan untuk tumpang tindih atau batas stok.
- Daftar target adalah **gabungan unik** pelanggan yang memenuhi setidaknya satu program. Untuk setiap pelanggan, omzet bulanan dasar = omzet April–September ÷ 6; angka pada tabel dibulatkan ke rupiah bulat dan bulan aktif menunjukkan banyak bulan transaksi.
- Potensi pelanggan pada tabel juga dibulatkan ke rupiah bulat. Urutan target menggunakan jumlah nilai potensi yang sudah dibulatkan itu. Sementara total penuh per program pada ringkasan memakai angka pecahan sebelum pembulatan; selisih kecil saat menjumlahkan tabel dapat terjadi karena pembulatan.
- Sinyal target: Program 1 menunjukkan belum pernah membeli es krim; Program 2 menunjukkan rasio belanja ikan terhadap Otak-Otak; Program 3 menunjukkan jumlah kejadian produk-bulan pada 50–<100% isi dus.
- **Skenario kalkulator** = potensi penuh semua program × tingkat keberhasilan. Kontrol memilih 10–100% dengan kelipatan 5%; awalnya 30%, dengan pilihan cepat 30%, 50%, dan 100%. Hasil turut ditampilkan sebagai persentase omzet bulanan rata-rata, nilai tiga bulan (`bulanan × 3`), dan nilai tahunan (`bulanan × 12`). Nilai tiga/tahunan hanya annualisasi aritmetis, bukan ramalan musiman.
- Pilot memilih 20 pelanggan pertama dalam urutan potensi tabel. Porsi potensi 20 teratas = jumlah potensi bulanan target 20 ÷ jumlah potensi bulanan seluruh target. Estimasi pilot pada skenario 30% = jumlah potensi target teratas × 30%. Sisa target yang belum masuk pilot ditampilkan sebagai pembanding yang diusulkan.
- Kriteria pada halaman adalah usulan sebelum pilot: sedikitnya 30% dari 20 peserta (≥6) membeli satu penawaran dan tambahan belanja bulanan dibanding pembanding sekurangnya nilai estimasi skenario 30%. Persentase lift yang ditampilkan = estimasi pilot skenario 30% ÷ total omzet bulanan dasar 20 peserta. Semua angka ini adalah ambang/simulasi yang dirancang dari data historis, bukan hasil pilot.

Perbandingan pelanggan pilot dan pelanggan pembanding bukan eksperimen acak; keduanya bisa berbeda sejak awal. Evaluasi setelah pilot sebaiknya membandingkan perubahan omzet dari baseline dengan periode dan kelompok pembanding yang sama, serta mencatat penawaran dan pembelian aktual. Data ini sendiri tidak menunjukkan dampak kausal.

## Pemeriksaan kualitas angka

- `HARGA ≤ 0` dihitung sebagai baris harga nol/nonpositif; jumlah `QTY` baris tersebut juga dilaporkan. Baris ini tidak otomatis dihapus dari omzet karena omzet tetap dihitung dari `JUMLAH`.
- Nilai bruto indikatif per baris = `QTY × HARGA`. Selisih bruto-bersih yang diasumsikan sebagai potongan = `maksimum(QTY × HARGA − JUMLAH, 0)`. Jumlah baris potongan tersirat menghitung selisih >Rp1; nilai potongan tersirat menjumlahkan selisih positif tersebut.
- Metrik `selisih` yang disimpan terpisah menghitung baris dengan `|QTY × HARGA − JUMLAH| > Rp1`, termasuk kasus nilai bersih lebih besar dari bruto. Angka ini adalah pemeriksaan beda nilai, bukan jumlah potongan.
- Excel tidak menyediakan penanda kampanye/promo pada perhitungan ini. Selisih bruto-bersih tidak dapat diatribusikan ke promosi tertentu dan bukan bukti efek promosi.
- Pemeriksaan jumlah `JUMLAH` terhadap total footer dilakukan per file sebelum keenam laporan digabung. Jika tidak cocok, skrip gagal dan data keluaran tidak diperbarui.

## Tampilan dan navigasi

Grafik menggunakan SVG yang digambar oleh JavaScript, tanpa library chart. Judul bagian menyampaikan temuan, batang dipakai untuk membandingkan kategori/segmen, grafik garis untuk median per bulan, dan label diletakkan dekat data. Warna aksen menandai kategori atau peluang yang menjadi fokus. Tabel data alternatif tersedia lewat tombol tampilan tabel pada grafik. Nilai uang dan persentase diformat dalam gaya Indonesia; tampilan rupiah umumnya dibulatkan.

Gunakan tombol panah/halaman pada navigator, `→` atau `PageDown` untuk maju, `←` atau `PageUp` untuk mundur, `Home` untuk kembali ke awal, dan `F11` untuk layar penuh. Tombol navigasi keyboard tidak mengambil alih saat fokus berada pada kolom input.

## Menjalankan dan memperbarui

Untuk melihat lokal, buka `index.html` di browser, atau dari root repository jalankan:

```bash
python -m http.server
```

lalu buka `http://localhost:8000`.

Jika file Excel diperbarui, pasang dependensi dan jalankan ulang generator dari root:

```bash
pip install pandas openpyxl numpy
python dashboard/analisis/build_data.py
```

Secara default skrip membaca `dataset/` dan menulis `dashboard/assets/data.js`. Lokasi dapat diganti:

```bash
python dashboard/analisis/build_data.py --dataset "D:/data"
python dashboard/analisis/build_data.py --dataset "D:/data" --out "dashboard/assets/data.js"
```

Sesudah angka diperbarui, naikkan nilai parameter `?v=` pada referensi aset di `index.html` bila browser masih memakai cache lama. Commit dan push branch `main`; di GitHub pilih **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, lalu simpan. Halaman biasanya tersedia di `https://<akun>.github.io/<nama-repo>/` setelah deployment selesai.

Tabel target memuat nama pelanggan. Siapa pun yang dapat mengakses situs publik dapat melihat nama tersebut.
