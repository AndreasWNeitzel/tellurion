// Torque-free rigid body hero. A Phong-shaded inertia ellipsoid tumbles
// under Euler's equations (RK4 + unit quaternion, headless sim.js). The
// three principal axes are colour-coded arrows, the body-frame angular
// velocity omega is white, the space-fixed angular momentum L is gold.
// The omega tip leaves the polhode (painted on the body) and the
// herpolhode (fixed in space, in the invariable plane perpendicular to
// L). Spinning about the intermediate axis triggers the Dzhanibekov
// flip. Shared orbit camera: drag to orbit, wheel to zoom.
// Reference: Landau and Lifshitz, Mechanics (3rd ed.), Sec. 37.

import { createRigidBody, step, energy, angularMomentumSq, bodyToWorld, angularMomentumWorld } from './sim.js';
import { createGL2 } from '../../../shared/js/engine-gl/context.js';
import { compileProgram } from '../../../shared/js/engine-gl/shader.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['E (rot)', '|L|', 'ω·ê₂', 't', 'state'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const DEF = { I: [2.0, 3.0, 4.0], omega: [0.25, 4.2, 0.18] };
let body = createRigidBody({ I: DEF.I.slice(), omega: DEF.omega.slice() });
let running = true, acc = 0;
const polhode = [];          // body-frame omega tip history
const herpolhode = [];       // world-frame omega tip history
const TRAIL = 900;

function buildSlider(label, min, max, stp, value, onInput, fmt = v => v.toFixed(1)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { val.textContent = fmt(+inp.value); onInput(parseFloat(inp.value)); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function reseed(I, omega) {
  body = createRigidBody({ I: I.slice(), omega: omega.slice() });
  polhode.length = 0; herpolhode.length = 0; acc = 0;
}
const sI1 = buildSlider('I₁', 1, 6, 0.1, DEF.I[0], v => { DEF.I[0] = v; reseed(DEF.I, body.w); });
const sI3 = buildSlider('I₃', 1, 6, 0.1, DEF.I[2], v => { DEF.I[2] = v; reseed(DEF.I, body.w); });
const btnRow = document.createElement('div'); btnRow.className = 'row buttons';
const bDz = document.createElement('button'); bDz.type = 'button'; bDz.textContent = 'Dzhanibekov';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
btnRow.appendChild(bDz); btnRow.appendChild(bReset); btnRow.appendChild(bPause);
controlsEl.appendChild(btnRow);
bDz.addEventListener('click', () => { DEF.I = [1.0, 2.0, 4.0]; sI1.value = '1'; sI3.value = '4'; reseed(DEF.I, [0.04, 5.0, 0.04]); });
bReset.addEventListener('click', () => { DEF.I = [2.0, 3.0, 4.0]; sI1.value = '2'; sI3.value = '4'; reseed(DEF.I, DEF.omega.slice()); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

const gl = createGL2(canvas);
// Zoomed out enough that the whole Poinsot construction (the
// invariable-plane disk r=3.4, the polhode on the body and the
// herpolhode in the plane) is fully framed; 5.8 cropped the curve.
const camera = createOrbitCamera(canvas, { target: [0, 0, 0], radius: 9.6, minRadius: 3, maxRadius: 20, azimuthDeg: 38, elevationDeg: 24, fovDeg: 45 });
window.__camera = camera;

// UV sphere (unit), reused and scaled to the inertia ellipsoid.
function makeSphere(nu, nv) {
  const pos = [], idx = [];
  for (let v = 0; v <= nv; v += 1) {
    const th = v / nv * Math.PI;
    for (let u = 0; u <= nu; u += 1) {
      const ph = u / nu * 2 * Math.PI;
      pos.push(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    }
  }
  for (let v = 0; v < nv; v += 1) for (let u = 0; u < nu; u += 1) {
    const a = v * (nu + 1) + u, b = a + nu + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  return { pos: new Float32Array(pos), idx: new Uint16Array(idx) };
}
const sph = makeSphere(48, 32);
const sphVBO = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sphVBO); gl.bufferData(gl.ARRAY_BUFFER, sph.pos, gl.STATIC_DRAW);
const sphIBO = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphIBO); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sph.idx, gl.STATIC_DRAW);

const meshProg = compileProgram(gl, `#version 300 es
in vec3 p; uniform mat4 uMVP, uModel; out vec3 vN; out vec3 vW; out vec3 vP;
void main(){ vN = normalize(mat3(uModel)*normalize(p)); vec4 w=uModel*vec4(p,1.); vW=w.xyz; vP=normalize(p); gl_Position=uMVP*vec4(p,1.); }`,
`#version 300 es
precision highp float; in vec3 vN; in vec3 vW; in vec3 vP; out vec4 o; uniform vec3 uEye;
const float PI=3.14159265;
void main(){
  vec3 N=normalize(vN); vec3 Ld=normalize(vec3(0.5,0.8,0.4));
  vec3 V=normalize(uEye-vW); vec3 Hh=normalize(Ld+V);
  float d=max(dot(N,Ld),0.0); float s=pow(max(dot(N,Hh),0.0),48.0);
  float rim=pow(1.0-max(dot(N,V),0.0),3.0);
  // Body-fixed lat/long grid so the tumble is readable on the body
  // itself; principal axes get coloured face tints so orientation
  // and the Dzhanibekov flip are unmistakable.
  float lat=asin(clamp(vP.y,-1.,1.));        // -pi/2..pi/2  (axis 2)
  float lon=atan(vP.z,vP.x);                  // -pi..pi
  float gA=abs(fract(lat*(7.0/PI)+0.5)-0.5);
  float gB=abs(fract(lon*(9.0/PI)+0.5)-0.5);
  float gw=fwidth(lat)*3.5+0.012;
  float gline=1.0-smoothstep(0.0,gw,min(gA,gB));
  vec3 tint=vec3(0.40,0.52,0.78);
  tint=mix(tint,vec3(0.86,0.40,0.40),smoothstep(0.55,0.95,abs(vP.x))*0.6); // axis 1 (red)
  tint=mix(tint,vec3(0.45,0.85,0.55),smoothstep(0.80,0.99,abs(vP.y))*0.7); // axis 2 (green, spin)
  vec3 base=tint*(0.55+0.45*abs(N.y));
  vec3 col=base*(0.22+0.85*d)+vec3(0.9,0.93,1.0)*s*0.6;
  col+=vec3(0.30,0.45,0.70)*rim*0.5;                       // depth-cueing rim glow
  col=mix(col,vec3(0.94,0.98,1.0),gline*0.85);             // bright grid lines
  col=col/(col+vec3(1.0)); col=pow(col,vec3(0.4545));
  o=vec4(col,1.0);
}`);
const lineProg = compileProgram(gl, `#version 300 es
in vec3 p; uniform mat4 uMVP; void main(){ gl_Position=uMVP*vec4(p,1.); gl_PointSize=4.0; }`,
`#version 300 es
precision highp float; uniform vec4 uColor; out vec4 o; void main(){ o=uColor; }`);
const dynVBO = gl.createBuffer();

function mul(a, b) { const c = new Float32Array(16); for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) { let s = 0; for (let k = 0; k < 4; k += 1) s += a[k * 4 + j] * b[i * 4 + k]; c[i * 4 + j] = s; } return c; }
function quatScaleMat(q, sx, sy, sz) {
  const [w, x, y, z] = q;
  return new Float32Array([
    (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + w * z)) * sx, (2 * (x * z - w * y)) * sx, 0,
    (2 * (x * y - w * z)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + w * x)) * sy, 0,
    (2 * (x * z + w * y)) * sz, (2 * (y * z - w * x)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    0, 0, 0, 1,
  ]);
}
function semiAxes(I) {
  // Uniform ellipsoid: I1 ~ b^2+c^2, I2 ~ a^2+c^2, I3 ~ a^2+b^2.
  const [I1, I2, I3] = I;
  const a2 = 0.5 * (-I1 + I2 + I3), b2 = 0.5 * (I1 - I2 + I3), c2 = 0.5 * (I1 + I2 - I3);
  const s = 2.0;
  return [Math.sqrt(Math.max(0.25, a2)) * s * 0.6, Math.sqrt(Math.max(0.25, b2)) * s * 0.6, Math.sqrt(Math.max(0.25, c2)) * s * 0.6];
}

function drawLines(mvp, verts, color, mode) {
  gl.useProgram(lineProg);
  gl.bindBuffer(gl.ARRAY_BUFFER, dynVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
  const lp = gl.getAttribLocation(lineProg, 'p');
  gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uMVP'), false, mvp);
  gl.uniform4fv(gl.getUniformLocation(lineProg, 'uColor'), color);
  gl.drawArrays(mode, 0, verts.length / 3);
}

function invariablePlane(Lw, R, segs) {
  // Disk in the invariable plane (perpendicular to the conserved
  // space-fixed L). The herpolhode rolls in exactly this plane, so
  // drawing it makes the Poinsot construction legible.
  const Ln = Math.hypot(...Lw) || 1;
  const n = [Lw[0] / Ln, Lw[1] / Ln, Lw[2] / Ln];
  const a = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let t = [a[1] * n[2] - a[2] * n[1], a[2] * n[0] - a[0] * n[2], a[0] * n[1] - a[1] * n[0]];
  const tn = Math.hypot(...t) || 1; t = [t[0] / tn, t[1] / tn, t[2] / tn];
  const b = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
  const fan = [0, 0, 0], rim = [];
  for (let i = 0; i <= segs; i += 1) {
    const a2 = i / segs * 2 * Math.PI, c = Math.cos(a2) * R, s = Math.sin(a2) * R;
    const x = t[0] * c + b[0] * s, y = t[1] * c + b[1] * s, z = t[2] * c + b[2] * s;
    fan.push(x, y, z); rim.push(x, y, z);
  }
  return { fan, rim };
}

function render() {
  const W = canvas.width, H = canvas.height;
  gl.viewport(0, 0, W, H);
  gl.clearColor(0.02, 0.02, 0.03, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  const view = camera.viewMatrix();
  const proj = camera.projMatrix(W / H);
  const vp = mul(proj, view);
  const sa = semiAxes(body.I);
  const model = quatScaleMat(body.q, sa[0], sa[1], sa[2]);
  const mvp = mul(vp, model);
  const eye = camera.eyePosition();

  // Ellipsoid.
  gl.useProgram(meshProg);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphVBO);
  const mp = gl.getAttribLocation(meshProg, 'p');
  gl.enableVertexAttribArray(mp); gl.vertexAttribPointer(mp, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphIBO);
  gl.uniformMatrix4fv(gl.getUniformLocation(meshProg, 'uMVP'), false, mvp);
  gl.uniformMatrix4fv(gl.getUniformLocation(meshProg, 'uModel'), false, model);
  gl.uniform3fv(gl.getUniformLocation(meshProg, 'uEye'), eye);
  gl.drawElements(gl.TRIANGLES, sph.idx.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.DEPTH_TEST);
  // Principal axes (body frame -> world via quaternion), length 1.3x semi-axis.
  const cols = [[1, 0.36, 0.36, 1], [0.36, 1, 0.45, 1], [0.42, 0.6, 1, 1]];
  const eBody = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let i = 0; i < 3; i += 1) {
    const dir = bodyToWorld(body.q, eBody[i]);
    const L = sa[i] + 1.0;
    drawLines(vp, [0, 0, 0, dir[0] * L, dir[1] * L, dir[2] * L], cols[i], gl.LINES);
  }
  // omega (white) and L (gold), world frame, bounded to ~3.0 units so
  // the arrows stay framed regardless of |w|, |L|.
  const wW = bodyToWorld(body.q, body.w);
  const wn = Math.hypot(...wW) || 1; const ws = 3.0 / wn;
  drawLines(vp, [0, 0, 0, wW[0] * ws, wW[1] * ws, wW[2] * ws], [1, 1, 1, 1], gl.LINES);
  drawLines(vp, [wW[0] * ws, wW[1] * ws, wW[2] * ws], [1, 1, 1, 1], gl.POINTS);
  const Lw = angularMomentumWorld(body); const Ln = Math.hypot(...Lw) || 1; const ls = 3.4 / Ln;
  drawLines(vp, [0, 0, 0, Lw[0] * ls, Lw[1] * ls, Lw[2] * ls], [1, 0.82, 0.3, 1], gl.LINES);
  drawLines(vp, [Lw[0] * ls, Lw[1] * ls, Lw[2] * ls], [1, 0.82, 0.3, 1], gl.POINTS);

  // Invariable plane, perpendicular to the conserved space-fixed L:
  // a faint translucent disk with a bright rim. The herpolhode rolls
  // exactly in this plane (Poinsot's construction).
  const ip = invariablePlane(Lw, 3.4, 96);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawLines(vp, ip.fan, [0.34, 0.42, 0.78, 0.12], gl.TRIANGLE_FAN);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  drawLines(vp, ip.rim, [0.62, 0.72, 1.0, 0.45], gl.LINE_STRIP);

  // Glowing polhode (on the body) / herpolhode (in the plane):
  // additive strip plus beaded points.
  if (polhode.length > 6) {
    drawLines(mvp, polhode, [0.5, 1, 0.85, 0.95], gl.LINE_STRIP);
    drawLines(mvp, polhode, [0.7, 1, 0.95, 0.6], gl.POINTS);
  }
  if (herpolhode.length > 6) {
    drawLines(vp, herpolhode, [1, 0.58, 0.96, 0.9], gl.LINE_STRIP);
    drawLines(vp, herpolhode, [1, 0.74, 1, 0.55], gl.POINTS);
  }
  gl.disable(gl.BLEND);

  const E = energy(body), Lm = Math.sqrt(angularMomentumSq(body));
  const dz = body.I[0] < body.I[1] && body.I[1] < body.I[2] && Math.abs(body.w[1]) > Math.abs(body.w[0]) + Math.abs(body.w[2]);
  rEls['E (rot)'].textContent = E.toFixed(4);
  rEls['|L|'].textContent = Lm.toFixed(4);
  rEls['ω·ê₂'].textContent = body.w[1].toFixed(3);
  rEls.t.textContent = body.t.toFixed(2);
  rEls.state.textContent = dz ? 'intermediate' : 'stable';
}

const PHYS_DT = 0.005;
function advance(dtSim) {
  let n = Math.min(2000, Math.round(dtSim / PHYS_DT));
  for (let i = 0; i < n; i += 1) {
    step(body, PHYS_DT);
    const wn = Math.hypot(...body.w) || 1;
    polhode.push(body.w[0] / wn * 1.04, body.w[1] / wn * 1.04, body.w[2] / wn * 1.04);
    const ww = bodyToWorld(body.q, body.w);
    herpolhode.push(ww[0] / wn * 3.4, ww[1] / wn * 3.4, ww[2] / wn * 3.4);
    while (polhode.length > TRAIL * 3) polhode.splice(0, 3);
    while (herpolhode.length > TRAIL * 3) herpolhode.splice(0, 3);
  }
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) advance(dt * 1.6);
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) advance(2.0 + CAPTURE_FRAC * 9.0);
  render();
  if (DETERMINISTIC) {
    let warm = 0;
    const settle = () => { render(); warm += 1; if (warm < 28) { requestAnimationFrame(settle); return; } window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); };
    requestAnimationFrame(settle);
  }
}

window.__physicsCheck = async () => {
  const b = createRigidBody({ I: [2, 3, 4], omega: [1.1, 0.7, 0.3] });
  const E0 = energy(b), L0 = angularMomentumSq(b);
  for (let i = 0; i < 10000; i += 1) step(b, 0.005);
  const dE = Math.abs(energy(b) - E0) / E0, dL = Math.abs(angularMomentumSq(b) - L0) / L0;
  if (dE > 1e-4 || dL > 1e-4) return { name: 'rigid-body conservation', pass: false, msg: `dE=${dE.toExponential(2)} dL=${dL.toExponential(2)}` };
  return { name: 'E and |L|^2 conserved', pass: true, msg: `dE=${dE.toExponential(2)}, d|L|^2=${dL.toExponential(2)} over 1e4 steps` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
