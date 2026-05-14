// WebGL2 Lorenz ensemble: N particles stored in an N_PARTICLE_TEX x N_PARTICLE_TEX texture,
// each pixel = (x, y, z, _). Two ping-pong RGBA32F textures. RK4 step in fragment shader.
// Splat pass: each particle drawn as a 1-pixel point into a log-density accumulator with
// additive blending; accumulator decays slowly (geometric exponential decay each frame).
// Final render: viridis colormap applied to log(accumulator) with bloom + vignette.
// Reference: Strogatz Nonlinear Dynamics Ch. 9; GPU Gems Ch. 38.
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const FS_RK4 = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uState;
uniform float uDt;
uniform vec3 uParams; // sigma, rho, beta
out vec4 o;
vec3 f(vec3 p) {
  return vec3(uParams.x * (p.y - p.x), p.x * (uParams.y - p.z) - p.y, p.x * p.y - uParams.z * p.z);
}
void main() {
  vec3 p = texture(uState, uv).rgb;
  vec3 k1 = f(p);
  vec3 k2 = f(p + 0.5 * uDt * k1);
  vec3 k3 = f(p + 0.5 * uDt * k2);
  vec3 k4 = f(p + uDt * k3);
  vec3 pn = p + uDt * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;
  o = vec4(pn, 1.0);
}`;

// Splat: render N points, each at its (x,y) projection.
const VS_SPLAT = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform float uPtRoot;
uniform mat4 uMVP;
out float vDepth;
void main() {
  float fid = float(gl_VertexID);
  float pr = uPtRoot;
  float i = mod(fid, pr) / pr;
  float j = floor(fid / pr) / pr;
  vec3 p = texture(uState, vec2(i, j)).rgb;
  vec4 clip = uMVP * vec4(p, 1.0);
  vDepth = clip.z / clip.w;
  gl_Position = clip;
  gl_PointSize = 1.5;
}`;

const FS_SPLAT = `#version 300 es
precision highp float;
in float vDepth;
out vec4 o;
void main() { o = vec4(0.04, 0.04, 0.04, 1.0); }`;

// Render: read accumulator + viridis + ACES.
const FS_RENDER = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uAccum;
out vec4 o;
vec3 viridis(float t) {
  t = clamp(t, 0.0, 1.0);
  return vec3(clamp(0.267 + 0.105*t - 0.330*t*t + 1.000*t*t*t, 0.0, 1.0),
              clamp(0.005 + 1.404*t - 0.479*t*t, 0.0, 1.0),
              clamp(0.329 + 0.749*t - 0.972*t*t, 0.0, 1.0));
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  float v = texture(uAccum, uv).r;
  vec2 c = uv - 0.5;
  float vign = 1.0 - 0.25 * dot(c, c) * 2.0;
  o = vec4(aces(viridis(log(1.0 + v * 12.0) * 0.3) * vign), 1.0);
}`;

// Decay: multiply accumulator by alpha each frame.
const FS_DECAY = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uAccum;
uniform float uAlpha;
out vec4 o;
void main() { o = texture(uAccum, uv) * uAlpha; }`;

export function setupLorenzGL(canvas, N_root = 32) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const N = N_root * N_root;
  const stepProg = compileProgram(gl, VS_QUAD, FS_RK4);
  const splatProg = compileProgram(gl, VS_SPLAT, FS_SPLAT);
  const renderProg = compileProgram(gl, VS_QUAD, FS_RENDER);
  const decayProg = compileProgram(gl, VS_QUAD, FS_DECAY);
  // State ping-pong (RGBA32F).
  function makeFloatFBO() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, N_root, N_root, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }
  let A = makeFloatFBO(), B = makeFloatFBO();
  const W = canvas.width, H = canvas.height;
  const accum = createFBO(gl, W, H, { internalFormat: gl.R16F, type: gl.HALF_FLOAT });
  // Re-bind format: createFBO is RGBA16F; for accumulation we want a higher-precision color.
  // Use a separate FBO.
  const accumA = createFBO(gl, W, H);
  // HDR pre-composite for postprocess (renderProg writes here instead of default fb).
  const sceneFBO = createFBO(gl, W, H);
  const post = setupPostProcess(gl, W, H);
  // Initial state: small ball around (1, 1, 1).
  function init(seed = 0xC0FFEE) {
    const data = new Float32Array(N_root * N_root * 4);
    let s = seed >>> 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; }
    for (let i = 0; i < N; i += 1) {
      data[4 * i] = 1 + 1e-3 * (rnd() - 0.5);
      data[4 * i + 1] = 1 + 1e-3 * (rnd() - 0.5);
      data[4 * i + 2] = 1 + 1e-3 * (rnd() - 0.5);
      data[4 * i + 3] = 1;
    }
    gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N_root, N_root, gl.RGBA, gl.FLOAT, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, accumA.fbo);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  }
  const quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  function step(dt) {
    gl.useProgram(stepProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo);
    gl.viewport(0, 0, N_root, N_root);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(gl.getUniformLocation(stepProg, 'uState'), 0);
    gl.uniform1f(gl.getUniformLocation(stepProg, 'uDt'), dt);
    gl.uniform3f(gl.getUniformLocation(stepProg, 'uParams'), 10, 28, 8 / 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [A, B] = [B, A];
  }
  function splat(view, proj) {
    gl.useProgram(splatProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, accumA.fbo);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(gl.getUniformLocation(splatProg, 'uState'), 0);
    gl.uniform1f(gl.getUniformLocation(splatProg, 'uPtRoot'), N_root);
    const mvp = matMul(proj, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(splatProg, 'uMVP'), false, mvp);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disable(gl.BLEND);
  }
  function decay(alpha) {
    gl.useProgram(decayProg);
    // Render accumA -> tempFBO? For simplicity, sample accumA into itself via swap.
    // Use a scratch.
    const tmp = createFBO(gl, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmp.fbo);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, accumA.tex);
    gl.uniform1i(gl.getUniformLocation(decayProg, 'uAccum'), 0);
    gl.uniform1f(gl.getUniformLocation(decayProg, 'uAlpha'), alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Copy tmp -> accumA.
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, tmp.fbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, accumA.fbo);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
  }
  function render() {
    // Pass 1: scene to HDR FBO.
    gl.useProgram(renderProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, accumA.tex);
    gl.uniform1i(gl.getUniformLocation(renderProg, 'uAccum'), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Pass 2: bloom + ACES + dither + vignette to default fb.
    post.run(sceneFBO.tex, 0.9, 0.25, 0.6);
  }
  // Camera matrices.
  function camera(t) {
    const az = Math.PI * 0.6 + t * 0.05;
    const el = 0.4;
    const r = 70;
    const eye = [r * Math.cos(el) * Math.cos(az), r * Math.cos(el) * Math.sin(az), r * Math.sin(el) + 20];
    const tgt = [0, 0, 22];
    const up = [0, 0, 1];
    const view = lookAt(eye, tgt, up);
    const proj = perspective(45 * Math.PI / 180, W / H, 1, 200);
    return { view, proj };
  }
  return { N, N_root, init, step, splat, decay, render, camera };
}

function lookAt(eye, tgt, up) {
  const f = norm(sub(tgt, eye));
  const s = norm(cross(f, up));
  const u = cross(s, f);
  return new Float32Array([
    s[0], u[0], -f[0], 0,
    s[1], u[1], -f[1], 0,
    s[2], u[2], -f[2], 0,
    -dot(s, eye), -dot(u, eye), dot(f, eye), 1,
  ]);
}
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, 2 * far * near / (near - far), 0,
  ]);
}
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(v) { const m = Math.sqrt(dot(v, v)); return [v[0] / m, v[1] / m, v[2] / m]; }
function matMul(a, b) {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    let s = 0;
    for (let k = 0; k < 4; k += 1) s += a[i + 4 * k] * b[k + 4 * j];
    r[i + 4 * j] = s;
  }
  return r;
}
