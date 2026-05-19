// WebGL2 renderer for the exoplanet-transit hero. A limb-darkened
// star (point-sprite imposter), a dark planet imposter on an orbit
// ring tilted by the orbital inclination, a faint background star
// field. The renderer owns no physics: the orbital state (planet
// position, inclination) comes from the shared engine. Default
// framebuffer + in-shader ACES (the headless-GL lesson).

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';

// aSize is now interpreted as worldRadius for real objects (depth-
// scaled by uPixK / clip.w) so the star and planet have a consistent
// size that matches the orbit's geometric scale. For background stars
// we want a fixed-pixel size; we encode that by passing aSize negative
// (its absolute value is the pixel size).
const VS_PT = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in float aSize;
layout(location=2) in vec4 aCol;
uniform mat4 uVP;
uniform float uPixK;
out vec4 vCol;
void main(){
  vCol = aCol;
  gl_Position = uVP * vec4(aPos, 1.0);
  if (aSize < 0.0) {
    gl_PointSize = -aSize;                             // fixed pixel size
  } else {
    // world radius -> pixels with a 2-px floor so a sub-pixel
    // planet (Earth analogue) remains visible against the star.
    gl_PointSize = max(2.0, uPixK * aSize / gl_Position.w);
  }
}`;

// Star imposter: limb-darkened disc with a small chromosphere glow.
// aCol.a is the kind tag: 1.0 = star, 2.0 = planet, 0.0 = bg star.
const FS_PT = `#version 300 es
precision highp float;
in vec4 vCol;
uniform float uU1;
uniform float uU2;
out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (vCol.a > 1.5) {
    // planet: opaque dark disc with a soft cool rim
    if (r2 > 1.0) discard;
    float r = sqrt(r2);
    float core = 1.0 - smoothstep(0.80, 1.00, r);   // 1 at center, 0 at rim
    vec3 col = vec3(0.030, 0.030, 0.045) * core + vec3(0.10, 0.07, 0.05) * (1.0 - core);
    o = vec4(col, 1.0);
  } else if (vCol.a > 0.5) {
    // star: limb-darkened
    if (r2 > 1.0) discard;
    float mu = sqrt(1.0 - r2);
    float I = 1.0 - uU1 * (1.0 - mu) - uU2 * (1.0 - mu) * (1.0 - mu);
    vec3 col = vCol.rgb * I * 1.7;
    // faint chromosphere rim
    float rim = smoothstep(0.98, 1.0, sqrt(r2));
    col += vec3(1.0, 0.55, 0.25) * rim * 0.6;
    o = vec4(aces(col), 1.0);
  } else {
    // background star: soft round
    if (r2 > 1.0) discard;
    float a = exp(-3.0 * r2);
    o = vec4(aces(vCol.rgb * a * 1.4), a);
  }
}`;

const VS_LINE = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uVP;
void main(){ gl_Position = uVP * vec4(aPos, 1.0); }`;
const FS_LINE = `#version 300 es
precision highp float;
uniform vec4 uCol;
out vec4 o;
void main(){ o = uCol; }`;

function mulberry(seed) {
  let x = seed >>> 0;
  return () => { x |= 0; x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function setupTransitGL(canvas) {
  const gl = createGL2(canvas);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const W = canvas.width, H = canvas.height;

  const ptProg = compileProgram(gl, VS_PT, FS_PT);
  const lnProg = compileProgram(gl, VS_LINE, FS_LINE);

  // Dynamic point set: [bg stars..., star, planet]
  const NBG = 240;
  const rnd = mulberry(0xA571A);
  const ptBuf = new Float32Array((NBG + 2) * 8);
  // bg stars at fixed sky positions on a far celestial sphere; aSize
  // encoded NEGATIVE so the vertex shader treats it as a fixed-pixel
  // point size (independent of orbit zoom level).
  const R_BG = 220;
  for (let i = 0; i < NBG; i += 1) {
    const u = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), s = Math.sqrt(1 - u * u);
    const o = i * 8;
    ptBuf[o] = R_BG * s * Math.cos(ph);
    ptBuf[o + 1] = R_BG * u;
    ptBuf[o + 2] = R_BG * s * Math.sin(ph);
    ptBuf[o + 3] = -(1.5 + 1.5 * rnd());        // negative = fixed pixel size
    ptBuf[o + 4] = 0.65 + 0.35 * rnd();
    ptBuf[o + 5] = 0.7 + 0.3 * rnd();
    ptBuf[o + 6] = 0.85;
    ptBuf[o + 7] = 0.0;                          // tag: bg
  }
  const ptVAO = gl.createVertexArray();
  gl.bindVertexArray(ptVAO);
  const ptVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ptVBO);
  gl.bufferData(gl.ARRAY_BUFFER, ptBuf.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 32, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptVBO);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, ptBuf);

  // Orbit ring (line strip), 128 segments
  const RING_N = 128;
  const ringBuf = new Float32Array(RING_N * 3);
  const ringVAO = gl.createVertexArray();
  gl.bindVertexArray(ringVAO);
  const ringVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ringVBO);
  gl.bufferData(gl.ARRAY_BUFFER, ringBuf.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
  gl.bindVertexArray(null);

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  // Orbit geometry matches the CPU light curve in transit-cpu.js.
  // CPU convention: at orbital phase theta, the planet's sky-x is
  // a*cos(theta), sky-y is a*sin(theta)*cos(inc), depth toward
  // observer is a*sin(theta)*sin(inc) (positive = "in front" of
  // the star). The default camera sits at +x looking toward -x; its
  // screen-right is +z and screen-up is +y. So we map:
  //   world_x = a sin(theta) sin(inc)   (depth toward observer)
  //   world_y = a sin(theta) cos(inc)   (sky vertical, foreshortened)
  //   world_z = a cos(theta)            (sky horizontal)
  // With this mapping the planet is between the camera and the star
  // at theta = pi/2 (where the CPU's transitFlux dips), edge-on
  // (inc = pi/2) gives world_y = 0 (a horizontal chord), face-on
  // (inc = 0) collapses depth to zero (the ring becomes a circle in
  // the sky plane).
  function orbitPos(theta, A, inc) {
    const xo = A * Math.cos(theta);
    const yo = A * Math.sin(theta);
    return [yo * Math.sin(inc), yo * Math.cos(inc), xo];
  }

  // theta in radians; A is the orbit radius in WORLD units, expected
  // == a/Rs; inc the orbital inclination; Rp_world the planet radius
  // in WORLD units, expected == Rp/Rs; starColor a vec3.
  function update(theta, A, inc, Rp_world, starColor) {
    // Star at the origin with worldRadius = 1 (one Rs in world units).
    const o = NBG * 8;
    ptBuf[o] = 0; ptBuf[o + 1] = 0; ptBuf[o + 2] = 0;
    ptBuf[o + 3] = 1.0;                                 // world radius = Rs
    ptBuf[o + 4] = starColor[0]; ptBuf[o + 5] = starColor[1]; ptBuf[o + 6] = starColor[2];
    ptBuf[o + 7] = 1.0;                                 // tag: star

    const [px, py, pz] = orbitPos(theta, A, inc);
    const o2 = (NBG + 1) * 8;
    ptBuf[o2] = px; ptBuf[o2 + 1] = py; ptBuf[o2 + 2] = pz;
    ptBuf[o2 + 3] = Math.max(1e-4, Rp_world);          // world radius = Rp/Rs (shader floors size)
    ptBuf[o2 + 4] = 0.10; ptBuf[o2 + 5] = 0.10; ptBuf[o2 + 6] = 0.12;
    ptBuf[o2 + 7] = 2.0;                                // tag: planet
    gl.bindBuffer(gl.ARRAY_BUFFER, ptVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, ptBuf);

    for (let i = 0; i < RING_N; i += 1) {
      const t = (i / RING_N) * 2 * Math.PI;
      const [rx, ry, rz] = orbitPos(t, A, inc);
      ringBuf[i * 3] = rx; ringBuf[i * 3 + 1] = ry; ringBuf[i * 3 + 2] = rz;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, ringVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, ringBuf);
  }

  function render(view, proj, u1, u2, fovDeg) {
    const VP = mul(proj, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.01, 0.012, 0.02, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // points first (bg, star, planet) so the orbit-ring (drawn after)
    // is correctly depth-tested against the star: the front half of
    // the ring draws on top, the back half is occluded.
    gl.useProgram(ptProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(ptProg, 'uVP'), false, VP);
    // pixel-size scale factor K: pixels per world-unit at clip.w = 1
    // for a perspective projection. canvasHeight / (2 tan(fov/2)).
    const pixK = H / (2 * Math.tan((fovDeg ?? 35) * Math.PI / 360));
    gl.uniform1f(gl.getUniformLocation(ptProg, 'uPixK'), pixK);
    gl.uniform1f(gl.getUniformLocation(ptProg, 'uU1'), u1);
    gl.uniform1f(gl.getUniformLocation(ptProg, 'uU2'), u2);
    gl.bindVertexArray(ptVAO);
    gl.drawArrays(gl.POINTS, 0, NBG + 2);
    // orbit ring last (depth-tested against the star + planet).
    gl.useProgram(lnProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(lnProg, 'uVP'), false, VP);
    gl.uniform4f(gl.getUniformLocation(lnProg, 'uCol'), 0.45, 0.65, 0.9, 0.35);
    gl.bindVertexArray(ringVAO);
    gl.drawArrays(gl.LINE_LOOP, 0, RING_N);
    gl.bindVertexArray(null);
  }

  function dispose() { try { gl.deleteProgram(ptProg); gl.deleteProgram(lnProg); } catch { /* ignore */ } }
  return { gl, update, render, dispose };
}
