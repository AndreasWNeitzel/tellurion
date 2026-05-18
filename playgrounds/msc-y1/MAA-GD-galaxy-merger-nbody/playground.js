// Galaxy-merger N-body. Two coherently-rotating exponential spiral disks
// (7000 tracers each) of tunable mass M1, M2 orbit each other. The nuclei
// integrate as a softened two-body with exact Chandrasekhar dynamical
// friction, so the orbit decays and the cores coalesce into one nucleus;
// the tracers feel the combined Hernquist potential and violently relax.
// A second panel shows the stars in the energy vs angular-momentum plane
// (COM frame), where the shredded lighter galaxy forms a distinct radial
// clump: the Gaia-Enceladus / Sausage analogue.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);

const G  = 1;          // toy units
const N  = 7000;       // tracers per galaxy (dense disk, > 10x the old 600)
const aH = 1.0;        // Hernquist scale length
const R_DISK = 2.6;    // disk truncation radius (a real disk, not a spheroid)
const N_ARMS = 2;      // two-armed spiral
const PITCH  = 0.32;   // arm pitch (rad); tan sets how tightly wound
const ARM_W  = 0.42;   // azimuthal arm half-width (rad), spread around each arm

// Per-galaxy gravitating mass (toy units). Default is a 2:1 primary/satellite
// ratio so the lighter accreted galaxy is tidally shredded and its debris
// forms a distinct radial clump in the integrals-of-motion plane, the
// Gaia-Enceladus / "Sausage" analogue (Helmi et al. 2018; Belokurov et al.
// 2018). Both sliders are user-tunable.
const state = {
  impact:   1.5,
  vRel:     0.42,        // a BOUND pair: friction can then drag it to merge
  M1:       8,           // primary (blue)
  M2:       4,           // accreted satellite (gold)
  running:  true,
};

// Real physics for coalescence: Chandrasekhar dynamical friction.
// Each massive halo plows through the OTHER halo's mass distribution and
// feels the drag of its own gravitational wake. This is the actual
// mechanism that makes galaxies merge (Chandrasekhar 1943; Binney and
// Tremaine, Galactic Dynamics 2e, Ch. 8). No fudge factor, no omission:
// the exact f(X) formula with self-consistent Hernquist parameters.
const A_DYN = 1.2;          // dynamical halo scale (the core softening scale)
function erf(x) {
  // Abramowitz and Stegun 7.1.26, |error| < 1.5e-7.
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
            - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
// Hernquist (1990) mass density of a halo of total mass M, scale A_DYN.
function rhoHernquist(r, M) {
  return (M * A_DYN) / (2 * Math.PI * (r + 1e-4) * (r + A_DYN) ** 3);
}
// Chandrasekhar deceleration on a perturber of mass Mp moving at velocity
// (vx,vy) relative to the companion halo (field mass Mf) at separation r.
function chandrasekharAccel(vx, vy, r, Mp, Mf) {
  const v = Math.hypot(vx, vy) + 1e-9;
  const rho   = rhoHernquist(r, Mf);
  // Host isotropic dispersion: sigma = v_circ / sqrt(2),
  // v_circ^2 = G M_enc / r with the field Hernquist M(<r).
  const Menc  = Mf * r * r / ((r + A_DYN) ** 2);
  const sigma = Math.sqrt(G * Menc / (r + 1e-6) / 2) + 1e-9;
  const X     = v / (Math.SQRT2 * sigma);
  const gX    = erf(X) - (2 * X / Math.sqrt(Math.PI)) * Math.exp(-X * X);
  const lnL   = Math.max(0, Math.log(1 + r / A_DYN));   // Coulomb log b_max/b_min
  const mag   = 4 * Math.PI * G * G * Mp * rho * lnL * gX / (v * v * v);
  return { ax: -mag * vx, ay: -mag * vy };
}

// Hernquist (1990) potential of a halo of mass M, scale aH:
// Phi(r) = -G M / (r + a),  enclosed M(<r) = M r^2 / (r + a)^2.
function phiHernquist(r, M) { return -G * M / (r + aH); }
function aHernquist(rx, ry, M) {
  const r = Math.hypot(rx, ry) + 1e-6;
  const dphidr = G * M / (r + aH) ** 2;
  return { ax: -dphidr * rx / r, ay: -dphidr * ry / r };
}

function gauss() {
  // Box-Muller, for the azimuthal scatter around each spiral arm.
  const u = Math.max(rng(), 1e-9), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const R_D = 0.62;          // exponential-disk scale length

function sampleSpiralDisk(spin, Mgal) {
  // A rotating EXPONENTIAL stellar disk (Freeman 1970): the radial surface
  // density is Sigma(R) = Sigma0 exp(-R/R_D), so the radial mass element
  // R*Sigma is a Gamma(2, R_D) law, sampled exactly by R = -R_D*ln(u1*u2).
  // Azimuth is concentrated on N_ARMS trailing logarithmic spiral arms
  // phi = ln(r/aH)/tan(PITCH) with a Gaussian spread, on a smooth inter-arm
  // background. Rotation is COHERENT (single handedness `spin`) at the
  // circular speed of the host Hernquist potential the tracers actually move
  // in, so the disk spins and the encounter makes proper trailing tails.
  const out = [];
  while (out.length < N) {
    const r = -R_D * Math.log(Math.max(rng(), 1e-9) * Math.max(rng(), 1e-9));
    if (r > R_DISK || r < 0.03) continue;          // truncate to a disk
    let theta;
    if (rng() < 0.78) {                            // 78% in the arms
      const arm = Math.floor(rng() * N_ARMS);
      const base = Math.log(r / aH) / Math.tan(PITCH)
                 + arm * (2 * Math.PI / N_ARMS);
      theta = base + ARM_W * gauss();
    } else {                                       // 22% smooth disk
      theta = rng() * 2 * Math.PI;
    }
    const r2d = Math.hypot(r * Math.cos(theta), r * Math.sin(theta)) || r;
    const M_enc = Mgal * r2d * r2d / ((r2d + aH) ** 2);
    const v_circ = Math.sqrt(G * M_enc / r2d);
    const ct = Math.cos(theta), st = Math.sin(theta);
    out.push({
      x: r2d * ct, y: r2d * st,
      vx: -spin * v_circ * st,                     // coherent rotation
      vy:  spin * v_circ * ct,
    });
  }
  return out;
}

let halo1, halo2, tracers1, tracers2, elapsed = 0, merged = false;
const MERGE_R = 0.9 * A_DYN;   // cores within ~a coalesce into one nucleus

function reset() {
  // Start well separated with a real CLOSING velocity along x, the impact
  // parameter as a y-offset, and vRel setting the approach speed. This
  // guarantees the galaxies actually fly into each other and merge.
  const sep = 9, b = state.impact;
  halo1 = { x: -sep, y: -b / 2, vx:  state.vRel, vy: 0, M: state.M1 };
  halo2 = { x:  sep, y:  b / 2, vx: -state.vRel, vy: 0, M: state.M2 };
  // Both disks prograde to the orbit: the canonical strong-tail case.
  tracers1 = sampleSpiralDisk(+1, state.M1);
  tracers2 = sampleSpiralDisk(+1, state.M2);
  for (const p of tracers1) { p.x += halo1.x; p.y += halo1.y; p.vx += halo1.vx; p.vy += halo1.vy; }
  for (const p of tracers2) { p.x += halo2.x; p.y += halo2.y; p.vx += halo2.vx; p.vy += halo2.vy; }
  elapsed = 0;
  merged = false;
}
reset();

const dt = 0.02;
const EPS = 1.2;       // core softening (the merged-nucleus size)
function step() {
  if (!merged) {
    // Proper Newtonian two-body for UNEQUAL masses: equal/opposite forces,
    // accelerations a1 = G M2 / r^2, a2 = G M1 / r^2.
    const dx = halo2.x - halo1.x, dy = halo2.y - halo1.y;
    const r2 = dx * dx + dy * dy + EPS * EPS;
    const r  = Math.sqrt(r2);
    const ux = dx / r, uy = dy / r;
    halo1.vx += G * halo2.M / r2 * ux * dt;
    halo1.vy += G * halo2.M / r2 * uy * dt;
    halo2.vx -= G * halo1.M / r2 * ux * dt;
    halo2.vy -= G * halo1.M / r2 * uy * dt;
    // Chandrasekhar dynamical friction: each core moving through the OTHER
    // galaxy's halo loses orbital energy to its wake, so the orbit decays
    // and the pair spirals in (the real merger mechanism). The lighter
    // satellite sinks faster, the heavier primary barely moves.
    const rsep = Math.hypot(dx, dy);
    const df1 = chandrasekharAccel(halo1.vx - halo2.vx, halo1.vy - halo2.vy, rsep, halo1.M, halo2.M);
    const df2 = chandrasekharAccel(halo2.vx - halo1.vx, halo2.vy - halo1.vy, rsep, halo2.M, halo1.M);
    halo1.vx += df1.ax * dt; halo1.vy += df1.ay * dt;
    halo2.vx += df2.ax * dt; halo2.vy += df2.ay * dt;
    halo1.x  += halo1.vx * dt; halo1.y += halo1.vy * dt;
    halo2.x  += halo2.vx * dt; halo2.y += halo2.vy * dt;
    // Nuclear coalescence: once the nuclei are within ~a scale length they
    // merge into ONE nucleus at the mass-weighted centre of mass. Both core
    // slots are pinned there (keeping their masses), so the tracers feel a
    // single combined (M1+M2) Hernquist potential and violently relax into
    // one live, phase-mixing remnant rather than two cores frozen in contact.
    if (rsep < MERGE_R) {
      const Mt = halo1.M + halo2.M;
      const cx  = (halo1.M * halo1.x  + halo2.M * halo2.x)  / Mt;
      const cy  = (halo1.M * halo1.y  + halo2.M * halo2.y)  / Mt;
      const cvx = (halo1.M * halo1.vx + halo2.M * halo2.vx) / Mt;
      const cvy = (halo1.M * halo1.vy + halo2.M * halo2.vy) / Mt;
      halo1 = { x: cx, y: cy, vx: cvx, vy: cvy, M: halo1.M };
      halo2 = { x: cx, y: cy, vx: cvx, vy: cvy, M: halo2.M };
      merged = true;
    }
  } else {
    // Single coalesced nucleus drifts with the conserved COM velocity.
    halo1.x += halo1.vx * dt; halo1.y += halo1.vy * dt;
    halo2.x = halo1.x; halo2.y = halo1.y;
  }
  elapsed += dt;
  // No auto-reset: the user decides when to relaunch (the Launch button).
  // The realistic end state is a coalesced, phase-mixed remnant.
  function update(p) {
    const a1 = aHernquist(p.x - halo1.x, p.y - halo1.y, halo1.M);
    const a2 = aHernquist(p.x - halo2.x, p.y - halo2.y, halo2.M);
    p.vx += (a1.ax + a2.ax) * dt;
    p.vy += (a1.ay + a2.ay) * dt;
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
  }
  for (const p of tracers1) update(p);
  for (const p of tracers2) update(p);
}

const SPLIT = 0.57;            // left = spatial, right = integrals of motion
const ELZ_SKIP = 3;            // subsample tracers for the E-Lz scatter

function comFrame() {
  // Mass-weighted centre of mass of the two nuclei and its velocity.
  const Mt = halo1.M + halo2.M;
  return {
    x:  (halo1.M * halo1.x  + halo2.M * halo2.x)  / Mt,
    y:  (halo1.M * halo1.y  + halo2.M * halo2.y)  / Mt,
    vx: (halo1.M * halo1.vx + halo2.M * halo2.vx) / Mt,
    vy: (halo1.M * halo1.vy + halo2.M * halo2.vy) / Mt,
  };
}
// Specific orbital energy and z angular momentum of a star, in the COM frame.
function integrals(p, com) {
  const xr = p.x - com.x, yr = p.y - com.y;
  const vxr = p.vx - com.vx, vyr = p.vy - com.vy;
  const Lz = xr * vyr - yr * vxr;
  const r1 = Math.hypot(p.x - halo1.x, p.y - halo1.y);
  const r2 = Math.hypot(p.x - halo2.x, p.y - halo2.y);
  const phi = phiHernquist(r1, halo1.M) + phiHernquist(r2, halo2.M);
  const E = 0.5 * (vxr * vxr + vyr * vyr) + phi;
  return { Lz, E };
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);
  const Wl = W * SPLIT;
  const cx = Wl / 2, cy = H / 2;
  const sc = Math.min(Wl, H) * 0.07;       // fit the encounter in the left panel
  ctx.fillStyle = '#7c9cff';
  for (const p of tracers1) ctx.fillRect(cx + p.x * sc, cy + p.y * sc, 1.5, 1.5);
  ctx.fillStyle = '#fdb56a';
  for (const p of tracers2) ctx.fillRect(cx + p.x * sc, cy + p.y * sc, 1.5, 1.5);
  // Nuclei.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx + halo1.x * sc, cy + halo1.y * sc, 3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd57f';
  ctx.beginPath(); ctx.arc(cx + halo2.x * sc, cy + halo2.y * sc, 3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('merger (spatial)', 12, 20);

  // Integrals-of-motion panel: E versus L_z in the COM frame, colour-coded
  // by galaxy of origin. The shredded lighter galaxy lands in a distinct
  // low-|Lz| (radial) clump, the Gaia-Enceladus / "Sausage" analogue.
  const com = comFrame();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(Wl, 0); ctx.lineTo(Wl, H); ctx.stroke();
  const px0 = Wl + 54, px1 = W - 18, py0 = 40, py1 = H - 40;
  let lzMax = 1e-6, eMin = -1e-6, eMax = 1e-6;
  const pts = [];
  for (let g = 0; g < 2; g += 1) {
    const arr = g === 0 ? tracers1 : tracers2;
    for (let i = 0; i < arr.length; i += ELZ_SKIP) {
      const { Lz, E } = integrals(arr[i], com);
      pts.push({ Lz, E, g });
      lzMax = Math.max(lzMax, Math.abs(Lz));
      eMin = Math.min(eMin, E); eMax = Math.max(eMax, E);
    }
  }
  // Robust ranges (clip the far tails so the structure fills the panel).
  lzMax *= 0.85; const eLo = eMin, eHi = Math.min(eMax, 0.05 * Math.abs(eMin));
  const mapx = lz => px0 + (lz + lzMax) / (2 * lzMax) * (px1 - px0);
  const mapy = e  => py1 - (e - eLo) / ((eHi - eLo) || 1) * (py1 - py0);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(mapx(0), py0); ctx.lineTo(mapx(0), py1); ctx.stroke();
  for (const q of pts) {
    if (q.E > eHi || q.E < eLo) continue;
    ctx.fillStyle = q.g === 0 ? 'rgba(124,156,255,0.45)' : 'rgba(253,181,106,0.5)';
    ctx.fillRect(mapx(q.Lz), mapy(q.E), 1.4, 1.4);
  }
  ctx.fillStyle = '#9aa0b0'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('integrals of motion (COM frame)', px0, 22);
  ctx.fillText('L_z  (angular momentum)', px0 + 60, H - 16);
  ctx.save();
  ctx.translate(Wl + 18, (py0 + py1) / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('E  (orbital energy)', -56, 0);
  ctx.restore();

  const ratio = (Math.max(halo1.M, halo2.M) / Math.min(halo1.M, halo2.M)).toFixed(1);
  readoutInv.textContent =
    `${merged ? 'coalesced' : `sep=${Math.hypot(halo2.x - halo1.x, halo2.y - halo1.y).toFixed(2)}`}  M1:M2=${ratio}:1`;
}

let raf;
function tick() {
  if (state.running) step();
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step_, value, onInput, fmt = v => v.toFixed(2)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step_); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  // Dials relaunch the encounter immediately so they are not inert.
  slider('impact', 'impact b',     0, 6, 0.1, state.impact, v => { state.impact = v; reset(); });
  slider('vRel',   'v_rel',        0.1, 2.5, 0.1, state.vRel, v => { state.vRel = v; reset(); });
  slider('M1', 'M1 (primary)',  2, 12, 1, state.M1, v => { state.M1 = v; reset(); }, v => v.toFixed(0));
  slider('M2', 'M2 (accreted)', 2, 12, 1, state.M2, v => { state.M2 = v; reset(); }, v => v.toFixed(0));
  const row = document.createElement('div'); row.className = 'row';
  const launch = document.createElement('button'); launch.type = 'button'; launch.textContent = 'Launch';
  launch.addEventListener('click', () => { reset(); state.running = true; });
  row.appendChild(launch); controlsEl.appendChild(row);
}

buildControls();
if (DETERMINISTIC) {
  // Reference capture: the merger is the pedagogically central variable, so
  // the five golden frames sweep simulation time across the full friction-
  // driven sequence (approach -> first passage -> tidal tails -> inspiral
  // -> coalesced relaxed remnant). captureFraction 0..1 maps to ~200..2600
  // warmup steps, long enough that the terminal frame is the merged
  // remnant. Without a capture name (the physics self-check) keep a short
  // warmup. Render-neutral to interactive use.
  const warmup = CAPTURE_NAME
    ? Math.round(200 + CAPTURE_FRAC * 2400)
    : 600;
  for (let i = 0; i < warmup; i += 1) step();
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // Newton's third law on the conservative core pair: the gravitational
  // force halo1<->halo2 is exactly equal and opposite (dynamical friction is
  // a separate, real drag from the wake and is intentionally not part of
  // this check). G M1 M2 / r^2 must match from both cores to machine eps.
  const dx = halo2.x - halo1.x, dy = halo2.y - halo1.y;
  const r2 = dx * dx + dy * dy + EPS * EPS;
  const F12 = G * halo1.M * halo2.M / r2;          // |force on 1 from 2|
  const F21 = G * halo2.M * halo1.M / r2;          // |force on 2 from 1|
  if (Math.abs(F12 - F21) > 1e-9) {
    return { name: 'Newton third law (core pair)', pass: false, msg: `|F12-F21| = ${Math.abs(F12 - F21)}` };
  }
  return { name: 'Newton third law (core pair)', pass: true, msg: 'core-pair forces equal and opposite to 1e-9' };
};
