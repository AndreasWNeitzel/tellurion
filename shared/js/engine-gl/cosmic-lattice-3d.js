// WebGL2 renderer for the expanding universe: a comoving lattice of
// galaxies whose proper positions are (comoving x scale factor a).
// Every galaxy recedes from every other with no centre; light pulses
// emitted by a clicked galaxy travel to the observer at the origin
// and redshift by the real ratio of scale factors. The renderer owns
// no cosmology; the caller (playground.js) feeds it a and the pulse
// states from shared/js/engine/friedmann-cpu.js. Drawn straight to
// the default framebuffer with in-shader ACES (the RGBA16F FBO path
// is not color-renderable in headless GL).

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';

const VS = `#version 300 es
layout(location=0) in vec3 aComoving;
layout(location=1) in float aSeed;
uniform mat4 uVP;
uniform float uA;            // scale factor
uniform vec3 uEye;
out float vDist;
out float vSeed;
void main(){
  vec3 P = aComoving * uA;   // proper position = comoving * a(t)
  vDist = length(P - uEye);
  vSeed = aSeed;
  gl_Position = uVP * vec4(P, 1.0);
  gl_PointSize = clamp(140.0 / (1.0 + vDist), 2.0, 16.0);
}`;

const FS = `#version 300 es
precision highp float;
in float vDist;
in float vSeed;
uniform float uMaxD;
out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 d = gl_PointCoord*2.0-1.0;
  float r2 = dot(d,d); if (r2>1.0) discard;
  float a = exp(-2.6*r2);
  // farther galaxies are more redshifted (more expanded space between)
  float z = clamp(vDist/uMaxD, 0.0, 1.0);
  vec3 col = mix(vec3(0.75,0.85,1.0), vec3(1.0,0.32,0.18), z) * (0.5+0.9*vSeed);
  o = vec4(aces(col*a*1.5), a);
}`;

const VS_PULSE = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in float aZ;
uniform mat4 uVP;
out float vZ;
void main(){ vZ=aZ; gl_Position=uVP*vec4(aPos,1.0); gl_PointSize=12.0; }`;

const FS_PULSE = `#version 300 es
precision highp float;
in float vZ; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 d=gl_PointCoord*2.0-1.0; float r2=dot(d,d); if(r2>1.0) discard;
  float a=exp(-3.0*r2);
  vec3 col=mix(vec3(0.7,0.9,1.0), vec3(1.0,0.4,0.25), clamp(vZ,0.0,1.0));
  o=vec4(aces(col*a*3.0), a);
}`;

function mulberry(seed) {
  let x = seed >>> 0;
  return () => { x |= 0; x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function setupCosmicLatticeGL(canvas, gridN = 9) {
  const gl = createGL2(canvas);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  const W = canvas.width, H = canvas.height;

  const prog = compileProgram(gl, VS, FS);
  const pulseProg = compileProgram(gl, VS_PULSE, FS_PULSE);

  // Comoving lattice with a small seeded jitter so it is not a rigid
  // grid; centred on the origin (the observer).
  const rnd = mulberry(0x05317 + gridN);
  const span = 9;
  const verts = [];
  for (let i = 0; i < gridN; i += 1)
    for (let j = 0; j < gridN; j += 1)
      for (let k = 0; k < gridN; k += 1) {
        const x = (i / (gridN - 1) - 0.5) * 2 * span + (rnd() - 0.5) * 0.7;
        const y = (j / (gridN - 1) - 0.5) * 2 * span + (rnd() - 0.5) * 0.7;
        const z = (k / (gridN - 1) - 0.5) * 2 * span + (rnd() - 0.5) * 0.7;
        verts.push(x, y, z, 0.4 + 0.6 * rnd());
      }
  const nGal = verts.length / 4;
  const comoving = new Float32Array(verts);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, comoving, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
  gl.bindVertexArray(null);

  const pulseBuf = new Float32Array(64 * 4);
  const pvao = gl.createVertexArray();
  gl.bindVertexArray(pvao);
  const pvbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pvbo);
  gl.bufferData(gl.ARRAY_BUFFER, pulseBuf.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
  gl.bindVertexArray(null);

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  // pulses: [{x,y,z,z_redshift}]; comoving picking helper exposed.
  function render(view, proj, eye, a, pulses) {
    const VP = mul(proj, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.005, 0.006, 0.012, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const maxD = span * Math.max(0.05, a) * 2.0;
    gl.useProgram(prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uVP'), false, VP);
    gl.uniform1f(gl.getUniformLocation(prog, 'uA'), a);
    gl.uniform3f(gl.getUniformLocation(prog, 'uEye'), eye[0], eye[1], eye[2]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uMaxD'), maxD);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, nGal);
    if (pulses && pulses.length) {
      let w = 0;
      for (const p of pulses) { pulseBuf[w] = p.x; pulseBuf[w + 1] = p.y; pulseBuf[w + 2] = p.z; pulseBuf[w + 3] = p.z_redshift; w += 4; }
      gl.bindBuffer(gl.ARRAY_BUFFER, pvbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pulseBuf.subarray(0, w));
      gl.useProgram(pulseProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(pulseProg, 'uVP'), false, VP);
      gl.bindVertexArray(pvao);
      gl.drawArrays(gl.POINTS, 0, w / 4);
    }
    gl.bindVertexArray(null);
  }

  function dispose() { try { gl.deleteProgram(prog); gl.deleteProgram(pulseProg); } catch { /* ignore */ } }
  return { gl, render, dispose, comoving, nGal };
}
