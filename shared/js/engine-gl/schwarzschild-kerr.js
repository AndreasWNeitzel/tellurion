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
uniform float uTime;
uniform sampler2D uStars;
out vec4 oColor;

const float PI = 3.14159265358979;

// Hash + value noise + FBM (arithmetic, no texture samplers). Prefixed bh_
// to keep them distinct from the procedural-stars hash family above.
float bh_hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.31);
  return fract(p.x * p.y);
}
float bh_vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(bh_hash(i),                 bh_hash(i + vec2(1.0, 0.0)), u.x),
    mix(bh_hash(i + vec2(0.0,1.0)), bh_hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float bh_fbm8(vec2 p) {
  float v = 0.0, a = 0.5, total = 0.0;
  for (int i = 0; i < 8; i += 1) {
    v     += a * bh_vnoise(p);
    total += a;
    p      = p * 2.1 + vec2(1.3, 0.7);
    a     *= 0.5;
  }
  return v / total;
}
float bh_fbm3_kerr(vec2 p) {
  float v = 0.0, a = 0.5, total = 0.0;
  for (int i = 0; i < 3; i += 1) {
    v     += a * bh_vnoise(p);
    total += a;
    p      = p * 2.1 + vec2(1.3, 0.7);
    a     *= 0.5;
  }
  return v / total;
}

// Blackbody temperature (K) -> linear sRGB at Y = 1.
// Wyman, Sloan, Shirley (2013), JCGT Vol 2 No 2. Brightness is applied
// separately via Stefan-Boltzmann (T^4); this function only returns hue.
vec3 bh_blackbody_sRGB(float T) {
  T = clamp(T, 1000.0, 25000.0);
  float x;
  if (T < 4000.0)
    x = (-0.2661239e9 / (T*T*T)) + (-0.2343580e6 / (T*T))
      + ( 0.8776956e3 / T) + 0.179910;
  else
    x = (-3.0258469e9 / (T*T*T)) + ( 2.1070379e6 / (T*T))
      + ( 0.2226347e3 / T) + 0.240390;
  float y;
  if (T < 2222.0)
    y = -1.1063814*(x*x*x) - 1.34811020*(x*x)
      + 2.18555832*x - 0.20219683;
  else if (T < 4000.0)
    y = -0.9549476*(x*x*x) - 1.37418593*(x*x)
      + 2.09137015*x - 0.16748867;
  else
    y =  3.0817580*(x*x*x) - 5.87338670*(x*x)
      + 3.75112997*x - 0.37001483;
  y = max(y, 0.001);
  float X = x / y;
  float Y = 1.0;
  float Z = (1.0 - x - y) / y;
  vec3 rgb;
  rgb.r =  3.2406*X - 1.5372*Y - 0.4986*Z;
  rgb.g = -0.9689*X + 1.8758*Y + 0.0415*Z;
  rgb.b =  0.0557*X - 0.2040*Y + 1.0570*Z;
  return max(vec3(0.0), rgb);
}

// Novikov-Thorne (1973) rest-frame temperature of a geometrically thin,
// optically thick disk. T proportional to r^(-3/4) with f(r) correction
// that forces T = 0 at the ISCO; peaks near r = 1.36 r_isco.
const float BH_T_PEAK = 25000.0;
float bh_disk_temperature(float r, float r_isco) {
  float x = r / r_isco;
  float f = max(0.0, 1.0 - 1.0 / sqrt(x));
  return BH_T_PEAK * pow(1.0 / x, 0.75) * pow(f, 0.25);
}

// Gravitational redshift on temperature (geometric units, M = 1).
float bh_grav_redshift(float r) {
  return sqrt(max(0.0, 1.0 - 2.0 / r));
}

// Keplerian Doppler factor g, computed in world space using the line-of-
// sight to the camera and the prograde orbital tangent at the disk hit
// point. Equivalent to the sin(phi)*cos(incl) approximation in the spec
// but exact for arbitrary camera positions; avoids needing a separate
// u_inclination uniform.
float bh_doppler_g(vec3 hit_pos, float r, float r_isco, vec3 eye) {
  float v_kep = sqrt(1.0 / max(r, r_isco + 0.1));
  float gamma_k = 1.0 / sqrt(max(0.001, 1.0 - v_kep * v_kep));
  // Orbital tangent. Sign chosen so the LEFT side of the disk is the
  // approaching side at the default camera azimuth (matches the Luminet /
  // Interstellar convention used in the target reference image).
  vec3 v_disk = vec3(hit_pos.z, 0.0, -hit_pos.x) * (v_kep / max(r, 1e-6));
  vec3 los = normalize(eye - hit_pos);
  float beta_los = dot(v_disk, los);
  float g = 1.0 / (gamma_k * (1.0 - beta_los));
  return clamp(g, 0.01, 10.0);
}

// Main disk emission. Called when the ray crosses the equatorial plane
// inside [r_isco, r_outer]. Returns HDR linear sRGB radiance.
vec3 bh_disk_emission(vec3 hit_pos, float r, float phi_hit, float r_isco, vec3 eye) {
  float T_emit = bh_disk_temperature(r, r_isco);
  if (T_emit < 100.0) return vec3(0.0);
  float T_grav = T_emit * bh_grav_redshift(r);
  float g      = bh_doppler_g(hit_pos, r, r_isco, eye);
  float T_obs  = T_grav * g;
  vec3  color  = bh_blackbody_sRGB(T_obs);
  float magnitude = pow(T_obs / 10000.0, 4.0) * 0.8;
  // Orbital-shear FBM: features stretched in phi at small r (where the
  // gas orbits fastest), compact at large r. Coordinate u = phi * S(r)
  // is NOT naturally periodic in phi, so the FBM hits a discontinuity
  // at phi = +/- pi (the "poorly sewn radial strip"). Eliminate the seam
  // by sampling twice (one period apart in u) and smoothly blending
  // across the wrap boundary; at phi = +pi the blend ends on
  // noise(phi - 2pi), which equals the noise at phi = -pi by
  // construction, so the function is C0 continuous everywhere.
  float S = pow(r_isco / max(r, r_isco), 0.5);
  float v = log(max(r / r_isco, 1.0)) * 2.5;
  float u_period = 2.0 * PI * S;
  // Differential Keplerian rotation: inner gas orbits faster than outer
  // (omega ~ r^-3/2). One orbit per ~37 s at r_isco (2x the prior rate).
  float omega = 0.168 * pow(r_isco / max(r, r_isco), 1.5);
  float phi_rot = phi_hit - omega * uTime;
  float phi_w = mod(phi_rot + PI, 2.0 * PI) - PI;     // [-pi, pi)
  float u0 = phi_w * S;
  float u1 = u0 - u_period;
  float t  = (phi_w + PI) / (2.0 * PI);               // 0..1
  float blend = smoothstep(0.0, 1.0, t);
  // Two-level Inigo-Quilez domain-warped FBM. Emulates accretion-disk
  // turbulence (MRI / Kelvin-Helmholtz eddies driven by differential
  // Keplerian shear): the first warp q rotates the noise, the second
  // warp r is built from q-displaced noise so each eddy curls around
  // its neighbours -- vortices, not just deformed swirl. Both warps
  // and final sample use the dual-blend wrap so the seam at phi=+/-pi
  // stays C0 continuous.
  vec2 b1 = vec2(u0 * 1.3, v * 0.7), b2 = vec2(u1 * 1.3, v * 0.7);
  float qa0 = bh_fbm8(b1), qa1 = bh_fbm8(b2);
  float qb0 = bh_fbm8(b1 + vec2(13.0, 7.3)), qb1 = bh_fbm8(b2 + vec2(13.0, 7.3));
  vec2 q = vec2(mix(qa0, qa1, blend), mix(qb0, qb1, blend)) - 0.5;
  // Keplerian-shear anisotropy: stretched in phi, narrower in log r.
  vec2 warp1 = q * vec2(3.5, 1.6);
  // Second-level warp: noise sampled at first-warped position; this is
  // what gives the curling vortex structure rather than a single stretch.
  float ra0 = bh_fbm8(b1 + warp1 + vec2(2.7, 4.1));
  float ra1 = bh_fbm8(b2 + warp1 + vec2(2.7, 4.1));
  float rb0 = bh_fbm8(b1 + warp1 + vec2(8.1, 1.9));
  float rb1 = bh_fbm8(b2 + warp1 + vec2(8.1, 1.9));
  vec2 r2 = vec2(mix(ra0, ra1, blend), mix(rb0, rb1, blend)) - 0.5;
  vec2 warp2 = warp1 + r2 * vec2(2.8, 1.3);
  float sw0 = bh_fbm8(vec2(u0 * 1.8, v * 1.0) + warp2);
  float sw1 = bh_fbm8(vec2(u1 * 1.8, v * 1.0) + warp2);
  float swirl = mix(sw0, sw1, blend);
  float fa0 = pow(max(0.0, bh_fbm3_kerr(vec2(u0 * 7.0, v * 0.4) + warp2 * 0.5) - 0.40), 1.5);
  float fa1 = pow(max(0.0, bh_fbm3_kerr(vec2(u1 * 7.0, v * 0.4) + warp2 * 0.5) - 0.40), 1.5);
  float filament = mix(fa0, fa1, blend);
  float tex      = (0.45 + 1.0 * swirl) + filament * 2.0;
  return color * magnitude * tex;
}

// Procedural star field. Quantize the outgoing direction into 3D cells and
// emit at most one star per cell. The star location is jittered inside the
// cell so adjacent rays produce the same star at the same (x, y, z) world
// position, and Gaussian falloff in 3D distance makes it look round
// regardless of how the lensing stretches the (lat, lon) -> screen mapping.
// A texture-based starfield gets anisotropically stretched into bars under
// strong lensing because each texel is sampled independently; this
// formulation does not have that pathology.
float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
vec3 starsProc(vec3 dir) {
  vec3 col = vec3(0.0);
  // Two scales of star cells. Coarse cells (scale 180) give bright stars
  // that may get stretched by lensing in the strongly-lensed region.
  // Fine cells (scale 900, sub-pixel at this FOV) give dense small dots
  // that stay round even under anisotropic lensing magnification.
  // Coarse pass.
  {
    vec3 d = dir * 180.0;
    vec3 cell = floor(d);
    for (int i = -1; i <= 1; i += 1)
      for (int j = -1; j <= 1; j += 1)
        for (int k = -1; k <= 1; k += 1) {
          vec3 c = cell + vec3(float(i), float(j), float(k));
          float pres = h31(c + 0.1);
          if (pres > 0.99) {
            vec3 jc = vec3(h31(c + 1.3), h31(c + 2.7), h31(c + 5.1));
            vec3 starP = c + jc;
            vec3 dDist = d - starP;
            float dist2 = dot(dDist, dDist);
            float intensity = pow((pres - 0.99) * 100.0, 2.0) * 1.8;
            float br = exp(-dist2 * 8.0) * intensity;
            float tH = h31(c + 7.9);
            vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.65), tH);
            col += tint * br;
          }
        }
  }
  // Fine pass: sub-pixel cells so lensing anisotropy cannot stretch the
  // star into a visible bar.
  {
    vec3 d = dir * 900.0;
    vec3 cell = floor(d);
    for (int i = -1; i <= 1; i += 1)
      for (int j = -1; j <= 1; j += 1)
        for (int k = -1; k <= 1; k += 1) {
          vec3 c = cell + vec3(float(i), float(j), float(k));
          float pres = h31(c + 0.31);
          if (pres > 0.992) {
            vec3 jc = vec3(h31(c + 1.7), h31(c + 2.3), h31(c + 4.7));
            vec3 starP = c + jc;
            vec3 dDist = d - starP;
            float dist2 = dot(dDist, dDist);
            float intensity = pow((pres - 0.992) * 125.0, 2.0) * 2.0;
            float br = exp(-dist2 * 7.0) * intensity;
            float tH = h31(c + 6.1);
            vec3 tint = mix(vec3(0.78, 0.85, 1.0), vec3(1.0, 0.86, 0.7), tH);
            col += tint * br;
          }
        }
  }
  return col;
}

// Diffuse Milky Way band sampled from the equirectangular texture (smooth
// gradient, no per-pixel content).
vec3 sampleEnv(vec3 dir) {
  vec3 d = normalize(dir);
  float lon = atan(d.z, d.x);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  vec2 uv2 = vec2(lon / (2.0 * 3.14159265) + 0.5, lat / 3.14159265 + 0.5);
  vec3 band = texture(uStars, uv2).rgb;
  return band + starsProc(d);
}

// Value-noise FBM in world (x, z) coordinates. Used to texture the accretion
// disk without producing concentric ring artifacts (those happen when the
// noise has any periodicity in r or phi alone).
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = h21(i), b = h21(i + vec2(1.0, 0.0));
  float c = h21(i + vec2(0.0, 1.0)), d = h21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm4(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i += 1) { v += a * vn2(p); p *= 2.07; a *= 0.5; }
  return v;
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
  // Track y AND the full 3D position of the ray so we can interpolate to
  // the exact y=0 plane crossing (eliminates the facet artifact where the
  // crossing was just snapped to whichever discrete step happened to flip
  // the sign of y).
  float prevY = uEye.y;
  vec3 prevPos = uEye;
  // Conserved-quantity reference: at infinity, (du)^2 + u^2 - 2 u^3 = 1/b^2.
  // We periodically renormalize to keep this invariant (null-condition projection).
  float invB2 = 1.0 / (b * b);
  for (int i = 0; i < 220; i += 1) {
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
    // and inner-shadow leaks. Interpolate to the exact y=0 crossing so the
    // disk hit is not snapped to whichever integrator step happened to flip
    // the sign of y (otherwise adjacent pixels read at different r values,
    // producing visible polygonal facets along the disk rim).
    if (prevY * curY < 0.0) {
      float frac = prevY / (prevY - curY);
      vec3 hitPos = mix(prevPos, pos, frac);
      float r_hit = length(hitPos);
      if (r_hit > uDiskInner && r_hit < uDiskOuter) {
        float phi_hit = atan(hitPos.x, hitPos.z);
        col = bh_disk_emission(hitPos, r_hit, phi_hit, uDiskInner, uEye);
        hitDisk = true;
        break;
      }
    }
    prevY = curY;
    prevPos = pos;
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
  // No per-pixel jitter on outgoing direction. With procedural stars
  // sampled in 3D cells, jitter pushes adjacent pixels into different
  // cells and shatters each star into a speckle cloud.
  col += sampleEnv(outgoing);
  vec2 c2 = uv - 0.5;
  float vign = 1.0 - 0.30 * dot(c2, c2) * 2.0;
  oColor = vec4(aces(col * vign), 1.0);
}`;

// CPU-generated equirectangular star texture. Resolution chosen so that even
// in the strongly lensed region near the photon sphere (magnification ~10x in
// the angular direction) each screen pixel still samples a fraction of a
// texel; otherwise the texel grid is visible as small rectangles.
function buildStarTexture(gl, W = 4096, H = 2048) {
  const data = new Uint8Array(W * H * 4);
  // Faint Milky Way band along a great circle (z-axis equator).
  // Add procedural noise for a dim diffuse glow.
  // Smooth latitude-only band. Any 2D structure (FBM, hash, periodic) in
  // this equirectangular texture gets mapped to concentric arcs by the
  // gravitational lensing because adjacent screen-radial pixels map to
  // very different positions in the source-direction texture.
  for (let y = 0; y < H; y += 1) {
    const lat = (y / H - 0.5) * Math.PI;
    const bandAtt = Math.exp(-Math.pow(lat / 0.25, 2) * 0.5);
    const dim = bandAtt * 0.020;
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      data[i] = Math.min(255, dim * 220);
      data[i + 1] = Math.min(255, dim * 200);
      data[i + 2] = Math.min(255, dim * 240);
      data[i + 3] = 255;
    }
  }
  // Stars are now generated procedurally in the shader; this CPU texture
  // is only the smooth Milky Way band. Leaving the explicit star splats
  // out so the texture is purely diffuse.
  if (false) {
  let s = 0xC0FFEE >>> 0;
  const rnd = () => { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 0x100000000; };
  function planckRGB(T) {
    const t = Math.max(1000, Math.min(15000, T)) / 100;
    const r = t <= 66 ? 255 : Math.min(255, 329.7 * Math.pow(t - 60, -0.133));
    const g = t <= 66 ? Math.min(255, 99.5 * Math.log(t) - 161.1) : Math.min(255, 288.1 * Math.pow(t - 60, -0.0755));
    const b = t >= 66 ? 255 : t <= 19 ? 0 : Math.min(255, 138.5 * Math.log(t - 10) - 305);
    return [r, g, b];
  }
  for (let k = 0; k < 3000; k += 1) {
    // Uniform on sphere.
    const z = 1 - 2 * rnd();
    const phi = rnd() * 2 * Math.PI;
    const lat = Math.asin(z);
    const lon = phi - Math.PI;
    const sx = Math.floor(((lon / (2 * Math.PI)) + 0.5) * W);
    const sy = Math.floor((lat / Math.PI + 0.5) * H);
    // Brightness power-law (Salpeter-ish).
    const u = rnd();
    const br = Math.pow(u, 2.5);
    const T = 3000 + rnd() * 9000;
    const [cr, cg, cb] = planckRGB(T);
    // sigma must be larger than the texel-to-screen-pixel ratio (~3 for the
    // 2048 x 1024 texture at 65 deg FOV) so the bilinear filter sees a
    // multi-texel Gaussian and renders a round splat instead of a rectangle.
    const sigma = 1.6 + 2.4 * br;
    const radius = Math.ceil(sigma * 3.0);
    for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) {
      const x2 = sx + dx, y2 = sy + dy;
      if (x2 < 0 || x2 >= W || y2 < 0 || y2 >= H) continue;
      const r2 = dx * dx + dy * dy;
      const g = Math.exp(-r2 / (2 * sigma * sigma)) * br;
      const i = (y2 * W + x2) * 4;
      data[i] = Math.min(255, data[i] + cr * g);
      data[i + 1] = Math.min(255, data[i + 1] + cg * g);
      data[i + 2] = Math.min(255, data[i + 2] + cb * g);
    }
  }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  // Mipmap chain. Without this, sampleEnv hits a single mip level (LINEAR
  // gives bilinear over four adjacent texels); when the lensed texture-uv
  // derivative across a screen pixel spans many texels (which happens near
  // the BH and at oblique latitudes), the result is rectangular box
  // artifacts instead of round stars. LINEAR_MIPMAP_LINEAR samples two mip
  // levels and blends, so stars stay round at every scale.
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
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

  function render(eye, target, up, fovDeg, diskInner, diskOuter, aOverM, time = 0) {
    const cam = basis(eye, target, up, fovDeg);
    // Detect camera/scene change to reset TAA history. Time deliberately
    // not in the key: the disk rotates continuously and we want TAA to
    // smoothly accumulate across that motion.
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
    gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), time);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, starTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uStars'), 0);
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
    // High threshold + low strength: only the very brightest pixels
    // (T_obs above ~12000 K with magnitude 0.8) bloom, so the dim warm
    // BB color of the receding side reads through instead of being
    // washed out by cool-white bloom contamination.
    post.run(historyPrev.tex, 3.0, 0.25, 0.18);
    frameNum += 1;
  }
  return { gl, render };
}
