import { fontString } from '../../../shared/js/canvas-type.js';
// Compton vs inverse-Compton playground. Plot energy axis on log scale
// with the input photon, the forward-Compton-shifted photon, and the
// inverse-Compton up-scattered photon marked.

import {
  comptonForward, icMaxEnergy, icTypicalThomson, isThomsonRegime,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params         = new URLSearchParams(location.search);
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d', { alpha: false });

const sliderLogE = document.getElementById('slider-logE');
const sliderLogG = document.getElementById('slider-logG');
const valueLogE  = document.getElementById('value-logE');
const valueLogG  = document.getElementById('value-logG');

let logE = parseFloat(sliderLogE.value);
let logG = parseFloat(sliderLogG.value);
let playing = !(DETERMINISTIC || prefersReducedMotion());
let gDir = 1, lastT = 0;
const gMin = parseFloat(sliderLogG.min) || 0, gMax = parseFloat(sliderLogG.max) || 8;
sliderLogE.addEventListener('input', () => { playing = false; logE = parseFloat(sliderLogE.value); valueLogE.textContent = logE.toFixed(2); });
sliderLogG.addEventListener('input', () => { playing = false; logG = parseFloat(sliderLogG.value); valueLogG.textContent = logG.toFixed(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:     css.getPropertyValue('--bg').trim() || '#060608',
    fg:     css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted:  css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    blue:   '#5bc0eb',
    orange: '#f4a261',
    red:    '#ef476f',
    grid:   '#23252a',
  };
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padL = 64, padR = 16, padT = 32, padB = 40;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;

  const E = Math.pow(10, logE);
  const gam = Math.pow(10, logG);

  const Edown = comptonForward(E, Math.PI); // backscatter (max down-shift)
  const Eup = icMaxEnergy(gam, E);
  const Etyp = icTypicalThomson(gam, E);

  // Log energy axis from -6 to 14 (covers radio to TeV).
  const eMinLog = -6, eMaxLog = 14;
  function xFor(le) { return padL + plotW * (le - eMinLog) / (eMaxLog - eMinLog); }

  // Spectrum bands (radio, optical, X-ray, gamma).
  const bands = [
    { from: -6, to: -3, label: 'radio',   color: 'rgba(167, 139, 250, 0.06)' },
    { from: -1, to: 1,  label: 'optical', color: 'rgba(91, 192, 235, 0.06)' },
    { from: 2,  to: 5,  label: 'X-ray',   color: 'rgba(244, 162, 97, 0.08)' },
    { from: 5,  to: 14, label: 'gamma',   color: 'rgba(239, 71, 111, 0.08)' },
  ];
  for (const b of bands) {
    ctx.fillStyle = b.color;
    ctx.fillRect(xFor(b.from), padT, xFor(b.to) - xFor(b.from), plotH);
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(b.label, xFor(0.5 * (b.from + b.to)) - 20, padT + 14);
  }

  // Grid.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = 1;
  for (let le = eMinLog; le <= eMaxLog; le += 2) {
    const x = xFor(le);
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`1e${le}`, x - 14, padT + plotH + 14);
  }
  ctx.fillStyle = c.muted;
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  ctx.fillText('E (eV, log)', padL + plotW - 8, padT + plotH + 28);

  // Track lines.
  function marker(x, y, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = c.muted;
    ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(label, x + 8, y - 6);
  }
  const yIn = padT + plotH * 0.14;
  const yDown = padT + plotH * 0.30;
  const yUp = padT + plotH * 0.46;
  // Connectors first (so the markers sit on top).
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1;
  if (Edown > 0) { ctx.beginPath(); ctx.moveTo(xFor(logE), yIn); ctx.lineTo(xFor(Math.log10(Edown)), yDown); ctx.stroke(); }
  if (Eup > 0) { ctx.beginPath(); ctx.moveTo(xFor(logE), yIn); ctx.lineTo(xFor(Math.log10(Eup)), yUp); ctx.stroke(); }
  marker(xFor(logE), yIn, c.blue, `E_in = ${E.toExponential(2)} eV`);
  if (Edown > 0) marker(xFor(Math.log10(Edown)), yDown, c.orange, `Compton backscatter`);
  if (Eup > 0)   marker(xFor(Math.log10(Eup)), yUp, c.accent, `IC max (gamma=${gam.toExponential(1)})`);

  // Inverse-Compton single-electron spectrum (lower half). One electron does
  // not emit a single photon at E_max, it fills a spectrum up to E_max ~ 4
  // gamma^2 E_in. Plot the SED E^2 dN/dE against E / E_max so the Thomson,
  // isotropic kernel f(q) = 2q ln q + q + 1 - 2q^2 fills the panel: a broad
  // bump that peaks below E_max and cuts off sharply there.
  const sedTop = padT + plotH * 0.56, sedBase = padT + plotH * 0.94, sedH = sedBase - sedTop;
  const sx0 = padL, sx1 = padL + plotW, qMax = 1.12;
  const qToX = (q) => sx0 + (sx1 - sx0) * q / qMax;
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('inverse-Compton spectrum shape: a bump that peaks below E_max and cuts off there', sx0, sedTop - 12);
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx0, sedBase); ctx.lineTo(sx1, sedBase); ctx.stroke();
  if (Eup > E) {
    const N = 220; const sed = []; let smax = 1e-12;
    for (let i = 0; i <= N; i += 1) {
      const q = qMax * i / N;
      const f = (q > 0 && q < 1) ? (2 * q * Math.log(q) + q + 1 - 2 * q * q) : 0;
      const s = q * q * Math.max(0, f);
      sed.push({ q, s }); if (s > smax) smax = s;
    }
    ctx.fillStyle = 'rgba(255,209,102,0.16)'; ctx.beginPath(); ctx.moveTo(qToX(0), sedBase);
    for (const p of sed) ctx.lineTo(qToX(p.q), sedBase - (p.s / smax) * sedH);
    ctx.lineTo(qToX(qMax), sedBase); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 2.2; ctx.beginPath();
    sed.forEach((p, i) => { const x = qToX(p.q), y = sedBase - (p.s / smax) * sedH; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    // typical photon energy (number-weighted, E_typ = E_max/3) and the cutoff
    for (const [q, col, lab] of [[Etyp / Eup, c.blue, 'E_typ'], [1, c.red, 'E_max = 4 γ² E_in']]) {
      const x = qToX(q);
      ctx.strokeStyle = col; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, sedTop); ctx.lineTo(x, sedBase); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(lab, x, sedBase + 14);
    }
  }
  ctx.fillStyle = c.muted; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('photon energy  E / E_max', (sx0 + sx1) / 2, sedBase + 30); ctx.textAlign = 'left';
}

// Auto-sweep the electron Lorentz factor so the inverse-Compton boost plays
// on load: the IC-max marker climbs the energy axis (E_out ~ gamma^2 E_in)
// while the forward-Compton point barely moves. Any slider input pauses it.
function loop(now) {
  if (playing) {
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    logG += gDir * dt * ((gMax - gMin) / 14);             // ~14 s round trip
    if (logG >= gMax) { logG = gMax; gDir = -1; } else if (logG <= gMin) { logG = gMin; gDir = 1; }
    sliderLogG.value = String(logG); valueLogG.textContent = logG.toFixed(2);
  }
  lastT = now;
  render();
  requestAnimationFrame(loop);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logG = 1 + frac * 7;
    sliderLogG.value = String(logG);
    valueLogG.textContent = logG.toFixed(2);
  }
  valueLogE.textContent = logE.toFixed(2);
  valueLogG.textContent = logG.toFixed(2);
  render();

  if (DETERMINISTIC) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, logE, logG };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(loop);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(loop);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const E = Math.pow(10, logE);
  const gam = Math.pow(10, logG);
  const Edown = comptonForward(E, Math.PI);
  const Eup = icMaxEnergy(gam, E);
  const Etyp = icTypicalThomson(gam, E);
  const thomson = isThomsonRegime(gam, E);
  return {
    fields: [
      { key: 'E_in', label: 'Input photon (eV)', value: E, format: 'exponential2' },
      { key: 'gamma', label: 'Electron Lorentz factor', value: gam, format: 'exponential1' },
      { key: 'E_compton', label: 'Compton backscatter (eV)', value: Edown, format: 'exponential2' },
      { key: 'E_ic_max', label: 'IC max energy (eV)', value: Eup, format: 'exponential2' },
      { key: 'E_ic_typ', label: 'IC typical (Thomson) (eV)', value: Etyp, format: 'exponential2' },
      { key: 'regime', label: 'Scattering regime', value: thomson ? 'Thomson' : 'Klein-Nishina', format: 'string' },
    ]
  };
};
window.playground.getInvariants = function () {
  const E = Math.pow(10, logE);
  const gam = Math.pow(10, logG);
  const Edown = comptonForward(E, Math.PI);
  const Eup = icMaxEnergy(gam, E);
  const Etyp = icTypicalThomson(gam, E);
  const thomson = isThomsonRegime(gam, E);
  return [
    { key: 'compton-finite', label: 'Compton energy finite', value: Edown > 0 && Edown < E, status: (Edown > 0 && Edown < E) ? 'pass' : 'fail' },
    { key: 'ic-boosts', label: 'IC energy > input', value: Eup > E, status: Eup > E ? 'pass' : 'fail' },
    { key: 'ic-typical-scales', label: 'Typical matches gamma^2 scaling', value: Math.abs(Etyp - 4/3 * gam * gam * E) < 1e-10 * Etyp, status: Math.abs(Etyp - 4/3 * gam * gam * E) < 1e-10 * Etyp ? 'pass' : 'fail' },
    { key: 'thomson-or-kn', label: 'Regime classification consistent', value: thomson === (gam * E < 0.1 * 511e3), status: thomson === (gam * E < 0.1 * 511e3) ? 'pass' : 'fail' },
  ];
};
