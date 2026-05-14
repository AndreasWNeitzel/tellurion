// Lorenz ensemble WebGL2 renderer.
// State lives on the CPU (shared/js/engine/lorenz-cpu.js); each frame the
// JS uploads particle positions to a VBO, the splat program draws them as
// additive points into an HDR accumulator. A separate decay pass dims the
// accumulator each frame. Final compose maps log-density to viridis with
// ACES tonemap + vignette + dither via shared postprocess.

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const VS_SPLAT = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uMVP;
uniform float uPointSize;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  gl_PointSize = uPointSize;
}`;

const FS_SPLAT = `#version 300 es
precision highp float;
uniform float uIntensity;
out vec4 o;
void main() { o = vec4(uIntensity, uIntensity, uIntensity, 1.0); }`;

const FS_DECAY = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uAccum;
uniform float uAlpha;
out vec4 o;
void main() { o = texture(uAccum, uv) * uAlpha; }`;

const FS_COMPOSE = `#version 300 es
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
void main() {
  float v = texture(uAccum, uv).r;
  // Tighter log mapping so most attractor pixels read in viridis green/teal
  // rather than saturating to yellow; only the densest filaments saturate.
  float t = clamp(log(1.0 + v * 10.0) * 0.22, 0.0, 1.0);
  vec3 col = viridis(t) * (0.30 + 1.3 * t);
  vec2 c = uv - 0.5;
  float vign = 1.0 - 0.30 * dot(c, c) * 2.0;
  o = vec4(col * vign, 1.0);
}`;

export function setupLorenzGL(canvas) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const splatProg = composeProg(gl, VS_SPLAT, FS_SPLAT);
  const decayProg = composeProg(gl, VS_QUAD, FS_DECAY);
  const composeProgGL = composeProg(gl, VS_QUAD, FS_COMPOSE);
  const W = canvas.width, H = canvas.height;
  const accumA = createFBO(gl, W, H);
  const accumB = createFBO(gl, W, H);
  let acc = accumA, tmp = accumB;
  const sceneFBO = createFBO(gl, W, H);
  const post = setupPostProcess(gl, W, H);

  const quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const posVBO = gl.createBuffer();

  function clearAccum() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, accumA.fbo); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, accumB.fbo); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function uploadPositions(state) {
    gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
    gl.bufferData(gl.ARRAY_BUFFER, state, gl.STREAM_DRAW);
  }

  function splat(viewMat, projMat, N, intensity = 0.15, pointSize = 1.8) {
    gl.useProgram(splatProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fbo);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    const mvp = matMul(projMat, viewMat);
    gl.uniformMatrix4fv(gl.getUniformLocation(splatProg, 'uMVP'), false, mvp);
    gl.uniform1f(gl.getUniformLocation(splatProg, 'uPointSize'), pointSize);
    gl.uniform1f(gl.getUniformLocation(splatProg, 'uIntensity'), intensity);
    gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disable(gl.BLEND);
  }

  function decay(alpha) {
    gl.useProgram(decayProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmp.fbo);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, acc.tex);
    gl.uniform1i(gl.getUniformLocation(decayProg, 'uAccum'), 0);
    gl.uniform1f(gl.getUniformLocation(decayProg, 'uAlpha'), alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [acc, tmp] = [tmp, acc];
  }

  function compose() {
    // First into sceneFBO, then post-process to default fb.
    gl.useProgram(composeProgGL);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, acc.tex);
    gl.uniform1i(gl.getUniformLocation(composeProgGL, 'uAccum'), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    post.run(sceneFBO.tex, 0.85, 0.25, 0.55);
  }

  return { gl, clearAccum, uploadPositions, splat, decay, compose };
}

// Local helpers (named composeProg to avoid colliding with compileProgram's signature).
function composeProg(gl, vs, fs) { return compileProgram(gl, vs, fs); }

function matMul(a, b) {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    let s = 0; for (let k = 0; k < 4; k += 1) s += a[i + 4 * k] * b[k + 4 * j];
    r[i + 4 * j] = s;
  }
  return r;
}
