/* Dashboard Peluang Upselling Frozen Food
 * Semua angka dibaca dari window.DATA (assets/data.js, hasil analisis/build_data.py).
 * Grafik digambar sebagai SVG tanpa library, supaya halaman bisa langsung di-host statis. */
(function () {
  'use strict';
  const D = window.DATA;
  if (!D) { console.error('assets/data.js tidak ditemukan'); return; }

  /* ---------------- Format angka (gaya Indonesia) ---------------- */
  const dec = (v, d) => v.toFixed(d).replace('.', ',');
  const num = v => Math.round(v).toLocaleString('id-ID');
  function rp(v, opt = {}) {
    const a = Math.abs(v), s = v < 0 ? '−' : (opt.sign ? '+' : '');
    if (a >= 1e9) return s + 'Rp' + dec(a / 1e9, 2) + ' M';
    if (a >= 1e6) return s + 'Rp' + dec(a / 1e6, a >= 1e8 ? 0 : 1) + ' jt';
    if (a >= 1e3) return s + 'Rp' + Math.round(a / 1e3) + ' rb';
    return s + 'Rp' + Math.round(a);
  }
  const jt = v => num(v / 1e6);                         // untuk sumbu: "755"
  const pct = (v, d = 0) => dec(v * 100, d) + '%';

  /* ---------------- Angka turunan ---------------- */
  const M = D.monthly;
  const byM = Object.fromEntries(M.map(m => [m.m, m]));
  const potFull = D.potensi.reduce((s, p) => s + p.full, 0);
  const potOf = id => D.potensi.find(p => p.id === id).full;
  const sumP = t => Object.values(t.p).reduce((a, b) => a + b, 0);
  const tTotal = D.targets.reduce((s, t) => s + sumP(t), 0);
  const top20 = D.targets.slice(0, 20).reduce((s, t) => s + sumP(t), 0) / tTotal;
  const seg = Object.fromEntries(D.segmen.map(s => [s.k, s]));
  const aguBaru = D.otak.agu_baru;

  const B = {
    periode: D.meta.periode,
    omzet: rp(D.meta.omzet),
    omzet_bulan: rp(D.meta.omzet_bulan),
    baris: num(D.meta.baris), sku: num(D.meta.sku), pelanggan: num(D.meta.pelanggan),
    harga_nol: num(D.meta.harga_nol), selisih: num(D.meta.selisih),
    otak_share: pct(D.otak.share), minaku_share: pct(D.otak.minaku_share),
    naik: pct(byM.Agu.tot / byM.Apr.tot - 1), turun: pct(1 - byM.Sep.tot / byM.Agu.tot),
    sep_turun: rp(byM.Sep.tot - byM.Agu.tot), otak_turun: rp(byM.Sep.otak - byM.Agu.otak),
    lain_naik: rp(byM.Sep.lain - byM.Agu.lain),
    agu_baru: rp(aguBaru.reduce((s, x) => s + x.o, 0)), agu_baru_n: String(aguBaru.length),
    agu_baru_nama: aguBaru.map(x => x.n).join(', '),
    rutin_n: num(seg.rutin.n), rutin_share: pct(seg.rutin.share),
    baru_n: num(D.baru.n), baru_share: pct(D.baru.share),
    baru_rata: '± ' + Math.round(D.baru.n / D.baru.per_bulan.length),
    p1_targets: num(D.p1.targets), p1_buyers: num(D.p1.buyers), p1_pen: pct(D.p1.pen), p1_rep: pct(D.p1.rep),
    p1_khusus: num(D.p1.khusus), p1_campur: num(D.p1.campur), p1_rep_campur: pct(D.p1.rep_campur),
    p1_porsi: pct(D.p1.porsi, 1),
    p2_targets: num(D.p2.targets), p2_otak: rp(D.p2.otak_sum), p2_peer_n: num(D.p2.peer_n),
    p2_peer: 'Rp' + Math.round(D.p2.peer_ratio * 100), p2_peer_pct: pct(D.p2.peer_ratio),
    p2_asumsi: pct(D.p2.asumsi),
    p3_cust: num(D.p3.near_cust), p3_near: num(D.p3.near_n), p3_harga: pct(D.p3.harga.median),
    pot1: rp(potOf(1)), pot2: rp(potOf(2)), pot3: rp(potOf(3)),
    pot_full: rp(potFull), pot_full_bln: rp(potFull) + ' per bulan', pot_pct: pct(potFull / D.meta.omzet_bulan, 1),
    top20: pct(top20), target_n: num(D.targets.length),
  };
  document.querySelectorAll('[data-b]').forEach(e => {
    const k = e.dataset.b;
    if (k in B) e.textContent = B[k]; else console.warn('binding tidak dikenal:', k);
  });

  /* ---------------- Helper SVG ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'style') n.setAttribute('style', attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgIn(box, w, h) {
    box.replaceChildren();
    return el('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h }, box);
  }
  // Batang dengan ujung data membulat 4px dan pangkal persegi
  function colPath(x, y, w, h, r = 4) {
    if (h <= 0) return '';
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  function rowPath(x, y, w, h, r = 4) {
    if (w <= 0) return '';
    r = Math.min(r, w, h / 2);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  }
  const fill = v => `fill:${v}`;

  /* ---------------- Tooltip ---------------- */
  const tip = document.getElementById('tip');
  function showTip(ev, head, rows, anchor) {
    tip.replaceChildren();
    const h = document.createElement('div'); h.className = 't-h'; h.textContent = head; tip.appendChild(h);
    rows.forEach(r => {
      const d = document.createElement('div'); d.className = 't-row';
      if (r.c) { const i = document.createElement('i'); i.style.background = r.c; d.appendChild(i); }
      const b = document.createElement('b'); b.textContent = r.v; d.appendChild(b);
      if (r.l) { const s = document.createElement('span'); s.textContent = r.l; d.appendChild(s); }
      tip.appendChild(d);
    });
    let x, y;
    if (ev && ev.clientX != null && ev.type !== 'focus') { x = ev.clientX; y = ev.clientY; }
    else { const b = anchor.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top; }
    tip.classList.add('on');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = x + 14, top = y - th - 12;
    if (left + tw > innerWidth - 8) left = x - tw - 14;
    if (left < 8) left = 8;
    if (top < 8) top = y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  const hideTip = () => tip.classList.remove('on');
  // Jadikan <g> sebagai target hover/fokus yang memunculkan tooltip
  function hover(g, svg, getTip) {
    g.classList.add('mark'); g.setAttribute('tabindex', '0');
    const on = ev => { svg.classList.add('dim'); g.classList.add('hover'); const t = getTip(); showTip(ev, t.h, t.r, g); };
    const off = () => { svg.classList.remove('dim'); g.classList.remove('hover'); hideTip(); };
    g.addEventListener('pointerenter', on); g.addEventListener('pointermove', on);
    g.addEventListener('pointerleave', off); g.addEventListener('focus', on); g.addEventListener('blur', off);
  }
  addEventListener('scroll', hideTip, { passive: true });

  /* ---------------- Tabel pendamping grafik ---------------- */
  function table(id, head, rows) {
    const wrap = document.getElementById(id + '-tbl');
    const t = document.createElement('table'); t.className = 'data-table';
    const tr = document.createElement('tr');
    head.forEach((h, i) => { const th = document.createElement('th'); th.textContent = h; if (i) th.className = 'n'; tr.appendChild(th); });
    const thead = document.createElement('thead'); thead.appendChild(tr); t.appendChild(thead);
    const tb = document.createElement('tbody');
    rows.forEach(r => {
      const row = document.createElement('tr');
      r.forEach((c, i) => { const td = document.createElement('td'); td.textContent = c; if (i) td.className = 'n'; row.appendChild(td); });
      tb.appendChild(row);
    });
    t.appendChild(tb); wrap.replaceChildren(t);
  }
  document.querySelectorAll('.tbl-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.for, tw = document.getElementById(id + '-tbl'), ch = document.getElementById(id);
      const show = tw.hidden;
      tw.hidden = !show; ch.hidden = show;
      btn.textContent = show ? 'Lihat grafik' : 'Lihat tabel';
    });
  });

  /* ================= C1: omzet bulanan bertumpuk ================= */
  function drawC1(box) {
    const W = Math.max(300, box.clientWidth), narrow = W < 520;
    const H = 300, m = { l: 44, r: narrow ? 8 : 64, t: 26, b: 28 };
    const svg = svgIn(box, W, H), pw = W - m.l - m.r, ph = H - m.t - m.b;
    const max = 1000e6, y = v => m.t + ph - v / max * ph;
    const ax = el('g', { class: 'ax' }, svg);
    [0, 250e6, 500e6, 750e6, 1000e6].forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), style: `stroke:${v ? 'var(--grid)' : 'var(--axis)'}`, 'stroke-width': 1 }, ax);
      el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', text: jt(v) }, ax);
    });
    const band = pw / M.length, bw = Math.min(24, band * 0.5);
    M.forEach((d, i) => {
      const cx = m.l + band * i + band / 2, x = cx - bw / 2;
      const g = el('g', {}, svg);
      el('rect', { class: 'hit', x: m.l + band * i + 2, y: m.t, width: band - 4, height: ph, style: 'fill:transparent' }, g);
      const yl = y(d.lain);
      el('rect', { x, y: yl, width: bw, height: y(0) - yl, style: fill('var(--context)') }, g);
      el('path', { d: colPath(x, y(d.tot), bw, Math.max(0, yl - y(d.tot) - 2)), style: fill('var(--alert)') }, g);
      const key = d.m === 'Agu' || d.m === 'Sep';
      el('text', { x: cx, y: y(d.tot) - 8, 'text-anchor': 'middle', class: key ? 'lbl-ink' : 'lbl-2', text: jt(d.tot) }, g);
      el('text', { x: cx, y: H - 8, 'text-anchor': 'middle', class: 'tick', text: d.m }, g);
      if (key && !narrow) {
        el('text', { x: x + bw + 6, y: (y(d.tot) + yl) / 2 + 4, class: 'lbl-2', text: jt(d.otak) }, g);
      }
      hover(g, svg, () => ({
        h: d.m + ' 2020', r: [
          { c: 'var(--alert)', v: rp(d.otak), l: 'Otak-Otak' },
          { c: 'var(--context)', v: rp(d.lain), l: 'Produk lain' },
          { v: rp(d.tot), l: 'Total' }]
      }));
    });
    table('c1', ['Bulan', 'Otak-Otak', 'Produk lain', 'Total'], M.map(d => [d.m, rp(d.otak), rp(d.lain), rp(d.tot)]));
  }

  /* ================= C2: porsi omzet per kelompok pelanggan ================= */
  function drawC2(box) {
    const W = Math.max(300, box.clientWidth), rowH = 62, H = D.segmen.length * rowH + 4;
    const svg = svgIn(box, W, H), labW = 128, pw = W - labW;
    D.segmen.forEach((s, i) => {
      const y0 = i * rowH, g = el('g', {}, svg), hl = s.k === 'rutin';
      el('rect', { class: 'hit', x: 0, y: y0, width: W, height: rowH - 4, style: 'fill:transparent' }, g);
      const name = s.label + (s.n ? ` (${num(s.n)})` : '');
      el('text', { x: 0, y: y0 + 16, class: 'lbl-ink', text: name }, g);
      el('text', { x: 0, y: y0 + 32, class: 'tick', text: s.sub }, g);
      el('path', { d: rowPath(0, y0 + 38, Math.max(2, s.share * pw), 16), style: fill(hl ? 'var(--accent)' : 'var(--context)') }, g);
      el('text', { x: Math.max(2, s.share * pw) + 8, y: y0 + 51, class: hl ? 'lbl-ink' : 'lbl-2', text: `${pct(s.share)} · ${rp(s.o)}` }, g);
      hover(g, svg, () => ({ h: name, r: [{ v: pct(s.share, 1), l: 'dari total omzet' }, { v: rp(s.o), l: 'omzet Apr–Sep' }] }));
    });
    table('c2', ['Kelompok', 'Pelanggan', 'Omzet', 'Porsi'], D.segmen.map(s => [s.label, s.n ? num(s.n) : '–', rp(s.o), pct(s.share, 1)]));
  }

  /* ================= C3: penetrasi vs pembelian ulang ================= */
  const LBL = { // posisi label: kanan (r) / kiri (l)
    'Sosis': 'r', 'Nugget': 'r', 'Otak-Otak': 'r', 'Kentang Goreng': 'l', 'Dimsum & Camilan': 'r',
    'Bakso Ikan': 'l', 'Bakso Daging': 'l', 'Olahan Ikan Lain': 'l', 'Burger & Tortila': 'r',
    'Es Krim': 'r', 'Kulit Lumpia': 'r', 'Keju': 'r', 'Saus & Mayo': 'r'
  };
  const SPARSE = ['Es Krim', 'Sosis', 'Burger & Tortila', 'Kulit Lumpia', 'Keju', 'Saus & Mayo'];
  function drawC3(box) {
    const W = Math.max(300, box.clientWidth), narrow = W < 560;
    const H = narrow ? 320 : 380, m = { l: 62, r: 14, t: 12, b: 46 };
    const svg = svgIn(box, W, H), pw = W - m.l - m.r, ph = H - m.t - m.b;
    const x = v => m.l + v * pw, y0 = 0.4, y = v => m.t + ph - (v - y0) / (1 - y0) * ph;
    // area peluang (kiri atas)
    el('rect', { x: x(0), y: y(1), width: x(0.5) - x(0), height: y(0.7) - y(1), rx: 6, style: 'fill:var(--accent-wash)' }, svg);
    el('text', { x: x(0) + 8, y: y(1) + 16, class: 'lbl-ink', style: 'font-size:12px', text: 'Peluang: sering dibeli ulang,' }, svg);
    el('text', { x: x(0) + 8, y: y(1) + 31, class: 'lbl-ink', style: 'font-size:12px', text: 'belum merata' }, svg);
    const ax = el('g', { class: 'ax' }, svg);
    [0, .25, .5, .75, 1].forEach(v => {
      el('line', { x1: x(v), x2: x(v), y1: m.t, y2: m.t + ph, style: 'stroke:var(--grid)', 'stroke-width': 1 }, ax);
      el('text', { x: x(v), y: m.t + ph + 16, 'text-anchor': v === 0 ? 'start' : v === 1 ? 'end' : 'middle', text: pct(v) }, ax);
    });
    [.4, .6, .8, 1].forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), style: `stroke:${v === .4 ? 'var(--axis)' : 'var(--grid)'}`, 'stroke-width': 1 }, ax);
      el('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end', text: pct(v) }, ax);
    });
    el('text', { x: m.l + pw / 2, y: H - 6, 'text-anchor': 'middle', class: 'tick', text: 'Pelanggan rutin yang membeli →' }, ax);
    el('text', { x: 12, y: m.t + ph / 2, 'text-anchor': 'middle', class: 'tick', transform: `rotate(-90 12 ${m.t + ph / 2})`, text: 'Pembeli yang membeli lagi →' }, ax);
    const pts = [...D.types].sort((a, b) => (a.j === 'Es Krim') - (b.j === 'Es Krim'));
    pts.forEach(t => {
      const hl = t.j === 'Es Krim', cx = x(t.pen), cy = y(t.rep), g = el('g', {}, svg);
      el('circle', { class: 'hit', cx, cy, r: 13, style: 'fill:transparent' }, g);
      el('circle', { cx, cy, r: hl ? 7 : 5.5, style: `fill:${hl ? 'var(--accent)' : 'var(--context)'};stroke:var(--surface);stroke-width:2` }, g);
      if (!narrow || SPARSE.includes(t.j)) {
        // di layar sempit label "Saus & Mayo" turun ke bawah titik agar tidak menabrak Es Krim
        const side = narrow && t.j === 'Saus & Mayo' ? 'b' : (LBL[t.j] || 'r');
        const pos = { r: [cx + 10, cy + 4, 'start'], l: [cx - 10, cy + 4, 'end'], b: [cx - 4, cy + 19, 'start'] }[side];
        el('text', { x: pos[0], y: pos[1], 'text-anchor': pos[2], class: hl ? 'lbl-ink' : 'lbl-2', style: hl ? 'font-size:13.5px' : 'font-size:12px', text: t.j }, g);
      }
      hover(g, svg, () => ({
        h: t.j, r: [
          { v: pct(t.pen), l: `pelanggan rutin membeli (${t.buyers} dari ${num(D.rutin_n)})` },
          { v: pct(t.rep), l: 'pembeli membeli lagi di bulan lain' },
          { v: rp(t.o), l: 'omzet dari pelanggan rutin' }]
      }));
    });
    table('c3', ['Jenis produk', 'Pembeli', 'Pelanggan rutin membeli', 'Dibeli ulang', 'Omzet'],
      D.types.map(t => [t.j, num(t.buyers), pct(t.pen), pct(t.rep), rp(t.o)]));
  }

  /* ================= M1: es krim sudah vs belum ================= */
  function drawM1(box) {
    const W = Math.max(240, box.clientWidth), H = 58, svg = svgIn(box, W, H);
    const tot = D.p1.buyers + D.p1.targets, w1 = D.p1.buyers / tot * W;
    const g1 = el('g', {}, svg), g2 = el('g', {}, svg);
    el('rect', { x: 0, y: 4, width: w1 - 1, height: 24, style: fill('var(--context)') }, g1);
    el('path', { d: rowPath(w1 + 1, 4, W - w1 - 1, 24), style: fill('var(--accent)') }, g2);
    el('text', { x: 0, y: 48, class: 'lbl-2', text: `${D.p1.buyers} sudah membeli` }, g1);
    el('text', { x: W, y: 48, 'text-anchor': 'end', class: 'lbl-ink', text: `${D.p1.targets} belum pernah → target` }, g2);
    hover(g1, svg, () => ({ h: 'Pelanggan rutin', r: [{ c: 'var(--context)', v: num(D.p1.buyers), l: 'sudah membeli es krim' }] }));
    hover(g2, svg, () => ({ h: 'Pelanggan rutin', r: [{ c: 'var(--accent)', v: num(D.p1.targets), l: 'belum pernah membeli es krim' }] }));
  }

  /* ================= M2: olahan ikan per Rp100 Otak-Otak ================= */
  function drawM2(box) {
    const W = Math.max(240, box.clientWidth), H = 104, svg = svgIn(box, W, H), pw = W - 52;
    const rows = [
      { l: `${D.p2.peer_n} pembeli Otak-Otak rutin lain`, v: D.p2.peer_ratio, c: 'var(--context)', ink: false },
      { l: `${D.p2.targets} pelanggan target`, v: D.p2.target_ratio, c: 'var(--accent)', ink: true },
    ];
    rows.forEach((r, i) => {
      const y0 = i * 52, g = el('g', {}, svg), w = Math.max(3, r.v * pw);
      el('rect', { class: 'hit', x: 0, y: y0, width: W, height: 48, style: 'fill:transparent' }, g);
      el('text', { x: 0, y: y0 + 14, class: 'lbl-2', text: r.l }, g);
      el('path', { d: rowPath(0, y0 + 22, w, 16), style: fill(r.c) }, g);
      el('text', { x: w + 8, y: y0 + 35, class: r.ink ? 'lbl-ink' : 'lbl-2', text: 'Rp' + Math.round(r.v * 100) }, g);
      hover(g, svg, () => ({ h: r.l, r: [{ c: r.c, v: 'Rp' + Math.round(r.v * 100), l: 'olahan ikan per Rp100 Otak-Otak (median)' }] }));
    });
  }

  /* ================= M3: pembelian eceran sebagai % isi dus ================= */
  function drawM3(box) {
    const W = Math.max(240, box.clientWidth), H = 150, m = { t: 20, b: 22 }, svg = svgIn(box, W, H);
    const bins = D.p3.bins, ph = H - m.t - m.b, max = Math.max(...bins.map(b => b.n));
    const band = W / bins.length, bw = Math.min(24, band * 0.5);
    el('line', { x1: 0, x2: W, y1: m.t + ph, y2: m.t + ph, style: 'stroke:var(--axis)', 'stroke-width': 1 }, svg);
    bins.forEach((b, i) => {
      const cx = band * i + band / 2, h = b.n / max * ph, g = el('g', {}, svg);
      el('rect', { class: 'hit', x: band * i + 1, y: 0, width: band - 2, height: H, style: 'fill:transparent' }, g);
      el('path', { d: colPath(cx - bw / 2, m.t + ph - h, bw, h), style: fill(b.hl ? 'var(--accent)' : 'var(--context)') }, g);
      el('text', { x: cx, y: m.t + ph - h - 6, 'text-anchor': 'middle', class: b.hl ? 'lbl-ink' : 'lbl-2', style: 'font-size:12px', text: num(b.n) }, g);
      el('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'tick', style: 'font-size:11px', text: b.b }, g);
      hover(g, svg, () => ({ h: 'Beli eceran ' + b.b + ' isi dus / bulan', r: [{ c: b.hl ? 'var(--accent)' : 'var(--context)', v: num(b.n), l: 'kejadian (pelanggan × produk × bulan)' }, { v: num(b.cust), l: 'pelanggan' }] }));
    });
  }

  /* ================= C5: kalkulator potensi ================= */
  const NAMA_P = { 1: 'Coba Es Krim', 2: 'Paket Otak-Otak + Olahan Ikan', 3: 'Genapkan ke Dus' };
  let rate = 0.3;
  function drawC5(box) {
    const W = Math.max(280, box.clientWidth), rowH = 58, H = D.potensi.length * rowH, svg = svgIn(box, W, H);
    const max = Math.max(...D.potensi.map(p => p.full));
    D.potensi.forEach((p, i) => {
      const y0 = i * rowH, g = el('g', {}, svg), wf = p.full / max * W, ws = wf * rate;
      el('rect', { class: 'hit', x: 0, y: y0, width: W, height: rowH - 6, style: 'fill:transparent' }, g);
      el('text', { x: 0, y: y0 + 15, class: 'lbl-ink', text: `${p.id} · ${NAMA_P[p.id]}` }, g);
      el('text', { x: W, y: y0 + 15, 'text-anchor': 'end', class: 'lbl-2', text: `${rp(p.full * rate)} dari ${rp(p.full)}` }, g);
      el('path', { d: rowPath(0, y0 + 24, wf, 20), style: fill('var(--accent-soft)') }, g);
      el('path', { d: rowPath(0, y0 + 24, ws, 20), style: fill('var(--accent)') }, g);
      hover(g, svg, () => ({
        h: NAMA_P[p.id] + ` (${p.n} pelanggan)`, r: [
          { c: 'var(--accent)', v: rp(p.full * rate), l: `per bulan pada skenario ${pct(rate)}` },
          { c: 'var(--accent-soft)', v: rp(p.full), l: 'potensi penuh per bulan' }]
      }));
    });
    const tot = potFull * rate;
    document.getElementById('potTotal').replaceChildren(document.createTextNode(rp(tot) + ' '), Object.assign(document.createElement('small'), { textContent: '/ bulan' }));
    document.getElementById('potSub').textContent = `≈ ${pct(tot / D.meta.omzet_bulan, 1)} omzet bulanan · ${rp(tot * 3)} selama pilot 3 bulan · ${rp(tot * 12)} per tahun`;
    document.getElementById('rateOut').textContent = pct(rate);
    document.querySelectorAll('[data-rate]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.rate) === Math.round(rate * 100))));
  }
  const slider = document.getElementById('rate');
  slider.addEventListener('input', () => { rate = Number(slider.value) / 100; drawC5(document.getElementById('c5')); });
  document.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => {
    slider.value = b.dataset.rate; rate = Number(b.dataset.rate) / 100; drawC5(document.getElementById('c5'));
  }));

  /* ================= Tabel pelanggan target ================= */
  const PILL = { 1: '1 · Es Krim', 2: '2 · Paket Ikan', 3: '3 · Dus' };
  let filt = 'all', showAll = false;
  const fBox = document.getElementById('tFilters');
  [['all', `Semua (${D.targets.length})`], ...[1, 2, 3].map(k => [String(k), `${PILL[k]} (${D.targets.filter(t => t.p[k]).length})`])]
    .forEach(([k, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = label; b.dataset.f = k;
      b.addEventListener('click', () => { filt = k; showAll = false; renderTable(); });
      fBox.appendChild(b);
    });
  function renderTable() {
    const val = t => filt === 'all' ? sumP(t) : (t.p[filt] || 0);
    const rows = D.targets.filter(t => filt === 'all' || t.p[filt]).sort((a, b) => val(b) - val(a));
    const shown = showAll ? rows : rows.slice(0, 20), max = Math.max(...rows.map(val));
    const tb = document.querySelector('#tTable tbody'); tb.replaceChildren();
    shown.forEach((t, i) => {
      const tr = document.createElement('tr');
      const td = (txt, cls) => { const c = document.createElement('td'); if (cls) c.className = cls; if (txt != null) c.textContent = txt; tr.appendChild(c); return c; };
      td(String(i + 1), 'rank'); td(t.n, 'name'); td(rp(t.pm), 'n hide-sm'); td(`${t.m} / 6`, 'n hide-sm');
      const pc = td(null);
      Object.keys(t.p).forEach(k => { const s = document.createElement('span'); s.className = 'pill'; s.textContent = PILL[k]; pc.appendChild(s); });
      const vc = td(null, 'n'), wrap = document.createElement('div'); wrap.className = 'bar-cell';
      const bar = document.createElement('i'); bar.style.width = Math.max(2, val(t) / max * 70) + 'px';
      const v = document.createElement('span'); v.textContent = rp(val(t));
      wrap.append(bar, v); vc.appendChild(wrap);
      tb.appendChild(tr);
    });
    fBox.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === filt)));
    const more = document.getElementById('tMore');
    more.hidden = rows.length <= 20;
    more.textContent = showAll ? 'Tampilkan 20 teratas' : `Tampilkan semua (${rows.length})`;
  }
  document.getElementById('tMore').addEventListener('click', () => { showAll = !showAll; renderTable(); });
  renderTable();

  /* ---------------- Render + responsif ---------------- */
  const charts = { c1: drawC1, c2: drawC2, c3: drawC3, m1: drawM1, m2: drawM2, m3: drawM3, c5: drawC5 };
  Object.entries(charts).forEach(([id, fn]) => {
    const box = document.getElementById(id);
    let lastW = 0, raf = 0;
    const run = () => { const w = box.clientWidth; if (w && w !== lastW) { lastW = w; fn(box); } };
    run();
    if ('ResizeObserver' in window) new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); }).observe(box);
  });

  /* ---------------- Tema terang / gelap ---------------- */
  const root = document.documentElement, btn = document.getElementById('themeBtn');
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const effective = () => root.dataset.theme || (mq.matches ? 'dark' : 'light');
  const label = () => { btn.textContent = effective() === 'dark' ? 'Mode terang' : 'Mode gelap'; };
  try { const s = localStorage.getItem('upsell-theme'); if (s === 'light' || s === 'dark') root.dataset.theme = s; } catch (e) { /* abaikan */ }
  label();
  btn.addEventListener('click', () => {
    root.dataset.theme = effective() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('upsell-theme', root.dataset.theme); } catch (e) { /* abaikan */ }
    label();
  });
  mq.addEventListener && mq.addEventListener('change', label);

  /* ---------------- Navigasi aktif ---------------- */
  const links = [...document.querySelectorAll('.nav a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section.story').forEach(s => io.observe(s));
  }
})();
