// WebGL2 wave equation solver. Two RGBA16F textures ping-pong:
//   color.r = u(x, y, n), color.g = u(x, y, n-1).
// Each step samples 4 neighbors + center + previous frame, writes a new texture.
// Render pass: read u texture, displace y on a triangle mesh, Blinn-Phong shade.
// Reference: NVIDIA GPU Gems Ch. 1 (`gpugems`); French Waves Ch. 6 (`french-waves`).
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const FS_STEP = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uState;     // .r = u^n, .g = u^{n-1}
uniform vec2 uTexelSize;
uniform float uCDtSqOverDxSq;
uniform float uDamping;
out vec4 o;
void main() {
  vec4 s = texture(uState, uv);
  float u = s.r, uPrev = s.g;
  float uL = texture(uState, uv - vec2(uTexelSize.x, 0.0)).r;
  float uR = texture(uState, uv + vec2(uTexelSize.x, 0.0)).r;
  float uD = texture(uState, uv - vec2(0.0, uTexelSize.y)).r;
  float uU = texture(uState, uv + vec2(0.0, uTexelSize.y)).r;
  float lap = uL + uR + uD + uU - 4.0 * u;
  // Dirichlet boundaries: force zero at edges.
  if (uv.x < uTexelSize.x || uv.x > 1.0 - uTexelSize.x
      || uv.y < uTexelSize.y || uv.y > 1.0 - uTexelSize.y) {
    o = vec4(0.0, 0.0, 0.0, 1.0); return;
  }
  float uNew = (2.0 * u - uPrev + uCDtSqOverDxSq * lap) / (1.0 + uDamping);
  o = vec4(uNew, u, 0.0, 1.0);
}`;

const FS_SEED = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uState;
uniform vec2 uCenter;
uniform float uAmp;
uniform float uSigma;
out vec4 o;
void main() {
  vec4 s = texture(uState, uv);
  float r2 = dot(uv - uCenter, uv - uCenter);
  float g = uAmp * exp(-r2 / (uSigma * uSigma));
  o = vec4(s.r + g, s.g + g, 0.0, 1.0);
}`;

// Render pass: displaced grid mesh with Blinn-Phong + viridis diffuse LUT.
const VS_SURF = `#version 300 es
layout(location = 0) in vec2 aGrid;
uniform sampler2D uState;
uniform mat4 uMVP;
uniform float uHeight;
uniform float uInvN;
out vec3 vWorldPos;
out vec3 vNormal;
out float vH;
void main() {
  float h = texture(uState, aGrid).r * uHeight;
  vec2 dx = vec2(uInvN, 0.0);
  vec2 dy = vec2(0.0, uInvN);
  float hL = texture(uState, aGrid - dx).r * uHeight;
  float hR = texture(uState, aGrid + dx).r * uHeight;
  float hD = texture(uState, aGrid - dy).r * uHeight;
  float hU = texture(uState, aGrid + dy).r * uHeight;
  vec3 dxV = vec3(2.0 * uInvN, hR - hL, 0.0);
  vec3 dyV = vec3(0.0, hU - hD, 2.0 * uInvN);
  vNormal = normalize(cross(dyV, dxV));
  vec3 worldPos = vec3(aGrid.x * 2.0 - 1.0, h, aGrid.y * 2.0 - 1.0);
  vWorldPos = worldPos;
  vH = h;
  gl_Position = uMVP * vec4(worldPos, 1.0);
}`;

const FS_SURF = `#version 300 es
precision highp float;
in vec3 vWorldPos;
in vec3 vNormal;
in float vH;
uniform vec3 uCamPos;
out vec4 oColor;
// Coolwarm diverging: zero -> white, +height -> warm, -height -> cool.
vec3 coolwarm(float t) {
  t = clamp(t, 0.0, 1.0);
  float x = t * 2.0 - 1.0;
  if (x < 0.0) {
    float a = -x;
    return vec3(1.0 - a * (1.0 - 0.23), 1.0 - a * (1.0 - 0.30), 1.0 - a * (1.0 - 0.75));
  }
  return vec3(1.0 - x * (1.0 - 0.71), 1.0 - x * (1.0 - 0.02), 1.0 - x * (1.0 - 0.15));
}
vec3 aces(vec3 x) {
  float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCamPos - vWorldPos);
  // Key light from upper-right, elevation 50 deg.
  vec3 lKey = normalize(vec3(0.6, 1.2, 0.4));
  vec3 lFill = normalize(vec3(-0.4, 0.3, 0.6));
  vec3 lRim = normalize(vec3(0.0, 0.2, -1.0));
  // Map signed height to coolwarm.
  vec3 albedo = coolwarm(clamp(vH * 0.9 + 0.5, 0.0, 1.0));
  vec3 cKey = vec3(1.0, 0.95, 0.8), cFill = vec3(0.5, 0.7, 1.0), cRim = vec3(0.7, 0.85, 1.0);
  vec3 col = vec3(0.0);
  vec3 hVec = normalize(lKey + v);
  // Specular exponent 60 for visible crest glint.
  float spec = pow(max(0.0, dot(n, hVec)), 60.0);
  col += cKey * albedo * max(0.0, dot(n, lKey));
  col += cKey * spec * 1.6;
  col += cFill * albedo * max(0.0, dot(n, lFill)) * 0.30;
  col += cRim * pow(max(0.0, dot(n, lRim)), 4.0) * 0.60;
  col += albedo * 0.10;
  oColor = vec4(aces(col), 1.0);
}`;

export function setupWave2DGL(canvas, N = 96) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const stepProg = compileProgram(gl, VS_QUAD, FS_STEP);
  const seedProg = compileProgram(gl, VS_QUAD, FS_SEED);
  const surfProg = compileProgram(gl, VS_SURF, FS_SURF);
  // Two ping-pong FBOs.
  let A = createFBO(gl, N, N), B = createFBO(gl, N, N);
  // Quad VBO.
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  // Grid mesh for surface render (NxN quads -> 6 vertices each).
  const grid_verts = [];
  for (let j = 0; j < N - 1; j += 1) for (let i = 0; i < N - 1; i += 1) {
    const u0 = i / (N - 1), u1 = (i + 1) / (N - 1), v0 = j / (N - 1), v1 = (j + 1) / (N - 1);
    grid_verts.push(u0, v0, u1, v0, u0, v1, u1, v0, u1, v1, u0, v1);
  }
  const meshVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, meshVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid_verts), gl.STATIC_DRAW);
  const meshVertexCount = grid_verts.length / 2;

  function step(c, gamma, dt) {
    const a = c * c * dt * dt;
    gl.useProgram(stepProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo);
    gl.viewport(0, 0, N, N);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(gl.getUniformLocation(stepProg, 'uState'), 0);
    gl.uniform2f(gl.getUniformLocation(stepProg, 'uTexelSize'), 1 / N, 1 / N);
    gl.uniform1f(gl.getUniformLocation(stepProg, 'uCDtSqOverDxSq'), a);
    gl.uniform1f(gl.getUniformLocation(stepProg, 'uDamping'), gamma * dt);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [A, B] = [B, A];
  }
  function seed(cx, cy, A_amp, sigma_grid) {
    gl.useProgram(seedProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo);
    gl.viewport(0, 0, N, N);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(gl.getUniformLocation(seedProg, 'uState'), 0);
    gl.uniform2f(gl.getUniformLocation(seedProg, 'uCenter'), cx / N, cy / N);
    gl.uniform1f(gl.getUniformLocation(seedProg, 'uAmp'), A_amp);
    gl.uniform1f(gl.getUniformLocation(seedProg, 'uSigma'), sigma_grid / N);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [A, B] = [B, A];
  }
  function reset() {
    [A, B].forEach(fbo => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    });
  }
  let sceneFBO = null, post = null;
  function ensureScene(w, h) {
    if (!sceneFBO || sceneFBO.w !== w || sceneFBO.h !== h) {
      sceneFBO = createFBO(gl, w, h, { depth: true });
      post = setupPostProcess(gl, w, h);
    }
  }
  function renderSurfaceWithCamera(width, height, height_scale, viewMat, projMat, eye) {
    ensureScene(width, height);
    gl.useProgram(surfProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.024, 0.024, 0.031, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    const mvp = matMul(projMat, viewMat);
    gl.uniformMatrix4fv(gl.getUniformLocation(surfProg, 'uMVP'), false, mvp);
    gl.uniform3f(gl.getUniformLocation(surfProg, 'uCamPos'), eye[0], eye[1], eye[2]);
    gl.uniform1f(gl.getUniformLocation(surfProg, 'uHeight'), height_scale);
    gl.uniform1f(gl.getUniformLocation(surfProg, 'uInvN'), 1.0 / N);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(gl.getUniformLocation(surfProg, 'uState'), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, meshVertexCount);
    gl.disable(gl.DEPTH_TEST);
    post.run(sceneFBO.tex, 0.95, 0.25, 0.4);
  }
  function renderSurface(width, height, height_scale, azDeg, elDeg, distance) {
    const az = (azDeg ?? 45) * Math.PI / 180;
    const el = (elDeg ?? 30) * Math.PI / 180;
    const r = distance ?? 3.0;
    const eye = [r * Math.cos(el) * Math.cos(az), r * Math.sin(el), r * Math.cos(el) * Math.sin(az)];
    const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const proj = perspective(50 * Math.PI / 180, width / height, 0.1, 100);
    renderSurfaceWithCamera(width, height, height_scale, view, proj, eye);
  }
  function readback() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, A.fbo);
    const buf = new Float32Array(N * N * 4);
    gl.readPixels(0, 0, N, N, gl.RGBA, gl.FLOAT, buf);
    return buf;
  }
  return { gl, step, seed, reset, renderSurface, renderSurfaceWithCamera, readback, N };
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
