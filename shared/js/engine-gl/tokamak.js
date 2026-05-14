// WebGL2 tokamak renderer: torus mesh (translucent vessel) + helical field-line bundle.
// Field lines: instanced LINE_STRIPS, each with a per-line offset + color hue.
// Lit with three-point Blinn-Phong; ACES + vignette on final pass.
// Reference: Goedbloed-Poedts Ch. 5 (`goedbloed-plasma`); standard 3D rendering.
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_VESSEL = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vWorld;
void main() {
  vWorld = (uModel * vec4(aPos, 1.0)).xyz;
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FS_VESSEL = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
uniform vec3 uCamPos;
out vec4 oColor;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCamPos - vWorld);
  vec3 lKey = normalize(vec3(0.6, 0.7, 0.5));
  vec3 lFill = normalize(vec3(-0.3, -0.2, 0.6));
  vec3 albedo = vec3(0.3, 0.5, 0.8);
  float diffK = max(0.0, dot(n, lKey));
  float diffF = max(0.0, dot(n, lFill));
  vec3 col = albedo * (diffK * 0.8 + diffF * 0.3 + 0.15);
  oColor = vec4(aces(col), 0.18);
}`;

const VS_LINE = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in float aHue;
uniform mat4 uMVP;
out vec3 vColor;
vec3 hsv(float h, float s, float v) {
  vec3 k = vec3(5.0, 3.0, 1.0) / 6.0;
  vec3 p = abs(fract(h + k) * 6.0 - 3.0) - 1.0;
  return v * mix(vec3(1.0), clamp(p, 0.0, 1.0), s);
}
void main() {
  vColor = hsv(aHue, 0.7, 1.0);
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FS_LINE = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 oColor;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() { oColor = vec4(aces(vColor * 1.2), 1.0); }`;

// Test-particle banana orbit. Trapped particles bounce between two mirror points;
// pitch angle theta_b sets bounce extent. Drift toroidally meanwhile.
// Reference: Wesson, Tokamaks Ch. 3 (`wesson-tokamaks`).
const VS_BANANA = `#version 300 es
uniform mat4 uMVP;
uniform float uT;
uniform float uR0;
uniform float uA;
uniform float uQ;
out vec3 vColor;
void main() {
  // gl_VertexID picks a particle id; we synthesize position from the id and time.
  float id = float(gl_VertexID);
  float k = id / 12.0;
  // Each particle has its own minor-radius r and bounce extent.
  float r_off = uA * (0.25 + 0.55 * k);
  float bounceAmp = 0.8 + 0.4 * k;             // banana extent in poloidal theta.
  float omega_b = 0.6 + 0.5 * k;               // bounce angular frequency.
  float omega_phi = 0.18 + 0.07 * k;           // toroidal drift rate.
  float phi = id * 0.52 + uT * omega_phi;
  // Banana shape: theta oscillates around a midplane bounce point.
  float theta = bounceAmp * sin(uT * omega_b + id * 0.7);
  float x = (uR0 + r_off * cos(theta)) * cos(phi);
  float y = r_off * sin(theta);
  float z = (uR0 + r_off * cos(theta)) * sin(phi);
  gl_Position = uMVP * vec4(x, y, z, 1.0);
  gl_PointSize = 6.0;
  // Hue shifts with bounce phase.
  vColor = vec3(1.0, 0.6 + 0.4 * sin(uT * omega_b + id), 0.3);
}`;

const FS_BANANA = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 oColor;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float falloff = exp(-r2 * 2.0);
  oColor = vec4(vColor * (1.0 + falloff), 1.0);
}`;

export function setupTokamakGL(canvas) {
  const gl = createGL2(canvas);
  const vesselProg = compileProgram(gl, VS_VESSEL, FS_VESSEL);
  const lineProg = compileProgram(gl, VS_LINE, FS_LINE);
  const bananaProg = compileProgram(gl, VS_BANANA, FS_BANANA);
  // Torus mesh.
  function buildTorus(R, a, nMajor, nMinor) {
    const verts = []; const norms = []; const idx = [];
    for (let i = 0; i <= nMajor; i += 1) for (let j = 0; j <= nMinor; j += 1) {
      const phi = i / nMajor * 2 * Math.PI;
      const th = j / nMinor * 2 * Math.PI;
      const x = (R + a * Math.cos(th)) * Math.cos(phi);
      const y = a * Math.sin(th);
      const z = (R + a * Math.cos(th)) * Math.sin(phi);
      verts.push(x, y, z);
      const nx = Math.cos(th) * Math.cos(phi);
      const ny = Math.sin(th);
      const nz = Math.cos(th) * Math.sin(phi);
      norms.push(nx, ny, nz);
    }
    for (let i = 0; i < nMajor; i += 1) for (let j = 0; j < nMinor; j += 1) {
      const a0 = i * (nMinor + 1) + j;
      const b0 = (i + 1) * (nMinor + 1) + j;
      idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
    }
    return { verts: new Float32Array(verts), norms: new Float32Array(norms), idx: new Uint16Array(idx) };
  }
  const torus = buildTorus(1.0, 0.35, 60, 30);
  const vboT = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboT); gl.bufferData(gl.ARRAY_BUFFER, torus.verts, gl.STATIC_DRAW);
  const nboT = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nboT); gl.bufferData(gl.ARRAY_BUFFER, torus.norms, gl.STATIC_DRAW);
  const iboT = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iboT); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, torus.idx, gl.STATIC_DRAW);
  // Field line buffers (built lazily).
  const lineVBO = gl.createBuffer();
  const hueVBO = gl.createBuffer();
  let lineLen = 0;
  function buildFieldLines(R, a, q, nLines) {
    const verts = []; const hues = [];
    for (let k = 0; k < nLines; k += 1) {
      const r_off = (k + 0.5) / nLines * a * 0.85;
      const hue = (k / nLines) * 0.7;
      const turns = 14;
      const segs = 800;
      for (let s = 0; s < segs; s += 1) {
        const t0 = s / segs, t1 = (s + 1) / segs;
        for (const tt of [t0, t1]) {
          const phi = tt * 2 * Math.PI;
          const th = tt * 2 * Math.PI * turns / q;
          const x = (R + r_off * Math.cos(th)) * Math.cos(phi);
          const y = r_off * Math.sin(th);
          const z = (R + r_off * Math.cos(th)) * Math.sin(phi);
          verts.push(x, y, z); hues.push(hue);
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, lineVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, hueVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hues), gl.DYNAMIC_DRAW);
    lineLen = verts.length / 3;
  }
  let sceneFBO = null, post = null;
  function render(t, R = 1.0, a = 0.35, q = 3) {
    const W = canvas.width, H = canvas.height;
    if (!sceneFBO || sceneFBO.w !== W || sceneFBO.h !== H) {
      sceneFBO = createFBO(gl, W, H, { depth: true });
      post = setupPostProcess(gl, W, H);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.024, 0.024, 0.031, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    const az = Math.PI * 0.3 + t * 0.05;
    const el = 0.5;
    const r = 4;
    const eye = [r * Math.cos(el) * Math.cos(az), r * Math.sin(el), r * Math.cos(el) * Math.sin(az)];
    const tgt = [0, 0, 0]; const up = [0, 1, 0];
    const view = lookAt(eye, tgt, up);
    const proj = perspective(45 * Math.PI / 180, W / H, 0.1, 100);
    const mvp = matMul(proj, view);
    const model = identity();
    // Lines first (opaque).
    gl.useProgram(lineProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uMVP'), false, mvp);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, hueVBO);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, lineLen);
    gl.disableVertexAttribArray(1);
    // Vessel last (translucent).
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(vesselProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(vesselProg, 'uMVP'), false, mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(vesselProg, 'uModel'), false, model);
    gl.uniform3f(gl.getUniformLocation(vesselProg, 'uCamPos'), eye[0], eye[1], eye[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboT);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, nboT);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iboT);
    gl.drawElements(gl.TRIANGLES, torus.idx.length, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true); gl.disable(gl.BLEND);
    // Banana-orbit test particles: 12 points moving along trapped orbits.
    gl.useProgram(bananaProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(bananaProg, 'uMVP'), false, mvp);
    gl.uniform1f(gl.getUniformLocation(bananaProg, 'uT'), t);
    gl.uniform1f(gl.getUniformLocation(bananaProg, 'uR0'), R);
    gl.uniform1f(gl.getUniformLocation(bananaProg, 'uA'), a);
    gl.uniform1f(gl.getUniformLocation(bananaProg, 'uQ'), q);
    gl.drawArrays(gl.POINTS, 0, 12);
    gl.disable(gl.DEPTH_TEST);
    // Bloom on bright field-line tubes + particles.
    post.run(sceneFBO.tex, 0.85, 0.25, 0.55);
  }
  return { buildFieldLines, render };
}
function lookAt(eye, tgt, up) {
  const f = norm(sub(tgt, eye));
  const s = norm(cross(f, up));
  const u = cross(s, f);
  return new Float32Array([s[0],u[0],-f[0],0,s[1],u[1],-f[1],0,s[2],u[2],-f[2],0,-dot(s,eye),-dot(u,eye),dot(f,eye),1]);
}
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
}
function identity() { const m = new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; }
function sub(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function norm(v) { const m = Math.sqrt(dot(v,v)); return [v[0]/m,v[1]/m,v[2]/m]; }
function matMul(a,b) { const r = new Float32Array(16); for (let i=0;i<4;i+=1) for (let j=0;j<4;j+=1) { let s=0; for (let k=0;k<4;k+=1) s+=a[i+4*k]*b[k+4*j]; r[i+4*j]=s; } return r; }
