// WebGL2 renderer for the quantum tunnelling landscape. The potential
// V(x) is an opaque terrain ridge; the probability density |psi|^2 is
// a luminous curtain lofted above the x-axis and coloured by the
// complex phase arg(psi); a classical ball rolls alongside for the
// contrast. The renderer owns no physics: it draws whatever the
// shared TDSE engine (tdse-cn-cpu.js) produces. Default framebuffer +
// in-shader ACES (the RGBA16F FBO path is not color-renderable in
// headless GL).

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';

const VS_SURF = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in float aPhase;   // arg(psi), or -9 for the ridge
uniform mat4 uVP;
out float vPhase;
out float vY;
void main(){ vPhase = aPhase; vY = aPos.y; gl_Position = uVP * vec4(aPos, 1.0); }`;

const FS_SURF = `#version 300 es
precision highp float;
in float vPhase;
in float vY;
out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
// cyclic phase colour (twilight-ish)
vec3 phase(float a){
  return 0.5 + 0.5*vec3(cos(a), cos(a-2.094), cos(a+2.094));
}
void main(){
  if (vPhase < -5.0){
    // potential ridge: cool grey, lit by height
    float g = 0.18 + 0.10*clamp(vY*0.15,0.0,1.0);
    o = vec4(aces(vec3(g, g*1.02, g*1.1)), 1.0);
  } else {
    vec3 c = phase(vPhase) * (0.35 + 1.5*clamp(vY,0.0,1.5));
    o = vec4(aces(c*1.5), 0.92);
  }
}`;

const VS_PT = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uVP;
void main(){ gl_Position = uVP*vec4(aPos,1.0); gl_PointSize = 16.0; }`;
const FS_PT = `#version 300 es
precision highp float; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){ vec2 d=gl_PointCoord*2.0-1.0; float r=dot(d,d); if(r>1.0) discard;
  o = vec4(aces(vec3(1.0,0.55,0.2)*exp(-2.5*r)*2.0), 1.0); }`;

export function setupTDSELandscapeGL(canvas, NCOL = 480) {
  const gl = createGL2(canvas);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const W = canvas.width, H = canvas.height;
  const surfProg = compileProgram(gl, VS_SURF, FS_SURF);
  const ptProg = compileProgram(gl, VS_PT, FS_PT);

  // Two ribbons (curtain, ridge), each NCOL columns x 2 rows.
  const stride = 4;                         // x,y,z,phase
  const vCurtain = new Float32Array(NCOL * 2 * stride);
  const vRidge = new Float32Array(NCOL * 2 * stride);
  const idx = [];
  for (let c = 0; c < NCOL - 1; c += 1) {
    const a = c * 2, b = a + 1, d = a + 2, e = a + 3;
    idx.push(a, b, d, b, e, d);
  }
  const indices = new Uint16Array(idx);

  function mkVAO(buf) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, buf.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride * 4, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride * 4, 12);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, vbo };
  }
  const curtain = mkVAO(vCurtain);
  const ridge = mkVAO(vRidge);
  const ballVAO = gl.createVertexArray();
  gl.bindVertexArray(ballVAO);
  const ballVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
  gl.bufferData(gl.ARRAY_BUFFER, 12, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const ZSPAN = 17, AMP = 5.5, VAMP = 2.4;

  function update(s) {
    const N = s.N;
    // Render only the active window of the grid (the packet launches
    // near -55 and the barriers sit near 0); mapping the whole 240-
    // unit domain made the packet a sliver. Window: middle ~62 %.
    const iLo = Math.floor(N * 0.19), iHi = Math.ceil(N * 0.81), iW = iHi - iLo;
    let pmax = 1e-9, vmax = 1e-9;
    for (let i = iLo; i < iHi; i += 1) {
      const p = s.psiRe[i] ** 2 + s.psiIm[i] ** 2;
      if (p > pmax) pmax = p;
      if (s.V[i] > vmax) vmax = s.V[i];
    }
    for (let c = 0; c < NCOL; c += 1) {
      const i = Math.min(N - 1, iLo + Math.round(c / (NCOL - 1) * (iW - 1)));
      const z = (c / (NCOL - 1) - 0.5) * 2 * ZSPAN;
      const p = (s.psiRe[i] ** 2 + s.psiIm[i] ** 2) / pmax;
      const ph = Math.atan2(s.psiIm[i], s.psiRe[i]);
      const yb = 0, yt = p * AMP;
      let o = c * 2 * stride;
      vCurtain[o] = 0; vCurtain[o + 1] = yb; vCurtain[o + 2] = z; vCurtain[o + 3] = ph;
      vCurtain[o + 4] = 0; vCurtain[o + 5] = yt; vCurtain[o + 6] = z; vCurtain[o + 7] = ph;
      const vv = (s.V[i] / (vmax || 1)) * VAMP;
      o = c * 2 * stride;
      vRidge[o] = 1.4; vRidge[o + 1] = 0; vRidge[o + 2] = z; vRidge[o + 3] = -9;
      vRidge[o + 4] = 1.4; vRidge[o + 5] = vv; vRidge[o + 6] = z; vRidge[o + 7] = -9;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, curtain.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, vCurtain);
    gl.bindBuffer(gl.ARRAY_BUFFER, ridge.vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, vRidge);
    // classical ball: map its x through the same render window as the
    // curtain so it lines up with the wave and the ridge.
    const xLoW = -s.L / 2 + iLo * s.dx, xHiW = -s.L / 2 + iHi * s.dx;
    const cf = ((s.classical ? s.classical.x : 0) - xLoW) / (xHiW - xLoW);
    const cz = (Math.max(0, Math.min(1, cf)) - 0.5) * 2 * ZSPAN;
    gl.bindBuffer(gl.ARRAY_BUFFER, ballVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([1.4, 0.25, cz]));
  }

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  function render(view, proj) {
    const VP = mul(proj, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.01, 0.012, 0.02, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(surfProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(surfProg, 'uVP'), false, VP);
    gl.bindVertexArray(ridge.vao);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(curtain.vao);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    gl.useProgram(ptProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(ptProg, 'uVP'), false, VP);
    gl.bindVertexArray(ballVAO);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.bindVertexArray(null);
  }
  function dispose() { try { gl.deleteProgram(surfProg); gl.deleteProgram(ptProg); } catch { /* ignore */ } }
  return { gl, update, render, dispose };
}
