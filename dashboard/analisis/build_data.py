"""
Membangun dashboard/assets/data.js untuk dashboard "Peluang Upselling Frozen Food"
(halamannya: index.html di root repository).

Semua angka di dashboard dihitung di sini, langsung dari 6 file Excel mentah
(April-September 2020). Jalankan ulang dari root repository setiap kali data berubah:

    python dashboard/analisis/build_data.py                      # dataset di ./dataset
    python dashboard/analisis/build_data.py --dataset "D:/data"  # lokasi dataset lain

Aturan utama:
- Hanya sheet laporan lengkap (nama diawali "_") yang dipakai, agar transaksi
  tidak terhitung dua kali dengan sheet per merek. Baris total di bawah tabel
  dibuang, lalu jumlahnya dicocokkan dengan total di file (assert).
- Nama pelanggan dibersihkan dari kode awalan ("F - ", "C - ", "AL - ", ...)
  dan tulisan "(MITRAKU)", sehingga "C - ADEK FROZEN" = "ADEK FROZEN".
- Nilai penjualan memakai kolom JUMLAH (sudah termasuk potongan).
- Pelanggan rutin = aktif (ada transaksi) di >= 3 dari 6 bulan, tidak termasuk CASH.
"""
import argparse
import json
import re
import sys
from collections import Counter
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd

BULAN_FILE = {'april': 4, 'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8, 'sep': 9}
NAMA_BULAN = {4: 'Apr', 5: 'Mei', 6: 'Jun', 7: 'Jul', 8: 'Agu', 9: 'Sep'}
N_BULAN = 6

# Asumsi program (ditampilkan apa adanya di dashboard)
ASUMSI_IKAN = 0.10        # Program 2: tambahan olahan ikan = 10% dari belanja Otak-Otak
BATAS_RENDAH_IKAN = 0.10  # Program 2: target = belanja olahan ikan < 10% belanja Otak-Otak
BATAS_DUS = 0.50          # Program 3: target = beli eceran >= 50% dan < 100% isi 1 dus per bulan


def baca_laporan(path):
    xls = pd.ExcelFile(path)
    sheet = [s for s in xls.sheet_names if s.startswith('_')][0]
    raw = pd.read_excel(path, sheet_name=sheet, header=None)
    baris_header = raw.index[raw[0].astype(str).str.strip() == 'TGL'][0]
    df = raw.iloc[baris_header + 1:, :8].copy()
    df.columns = ['TGL', 'KODEBARA', 'NAMABARA', 'QTY', 'SATUAN', 'HARGA', 'JUMLAH', 'NAMA']
    is_data = pd.to_datetime(df['TGL'], errors='coerce').notna()
    total = df.loc[~is_data & df['JUMLAH'].notna(), 'JUMLAH']
    data = df[is_data].copy()
    for c in ['QTY', 'HARGA', 'JUMLAH']:
        data[c] = pd.to_numeric(data[c])
    assert np.isclose(data['JUMLAH'].sum(), total.iloc[-1]), f'Total tidak cocok: {path.name}'
    data['BULAN'] = BULAN_FILE[path.stem.split()[0].lower()]
    return data


def jenis(nama):
    """Kelompok jenis produk (lebih rinci dari kategori) untuk analisis cross-sell."""
    n = str(nama).upper()
    def ada(p):
        return re.search(p, n) is not None
    if ada(r'SHOESTRING|KENTANG|JULIENNE'): return 'Kentang Goreng'
    if ada(r'8 LTR|YUMMI ES KRIM|^CONE'): return 'Es Krim'
    if ada(r'MOZZARELLA|PARMESAN|KANZLER SINGLES|CHEESE SAUCE'): return 'Keju'
    if ada(r'\bSAUS\b|SAUCE|SAMBAL|MAYO|DELMONTE|BOLOGNA|EURO GOURMET'): return 'Saus & Mayo'
    if ada(r'OTAK'): return 'Otak-Otak'
    if ada(r'KULIT|KILIT'): return 'Kulit Lumpia'
    if ada(r'DIMSUM|SIOMAY|HAKAU|LUMPIA|WONTON|SAMOSA|PANSIT|CIRENG|SINGKONG|LI PAO|WEI WANG|^PK |'
           r'MINI PAO|BATAGOR|TEMPURA GORENG|EMPEK|KEI '): return 'Dimsum & Camilan'
    if ada(r'BAKSO IKAN|BASO IKAN|BAKSO UDANG|BOLA |PELOR|PILUS|BASO MIX IKAN|BAKSO OLAHAN IKAN'): return 'Bakso Ikan'
    if ada(r'IKAN|FISH|UDANG|CRAB|KEPITING|LOBSTER|SALMON|SCALLOP|CHIKUWA|NAGA|DORI|TOFU|MINAKU|MITRAKU|'
           r'SHIFUDO|SUNFISH|MANTUL|CEDEA|SUKI|DUMPLING|CUMI|STEAMBOAT'): return 'Olahan Ikan Lain'
    if ada(r'NUGGET|DEN BAGUS|WING|AYAM GORENG|KARAGE|CRISPY'): return 'Nugget'
    if ada(r'SOSIS|STICK|SUKOI|BRATW|COCKTAIL'): return 'Sosis'
    if ada(r'BAKSO|BASO'): return 'Bakso Daging'
    if ada(r'BURGER|ROTI|ROLL 6|PLAIN ROLL|TORTILA|PATTIES'): return 'Burger & Tortila'
    return 'Lainnya'


def isi_per_dus(nama):
    """Isi pack per dus dari akhir nama barang, mis. '... X 20 PACK' -> 20."""
    m = re.search(r'X\s*(\d+)\s*(PACK|PAK|PCS|PC|PAC)?\s*$', str(nama).upper())
    return int(m.group(1)) if m else np.nan


def judul(s):
    return re.sub(r'\s+', ' ', s).strip().title()


def nama_pendek(raw):
    """'OKEY SOSIS 500 GR X 20 PACK' -> 'Okey Sosis 500 gr'."""
    s = re.sub(r'\s*X\s*\d+\s*(PACK|PAK|PCS)?\s*$', '', str(raw).upper())
    s = judul(s)
    s = re.sub(r'\b(Gr|Grm|Gram)\b', 'gr', s)
    s = re.sub(r'\bKg\b', 'kg', s)
    return re.sub(r'(\d)\.(\d)', r'\1,\2', s)


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser()
    ap.add_argument('--dataset', default=str(Path(__file__).resolve().parents[2] / 'dataset'))
    ap.add_argument('--out', default=str(Path(__file__).resolve().parents[1] / 'assets' / 'data.js'))
    args = ap.parse_args()

    files = sorted(Path(args.dataset).glob('*.xlsx'), key=lambda p: BULAN_FILE[p.stem.split()[0].lower()])
    assert len(files) == 6, f'Harus ada 6 file bulanan, ditemukan {len(files)}'
    df = pd.concat([baca_laporan(f) for f in files], ignore_index=True)
    df['TGL'] = pd.to_datetime(df['TGL'])
    df['PELANGGAN'] = (df['NAMA'].astype(str)
                       .str.replace(r'^\s*[A-Z]{1,3}\s*-\s*', '', regex=True)
                       .str.replace(r'\(MITRAKU\)', '', regex=True).map(judul))
    df['JENIS'] = df['NAMABARA'].map(jenis)
    df['SAT'] = df['SATUAN'].astype(str).str.strip().replace({'PAC': 'PACK', 'BALL': 'BAL'})
    df['PER'] = df['NAMABARA'].map(isi_per_dus)

    total = int(df['JUMLAH'].sum())
    bulan_total = df.groupby('BULAN')['JUMLAH'].sum()
    nilai_bruto = df['QTY'] * df['HARGA']
    selisih_bruto_bersih = (nilai_bruto - df['JUMLAH']).clip(lower=0)

    # ---------- 1. Omzet bulanan: Otak-Otak vs produk lain ----------
    otak = df[df['JENIS'] == 'Otak-Otak']
    bulan_otak = otak.groupby('BULAN')['JUMLAH'].sum()
    monthly = [{'m': NAMA_BULAN[b], 'otak': int(bulan_otak.get(b, 0)),
                'lain': int(bulan_total[b] - bulan_otak.get(b, 0)), 'tot': int(bulan_total[b])} for b in range(4, 10)]

    # Pesanan grosir Otak-Otak dari pelanggan yang baru muncul di Agustus
    bulan_pertama = df.groupby('PELANGGAN')['BULAN'].min()
    df['BARU'] = df['PELANGGAN'].map(bulan_pertama) == df['BULAN']
    agu_baru = (otak[(otak['BULAN'] == 8) & otak['PELANGGAN'].map(bulan_pertama).eq(8)]
                .groupby('PELANGGAN')['JUMLAH'].sum().sort_values(ascending=False))
    agu_baru = agu_baru[agu_baru >= 10_000_000]
    minaku_share = otak.loc[otak['KODEBARA'] == 'MIN-001', 'JUMLAH'].sum() / otak['JUMLAH'].sum()

    # ---------- 2. Segmen pelanggan ----------
    nc = df[df['PELANGGAN'] != 'Cash']
    bulan_aktif = nc.groupby('PELANGGAN')['BULAN'].nunique()
    rutin = bulan_aktif[bulan_aktif >= 3].index
    sesekali = bulan_aktif[bulan_aktif < 3].index
    seg = [
        {'k': 'rutin', 'label': 'Pelanggan rutin', 'sub': 'aktif 3–6 dari 6 bulan', 'n': len(rutin),
         'o': int(nc.loc[nc['PELANGGAN'].isin(rutin), 'JUMLAH'].sum())},
        {'k': 'sesekali', 'label': 'Pelanggan sesekali', 'sub': 'aktif 1–2 bulan', 'n': len(sesekali),
         'o': int(nc.loc[nc['PELANGGAN'].isin(sesekali), 'JUMLAH'].sum())},
        {'k': 'cash', 'label': 'Pembeli tunai (CASH)', 'sub': 'tanpa nama', 'n': None,
         'o': int(df.loc[df['PELANGGAN'] == 'Cash', 'JUMLAH'].sum())},
    ]
    for s in seg:
        s['share'] = s['o'] / total
    sesudah_apr = df[df['BULAN'] >= 5]
    baru = {'n': int(sesudah_apr.loc[sesudah_apr['BARU'] & (sesudah_apr['PELANGGAN'] != 'Cash'), 'PELANGGAN'].nunique()),
            'share': float(sesudah_apr.loc[sesudah_apr['BARU'], 'JUMLAH'].sum() / sesudah_apr['JUMLAH'].sum()),
            'per_bulan': [int(df[(df['BULAN'] == b) & df['BARU']]['PELANGGAN'].nunique()) for b in range(5, 10)]}

    # ---------- 3. Jenis produk: penetrasi vs pembelian ulang (pelanggan rutin) ----------
    r = nc[nc['PELANGGAN'].isin(rutin)]
    gj = r.groupby(['JENIS', 'PELANGGAN']).agg(m=('BULAN', 'nunique'), o=('JUMLAH', 'sum')).reset_index()
    types = []
    for j, g in gj.groupby('JENIS'):
        if j == 'Lainnya':
            continue
        types.append({'j': j, 'buyers': len(g), 'pen': len(g) / len(rutin),
                      'rep': float((g['m'] >= 2).mean()), 'o': int(g['o'].sum())})
    types.sort(key=lambda t: -t['pen'])

    per_pel = r.groupby('PELANGGAN').agg(o=('JUMLAH', 'sum'), m=('BULAN', 'nunique'))

    # ---------- 3b. Komposisi produk & keranjang harian pelanggan ----------
    # Tidak ada nomor nota pada ekspor sumber. Untuk melihat produk yang dibeli
    # bersamaan, gunakan pelanggan-hari sebagai proksi keranjang dan jelaskan batasannya.
    category_sales = (df.groupby('JENIS')['JUMLAH'].sum()
                      .sort_values(ascending=False))
    category_mix = [{'j': j, 'o': int(o), 'share': float(o / total)}
                    for j, o in category_sales.items()]

    baskets = []
    for (date, customer), g in r.groupby(['TGL', 'PELANGGAN'], sort=False):
        categories = sorted(set(g['JENIS']) - {'Lainnya'})
        # Satukan dua kelompok ini agar sejalan dengan Program 2 di dashboard.
        pair_categories = sorted(set(
            'Olahan Ikan' if j in ('Bakso Ikan', 'Olahan Ikan Lain') else j
            for j in categories
        ))
        baskets.append({'tgl': date, 'pelanggan': customer, 'bulan': int(g['BULAN'].iloc[0]),
                        'o': float(g['JUMLAH'].sum()), 'jenis': categories,
                        'pair_jenis': pair_categories})
    basket_df = pd.DataFrame(baskets)
    pair_count = Counter()
    for categories in basket_df['pair_jenis']:
        pair_count.update(combinations(categories, 2))
    focus_pair = tuple(sorted(('Otak-Otak', 'Olahan Ikan')))
    top_pairs = pair_count.most_common(4)
    if focus_pair in pair_count and all(pair != focus_pair for pair, _ in top_pairs):
        top_pairs.append((focus_pair, pair_count[focus_pair]))

    with_otak = basket_df[basket_df['jenis'].map(lambda x: 'Otak-Otak' in x)]
    with_otak_ikan = with_otak[with_otak['jenis'].map(
        lambda x: any(j in x for j in ('Bakso Ikan', 'Olahan Ikan Lain')))]
    basket_monthly = []
    for b in range(4, 10):
        bm = basket_df[basket_df['bulan'] == b]
        basket_monthly.append({'m': NAMA_BULAN[b], 'n': len(bm),
                               'median': float(bm['o'].median())})

    # ---------- 4. Program 1: Es krim ----------
    # Pembanding = toko rutin yang menjual es krim DAN frozen food lain (pelanggan khusus
    # es krim tidak dipakai, karena porsi es krim mereka pasti 100%).
    ek = gj[gj['JENIS'] == 'Es Krim'].set_index('PELANGGAN')
    ek['porsi'] = ek['o'] / per_pel.loc[ek.index, 'o']
    ek_campur = ek[ek['porsi'] < 0.99]
    p1_porsi = float(ek_campur['porsi'].median())           # median porsi es krim dari total belanja
    p1_targets = [p for p in rutin if p not in ek.index]

    # ---------- 5. Program 2: Otak-Otak + olahan ikan ----------
    per_pel['otak'] = r[r['JENIS'] == 'Otak-Otak'].groupby('PELANGGAN')['JUMLAH'].sum()
    per_pel['ikan'] = r[r['JENIS'].isin(['Bakso Ikan', 'Olahan Ikan Lain'])].groupby('PELANGGAN')['JUMLAH'].sum()
    per_pel = per_pel.fillna(0)
    pembeli_otak = per_pel[per_pel['otak'] > 0].copy()
    pembeli_otak['rasio'] = pembeli_otak['ikan'] / pembeli_otak['otak']
    p2 = pembeli_otak[pembeli_otak['rasio'] < BATAS_RENDAH_IKAN]
    p2_peer = pembeli_otak[pembeli_otak['rasio'] >= BATAS_RENDAH_IKAN]

    # ---------- 6. Program 3: Genapkan ke dus ----------
    pack = r[(r['SAT'] == 'PACK') & r['PER'].notna() & (r['HARGA'] > 0)]
    dus = nc[(nc['SAT'] == 'DUS') & nc['PER'].notna() & (nc['HARGA'] > 0)]
    harga = (nc[(nc['SAT'] == 'PACK') & nc['PER'].notna() & (nc['HARGA'] > 0)].groupby('KODEBARA')['HARGA'].median().to_frame('pack')
             .join((dus['HARGA'] / dus['PER']).groupby(dus['KODEBARA']).median().rename('dus'), how='inner'))
    harga['selisih'] = harga['pack'] / harga['dus'] - 1
    pm = (pack.groupby(['PELANGGAN', 'KODEBARA', 'BULAN'])
          .agg(qty=('QTY', 'sum'), per=('PER', 'first'), harga=('HARGA', 'median')).reset_index())
    pm['r'] = pm['qty'] / pm['per']
    label_bin = ['< 25%', '25–49%', '50–74%', '75–99%', '≥ 1 dus']
    pm['bin'] = pd.cut(pm['r'], [0, .25, .5, .75, 1, np.inf], right=False, labels=label_bin)
    p3_bins = [{'b': b, 'n': int((pm['bin'] == b).sum()), 'cust': int(pm.loc[pm['bin'] == b, 'PELANGGAN'].nunique()),
                'hl': b in ('50–74%', '75–99%')} for b in label_bin]
    near = pm[(pm['r'] >= BATAS_DUS) & (pm['r'] < 1)].copy()
    near['tambah'] = (near['per'] - near['qty']) * near['harga']
    p3_cust = near.groupby('PELANGGAN')['tambah'].sum() / N_BULAN
    p3_events = near.groupby('PELANGGAN').size()
    contoh = (near.merge(df[['KODEBARA', 'NAMABARA']].drop_duplicates('KODEBARA'), on='KODEBARA')
              .groupby('NAMABARA').agg(n=('tambah', 'size'), cust=('PELANGGAN', 'nunique'))
              .sort_values('n', ascending=False).head(5))

    # ---------- 7. Potensi & daftar target ----------
    pot = {
        1: {p: float(per_pel.loc[p, 'o'] / N_BULAN * p1_porsi) for p in p1_targets},
        2: {p: float(row['otak'] / N_BULAN * ASUMSI_IKAN) for p, row in p2.iterrows()},
        3: {p: float(v) for p, v in p3_cust.items()},
    }
    targets = []
    for p in sorted(set().union(*[set(v) for v in pot.values()])):
        row = per_pel.loc[p]
        signal = {}
        if p in p1_targets:
            signal['1'] = {'reason': 'no_ice_cream'}
        if p in p2.index:
            signal['2'] = {'fish_ratio': float(p2.loc[p, 'rasio'])}
        if p in p3_events.index:
            signal['3'] = {'near_events': int(p3_events.loc[p])}
        targets.append({'n': p, 'pm': int(row['o'] / N_BULAN), 'm': int(row['m']),
                        'p': {str(k): int(round(v[p])) for k, v in pot.items() if p in v},
                        's': signal})
    targets.sort(key=lambda t: -sum(t['p'].values()))

    data = {
        'meta': {'periode': 'April–September 2020', 'baris': len(df), 'sku': int(df['KODEBARA'].nunique()),
                 'pelanggan': int(df['PELANGGAN'].nunique()), 'omzet': total, 'omzet_bulan': total / N_BULAN,
                 'harga_nol': int((df['HARGA'] <= 0).sum()),
                 'harga_nol_qty': int(df.loc[df['HARGA'] <= 0, 'QTY'].sum()),
                 'potongan_baris': int((selisih_bruto_bersih > 1).sum()),
                 'potongan_tersirat': int(selisih_bruto_bersih.sum()),
                 'selisih': int(((df['QTY'] * df['HARGA'] - df['JUMLAH']).abs() > 1).sum())},
        'monthly': monthly,
        'category_mix': category_mix,
        'basket': {'n': len(basket_df), 'median': float(basket_df['o'].median()),
                   'otak_n': len(with_otak), 'otak_ikan_n': len(with_otak_ikan),
                   'otak_ikan_share': float(len(with_otak_ikan) / len(with_otak)),
                   'pairs': [{'a': a, 'b': b, 'n': n} for (a, b), n in top_pairs],
                   'monthly': basket_monthly},
        'otak': {'share': float(otak['JUMLAH'].sum() / total), 'minaku_share': float(minaku_share),
                 'agu_baru': [{'n': k, 'o': int(v)} for k, v in agu_baru.items()],
                 'pembeli': int(nc.loc[nc['JENIS'] == 'Otak-Otak', 'PELANGGAN'].nunique())},
        'segmen': seg, 'baru': baru,
        'types': types,
        'p1': {'targets': len(p1_targets), 'buyers': len(ek), 'pen': len(ek) / len(rutin),
               'rep': float((ek['m'] >= 2).mean()), 'khusus': int(len(ek) - len(ek_campur)),
               'campur': len(ek_campur), 'rep_campur': float((ek_campur['m'] >= 2).mean()),
               'porsi': p1_porsi},
        'p2': {'targets': len(p2), 'otak_sum': int(p2['otak'].sum()), 'peer_n': len(p2_peer),
               'peer_ratio': float(p2_peer['rasio'].median()), 'target_ratio': float(p2['rasio'].median()),
               'target_ratio_max': float(p2['rasio'].max()), 'asumsi': ASUMSI_IKAN,
               'pembeli_otak_rutin': len(pembeli_otak)},
        'p3': {'bins': p3_bins, 'near_n': len(near), 'near_cust': int(near['PELANGGAN'].nunique()),
               'tambah_bulan': float(near['tambah'].sum() / N_BULAN),
               'harga': {'n': len(harga), 'median': float(harga['selisih'].median()),
                         'dalam2': float((harga['selisih'].abs() <= .02).mean())},
               'contoh': [{'n': nama_pendek(k), 'x': int(v['n']), 'c': int(v['cust'])} for k, v in contoh.iterrows()]},
        'potensi': [{'id': k, 'full': float(sum(v.values())), 'n': len(v)} for k, v in pot.items()],
        'rutin_n': len(rutin),
        'targets': targets,
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('// Dibuat otomatis oleh analisis/build_data.py — jangan diedit manual.\n'
                   'window.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')

    # Ringkasan di konsol untuk dicocokkan dengan narasi dashboard
    jt = lambda x: f'Rp{x / 1e6:,.1f} jt'
    print(f'Baris {len(df):,} | omzet {jt(total)} | pelanggan {data["meta"]["pelanggan"]} | rutin {len(rutin)}')
    for mo in monthly:
        print(f"  {mo['m']}: total {jt(mo['tot'])} | otak {jt(mo['otak'])} | lain {jt(mo['lain'])}")
    print('Lima jenis produk terbesar:', f"{sum(x['o'] for x in category_mix[:5]) / total:.1%} omzet")
    print('Keranjang pelanggan-hari rutin:', data['basket']['n'], '| median', jt(data['basket']['median']),
          '| Otak-Otak + olahan ikan',
          f"{data['basket']['otak_ikan_n']}/{data['basket']['otak_n']} ({data['basket']['otak_ikan_share']:.1%})")
    print('Segmen:', [(s['label'], s['n'], f"{s['share']:.1%}") for s in seg], '| baru Mei–Sep', baru)
    print('Otak-Otak share', f"{data['otak']['share']:.1%}", '| Agustus baru', data['otak']['agu_baru'])
    print('P1', data['p1'])
    print('P2', data['p2'])
    print('P3', {k: v for k, v in data['p3'].items() if k != 'bins'}, data['p3']['bins'])
    print('Potensi', data['potensi'], '| total', jt(sum(p['full'] for p in data['potensi'])), '| target unik', len(targets))
    print(f'Tulis {out}')


if __name__ == '__main__':
    main()
