// WebGL2 volume ray-march for hydrogen orbital |psi|^2.
// JS computes the density on a 32^3 grid via shared/js/engine/hydrogen-orbital-cpu.js,
// uploads as TEXTURE_3D (R16F), then the fragment shader marches rays through a unit
// bounding box and accumulates emission. ACES + vignette on the final pass.
// Reference: Wittenbrink et al. 1998 (`gpugems`); Eisberg-Resnick Ch. 5 (`eisberg-resnick`).
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { densityAt } from '../engine/hydrogen-orbital-cpu.js';

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const FS_RAY = `#version 300 es
precision highp float;
precision highp sampler3D;
in vec2 uv;
uniform sampler3D uVolume;
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform float uTime;
out vec4 oColor;

vec3 viridis(float t) {
  t = clamp(t, 0.0, 1.0);
  return vec3(clamp(0.267 + 0.105*t - 0.330*t*t + 1.000*t*t*t, 0.0, 1.0),
              clamp(0.005 + 1.404*t - 0.479*t*t, 0.0, 1.0),
              clamp(0.329 + 0.749*t - 0.972*t*t, 0.0, 1.0));
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

bool boxIntersect(vec3 ro, vec3 rd, out float tEnter, out float tExit) {
  vec3 inv = 1.0 / rd;
  vec3 t0 = (vec3(-1.0) - ro) * inv;
  vec3 t1 = (vec3(1.0) - ro) * inv;
  vec3 tmin = min(t0, t1), tmax = max(t0, t1);
  tEnter = max(max(tmin.x, tmin.y), tmin.z);
  tExit = min(min(tmax.x, tmax.y), tmax.z);
  return tExit > max(tEnter, 0.0);
}

void main() {
  // Compute world ray from NDC.
  vec4 nearWorld = uInvViewProj * vec4(uv * 2.0 - 1.0, -1.0, 1.0);
  vec4 farWorld = uInvViewProj * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
  vec3 ro = nearWorld.xyz / nearWorld.w;
  vec3 rd = normalize(farWorld.xyz / farWorld.w - ro);
  float t0, t1;
  if (!boxIntersect(ro, rd, t0, t1)) { oColor = vec4(0.02, 0.02, 0.025, 1.0); return; }
  t0 = max(t0, 0.0);
  int STEPS = 96;
  float dt = (t1 - t0) / float(STEPS);
  vec3 col = vec3(0.0); float trans = 1.0;
  for (int i = 0; i < 96; i += 1) {
    vec3 p = ro + (t0 + (float(i) + 0.5) * dt) * rd;
    vec3 sp = p * 0.5 + 0.5;
    float d = texture(uVolume, sp).r;
    float emit = d * 8.0;
    col += trans * viridis(min(1.0, d * 12.0)) * emit * dt;
    trans *= exp(-d * 6.0 * dt);
    if (trans < 0.01) break;
  }
  vec2 cv = uv - 0.5;
  float vign = 1.0 - 0.3 * dot(cv, cv) * 2.0;
  oColor = vec4(aces(col * vign), 1.0);
}`;

export function setupOrbitalGL(canvas, gridSize = 32) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const prog = compileProgram(gl, VS_QUAD, FS_RAY);
  // 3D texture.
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_3D, tex);
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F, gridSize, gridSize, gridSize, 0, gl.RED, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  function fillVolume(n, l, m) {
    // Compute |psi|^2 on the cube [-rmax, rmax]^3 with rmax ~ 6 a_0 n.
    const rmax = 6 * n;
    const data = new Float32Array(gridSize ** 3);
    let dmax = 1e-30;
    for (let k = 0; k < gridSize; k += 1) for (let j = 0; j < gridSize; j += 1) for (let i = 0; i < gridSize; i += 1) {
      const X = ((i + 0.5) / gridSize - 0.5) * 2 * rmax;
      const Y = ((j + 0.5) / gridSize - 0.5) * 2 * rmax;
      const Z = ((k + 0.5) / gridSize - 0.5) * 2 * rmax;
      const r = Math.hypot(X, Y, Z);
      const theta = Math.acos(Math.max(-1, Math.min(1, Z / Math.max(r, 1e-6))));
      const phi = Math.atan2(Y, X);
      const d = densityAt(r, theta, phi, n, l, m);
      const idx = k * gridSize * gridSize + j * gridSize + i;
      data[idx] = d;
      if (d > dmax) dmax = d;
    }
    for (let i = 0; i < data.length; i += 1) data[i] /= dmax;
    // Convert Float32 -> Uint16 half-floats.
    const half = new Uint16Array(data.length);
    for (let i = 0; i < data.length; i += 1) half[i] = floatToHalf(data[i]);
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, gridSize, gridSize, gridSize, gl.RED, gl.HALF_FLOAT, half);
  }
  function render(t) {
    const W = canvas.width, H = canvas.height;
    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uVolume'), 0);
    // Orbit camera.
    const az = Math.PI * 0.3 + t * 0.1;
    const el = 0.4;
    const r = 3.5;
    const eye = [r * Math.cos(el) * Math.cos(az), r * Math.sin(el), r * Math.cos(el) * Math.sin(az)];
    const tgt = [0, 0, 0]; const up = [0, 1, 0];
    const view = lookAt(eye, tgt, up);
    const proj = perspective(45 * Math.PI / 180, W / H, 0.1, 100);
    const vp = matMul(proj, view);
    const inv = invert(vp);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uInvViewProj'), false, inv);
    gl.uniform3f(gl.getUniformLocation(prog, 'uCamPos'), eye[0], eye[1], eye[2]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), t);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { fillVolume, render };
}

// Float32 to half-float (IEEE 754 binary16).
function floatToHalf(f) {
  if (f === 0) return 0;
  const sign = f < 0 ? 0x8000 : 0;
  const af = Math.abs(f);
  const e = Math.floor(Math.log2(af));
  const m = Math.round((af / Math.pow(2, e) - 1) * 1024);
  const exp = e + 15;
  if (exp >= 31) return sign | 0x7c00;
  if (exp <= 0) return sign;
  return sign | (exp << 10) | (m & 0x3ff);
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
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
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
function invert(m) {
  // 4x4 inverse (column-major). Use a brute formula.
  const inv = new Float32Array(16);
  const e = m;
  inv[0]=e[5]*e[10]*e[15]-e[5]*e[11]*e[14]-e[9]*e[6]*e[15]+e[9]*e[7]*e[14]+e[13]*e[6]*e[11]-e[13]*e[7]*e[10];
  inv[4]=-e[4]*e[10]*e[15]+e[4]*e[11]*e[14]+e[8]*e[6]*e[15]-e[8]*e[7]*e[14]-e[12]*e[6]*e[11]+e[12]*e[7]*e[10];
  inv[8]=e[4]*e[9]*e[15]-e[4]*e[11]*e[13]-e[8]*e[5]*e[15]+e[8]*e[7]*e[13]+e[12]*e[5]*e[11]-e[12]*e[7]*e[9];
  inv[12]=-e[4]*e[9]*e[14]+e[4]*e[10]*e[13]+e[8]*e[5]*e[14]-e[8]*e[6]*e[13]-e[12]*e[5]*e[10]+e[12]*e[6]*e[9];
  inv[1]=-e[1]*e[10]*e[15]+e[1]*e[11]*e[14]+e[9]*e[2]*e[15]-e[9]*e[3]*e[14]-e[13]*e[2]*e[11]+e[13]*e[3]*e[10];
  inv[5]=e[0]*e[10]*e[15]-e[0]*e[11]*e[14]-e[8]*e[2]*e[15]+e[8]*e[3]*e[14]+e[12]*e[2]*e[11]-e[12]*e[3]*e[10];
  inv[9]=-e[0]*e[9]*e[15]+e[0]*e[11]*e[13]+e[8]*e[1]*e[15]-e[8]*e[3]*e[13]-e[12]*e[1]*e[11]+e[12]*e[3]*e[9];
  inv[13]=e[0]*e[9]*e[14]-e[0]*e[10]*e[13]-e[8]*e[1]*e[14]+e[8]*e[2]*e[13]+e[12]*e[1]*e[10]-e[12]*e[2]*e[9];
  inv[2]=e[1]*e[6]*e[15]-e[1]*e[7]*e[14]-e[5]*e[2]*e[15]+e[5]*e[3]*e[14]+e[13]*e[2]*e[7]-e[13]*e[3]*e[6];
  inv[6]=-e[0]*e[6]*e[15]+e[0]*e[7]*e[14]+e[4]*e[2]*e[15]-e[4]*e[3]*e[14]-e[12]*e[2]*e[7]+e[12]*e[3]*e[6];
  inv[10]=e[0]*e[5]*e[15]-e[0]*e[7]*e[13]-e[4]*e[1]*e[15]+e[4]*e[3]*e[13]+e[12]*e[1]*e[7]-e[12]*e[3]*e[5];
  inv[14]=-e[0]*e[5]*e[14]+e[0]*e[6]*e[13]+e[4]*e[1]*e[14]-e[4]*e[2]*e[13]-e[12]*e[1]*e[6]+e[12]*e[2]*e[5];
  inv[3]=-e[1]*e[6]*e[11]+e[1]*e[7]*e[10]+e[5]*e[2]*e[11]-e[5]*e[3]*e[10]-e[9]*e[2]*e[7]+e[9]*e[3]*e[6];
  inv[7]=e[0]*e[6]*e[11]-e[0]*e[7]*e[10]-e[4]*e[2]*e[11]+e[4]*e[3]*e[10]+e[8]*e[2]*e[7]-e[8]*e[3]*e[6];
  inv[11]=-e[0]*e[5]*e[11]+e[0]*e[7]*e[9]+e[4]*e[1]*e[11]-e[4]*e[3]*e[9]-e[8]*e[1]*e[7]+e[8]*e[3]*e[5];
  inv[15]=e[0]*e[5]*e[10]-e[0]*e[6]*e[9]-e[4]*e[1]*e[10]+e[4]*e[2]*e[9]+e[8]*e[1]*e[6]-e[8]*e[2]*e[5];
  let det = e[0]*inv[0]+e[1]*inv[4]+e[2]*inv[8]+e[3]*inv[12];
  if (Math.abs(det) < 1e-12) return inv;
  det = 1 / det;
  for (let i = 0; i < 16; i += 1) inv[i] *= det;
  return inv;
}
