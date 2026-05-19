// WebGL2 renderer for the Meissner effect. A bar magnet hovers above
// a superconducting sample; magnetic field lines (integrated on the
// CPU through the shared engine's fieldAt) curve AROUND the sample
// when it is superconducting and PENETRATE it when it is normal, and
// a thin glowing London skin sits on the cold surface. The renderer
// owns no physics. Default framebuffer + in-shader ACES (the RGBA16F
// FBO path is not color-renderable in headless GL).

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { fieldAt } from '../engine/meissner-cpu.js';

const VS_LINE = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in float aMag;
uniform mat4 uVP;
out float vMag;
void main(){ vMag = aMag; gl_Position = uVP * vec4(aPos, 1.0); }`;
const FS_LINE = `#version 300 es
precision highp float;
in float vMag; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  float m = clamp(vMag, 0.0, 1.0);
  vec3 c = mix(vec3(0.25,0.45,1.0), vec3(1.0,0.8,0.3), m);
  o = vec4(aces(c*1.4), 0.85);
}`;

const VS_SOLID = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
uniform mat4 uVP;
out vec3 vN; out vec3 vP;
void main(){ vN=aNrm; vP=aPos; gl_Position = uVP*vec4(aPos,1.0); }`;
const FS_SOLID = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vP;
uniform vec3 uCol; uniform float uEmis;
out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec3 L = normalize(vec3(0.4,0.9,0.5));
  float d = 0.35 + 0.65*max(dot(normalize(vN), L), 0.0);
  o = vec4(aces(uCol*d + uCol*uEmis), 1.0);
}`;

function box(cx, cy, cz, sx, sy, sz, col) {
  const v = [], V = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const F = [[0, 1, 2, 0, 2, 3, 0, 0, -1], [5, 4, 7, 5, 7, 6, 0, 0, 1],
  [4, 0, 3, 4, 3, 7, -1, 0, 0], [1, 5, 6, 1, 6, 2, 1, 0, 0],
  [3, 2, 6, 3, 6, 7, 0, 1, 0], [4, 5, 1, 4, 1, 0, 0, -1, 0]];
  for (const f of F) {
    const nx = f[6], ny = f[7], nz = f[8];
    for (let k = 0; k < 6; k += 1) {
      const p = V[f[k]];
      v.push(cx + p[0] * sx, cy + p[1] * sy, cz + p[2] * sz, nx, ny, nz);
    }
  }
  return { data: new Float32Array(v), n: 36, col };
}

export function setupMeissnerGL(canvas) {
  const gl = createGL2(canvas);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  const W = canvas.width, H = canvas.height;
  const lineProg = compileProgram(gl, VS_LINE, FS_LINE);
  const solidProg = compileProgram(gl, VS_SOLID, FS_SOLID);

  const NLINE = 30, NSTEP = 150, lineBuf = new Float32Array(NLINE * NSTEP * 4);
  const lvao = gl.createVertexArray();
  gl.bindVertexArray(lvao);
  const lvbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lvbo);
  gl.bufferData(gl.ARRAY_BUFFER, lineBuf.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
  gl.bindVertexArray(null);
  const segs = [];                          // [startVtx, count] per line

  function mkSolid(s) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, s.data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);
    return { vao, vbo, n: s.n, col: s.col };
  }
  const sample = mkSolid(box(0, -1.4, 0, 2.6, 0.5, 2.6, [0.30, 0.55, 0.85]));
  const magnetN = mkSolid(box(0, 2.0, 0, 0.5, 0.45, 0.5, [0.95, 0.3, 0.25]));
  const magnetS = mkSolid(box(0, 1.1, 0, 0.5, 0.45, 0.5, [0.35, 0.55, 1.0]));

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  // Integrate field-line streamlines through fieldAt; the magnet sits
  // at (0,0,h) in engine coords (z up). World maps z_engine -> y_world.
  function update(h, mz, sc, lambda) {
    let w = 0; segs.length = 0;
    for (let li = 0; li < NLINE; li += 1) {
      const a = (li / NLINE) * 2 * Math.PI;
      const r0 = 0.55;
      let px = r0 * Math.cos(a), py = r0 * Math.sin(a), pz = h + 0.35;
      const start = w / 4; let cnt = 0;
      for (let n = 0; n < NSTEP; n += 1) {
        const B = fieldAt([px, py, pz], h, mz, sc, lambda);
        const bm = Math.hypot(B[0], B[1], B[2]);
        if (bm < 1e-6) break;
        // world: x->x, z_engine->y_world (up), y_engine->z_world
        lineBuf[w] = px; lineBuf[w + 1] = pz - 1.4; lineBuf[w + 2] = py;
        lineBuf[w + 3] = Math.min(1, bm * 0.6);
        w += 4; cnt += 1;
        const step = 0.07;
        px += (B[0] / bm) * step; py += (B[1] / bm) * step; pz += (B[2] / bm) * step;
        if (pz < -2.5 || pz > 7 || Math.abs(px) > 7 || Math.abs(py) > 7) break;
      }
      if (cnt > 1) segs.push([start, cnt]);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, lvbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, lineBuf.subarray(0, w));
  }

  function render(view, proj, h, sc) {
    const VP = mul(proj, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.02, 0.025, 0.035, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(solidProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(solidProg, 'uVP'), false, VP);
    // sample: glowing skin when superconducting
    gl.bindVertexArray(sample.vao);
    // Cold sample is a subdued teal with a faint glow (NOT pure white,
    // which washed out the magnet and the field lines); warm sample
    // is a neutral graphite tone.
    gl.uniform3f(gl.getUniformLocation(solidProg, 'uCol'), sc ? 0.10 : 0.16, sc ? 0.22 : 0.16, sc ? 0.34 : 0.18);
    gl.uniform1f(gl.getUniformLocation(solidProg, 'uEmis'), sc ? 0.15 : 0.03);
    gl.drawArrays(gl.TRIANGLES, 0, sample.n);
    // magnet poles, rebuilt at the current levitation height (cheap,
    // 36 verts each).
    const mN = box(0, (h + 0.45) - 1.4, 0, 0.5, 0.42, 0.5, magnetN.col);
    const mS = box(0, (h - 0.45) - 1.4, 0, 0.5, 0.42, 0.5, magnetS.col);
    gl.bindVertexArray(magnetN.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, magnetN.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mN.data);
    gl.uniform3f(gl.getUniformLocation(solidProg, 'uCol'), 0.95, 0.3, 0.25);
    gl.uniform1f(gl.getUniformLocation(solidProg, 'uEmis'), 0.15);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.bindVertexArray(magnetS.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, magnetS.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mS.data);
    gl.uniform3f(gl.getUniformLocation(solidProg, 'uCol'), 0.35, 0.55, 1.0);
    gl.uniform1f(gl.getUniformLocation(solidProg, 'uEmis'), 0.15);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    // field lines
    gl.useProgram(lineProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uVP'), false, VP);
    gl.bindVertexArray(lvao);
    for (const [s, c] of segs) gl.drawArrays(gl.LINE_STRIP, s, c);
    gl.bindVertexArray(null);
  }

  function dispose() { try { gl.deleteProgram(lineProg); gl.deleteProgram(solidProg); } catch { /* ignore */ } }
  return { gl, update, render, dispose };
}
