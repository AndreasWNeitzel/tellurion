// Fermi vs Gamow-Teller beta decay, made intuitive through the spin
// bookkeeping that actually distinguishes them. The electron and
// antineutrino leave with their spins ANTIPARALLEL (lepton singlet,
// S=0) for a Fermi transition (vector coupling) or PARALLEL (triplet,
// S=1) for Gamow-Teller (axial coupling). Allowed decay carries no
// orbital angular momentum, so J_i = J_f + S_lep: that is why Fermi
// needs Delta J = 0 and GT allows Delta J = 0, +/-1 (never 0 -> 0).
// The emission diagram and the J_i = J_f + S vector triangle are the
// primary, slider-driven visuals; the beta spectrum and its Kurie
// linearisation (endpoint = Q) sit below.
// Reference: Krane, Introductory Nuclear Physics (1988), Ch. 9.

import { transitionType, kurie, betaSpectrum } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rT = document.getElementById('readout-t');
const sJi = document.getElementById('slider-ji'), vJi = document.getElementById('value-ji');
const sJf = document.getElementById('slider-jf'), vJf = document.getElementById('value-jf');
const selP = document.getElementById('select-p');
const sQ = document.getElementById('slider-Q'), vQ = document.getElementById('value-Q');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { Ji: 0.5, Jf: 0.5, dPi: 0, Q: 1000 };
const st = { ...DEF, t: 0 }; let running = true;
let last = performance.now();
const EMAX = 2200;

const jLabel = (v) => (v % 1 === 0 ? `${v}` : `${v * 2}/2`);
sJi.addEventListener('input', () => { st.Ji = parseInt(sJi.value, 10) / 2; vJi.textContent = jLabel(st.Ji); render(); });
sJf.addEventListener('input', () => { st.Jf = parseInt(sJf.value, 10) / 2; vJf.textContent = jLabel(st.Jf); render(); });
selP.addEventListener('change', () => { st.dPi = parseInt(selP.value, 10); render(); });
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value); vQ.textContent = st.Q; render(); });
btnR.addEventListener('click', () => { Object.assign(st, DEF); st.t = 0; sJi.value = '1'; sJf.value = '1'; selP.value = '0'; sQ.value = '1000'; vJi.textContent = '1/2'; vJf.textContent = '1/2'; vQ.textContent = '1000'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); startLoop(); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); startLoop(); });

function arrow(x, y, dx, dy, col, w) {
  const L = Math.hypot(dx, dy); if (L < 1e-6) return; const ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 9 * ux + 5 * uy, y + dy - 9 * uy - 5 * ux);
  ctx.lineTo(x + dx - 9 * ux - 5 * uy, y + dy - 9 * uy + 5 * ux);
  ctx.closePath(); ctx.fill();
}
function spinGlyph(x, y, up, col) {
  arrow(x, y + (up ? 13 : -13), 0, up ? -26 : 26, col, 2.5);
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const type = transitionType(st.Ji, st.Jf, st.dPi);
  const color = type === 'Fermi (pure)' ? '#ffd166' : type === 'GT (pure)' ? '#5bc0eb' : type === 'Mixed' ? '#06d6a0' : '#ef476f';
  const allowed = type !== 'Forbidden';
  const triplet = type === 'GT (pure)' || type === 'Mixed';   // S=1 leptons
  const ph = (st.t * 0.45) % 1;

  // Parent nucleus with J_i.
  const yC = 116;
  ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(150, yC, 30, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#9aa0a6'; ctx.stroke();
  ctx.fillStyle = '#cdd1d6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('parent', 150, yC + 50); ctx.fillText(`J_i = ${jLabel(st.Ji)}`, 150, yC + 66);
  arrow(150, yC, 0, -(22 + 16 * st.Ji), '#ffd166', 3);

  // Daughter nucleus with J_f. For GT the nuclear spin reorients
  // (it absorbs the recoil of a spin-1 lepton pair); for Fermi it does
  // not change direction.
  ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(430, yC, 30, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#9aa0a6'; ctx.stroke();
  ctx.fillStyle = '#cdd1d6'; ctx.fillText('daughter', 430, yC + 50); ctx.fillText(`J_f = ${jLabel(st.Jf)}`, 430, yC + 66);
  const jfAng = allowed && triplet ? -Math.PI / 2 + 0.7 * Math.sign(st.Jf - st.Ji || 1) : -Math.PI / 2;
  arrow(430, yC, (22 + 16 * st.Jf) * Math.cos(jfAng), (22 + 16 * st.Jf) * Math.sin(jfAng), color, 3);

  // Decay arrow.
  arrow(190, yC, 198, 0, 'rgba(154,160,166,0.7)', 2);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('β⁻', 290, yC - 10);

  if (allowed) {
    // Emitted e- and antineutrino with spin glyphs. Antiparallel for a
    // Fermi singlet (S=0), parallel for a Gamow-Teller triplet (S=1).
    // Fly down-left into the open lane between the nuclei row and the
    // lower spectrum strip (clear of the triangle and the panels).
    const ex = 430 - ph * 150, ey = yC + 36 + ph * 96;
    const nx = 470 - ph * 150, ny = yC + 70 + ph * 96;
    ctx.fillStyle = '#5bc0eb'; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#cdd1d6'; ctx.textAlign = 'center'; ctx.fillText('e⁻', ex, ey + 26);
    spinGlyph(ex, ey, true, '#5bc0eb');
    ctx.fillStyle = '#9aa0a6'; ctx.beginPath(); ctx.arc(nx, ny, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#cdd1d6'; ctx.fillText('ν̄', nx, ny + 24);
    spinGlyph(nx, ny, triplet, triplet ? '#9aa0a6' : '#ef476f');

    // Lepton-pair label.
    ctx.fillStyle = color; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(triplet ? 'lepton pair: TRIPLET  S=1  (spins ∥)' : 'lepton pair: SINGLET  S=0  (spins anti∥)', 470, yC - 28);

    // Vector triangle J_i = J_f + S_lep, drawn as a genuine closed
    // triangle: J_i and J_f both from the origin O, and S_lep as the
    // closing vector from the J_f tip to the J_i tip. (The previous
    // version computed the closing vector with a muddled scalar-as-
    // vector expression and did not actually close.)
    const tx = 620, ty = 232, sc = 24, S = triplet ? 1 : 0;
    ctx.fillStyle = '#7e828a'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('J_i = J_f + S_lep   (L = 0, allowed)', tx - 80, ty - 78);
    const Li = sc * (st.Ji + 0.6);
    const Lf = sc * (st.Jf + 0.6);
    const thF = 0.7;                                  // J_f drawn tilted by thF
    const PiTip = { x: tx, y: ty - Li };
    const PfTip = { x: tx + Lf * Math.sin(thF), y: ty - Lf * Math.cos(thF) };
    arrow(tx, ty, PiTip.x - tx, PiTip.y - ty, '#ffd166', 2.4);            // J_i
    arrow(tx, ty, PfTip.x - tx, PfTip.y - ty, color, 2.4);               // J_f
    arrow(PfTip.x, PfTip.y, PiTip.x - PfTip.x, PiTip.y - PfTip.y, '#e06fae', 2); // S_lep closes it
    ctx.fillStyle = '#ffd166'; ctx.fillText('J_i', PiTip.x - 22, PiTip.y - 4);
    ctx.fillStyle = color; ctx.fillText('J_f', PfTip.x + 6, PfTip.y);
    ctx.fillStyle = '#e06fae';
    ctx.fillText('S_lep', (PfTip.x + PiTip.x) / 2 + 6, (PfTip.y + PiTip.y) / 2);
    ctx.fillStyle = '#cdd1d6';
    ctx.fillText(`|ΔJ| = ${Math.abs(st.Jf - st.Ji)}`, tx - 30, ty + 26);
    ctx.fillText(`S_lep = ${S}`, tx - 30, ty + 42);
  } else {
    ctx.fillStyle = '#ef476f'; ctx.font = '15px ui-monospace, monospace'; ctx.textAlign = 'left';
    const why = st.dPi !== 0 ? 'parity change ⇒ needs L ≥ 1 (not an allowed transition)'
      : Math.abs(st.Jf - st.Ji) > 1 ? '|ΔJ| > 1 ⇒ leptons cannot carry it at L=0'
        : 'forbidden by the allowed selection rules';
    ctx.fillText('FORBIDDEN', 470, yC - 6); ctx.font = '12px ui-monospace, monospace';
    ctx.fillStyle = '#cdd1d6'; ctx.fillText(why, 470, yC + 16);
  }

  ctx.fillStyle = color; ctx.font = '20px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(type, 40, 36);

  // Lower strip: spectrum (left) and Kurie (right), fixed E axis.
  const gx0 = 70, gMid = W / 2 - 6, gx1b = W / 2 + 24, gx1 = W - 24;
  const gyb = H - 40, gyt = 300;
  const xOf = (a, b, E) => a + Math.min(EMAX, E) / EMAX * (b - a);
  const drawAxis = (a, b, label) => {
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(a, gyt); ctx.lineTo(a, gyb); ctx.lineTo(b, gyb); ctx.stroke();
    ctx.fillStyle = '#6e727a'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    for (let E = 0; E <= EMAX; E += 1000) ctx.fillText(`${E}`, xOf(a, b, E), gyb + 13);
    ctx.fillStyle = '#9aa0a6'; ctx.textAlign = 'left'; ctx.fillText(label, a + 2, gyt - 6);
  };
  if (allowed) {
    drawAxis(gx0, gMid, 'N(E) spectrum');
    let nmax = 1e-30; for (let E = 0; E <= st.Q; E += st.Q / 160) { const v = betaSpectrum(E, st.Q); if (v > nmax) nmax = v; }
    ctx.beginPath(); ctx.moveTo(gx0, gyb);
    for (let i = 0; i <= 200; i += 1) { const E = EMAX * i / 200; ctx.lineTo(xOf(gx0, gMid, E), Math.max(gyt, gyb - betaSpectrum(E, st.Q) / nmax * (gyb - gyt))); }
    ctx.lineTo(gMid, gyb); ctx.closePath(); ctx.fillStyle = color + '24'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
    drawAxis(gx1b, gx1, 'Kurie √(N/p²F Eₜ)  ∝ (Q−E)');
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(xOf(gx1b, gx1, 0), gyb - kurie(0, st.Q) / EMAX * (gyb - gyt));
    ctx.lineTo(xOf(gx1b, gx1, st.Q), gyb); ctx.stroke();
    ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(xOf(gx1b, gx1, st.Q), gyb, 4, 0, 2 * Math.PI); ctx.fill();
    for (const [a, b] of [[gx0, gMid], [gx1b, gx1]]) {
      ctx.strokeStyle = 'rgba(239,71,111,0.55)'; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(xOf(a, b, st.Q), gyt); ctx.lineTo(xOf(a, b, st.Q), gyb); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`Q = ${st.Q.toFixed(0)} keV (Kurie hits 0 here)`, gx1b + 4, gyt + 12);
  }
  rT.textContent = type;
}

let rafOn = false;
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && running && !CAPTURE_NAME) { rafOn = true; last = performance.now(); requestAnimationFrame(tick); } }
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 2.0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }
