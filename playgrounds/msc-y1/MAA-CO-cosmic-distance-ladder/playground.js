// Cosmic distance ladder, shown as one connected ladder. The four rungs
// (trigonometric parallax, Cepheid period-luminosity, Type Ia standard
// candle, Hubble flow) share a logarithmic distance axis. Each slider
// drives a large in-panel diagram on the left (the parallax baseline,
// the Leavitt law, the SN light curve, the redshifted spectrum) and the
// position of that rung's marker on the axis; the markers are joined
// into a ladder climbing from parsecs to gigaparsecs. The error whisker
// widens down the ladder because every rung is calibrated on the one
// below it, which is the whole point of the construction.
// Reference: Weinberg, Cosmology (2008), Sec. 1.6; Freedman and Madore,
// ARA&A 48, 673 (2010).

import { dParallax, MVCepheid, dModulus, dHubble, ladder, H0, C_KMS } from './sim.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas     = document.getElementById('stage');
const ctx        = canvas.getContext('2d', { alpha: false });
const readoutEl  = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const DEF = { parallax: 100, cepheidP: 30, snApparent: 16, z: 0.05 };
const state = { ...DEF, phase: 0 };
let running = true;

const AX = { x0: 470, x1: 884, lo: 0, hi: 10 };          // log10(d/pc)
const xOfPc = (pc) => {
  const L = Math.min(AX.hi, Math.max(AX.lo, Math.log10(Math.max(1, pc))));
  return AX.x0 + (L - AX.lo) / (AX.hi - AX.lo) * (AX.x1 - AX.x0);
};
const RUNGS = [
  { name: '1. Parallax',    yc: 130, color: '#ffd57f' },
  { name: '2. Cepheid P-L', yc: 254, color: '#7fd0ff' },
  { name: '3. Type Ia SN',  yc: 378, color: '#ff9d6e' },
  { name: '4. Hubble flow', yc: 502, color: '#c98bff' },
];
const PX = 22, PW = 426, PH = 112;     // vignette panel geometry

function fmtPc(pc) {
  if (pc < 1e3) return `${pc.toFixed(1)} pc`;
  if (pc < 1e6) return `${(pc / 1e3).toFixed(2)} kpc`;
  if (pc < 1e9) return `${(pc / 1e6).toFixed(2)} Mpc`;
  return `${(pc / 1e9).toFixed(2)} Gpc`;
}
const lerp = (a, b, t) => a + (b - a) * t;

function panel(i, ph) {
  const x = PX, y = RUNGS[i].yc - PH / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, PW, PH); ctx.clip();
  ctx.fillStyle = '#080810'; ctx.fillRect(x, y, PW, PH);
  if (i === 0) {
    // Parallax: a baseline whose half-angle is the parallax. The star's
    // displacement from the distant background spans the panel as p runs
    // 1 -> 800 mas, so the slider repaints almost the whole panel.
    ctx.fillStyle = 'rgba(200,205,230,0.35)';
    for (let k = 0; k < 26; k += 1) ctx.fillRect(x + ((k * 53) % PW), y + ((k * 31) % PH), 1.5, 1.5);
    const frac = (state.parallax - 1) / 799;                   // 0..1
    const off = lerp(-PW * 0.40, PW * 0.40, frac);
    const sway = (running || CAPTURE_NAME) ? 4 * Math.sin(ph) : 0;
    ctx.strokeStyle = 'rgba(255,213,127,0.5)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x + PW / 2, y + PH - 12); ctx.lineTo(x + PW / 2 + off, y + 26); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#7e828a'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('Sun', x + PW / 2 - 9, y + PH - 2);
    ctx.fillStyle = '#ffd57f';
    ctx.beginPath(); ctx.arc(x + PW / 2 + off + sway, y + 24, 6, 0, 2 * Math.PI); ctx.fill();
  } else if (i === 1) {
    // Leavitt period-luminosity line, with the live point on it.
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(x + 30, y + 12); ctx.lineTo(x + 30, y + PH - 16); ctx.lineTo(x + PW - 10, y + PH - 16); ctx.stroke();
    ctx.fillStyle = '#7e828a'; ctx.font = '9px ui-monospace, monospace';
    ctx.fillText('M_V', x + 6, y + 20); ctx.fillText('log P', x + PW - 34, y + PH - 4);
    const X = (lp) => x + 34 + lp * (PW - 50);                 // log10 P in [0,2]
    const Y = (M) => y + 16 + ((M + 7) / 6) * (PH - 34);       // M_V in [-7,-1]
    ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k <= 40; k += 1) { const lp = 2 * k / 40; const xx = X(lp), yy = Y(MVCepheid(Math.pow(10, lp))); k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
    const lpNow = Math.log10(state.cepheidP);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(lpNow), Y(MVCepheid(state.cepheidP)), 4.5, 0, 2 * Math.PI); ctx.fill();
  } else if (i === 2) {
    // SN Ia light curve; the apparent-mag slider shifts the whole curve
    // vertically (brighter peak = nearer), repainting the panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.moveTo(x + 26, y + 10); ctx.lineTo(x + 26, y + PH - 12); ctx.lineTo(x + PW - 10, y + PH - 12); ctx.stroke();
    const peakY = lerp(y + 14, y + PH - 22, (state.snApparent - 6) / 22);
    ctx.strokeStyle = '#ff9d6e'; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k <= 46; k += 1) { const t = k / 46; const dip = Math.exp(-((t - 0.34) ** 2) / 0.012); const xx = x + 30 + t * (PW - 44); const yy = (y + PH - 14) - (y + PH - 14 - peakY) * dip; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
    const mt = (running || CAPTURE_NAME) ? (ph * 0.12) % 1 : 0.34;
    const dip = Math.exp(-((mt - 0.34) ** 2) / 0.012);
    ctx.fillStyle = '#ffd9b0';
    ctx.beginPath(); ctx.arc(x + 30 + mt * (PW - 44), (y + PH - 14) - (y + PH - 14 - peakY) * dip, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#7e828a'; ctx.font = '9px ui-monospace, monospace'; ctx.fillText('flux', x + 4, y + 18);
  } else {
    // Hubble: rest spectrum vs observed, lines redshifted by z. Large z
    // sweeps the lines across the full bar.
    ctx.fillStyle = '#dcdde2'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('rest', x + 6, y + 22); ctx.fillText('observed', x + 6, y + 64);
    const bx = x + 70, bw = PW - 84;
    for (const [by, zz] of [[y + 14, 0], [y + 56, state.z]]) {
      ctx.fillStyle = '#101018'; ctx.fillRect(bx, by, bw, 20);
      for (const rf of [0.16, 0.30, 0.52, 0.74]) {
        const obs = rf * (1 + zz * (6 / 0.4));
        if (obs <= 1) { ctx.fillStyle = zz ? '#c98bff' : '#9fb4d8'; ctx.fillRect(bx + obs * bw, by, 2, 20); }
      }
    }
    ctx.fillStyle = '#9aa0a6'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`v = c z = ${(C_KMS * state.z).toFixed(0)} km/s`, bx, y + PH - 2);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(PX, RUNGS[i].yc - PH / 2, PW, PH);
}

function render() {
  if (!CAPTURE_NAME && running) state.phase += 0.045;
  const ph = CAPTURE_NAME ? CAPTURE_FRAC * 9 : state.phase;
  ctx.fillStyle = '#0E0E13'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#dcdde2'; ctx.font = '17px sans-serif';
  ctx.fillText('Cosmic distance ladder', 18, 26);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#9aa0a6';
  ctx.fillText('Each rung is calibrated on the one below; every slider moves its diagram and its marker.', 18, 46);

  const d = ladder(state);

  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.fillStyle = '#7e828a';
  ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  for (const [L, lab] of [[0, '1 pc'], [2, '100 pc'], [4, '10 kpc'], [6, '1 Mpc'], [8, '100 Mpc'], [10, '10 Gpc']]) {
    const xx = AX.x0 + (L / 10) * (AX.x1 - AX.x0);
    ctx.beginPath(); ctx.moveTo(xx, 64); ctx.lineTo(xx, 556); ctx.stroke();
    ctx.fillText(lab, xx, 570);
  }
  ctx.textAlign = 'left';

  const errFrac = [0.012, 0.045, 0.085, 0.14];
  const xm = d.map(xOfPc);
  const BARH = 32;
  // Ladder climb: join successive bar tips (the calibration chain).
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(xm[i], RUNGS[i].yc); ctx.lineTo(xm[i + 1], RUNGS[i + 1].yc); ctx.stroke(); }
  for (let i = 0; i < 4; i += 1) {
    const R = RUNGS[i];
    panel(i, ph);
    // Bold reach bar from the axis origin to this rung's distance. Any
    // slider resizes a large coloured block, so the response dominates
    // the frame instead of being a one-pixel marker on a log axis.
    const g = ctx.createLinearGradient(AX.x0, 0, Math.max(AX.x0 + 4, xm[i]), 0);
    g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(1, R.color);
    ctx.fillStyle = g; ctx.fillRect(AX.x0, R.yc - BARH / 2, Math.max(3, xm[i] - AX.x0), BARH);
    ctx.fillStyle = R.color; ctx.fillRect(xm[i] - 3, R.yc - BARH / 2 - 3, 6, BARH + 6);
    const ew = errFrac[i] * (AX.x1 - AX.x0) * 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xm[i] - ew, R.yc); ctx.lineTo(xm[i] + ew, R.yc); ctx.stroke();
    ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif';
    ctx.fillText(R.name, AX.x0 + 6, R.yc - BARH / 2 - 8);
    ctx.fillStyle = R.color; ctx.font = '13px ui-monospace, monospace';
    const above = xm[i] < AX.x1 - 130; ctx.textAlign = above ? 'left' : 'right';
    ctx.fillText(fmtPc(d[i]), xm[i] + (above ? 12 : -12), R.yc + 4);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText([
      `p = ${state.parallax.toFixed(0)} mas`,
      `P = ${state.cepheidP.toFixed(0)} d -> M_V = ${MVCepheid(state.cepheidP).toFixed(2)}`,
      `m = ${state.snApparent.toFixed(1)}, M = -19.3`,
      `z = ${state.z.toFixed(3)}`,
    ][i], AX.x0 + 6, R.yc + BARH / 2 + 16);
  }

  const span = (Math.log10(Math.max(1, d[3])) - Math.log10(Math.max(1, d[0]))).toFixed(2);
  readoutEl.innerHTML =
    `<span class="label">H&#8320;</span><span class="value">${H0} km/s/Mpc</span>` +
    `<span class="label">ladder span</span><span class="value">${span} dex</span>` +
    `<span class="label">far rung</span><span class="value">${fmtPc(d[3])}</span>`;
}

function slider(id, label, min, max, step, key, fmt) {
  const r = document.createElement('div'); r.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
  const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
  inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(state[key]);
  inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(state[key]);
  inp.addEventListener('input', () => { const v = parseFloat(inp.value); state[key] = v; val.textContent = fmt(v); render(); });
  r.appendChild(lab); r.appendChild(inp); r.appendChild(val);
  controlsEl.appendChild(r);
}
function buildControls() {
  controlsEl.innerHTML = '';
  slider('p',   'parallax (mas)', 1, 800, 1,    'parallax',   v => v.toFixed(0));
  slider('cep', 'Cepheid P (d)',  1, 100, 1,    'cepheidP',   v => v.toFixed(0));
  slider('ap',  'apparent V mag', 6, 28,  0.1,  'snApparent', v => v.toFixed(1));
  slider('z',   'redshift z',     0.002, 0.4, 0.002, 'z',     v => v.toFixed(3));
  const row = document.createElement('div'); row.className = 'row buttons';
  const reset = document.createElement('button'); reset.type = 'button'; reset.id = 'btn-reset'; reset.textContent = 'Reset';
  reset.addEventListener('click', () => { Object.assign(state, DEF); buildControls(); render(); });
  const pause = document.createElement('button'); pause.type = 'button'; pause.id = 'btn-pause'; pause.textContent = 'Pause';
  pause.setAttribute('aria-pressed', 'false');
  pause.addEventListener('click', () => { running = !running; pause.textContent = running ? 'Pause' : 'Play'; pause.setAttribute('aria-pressed', String(!running)); });
  row.appendChild(reset); row.appendChild(pause); controlsEl.appendChild(row);
}

buildControls();
let raf;
function tick() { render(); if (!CAPTURE_NAME) raf = requestAnimationFrame(tick); }
if (DETERMINISTIC) {
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  if (Math.abs(dParallax(1) - 1000) > 1e-6) return { name: 'parallax', pass: false, msg: 'd(1 mas) != 1000 pc' };
  if (Math.abs(dHubble(0.1) / 1e6 - 428.3) > 1) return { name: 'Hubble', pass: false, msg: 'd(z=0.1) wrong' };
  if (Math.abs(MVCepheid(10) + 4.13) > 0.01) return { name: 'Leavitt', pass: false, msg: 'M_V(10 d) wrong' };
  return { name: 'parallax + Cepheid + Hubble', pass: true, msg: `d(1 mas)=1000 pc; M_V(10 d)=-4.13; d(z=0.1)=${(dHubble(0.1) / 1e6).toFixed(0)} Mpc` };
};
