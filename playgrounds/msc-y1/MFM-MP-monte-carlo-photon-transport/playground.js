// Monte Carlo photon transport. Panel A: photon histories in a tissue
// slab, coloured by interaction type, streaming in. Panel B: the depth
// dose with its build-up and the 2D dose map. Panel C: the interaction
// fractions versus energy and the energy balance. Gate-tested sim.js;
// deterministic. Klein and Nishina 1929; Attix 1986.
import { runMC, crossSections, interactionFractions } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rE = document.getElementById('readout-e');
const rMu = document.getElementById('readout-mu');
const rDmax = document.getElementById('readout-dmax');
const rDep = document.getElementById('readout-dep');
const slE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const slL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const slN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF = { eRaw: 300, L: 15, n: 8 };
const st = { ...DEF, running: true, ph: 0 };
const energy = () => Math.round(Math.pow(10, st.eRaw / 100));
const KCOL = ['#ff6b6b', '#6fd6e8', '#ffd166'];          // PE, Compton, Rayleigh
const KNAME = ['photoelectric', 'Compton', 'Rayleigh'];

const cache = {};
function rebuild() {
  const E0 = energy();
  cache.R = runMC({
    E0, nPhot: st.n * 1000, L: st.L, nBins: 150, seed: 0xC0FFEE,
    recordTracks: 64,
  });
  cache.cs = crossSections(E0);
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawSlab(x, y, w, h) {
  const R = cache.R;
  panel(x, y, w, h, `tissue slab: ${R.tracks.length} of ${R.nPhot} photon histories shown`);
  const px = x + 16, py = y + 28, pw = w - 32, ph = h - 64;
  const X = (d) => px + pw * d / R.L;
  const Y = (yy) => py + ph * (0.5 - yy / (2 * R.halfY));
  ctx.fillStyle = 'rgba(80,110,150,0.10)'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(200,210,235,0.55)'; ctx.font = '10px monospace';
  ctx.fillText('beam ->', px + 4, py - 6);
  const nShow = Math.max(1, Math.floor(R.tracks.length * (0.15 + 0.85 * st.ph)));
  for (let t = 0; t < nShow; t += 1) {
    const tk = R.tracks[t];
    ctx.strokeStyle = 'rgba(180,200,235,0.30)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < tk.pts.length; i += 1) {
      const xx = X(tk.pts[i][0]), yy = Y(tk.pts[i][1]);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    for (const ev of tk.events) {
      ctx.fillStyle = KCOL[ev.kind];
      ctx.beginPath(); ctx.arc(X(ev.x), Y(ev.y), 2.6, 0, 2 * Math.PI); ctx.fill();
    }
  }
  ctx.font = '10px monospace';
  let lx = px + 6;
  for (let k = 0; k < 3; k += 1) {
    ctx.fillStyle = KCOL[k]; ctx.fillRect(lx, y + h - 20, 10, 9);
    ctx.fillStyle = 'rgba(220,228,245,0.8)'; ctx.fillText(KNAME[k], lx + 14, y + h - 12);
    lx += 14 + KNAME[k].length * 6 + 14;
  }
  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  ctx.fillText(`0`, px - 2, py + ph + 14); ctx.fillText(`${R.L} cm depth`, px + pw - 56, py + ph + 14);
}

function drawDose(x, y, w, h) {
  const R = cache.R;
  panel(x, y, w, h, 'depth dose (build-up then attenuation) and the 2D dose map');
  const px = x + 36, py = y + 24, pw = w - 50, dh = (h - 60) * 0.56;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, dh);
  // smooth the displayed curve (moving average) to read the build-up
  // through the Monte Carlo noise; the raw array drives the invariants
  const nB = R.depth.length, sm = new Float64Array(nB);
  const KW = 4;
  for (let i = 0; i < nB; i += 1) {
    let s = 0, c = 0;
    for (let j = -KW; j <= KW; j += 1) { const k = i + j; if (k >= 0 && k < nB) { s += R.depth[k]; c += 1; } }
    sm[i] = s / c;
  }
  let dmax = 0; for (const v of sm) dmax = Math.max(dmax, v);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < nB; i += 1) {
    const xx = px + pw * i / (nB - 1), yy = py + dh * (1 - sm[i] / (dmax || 1));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  let smdm = 0; for (let i = 1; i < nB; i += 1) if (sm[i] > sm[smdm]) smdm = i;
  const xdm = px + pw * smdm / (nB - 1);
  ctx.strokeStyle = 'rgba(111,214,232,0.7)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xdm, py); ctx.lineTo(xdm, py + dh); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(111,214,232,0.85)'; ctx.font = '10px monospace';
  ctx.fillText(`d_max = ${(smdm * R.dz).toFixed(2)} cm`, xdm + 4, py + 12);
  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  ctx.fillText('relative dose', px + 4, py + dh - 6);
  ctx.fillText(`depth 0 - ${R.L} cm`, px + pw / 2 - 36, py + dh + 14);
  // 2D dose map
  const my0 = py + dh + 26, mh = (h - 60) * 0.44;
  let mmx = 0; for (const v of R.map) mmx = Math.max(mmx, v);
  const off = document.createElement('canvas'); off.width = R.MX; off.height = R.MY;
  const octx = off.getContext('2d'); const id = octx.createImageData(R.MX, R.MY);
  for (let k = 0; k < R.MX * R.MY; k += 1) {
    const t = mmx > 0 ? Math.pow(R.map[k] / mmx, 0.5) : 0;
    id.data[4 * k] = Math.round(255 * t);
    id.data[4 * k + 1] = Math.round(120 * t);
    id.data[4 * k + 2] = Math.round(60 + 40 * (1 - t));
    id.data[4 * k + 3] = 255;
  }
  octx.putImageData(id, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, px, my0, pw, mh);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(px, my0, pw, mh);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '10px monospace';
  ctx.fillText('2D dose map (depth vs lateral)', px + 4, my0 + 12);
}

function drawFractions(x, y, w, h) {
  panel(x, y, w, h, 'interaction fractions vs photon energy');
  const px = x + 34, py = y + 24, pw = w - 48, ph = h - 70;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const lo = 1, hi = 3.7;                                  // log10 keV: 10 keV .. 5 MeV
  const X = (lE) => px + pw * (lE - lo) / (hi - lo);
  const Y = (f) => py + ph * (1 - f);
  for (let kk = 0; kk < 3; kk += 1) {
    ctx.strokeStyle = KCOL[kk]; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const lE = lo + (hi - lo) * i / 160, E = Math.pow(10, lE);
      const fr = interactionFractions(E);
      const f = kk === 0 ? fr.pe : kk === 1 ? fr.compton : fr.rayleigh;
      const xx = X(lE), yy = Y(f);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  const lE0 = Math.log10(energy());
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(X(lE0), py); ctx.lineTo(X(lE0), py + ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '10px monospace';
  for (const e of [10, 100, 1000]) ctx.fillText(`${e}`, X(Math.log10(e)) - 8, py + ph + 14);
  ctx.fillText('photon energy keV (log)', px + pw / 2 - 56, py + ph + 26);
  ctx.fillText('fraction 0..1', px + 2, py + 10);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(10,11,16,0.85)'; ctx.fillRect(px + 4, py + ph - 16, 210, 14);
  let lx = px + 8;
  for (let k = 0; k < 3; k += 1) { ctx.fillStyle = KCOL[k]; ctx.fillText(KNAME[k], lx, py + ph - 5); lx += KNAME[k].length * 6 + 14; }
  // energy balance line
  const e = cache.R.energy;
  ctx.fillStyle = 'rgba(155,232,176,0.85)'; ctx.font = '11px monospace';
  ctx.fillText(`deposited ${(100 * e.deposited / e.input).toFixed(0)}%  transmitted ${(100 * e.transmitted / e.input).toFixed(0)}%  back ${(100 * e.backscattered / e.input).toFixed(0)}%`, px, y + h - 8);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawSlab(20, 20, half, H - 34);
  drawDose(20 + half + 12, 20, half, (H - 46) / 2);
  drawFractions(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  const R = cache.R, e = R.energy;
  rE.textContent = `${energy()} keV`;
  rMu.textContent = `${cache.cs.mu.toFixed(3)} /cm`;
  rDmax.textContent = `${(R.dmaxBin * R.dz).toFixed(2)} cm`;
  rDep.textContent = `${(100 * e.deposited / e.input).toFixed(0)}%`;
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 240) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() { vE.textContent = String(energy()); vL.textContent = String(st.L); vN.textContent = String(st.n); }
slE.addEventListener('input', () => { vE.textContent = String(Math.round(Math.pow(10, slE.value / 100))); });
slE.addEventListener('change', () => { st.eRaw = parseInt(slE.value, 10); rebuild(); draw(); });
slL.addEventListener('input', () => { vL.textContent = slL.value; });
slL.addEventListener('change', () => { st.L = parseInt(slL.value, 10); rebuild(); draw(); });
slN.addEventListener('input', () => { vN.textContent = slN.value; });
slN.addEventListener('change', () => { st.n = parseInt(slN.value, 10); rebuild(); draw(); });
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true;
  slE.value = String(DEF.eRaw); slL.value = String(DEF.L); slN.value = String(DEF.n);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { e: String(st.eRaw), L: String(st.L), n: String(st.n) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.e) { st.eRaw = parseInt(s.e, 10); slE.value = s.e; }
  if (s.L) { st.L = parseInt(s.L, 10); slL.value = s.L; }
  if (s.n) { st.n = parseInt(s.n, 10); slN.value = s.n; }
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync(); rebuild();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = fr; draw();
  } else { draw(); }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
