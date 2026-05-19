// WebGL2 cockpit star field for the relativistic starship. The ship
// flies along +z at speed beta. Every star's apparent direction,
// colour and brightness is the exact Lorentz transform of its rest
// frame (the math is shared/js/engine/special-relativity-cpu.js); the
// renderer only projects and draws. Stars are additive GL points; the
// corridor marker rings are aberrated point-by-point so they really
// distort; a forward "headlight" glow brightens with beta. Drawn
// straight to the default framebuffer with in-shader ACES (the
// RGBA16F FBO path is not color-renderable in headless GL).

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import {
  gamma, aberrateCos, dopplerFactor, beamingFactor, wavelengthRGB,
} from '../engine/special-relativity-cpu.js';

const VS_PTS = `#version 300 es
layout(location=0) in vec2 aPos;     // clip-space xy
layout(location=1) in float aSize;   // point size (px)
layout(location=2) in vec3 aRGB;
out vec3 vRGB;
void main(){ vRGB = aRGB; gl_PointSize = aSize; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS_PTS = `#version 300 es
precision highp float;
in vec3 vRGB;
out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (r2 > 1.0) discard;
  float a = exp(-3.0 * r2);                 // soft round star
  o = vec4(aces(vRGB * a * 1.4), a);
}`;

const VS_GLOW = `#version 300 es
layout(location=0) in vec2 a;
out vec2 uv;
void main(){ uv = a; gl_Position = vec4(a, 0.0, 1.0); }`;

const FS_GLOW = `#version 300 es
precision highp float;
in vec2 uv;
uniform float uBeta;
uniform float uAspect;
out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 p = vec2(uv.x * uAspect, uv.y);
  float r = length(p);
  // forward headlight: a bluish core that tightens and brightens
  // toward beta -> 1 (relativistic beaming of the whole sky forward).
  float k = mix(0.9, 0.12, smoothstep(0.0, 1.0, uBeta));
  float core = exp(-r * r / (k * k)) * (0.05 + 1.4 * pow(uBeta, 3.0));
  vec3 c = vec3(0.5, 0.7, 1.0) * core;
  o = vec4(aces(c), 1.0);
}`;

function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function setupStarshipGL(canvas, nStars = 2600) {
  const gl = createGL2(canvas);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);            // additive
  const W = canvas.width, H = canvas.height;
  const aspect = W / H;

  const ptsProg = compileProgram(gl, VS_PTS, FS_PTS);
  const glowProg = compileProgram(gl, VS_GLOW, FS_GLOW);

  // Static rest-frame star catalogue: unit direction + rest wavelength
  // + intrinsic brightness. Deterministic (seeded).
  const rnd = mulberry(0xC0FFEE);
  const dir = new Float32Array(nStars * 3);
  const lam0 = new Float32Array(nStars);
  const bri0 = new Float32Array(nStars);
  for (let i = 0; i < nStars; i += 1) {
    // uniform on the sphere
    const u = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), s = Math.sqrt(1 - u * u);
    dir[i * 3] = s * Math.cos(ph); dir[i * 3 + 1] = s * Math.sin(ph); dir[i * 3 + 2] = u;
    lam0[i] = 380 + 320 * rnd();                 // 380..700 nm
    bri0[i] = 0.35 + 0.65 * rnd() * rnd();
  }

  // Dynamic per-star attributes (clip xy, size, rgb).
  const attr = new Float32Array(nStars * 6);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, attr.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 8);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 12);
  gl.bindVertexArray(null);

  // Corridor marker rings: each a circle of perimeter samples whose
  // directions are aberrated like the stars, so the ring distorts.
  const RING_SEG = 48, RING_N = 7;
  const ringAttr = new Float32Array(RING_N * (RING_SEG + 1) * 6);
  const rvao = gl.createVertexArray();
  gl.bindVertexArray(rvao);
  const rvbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rvbo);
  gl.bufferData(gl.ARRAY_BUFFER, ringAttr.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 8);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 12);
  gl.bindVertexArray(null);

  const glowVAO = gl.createVertexArray();
  gl.bindVertexArray(glowVAO);
  const gvbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gvbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const FOV = 1.05;                               // ~60 deg half-angle scale
  // Project an apparent direction (already aberrated) that points
  // mostly along +z into clip space; yaw/pitch are the cockpit look.
  function project(dx, dy, dz, yaw, pitch) {
    // rotate the look: simple yaw about y then pitch about x
    const cy = Math.cos(-yaw), sy = Math.sin(-yaw);
    let x = cy * dx + sy * dz;
    let z = -sy * dx + cy * dz;
    const cp = Math.cos(-pitch), sp = Math.sin(-pitch);
    let y = cp * dy - sp * z;
    z = sp * dy + cp * z;
    if (z <= 0.02) return null;                   // behind the cockpit
    return [(x / z) / FOV / aspect, (y / z) / FOV, z];
  }

  let nVis = 0;
  function update(beta, yaw, pitch) {
    const g = gamma(beta);
    let w = 0;
    for (let i = 0; i < nStars; i += 1) {
      const lx = dir[i * 3], ly = dir[i * 3 + 1], lz = dir[i * 3 + 2];
      const cosLab = lz;                          // angle from +z motion
      const cosShip = aberrateCos(beta, cosLab);
      // rebuild the aberrated unit direction: keep azimuth, new polar
      const sinShip = Math.sqrt(Math.max(0, 1 - cosShip * cosShip));
      const rxy = Math.hypot(lx, ly) || 1e-6;
      const ax = lx / rxy * sinShip, ay = ly / rxy * sinShip, az = cosShip;
      const pr = project(ax, ay, az, yaw, pitch);
      if (!pr) continue;
      const D = dopplerFactor(beta, cosShip);
      const rgb = wavelengthRGB(lam0[i] / D);     // observed wavelength
      const beam = beamingFactor(beta, cosShip);
      const b = Math.min(6, bri0[i] * Math.cbrt(beam));
      attr[w] = pr[0]; attr[w + 1] = pr[1];
      attr[w + 2] = Math.max(1.5, Math.min(7, 2.0 * Math.sqrt(b)));
      attr[w + 3] = rgb[0] * b; attr[w + 4] = rgb[1] * b; attr[w + 5] = rgb[2] * b;
      w += 6;
    }
    nVis = w / 6;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, attr.subarray(0, w));

    // Rings at proper z = 4,7,10,... contracted by 1/gamma in the lab.
    let rw = 0; rseg.length = 0;
    for (let r = 0; r < RING_N; r += 1) {
      const zc = (4 + 3.2 * r) / g;               // length contraction
      const rad = 1.7;
      let segStart = rw / 6, cnt = 0;
      for (let k = 0; k <= RING_SEG; k += 1) {
        const a = (k / RING_SEG) * 2 * Math.PI;
        let vx = rad * Math.cos(a), vy = rad * Math.sin(a), vz = zc;
        const L = Math.hypot(vx, vy, vz);
        vx /= L; vy /= L; vz /= L;
        const cs = aberrateCos(beta, vz);
        const sn = Math.sqrt(Math.max(0, 1 - cs * cs));
        const rxy = Math.hypot(vx, vy) || 1e-6;
        const pr = project(vx / rxy * sn, vy / rxy * sn, cs, yaw, pitch);
        if (!pr) { if (cnt > 1) rseg.push([segStart, cnt]); segStart = rw / 6 + 1; cnt = 0; }
        else {
          const tint = 0.5 + 0.5 * (r / RING_N);
          ringAttr[rw] = pr[0]; ringAttr[rw + 1] = pr[1]; ringAttr[rw + 2] = 1;
          ringAttr[rw + 3] = 0.25 * tint; ringAttr[rw + 4] = 0.85 * tint; ringAttr[rw + 5] = 1.0 * tint;
          rw += 6; cnt += 1;
        }
      }
      if (cnt > 1) rseg.push([segStart, cnt]);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, rvbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, ringAttr.subarray(0, rw));
  }
  const rseg = [];

  function render(beta) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.01, 0.012, 0.02, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // forward headlight glow (additive)
    gl.useProgram(glowProg);
    gl.uniform1f(gl.getUniformLocation(glowProg, 'uBeta'), beta);
    gl.uniform1f(gl.getUniformLocation(glowProg, 'uAspect'), aspect);
    gl.bindVertexArray(glowVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // corridor rings
    gl.useProgram(ptsProg);
    gl.bindVertexArray(rvao);
    for (const [start, cnt] of rseg) gl.drawArrays(gl.LINE_STRIP, start, cnt);
    // stars
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, nVis);
    gl.bindVertexArray(null);
  }

  function dispose() {
    try { gl.deleteProgram(ptsProg); gl.deleteProgram(glowProg); } catch { /* ignore */ }
  }
  return { gl, update, render, dispose, nStars };
}
