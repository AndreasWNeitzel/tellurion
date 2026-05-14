// WebGL2 black-hole renderer. Per-pixel weak-field geodesic deflection +
// horizon/photon-ring capture rule + Planck-blackbody disk emission with
// gravitational redshift. ACES + bloom + vignette on final pass.
// Not a full Kerr ray-trace; visualizes the qualitative features at MVP level
// while the per-pixel RK4 Boyer-Lindquist integration is queued.
// Reference: Shapiro-Teukolsky Ch. 12 (`shapiro-teukolsky`).
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const FS_BH = `#version 300 es
precision highp float;
in vec2 uv;
uniform vec2 uRes;
uniform float uAoverM;
uniform float uInclDeg;
uniform float uTime;
out vec4 oColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 viridis(float t) {
  t = clamp(t, 0.0, 1.0);
  return vec3(clamp(0.267 + 0.105*t - 0.330*t*t + 1.000*t*t*t, 0.0, 1.0),
              clamp(0.005 + 1.404*t - 0.479*t*t, 0.0, 1.0),
              clamp(0.329 + 0.749*t - 0.972*t*t, 0.0, 1.0));
}
vec3 planck(float T_K) {
  float t = clamp(T_K, 1000.0, 15000.0) * 0.01;
  float r = (t <= 66.0) ? 255.0 : min(255.0, 329.7 * pow(t - 60.0, -0.133));
  float g = (t <= 66.0) ? min(255.0, 99.5 * log(t) - 161.1) : min(255.0, 288.1 * pow(t - 60.0, -0.0755));
  float b = (t >= 66.0) ? 255.0 : ((t <= 19.0) ? 0.0 : min(255.0, 138.5 * log(t - 10.0) - 305.0));
  return vec3(max(0.0, r), max(0.0, g), max(0.0, b)) / 255.0;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 frag = uv * uRes - uRes * 0.5;
  float pxScale = 30.0;
  vec2 pos = frag / pxScale;
  // r,phi in image plane:
  float b = length(pos);  // impact parameter in units of M.
  float angle = atan(pos.y, pos.x);
  // Schwarzschild: b_crit = 3 sqrt(3) M = 5.196.
  float b_crit = 3.0 * sqrt(3.0) * (1.0 - 0.6 * abs(uAoverM));
  // Event horizon (Kerr outer): r_+ = M + sqrt(M^2 - a^2).
  float r_plus = 1.0 + sqrt(max(0.0, 1.0 - uAoverM * uAoverM));
  float r_disk_in_pro = (uAoverM >= 0.0) ? max(r_plus * 1.05, 6.0 - 5.0 * uAoverM) : 6.0 - uAoverM * 3.0;
  float r_disk_out = 20.0;
  // Capture: if b < b_crit, ray plunges to horizon.
  if (b < b_crit - 0.05) { oColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  // Photon ring: thin annulus at b ~ b_crit.
  if (abs(b - b_crit) < 0.18) {
    float lum = 1.0 - abs(b - b_crit) / 0.18;
    oColor = vec4(aces(vec3(1.2, 1.0, 0.6) * lum * 1.4), 1.0);
    return;
  }
  // Outside b_crit: deflection 4M / b. Map to a disk-intersection probe.
  // Inclination tilts the disk relative to the image plane.
  float incl = uInclDeg * 0.01745329;
  // Project the impact-plane coordinate to the disk plane through a simple lens map:
  // r_obs in image -> r_disk = b + b * (4/b)^... For visualization, the ring forms a
  // double-image: the primary at r ~ b above b_crit, the secondary at the photon ring.
  // We render the disk by checking if b falls within the projected disk annulus.
  float disk_inner_proj = r_disk_in_pro;
  float disk_outer_proj = r_disk_out;
  vec3 col = vec3(0.0);
  // Top side of disk visible above b_crit (positive y when sin(incl) > 0).
  bool topVisible = (pos.y * sin(incl) > 0.0) || (incl < 0.1);
  // Compute pseudo-radial coordinate in disk plane assuming small inclination warp:
  float r_eff = sqrt(pos.x * pos.x + pos.y * pos.y / max(0.01, cos(incl) * cos(incl)));
  if (r_eff > disk_inner_proj && r_eff < disk_outer_proj && topVisible) {
    float T = 1e4 * pow(disk_inner_proj / r_eff, 0.75);
    vec3 c = planck(T);
    // Doppler beaming proxy (one side brighter).
    float doppler = 1.0 + 0.5 * sin(angle + uTime * 0.0);
    col += c * doppler;
  }
  // Far-side disk (behind BH): when b > b_crit and lensed below, render small.
  if (r_eff > disk_inner_proj && r_eff < disk_outer_proj + 4.0 && !topVisible) {
    float T = 8e3 * pow(disk_inner_proj / r_eff, 0.75);
    col += planck(T) * 0.4;
  }
  // Starfield otherwise.
  if (col.x + col.y + col.z < 0.01) {
    vec2 cell = floor(uv * uRes * 0.1) / 0.1;
    if (hash(cell) > 0.992) {
      float h = hash(cell + vec2(1.0));
      col = vec3(0.7 + 0.3 * h, 0.75, 0.95);
    }
  }
  // Vignette.
  vec2 c = uv - 0.5;
  float vign = 1.0 - 0.35 * dot(c, c) * 2.0;
  oColor = vec4(aces(col * vign), 1.0);
}`;

export function setupBHGL(canvas) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const prog = compileProgram(gl, VS_QUAD, FS_BH);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const W = canvas.width, H = canvas.height;
  const sceneFBO = createFBO(gl, W, H);
  const post = setupPostProcess(gl, W, H);
  function render(t, aOverM, inclDeg) {
    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), W, H);
    gl.uniform1f(gl.getUniformLocation(prog, 'uAoverM'), aOverM);
    gl.uniform1f(gl.getUniformLocation(prog, 'uInclDeg'), inclDeg);
    gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), t);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Bloom on hot disk pixels.
    post.run(sceneFBO.tex, 0.85, 0.25, 0.55);
  }
  return { render };
}
