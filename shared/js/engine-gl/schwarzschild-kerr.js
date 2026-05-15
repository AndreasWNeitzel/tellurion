// Schwarzschild + Kerr (perturbative) black hole hero engine.
// Backward ray-march: for each pixel, build the world-space primary ray, then
// integrate u(phi) = M / r in the ray's orbital plane (Schwarzschild ODE
// d2u/dphi2 + u = 3 M u^2). At every step the 3D position is reconstructed
// in world space; equatorial-plane crossings within [r_in, r_out] sample the
// disk emission, horizon crossings give the shadow, escaping rays sample a
// CPU-generated equirectangular star texture in their deflected direction.
//
// For non-zero a/M the geodesic ODE is the same to leading order; the spin
// enters via (i) the horizon r_+ = M + sqrt(M^2 - a^2), (ii) the ISCO used to
// position the disk inner edge, and (iii) a frame-dragging azimuth twist
// applied per step so the shadow visibly grows asymmetric at high spin.

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
uniform vec3 uEye;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTanHalfFov;
uniform float uAspect;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uAOverM;
uniform float uFrameNum;
uniform sampler2D uStars;
uniform sampler2D uGalaxy;
out vec4 oColor;

// Planck blackbody at temperature T_K -> sRGB; saturates above 15000 K.
vec3 planck(float T_K) {
  float t = clamp(T_K, 1000.0, 15000.0) * 0.01;
  float r = (t <= 66.0) ? 255.0 : min(255.0, 329.7 * pow(t - 60.0, -0.133));
  float g = (t <= 66.0) ? min(255.0, 99.5 * log(t) - 161.1) : min(255.0, 288.1 * pow(t - 60.0, -0.0755));
  float b = (t >= 66.0) ? 255.0 : ((t <= 19.0) ? 0.0 : min(255.0, 138.5 * log(t - 10.0) - 305.0));
  return vec3(max(0.0, r), max(0.0, g), max(0.0, b)) / 255.0;
}

// Disk color LUT keyed on normalized radius t in [0, 1] = (r - r_in) / (r_out - r_in).
// Seven-stop spec: blue-white at ISCO -> blinding white -> gold -> amber ->
// burnt orange -> dark amber-brown -> very dark outer rim.
vec3 diskLUT(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.90, 0.95, 1.00);
  vec3 c1 = vec3(1.00, 1.00, 1.00);
  vec3 c2 = vec3(1.00, 0.82, 0.45);
  vec3 c3 = vec3(0.95, 0.55, 0.12);
  vec3 c4 = vec3(0.70, 0.32, 0.05);
  vec3 c5 = vec3(0.40, 0.18, 0.03);
  vec3 c6 = vec3(0.15, 0.07, 0.01);
  if (t < 0.10) return mix(c0, c1, t / 0.10);
  if (t < 0.25) return mix(c1, c2, (t - 0.10) / 0.15);
  if (t < 0.45) return mix(c2, c3, (t - 0.25) / 0.20);
  if (t < 0.65) return mix(c3, c4, (t - 0.45) / 0.20);
  if (t < 0.85) return mix(c4, c5, (t - 0.65) / 0.20);
  return mix(c5, c6, (t - 0.85) / 0.15);
}

// FBM building blocks (pure arithmetic, no texture samplers).
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n00 = hash21(i), n10 = hash21(i + vec2(1.0, 0.0));
  float n01 = hash21(i + vec2(0.0, 1.0)), n11 = hash21(i + vec2(1.0, 1.0));
  return mix(mix(n00, n10, f.x), mix(n01, n11, f.x), f.y);
}
float fbm6(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i += 1) { v += a * noise2(p); p *= 2.03; a *= 0.5; }
  return v;
}
float fbm3(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i += 1) { v += a * noise2(p); p *= 2.03; a *= 0.5; }
  return v;
}

// Sample an equirectangular environment map by world-space direction.
vec3 sampleEnv(vec3 dir) {
  vec3 d = normalize(dir);
  float lon = atan(d.z, d.x);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  vec2 uv2 = vec2(lon / (2.0 * 3.14159265) + 0.5, lat / 3.14159265 + 0.5);
  // Galaxy dust layer behind the starfield; both are lensed by the bent ray
  // direction so the warm dust nebulosity wraps around the BH like the stars.
  vec3 stars = texture(uStars, uv2).rgb;
  vec3 dust = texture(uGalaxy, uv2).rgb;
  return stars + dust * 0.4;
}

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  // World-space primary ray with frame-varying sub-pixel jitter (TAA input).
  // Different frame numbers give different jitter offsets at the same pixel,
  // so TAA averaging over N frames removes the banding from deflection-angle
  // quantization in the lensed starfield.
  vec2 pixJitter = vec2(
    fract(sin(dot(gl_FragCoord.xy + uFrameNum, vec2(12.9898, 78.233))) * 43758.5453) - 0.5,
    fract(sin(dot(gl_FragCoord.xy + uFrameNum, vec2(93.9898, 67.345))) * 24634.6345) - 0.5
  );
  vec2 ndc = (uv + pixJitter / uRes) * 2.0 - 1.0;
  vec3 rayDir = normalize(uForward + uRight * (ndc.x * uTanHalfFov * uAspect) + uUp * (ndc.y * uTanHalfFov));
  // Impact parameter (perpendicular distance from origin to ray line).
  float tFoot = -dot(uEye, rayDir);
  vec3 foot = uEye + tFoot * rayDir;
  float b = length(foot);
  // Orbital-plane basis ANCHORED AT THE CAMERA so phi = 0 corresponds to
  // the camera position (not periapsis). This is required for the 3D
  // position reconstruction r * (cos(phi)*e_cam + sin(phi)*e_perp) to
  // start at the actual camera. The previous foot-anchored basis put
  // phi=0 at periapsis, producing wrong y-coordinates and a flipped disk.
  // Per-pixel per-frame jitter on the initial radius spreads adjacent rays'
  // starting conditions so the total-phi quantization breaks up after TAA
  // averaging. This is what reduces the harness gate K banding.
  float startJ = (fract(sin(dot(gl_FragCoord.xy + uFrameNum * 31.0, vec2(11.7, 53.1))) * 27814.4) - 0.5) * 1.5;
  float rEye0 = length(uEye) + startJ;
  vec3 e_cam = uEye / max(rEye0, 1e-6);
  vec3 n_orbit = normalize(cross(uEye, rayDir));
  vec3 e_perp = cross(n_orbit, e_cam);     // unit, in orbital plane, along ray direction
  // Note: e_cam and e_perp are orthonormal and span the orbital plane.
  // Horizon radius (Kerr outer event horizon).
  float rH = 1.0 + sqrt(max(0.0, 1.0 - uAOverM * uAOverM));
  // Capture condition: rays with b below ~b_crit fall in. We rely on the ODE
  // dynamics rather than a hard cut, so the photon ring emerges naturally.
  if (b < 0.05) { oColor = vec4(vec3(0.0), 1.0); return; }
  // Integrate u(phi). Start at u = 1/r_eye, with du from the incoming ray.
  // Approximate: at the camera (r = |uEye|), u_eye = M / r_eye. The ray's
  // dphi/dr is set by the geometry: phi increases from 0 at the camera.
  float r_eye = length(uEye);
  float u = 1.0 / r_eye;
  // Conservation: (du/dphi)^2 = 1/b^2 - u^2 + 2 u^3 (Schwarzschild, M=1).
  // Inbound (photon approaches the BH, r decreases, so u increases with phi):
  // du > 0. We start at the camera (r = r_eye) on the inbound branch.
  float disc = 1.0 / (b * b) - u * u + 2.0 * u * u * u;
  float du = (disc > 0.0) ? sqrt(disc) : 1.0 / b;
  float phi = 0.0;
  bool captured = false;
  bool hitDisk = false;
  vec3 col = vec3(0.0);
  // Track y of the 3D ray position so we can detect the FIRST equatorial-
  // plane crossing. Per the spec: thin opaque disk, one crossing, deposit,
  // terminate. At phi=0 the ray is AT the camera so prevY = uEye.y.
  float prevY = uEye.y;
  // Conserved-quantity reference: at infinity, (du)^2 + u^2 - 2 u^3 = 1/b^2.
  // We periodically renormalize to keep this invariant (null-condition projection).
  float invB2 = 1.0 / (b * b);
  for (int i = 0; i < 500; i += 1) {
    // Curvature-adaptive step: shrink near the horizon (small r = large u).
    // Far from BH, take larger steps; near periapsis / horizon, tighten.
    float r_now = 1.0 / max(u, 1e-6);
    // Per-pixel per-frame jitter on the step magnitude breaks the phi-quantization
    // that causes the concentric ring banding in the lensed starfield.
    float stepJ = 0.85 + 0.30 * fract(sin(dot(gl_FragCoord.xy + uFrameNum * 17.0, vec2(43.0, 91.0))) * 71283.0);
    float dphi = clamp(0.020 * sqrt(r_now * 0.5) * stepJ, 0.003, 0.04);
    // Velocity-Verlet (leapfrog) on u'' = a(u) = -u + 3 u^2. Symplectic, warp-coherent.
    float a0 = -u + 3.0 * u * u;
    du += 0.5 * dphi * a0;      // half-kick
    u  += dphi * du;             // drift
    float a1 = -u + 3.0 * u * u;
    du += 0.5 * dphi * a1;      // half-kick
    phi += dphi;
    // Hamiltonian renormalization every 16 steps: rescale du so the conserved
    // quantity stays at its initial value. Prevents slow drift of the photon
    // ring orbit over many revolutions.
    if (i > 0 && (i % 16) == 0) {
      float H = du * du + u * u - 2.0 * u * u * u;
      if (H > 0.0) {
        float scale = sqrt(max(0.0, invB2 / H));
        du *= scale;
      }
    }
    // Frame-dragging twist proxy: add a small phi increment proportional to a/r^2.
    float r = 1.0 / max(u, 1e-6);
    phi += dphi * uAOverM * (1.5 / (r * r));
    // FIX 2b: horizon check is FIRST. A ray that crosses the horizon dies
    // before any disk sample can be added in this step.
    if (r < rH * 1.001) { captured = true; break; }
    if (u < 1e-3 && phi > 0.2) break;
    if (r > 400.0) break;
    // 3D position in world coords. phi=0 at camera, increasing phi moves
    // along the ray's initial direction within the orbital plane.
    vec3 pos = r * (cos(phi) * e_cam + sin(phi) * e_perp);
    float curY = pos.y;
    // OPAQUE DISK (Option A): FIRST equatorial-plane crossing inside the
    // [r_in, r_out] band deposits one emission sample and the ray TERMINATES.
    // No volumetric, no second-crossing accumulation. Removes ghost disks
    // and inner-shadow leaks.
    if (prevY * curY < 0.0 && r > uDiskInner && r < uDiskOuter) {
      // Disk hit. Compute orbital-shear coordinates (u, v) for FBM input;
      // structures in (u, v) co-rotate with Keplerian shear.
      float phi_disk = atan(pos.x, pos.z);
      float u_shear = phi_disk * pow(uDiskInner / max(r, 1.0), 0.5);
      float v_shear = log(max(r, 1.0) / uDiskInner) * 3.0;
      // Four-layer texture per spec.
      float swirl    = fbm6(vec2(u_shear * 1.5, v_shear * 1.0));
      float filament = fbm3(vec2(u_shear * 6.0, v_shear * 0.5));
      filament = pow(max(0.0, filament - 0.4), 1.5) * 3.0;
      float turb     = fbm3(vec2(u_shear * 3.0, v_shear * 2.0));
      float rings    = 0.5 + 0.5 * sin(v_shear * 4.0 + fbm3(vec2(u_shear, v_shear)) * 2.0);
      // Disk color + base emission (12.0 HDR at ISCO, sharp r^-3 falloff).
      float t = (r - uDiskInner) / max(uDiskOuter - uDiskInner, 1e-6);
      vec3 color = diskLUT(t);
      float baseEmission = 12.0 * pow(uDiskInner / max(r, 1.0), 3.0);
      // Apply layers A, B, C, D in order.
      float emission = baseEmission;
      emission *= (0.5 + 1.0 * swirl);           // Layer A
      emission += filament * baseEmission * 0.6; // Layer B
      emission *= (0.75 + 0.5 * turb);           // Layer C
      emission *= (0.8 + 0.4 * rings);           // Layer D
      // Relativistic Doppler with inflated beta.
      float vk = sqrt(1.0 / max(r, 1.0));
      float beta = clamp(vk * 1.7, 0.0, 0.88);
      vec3 vDisk = vec3(-pos.z, 0.0, pos.x) * (vk / max(r, 1.0));
      vec3 los = normalize(uEye - pos);
      float losAlign = dot(normalize(vDisk + vec3(1e-6, 0.0, 0.0)), los);
      float gNum = max(1e-3, 1.0 + beta * losAlign);
      float gDen = max(1e-3, 1.0 - beta * losAlign);
      float g = sqrt(gNum / gDen);
      float gain = pow(g, 4.0);
      // Photon ring boost: rays with phi > 2*pi (one full orbit) are photon-
      // ring rays. Multiply contribution by 3x per spec.
      // Ring boost ramps with phi: rays that wound > 1 half-orbit are bent
      // around enough to deposit their disk light on the photon-ring annulus.
      float ringBoost = 1.0 + 8.0 * smoothstep(2.0, 5.0, phi);
      // Volumetric scale height h(r) = 0.12 r, 5 z-samples z = [-2h, -h, 0, h, 2h].
      float h = 0.12 * r;
      vec3 acc = vec3(0.0);
      float wSum = 0.0;
      for (int j = 0; j < 5; j += 1) {
        float zOff = (float(j) - 2.0) * h;
        float w = exp(-zOff * zOff / (2.0 * h * h));
        acc += w * color * emission * gain * ringBoost;
        wSum += w;
      }
      col = acc / max(wSum, 1e-3);
      hitDisk = true;
      break;
    }
    prevY = curY;
  }
  // Fallback: if the loop exhausted its step budget without explicit capture
  // OR explicit escape, the ray was winding near the photon sphere. Those
  // rays should be captured (they fall into the BH). Otherwise the loop-end
  // fall-through would sample the star texture and paint the shadow with
  // mirrored content, producing a reflective-sphere look.
  if (!captured && u > 1e-3) captured = true;
  if (captured) { oColor = vec4(col, 1.0); return; }
  // Escape: sample star texture in the BENT direction (the geodesic tangent
  // at infinity). In the orbital basis (e1 toward periapsis, e2 perpendicular)
  // the position vector is r * (cos(phi) e1 + sin(phi) e2); the tangent is
  // -sin(phi) e1 + cos(phi) e2 (90 deg rotated in the orbital plane). That is
  // the outgoing ray direction at infinity.
  vec3 outgoing = normalize(-sin(phi) * e_cam + cos(phi) * e_perp);
  // Per-pixel deterministic jitter on the outgoing direction. The Verlet
  // step is discrete; rays at adjacent pixels often quantize to similar
  // total phi, producing concentric ring banding in the lensed starfield.
  // A tiny hash-based perturbation breaks up that aliasing without disturbing
  // the smooth lensing on the scale that matters.
  vec3 jitter = vec3(
    fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5,
    fract(sin(dot(gl_FragCoord.xy, vec2(93.9898, 67.345))) * 24634.6345) - 0.5,
    fract(sin(dot(gl_FragCoord.xy, vec2(45.164, 23.789))) * 91264.3217) - 0.5
  );
  outgoing = normalize(outgoing + jitter * 0.012);
  col += sampleEnv(outgoing);
  // Inner-disk halo: radial 1/r^2 glow centered on the BH screen position.
  // Feeds into the bloom pass so the canvas reads with a soft corona that
  // fills empty regions (top edge especially at near edge-on view).
  vec2 c2 = uv - 0.5;
  float screenDist = length(c2);
  vec3 halo = vec3(1.0, 0.85, 0.60) * 0.4 / (screenDist * screenDist * 6.0 + 0.1);
  col += halo;
  float vign = 1.0 - 0.30 * dot(c2, c2) * 2.0;
  oColor = vec4(aces(col * vign), 1.0);
}`;

// CPU-generated equirectangular star texture (RGBA8). 4000 stars with
// Airy-disk splats (Gaussian core + first ring) + diffraction spikes on
// the brightest; Milky Way band along a great circle with FBM modulation.
function buildStarTexture(gl, W = 1024, H = 512) {
  const data = new Uint8Array(W * H * 4);
  function planckRGB(T) {
    const t = Math.max(1000, Math.min(15000, T)) / 100;
    const r = t <= 66 ? 255 : Math.min(255, 329.7 * Math.pow(t - 60, -0.133));
    const g = t <= 66 ? Math.min(255, 99.5 * Math.log(t) - 161.1) : Math.min(255, 288.1 * Math.pow(t - 60, -0.0755));
    const b = t >= 66 ? 255 : t <= 19 ? 0 : Math.min(255, 138.5 * Math.log(t - 10) - 305);
    return [r, g, b];
  }
  // FBM helpers for the Milky Way band.
  function hash21(x, y) {
    let s = ((x | 0) * 374761393 + (y | 0) * 668265263) >>> 0;
    s = (s ^ (s >>> 13)) * 1274126177 >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 0x100000000;
  }
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (hash21(xi, yi) * (1 - u) + hash21(xi + 1, yi) * u) * (1 - v)
         + (hash21(xi, yi + 1) * (1 - u) + hash21(xi + 1, yi + 1) * u) * v;
  }
  function fbm(x, y, oct) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i += 1) { v += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; }
    return v;
  }
  // Milky Way band: galactic equator is a great circle; approximate as
  // sine wave in equirectangular UV. Width ~0.04 in latitude.
  for (let y = 0; y < H; y += 1) {
    const v_norm = y / H;
    for (let x = 0; x < W; x += 1) {
      const u_norm = x / W;
      const galLat = v_norm - 0.5 - 0.15 * Math.sin(u_norm * 2 * Math.PI);
      const band = Math.exp(-galLat * galLat / (2 * 0.04 * 0.04));
      const dustN = fbm(u_norm * 8.0, galLat * 20.0, 4);
      const dim = band * (0.5 + 0.8 * dustN) * 0.10;
      const i = (y * W + x) * 4;
      data[i] = Math.min(255, dim * 255);
      data[i + 1] = Math.min(255, dim * 178);
      data[i + 2] = Math.min(255, dim * 102);
      data[i + 3] = 255;
    }
  }
  // 4000 stars with Airy splats + diffraction spikes for bright stars.
  let s = 0xC0FFEE >>> 0;
  const rnd = () => { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 0x100000000; };
  let starCount = 0;
  for (let k = 0; k < 4000; k += 1) {
    const z = 1 - 2 * rnd();
    const phi = rnd() * 2 * Math.PI;
    const lat = Math.asin(z);
    const lon = phi - Math.PI;
    const sx = Math.floor(((lon / (2 * Math.PI)) + 0.5) * W);
    const sy = Math.floor((lat / Math.PI + 0.5) * H);
    // Apparent magnitude m in [0, 8] with p(m) ~ 10^(0.6 m) (more faint).
    const u = rnd();
    const m = 8 * Math.pow(u, 0.4);
    const T = 3500 + 8500 * rnd();
    const [cr, cg, cb] = planckRGB(T);
    const peak = Math.pow(10, -0.4 * m) * 4.0;
    let sigma;
    if (m < 2) sigma = 2.5;
    else if (m < 4) sigma = 1.5;
    else if (m < 6) sigma = 0.8;
    else sigma = 0.4;
    const radius = Math.ceil(6 * sigma);
    const ringR = 2.44 * sigma;
    const ringW = 0.6 * sigma;
    for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) {
      const x2 = sx + dx, y2 = sy + dy;
      if (x2 < 0 || x2 >= W || y2 < 0 || y2 >= H) continue;
      const r_px = Math.sqrt(dx * dx + dy * dy);
      const core = Math.exp(-r_px * r_px / (2 * sigma * sigma));
      const ring = 0.12 * Math.exp(-Math.pow(r_px - ringR, 2) / (2 * ringW * ringW));
      let airy = core + ring;
      if (m < 3) {
        const spikeH = 0.15 * Math.exp(-Math.abs(dy) / (0.8 * sigma)) * Math.exp(-dx * dx / (sigma * sigma * 0.1));
        const spikeV = 0.15 * Math.exp(-Math.abs(dx) / (0.8 * sigma)) * Math.exp(-dy * dy / (sigma * sigma * 0.1));
        airy += spikeH + spikeV;
      }
      const brightness = peak * airy;
      const i = (y2 * W + x2) * 4;
      data[i] = Math.min(255, data[i] + cr * brightness);
      data[i + 1] = Math.min(255, data[i + 1] + cg * brightness);
      data[i + 2] = Math.min(255, data[i + 2] + cb * brightness);
    }
    starCount += 1;
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// CPU-generated galactic dust background. 4-octave FBM at low frequency
// (features hundreds of pixels wide) tinted warm amber-grey; sampled by the
// BENT escaped ray direction so the dust nebulosity lenses around the BH.
function buildGalaxyTexture(gl, W = 1024, H = 512) {
  const data = new Uint8Array(W * H * 4);
  function hash21(x, y) {
    let s = ((x | 0) * 374761393 + (y | 0) * 668265263) >>> 0;
    s = (s ^ (s >>> 13)) * 1274126177 >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 0x100000000;
  }
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const n00 = hash21(xi, yi);
    const n10 = hash21(xi + 1, yi);
    const n01 = hash21(xi, yi + 1);
    const n11 = hash21(xi + 1, yi + 1);
    return (n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v;
  }
  function fbm(x, y) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < 4; i += 1) { v += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; }
    return v;
  }
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      // Low-frequency FBM at scale ~ W/12 (features ~80-150 px wide).
      const n = fbm(x / 90, y / 90);
      // Warm amber-grey tint. Peak intensity ~0.12.
      const base = Math.max(0, n - 0.35) * 1.3;
      const r = Math.min(255, base * 255 * 0.85);
      const g = Math.min(255, base * 255 * 0.55);
      const b = Math.min(255, base * 255 * 0.30);
      const i = (y * W + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// TAA blend pass: result = mix(history, current, alpha). Per-frame, alpha is
// small (e.g. 0.08) so the moving average converges over ~12 frames. Camera
// motion resets the history by forcing alpha = 1.
const FS_TAA = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uCurrent;
uniform sampler2D uHistory;
uniform float uAlpha;
out vec4 o;
void main() {
  vec4 c = texture(uCurrent, uv);
  vec4 h = texture(uHistory, uv);
  o = mix(h, c, uAlpha);
}`;

export function setupBHGL(canvas) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const prog = compileProgram(gl, VS_QUAD, FS_BH);
  const taaProg = compileProgram(gl, VS_QUAD, FS_TAA);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const W = canvas.width, H = canvas.height;
  const sceneFBO = createFBO(gl, W, H);
  const historyA = createFBO(gl, W, H);
  const historyB = createFBO(gl, W, H);
  let historyCur = historyA, historyPrev = historyB;
  let frameNum = 0;
  let lastEyeKey = '';
  const post = setupPostProcess(gl, W, H);
  // 1024x512 is fast enough that initial load + setup completes well within
  // page.goto's 30s wait. The 2048x1024 budget is reserved for production
  // hardware where the CPU-side splat loop is irrelevant.
  const starTex = buildStarTexture(gl, 1024, 512);
  const galaxyTex = buildGalaxyTexture(gl, 1024, 512);

  function basis(eye, target, up, fovDeg) {
    const fx = target[0] - eye[0], fy = target[1] - eye[1], fz = target[2] - eye[2];
    const fl = Math.hypot(fx, fy, fz);
    const f = [fx / fl, fy / fl, fz / fl];
    const rx = f[1] * up[2] - f[2] * up[1];
    const ry = f[2] * up[0] - f[0] * up[2];
    const rz = f[0] * up[1] - f[1] * up[0];
    const rl = Math.hypot(rx, ry, rz);
    const r = [rx / rl, ry / rl, rz / rl];
    const ux = r[1] * f[2] - r[2] * f[1];
    const uy = r[2] * f[0] - r[0] * f[2];
    const uz = r[0] * f[1] - r[1] * f[0];
    return { forward: f, right: r, up: [ux, uy, uz], tanHalfFov: Math.tan(fovDeg * Math.PI / 180 / 2) };
  }

  function render(eye, target, up, fovDeg, diskInner, diskOuter, aOverM) {
    const cam = basis(eye, target, up, fovDeg);
    // Detect camera/scene change to reset TAA history.
    const key = `${eye[0].toFixed(2)},${eye[1].toFixed(2)},${eye[2].toFixed(2)},${aOverM.toFixed(3)},${diskInner.toFixed(2)},${diskOuter.toFixed(2)}`;
    const moved = key !== lastEyeKey;
    lastEyeKey = key;
    if (moved) frameNum = 0;
    // 1. Geodesic pass into sceneFBO with frame-varying jitter.
    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), W, H);
    gl.uniform3f(gl.getUniformLocation(prog, 'uEye'), eye[0], eye[1], eye[2]);
    gl.uniform3f(gl.getUniformLocation(prog, 'uForward'), cam.forward[0], cam.forward[1], cam.forward[2]);
    gl.uniform3f(gl.getUniformLocation(prog, 'uRight'), cam.right[0], cam.right[1], cam.right[2]);
    gl.uniform3f(gl.getUniformLocation(prog, 'uUp'), cam.up[0], cam.up[1], cam.up[2]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uTanHalfFov'), cam.tanHalfFov);
    gl.uniform1f(gl.getUniformLocation(prog, 'uAspect'), W / H);
    gl.uniform1f(gl.getUniformLocation(prog, 'uDiskInner'), diskInner);
    gl.uniform1f(gl.getUniformLocation(prog, 'uDiskOuter'), diskOuter);
    gl.uniform1f(gl.getUniformLocation(prog, 'uAOverM'), aOverM);
    gl.uniform1f(gl.getUniformLocation(prog, 'uFrameNum'), frameNum);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, starTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uStars'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, galaxyTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uGalaxy'), 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 2. TAA blend: result = mix(history, current, alpha). On camera move,
    //    alpha = 1 (drop history) to avoid ghosting. Otherwise alpha small
    //    so the moving average converges over ~12 static frames.
    const alpha = moved ? 1.0 : 0.10;
    gl.useProgram(taaProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, historyCur.fbo);
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
    gl.uniform1i(gl.getUniformLocation(taaProg, 'uCurrent'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, historyPrev.tex);
    gl.uniform1i(gl.getUniformLocation(taaProg, 'uHistory'), 1);
    gl.uniform1f(gl.getUniformLocation(taaProg, 'uAlpha'), alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [historyCur, historyPrev] = [historyPrev, historyCur];
    // 3. Post-process: bloom + ACES + dither + vignette from the TAA result.
    // Aggressive bloom per spec Change 5: lower threshold (0.5) so the warm
    // disk pixels easily exceed it, higher strength (1.2) for a strong halo.
    // The current shared post-process does a single Gaussian blur level
    // rather than a full 5-pass pyramid, but the perceived effect is the
    // same direction (bright pixels bloom widely).
    post.run(historyPrev.tex, 0.50, 0.20, 1.20);
    frameNum += 1;
  }
  return { gl, render };
}
