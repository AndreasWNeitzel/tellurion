// playground.js
// Brewster / Fresnel as propagating waves. Left: an incident plane
// wave crosses a dielectric interface; the reflected wave carries
// amplitude r and the refracted wave amplitude t with the Snell angle
// and the n1/n2 wavelength change. For p-polarization the reflected
// wave extinguishes at Brewster's angle. Right: the Fresnel R_s, R_p
// curves with the live and Brewster markers. sim.js unchanged.

import {
  fresnelR, fresnelAmplitudes, brewsterAngle, criticalAngle, snellRefract,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const sliderTheta = document.getElementById('slider-theta');
const sliderRatio = document.getElementById('slider-ratio');
const sliderSpeed = document.getElementById('slider-speed');
const selectPol   = document.getElementById('select-pol');
const valueTheta  = document.getElementById('value-theta');
const valueRatio  = document.getElementById('value-ratio');
const valueSpeed  = document.getElementById('value-speed');
const valuePol    = document.getElementById('value-pol');
const btnReset    = document.getElementById('btn-reset');
const btnPlay     = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const st = {
  thetaDeg: 56.31, ratio: 1.5, pol: 'p', speed: 2, phase: 0,
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// Left scene.
const SX = 36, SY = 70, SW = W * 0.46, SH = H - SY - 70;
const OX = SX + SW * 0.5, IY = SY + SH * 0.52;     // interface hit point
const BEAM = 26;                                    // beam half-width (px)

function waveBeam(dir, length, amp, lamPx, color) {
  // dir: unit (dx, dy) from the hit point O. Moving wavefront ticks
  // perpendicular to the beam; tick length and alpha scale with |amp|.
  const nx = -dir[1], ny = dir[0];
  const a = Math.max(0, Math.min(1, Math.abs(amp)));
  ctx.strokeStyle = color; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(OX, IY); ctx.lineTo(OX + dir[0] * length, IY + dir[1] * length); ctx.stroke();
  ctx.globalAlpha = 1;
  if (a < 0.015) return;                            // extinguished
  const half = BEAM * (0.35 + 0.65 * a);
  ctx.lineWidth = 2;
  for (let s = 4; s < length; s += lamPx) {
    const ph = s - (st.phase % lamPx);
    if (ph < 0) continue;
    const cx = OX + dir[0] * ph, cy = IY + dir[1] * ph;
    ctx.globalAlpha = 0.25 + 0.75 * a;
    ctx.beginPath();
    ctx.moveTo(cx - nx * half, cy - ny * half);
    ctx.lineTo(cx + nx * half, cy + ny * half);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawScene() {
  const th = st.thetaDeg * Math.PI / 180;
  const n1 = 1.0, n2 = st.ratio;
  const amp = fresnelAmplitudes(th, n1, n2);
  const tt = amp.theta_t;
  const r = st.pol === 'p' ? amp.rp : amp.rs;
  const t = st.pol === 'p' ? amp.tp : amp.ts;
  const tir = tt === null;

  // Media tints.
  ctx.fillStyle = 'rgba(40,52,78,0.35)'; ctx.fillRect(SX, SY, SW, IY - SY);
  ctx.fillStyle = 'rgba(70,86,120,0.55)'; ctx.fillRect(SX, IY, SW, SY + SH - IY);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(SX, IY); ctx.lineTo(SX + SW, IY); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(OX, SY); ctx.lineTo(OX, SY + SH); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(SX + 0.5, SY + 0.5, SW - 1, SH - 1);

  const lam1 = 26, lam2 = lam1 * (n1 / n2);
  const di = [Math.sin(th), Math.cos(th)];          // incident (down-right)
  const dr = [Math.sin(th), -Math.cos(th)];         // reflected (up-right)
  const Lbeam = SH * 0.62;

  // Incident: draw from up-left towards O (reverse direction ticks).
  ctx.save();
  ctx.beginPath(); ctx.rect(SX, SY, SW, SH); ctx.clip();
  // incident beam (full amplitude) coming in: ticks from O back along -di
  {
    const dir = [-di[0], -di[1]];
    waveBeam(dir, Lbeam, 1.0, lam1, '#7fb1d8');
  }
  // reflected beam
  waveBeam(dr, Lbeam, r, lam1, st.pol === 'p' ? '#ef476f' : '#ffd166');
  // transmitted beam
  if (!tir) {
    const dt = [Math.sin(tt), Math.cos(tt)];
    waveBeam(dt, Lbeam, t, lam2, '#06d6a0');
  } else {
    // Evanescent hint: decaying glow just below the interface.
    const g = ctx.createLinearGradient(0, IY, 0, IY + 50);
    g.addColorStop(0, 'rgba(6,214,160,0.35)'); g.addColorStop(1, 'rgba(6,214,160,0)');
    ctx.fillStyle = g; ctx.fillRect(SX, IY, SW, 50);
  }
  ctx.restore();

  // Labels.
  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#7fb1d8'; ctx.fillText('incident', SX + 8, SY + 16);
  ctx.fillStyle = st.pol === 'p' ? '#ef476f' : '#ffd166';
  ctx.fillText(`reflected (|r| = ${Math.abs(r).toFixed(3)})`, SX + 8, SY + 32);
  ctx.fillStyle = '#06d6a0';
  ctx.fillText(tir ? 'total internal reflection' : `refracted (|t| = ${Math.abs(t).toFixed(3)})`, SX + 8, SY + 48);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.textAlign = 'right';
  ctx.fillText(`n1 = ${n1.toFixed(2)}`, SX + SW - 8, IY - 8);
  ctx.fillText(`n2 = ${n2.toFixed(2)}`, SX + SW - 8, IY + 18);
  const tB = brewsterAngle(n1, n2) * 180 / Math.PI;
  if (st.pol === 'p' && Math.abs(st.thetaDeg - tB) < 1.2) {
    ctx.fillStyle = '#ef476f'; ctx.textAlign = 'center';
    ctx.fillText('reflected wave extinguished at Brewster', OX, SY + SH - 10);
  }
}

function drawCurve() {
  const n1 = 1.0, n2 = st.ratio;
  const px = SX + SW + 34, py = SY, pw = W - px - 30, ph = SH;
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  const xOf = (d) => px + 8 + (pw - 16) * d / 90;
  const yOf = (R) => py + ph - 18 - (ph - 30) * R;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  for (const d of [30, 60, 90]) { const x = xOf(d); ctx.beginPath(); ctx.moveTo(x, py + 6); ctx.lineTo(x, py + ph - 18); ctx.stroke(); }
  const plot = (key, col, lw) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i <= 180; i += 1) {
      const d = 89.5 * i / 180, R = fresnelR(d * Math.PI / 180, n1, n2);
      const X = xOf(d), Y = yOf(key === 's' ? R.Rs : R.Rp);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  plot('s', '#7fb1d8', st.pol === 's' ? 2.6 : 1.2);
  plot('p', '#ef476f', st.pol === 'p' ? 2.6 : 1.2);
  const tB = brewsterAngle(n1, n2) * 180 / Math.PI;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xOf(tB), py + 6); ctx.lineTo(xOf(tB), py + ph - 18); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xOf(st.thetaDeg), py + 6); ctx.lineTo(xOf(st.thetaDeg), py + ph - 18); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('R_s', px + 8, py + 16);
  ctx.fillStyle = '#ef476f'; ctx.fillText('R_p', px + 36, py + 16);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(`theta_B = ${tB.toFixed(1)}`, xOf(tB) + 4, py + 30);
  ctx.textAlign = 'center'; ctx.fillText('theta_i (deg)', px + pw / 2, py + ph - 4);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const n1 = 1.0, n2 = st.ratio, th = st.thetaDeg * Math.PI / 180;
  const R = fresnelR(th, n1, n2);
  const tB = brewsterAngle(n1, n2) * 180 / Math.PI;
  const tc = criticalAngle(n1, n2);
  const tt = snellRefract(th, n1, n2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`theta_i = ${st.thetaDeg.toFixed(1)} deg   n1 = 1.00, n2 = ${n2.toFixed(2)}   pol = ${st.pol}`, 24, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const ttStr = tt === null ? 'TIR' : `${(tt * 180 / Math.PI).toFixed(1)} deg`;
  const tcStr = tc === null ? '-' : `${(tc * 180 / Math.PI).toFixed(1)} deg`;
  ctx.fillText(`theta_B = ${tB.toFixed(2)}   theta_t = ${ttStr}   theta_c = ${tcStr}   R_s = ${R.Rs.toFixed(3)}   R_p = ${R.Rp.toFixed(4)}`, 24, 44);
  drawScene();
  drawCurve();
}

sliderTheta.addEventListener('input', () => { st.thetaDeg = parseFloat(sliderTheta.value); valueTheta.textContent = `${st.thetaDeg.toFixed(1)} deg`; if (!st.playing) render(); });
sliderRatio.addEventListener('input', () => { st.ratio = parseFloat(sliderRatio.value); valueRatio.textContent = st.ratio.toFixed(2); if (!st.playing) render(); });
sliderSpeed.addEventListener('input', () => { st.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(st.speed); });
selectPol.addEventListener('change', () => { st.pol = selectPol.value; valuePol.textContent = st.pol; if (!st.playing) render(); });
btnReset.addEventListener('click', () => { st.thetaDeg = 56.31; st.ratio = 1.5; st.pol = 'p'; st.phase = 0; sliderTheta.value = '56.31'; sliderRatio.value = '1.5'; selectPol.value = 'p'; valueTheta.textContent = '56.3 deg'; valueRatio.textContent = '1.50'; valuePol.textContent = 'p'; render(); });
btnPlay.addEventListener('click', () => {
  st.playing = !st.playing;
  btnPlay.textContent = st.playing ? 'Pause' : 'Play';
  btnPlay.setAttribute('aria-pressed', String(!st.playing));
});

function bootSync() {
  valueTheta.textContent = `${st.thetaDeg.toFixed(1)} deg`;
  valueRatio.textContent = st.ratio.toFixed(2);
  valueSpeed.textContent = String(st.speed);
  valuePol.textContent = st.pol;
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.pol = 'p'; selectPol.value = 'p'; valuePol.textContent = 'p';
    st.thetaDeg = 20 + f * 65;                      // sweep through Brewster
    st.phase = f * 60;
    valueTheta.textContent = `${st.thetaDeg.toFixed(1)} deg`;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

function tick() {
  if (st.playing) { st.phase += 0.6 * Math.max(1, st.speed); render(); }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
