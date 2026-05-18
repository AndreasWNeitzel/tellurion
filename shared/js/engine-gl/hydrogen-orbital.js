// WebGL2 volume ray-march for hydrogen orbital |psi|^2.
// JS computes the density on a 32^3 grid via shared/js/engine/hydrogen-orbital-cpu.js,
// uploads as TEXTURE_3D (R16F), then the fragment shader marches rays through a unit
// bounding box and accumulates emission. ACES + vignette on the final pass.
// Reference: Wittenbrink et al. 1998 (`gpugems`); Eisberg-Resnick Ch. 5 (`eisberg-resnick`).
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';
import { densityAt, phaseFullAt } from '../engine/hydrogen-orbital-cpu.js';

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
uniform int uMode;             // 0 = density emission, 1 = isosurface, 2 = phase.
uniform float uIsoThreshold;   // density threshold for isosurface.
out vec4 oColor;

vec3 hsv2rgb(float h, float s, float v) {
  vec3 p = abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
  return v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s);
}
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
  bool hitBox = boxIntersect(ro, rd, t0, t1);
  vec3 col = vec3(0.0);
  if (hitBox) {
  t0 = max(t0, 0.0);
  int STEPS = 160;
  float dt = (t1 - t0) / float(STEPS);
  if (uMode == 1) {
    // Isosurface: march to the first crossing, then a few bisection
    // steps for a smooth (non-stairstepped) surface. Lobes are coloured
    // by the wavefunction sign (the classic two-tone orbital look) and
    // lit with a key + fill + a luminous fresnel rim.
    bool hit = false;
    float tPrev = t0;
    float tHit = t0;
    for (int i = 0; i < 160; i += 1) {
      float tc = t0 + (float(i) + 0.5) * dt;
      vec3 sp = (ro + tc * rd) * 0.5 + 0.5;
      if (texture(uVolume, sp).r > uIsoThreshold) { hit = true; tHit = tc; break; }
      tPrev = tc;
    }
    if (hit) {
      float ta = tPrev, tb = tHit;
      for (int b = 0; b < 6; b += 1) {
        float tm = 0.5 * (ta + tb);
        vec3 spm = (ro + tm * rd) * 0.5 + 0.5;
        if (texture(uVolume, spm).r > uIsoThreshold) tb = tm; else ta = tm;
      }
      vec3 pHit = ro + tb * rd;
      vec3 sp = pHit * 0.5 + 0.5;
      vec3 step3 = vec3(1.0 / 56.0);
      float dxp = texture(uVolume, sp + vec3(step3.x, 0, 0)).r;
      float dxn = texture(uVolume, sp - vec3(step3.x, 0, 0)).r;
      float dyp = texture(uVolume, sp + vec3(0, step3.y, 0)).r;
      float dyn = texture(uVolume, sp - vec3(0, step3.y, 0)).r;
      float dzp = texture(uVolume, sp + vec3(0, 0, step3.z)).r;
      float dzn = texture(uVolume, sp - vec3(0, 0, step3.z)).r;
      vec3 n = normalize(-vec3(dxp - dxn, dyp - dyn, dzp - dzn));
      vec3 V = normalize(uCamPos - pHit);
      vec3 L1 = normalize(vec3(0.5, 0.85, 0.35));
      vec3 L2 = normalize(vec3(-0.45, -0.15, -0.6));
      vec3 H1 = normalize(L1 + V);
      float diff = 0.55 * max(0.0, dot(n, L1)) + 0.22 * max(0.0, dot(n, L2)) + 0.20;
      float spec = pow(max(0.0, dot(n, H1)), 42.0) * 0.55;
      // Sign of the wavefunction from the phase channel: opposite-sign
      // lobes get complementary colours (gold / teal), not a flat ramp.
      float g = texture(uVolume, sp).g;
      float s = smoothstep(-0.18, 0.18, cos(6.2831853 * g));
      vec3 gold = vec3(1.00, 0.74, 0.36);
      vec3 teal = vec3(0.26, 0.78, 0.92);
      vec3 albedo = mix(teal, gold, s);
      float fres = pow(1.0 - max(0.0, dot(n, V)), 3.0);
      vec3 rim = fres * mix(vec3(0.45, 0.75, 1.0), albedo, 0.4) * 0.7;
      col = albedo * diff + vec3(spec) + rim;
    } else {
      col = vec3(0.02, 0.02, 0.03);
    }
  } else if (uMode == 2) {
    // Phase view: hue = arg(psi) (azimuthal winding + nodal sign),
    // opacity/brightness from |psi|^2. Genuinely distinct from the
    // density view, which is phase-independent.
    float trans = 1.0;
    for (int i = 0; i < 160; i += 1) {
      vec3 p = ro + (t0 + (float(i) + 0.5) * dt) * rd;
      vec3 sp = p * 0.5 + 0.5;
      vec2 rg = texture(uVolume, sp).rg;
      float d = rg.r;
      float dc = pow(d, 0.7);                  // contrast: crisp lobes
      vec3 hue = hsv2rgb(rg.g, 0.85, 1.0);
      col += trans * hue * dc * 10.0 * dt;
      trans *= exp(-dc * 7.0 * dt);
      if (trans < 0.01) break;
    }
  } else {
    // Density emission. A contrast power on the sampled density
    // tightens the lobes so the orbital reads sharply rather than as a
    // fuzzy blob.
    float trans = 1.0;
    for (int i = 0; i < 160; i += 1) {
      vec3 p = ro + (t0 + (float(i) + 0.5) * dt) * rd;
      vec3 sp = p * 0.5 + 0.5;
      float d = texture(uVolume, sp).r;
      float dc = pow(d, 0.6);
      float emit = dc * 9.0;
      col += trans * viridis(min(1.0, dc * 1.4)) * emit * dt;
      trans *= exp(-dc * 9.0 * dt);
      if (trans < 0.01) break;
    }
  }
  }
  vec2 cv = uv - 0.5;
  float vign = 1.0 - 0.3 * dot(cv, cv) * 2.0;
  vec3 outc = hitBox ? aces(col * vign) : vec3(0.02, 0.02, 0.025);

  // Screen-space colour key. Without it the viewer cannot tell which
  // quantity the colours encode (the spec promises three distinct
  // schemes). Time independent and uv only, so deterministic capture
  // stays pixel stable. mode 0 viridis = probability density, mode 2
  // hue ramp = wavefunction phase, mode 1 two tone = sign of psi.
  float bx0 = 0.904, bx1 = 0.946, by0 = 0.34, by1 = 0.82;
  float fx0 = bx0 - 0.014, fx1 = bx1 + 0.014, fy0 = by0 - 0.030, fy1 = by1 + 0.030;
  float inBar = step(bx0, uv.x) * step(uv.x, bx1) * step(by0, uv.y) * step(uv.y, by1);
  float inFrame = step(fx0, uv.x) * step(uv.x, fx1) * step(fy0, uv.y) * step(uv.y, fy1);
  float tBar = clamp((uv.y - by0) / (by1 - by0), 0.0, 1.0);
  vec3 keyCol;
  if (uMode == 2) keyCol = hsv2rgb(tBar, 0.85, 1.0);
  else if (uMode == 1) keyCol = mix(vec3(0.26, 0.78, 0.92), vec3(1.00, 0.74, 0.36), step(0.5, tBar));
  else keyCol = viridis(tBar);
  keyCol *= 0.92;                                         // tame bloom on the bright end
  float edgeRing = inFrame * (1.0 - inBar);
  outc = mix(outc, vec3(0.03, 0.03, 0.05), inFrame * 0.82);   // dark backplate
  outc = mix(outc, vec3(0.62, 0.66, 0.72), edgeRing * 0.9);   // light border ring
  outc = mix(outc, keyCol, inBar);
  oColor = vec4(outc, 1.0);
}`;

export function setupOrbitalGL(canvas, gridSize = 32) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const prog = compileProgram(gl, VS_QUAD, FS_RAY);
  // 3D texture.
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_3D, tex);
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.RG16F, gridSize, gridSize, gridSize, 0, gl.RG, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const W = canvas.width, H = canvas.height;
  const sceneFBO = createFBO(gl, W, H);
  const post = setupPostProcess(gl, W, H);
  function fillVolume(n, l, m) {
    // The orbital mean radius scales like 1.5 n^2 a_0. Use 2.5 n^2 so the
    // density at the box wall is well below 1e-4 of peak even for n_max.
    const rmax = Math.max(12, 2.5 * n * n);
    const N3 = gridSize ** 3;
    const dens = new Float32Array(N3);
    const ph01 = new Float32Array(N3);
    let dmax = 1e-30;
    for (let k = 0; k < gridSize; k += 1) for (let j = 0; j < gridSize; j += 1) for (let i = 0; i < gridSize; i += 1) {
      const X = ((i + 0.5) / gridSize - 0.5) * 2 * rmax;
      const Y = ((j + 0.5) / gridSize - 0.5) * 2 * rmax;
      const Z = ((k + 0.5) / gridSize - 0.5) * 2 * rmax;
      const r = Math.hypot(X, Y, Z);
      const theta = Math.acos(Math.max(-1, Math.min(1, Z / Math.max(r, 1e-6))));
      const phi = Math.atan2(Y, X);
      const idx = k * gridSize * gridSize + j * gridSize + i;
      const d = densityAt(r, theta, phi, n, l, m);
      dens[idx] = d;
      ph01[idx] = phaseFullAt(r, theta, phi, n, l, m) / (2 * Math.PI);
      if (d > dmax) dmax = d;
    }
    // Interleaved RG half-float: R = normalized density, G = phase/2pi.
    const half = new Uint16Array(N3 * 2);
    for (let i = 0; i < N3; i += 1) {
      half[2 * i] = floatToHalf(dens[i] / dmax);
      half[2 * i + 1] = floatToHalf(ph01[i]);
    }
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, gridSize, gridSize, gridSize, gl.RG, gl.HALF_FLOAT, half);
  }
  function render(t, mode = 0, isoThreshold = 0.05, azDeg, elDeg, distance) {
    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uVolume'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uMode'), mode);
    gl.uniform1f(gl.getUniformLocation(prog, 'uIsoThreshold'), isoThreshold);
    // Camera: external az/el/dist if given, otherwise the original orbiting default.
    const az = azDeg != null ? azDeg * Math.PI / 180 : Math.PI * 0.3 + t * 0.1;
    const el = elDeg != null ? elDeg * Math.PI / 180 : 0.4;
    const r = distance != null ? distance * 3.5 : 3.5;
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
    // Bloom on bright voxels (emission-only volumes).
    post.run(sceneFBO.tex, 0.75, 0.25, 0.5);
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
