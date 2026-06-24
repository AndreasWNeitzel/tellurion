// Supernova Light Curve hero. The light curve is the subject, so it is
// the hero panel: bolometric L(t) on a log axis, the selected SN overlaid
// on the other type for comparison, and the fully trapped radioactive
// power that the late tail decays onto. Below it the Ni -> Co -> Fe decay
// chain that powers the curve, and a supporting fireball band that expands
// homologously (r = v_ej t) and tracks the instantaneous luminosity.

import {
  massPartition, bolometricLuminosity_ergS, decayPower_ergS, absoluteBolMag,
  fireballRadius_cm, SN_PRESETS, makeRng,
} from './sim.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0], radius: 5, minRadius: 2, maxRadius: 15,
  azimuthDeg: 30, elevationDeg: 18, fovDeg: 50,
});

// Readouts.
const rType = document.getElementById('readout-type');
const rT = document.getElementById('readout-t');
const rL = document.getElementById('readout-L');
const rMv = document.getElementById('readout-mv');
const rR = document.getElementById('readout-r');

// Controls.
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sMni = document.getElementById('slider-mni'), vMni = document.getElementById('value-mni');
const sTdiff = document.getElementById('slider-tdiff'), vTdiff = document.getElementById('value-tdiff');
const sVej = document.getElementById('slider-vej'), vVej = document.getElementById('value-vej');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  preset: 'ia_2011fe',
  m_Ni: 0.60,
  t_diff_d: 14,
  v_ej_kms: 11000,
  running: !prefersReducedMotion(),
  t_d: 5,            // current time in days (animated)
  T_MAX_D: 200,
};

function applyPreset(name) {
  const p = SN_PRESETS[name];
  if (!p) return;
  st.preset = name;
  st.m_Ni = p.m0_Ni;
  st.t_diff_d = p.t_diff_d;
  st.v_ej_kms = p.v_ej_kms;
  st.plateau = p.plateau || null;   // Type II recombination plateau, null for Ia
  sMni.value = String(p.m0_Ni);
  sTdiff.value = String(p.t_diff_d);
  sVej.value = String(p.v_ej_kms);
}

// =========================================================================
// Palette + small drawing helpers.
// =========================================================================
const COL = {
  panel: 'rgba(16, 22, 36, 0.92)',
  border: 'rgba(150, 170, 210, 0.30)',
  ink: 'rgba(224, 232, 255, 0.94)',
  inkDim: 'rgba(176, 190, 224, 0.78)',
  grid: 'rgba(150, 170, 210, 0.10)',
  curve: 'rgba(255, 214, 120, 0.98)',   // selected light curve
  ghost: 'rgba(120, 200, 255, 0.55)',   // other-type light curve
  power: 'rgba(255, 130, 110, 0.85)',   // radioactive power asymptote
  Ni: 'rgba(120, 220, 255, 0.96)',
  Co: 'rgba(255, 214, 120, 0.96)',
  Fe: 'rgba(255, 130, 110, 0.96)',
};

function panel(x, y, w, h) {
  ctx.fillStyle = COL.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function panelTitle(text, x, y) {
  ctx.fillStyle = COL.ink;
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.fillText(text, x + 8, y - 6);
}

// =========================================================================
// STARFIELD (background only).
// =========================================================================
const STARS = [];
{
  const r = makeRng(0xD15EA5E);
  for (let i = 0; i < 220; i++) {
    STARS.push({ x: r() * W, y: r() * H, b: 0.10 + 0.70 * r() });
  }
}
function drawSky() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  for (const s of STARS) {
    ctx.fillStyle = `rgba(200, 220, 255, ${s.b.toFixed(3)})`;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
}

// Camera zoom factor (scroll wheel changes camera.radius); used to let the
// fireball respond to the scroll-to-zoom promise even though it is a disc.
function camZoom() {
  const eye = camera.eyePosition();
  const d = Math.hypot(eye[0], eye[1], eye[2]);
  return 5 / Math.max(2, Math.min(15, d));   // 1 at default radius 5
}

// Fireball color: hot near-white at peak, cooling to red-orange late.
function fireballColor(L_norm) {
  const x = Math.min(1, Math.max(0, L_norm));
  return [255, Math.round(196 + 54 * x), Math.round(72 + 158 * x)];
}

// =========================================================================
// ZONE 1: LIGHT CURVE HERO.
// =========================================================================
function drawLightCurveHero(X, Y, Wd, Hd) {
  panel(X, Y, Wd, Hd);
  panelTitle('bolometric light curve  L(t)   erg/s', X, Y);

  const padL = 58, padR = 54, padT = 16, padB = 34;
  const pX = X + padL, pY = Y + padT, pW = Wd - padL - padR, pH = Hd - padT - padB;

  const N = 240, T = st.T_MAX_D;
  const otherName = st.preset === 'ia_2011fe' ? 'ii_1987a' : 'ia_2011fe';
  const other = SN_PRESETS[otherName];
  const tArr = [], Lsel = [], Loth = [], Lpow = [];
  let logmax = -1e9;
  for (let k = 0; k < N; k++) {
    const t = (k / (N - 1)) * T + 0.3;
    const Ls = bolometricLuminosity_ergS(t, st.m_Ni, st.t_diff_d, st.plateau);
    const Lo = bolometricLuminosity_ergS(t, other.m0_Ni, other.t_diff_d, other.plateau || null);
    const Lp = decayPower_ergS(t, st.m_Ni);
    tArr.push(t); Lsel.push(Ls); Loth.push(Lo); Lpow.push(Lp);
    logmax = Math.max(logmax, Math.log10(Math.max(1, Ls)), Math.log10(Math.max(1, Lo)));
  }
  const top = logmax + 0.35, bot = logmax - 4.35;
  const xForT = (t) => pX + (t / T) * pW;
  const yForLog = (lg) => {
    const yy = pY + pH - (lg - bot) / (top - bot) * pH;
    return Math.max(pY, Math.min(pY + pH, yy));
  };
  const yForL = (L) => yForLog(Math.log10(Math.max(1, L)));

  // Horizontal decade grid + left log labels + right magnitude labels.
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let lv = Math.floor(bot); lv <= Math.ceil(top); lv++) {
    if (lv < bot || lv > top) continue;
    const yy = yForLog(lv);
    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pX, yy); ctx.lineTo(pX + pW, yy); ctx.stroke();
    ctx.fillStyle = COL.inkDim;
    ctx.fillText(`1e${lv}`, X + 6, yy + 4);
    // Right-hand absolute bolometric magnitude axis.
    const Mb = -2.5 * lv + 88.7;
    ctx.fillStyle = 'rgba(150, 170, 210, 0.62)';
    ctx.fillText(Mb.toFixed(0), pX + pW + 8, yy + 4);
  }
  ctx.fillStyle = 'rgba(150, 170, 210, 0.7)';
  ctx.font = fontString(canvas, 'caption', 'sans', 600);
  ctx.save();
  ctx.translate(pX + pW + 44, pY + pH * 0.5); ctx.rotate(Math.PI / 2);
  ctx.fillText('M_bol', -16, 0);
  ctx.restore();

  // Vertical day grid + labels.
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let t = 0; t <= T; t += 50) {
    const xx = xForT(t);
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xx, pY); ctx.lineTo(xx, pY + pH); ctx.stroke();
    ctx.fillStyle = COL.inkDim;
    const lab = String(t);
    ctx.fillText(lab, xx - lab.length * 3, pY + pH + 16);
  }
  ctx.fillStyle = 'rgba(150, 170, 210, 0.7)';
  ctx.fillText('days since explosion', pX + pW - 132, pY + pH + 30);

  // Radioactive power asymptote (fully trapped): the tail decays onto it.
  ctx.strokeStyle = COL.power; ctx.lineWidth = 1.3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = xForT(tArr[k]), y = yForL(Lpow[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Other-type light curve (ghost, for comparison).
  ctx.strokeStyle = COL.ghost; ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = xForT(tArr[k]), y = yForL(Loth[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Selected light curve: filled up to the current epoch, then stroked.
  const tc = st.t_d;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pX, pY, (Math.min(tc, T) / T) * pW, pH);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, pY, 0, pY + pH);
  grad.addColorStop(0, 'rgba(255, 200, 90, 0.28)');
  grad.addColorStop(1, 'rgba(255, 160, 60, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(xForT(tArr[0]), pY + pH);
  for (let k = 0; k < N; k++) ctx.lineTo(xForT(tArr[k]), yForL(Lsel[k]));
  ctx.lineTo(xForT(tArr[N - 1]), pY + pH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = COL.curve; ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = xForT(tArr[k]), y = yForL(Lsel[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Peak marker for the selected curve.
  let kPk = 0;
  for (let k = 1; k < N; k++) if (Lsel[k] > Lsel[kPk]) kPk = k;
  const xpk = xForT(tArr[kPk]), ypk = yForL(Lsel[kPk]);
  ctx.fillStyle = 'rgba(255, 240, 190, 0.95)';
  ctx.beginPath(); ctx.arc(xpk, ypk, 3.5, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = COL.inkDim;
  ctx.fillText(`peak ~${tArr[kPk].toFixed(0)} d`, xpk - 18, ypk - 9);

  // Phase annotations.
  ctx.fillStyle = 'rgba(180, 200, 240, 0.5)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('Ni-56 rise', xForT(3), yForL(Lsel[Math.floor(N * 0.10)]) + 26);
  ctx.fillText('Co-56 tail', xForT(150), yForL(Lsel[Math.floor(N * 0.78)]) - 8);

  // Current-epoch cursor.
  const Lnow = bolometricLuminosity_ergS(tc, st.m_Ni, st.t_diff_d, st.plateau);
  const xcur = xForT(Math.min(tc, T)), ycur = yForL(Lnow);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xcur, pY); ctx.lineTo(xcur, pY + pH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 210, 1)';
  ctx.beginPath(); ctx.arc(xcur, ycur, 5.5, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 200, 90, 0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(xcur, ycur, 8.5, 0, 2 * Math.PI); ctx.stroke();

  // Legend, boxed in the empty top-right corner (both curves are well
  // below the top decades by the late phase, so this corner stays clear).
  const leg = [
    [COL.curve, SN_PRESETS[st.preset].type + ' (this SN)', false],
    [COL.ghost, SN_PRESETS[otherName].type + ' (other type)', false],
    [COL.power, 'radioactive power (full trapping)', true],
  ];
  ctx.font = fontString(canvas, 'caption', 'mono');
  const bw = 238, bh = leg.length * 16 + 8;
  const bx = pX + pW - bw - 6, by = pY + 6;
  ctx.fillStyle = 'rgba(10, 14, 24, 0.74)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(150, 170, 210, 0.22)';
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  let ly = by + 13;
  for (const [c, label, dash] of leg) {
    ctx.strokeStyle = c; ctx.lineWidth = 2.2;
    ctx.setLineDash(dash ? [4, 4] : []);
    ctx.beginPath(); ctx.moveTo(bx + 8, ly); ctx.lineTo(bx + 30, ly); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.inkDim;
    ctx.fillText(label, bx + 36, ly + 4);
    ly += 16;
  }
  return Lnow;
}

// =========================================================================
// ZONE 2: Ni -> Co -> Fe DECAY CHAIN (wide, short).
// =========================================================================
function drawDecayChain(X, Y, Wd, Hd) {
  panel(X, Y, Wd, Hd);
  panelTitle('mass partition   Ni-56 -> Co-56 -> Fe-56   (M_sun)', X, Y);

  const padL = 52, padR = 16, padT = 14, padB = 26;
  const pX = X + padL, pY = Y + padT, pW = Wd - padL - padR, pH = Hd - padT - padB;
  const T = st.T_MAX_D, N = 200;
  const xForT = (t) => pX + (t / T) * pW;
  const yForM = (m) => pY + pH - (m / st.m_Ni) * pH;

  // Grid.
  ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let t = 0; t <= T; t += 50) {
    ctx.beginPath(); ctx.moveTo(xForT(t), pY); ctx.lineTo(xForT(t), pY + pH); ctx.stroke();
    ctx.fillStyle = COL.inkDim;
    ctx.fillText(String(t), xForT(t) - String(t).length * 3, pY + pH + 16);
  }
  for (const frac of [0.5, 1.0]) {
    const yy = pY + pH - frac * pH;
    ctx.strokeStyle = COL.grid;
    ctx.beginPath(); ctx.moveTo(pX, yy); ctx.lineTo(pX + pW, yy); ctx.stroke();
    ctx.fillStyle = COL.inkDim;
    ctx.fillText((frac * st.m_Ni).toFixed(2), X + 6, yy + 4);
  }

  const cols = { Ni: COL.Ni, Co: COL.Co, Fe: COL.Fe };
  for (const sp of ['Ni', 'Co', 'Fe']) {
    ctx.strokeStyle = cols[sp]; ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const t = (k / (N - 1)) * T + 0.3;
      const p = massPartition(t, st.m_Ni);
      const m = sp === 'Ni' ? p.mNi : sp === 'Co' ? p.mCo : p.mFe;
      const x = xForT(t), y = yForM(m);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Current-epoch cursor.
  const xc = xForT(Math.min(st.t_d, T));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xc, pY); ctx.lineTo(xc, pY + pH); ctx.stroke();
  ctx.setLineDash([]);

  // Legend + live values.
  const p = massPartition(st.t_d, st.m_Ni);
  const items = [['Ni', p.mNi], ['Co', p.mCo], ['Fe', p.mFe]];
  let lx = pX + 12;
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (const [sp, m] of items) {
    ctx.fillStyle = cols[sp];
    ctx.fillRect(lx, pY + 6, 10, 3);
    ctx.fillStyle = COL.inkDim;
    ctx.fillText(`${sp} ${m.toFixed(3)}`, lx + 14, pY + 11);
    lx += 116;
  }
}

// =========================================================================
// ZONE 3: SUPPORTING FIREBALL BAND (homologous expansion, brightness ~ L).
// =========================================================================
function drawFireballBand(X, Y, Wd, Hd, L_norm) {
  panel(X, Y, Wd, Hd);
  panelTitle('homologously expanding fireball   r = v_ej t', X, Y);

  // Left readout column.
  const p = SN_PRESETS[st.preset];
  const Lnow = bolometricLuminosity_ergS(st.t_d, st.m_Ni, st.t_diff_d, st.plateau);
  const r_cm = fireballRadius_cm(st.t_d, st.v_ej_kms);
  const rows = [
    ['type', p.type, '#ffd28a'],
    ['t (d)', st.t_d.toFixed(0), null],
    ['L (erg/s)', Lnow.toExponential(2), null],
    ['M_bol', absoluteBolMag(Lnow).toFixed(2), null],
    ['v_ej (km/s)', String(st.v_ej_kms), null],
    ['r_phot (cm)', r_cm.toExponential(2), null],
  ];
  let yy = Y + 28;
  for (const [k, v, c] of rows) {
    ctx.fillStyle = 'rgba(176, 188, 214, 0.82)';
    ctx.font = fontString(canvas, 'caption');
    ctx.fillText(k, X + 12, yy);
    ctx.fillStyle = c || COL.ink;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(v, X + 12, yy + 15);
    yy += 32;
  }

  // Fireball disc, centred in the right two-thirds of the band.
  const cx = X + Wd * 0.62;
  const cy = Y + Hd * 0.54;
  const rMax = Math.min(Hd * 0.40, Wd * 0.24);
  const grow = 0.30 + 0.70 * Math.min(1, Math.log10(1 + st.t_d * (st.v_ej_kms / 11000) / 6) / Math.log10(1 + 200 / 6));
  const fR = rMax * grow * camZoom();
  const [cr, cg, cb] = fireballColor(L_norm);
  const bright = 0.45 + 0.55 * L_norm;
  const cl = (c) => Math.round(Math.max(0, Math.min(255, c)));

  // Outer glow.
  const haloR = fR * (1.7 + 1.0 * L_norm);
  const glow = ctx.createRadialGradient(cx, cy, fR * 0.85, cx, cy, haloR);
  glow.addColorStop(0, `rgba(255, 220, 150, ${(0.40 * L_norm).toFixed(3)})`);
  glow.addColorStop(0.5, `rgba(255, 140, 100, ${(0.18 * L_norm).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(255, 100, 80, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, 2 * Math.PI); ctx.fill();

  // Photosphere disc.
  const disc = ctx.createRadialGradient(cx - fR * 0.22, cy - fR * 0.22, fR * 0.05, cx, cy, fR);
  disc.addColorStop(0.00, `rgb(${cl(cr * 1.4 + 90)}, ${cl(cg * 1.4 + 78)}, ${cl(cb * 1.3 + 62)})`);
  disc.addColorStop(0.55, `rgb(${cl(cr * bright)}, ${cl(cg * bright)}, ${cl(cb * bright)})`);
  disc.addColorStop(1.00, `rgb(${cl(cr * bright * 0.42)}, ${cl(cg * bright * 0.40)}, ${cl(cb * bright * 0.34)})`);
  ctx.fillStyle = disc;
  ctx.beginPath(); ctx.arc(cx, cy, fR, 0, 2 * Math.PI); ctx.fill();

  // Homologous velocity shells: equally spaced in velocity => equally
  // spaced in radius, all expanding together. Labels at the outer shell.
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let i = 1; i <= 3; i++) {
    const frac = i / 3;
    const rr = fR * frac;
    ctx.strokeStyle = `rgba(255, 235, 205, ${(0.30 * (1 - 0.18 * i)).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Outer ejecta velocity label.
  ctx.fillStyle = 'rgba(255, 235, 205, 0.7)';
  ctx.fillText(`${st.v_ej_kms} km/s`, cx + fR * 0.70, cy - fR * 0.70);

  // Radius arrow from centre to the photosphere.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + fR, cy); ctx.stroke();
}

function updateReadout(Lnow) {
  const Mv = absoluteBolMag(Lnow);
  const r_cm = fireballRadius_cm(st.t_d, st.v_ej_kms);
  rType.textContent = SN_PRESETS[st.preset].type;
  rT.textContent = st.t_d.toFixed(0);
  rL.textContent = Lnow.toExponential(2);
  rMv.textContent = Mv.toFixed(2);
  rR.textContent = r_cm.toExponential(2);
}

// =========================================================================
// MAIN DRAW.
// =========================================================================
const LAY = {
  hero: { x: 12, y: 44, w: W - 24, h: 446 },
  chain: { x: 12, y: 504, w: W - 24, h: 206 },
  band: { x: 12, y: 724, w: W - 24, h: 306 },
};

function draw() {
  drawSky();
  // Normalise brightness by the peak of the current curve.
  let Lmax = 0;
  for (let k = 0; k < 80; k++) {
    const t = (k / 79) * st.T_MAX_D + 0.5;
    const L = bolometricLuminosity_ergS(t, st.m_Ni, st.t_diff_d, st.plateau);
    if (L > Lmax) Lmax = L;
  }
  const Lnow = drawLightCurveHero(LAY.hero.x, LAY.hero.y, LAY.hero.w, LAY.hero.h);
  drawDecayChain(LAY.chain.x, LAY.chain.y, LAY.chain.w, LAY.chain.h);
  const L_norm = Math.max(0, Math.min(1, Lnow / Math.max(1, Lmax)));
  drawFireballBand(LAY.band.x, LAY.band.y, LAY.band.w, LAY.band.h, L_norm);

  // Title strip.
  ctx.fillStyle = 'rgba(16, 22, 36, 0.9)';
  ctx.fillRect(10, 8, 286, 26);
  ctx.strokeStyle = COL.border;
  ctx.strokeRect(10.5, 8.5, 285, 25);
  ctx.fillStyle = 'rgba(255, 220, 140, 0.96)';
  ctx.font = fontString(canvas, 'body', 'sans', 600);
  ctx.fillText(`SUPERNOVA LIGHT CURVE  (${SN_PRESETS[st.preset].type})`, 20, 26);
  updateReadout(Lnow);
}

function readSliders() {
  if (selPreset.value !== st.preset) applyPreset(selPreset.value);
  else {
    st.m_Ni = parseFloat(sMni.value);
    st.t_diff_d = parseFloat(sTdiff.value);
    st.v_ej_kms = parseFloat(sVej.value);
  }
  vPreset.textContent = st.preset === 'ia_2011fe' ? '2011fe' : '1987A';
  vMni.textContent = st.m_Ni.toFixed(2);
  vTdiff.textContent = String(st.t_diff_d);
  vVej.textContent = String(st.v_ej_kms);
}

[selPreset, sMni, sTdiff, sVej].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', readSliders);
btnReset.addEventListener('click', () => { st.t_d = 5; });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  m_ni: { get: () => st.m_Ni, set: v => { st.m_Ni = parseFloat(v); sMni.value = v; }, parse: parseFloat },
  preset: { get: () => st.preset, set: v => { st.preset = v; selPreset.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
applyPreset(st.preset);   // start with default preset values
readSliders();
mountShareButton(document.getElementById('share-mount'), SHARE_KEYS);

if (CAPTURE_NAME) {
  // Sweep t_d across the 5 frames: 5 d, 18 d (peak Ia), 50 d, 100 d, 200 d.
  const t_table = [5, 18, 50, 100, 200];
  const idx = Math.min(4, Math.max(0, Math.floor((CAPTURE_FRAC || 0) * 5)));
  // Two presets: Ia for fractions 0..0.5, II for 0.5..1.
  if ((CAPTURE_FRAC || 0) >= 0.5) {
    selPreset.value = 'ii_1987a';
    applyPreset('ii_1987a');
  }
  st.t_d = t_table[idx];
  readSliders();
  draw();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
  } else {
    window.__simulationReady = true;
  }
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (st.running) {
      // Sweep t_d in a loop: 5 d -> 200 d in ~30 s, then reset.
      st.t_d += dt * 6;
      if (st.t_d > st.T_MAX_D) st.t_d = 1;
    }
    if (camera.tickIdle) camera.tickIdle(now);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const L = bolometricLuminosity_ergS(st.t_d, st.m_Ni, st.t_diff_d, st.plateau);
  return {
    fields: [
      { key: 'time', label: 'time since explosion (days)', value: st.t_d, format: 'float' },
      { key: 'luminosity', label: 'bolometric luminosity (erg/s)', value: L, format: 'sci' },
      { key: 'abs-mag', label: 'absolute bolometric magnitude', value: absoluteBolMag(L), format: 'float' },
      { key: 'radius', label: 'photospheric radius (cm)', value: fireballRadius_cm(st.t_d, st.v_ej_kms), format: 'sci' },
    ],
  };
};
// The Ni-56 -> Co-56 -> Fe-56 decay chain only moves mass between
// species, so m_Ni(t) + m_Co(t) + m_Fe(t) stays equal to the
// initial nickel mass at every time.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const p = massPartition(st.t_d, st.m_Ni);
      const sum = p.mNi + p.mCo + p.mFe;
      const drift = Math.abs(sum - st.m_Ni) / Math.max(1e-9, st.m_Ni);
      return [{
        key: 'mass',
        label: 'Ni + Co + Fe mass conserved',
        value: drift.toExponential(2),
        status: drift < 1e-6 ? 'pass' : (drift < 1e-3 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}
