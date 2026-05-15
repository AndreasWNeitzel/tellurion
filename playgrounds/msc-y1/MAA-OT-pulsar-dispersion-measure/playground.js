// Pulsar dispersion-measure dedispersion. Synthesize a dispersed pulse on
// a (frequency, time) plane: at each frequency channel f, the pulse arrives
// with delay dt(f) = DM / 2.41e-4 * (1/f_MHz^2 - 1/f_ref^2) ms.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;

const FREQ_LO = 400;     // MHz
const FREQ_HI = 1400;    // MHz
const NCH     = 96;      // frequency channels
const NT      = 240;     // time bins
const T_WINDOW = 200;    // ms

const state = {
  trueDM:  120,
  guessDM: 120,
  width:   3.0,           // intrinsic pulse FWHM (ms)
};

function delay_ms(DM, f_MHz, f_ref_MHz) {
  return DM / 2.41e-4 * (1 / (f_MHz * f_MHz) - 1 / (f_ref_MHz * f_ref_MHz));
}

function buildDynamicSpectrum(DM, intrinsicWidth) {
  // Shape: a Gaussian in time per channel, centered at t_arrival(f).
  const data = new Float64Array(NCH * NT);
  const dt = T_WINDOW / NT;
  const sigma = intrinsicWidth / 2.355;
  for (let i = 0; i < NCH; i += 1) {
    const f = FREQ_LO + (FREQ_HI - FREQ_LO) * i / (NCH - 1);
    const tArr = T_WINDOW * 0.25 + delay_ms(DM, f, FREQ_HI);
    for (let j = 0; j < NT; j += 1) {
      const t = j * dt;
      const u = (t - tArr) / sigma;
      data[i * NT + j] = Math.exp(-0.5 * u * u);
    }
  }
  return data;
}

function dedisperse(data, DMguess) {
  // For each frequency channel, shift left by delay(DMguess, f, FREQ_HI),
  // then sum across channels.
  const out = new Float64Array(NT);
  const dt = T_WINDOW / NT;
  for (let i = 0; i < NCH; i += 1) {
    const f = FREQ_LO + (FREQ_HI - FREQ_LO) * i / (NCH - 1);
    const shift = -delay_ms(DMguess, f, FREQ_HI) / dt;
    const k0 = Math.floor(shift);
    const frac = shift - k0;
    for (let j = 0; j < NT; j += 1) {
      const j1 = j + k0;
      const j2 = j1 + 1;
      const v1 = (j1 >= 0 && j1 < NT) ? data[i * NT + j1] : 0;
      const v2 = (j2 >= 0 && j2 < NT) ? data[i * NT + j2] : 0;
      out[j] += v1 * (1 - frac) + v2 * frac;
    }
  }
  return out;
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  const spec = buildDynamicSpectrum(state.trueDM, state.width);
  const dedisp = dedisperse(spec, state.guessDM);

  // Top half: dynamic spectrum heatmap.
  const topH = H * 0.55;
  const cellW = W / NT, cellH = topH / NCH;
  for (let i = 0; i < NCH; i += 1) {
    for (let j = 0; j < NT; j += 1) {
      const v = Math.max(0, Math.min(1, spec[i * NT + j]));
      const r = Math.floor(255 * v * 0.95);
      const g = Math.floor(255 * v * 0.65);
      const b = Math.floor(255 * v * 0.20);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1);
    }
  }
  // Axes labels.
  ctx.fillStyle = '#dcdde2'; ctx.font = '12px sans-serif';
  ctx.fillText('freq (MHz)', 8, 16);
  ctx.fillText(String(FREQ_HI), 8, 32);
  ctx.fillText(String(FREQ_LO), 8, topH - 8);
  ctx.fillText('time (ms)', W - 70, topH - 8);

  // Bottom half: dedispersed time series.
  let mx = 0; for (let j = 0; j < NT; j += 1) if (dedisp[j] > mx) mx = dedisp[j];
  const botY0 = topH + 16, botH = H - botY0 - 40;
  ctx.fillStyle = 'rgba(220,220,240,0.08)';
  ctx.fillRect(0, botY0, W, botH);
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let j = 0; j < NT; j += 1) {
    const x = j * cellW;
    const y = botY0 + botH - (dedisp[j] / Math.max(mx, 1e-9)) * botH;
    if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#dcdde2';
  ctx.fillText('Dedispersed (sum across channels)', 8, botY0 + 16);

  readoutInv.textContent = `true_DM=${state.trueDM}  guess_DM=${state.guessDM}  peak=${mx.toFixed(2)}`;
  readoutFrame.textContent = '-';
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt = v => v.toFixed(0)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); render(); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('true-dm',  'true DM',  0,  500, 1,  state.trueDM,  v => state.trueDM  = v);
  slider('guess-dm', 'guess DM', 0,  500, 1,  state.guessDM, v => state.guessDM = v);
  slider('width',    'width ms', 1,  10,  0.5, state.width,  v => state.width   = v, v => v.toFixed(1));

  const presetRow = document.createElement('div'); presetRow.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'Preset';
  presetRow.appendChild(lab);
  for (const [name, dm] of [['Crab', 56.8], ['B1937+21', 71.0], ['Vela', 67.8], ['FRB', 500]]) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
    b.addEventListener('click', () => { state.trueDM = dm; state.guessDM = dm; buildControls(); render(); });
    presetRow.appendChild(b);
  }
  controlsEl.appendChild(presetRow);
}

buildControls();
render();
if (DETERMINISTIC) {
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
}

window.__physicsCheck = async () => {
  // Delta t between 400 MHz and 1400 MHz at DM=100:
  const expected = 100 / 2.41e-4 * (1 / 400 / 400 - 1 / 1400 / 1400);
  const got = delay_ms(100, 400, 1400);
  const err = Math.abs(got - expected) / Math.abs(expected);
  if (err > 1e-6) return { name: 'delay formula', pass: false, msg: `got ${got}, expected ${expected}` };
  return { name: 'DM delay formula', pass: true, msg: `delay(400 MHz, DM=100) = ${got.toFixed(3)} ms` };
};
