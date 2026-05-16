// Earth precession + nutation hero engine.
// Renders a lit 3D Earth sphere with procedural continents + ice caps + sun
// + 3D axis line through both poles, all in world space transformed by the
// shared orbit-camera matrices.

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_SPHERE = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
out vec3 vWorld;
out vec3 vNormal;
void main() {
  vWorld = (uModel * vec4(aPos, 1.0)).xyz;
  vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FS_SPHERE = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
uniform vec3 uSunDir;
out vec4 oColor;
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i), n100 = hash(i + vec3(1,0,0));
  float n010 = hash(i + vec3(0,1,0)), n110 = hash(i + vec3(1,1,0));
  float n001 = hash(i + vec3(0,0,1)), n101 = hash(i + vec3(1,0,1));
  float n011 = hash(i + vec3(0,1,1)), n111 = hash(i + vec3(1,1,1));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 n = normalize(vNormal);
  vec3 l = normalize(uSunDir);
  float lambert = max(0.0, dot(n, l));
  // Texture in the model-rotated frame, the same vector the lighting
  // uses, so continents spin with the diurnal rotation in lockstep with
  // the day/night terminator (previously the texture used the un-rotated
  // mesh frame, so the surface stayed frozen while the shadow precessed).
  vec3 p = normalize(vWorld);
  float lat = asin(clamp(p.y, -0.999, 0.999));
  float cont = noise(p * 3.0) * 0.6 + noise(p * 7.0) * 0.3;
  float ice = smoothstep(1.10, 1.20, abs(lat));
  vec3 ocean = vec3(0.05, 0.20, 0.45);
  vec3 land = mix(vec3(0.40, 0.55, 0.25), vec3(0.55, 0.50, 0.30), cont);
  vec3 base = (cont > 0.45) ? land : ocean;
  base = mix(base, vec3(0.92, 0.95, 0.98), ice);
  float rim = pow(1.0 - max(0.0, dot(n, normalize(vec3(0.0, 0.0, 1.0)))), 3.0) * lambert;
  vec3 col = base * (0.15 + 1.05 * lambert) + vec3(0.4, 0.55, 0.85) * rim * 0.3;
  oColor = vec4(aces(col), 1.0);
}`;

const VS_LINE = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
uniform mat4 uMVP;
out vec3 vCol;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); vCol = aColor; }`;
const FS_LINE = `#version 300 es
precision highp float;
in vec3 vCol;
uniform float uAlpha;
out vec4 o;
void main() { o = vec4(vCol, uAlpha); }`;

const VS_PT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
uniform mat4 uMVP;
uniform float uPointSize;
out vec3 vCol;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); gl_PointSize = uPointSize; vCol = aColor; }`;
const FS_PT = `#version 300 es
precision highp float;
in vec3 vCol;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = exp(-dot(d, d) * 18.0);
  o = vec4(vCol * f, f);
}`;

function buildUVSphere(rings, sectors, radius) {
  const positions = []; const normals = []; const indices = [];
  for (let r = 0; r <= rings; r += 1) {
    const v = r / rings;
    const phi = v * Math.PI;
    for (let s = 0; s <= sectors; s += 1) {
      const u = s / sectors;
      const theta = u * 2 * Math.PI;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      positions.push(x * radius, y * radius, z * radius);
      normals.push(x, y, z);
    }
  }
  for (let r = 0; r < rings; r += 1) for (let s = 0; s < sectors; s += 1) {
    const a = r * (sectors + 1) + s;
    const b = a + sectors + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

export function setupEarthGL(canvas) {
  const gl = createGL2(canvas);
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const sphereProg = compileProgram(gl, VS_SPHERE, FS_SPHERE);
  const lineProg = compileProgram(gl, VS_LINE, FS_LINE);
  const ptProg = compileProgram(gl, VS_PT, FS_PT);
  const W = canvas.width, H = canvas.height;
  const sceneFBO = createFBO(gl, W, H, { depth: true });
  const post = setupPostProcess(gl, W, H);
  const sphere = buildUVSphere(36, 48, 1);
  const vboPos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vboPos); gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
  const vboNorm = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vboNorm); gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);
  const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
  const vboLinePos = gl.createBuffer();
  const vboLineCol = gl.createBuffer();
  const vboStarPos = gl.createBuffer();
  const vboStarCol = gl.createBuffer();
  const NSTARS = 400;
  const starPos = new Float32Array(NSTARS * 3);
  const starCol = new Float32Array(NSTARS * 3);
  let s = 0xC0FFEE >>> 0;
  const rnd = () => { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 0x100000000; };
  for (let i = 0; i < NSTARS; i += 1) {
    const z = 1 - 2 * rnd(); const phi = rnd() * 2 * Math.PI; const r = Math.sqrt(1 - z * z);
    starPos[3 * i] = 6 * r * Math.cos(phi);
    starPos[3 * i + 1] = 6 * z;
    starPos[3 * i + 2] = 6 * r * Math.sin(phi);
    const br = 0.4 + 0.6 * rnd();
    starCol[3 * i] = br * 0.95; starCol[3 * i + 1] = br * 0.95; starCol[3 * i + 2] = br;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vboStarPos); gl.bufferData(gl.ARRAY_BUFFER, starPos, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, vboStarCol); gl.bufferData(gl.ARRAY_BUFFER, starCol, gl.STATIC_DRAW);

  function render(viewMat, projMat, axisDir, sunDir, model, traceTips = null) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.012, 0.014, 0.022, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    const mvp = matMul(projMat, viewMat);
    // Starfield (additive points).
    gl.depthMask(false);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(ptProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(ptProg, 'uMVP'), false, mvp);
    gl.uniform1f(gl.getUniformLocation(ptProg, 'uPointSize'), 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboStarPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboStarCol); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, NSTARS);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    // Sphere.
    gl.useProgram(sphereProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(sphereProg, 'uMVP'), false, mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(sphereProg, 'uModel'), false, model);
    gl.uniform3f(gl.getUniformLocation(sphereProg, 'uSunDir'), sunDir[0], sunDir[1], sunDir[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboNorm); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
    // Two axes drawn in world space:
    //   1. Ecliptic pole (fixed white line along world +y).
    //   2. Earth's rotation axis (warm red, sweeps with precession).
    const axisCol = [0.85, 0.30, 0.20];
    const eclipCol = [0.92, 0.94, 0.98];
    const axScale = 2.4;
    const eclipScale = 2.0;
    const axisPos = new Float32Array([
      0, -eclipScale, 0,
      0, eclipScale, 0,
      -axisDir[0] * axScale, -axisDir[1] * axScale, -axisDir[2] * axScale,
      axisDir[0] * axScale, axisDir[1] * axScale, axisDir[2] * axScale,
    ]);
    const axisColBuf = new Float32Array([...eclipCol, ...eclipCol, ...axisCol, ...axisCol]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLinePos); gl.bufferData(gl.ARRAY_BUFFER, axisPos, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLineCol); gl.bufferData(gl.ARRAY_BUFFER, axisColBuf, gl.DYNAMIC_DRAW);
    gl.useProgram(lineProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uMVP'), false, mvp);
    gl.uniform1f(gl.getUniformLocation(lineProg, 'uAlpha'), 0.85);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLinePos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLineCol); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 4);
    // Axis-tip trace: connect successive tips with line segments, alpha fading.
    if (traceTips && traceTips.length >= 4) {
      const segs = (traceTips.length / 3) - 1;
      const tracePos = new Float32Array(segs * 6);
      const traceCol = new Float32Array(segs * 6);
      for (let i = 0; i < segs; i += 1) {
        const a = i * 3, b = (i + 1) * 3;
        tracePos[6 * i + 0] = traceTips[a];     tracePos[6 * i + 1] = traceTips[a + 1]; tracePos[6 * i + 2] = traceTips[a + 2];
        tracePos[6 * i + 3] = traceTips[b];     tracePos[6 * i + 4] = traceTips[b + 1]; tracePos[6 * i + 5] = traceTips[b + 2];
        const fade = i / segs;
        traceCol[6 * i + 0] = 0.85 * fade; traceCol[6 * i + 1] = 0.40 * fade; traceCol[6 * i + 2] = 0.25 * fade;
        traceCol[6 * i + 3] = 0.85 * fade; traceCol[6 * i + 4] = 0.40 * fade; traceCol[6 * i + 5] = 0.25 * fade;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vboLinePos); gl.bufferData(gl.ARRAY_BUFFER, tracePos, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, vboLineCol); gl.bufferData(gl.ARRAY_BUFFER, traceCol, gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.uniform1f(gl.getUniformLocation(lineProg, 'uAlpha'), 0.9);
      gl.bindBuffer(gl.ARRAY_BUFFER, vboLinePos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vboLineCol); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, segs * 2);
      gl.disable(gl.BLEND);
    }
    // Sun marker.
    gl.useProgram(ptProg);
    gl.uniform1f(gl.getUniformLocation(ptProg, 'uPointSize'), 30);
    const sunPos = new Float32Array([sunDir[0] * 4, sunDir[1] * 4, sunDir[2] * 4]);
    const sunCol = new Float32Array([1.0, 0.95, 0.7]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLinePos); gl.bufferData(gl.ARRAY_BUFFER, sunPos, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLineCol); gl.bufferData(gl.ARRAY_BUFFER, sunCol, gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLinePos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vboLineCol); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    post.run(sceneFBO.tex, 0.85, 0.25, 0.5);
  }
  return { gl, render };
}

function matMul(a, b) {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    let s = 0; for (let k = 0; k < 4; k += 1) s += a[i + 4 * k] * b[k + 4 * j];
    r[i + 4 * j] = s;
  }
  return r;
}
