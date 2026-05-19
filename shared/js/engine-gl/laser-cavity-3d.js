// WebGL2 renderer for the laser cavity. Two mirror discs with a gain
// rod between them; excited atoms glow in the rod (brightness and
// count track the inversion N), photons stream along the axis between
// the mirrors (count tracks the cavity photon number n), and a bright
// beam leaves the partially reflecting output mirror with an
// intensity that tracks the output power. The renderer owns no
// physics: it draws whatever the shared rate-equation engine
// (laser-rate-cpu.js) produces. Default framebuffer + in-shader ACES.

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';

const VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aCol;
uniform mat4 uVP;
out vec4 vCol;
void main(){ vCol=aCol; gl_Position=uVP*vec4(aPos,1.0); gl_PointSize = aCol.a>0.0 ? 9.0 : 1.0; }`;
const FS = `#version 300 es
precision highp float;
in vec4 vCol; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 d=gl_PointCoord*2.0-1.0; float r=dot(d,d); if(r>1.0) discard;
  float a=exp(-2.6*r);
  o=vec4(aces(vCol.rgb*a*1.6), a*vCol.a);
}`;

const VS_S = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
uniform mat4 uVP; out vec3 vN;
void main(){ vN=aNrm; gl_Position=uVP*vec4(aPos,1.0); }`;
const FS_S = `#version 300 es
precision highp float;
in vec3 vN; uniform vec3 uCol; uniform float uE; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  float d=0.4+0.6*max(dot(normalize(vN),normalize(vec3(0.3,0.7,0.6))),0.0);
  o=vec4(aces(uCol*d+uCol*uE),1.0);
}`;

function disc(cx, zc, rad, nrmz) {
  const v = []; const seg = 28;
  for (let i = 0; i < seg; i += 1) {
    const a0 = i / seg * 2 * Math.PI, a1 = (i + 1) / seg * 2 * Math.PI;
    v.push(cx, 0, zc, 0, 0, nrmz,
      cx + rad * Math.cos(a0), rad * Math.sin(a0), zc, 0, 0, nrmz,
      cx + rad * Math.cos(a1), rad * Math.sin(a1), zc, 0, 0, nrmz);
  }
  return new Float32Array(v);
}

function mulberry(seed) {
  let x = seed >>> 0;
  return () => { x |= 0; x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function setupLaserCavityGL(canvas) {
  const gl = createGL2(canvas);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  const W = canvas.width, H = canvas.height;
  const ptProg = compileProgram(gl, VS, FS);
  const sProg = compileProgram(gl, VS_S, FS_S);

  const ZL = -4, ZR = 4, ROD_R = 0.9;        // cavity axis along z
  const NA = 360, NP = 240, NB = 60;          // atom / photon / beam slots
  const rnd = mulberry(0x1A5E7);
  const atomXYZ = [];
  for (let i = 0; i < NA; i += 1) {
    const a = rnd() * 2 * Math.PI, r = Math.sqrt(rnd()) * ROD_R * 0.85;
    atomXYZ.push(r * Math.cos(a), r * Math.sin(a), ZL + 0.6 + rnd() * (ZR - ZL - 1.2));
  }
  const photZ = new Float32Array(NP);
  const photDir = new Float32Array(NP);
  for (let i = 0; i < NP; i += 1) { photZ[i] = ZL + rnd() * (ZR - ZL); photDir[i] = rnd() < 0.5 ? 1 : -1; }
  const photXY = [];
  for (let i = 0; i < NP; i += 1) { const a = rnd() * 6.283, r = rnd() * ROD_R * 0.6; photXY.push(r * Math.cos(a), r * Math.sin(a)); }

  const pdata = new Float32Array((NA + NP + NB) * 7);
  const pvao = gl.createVertexArray();
  gl.bindVertexArray(pvao);
  const pvbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pvbo);
  gl.bufferData(gl.ARRAY_BUFFER, pdata.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
  gl.bindVertexArray(null);

  function mkSolid(arr) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);
    return { vao, n: arr.length / 6 };
  }
  const mirrorL = mkSolid(disc(0, ZL, 1.1, 1));
  const mirrorR = mkSolid(disc(0, ZR, 1.1, -1));

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  let t = 0;
  // invFrac in [0,1] ~ inversion; phot in [0,1] ~ photon number;
  // outFrac in [0,1] ~ output power.
  function update(dt, invFrac, photFrac, outFrac) {
    t += dt;
    let w = 0;
    const nAtomLit = Math.round(NA * Math.max(0.05, Math.min(1, invFrac)));
    for (let i = 0; i < NA; i += 1) {
      const lit = i < nAtomLit ? 1 : 0;
      pdata[w] = atomXYZ[i * 3]; pdata[w + 1] = atomXYZ[i * 3 + 1]; pdata[w + 2] = atomXYZ[i * 3 + 2];
      pdata[w + 3] = lit ? 1.0 : 0.25; pdata[w + 4] = lit ? 0.55 : 0.2; pdata[w + 5] = lit ? 0.15 : 0.12;
      pdata[w + 6] = lit ? 0.9 : 0.15;
      w += 7;
    }
    const nPhot = Math.round(NP * Math.max(0, Math.min(1, photFrac)));
    for (let i = 0; i < NP; i += 1) {
      photZ[i] += photDir[i] * dt * 9;
      if (photZ[i] > ZR) { photZ[i] = ZR; photDir[i] = -1; }
      if (photZ[i] < ZL) { photZ[i] = ZL; photDir[i] = 1; }
      const on = i < nPhot ? 1 : 0;
      pdata[w] = photXY[i * 2]; pdata[w + 1] = photXY[i * 2 + 1]; pdata[w + 2] = photZ[i];
      pdata[w + 3] = 0.6; pdata[w + 4] = 0.85; pdata[w + 5] = 1.0; pdata[w + 6] = on ? 1.0 : 0.0;
      w += 7;
    }
    for (let i = 0; i < NB; i += 1) {
      const zz = ZR + (i / NB) * 5.5;
      pdata[w] = (Math.sin(t * 20 + i) * 0.04); pdata[w + 1] = (Math.cos(t * 17 + i) * 0.04); pdata[w + 2] = zz;
      pdata[w + 3] = 0.7; pdata[w + 4] = 0.9; pdata[w + 5] = 1.0; pdata[w + 6] = Math.min(1, outFrac) * (1 - i / NB);
      w += 7;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, pvbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pdata);
  }

  function render(view, proj) {
    const VP = mul(proj, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.015, 0.018, 0.025, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(sProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(sProg, 'uVP'), false, VP);
    gl.uniform3f(gl.getUniformLocation(sProg, 'uCol'), 0.55, 0.6, 0.7);
    gl.uniform1f(gl.getUniformLocation(sProg, 'uE'), 0.0);
    gl.bindVertexArray(mirrorL.vao); gl.drawArrays(gl.TRIANGLES, 0, mirrorL.n);
    gl.uniform3f(gl.getUniformLocation(sProg, 'uCol'), 0.4, 0.5, 0.62);
    gl.bindVertexArray(mirrorR.vao); gl.drawArrays(gl.TRIANGLES, 0, mirrorR.n);
    gl.useProgram(ptProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(ptProg, 'uVP'), false, VP);
    gl.bindVertexArray(pvao);
    gl.drawArrays(gl.POINTS, 0, NA + NP + NB);
    gl.bindVertexArray(null);
  }
  function dispose() { try { gl.deleteProgram(ptProg); gl.deleteProgram(sProg); } catch { /* ignore */ } }
  return { gl, update, render, dispose };
}
