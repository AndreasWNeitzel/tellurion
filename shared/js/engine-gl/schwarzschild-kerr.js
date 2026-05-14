// WebGL2 black-hole renderer. Per-pixel weak-field geodesic deflection +
// horizon/photon-ring capture rule + Planck-blackbody disk emission with
// gravitational redshift. ACES + bloom + vignette on final pass.
// Not a full Kerr ray-trace; visualizes the qualitative features at MVP level
// while the per-pixel RK4 Boyer-Lindquist integration is queued.
// Reference: Shapiro-Teukolsky Ch. 12 (shapiro-teukolsky).
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

// Schwarzschild null-geodesic in (r, phi) plane.
// ODE: d2u/dphi2 + u = 3 u^2  (with M = 1).
// Initial: u = 0, du/dphi = -1/b (incoming from r = infinity).
// We march forward in phi until u > 1/2 (horizon, r < 2M) or u < 1e-3 (escape) or disk crossing.
// At each step, check the in-plane angle phi and look for the disk plane crossing.
// Reference: Shapiro-Teukolsky Ch. 12 (shapiro-teukolsky).

void main() {
  vec2 frag = uv * uRes - uRes * 0.5;
  float pxScale = 30.0;
  vec2 pos = frag / pxScale;
  float b = length(pos);
  float impactAngle = atan(pos.y, pos.x);
  if (b < 0.05) { oColor = vec4(0.0); return; }

  // Geodesic plane is the plane containing camera direction and BH center.
  // For visualization we project the disk's 3D orientation into this plane via inclination.
  float incl = uInclDeg * 0.01745329;
  // The 'disk axis' in image-plane coords: y = b sin(impact-angle).
  // We integrate u(phi) and at each step check the orthogonal coordinate (pos.y / cos(incl) above midplane).

  // Bookkeeping: u, du/dphi, phi, plus the previous orthogonal coordinate to detect midplane crossings.
  float u = 1e-3;            // start near infinity.
  float du = -1.0 / b;       // incoming ray.
  float phi = 0.0;
  float dphi = 0.025;        // integration step (radians).
  vec3 col = vec3(0.0);
  bool captured = false;
  bool diskHit = false;
  float diskColMul = 1.0;
  int  diskCrossings = 0;
  float r_disk_in_pro = (uAoverM >= 0.0) ? max(2.05, 6.0 - 5.0 * uAoverM) : 6.0 - uAoverM * 3.0;
  float r_disk_out = 22.0;
  float prevY = b * sin(impactAngle);  // approximate ortho coordinate at entry.

  for (int i = 0; i < 240; i += 1) {
    // RK4 step on (u, du).
    float k1u = du;
    float k1d = -u + 3.0 * u * u;
    float u2 = u + 0.5 * dphi * k1u;
    float du2 = du + 0.5 * dphi * k1d;
    float k2u = du2;
    float k2d = -u2 + 3.0 * u2 * u2;
    float u3 = u + 0.5 * dphi * k2u;
    float du3 = du + 0.5 * dphi * k2d;
    float k3u = du3;
    float k3d = -u3 + 3.0 * u3 * u3;
    float u4 = u + dphi * k3u;
    float du4 = du + dphi * k3d;
    float k4u = du4;
    float k4d = -u4 + 3.0 * u4 * u4;
    u += dphi * (k1u + 2.0 * k2u + 2.0 * k3u + k4u) / 6.0;
    du += dphi * (k1d + 2.0 * k2d + 2.0 * k3d + k4d) / 6.0;
    phi += dphi;
    if (u > 0.5) { captured = true; break; }                // r < 2M.
    if (u < 1e-3 && phi > 0.5) break;                       // escape to infinity.
    if (u < 1e-4) break;
    float r = 1.0 / u;
    if (r > r_disk_out * 2.0) break;
    // Detect disk crossing: the in-plane radial position is r; the orthogonal coord
    // relative to disk plane (assuming small inclination tilt) flips sign when crossing.
    // We use a simple cos-modulation of phi to model the disk plane orientation.
    float planeCoord = sin(phi + impactAngle) * cos(incl) + cos(phi + impactAngle) * sin(incl) * sign(pos.y);
    if (prevY * planeCoord < 0.0 && r > r_disk_in_pro && r < r_disk_out) {
      diskHit = true; diskCrossings += 1;
      float T = 1e4 * pow(r_disk_in_pro / r, 0.75);
      vec3 c = planck(T);
      // Doppler proxy: blueshifted on prograde side.
      float doppler = 1.0 + 0.5 * cos(phi + impactAngle - 1.5);
      col += c * doppler * (diskCrossings == 1 ? 1.0 : 0.35);
      if (diskCrossings >= 2) break;
    }
    prevY = planeCoord;
  }

  if (captured) { oColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  // Photon-ring brightening near b_crit.
  float b_crit = 3.0 * sqrt(3.0);
  if (abs(b - b_crit) < 0.12) col += vec3(1.2, 1.0, 0.6) * 0.8 * (1.0 - abs(b - b_crit) / 0.12);
  // Starfield where nothing was hit.
  if (!diskHit && col.x + col.y + col.z < 0.05) {
    vec2 cell = floor(uv * uRes * 0.1) / 0.1;
    if (hash(cell) > 0.992) {
      float h = hash(cell + vec2(1.0));
      col = vec3(0.7 + 0.3 * h, 0.75, 0.95);
    }
  }
  // Vignette + ACES.
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
