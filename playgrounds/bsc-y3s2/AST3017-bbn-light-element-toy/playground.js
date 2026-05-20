// Big Bang Nucleosynthesis. Primary view: the cooling early universe.
// Free protons and neutrons (a particle box at temperature T, falling
// from ~1 MeV) lock into deuterium and then helium-4 over the first
// few minutes, leaving the primordial mix. A mass-fraction bar shows
// the yield for the chosen baryon-to-photon ratio and compares it to
// the observed abundances (the lithium problem shows up here). The
// abundance-vs-eta curves are a diagnostic strip. Toy empirical fits
// in sim.js. Reference: Liddle, Cosmology Ch. 11; Kolb and Turner Ch. 4.
import { Yp, DH, Li7H, ETA_PLANCK, OBS_Yp, OBS_DH, OBS_Li7H } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rE = document.getElementById('readout-e');
const sE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { eta: 6.1, tau: 0 }; let running = true;
sE.addEventListener('input', () => { st.eta = parseFloat(sE.value); vE.textContent = st.eta.toFixed(2); st.tau = 0; });
btnR.addEventListener('click', () => { st.eta = ETA_PLANCK; sE.value = String(ETA_PLANCK); vE.textContent = ETA_PLANCK.toFixed(2); st.tau = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Deterministic nucleon layout (seeded), so capture frames reproduce.
let _s = 0x1234;
function rnd() { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; }
const NP = 150;
const nucl = [];
function seed() { _s = 0x1234; nucl.length = 0; for (let i = 0; i < NP; i += 1) nucl.push({ x: rnd(), y: rnd(), vx: (rnd() - 0.5), vy: (rnd() - 0.5), ph: rnd() * 6.2832 }); }
seed();

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const yp = Math.max(0, Math.min(0.5, Yp(st.eta)));     // 4He mass fraction
  const tau = st.tau;                                     // 0 = hot/free, 1 = settled
  // The early-universe box.
  const BX = 16, BY = 26, BW = W - 32, BH = Math.round(H * 0.50);
  ctx.fillStyle = '#0a0b12'; ctx.fillRect(BX, BY, BW, BH);
  ctx.strokeStyle = 'rgba(226,232,240,0.16)'; ctx.strokeRect(BX + 0.5, BY + 0.5, BW - 1, BH - 1);
  // cooling background glow (hot early -> cool)
  const gl = ctx.createLinearGradient(BX, BY, BX, BY + BH);
  const heat = 1 - tau;
  gl.addColorStop(0, `rgba(${120 * heat | 0},${50 * heat | 0},${30 * heat | 0},0.5)`);
  gl.addColorStop(1, 'rgba(10,12,22,0)');
  ctx.fillStyle = gl; ctx.fillRect(BX + 1, BY + 1, BW - 2, BH - 2);
  // helium fraction by count: each He-4 holds 4 nucleons -> count ~ yp/4
  const heCount = Math.round(NP * yp / 4);
  const dCount = Math.max(1, Math.round(NP * 6 * DH(st.eta)));   // a few D for visibility
  let placed = 0;
  for (let i = 0; i < NP; i += 1) {
    const p = nucl[i];
    const inHe = i < heCount * 4;
    const isD = !inHe && i < heCount * 4 + dCount * 2;
    // free motion when hot; drift into clusters as tau -> 1
    const fx = BX + 10 + p.x * (BW - 20);
    const fy = BY + 10 + p.y * (BH - 20);
    let cx = fx, cy = fy, col;
    if (inHe) {
      const g = Math.floor(i / 4);
      const gx = BX + 26 + ((g * 53) % (BW - 52));
      const gy = BY + 26 + (Math.floor(g * 53 / (BW - 52)) * 34) % (BH - 52);
      const k = i % 4, ox = (k % 2) * 7 - 3.5, oy = (k < 2 ? -3.5 : 3.5);
      cx = fx + (gx + ox - fx) * tau; cy = fy + (gy + oy - fy) * tau;
      col = '#d4a843';                                     // 4He
    } else if (isD) {
      col = '#5bc0eb';                                     // D (p-n)
    } else {
      col = (i % 2) ? '#7c9cff' : '#e2879c';               // free p / n
    }
    const jit = running && !CAPTURE_NAME ? (1 - tau) : 0;
    const dx = jit * 6 * Math.sin(st.ph0 + p.ph), dy = jit * 6 * Math.cos(st.ph0 + p.ph * 1.3);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx + dx, cy + dy, inHe ? 2.6 : 2.2, 0, 6.2832); ctx.fill();
    placed += 1;
  }
  ctx.fillStyle = 'rgba(226,232,240,0.85)'; ctx.font = '12px ui-monospace, monospace';
  const Tmev = (1.0 * Math.pow(0.07, tau)).toFixed(2);
  const tsec = (1 + tau * 1000).toFixed(0);
  ctx.fillText(`early universe assembling light nuclei   T ~ ${Tmev} MeV   t ~ ${tsec} s`, BX + 10, BY + 16);
  ctx.fillStyle = '#7c9cff'; ctx.fillText('p', BX + 10, BY + BH - 10);
  ctx.fillStyle = '#e2879c'; ctx.fillText('n', BX + 28, BY + BH - 10);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('D', BX + 46, BY + BH - 10);
  ctx.fillStyle = '#d4a843'; ctx.fillText('4He', BX + 66, BY + BH - 10);

  // Mass-fraction composition bar (the BBN yield) + observation check.
  const cy0 = BY + BH + 16, cbW = BW, cbH = 30;
  const Xh = 1 - yp;
  ctx.fillStyle = '#1e2a3a'; ctx.fillRect(BX, cy0, cbW, cbH);
  ctx.fillStyle = '#6b7280'; ctx.fillRect(BX, cy0, cbW * Xh, cbH);
  ctx.fillStyle = '#d4a843'; ctx.fillRect(BX + cbW * Xh, cy0, cbW * yp, cbH);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`H  ${(100 * Xh).toFixed(1)}%`, BX + 8, cy0 + 19);
  ctx.fillText(`4He  Y_p = ${yp.toFixed(3)}`, BX + cbW * Xh + 8, cy0 + 19);
  const dh = DH(st.eta), li = Li7H(st.eta);
  const okY = Math.abs(yp - OBS_Yp) < 0.006, okD = Math.abs(dh - OBS_DH) / OBS_DH < 0.15, okL = li / OBS_Li7H < 1.6;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = okY ? '#34d399' : '#fb7185'; ctx.fillText(`Y_p ${yp.toFixed(3)} (obs ${OBS_Yp})`, BX, cy0 + cbH + 18);
  ctx.fillStyle = okD ? '#34d399' : '#fb7185'; ctx.fillText(`D/H ${dh.toExponential(2)} (obs ${OBS_DH.toExponential(2)})`, BX + 210, cy0 + cbH + 18);
  ctx.fillStyle = okL ? '#34d399' : '#fb7185'; ctx.fillText(`7Li/H ${li.toExponential(2)} (obs ${OBS_Li7H.toExponential(2)})`, BX + 470, cy0 + cbH + 18);

  // Diagnostic strip: abundances vs eta (log), current-eta + Planck.
  const dY = cy0 + cbH + 28, dH2 = H - dY - 10, dW = BW;
  ctx.fillStyle = '#0a0b12'; ctx.fillRect(BX, dY, dW, dH2);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(BX + 0.5, dY + 0.5, dW - 1, dH2 - 1);
  ctx.fillStyle = 'rgba(200,206,224,0.6)'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('abundances vs baryon-to-photon ratio eta_10  (diagnostic)', BX + 8, dY + 13);
  const X = (e) => BX + 8 + (dW - 16) * (e - 1) / 19;
  function mini(fn, lo, hi, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const e = 1 + 19 * i / 120, v = (Math.log10(fn(e)) - lo) / (hi - lo);
      const yy = dY + dH2 - 8 - Math.max(0, Math.min(1, v)) * (dH2 - 24);
      if (i === 0) ctx.moveTo(X(e), yy); else ctx.lineTo(X(e), yy);
    }
    ctx.stroke();
  }
  mini((e) => Yp(e), -0.7, -0.55, '#d4a843');
  mini(DH, -5.4, -4.0, '#5bc0eb');
  mini(Li7H, -10.2, -8.6, '#34d399');
  ctx.strokeStyle = 'rgba(251,113,133,0.7)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(X(ETA_PLANCK), dY + 18); ctx.lineTo(X(ETA_PLANCK), dY + dH2 - 6); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(X(st.eta), dY + dH2 - 8, 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(251,113,133,0.85)'; ctx.fillText('Planck eta', X(ETA_PLANCK) + 5, dY + 26);

  rE.textContent = st.eta.toFixed(2);
}
let _t0 = performance.now();
function tick(now) {
  st.ph0 = (now || 0) * 0.004;
  if (running) st.tau = Math.min(1, st.tau + (now - _t0) / 1000 * 0.18);
  _t0 = now || _t0;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.ph0 = 0;
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.eta = 1.5 + frac * 16.5;                            // sweep baryon density
    st.tau = 1;                                            // settled primordial mix
    sE.value = String(st.eta); vE.textContent = st.eta.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
