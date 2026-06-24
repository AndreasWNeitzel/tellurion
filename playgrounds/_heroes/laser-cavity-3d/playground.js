// Laser cavity hero. Canvas2D schematic of a two-mirror cavity with a
// pumped gain medium. The continuous-wave visuals are driven by the exact
// steady state of the laser rate equations (./sim.js): below the pump
// threshold the cavity is dark, at threshold the inversion clamps at
// N_th = 1/(B tauC) and every extra pumped atom feeds the beam, so the
// output rises linearly with a sharp kink. The intracavity standing wave
// grows with the photon number n = (P - P_th) tauC, the gain atoms glow
// with the inversion, and the beam leaves the partial output coupler. The
// Q-switch is integrated numerically: a large stored inversion dumps as
// one genuine giant pulse. A live n(t), N(t) trace shows the turn-on, and
// the secondary canvas plots output against pump.
//
// References: Siegman, Lasers, 1986, Ch. 13; Svelto, Principles of
// Lasers, 5th ed., 2010, Ch. 7-8.

import { cavityLifetime, thresholdPump, thresholdInversion, makeLaser, step, outputPower, steadyState } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const plot = document.getElementById('plot');
const pctx = plot.getContext('2d');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const ui = {
  Lc: 1, R: 0.92, tau: 1, P: 0.08, running: !prefersReducedMotion(),
  qArmed: false, qOpen: true, qT: 0, phase: 0,
  dispN: 0, dispPhot: 0, dispOut: 0, nRef: 1, outRef: 1, plotCurve: null,
};
const sim = makeLaser({ P: ui.P, tau: ui.tau, tauC: cavityLifetime(ui.Lc, ui.R), B: 1, seed: 1e-4, qLow: 1e-3 });

const HIST = 320;
const nHist = [], NHist = [];

// Fixed gain-medium atoms (seeded), each with a pump-excitation threshold.
const ATOMS = [];
{
  let s = 0x1234abcd;
  const rnd = () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF; };
  for (let i = 0; i < 64; i += 1) ATOMS.push({ u: rnd(), v: rnd() * 2 - 1, q: rnd(), ph: rnd() * 6.28, flash: 0 });
}

// =========================================================================
// Exact rate-equation steady state (the CW operating point).
// =========================================================================
function lcParams() {
  const tauC = cavityLifetime(ui.Lc, ui.R);
  const Nth = thresholdInversion(1, tauC);
  const Pth = Nth / ui.tau;
  return { tauC, Nth, Pth };
}
function analyticSS(P) {
  const { tauC, Nth, Pth } = lcParams();
  if (P <= Pth) return { N: P * ui.tau, n: 1e-4 * (P / Math.max(1e-9, Pth)), out: 0 };
  return { N: Nth, n: (P - Pth) * tauC, out: P - Pth };
}

function syncParams() {
  sim.P = ui.P; sim.tau = ui.tau; sim.tauC = cavityLifetime(ui.Lc, ui.R);
  const { Pth } = lcParams();
  ui.nRef = Math.max(1e-6, analyticSS(0.6).n);
  ui.outRef = Math.max(1e-6, analyticSS(0.6).out);
  // Threshold curve, cached. X spans enough to show the kink and the
  // current pump; the analytic output is exact (sharp kink at P_th).
  const Pmax = Math.max(8 * Pth, ui.P * 1.2, 0.12);
  const pts = []; let omax = 1e-9;
  for (let k = 0; k <= 120; k += 1) {
    const P = (k / 120) * Pmax;
    const o = analyticSS(P).out;
    pts.push([P, o]); omax = Math.max(omax, o);
  }
  ui.plotCurve = { pts, omax, Pmax, Pth };
}

const RKEYS = ['pump P', 'P_threshold', 'inversion N', 'photons n', 'output', 'state'];
const rEls = {};
for (const k of RKEYS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.append(lab, val); rEls[k] = val;
}

function slider(label, min, max, stp, value, fmt, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
  inp.addEventListener('input', () => { val.textContent = fmt(parseFloat(inp.value)); onInput(parseFloat(inp.value)); });
  row.append(lab, inp, val); controlsEl.appendChild(row); return inp;
}
const sP = slider('pump P', 0, 0.6, 0.005, ui.P, (v) => v.toFixed(3), (v) => { ui.P = v; syncParams(); });
slider('mirror R', 0.5, 0.99, 0.005, ui.R, (v) => v.toFixed(3), (v) => { ui.R = v; syncParams(); });
slider('cavity length', 0.5, 3, 0.05, ui.Lc, (v) => v.toFixed(2), (v) => { ui.Lc = v; syncParams(); });
slider('upper tau', 0.3, 6, 0.1, ui.tau, (v) => v.toFixed(1), (v) => { ui.tau = v; syncParams(); });
function sel(label, opts, on) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const o of opts) { const op = document.createElement('option'); op.textContent = o; s.appendChild(op); }
  const v = document.createElement('span'); v.className = 'value'; v.textContent = '';
  s.addEventListener('change', () => on(s.value)); row.append(lab, s, v); controlsEl.appendChild(row); return s;
}
sel('preset', ['below threshold', 'at threshold', 'well above threshold', 'Q-switched giant pulse'], (p) => {
  ui.qArmed = false; ui.qOpen = true;
  const { Pth } = lcParams();
  if (p === 'below threshold') ui.P = 0.6 * Pth;
  else if (p === 'at threshold') ui.P = 1.05 * Pth;
  else if (p === 'well above threshold') ui.P = 4 * Pth;
  else { ui.tau = 5; ui.P = 0.25; ui.qArmed = true; ui.qOpen = false; ui.qT = 0; sim.N = 0; sim.n = 1e-9; }
  sP.value = ui.P.toFixed(3); syncParams();
});
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.textContent = 'Pause';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bQ = document.createElement('button'); bQ.type = 'button'; bQ.textContent = 'Q-switch: build & fire';
btnRow.append(bPause, bReset, bQ); controlsEl.appendChild(btnRow);
bPause.addEventListener('click', () => { ui.running = !ui.running; bPause.textContent = ui.running ? 'Pause' : 'Play'; });
bReset.addEventListener('click', () => { ui.qArmed = false; ui.qOpen = true; ui.dispN = 0; ui.dispPhot = 0; ui.dispOut = 0; nHist.length = 0; NHist.length = 0; });
bQ.addEventListener('click', () => { ui.tau = 5; ui.P = 0.25; ui.qArmed = true; ui.qOpen = false; ui.qT = 0; sim.N = 0; sim.n = 1e-9; syncParams(); });

const clamp01 = (x) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
function levels() {
  const { Nth } = lcParams();
  const invF = clamp01(ui.dispN / Math.max(1.4 * Nth, 0.02));
  const photF = clamp01(Math.sqrt(Math.max(0, ui.dispPhot) / Math.max(1e-9, ui.nRef)));
  const outF = clamp01(ui.dispOut / Math.max(1e-9, ui.outRef));
  return { invF, photF, outF };
}

// =========================================================================
// HERO: the cavity schematic.
// =========================================================================
const HERO = { y0: 46, y1: 612 };
function drawCavity(invF, photF, outF) {
  const yMid = (HERO.y0 + HERO.y1) / 2;
  const xL = 116, xR = 648, Lpx = xR - xL;
  const halfH = 150;
  const pumping = Math.min(1, ui.P / 0.25);
  const qShut = ui.qArmed && !ui.qOpen;

  ctx.strokeStyle = 'rgba(150, 170, 210, 0.18)'; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
  ctx.beginPath(); ctx.moveTo(xL - 26, yMid); ctx.lineTo(xR + 150, yMid); ctx.stroke();
  ctx.setLineDash([]);

  // Gain medium rod, tinted with the inversion.
  const gx0 = xL + 70, gx1 = xR - 70, gh = halfH * 0.82;
  const grad = ctx.createLinearGradient(0, yMid - gh, 0, yMid + gh);
  grad.addColorStop(0, 'rgba(90, 70, 30, 0.10)');
  grad.addColorStop(0.5, `rgba(${Math.round(120 + 90 * invF)}, ${Math.round(80 + 40 * invF)}, 40, ${(0.10 + 0.18 * invF).toFixed(3)})`);
  grad.addColorStop(1, 'rgba(90, 70, 30, 0.10)');
  ctx.fillStyle = grad;
  ctx.fillRect(gx0, yMid - gh, gx1 - gx0, 2 * gh);
  ctx.strokeStyle = 'rgba(200, 160, 90, 0.35)'; ctx.lineWidth = 1;
  ctx.strokeRect(gx0 + 0.5, yMid - gh + 0.5, gx1 - gx0 - 1, 2 * gh - 1);

  // Pump arrows into the rod, brightness with pump rate.
  ctx.strokeStyle = `rgba(120, 190, 255, ${(0.25 + 0.6 * pumping).toFixed(3)})`;
  ctx.lineWidth = 2;
  const nArr = 6;
  for (let i = 0; i < nArr; i += 1) {
    const x = gx0 + (i + 0.5) / nArr * (gx1 - gx0);
    for (const sgn of [-1, 1]) {
      const yTop = yMid + sgn * (gh + 38), yEnd = yMid + sgn * (gh + 6);
      ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yEnd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, yEnd); ctx.lineTo(x - 4, yEnd - sgn * 6); ctx.moveTo(x, yEnd); ctx.lineTo(x + 4, yEnd - sgn * 6); ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(120, 190, 255, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  ctx.fillText('pump', (gx0 + gx1) / 2, yMid + gh + 56);

  // Gain atoms: excited (glowing upper state) fraction set by the inversion.
  for (const a of ATOMS) {
    const ax = gx0 + a.u * (gx1 - gx0);
    const ay = yMid + a.v * (gh - 12);
    const excited = a.q < invF;
    if (a.flash > 0) a.flash -= 0.06;
    if (excited && photF > 0.2 && a.q > invF - 0.18 && Math.sin(ui.phase * 0.7 + a.ph) > 0.985) a.flash = 1;
    if (excited) {
      const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, 7);
      g.addColorStop(0, `rgba(255, 200, 110, ${(0.85 - 0.3 * a.flash).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255, 150, 80, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 150, 0.95)';
      ctx.beginPath(); ctx.arc(ax, ay, 2.1, 0, 6.283); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(150, 165, 195, 0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, 6.283); ctx.stroke();
    }
  }

  // Intracavity standing wave: nodes at both mirrors, amplitude ~ sqrt(n).
  const m = Math.round(4 + ui.Lc * 4);
  const A = halfH * 0.92 * (qShut ? 0 : photF);
  if (A > 0.5) {
    ctx.strokeStyle = 'rgba(110, 220, 255, 0.22)'; ctx.lineWidth = 1;
    for (const s of [1, -1]) {
      ctx.beginPath();
      for (let k = 0; k <= 120; k += 1) {
        const u = k / 120; const x = xL + u * Lpx;
        const env = A * Math.sin(m * Math.PI * u);
        if (k === 0) ctx.moveTo(x, yMid - s * env); else ctx.lineTo(x, yMid - s * env);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(140, 235, 255, ${(0.55 + 0.4 * photF).toFixed(3)})`;
    ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(120, 220, 255, 0.7)'; ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let k = 0; k <= 200; k += 1) {
      const u = k / 200; const x = xL + u * Lpx;
      const y = yMid - A * Math.sin(m * Math.PI * u) * Math.cos(ui.phase);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  } else {
    ctx.strokeStyle = 'rgba(140, 235, 255, 0.16)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= 120; k += 1) {
      const u = k / 120; const x = xL + u * Lpx;
      const y = yMid + Math.sin(u * 40 + ui.phase) * 3 * Math.sin(m * Math.PI * u);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Mirrors: left high reflector (solid), right output coupler (partial).
  function mirror(x, open) {
    ctx.strokeStyle = open ? 'rgba(150, 210, 255, 0.85)' : 'rgba(210, 225, 255, 0.95)';
    ctx.lineWidth = open ? 3 : 5;
    ctx.beginPath();
    const bow = open ? -16 : 16;
    ctx.moveTo(x, yMid - halfH);
    ctx.quadraticCurveTo(x + bow, yMid, x, yMid + halfH);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150, 170, 210, 0.30)'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i += 1) {
      const y = yMid + i * (halfH / 4.5);
      const xb = x + (open ? 8 : -8);
      ctx.beginPath(); ctx.moveTo(xb, y); ctx.lineTo(xb + (open ? 10 : -10), y - 6); ctx.stroke();
    }
  }
  mirror(xL, false);
  mirror(xR, true);

  // Q-switch shutter (closed).
  if (qShut) {
    ctx.fillStyle = 'rgba(220, 80, 80, 0.85)';
    ctx.fillRect(xR - 40, yMid - halfH * 0.7, 9, halfH * 1.4);
    ctx.fillStyle = 'rgba(255, 150, 150, 0.95)';
    ctx.fillText('Q closed', xR - 36, yMid - halfH * 0.7 - 6);
  }

  // Output beam leaving the output coupler.
  if (!qShut && outF > 0.02) {
    const bx0 = xR + 4, bx1 = xR + 140;
    const bh = 6 + 30 * outF;
    const bg = ctx.createLinearGradient(bx0, 0, bx1, 0);
    bg.addColorStop(0, `rgba(150, 240, 255, ${(0.7 * outF + 0.15).toFixed(3)})`);
    bg.addColorStop(1, 'rgba(150, 240, 255, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(bx0, yMid - bh); ctx.lineTo(bx1, yMid - bh * 0.4); ctx.lineTo(bx1, yMid + bh * 0.4); ctx.lineTo(bx0, yMid + bh); ctx.closePath(); ctx.fill();
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(170, 245, 255, 0.9)';
    ctx.fillText('output beam', bx1, yMid - bh - 6);
    ctx.textAlign = 'center';
  }

  // Labels.
  ctx.fillStyle = 'rgba(210, 225, 255, 0.9)';
  ctx.fillText('high reflector', xL, yMid - halfH - 10);
  ctx.fillText(`output coupler  R = ${ui.R.toFixed(2)}`, xR, yMid - halfH - 10);
  ctx.fillStyle = 'rgba(200, 160, 90, 0.85)';
  ctx.fillText('gain medium', (gx0 + gx1) / 2, yMid - gh - 8);
  ctx.textAlign = 'left';
}

// =========================================================================
// DIAGNOSTIC: n(t) and N(t) turn-on trace.
// =========================================================================
function drawTrace() {
  const X = 14, Y = 648, Wd = W - 28, Hd = H - Y - 12;
  ctx.fillStyle = 'rgba(16, 22, 36, 0.92)';
  ctx.fillRect(X, Y, Wd, Hd);
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.30)'; ctx.lineWidth = 1;
  ctx.strokeRect(X + 0.5, Y + 0.5, Wd - 1, Hd - 1);
  ctx.fillStyle = 'rgba(224, 232, 255, 0.94)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText('turn-on dynamics:  photon number n(t)  and  inversion N(t)', X + 8, Y - 6);

  const padL = 14, padR = 14, padT = 16, padB = 14;
  const pX = X + padL, pY = Y + padT, pW = Wd - padL - padR, pH = Hd - padT - padB;
  const nScale = (v) => Math.min(1, Math.sqrt(Math.max(0, v) / Math.max(1e-9, ui.nRef)));
  const { Nth } = lcParams();
  const NscaleRef = Math.max(Nth * 3.5, 0.04);

  // Inversion trace (orange).
  ctx.strokeStyle = 'rgba(255, 190, 110, 0.92)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < NHist.length; i += 1) {
    const x = pX + (i / Math.max(1, HIST - 1)) * pW;
    const y = pY + pH - Math.min(1, NHist[i] / NscaleRef) * pH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Threshold inversion line (gain = loss): the clamp level.
  const yth = pY + pH - Math.min(1, Nth / NscaleRef) * pH;
  ctx.strokeStyle = 'rgba(255, 190, 110, 0.4)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pX, yth); ctx.lineTo(pX + pW, yth); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 190, 110, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('N_threshold (gain clamps here)', pX + 6, Math.max(pY + 11, yth - 4));

  // Photon trace (cyan).
  ctx.strokeStyle = 'rgba(120, 230, 255, 0.95)'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < nHist.length; i += 1) {
    const x = pX + (i / Math.max(1, HIST - 1)) * pW;
    const y = pY + pH - nScale(nHist[i]) * pH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = 'rgba(120, 230, 255, 0.95)'; ctx.fillText('n  photons', pX + pW - 168, pY + 12);
  ctx.fillStyle = 'rgba(255, 190, 110, 0.95)'; ctx.fillText('N  inversion', pX + pW - 168, pY + 26);
  ctx.fillStyle = 'rgba(176, 190, 224, 0.7)';
  ctx.fillText('time', pX + pW - 30, pY + pH - 4);
}

// =========================================================================
// SECONDARY CANVAS: output power vs pump (exact threshold kink).
// =========================================================================
function drawPlot() {
  const Wp = plot.width, Hp = plot.height;
  pctx.fillStyle = '#07080b'; pctx.fillRect(0, 0, Wp, Hp);
  const x0 = 44, x1 = Wp - 16, y0 = 16, y1 = Hp - 22;
  pctx.strokeStyle = '#23252a'; pctx.beginPath(); pctx.moveTo(x0, y1); pctx.lineTo(x1, y1); pctx.stroke();
  const cur = ui.plotCurve;
  if (cur) {
    pctx.strokeStyle = '#5fd0e0'; pctx.lineWidth = 1.8; pctx.beginPath();
    cur.pts.forEach(([P, o], i) => { const Xc = x0 + (P / cur.Pmax) * (x1 - x0), Yc = y1 - (o / cur.omax) * (y1 - y0); i ? pctx.lineTo(Xc, Yc) : pctx.moveTo(Xc, Yc); });
    pctx.stroke();
    // Threshold marker.
    const Xth = x0 + (cur.Pth / cur.Pmax) * (x1 - x0);
    pctx.strokeStyle = '#3a4a55'; pctx.setLineDash([3, 3]); pctx.beginPath(); pctx.moveTo(Xth, y0); pctx.lineTo(Xth, y1); pctx.stroke(); pctx.setLineDash([]);
    pctx.fillStyle = '#6a7682'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.fillText('P_th', Xth + 3, y1 - 4);
    const Xp = x0 + (Math.min(cur.Pmax, ui.P) / cur.Pmax) * (x1 - x0);
    pctx.strokeStyle = '#ffd166'; pctx.beginPath(); pctx.moveTo(Xp, y0); pctx.lineTo(Xp, y1); pctx.stroke();
  }
  pctx.fillStyle = '#7a818c'; pctx.font = fontString(canvas, 'caption', 'mono'); pctx.textAlign = 'left';
  pctx.fillText('output power vs pump (sharp lasing-threshold kink; yellow = current pump)', 8, 12);
}

function refreshReadout() {
  const { Pth } = lcParams();
  rEls['pump P'].textContent = ui.P.toFixed(3);
  rEls.P_threshold.textContent = Pth.toFixed(3);
  rEls['inversion N'].textContent = ui.dispN.toFixed(3);
  rEls['photons n'].textContent = ui.dispPhot < 1e-3 ? ui.dispPhot.toExponential(1) : ui.dispPhot.toFixed(2);
  rEls.output.textContent = ui.dispOut.toFixed(3);
  rEls.state.textContent = ui.qArmed && !ui.qOpen ? 'Q closed (charging)' : (ui.P > Pth ? 'lasing' : 'below threshold');
}

function frame() {
  ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(224, 232, 255, 0.92)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.textAlign = 'left';
  ctx.fillText('Laser cavity: pump, inversion, stimulated emission, beam', 18, 28);
  const { invF, photF, outF } = levels();
  drawCavity(invF, photF, outF);
  drawTrace();
  drawPlot();
  refreshReadout();
}

// One animation step of the displayed state.
function advance(dt) {
  ui.phase += dt * 7;
  if (ui.qArmed) {
    if (!ui.qOpen) {
      // Charging: the spoiled cavity has no feedback, so the photon
      // number stays at zero and the pump piles up a large inversion
      // (charged analytically to avoid the stiff qLow timescale).
      ui.qT += dt;
      sim.n = 1e-9;
      sim.N += (ui.P - sim.N / ui.tau) * (dt * 4);
      if (ui.qT > 1.0) { ui.qOpen = true; sim.n = 0.03; }  // release: seed the avalanche
      ui.dispN = sim.N; ui.dispPhot = 0; ui.dispOut = 0;
    } else {
      // Fire: integrate the open-cavity equations (tauC is not stiff).
      const sub = 20, h = 0.10 / sub;
      for (let i = 0; i < sub; i += 1) step(sim, h, true);
      ui.dispN = sim.N; ui.dispPhot = sim.n; ui.dispOut = outputPower(sim);
    }
  } else {
    // CW: ease toward the exact steady state.
    const ss = analyticSS(ui.P);
    ui.dispN += (ss.N - ui.dispN) * 0.06;
    ui.dispPhot += (ss.n - ui.dispPhot) * 0.045;
    ui.dispOut += (ss.out - ui.dispOut) * 0.06;
  }
  // Hard guard: never let a non-finite value reach the renderer.
  if (!Number.isFinite(ui.dispN)) ui.dispN = 0;
  if (!Number.isFinite(ui.dispPhot)) ui.dispPhot = 0;
  if (!Number.isFinite(ui.dispOut)) ui.dispOut = 0;
  nHist.push(ui.dispPhot); if (nHist.length > HIST) nHist.shift();
  NHist.push(ui.dispN); if (NHist.length > HIST) NHist.shift();
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.033); last = now;
  if (ui.running) advance(dt);
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  syncParams();
  if (CAPTURE_NAME) {
    const { Pth } = lcParams();
    const ks = [0.5, 1.05, 2.0, 4.0, 6.0];
    ui.P = ks[Math.min(ks.length - 1, Math.floor(CAPTURE_FRAC * ks.length + 1e-6))] * Pth;
    syncParams();
    const ss = analyticSS(ui.P);
    // Synthesize a turn-on history ending at the steady state.
    let dN = 0, dn = 0;
    for (let i = 0; i < HIST; i += 1) { dN += (ss.N - dN) * 0.05; dn += (ss.n - dn) * 0.035; NHist.push(dN); nHist.push(dn); }
    ui.dispN = ss.N; ui.dispPhot = ss.n; ui.dispOut = ss.out; ui.phase = 1.1;
    frame();
    if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
    return;
  }
  // Warm the display to the steady state and fill the trace.
  const ss = analyticSS(ui.P);
  let dN = 0, dn = 0;
  for (let i = 0; i < HIST; i += 1) { dN += (ss.N - dN) * 0.05; dn += (ss.n - dn) * 0.035; NHist.push(dN); nHist.push(dn); }
  ui.dispN = ss.N; ui.dispPhot = ss.n; ui.dispOut = ss.out;
  frame();
}

// Validation: the analytic steady state matches the numerical engine.
window.__physicsCheck = async () => {
  const tauC = cavityLifetime(1, 0.92);
  const Pth = thresholdPump(1, tauC, 1);
  const below = steadyState({ P: 0.6 * Pth, tau: 1, tauC, B: 1, seed: 1e-6 }).output;
  const above = steadyState({ P: 4 * Pth, tau: 1, tauC, B: 1, seed: 1e-6 }, 4e-3, 120000);
  const Nth = thresholdInversion(1, tauC);
  return {
    name: 'emergent threshold + gain clamping',
    pass: below < 1e-2 && Math.abs(above.N - Nth) / Nth < 0.05 && above.n > 1e3 * below,
    msg: `below out=${below.toExponential(1)}, above N=${above.N.toFixed(3)} (N_th=${Nth.toFixed(3)})`,
  };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'pump-power', label: 'Pump power P', value: ui.P, format: 'float' },
      { key: 'photons', label: 'Cavity photon number n', value: ui.dispPhot, format: 'float' },
      { key: 'inversion', label: 'Population inversion N', value: ui.dispN, format: 'float' },
      { key: 'cavity-loss', label: 'Mirror reflectivity R', value: ui.R, format: 'float' },
      { key: 'output', label: 'Output power', value: ui.dispOut, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const tauC = cavityLifetime(ui.Lc, ui.R);
  const status = tauC > 0 && Number.isFinite(tauC) ? 'pass' : 'drift';
  return [
    { key: 'cavity-lifetime-valid', label: 'Cavity lifetime $\\tau_C$', value: tauC.toExponential(2), status },
  ];
};
