// Tree-level QED e+e- -> mu+mu-. Panel A: the s-channel Feynman
// diagram (two vertices, a virtual photon; a one-loop variant adds a
// vacuum-polarisation bubble, four vertices, alpha^4). Panel B: the
// total cross section sigma(sqrt s) in nb, log scale, showing the
// muon-pair threshold and the 1/s falloff. Panel C: the Mandelstam
// invariants with s+t+u = sum m_i^2, and the forward-backward-
// symmetric 1 + cos^2 angular distribution. Gate-tested sim.js;
// deterministic. Peskin and Schroeder Ch. 5; Halzen and Martin; Feynman 1949.
import {
  ME, MMU, beta, mandelstam, sigmaNb, dSigmadOmega, sigmaCurve,
  amplitudeAlphaExponent, matrixElementAlphaPower,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rE = document.getElementById('readout-e');
const rS = document.getElementById('readout-s');
const rM = document.getElementById('readout-m');
const rStu = document.getElementById('readout-stu');
const slE = document.getElementById('slider-e'), vE = document.getElementById('value-e');
const slT = document.getElementById('slider-th'), vT = document.getElementById('value-th');
const selO = document.getElementById('select-order');
const selCh = document.getElementById('select-channel'), vCh = document.getElementById('value-channel');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_E = 100, DEF_T = 60, DEF_O = 'tree', DEF_CH = 's-only';
const st = { eRaw: DEF_E, thDeg: DEF_T, order: DEF_O, channel: DEF_CH, running: !prefersReducedMotion(), ph: 0 };
const sqrtS = () => st.eRaw / 100;                       // GeV
const cosTh = () => Math.cos(st.thDeg * Math.PI / 180);
const nVert = () => (st.order === 'loop' ? 4 : 2);

const SMIN = 2 * MMU + 1e-3, SMAX = 20;
const CURVE = sigmaCurve(SMIN, SMAX, 600);
let SIGMAX = 0;
for (let i = 0; i < CURVE.sig.length; i += 1) SIGMAX = Math.max(SIGMAX, CURVE.sig[i]);

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

// a fermion line with a direction arrow at its midpoint
function fermion(x0, y0, x1, y1, col, label, lx, ly) {
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(mx + 8 * Math.cos(a), my + 8 * Math.sin(a));
  ctx.lineTo(mx - 6 * Math.cos(a) + 5 * Math.sin(a), my - 6 * Math.sin(a) - 5 * Math.cos(a));
  ctx.lineTo(mx - 6 * Math.cos(a) - 5 * Math.sin(a), my - 6 * Math.sin(a) + 5 * Math.cos(a));
  ctx.closePath(); ctx.fill();
  if (label) { ctx.font = fontString(canvas, 'body', 'mono'); ctx.fillText(label, lx, ly); }
}

// a wavy photon propagator between (x0,y) and (x1,y)
function photon(x0, x1, y, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
  const n = Math.max(6, Math.round((x1 - x0) / 9));
  const amp = 7;
  for (let i = 0; i <= 80; i += 1) {
    const u = i / 80, x = x0 + (x1 - x0) * u;
    const yy = y + amp * Math.sin(u * n * Math.PI);
    if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();
}

// a travelling pulse along a segment, fraction p in [0,1)
function pulse(x0, y0, x1, y1, p, col) {
  const x = x0 + (x1 - x0) * p, yy = y0 + (y1 - y0) * p;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, yy, 3.5, 0, 2 * Math.PI); ctx.fill();
}

function drawDiagram(x, y, w, h) {
  const V = nVert();
  let title, isT = st.channel === 't-channel';
  if (st.channel === 'both') {
    title = `Feynman diagrams: s and t channels, ${V} vertices each`;
  } else if (isT) {
    title = `Feynman diagram: Bhabha (t-channel, e+ e- -> e+ e-, ${V} vertices)`;
  } else {
    title = `Feynman diagram: e+ e- -> mu+ mu-  (s-channel, ${V} vertices)`;
  }
  panel(x, y, w, h, title);

  const cy = y + h / 2 + 6;
  const xeIn = x + 60, xV1 = x + w * 0.34, xV2 = x + w * 0.66, xmOut = x + w - 60;
  const dy = 64;
  const cE = '#6fb4ff', cMU = '#ff9d6f', cG = '#ffd166', cL = '#c08bff';
  const fl = st.ph;

  if (st.channel === 'both') {
    // Draw both diagrams side by side, split vertically
    const sep = w / 2 - 8;
    // S-channel (left)
    drawDiagramChannel('s', x + 2, cy, sep - 4, V, fl, cE, cMU, cG, cL);
    // T-channel (right)
    drawDiagramChannel('t', x + sep + 6, cy, sep - 4, V, fl, cE, cMU, cG, cL);
  } else {
    // Single diagram
    const finalCol = isT ? cE : cMU;
    const finalLabel = isT ? 'e' : 'mu';

    // incoming e- (lower) and e+ (upper) into V1
    fermion(xeIn, cy + dy, xV1, cy, cE, 'e-', xeIn - 26, cy + dy + 4);
    fermion(xeIn, cy - dy, xV1, cy, cE, 'e+', xeIn - 26, cy - dy);
    pulse(xeIn, cy + dy, xV1, cy, fl, cE);
    pulse(xeIn, cy - dy, xV1, cy, fl, cE);
    // outgoing (lower and upper) from V2
    fermion(xV2, cy, xmOut, cy + dy, finalCol, finalLabel + '-', xmOut + 6, cy + dy + 4);
    fermion(xV2, cy, xmOut, cy - dy, finalCol, finalLabel + '+', xmOut + 6, cy - dy);
    pulse(xV2, cy, xmOut, cy + dy, fl, finalCol);
    pulse(xV2, cy, xmOut, cy - dy, fl, finalCol);

    if (V === 2) {
      if (isT) {
        // t-channel: electron line crosses
        fermion(xeIn, cy - dy, xV2, cy + dy, cE, '', 0, 0);
        fermion(xeIn, cy + dy, xV1, cy, cE, '', 0, 0);
        photon(xV1, xV2, cy, cG);
        ctx.fillStyle = cG; ctx.font = fontString(canvas, 'caption', 'mono');
        ctx.fillText('gamma* (q^2 = t, spacelike)', (xV1 + xV2) / 2 - 58, cy - 16);
      } else {
        // s-channel: standard diagram
        photon(xV1, xV2, cy, cG);
        ctx.fillStyle = cG; ctx.font = fontString(canvas, 'caption', 'mono');
        ctx.fillText('gamma*  (q^2 = s)', (xV1 + xV2) / 2 - 44, cy - 16);
      }
    } else {
      // photon -> fermion loop (vacuum polarisation) -> photon
      const xa = xV1 + (xV2 - xV1) * 0.30, xb = xV1 + (xV2 - xV1) * 0.70;
      photon(xV1, xa, cy, cG); photon(xb, xV2, cy, cG);
      const lcx = (xa + xb) / 2, lr = (xb - xa) / 2;
      ctx.strokeStyle = cL; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(lcx, cy, lr, 22, 0, 0, 2 * Math.PI); ctx.stroke();
      const la = fl * 2 * Math.PI;
      ctx.fillStyle = cL;
      ctx.beginPath(); ctx.arc(lcx + lr * Math.cos(la), cy + 22 * Math.sin(la), 3.5, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(lcx + lr * Math.cos(la + Math.PI), cy + 22 * Math.sin(la + Math.PI), 3.5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = cL; ctx.font = fontString(canvas, 'caption', 'mono');
      ctx.fillText('e+e- loop', lcx - 26, cy - 30);
      for (const xv of [xa, xb]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xv, cy, 3, 0, 2 * Math.PI); ctx.fill(); }
    }

    // vertices
    for (const xv of [xV1, xV2]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xv, cy, 4, 0, 2 * Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('vertex (factor e)', xV1 - 30, cy + 26);
  }

  // amplitude / |M|^2 alpha-power tags
  const aE = amplitudeAlphaExponent(V), mP = matrixElementAlphaPower(V);
  ctx.font = fontString(canvas, 'body', 'mono'); ctx.fillStyle = '#9be8b0';
  ctx.fillText(`M  ~  alpha^${aE}` + (V === 2 ? '  (= alpha)' : ''), x + 16, y + h - 36);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`|M|^2 ~ sigma ~ alpha^${mP}` + (V === 4 ? '   (suppressed by alpha^2 ~ 1/137^2 vs tree)' : '   (tree level)'), x + 16, y + h - 14);
}

function drawDiagramChannel(ch, x, cy, w, V, fl, cE, cMU, cG, cL) {
  const xeIn = x + 16, xV1 = x + w * 0.35, xV2 = x + w * 0.65, xmOut = x + w - 16;
  const dy = 48;
  const isT = ch === 't';

  if (isT) {
    // t-channel: electrons cross
    fermion(xeIn, cy + dy, xV1, cy, cE, 'e-', xeIn - 20, cy + dy + 4);
    fermion(xeIn, cy - dy, xV2, cy + dy, cE, 'e+', xeIn - 20, cy - dy);
    fermion(xV1, cy, xmOut, cy - dy, cE, 'e+', xmOut - 4, cy - dy - 2);
    fermion(xV2, cy + dy, xmOut, cy + dy, cE, 'e-', xmOut - 4, cy + dy - 2);
    pulse(xeIn, cy + dy, xV1, cy, fl, cE);
    pulse(xV1, cy, xmOut, cy - dy, fl, cE);
  } else {
    // s-channel: standard
    fermion(xeIn, cy + dy, xV1, cy, cE, 'e-', xeIn - 20, cy + dy + 4);
    fermion(xeIn, cy - dy, xV1, cy, cE, 'e+', xeIn - 20, cy - dy);
    fermion(xV2, cy, xmOut, cy + dy, cMU, 'mu-', xmOut - 4, cy + dy + 4);
    fermion(xV2, cy, xmOut, cy - dy, cMU, 'mu+', xmOut - 4, cy - dy);
    pulse(xeIn, cy + dy, xV1, cy, fl, cE);
    pulse(xV2, cy, xmOut, cy + dy, fl, cMU);
  }
  photon(xV1, xV2, cy, cG);
  for (const xv of [xV1, xV2]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xv, cy, 3, 0, 2 * Math.PI); ctx.fill(); }
  ctx.fillStyle = 'rgba(200,200,200,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText(isT ? 't-ch' : 's-ch', x + w / 2 - 16, cy + 60);
}

function drawSigma(x, y, w, h) {
  panel(x, y, w, h, 'total cross section  sigma(sqrt s)  [nb], log-log');
  const px = x + 52, py = y + 26, pw = w - 68, ph = h - 70;
  const logMax = Math.ceil(Math.log10(SIGMAX)), decades = 5, logMin = logMax - decades;
  const lxMin = Math.log10(SMIN), lxMax = Math.log10(SMAX);
  const X = (E) => px + pw * (Math.log10(E) - lxMin) / (lxMax - lxMin);
  const Y = (sig) => {
    const l = Math.log10(Math.max(sig, 1e-30));
    return py + ph * (1 - Math.max(0, Math.min(1, (l - logMin) / (logMax - logMin))));
  };
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (let d = 0; d <= decades; d += 1) {
    const yy = py + ph * d / decades; ctx.fillText(`1e${(logMax - d).toFixed(0)}`, x + 6, yy + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(px, yy); ctx.lineTo(px + pw, yy); ctx.stroke();
  }
  for (const E of [0.3, 1, 3, 10]) {
    const xx = X(E);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(xx, py); ctx.lineTo(xx, py + ph); ctx.stroke();
    ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText(`${E}`, xx - 6, py + ph + 15);
  }
  ctx.fillText('sqrt s (GeV)', px + pw / 2 - 30, py + ph + 30);
  // threshold marker (sigma -> 0 there: it leaves the bottom of the frame)
  ctx.strokeStyle = 'rgba(255,120,120,0.5)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(X(SMIN), py); ctx.lineTo(X(SMIN), py + ph); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,150,150,0.85)';
  ctx.fillText(`2 m_mu = ${(2 * MMU).toFixed(3)} GeV: sigma -> 0`, X(SMIN) + 4, py + ph - 8);
  // curve
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < CURVE.e.length; i += 1) {
    const xx = X(CURVE.e[i]), yy = Y(CURVE.sig[i]);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // operating point
  const E0 = Math.max(SMIN, Math.min(SMAX, sqrtS())), s0 = sigmaNb(E0);
  ctx.fillStyle = '#6fb4ff';
  ctx.beginPath(); ctx.arc(X(E0), Y(s0), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(160,200,255,0.95)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`sqrt s = ${E0.toFixed(2)} GeV,  sigma = ${s0 < 1e-3 ? s0.toExponential(2) : s0.toFixed(2)} nb`, px + 8, py + 14);
  ctx.fillStyle = 'rgba(155,232,176,0.8)';
  ctx.fillText('threshold turn-on, peak, then straight 1/s line', px + 8, py + 28);
}

function drawAux(x, y, w, h) {
  panel(x, y, w, h, 'Mandelstam s, t, u and dsigma/dOmega');
  const E = sqrtS(), c = cosTh();
  const m = mandelstam(E, c);
  const sum = m.s + m.t + m.u, ok = Math.abs(sum - m.sumMasses) < 1e-9 * Math.max(1, m.s);
  // Mandelstam bars
  const bx = x + 20, by = y + 38, bw = w - 130;
  const scale = (bw / 2) / Math.max(m.s, Math.abs(m.t), Math.abs(m.u), 1e-6);
  const x0 = bx + bw / 2;
  ctx.font = fontString(canvas, 'caption', 'mono');
  [['s', m.s, '#6fb4ff'], ['t', m.t, '#ff9d6f'], ['u', m.u, '#9be8b0']].forEach((r, i) => {
    const yy = by + i * 24;
    ctx.fillStyle = 'rgba(200,210,235,0.7)'; ctx.fillText(r[0], bx - 14, yy + 4);
    ctx.fillStyle = r[2];
    const ww = r[1] * scale;
    ctx.fillRect(Math.min(x0, x0 + ww), yy - 6, Math.max(1, Math.abs(ww)), 12);
    ctx.fillStyle = 'rgba(230,236,250,0.9)';
    ctx.fillText(`${r[1].toExponential(2)}`, x0 + bw / 2 + 8, yy + 4);
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.moveTo(x0, by - 12); ctx.lineTo(x0, by + 3 * 24 - 6); ctx.stroke();
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = ok ? '#8fe39b' : '#ff8f8f';
  ctx.fillText(`s+t+u = ${sum.toExponential(3)} = 2m_e^2+2m_mu^2  ${ok ? 'OK' : 'X'}`, bx - 4, by + 3 * 24 + 10);
  // angular distribution
  const gx = x + 52, gy = y + 132, gw = w - 70, gh = h - 132 - 24;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(gx, gy, gw, gh);
  let dmax = 1e-30;
  for (let i = 0; i <= 180; i += 1) dmax = Math.max(dmax, dSigmadOmega(E, Math.cos(i * Math.PI / 180)));
  ctx.strokeStyle = '#c08bff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 180; i += 1) {
    const th = i * Math.PI / 180, d = dSigmadOmega(E, Math.cos(th));
    const xx = gx + gw * i / 180, yy = gy + gh * (1 - (dmax > 0 ? d / dmax : 0));
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // current theta marker
  const xt = gx + gw * st.thDeg / 180;
  ctx.strokeStyle = 'rgba(111,180,255,0.7)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xt, gy); ctx.lineTo(xt, gy + gh); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('0', gx - 4, gy + gh + 14); ctx.fillText('90', gx + gw / 2 - 8, gy + gh + 14);
  ctx.fillText('180', gx + gw - 16, gy + gh + 14);
  ctx.fillText('dsigma/dOmega vs theta -- symmetric about 90 deg', gx + 8, gy + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawDiagram(20, 20, W - 40, 252);
  const topY = 286, ph = H - topY - 14, half = (W - 52) / 2;
  drawSigma(20, topY, half, ph);
  drawAux(20 + half + 12, topY, half, ph);
  const E = sqrtS(), s0 = sigmaNb(E);
  const m = mandelstam(E, cosTh()), sum = m.s + m.t + m.u;
  rE.textContent = `${E.toFixed(2)} GeV`;
  rS.textContent = E <= 2 * MMU ? '0 (below threshold)' : `${s0 < 1e-3 ? s0.toExponential(2) : s0.toFixed(3)} nb`;
  rM.textContent = `alpha^${matrixElementAlphaPower(nVert())}`;
  rStu.textContent = Math.abs(sum - m.sumMasses) < 1e-9 * Math.max(1, m.s) ? 'OK (= sum m^2)' : 'X';
}

const LIVE = 1 / 240;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) st.ph -= 1; }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() {
  vE.textContent = sqrtS().toFixed(2);
  vT.textContent = String(st.thDeg);
  vCh.textContent = st.channel === 'both' ? 'both' : (st.channel === 't-channel' ? 't' : 's');
}
slE.addEventListener('input', () => { st.eRaw = parseInt(slE.value, 10); syncLabels(); draw(); });
slT.addEventListener('input', () => { st.thDeg = parseInt(slT.value, 10); syncLabels(); draw(); });
selO.addEventListener('change', () => { st.order = selO.value; draw(); });
selCh.addEventListener('change', () => { st.channel = selCh.value; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.eRaw = DEF_E; st.thDeg = DEF_T; st.order = DEF_O; st.channel = DEF_CH; st.ph = 0; st.running = true;
  slE.value = String(DEF_E); slT.value = String(DEF_T); selO.value = DEF_O; selCh.value = DEF_CH;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { e: String(st.eRaw), th: String(st.thDeg), order: st.order, channel: st.channel }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.e) { st.eRaw = parseInt(s.e, 10); slE.value = s.e; }
  if (s.th) { st.thDeg = parseInt(s.th, 10); slT.value = s.th; }
  if (s.order) { st.order = s.order; selO.value = s.order; }
  if (s.channel) { st.channel = s.channel; selCh.value = s.channel; }
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f; draw();
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


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const s = sqrtS();
  const cost = cosTh();
  const sig = sigmaNb(s);
  const man = mandelstam(s, cost);
  return {
    fields: [
      { key: 'sqrt-s', label: 'sqrt(s) (GeV)', value: s, format: 'float' },
      { key: 'scattering-angle', label: 'Theta (deg)', value: st.thDeg, format: 'float' },
      { key: 'order', label: 'Order', value: st.order },
      { key: 'cross-section', label: 'sigma (nb)', value: sig.toExponential(2) }
    ]
  };
};
window.playground.getInvariants = function () {
  const s = sqrtS();
  const cost = cosTh();
  const man = mandelstam(s, cost);
  const sumMasses = man.s + man.t + man.u - man.sumMasses;
  return [
    {
      key: 'mandelstam-relation',
      label: 's + t + u = sum_m^2',
      value: 'OK',
      status: Math.abs(sumMasses) < 1e-6 ? 'pass' : 'drift'
    }
  ];
};
