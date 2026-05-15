// Cosmic distance ladder: four rungs. Next-rung button cycles them.

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
const state = { rung: 0, parallax: 100, cepheidP: 30, snApparent: 16, z: 0.1, phase: 0 };
const H0 = 70, cKmS = 299792;

function dParallax(p_mas) { return 1000 / p_mas; }
function MVCepheid(P)     { return -2.78 * Math.log10(P) - 1.35; }
function dCepheid(m, M)   { return Math.pow(10, (m - M + 5) / 5); }
function dHubble(z)       { return cKmS * z / H0; }

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  state.phase += 0.04;
  ctx.fillStyle = '#dcdde2'; ctx.font = '16px sans-serif';
  ctx.fillText(`Rung ${state.rung + 1} of 4`, 18, 28);
  ctx.font = '13px sans-serif';

  if (state.rung === 0) {
    ctx.fillText('Parallax: nearby star sways against background.', 18, 50);
    const cx = W * 0.5, cy = H * 0.55;
    for (let i = 0; i < 80; i += 1) {
      ctx.fillStyle = 'rgba(220,220,240,0.5)';
      ctx.beginPath(); ctx.arc(((i * 73) % W), 80 + ((i * 41) % (H - 180)), 1.5, 0, 2 * Math.PI); ctx.fill();
    }
    const sway = Math.sin(state.phase) * 40;
    ctx.fillStyle = '#ffd57f';
    ctx.beginPath(); ctx.arc(cx + sway, cy, 7, 0, 2 * Math.PI); ctx.fill();
    const d = dParallax(state.parallax);
    ctx.fillStyle = '#dcdde2';
    ctx.fillText(`p=${state.parallax.toFixed(1)} mas  d=${d.toFixed(2)} pc`, 18, H - 36);
  } else if (state.rung === 1) {
    ctx.fillText('Cepheid period-luminosity.', 18, 50);
    const cx = W * 0.5, cy = H * 0.5;
    const r = 30 + 12 * Math.sin(state.phase * 2 * Math.PI / state.cepheidP * 0.5);
    ctx.fillStyle = '#ffd57f';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
    const MV = MVCepheid(state.cepheidP);
    const d = dCepheid(state.snApparent, MV);
    ctx.fillStyle = '#dcdde2';
    ctx.fillText(`P=${state.cepheidP.toFixed(1)} d  M_V=${MV.toFixed(2)};  m=${state.snApparent} -> d=${(d/1e6).toFixed(2)} Mpc`, 18, H - 36);
  } else if (state.rung === 2) {
    ctx.fillText('Type Ia SN: standard candle M_V = -19.3.', 18, 50);
    const cx = W * 0.5, cy = H * 0.5;
    const t = (state.phase % 4) / 4;
    const r = 80 + 20 * Math.exp(-3 * t);
    ctx.fillStyle = `rgba(255, 200, 80, ${1 - t})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
    const d = dCepheid(state.snApparent, -19.3);
    ctx.fillStyle = '#dcdde2';
    ctx.fillText(`m=${state.snApparent} -> d=${(d/1e6).toFixed(2)} Mpc`, 18, H - 36);
  } else {
    ctx.fillText('Hubble flow: D = c z / H_0.', 18, 50);
    const cx = W * 0.5, cy = H * 0.5;
    ctx.fillStyle = 'rgba(170, 70, 70, 0.6)';
    ctx.beginPath(); ctx.ellipse(cx, cy, 70 + state.z * 30, 26 + state.z * 12, 0, 0, 2 * Math.PI); ctx.fill();
    const d = dHubble(state.z);
    ctx.fillStyle = '#dcdde2';
    ctx.fillText(`z=${state.z.toFixed(3)}  d=${d.toFixed(0)} Mpc`, 18, H - 36);
  }
  const errMpc = [0.001, 0.05, 0.2, 0.6][state.rung];
  ctx.fillStyle = '#fdb56a';
  ctx.fillRect(W - 240, 18, errMpc * 200, 14);
  ctx.fillStyle = '#dcdde2';
  ctx.fillText(`cum. error: ${errMpc}`, W - 240, 50);
  readoutInv.textContent = `rung=${state.rung + 1}`;
  readoutFrame.textContent = '-';
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Next rung';
  next.addEventListener('click', () => { state.rung = (state.rung + 1) % 4; });
  const prev = document.createElement('button'); prev.type = 'button'; prev.textContent = 'Prev rung';
  prev.addEventListener('click', () => { state.rung = (state.rung + 3) % 4; });
  row.appendChild(prev); row.appendChild(next);
  controlsEl.appendChild(row);
  function slider(id, label, min, max, step, value, onInput, fmt) {
    const r = document.createElement('div'); r.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); });
    r.appendChild(lab); r.appendChild(inp); r.appendChild(val);
    controlsEl.appendChild(r);
  }
  slider('p',   'parallax (mas)', 1, 1000, 1,   state.parallax,   v => state.parallax = v,   v => v.toFixed(0));
  slider('cep', 'Cepheid P (d)',  1, 100,  1,   state.cepheidP,   v => state.cepheidP = v,   v => v.toFixed(0));
  slider('ap',  'apparent V mag', 6, 25,   0.1, state.snApparent, v => state.snApparent = v, v => v.toFixed(1));
  slider('z',   'redshift z',     0.001, 1, 0.005, state.z,       v => state.z = v,          v => v.toFixed(3));
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
  if (Math.abs(dParallax(1) - 1000) > 0.01) return { name: 'parallax', pass: false, msg: 'd(1 mas) wrong' };
  if (Math.abs(dHubble(0.1) - 428) > 2)     return { name: 'Hubble',   pass: false, msg: 'd(0.1) wrong' };
  return { name: 'parallax + Hubble', pass: true, msg: `d(1 mas)=1000 pc; d(z=0.1)=${dHubble(0.1).toFixed(0)} Mpc` };
};
