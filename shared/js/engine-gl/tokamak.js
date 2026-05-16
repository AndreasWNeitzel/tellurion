// Tokamak hero engine. Draws into a single HDR FBO using line + point
// primitives only (no mesh complexity), then post-processes with bloom +
// ACES. Geometry is built JS-side from the current R, a, q parameters and
// the (camera-supplied) MVP.
//
// Layers, drawn in this order into sceneFBO:
//   1. Toroidal vessel: 24 poloidal + 24 toroidal hoops as transparent
//      blue lines (looks like a glass torus).
//   2. Helical field lines: N_LINES winding ropes, colored by |B| via
//      a viridis gradient; depth-faded.
//   3. Plasma core: additive emissive points along the magnetic axis
//      with Planck blackbody color.
//   4. Banana-orbit particles: 12 trapped trails on the outboard side.

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_LINE = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
layout(location = 2) in float aDepthFade;
uniform mat4 uMVP;
out vec3 vCol;
out float vDepth;
void main() {
  vec4 clip = uMVP * vec4(aPos, 1.0);
  gl_Position = clip;
  vCol = aColor;
  vDepth = clip.z / clip.w;
}`;

const FS_LINE = `#version 300 es
precision highp float;
in vec3 vCol;
in float vDepth;
uniform float uAlpha;
out vec4 o;
void main() {
  // Depth fade: lines farther away dim slightly.
  float fade = clamp(1.0 - (vDepth * 0.5 + 0.5) * 0.3, 0.5, 1.0);
  o = vec4(vCol * fade, uAlpha);
}`;

const VS_POINT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
uniform mat4 uMVP;
uniform float uPointSize;
out vec3 vCol;
void main() {
  vec4 clip = uMVP * vec4(aPos, 1.0);
  gl_Position = clip;
  gl_PointSize = uPointSize;
  vCol = aColor;
}`;

const FS_POINT = `#version 300 es
precision highp float;
in vec3 vCol;
out vec4 o;
void main() {
  // Soft Gaussian falloff inside the point sprite.
  vec2 d = gl_PointCoord - 0.5;
  float f = exp(-dot(d, d) * 12.0);
  o = vec4(vCol * f, 1.0);
}`;

function viridis(t) {
  t = Math.max(0, Math.min(1, t));
  return [
    Math.max(0, Math.min(1, 0.267 + 0.105 * t - 0.330 * t * t + 1.000 * t * t * t)),
    Math.max(0, Math.min(1, 0.005 + 1.404 * t - 0.479 * t * t)),
    Math.max(0, Math.min(1, 0.329 + 0.749 * t - 0.972 * t * t)),
  ];
}

// Planck blackbody at temperature T_K, mapped to sRGB. Hot -> white-blue,
// cool -> orange-red.
function planck(T_K) {
  const t = Math.max(1000, Math.min(15000, T_K)) / 100;
  const r = t <= 66 ? 255 : Math.min(255, 329.7 * Math.pow(t - 60, -0.133));
  const g = t <= 66 ? Math.min(255, 99.5 * Math.log(t) - 161.1) : Math.min(255, 288.1 * Math.pow(t - 60, -0.0755));
  const b = t >= 66 ? 255 : t <= 19 ? 0 : Math.min(255, 138.5 * Math.log(t - 10) - 305);
  return [r / 255, g / 255, b / 255];
}

export function setupTokamakGL(canvas) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const lineProg = compileProgram(gl, VS_LINE, FS_LINE);
  const pointProg = compileProgram(gl, VS_POINT, FS_POINT);
  const W = canvas.width, H = canvas.height;
  const sceneFBO = createFBO(gl, W, H, { depth: true });
  const post = setupPostProcess(gl, W, H);
  const vboPos = gl.createBuffer();
  const vboCol = gl.createBuffer();
  const vboPtPos = gl.createBuffer();
  const vboPtCol = gl.createBuffer();

  function buildScene(R, a, q, B0, Ip) {
    const positions = []; const colors = [];

    // Vessel: 24 poloidal hoops (constant phi) + 24 toroidal hoops (constant theta).
    const vesselBlue = [0.35, 0.55, 0.9];
    const NHOOPS = 24;
    for (let i = 0; i < NHOOPS; i += 1) {
      const phi = (i / NHOOPS) * 2 * Math.PI;
      const segs = 64;
      for (let s = 0; s < segs; s += 1) {
        const t1 = (s / segs) * 2 * Math.PI;
        const t2 = ((s + 1) / segs) * 2 * Math.PI;
        positions.push((R + a * Math.cos(t1)) * Math.cos(phi), a * Math.sin(t1), (R + a * Math.cos(t1)) * Math.sin(phi));
        positions.push((R + a * Math.cos(t2)) * Math.cos(phi), a * Math.sin(t2), (R + a * Math.cos(t2)) * Math.sin(phi));
        colors.push(...vesselBlue, ...vesselBlue);
      }
    }
    for (let j = 0; j < NHOOPS; j += 1) {
      const th = (j / NHOOPS) * 2 * Math.PI;
      const segs = 80;
      for (let s = 0; s < segs; s += 1) {
        const p1 = (s / segs) * 2 * Math.PI;
        const p2 = ((s + 1) / segs) * 2 * Math.PI;
        positions.push((R + a * Math.cos(th)) * Math.cos(p1), a * Math.sin(th), (R + a * Math.cos(th)) * Math.sin(p1));
        positions.push((R + a * Math.cos(th)) * Math.cos(p2), a * Math.sin(th), (R + a * Math.cos(th)) * Math.sin(p2));
        colors.push(...vesselBlue, ...vesselBlue);
      }
    }
    const vesselVertexCount = positions.length / 3;

    // Field lines: N_LINES = 8 ropes at increasing minor radius.
    const N_LINES = 8;
    for (let k = 0; k < N_LINES; k += 1) {
      const r_off = (k + 0.5) / N_LINES * a * 0.92;
      // |B| roughly 1/R; use viridis on r_off/a so inner ropes (small r_off) are bright.
      const bMag = R / (R + r_off * 0.5);
      const col = viridis(0.2 + 0.7 * (1 - r_off / a));
      const segs = 600;
      const turns = 12 / Math.max(1.2, q);
      for (let s = 0; s < segs; s += 1) {
        const t1 = s / segs, t2 = (s + 1) / segs;
        const phi1 = t1 * 2 * Math.PI;
        const phi2 = t2 * 2 * Math.PI;
        const th1 = t1 * 2 * Math.PI * turns;
        const th2 = t2 * 2 * Math.PI * turns;
        positions.push((R + r_off * Math.cos(th1)) * Math.cos(phi1), r_off * Math.sin(th1), (R + r_off * Math.cos(th1)) * Math.sin(phi1));
        positions.push((R + r_off * Math.cos(th2)) * Math.cos(phi2), r_off * Math.sin(th2), (R + r_off * Math.cos(th2)) * Math.sin(phi2));
        colors.push(...col, ...col);
      }
    }
    const lineVertexCount = positions.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboCol);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);

    // Plasma core: ring of additive points along the magnetic axis.
    const ptPos = []; const ptCol = [];
    const NPLASMA = 240;
    for (let s = 0; s < NPLASMA; s += 1) {
      const phi = (s / NPLASMA) * 2 * Math.PI;
      // Slight off-axis to give a soft glowing tube look.
      const r_pl = a * 0.20 * (1 + 0.15 * Math.sin(3 * phi));
      const t_loc = Math.sin(phi * 2) * 0.5 + 0.5;
      const x = (R + r_pl * Math.cos(t_loc * 6)) * Math.cos(phi);
      const y = r_pl * Math.sin(t_loc * 6);
      const z = (R + r_pl * Math.cos(t_loc * 6)) * Math.sin(phi);
      const T = 9000 - 5000 * t_loc;
      const c = planck(T);
      ptPos.push(x, y, z); ptCol.push(...c);
    }
    // Banana-orbit particles: 12 trapped on the outboard side.
    const N_BANANA = 12;
    for (let k = 0; k < N_BANANA; k += 1) {
      const phi = (k / N_BANANA) * 2 * Math.PI;
      const th = Math.sin(2 * phi + k) * 0.5;
      const r_bn = a * 0.75;
      const x = (R + r_bn * Math.cos(th)) * Math.cos(phi);
      const y = r_bn * Math.sin(th);
      const z = (R + r_bn * Math.cos(th)) * Math.sin(phi);
      ptPos.push(x, y, z); ptCol.push(1.0, 0.85, 0.45);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPtPos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ptPos), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPtCol);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ptCol), gl.DYNAMIC_DRAW);

    dynCount = -1;          // a fresh scene drops any live particle set
    return { vesselVertexCount, lineVertexCount, pointCount: ptPos.length / 3 };
  }

  // Live plasma: replace the static point set with an externally
  // integrated guiding-centre population (positions + colours, xyz/rgb
  // interleaved as separate Float32Arrays). Buffers are DYNAMIC_DRAW so
  // re-uploading every frame is cheap.
  let dynCount = -1;
  function setParticles(posF32, colF32) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPtPos);
    gl.bufferData(gl.ARRAY_BUFFER, posF32, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPtCol);
    gl.bufferData(gl.ARRAY_BUFFER, colF32, gl.DYNAMIC_DRAW);
    dynCount = posF32.length / 3;
  }

  function render(viewMat, projMat, sceneInfo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.016, 0.018, 0.025, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // MVP.
    const mvp = matMul(projMat, viewMat);
    gl.useProgram(lineProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uMVP'), false, mvp);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboCol);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    // Vessel: translucent.
    gl.uniform1f(gl.getUniformLocation(lineProg, 'uAlpha'), 0.20);
    gl.drawArrays(gl.LINES, 0, sceneInfo.vesselVertexCount);
    // Field lines: opaque-ish.
    gl.uniform1f(gl.getUniformLocation(lineProg, 'uAlpha'), 0.85);
    gl.drawArrays(gl.LINES, sceneInfo.vesselVertexCount, sceneInfo.lineVertexCount - sceneInfo.vesselVertexCount);
    // Plasma + banana particles: additive points.
    gl.useProgram(pointProg);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    gl.uniformMatrix4fv(gl.getUniformLocation(pointProg, 'uMVP'), false, mvp);
    gl.uniform1f(gl.getUniformLocation(pointProg, 'uPointSize'), 8);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPtPos);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPtCol);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, dynCount >= 0 ? dynCount : sceneInfo.pointCount);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    post.run(sceneFBO.tex, 0.75, 0.25, 0.6);
  }

  return { gl, buildScene, render, setParticles };
}

function matMul(a, b) {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    let s = 0; for (let k = 0; k < 4; k += 1) s += a[i + 4 * k] * b[k + 4 * j];
    r[i + 4 * j] = s;
  }
  return r;
}
