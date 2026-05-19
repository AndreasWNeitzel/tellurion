// Radioactive decay chain. Three panels share the canvas: the nucleus
// (left) emitting an alpha or beta cluster between decay steps, a
// Geiger-Nuttall curve (top right) showing log10 t_1/2 vs Z_d / sqrt(Q)
// for every alpha step in the series with the current step highlighted,
// and a Segre chart (bottom right) with the (N, Z) path from the parent
// to stable lead. Decay arithmetic and Q values from ./sim.js. The HUD
// panel is positioned BELOW the canvas so it does not occlude the
// chart. Reference: Krane, Introductory Nuclear Physics, Ch. 3, 6-8.

import { chainOf, qValue, qAlpha, log10HalfLifeAlpha, ELEMENT } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['series', 'isotope', 'decay mode', 'Q (MeV)', 'log10 t1/2 (s)', 'step'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { series: 'uranium', step: 0, auto: 1, t: 0, running: 1, speed: 1.0 };
let path = chainOf(st.series);
function rebuild() { path = chainOf(st.series); st.step = Math.min(st.step, path.length - 1); }
rebuild();

// 3D close-packed nucleon positions inside a ball of radius R = r0 A^{1/3}
// (the textbook nuclear radius scaling). We generate a hexagonal-close-
// packed lattice cropped to the ball, take the first A sites by distance
// from the center, then jitter slightly to break the crystalline look
// and mark Z of them at random as protons (real nuclei have protons and
// neutrons co-located, not segregated, so the marking is uniform). A
// deterministic mulberry32 seed keeps the layout stable across frames.
//
// Returns:
//   pts3D: Float64Array (A, 3) coordinates (in lattice units, r0 = 1)
//   isProton: Uint8Array length A
function mulberry32(seed) {
  let x = seed >>> 0;
  return () => { x |= 0; x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function nucleonLayout3D(Z, N) {
  const A = Z + N;
  const Rball = Math.cbrt(A) * 1.05;     // ~r0 A^{1/3} with a 5 % loose pack
  // hcp lattice generators
  const a = 1.0;                          // lattice spacing
  const sites = [];
  // Build hcp by stacking close-packed (A B A B ...) hexagonal layers.
  const nL = Math.ceil(Rball + 1);
  for (let layer = -nL; layer <= nL; layer += 1) {
    const dz = layer * a * Math.sqrt(2 / 3);
    const xoff = (layer & 1) ? a * 0.5 : 0;
    const yoff = (layer & 1) ? a * Math.sqrt(3) / 6 : 0;
    for (let i = -nL; i <= nL; i += 1) {
      for (let j = -nL; j <= nL; j += 1) {
        const dx = i * a + (j & 1) * a * 0.5 + xoff;
        const dy = j * a * Math.sqrt(3) / 2 + yoff;
        if (dx * dx + dy * dy + dz * dz <= Rball * Rball) sites.push([dx, dy, dz]);
      }
    }
  }
  // Sort by distance from origin; keep the first A
  sites.sort((p, q) => (p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) - (q[0] * q[0] + q[1] * q[1] + q[2] * q[2]));
  const pts = sites.slice(0, A);
  // Jitter (deterministic)
  const rnd = mulberry32(A * 0x9E3779B1 ^ Z);
  for (const p of pts) {
    p[0] += (rnd() - 0.5) * 0.12;
    p[1] += (rnd() - 0.5) * 0.12;
    p[2] += (rnd() - 0.5) * 0.12;
  }
  // Assign protons uniformly at random (sample Z indices without
  // replacement using a Fisher-Yates partial shuffle).
  const idxs = pts.map((_, i) => i);
  const rnd2 = mulberry32(A ^ (Z * 0x85EBCA77));
  for (let i = 0; i < Z; i += 1) {
    const j = i + Math.floor(rnd2() * (idxs.length - i));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const isProton = new Uint8Array(A);
  for (let k = 0; k < Z; k += 1) isProton[idxs[k]] = 1;
  return { pts, isProton };
}

// Layout (px) on the 1200x680 canvas.
const NX = 50, NY = 60, NW = 580, NH = 580;       // nucleus area (left)
// Nucleus drawn at left-third of the panel so the alpha cluster has
// horizontal room to eject to the right while staying in-frame.
const cx = NX + NW * 0.36, cy = NY + NH / 2 - 22;
const GX = NX + NW + 28, GY = NY, GW = 510, GH = 280;          // Geiger-Nuttall (top right)
const CHX = NX + NW + 28, CHY = NY + 296, CHW = 510, CHH = 284; // Segre chart (bottom right)

function isoLabel(node) { return `${ELEMENT[node.Z] || 'Z' + node.Z}-${node.Z + node.N}`; }

function drawNucleus(node, prev, phase) {
  // Outer frame.
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(NX, NY, NW, NH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(NX, NY, NW, NH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('nucleus (red protons, blue neutrons; 3D, slow rotation)', NX + 10, NY + 18);

  const A = node.Z + node.N;
  const lay = nucleonLayout3D(node.Z, node.N);
  const Rball = Math.cbrt(A) * 1.05;
  // Lock the on-screen visual radius (px) so the ball looks the same
  // size across A, leaving consistent room for the alpha to eject to
  // the right.
  const visualR = 132;
  const scale = visualR / Rball;
  const protRad = scale * 0.55;
  const isAlpha = prev && node.mode === 'alpha';
  const isBeta = prev && (node.mode === 'beta-minus' || node.mode === 'beta-plus');

  // Slow auto-rotation about the world y-axis; light comes from the
  // top-left front. Camera looks along -z so the +x axis is screen-right,
  // +y is screen-up, +z is toward the viewer.
  const tNow = Date.now() / 1000;
  const yawDeg = (tNow * 8) % 360;
  const yaw = yawDeg * Math.PI / 180;
  const cy0 = Math.cos(yaw), sy0 = Math.sin(yaw);
  const pitch = -0.18, cp = Math.cos(pitch), sp = Math.sin(pitch);

  // Light direction (unit vec) in screen space
  const Lx = -0.45, Ly = -0.6, Lz = 0.65;
  const Ln = Math.hypot(Lx, Ly, Lz);
  const lx = Lx / Ln, ly = Ly / Ln, lz = Lz / Ln;

  // Project + depth-sort
  const pulse = 1 + 0.03 * Math.sin(2 * Math.PI * (tNow / 2.0));
  const proj = new Array(A);
  for (let i = 0; i < A; i += 1) {
    const x0 = lay.pts[i][0], y0 = lay.pts[i][1], z0 = lay.pts[i][2];
    // yaw about y
    const x1 = cy0 * x0 + sy0 * z0;
    const z1 = -sy0 * x0 + cy0 * z0;
    const y1 = y0;
    // pitch about x
    const y2 = cp * y1 - sp * z1;
    const z2 = sp * y1 + cp * z1;
    // perspective (mild)
    const camZ = 14;
    const w = camZ / (camZ - z2);
    proj[i] = { i, x: x1 * w, y: y2 * w, z: z2, sz: w };
  }
  proj.sort((a, b) => a.z - b.z);
  for (const p of proj) {
    const isP = lay.isProton[p.i];
    const px0 = cx + p.x * scale * pulse;
    const py0 = cy + p.y * scale * pulse;
    const r = protRad * p.sz;
    // Lighting: surface normal at the (sphere face nearest camera)
    // approximates the lighting direction times the nucleon's local
    // unit normal; we just shade by Lambert dot.
    // For a sphere imposter, the brightest part is at offset (lx, ly)
    // from center, scaled by r * 0.6.
    const ndx = -lx * r * 0.45;
    const ndy = -ly * r * 0.45;
    // base color
    const baseR = isP ? 235 : 92;
    const baseG = isP ? 96 : 152;
    const baseB = isP ? 92 : 230;
    // ambient + diffuse
    const amb = 0.28;
    // diffuse intensity along the light direction (mock; assume camera-facing hemisphere)
    const diff = Math.max(0, 0.72);
    ctx.fillStyle = `rgb(${Math.round(baseR * amb)},${Math.round(baseG * amb)},${Math.round(baseB * amb)})`;
    ctx.beginPath(); ctx.arc(px0, py0, r, 0, 6.2832); ctx.fill();
    // radial gradient for the lit face
    const g = ctx.createRadialGradient(px0 + ndx, py0 + ndy, r * 0.1, px0, py0, r * 1.05);
    g.addColorStop(0, `rgba(${Math.min(255, Math.round(baseR + 30))},${Math.min(255, Math.round(baseG + 30))},${Math.min(255, Math.round(baseB + 30))},1.0)`);
    g.addColorStop(0.55, `rgba(${baseR},${baseG},${baseB},0.95)`);
    g.addColorStop(1, `rgba(${Math.round(baseR * 0.35)},${Math.round(baseG * 0.35)},${Math.round(baseB * 0.35)},0.95)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px0, py0, r, 0, 6.2832); ctx.fill();
    // specular highlight (small white spot)
    ctx.fillStyle = `rgba(255,255,255,${0.55 * diff})`;
    ctx.beginPath(); ctx.arc(px0 + ndx, py0 + ndy, r * 0.22, 0, 6.2832); ctx.fill();
  }

  // Decay animation: alpha cluster shoots from the +x rim of the
  // daughter. Phase ramps 0 -> 1 over the lifetime of the step; the
  // cluster starts at the rim, accelerates outward, then fades.
  if (isAlpha) {
    // Rim is the visual radius of the 3D ball (visualR = Rball * scale).
    // Use Rball directly (not sqrt(A)) for the 3D layout.
    const rim = Rball * scale * pulse;
    const xStart = cx + rim + protRad * 2.4;       // just outside the ball
    const xMax = NX + NW - 100;                    // leave room for label
    // Eject over the first 75 % of the cycle, then idle/fade.
    const ej = Math.min(1, phase / 0.75);
    const xR = xStart + ej * (xMax - xStart);
    const yR = cy;
    // Fade window: invisible at phase < 0.05 (the new step has just
    // appeared; pause before ejection), full opacity 0.05..0.85,
    // fade out 0.85..1.
    let fade = 1;
    if (phase < 0.05) fade = phase / 0.05;
    else if (phase > 0.85) fade = Math.max(0, 1 - (phase - 0.85) / 0.15);
    ctx.globalAlpha = fade;
    // He-4: 2 protons + 2 neutrons, compact cluster
    const dxs = [[-protRad, -protRad, true], [protRad, -protRad, true], [-protRad, protRad, false], [protRad, protRad, false]];
    for (const [dx, dy, p] of dxs) {
      ctx.fillStyle = p ? 'rgba(255,116,108,1.0)' : 'rgba(118,170,255,1.0)';
      ctx.beginPath(); ctx.arc(xR + dx, yR + dy, protRad * 1.0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = p ? 'rgba(255,200,196,0.6)' : 'rgba(196,220,255,0.5)';
      ctx.beginPath(); ctx.arc(xR + dx - protRad * 0.4, yR + dy - protRad * 0.4, protRad * 0.32, 0, 6.2832); ctx.fill();
    }
    // motion trail behind the cluster (only if it has actually moved).
    if (ej > 0.05) {
      ctx.globalAlpha = fade * 0.35;
      for (let k = 1; k <= 6; k += 1) {
        const tx = xR - k * (protRad * 1.6);
        if (tx < xStart) continue;
        ctx.fillStyle = 'rgba(255,220,140,0.55)';
        ctx.beginPath(); ctx.arc(tx, cy, protRad * 0.7, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,224,140,0.92)'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('alpha (He-4)', xR - protRad * 1.5, yR - protRad * 2.4);
    ctx.fillStyle = 'rgba(200,210,225,0.8)'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText('2 protons + 2 neutrons', xR - protRad * 1.5, yR + protRad * 3.0);
  } else if (isBeta) {
    // Beta- or beta+: emit an electron (or positron) and anti-neutrino
    // (or neutrino) from the surface of the 3D nucleus toward the
    // upper-right of the panel. The arrows pierce the rim and trail
    // out, two divergent paths (the lepton, the neutrino), with text
    // labels noting the n -> p (or p -> n) conversion.
    const xMax = NX + NW - 90;
    const yEmit = cy - 20;
    const xStart = cx + Rball * scale * pulse + 6;
    const t = Math.min(1, Math.max(0, (phase - 0.15) / 0.70));
    const xE = xStart + t * (xMax - xStart);
    const fade = Math.min(1, 1 - Math.max(0, (phase - 0.85) / 0.15));
    if (phase > 0.15) {
      ctx.globalAlpha = fade;
      // Electron arrow (cyan)
      ctx.strokeStyle = 'rgba(127,214,255,0.85)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(xStart, yEmit); ctx.lineTo(xE, yEmit - (xE - xStart) * 0.18); ctx.stroke();
      ctx.fillStyle = 'rgba(127,214,255,0.95)';
      ctx.beginPath(); ctx.arc(xE, yEmit - (xE - xStart) * 0.18, 5, 0, 6.2832); ctx.fill();
      // Anti-neutrino arrow (faint magenta)
      ctx.strokeStyle = 'rgba(255,160,220,0.7)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(xStart, yEmit + 6); ctx.lineTo(xE * 0.95, yEmit + 6 + (xE - xStart) * 0.18); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,160,220,0.95)';
      ctx.beginPath(); ctx.arc(xE * 0.95, yEmit + 6 + (xE - xStart) * 0.18, 3.5, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(200,210,225,0.95)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
      ctx.fillText(node.mode === 'beta-minus' ? 'electron e-' : 'positron e+', xE + 8, yEmit - (xE - xStart) * 0.18 + 4);
      ctx.fillStyle = 'rgba(255,180,225,0.9)'; ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(node.mode === 'beta-minus' ? 'anti-neutrino' : 'neutrino', xE * 0.95 + 8, yEmit + 6 + (xE - xStart) * 0.18 + 4);
      ctx.fillStyle = 'rgba(255,224,140,0.9)'; ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(node.mode === 'beta-minus' ? 'n -> p inside the nucleus' : 'p -> n inside the nucleus', NX + 14, NY + NH - 56);
    }
    ctx.lineWidth = 1;
  }

  // Isotope label
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8ecf4'; ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillText(isoLabel(node), cx, NY + NH - 36);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`Z = ${node.Z} protons, N = ${node.N} neutrons, A = ${node.Z + node.N}`, cx, NY + NH - 16);
  ctx.textAlign = 'left';
}

// Geiger-Nuttall plot: x = Z_d / sqrt(Q), y = log10 t_1/2 (s), one
// marker per alpha step in the series. The current step (if alpha) is
// highlighted.
function drawGeigerNuttall() {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(GX, GY, GW, GH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(GX, GY, GW, GH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('Geiger-Nuttall: log10 t1/2 = 1.72 Zd / sqrt(Q) - 53.6', GX + 10, GY + 18);

  const pts = [];
  for (let k = 1; k < path.length; k += 1) {
    const n = path[k];
    if (n.mode !== 'alpha') continue;
    const par = path[k - 1];
    const Q = qAlpha(par.Z, par.N);
    if (Q <= 0) continue;
    const x = (par.Z - 2) / Math.sqrt(Q);                // Z_d / sqrt(Q)
    const y = log10HalfLifeAlpha(par.Z, par.N);
    pts.push({ x, y, k, label: isoLabel(par) });
  }
  if (pts.length === 0) { ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.fillText('(no alpha steps in this series)', GX + 16, GY + 60); return; }

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xMin = Math.min(...xs) - 1, xMax = Math.max(...xs) + 1;
  const yMin = Math.min(...ys) - 1, yMax = Math.max(...ys) + 1;
  const pad = 38, padR = 20, padT = 32, padB = 28;
  const px = (x) => GX + pad + (x - xMin) / (xMax - xMin) * (GW - pad - padR);
  const py = (y) => GY + padT + (1 - (y - yMin) / (yMax - yMin)) * (GH - padT - padB);

  // Theory line: y = 1.72 * x - 53.6 (Gamow-tunnel-derived fit).
  ctx.strokeStyle = 'rgba(160,180,210,0.55)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(px(xMin), py(1.72 * xMin - 53.6));
  ctx.lineTo(px(xMax), py(1.72 * xMax - 53.6));
  ctx.stroke();
  ctx.lineWidth = 1;

  // Half-life thresholds (one second, one year, age of universe ~ 13.8 Gyr -> 4.35e17 s)
  for (const [yv, lab] of [[0, '1 s'], [7.5, '1 yr'], [17.5, 'age of universe']]) {
    if (yv < yMin || yv > yMax) continue;
    ctx.strokeStyle = 'rgba(120,128,140,0.35)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(px(xMin), py(yv)); ctx.lineTo(px(xMax), py(yv)); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = 'rgba(160,170,185,0.7)'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'right';
    ctx.fillText(lab, px(xMax) - 4, py(yv) - 3);
  }
  ctx.textAlign = 'left';

  // Data points
  for (const p of pts) {
    const X = px(p.x), Y = py(p.y);
    const cur = p.k === st.step;
    ctx.fillStyle = cur ? '#ffd24a' : 'rgba(255,116,108,0.78)';
    ctx.beginPath(); ctx.arc(X, Y, cur ? 7 : 5, 0, 6.2832); ctx.fill();
    if (cur) {
      ctx.fillStyle = '#e8ecf4'; ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(p.label, X + 10, Y - 8);
    }
  }
  // Axis labels
  ctx.fillStyle = '#9aa0ad'; ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.fillText('Z_d / sqrt(Q_MeV)', GX + GW / 2, GY + GH - 8);
  ctx.save(); ctx.translate(GX + 14, GY + GH / 2 + 8); ctx.rotate(-Math.PI / 2);
  ctx.fillText('log10 t_1/2 (s)', 0, 0); ctx.restore();
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(160,180,210,0.85)'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('the steep slope is the Gamow tunnelling barrier', GX + 14, GY + GH - 24);
}

function drawSegre() {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(CHX, CHY, CHW, CHH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(CHX, CHY, CHW, CHH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('Segre chart: N (right) vs Z (up); zigzag = alpha down-left, beta up-left', CHX + 10, CHY + 18);

  let nMin = 1e9, nMax = -1e9, zMin = 1e9, zMax = -1e9;
  for (const p of path) { nMin = Math.min(nMin, p.N); nMax = Math.max(nMax, p.N); zMin = Math.min(zMin, p.Z); zMax = Math.max(zMax, p.Z); }
  nMin -= 1; nMax += 1; zMin -= 1; zMax += 1;
  const pad = 36, padT = 30;
  const gx = (N) => CHX + pad + (N - nMin) / (nMax - nMin) * (CHW - pad - 18);
  const gy = (Z) => CHY + CHH - pad + (zMin - Z) / (zMax - zMin) * (CHH - pad - padT);

  // grid
  ctx.strokeStyle = 'rgba(120,128,140,0.15)';
  for (let N = nMin; N <= nMax; N += 2) {
    ctx.beginPath(); ctx.moveTo(gx(N), gy(zMin)); ctx.lineTo(gx(N), gy(zMax)); ctx.stroke();
  }
  for (let Z = zMin; Z <= zMax; Z += 2) {
    ctx.beginPath(); ctx.moveTo(gx(nMin), gy(Z)); ctx.lineTo(gx(nMax), gy(Z)); ctx.stroke();
  }

  // path (full faint, completed bright)
  ctx.strokeStyle = 'rgba(180,190,210,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  path.forEach((p, k) => { const X = gx(p.N), Y = gy(p.Z); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
  ctx.stroke();
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let k = 0; k <= st.step; k += 1) { const X = gx(path[k].N), Y = gy(path[k].Z); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();
  ctx.lineWidth = 1;

  // Nodes
  for (let k = 0; k < path.length; k += 1) {
    const p = path[k], done = k <= st.step;
    ctx.fillStyle = k === st.step ? '#ffd24a' : done ? 'rgba(255,212,74,0.55)' : 'rgba(140,150,170,0.55)';
    ctx.beginPath(); ctx.arc(gx(p.N), gy(p.Z), k === st.step ? 7 : 4, 0, 6.2832); ctx.fill();
  }

  const last = path[path.length - 1];
  ctx.fillStyle = '#7fd6ff'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`stable ${isoLabel(last)}`, gx(last.N), gy(last.Z) + 18);
  ctx.fillStyle = '#ffd24a'; ctx.fillText(isoLabel(path[0]), gx(path[0].N), gy(path[0].Z) - 12);

  // Axis labels
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.fillText('neutron number N', CHX + CHW / 2, CHY + CHH - 6);
  ctx.save(); ctx.translate(CHX + 14, CHY + CHH / 2 + 6); ctx.rotate(-Math.PI / 2);
  ctx.fillText('proton number Z', 0, 0); ctx.restore();
  ctx.textAlign = 'left';
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  st.step = Math.max(0, Math.min(st.step, path.length - 1));
  const node = path[st.step];
  const prev = st.step > 0 ? path[st.step - 1] : null;
  const phase = (st.t % 3.0) / 3.0;       // 0..1 across the step's display window

  drawNucleus(node, prev, phase);
  drawGeigerNuttall();
  drawSegre();

  // HUD readout updates
  const m = node.mode === 'start' ? '-' : node.mode;
  const Q = node.mode === 'start' ? 0 : qValue(node.mode, prev.Z, prev.N);
  rEls['series'].textContent = st.series === 'uranium' ? 'U-238 (4n+2)' : 'Th-232 (4n)';
  rEls['isotope'].textContent = isoLabel(node);
  rEls['decay mode'].textContent = m;
  rEls['Q (MeV)'].textContent = node.mode === 'start' ? '-' : Q.toFixed(2);
  rEls['log10 t1/2 (s)'].textContent = node.mode === 'alpha' ? log10HalfLifeAlpha(prev.Z, prev.N).toFixed(1) : (node.mode === 'beta-minus' ? '(beta, model-free)' : '-');
  rEls['step'].textContent = `${st.step} / ${path.length - 1}`;
}

// controls
function buildSelect(label, opts, key, after) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  sel.value = String(st[key]);
  sel.addEventListener('change', () => { st[key] = isNaN(+sel.value) ? sel.value : +sel.value; if (after) after(); render(); });
  const sp = document.createElement('span'); sp.className = 'value';
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); st.auto = 0; render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}

const sSer = buildSelect('decay series', [['uranium', 'U-238 series'], ['thorium', 'Th-232 series']], 'series', () => { st.step = 0; st.t = 0; rebuild(); cStep.inp.max = String(path.length - 1); cStep.inp.value = '0'; cStep.val.textContent = '0'; });
const cStep = buildSlider('decay step', 0, path.length - 1, 1, st.step, 'step', v => v.toFixed(0));
buildSlider('speed', 0.25, 3.0, 0.05, st.speed, 'speed', v => `${v.toFixed(2)}x`);

const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bAuto = document.createElement('button'); bAuto.type = 'button'; bAuto.textContent = 'Auto';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bAuto); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { series: 'uranium', step: 0, auto: 1, t: 0, running: 1, speed: 1.0 });
  sSer.value = 'uranium'; rebuild(); cStep.inp.max = String(path.length - 1); cStep.inp.value = '0'; cStep.val.textContent = '0';
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bAuto.addEventListener('click', () => { st.auto = 1; });
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) {
    st.t += dr * st.speed;
    if (st.auto && st.t >= 3.0) {
      st.t = 0;
      st.step = st.step + 1 > path.length - 1 ? 0 : st.step + 1;
      cStep.inp.value = String(st.step); cStep.val.textContent = String(st.step);
    }
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { st.auto = 0; st.step = Math.round(CAPTURE_FRAC * (path.length - 1)); st.t = 0.6; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const u = chainOf('uranium'), th = chainOf('thorium');
  const ue = u[u.length - 1], te = th[th.length - 1];
  if (ue.Z !== 82 || ue.N !== 124) return { name: 'U-238 endpoint', pass: false, msg: `${ue.Z},${ue.N}` };
  if (te.Z !== 82 || te.N !== 126) return { name: 'Th-232 endpoint', pass: false, msg: `${te.Z},${te.N}` };
  return { name: 'series end on stable lead (Pb-206, Pb-208)', pass: true, msg: 'Z,N arithmetic exact' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
