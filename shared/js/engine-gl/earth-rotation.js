// WebGL2 oblate-Earth renderer with procedural land/sea + rotation axis line.
// Reference: Smart, Celestial Mechanics; texture-from-noise pattern.
import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';
import { createFBO } from './fbo.js';
import { setupPostProcess } from './postprocess.js';

const VS_SPHERE = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uMVP;
uniform mat4 uModel;
out vec3 vWorld;
out vec3 vLocal;
void main() {
  vLocal = aPos;
  vWorld = (uModel * vec4(aPos, 1.0)).xyz;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FS_SPHERE = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vLocal;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
out vec4 oColor;
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i), n100 = hash(i + vec3(1, 0, 0)), n010 = hash(i + vec3(0, 1, 0)), n110 = hash(i + vec3(1, 1, 0));
  float n001 = hash(i + vec3(0, 0, 1)), n101 = hash(i + vec3(1, 0, 1)), n011 = hash(i + vec3(0, 1, 1)), n111 = hash(i + vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
             mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}
float fbm(vec3 p) { return noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 n = normalize(vLocal);
  vec3 sun = normalize(uSunDir);
  float lit = max(0.05, dot(n, sun));
  // Procedural texture.
  float landNoise = fbm(n * 3.0);
  vec3 ocean = vec3(0.08, 0.18, 0.35);
  vec3 land = vec3(0.25, 0.4, 0.18) + 0.05 * fbm(n * 12.0);
  vec3 ice = vec3(0.92, 0.94, 0.98);
  float lat = abs(n.y);
  vec3 albedo;
  if (lat > 0.85) albedo = ice;
  else if (landNoise > 0.5) albedo = land;
  else albedo = ocean;
  vec3 col = albedo * lit;
  // Atmosphere rim glow.
  float rim = pow(1.0 - max(0.0, dot(n, normalize(uCamPos - vWorld))), 3.0);
  col += vec3(0.4, 0.55, 0.9) * rim * 0.4;
  oColor = vec4(aces(col), 1.0);
}`;

const VS_AXIS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uMVP;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`;

const FS_AXIS = `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 oColor;
void main() { oColor = vec4(uColor, 1.0); }`;

export function setupEarthGL(canvas) {
  const gl = createGL2(canvas);
  const sphereProg = compileProgram(gl, VS_SPHERE, FS_SPHERE);
  const axisProg = compileProgram(gl, VS_AXIS, FS_AXIS);
  // Sphere mesh (slightly oblate).
  const lat = 40, lon = 60;
  const verts = []; const idx = [];
  for (let i = 0; i <= lat; i += 1) for (let j = 0; j <= lon; j += 1) {
    const u = i / lat * Math.PI; const v = j / lon * 2 * Math.PI;
    const x = Math.sin(u) * Math.cos(v);
    const y = Math.cos(u) * 0.997; // oblate factor.
    const z = Math.sin(u) * Math.sin(v);
    verts.push(x, y, z);
  }
  for (let i = 0; i < lat; i += 1) for (let j = 0; j < lon; j += 1) {
    const a = i * (lon + 1) + j; const b = (i + 1) * (lon + 1) + j;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const axisVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, axisVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1.3, 0, 0, 1.3, 0]), gl.STATIC_DRAW);
  let sceneFBO = null, post = null;
  function render(t, obliquityDeg, precessionDeg) {
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
    const az = Math.PI * 0.6 + t * 0.05;
    const el = 0.3;
    const r = 4;
    const eye = [r * Math.cos(el) * Math.cos(az), r * Math.sin(el), r * Math.cos(el) * Math.sin(az)];
    const tgt = [0, 0, 0]; const up = [0, 1, 0];
    const view = lookAt(eye, tgt, up);
    const proj = perspective(40 * Math.PI / 180, W / H, 0.1, 100);
    const eps = obliquityDeg * Math.PI / 180;
    const prec = precessionDeg * Math.PI / 180;
    // Tilt + precess: Rz(precession) * Rx(obliquity).
    const rotX = rotXMat(eps);
    const rotZ = rotZMat(prec);
    const spin = rotYMat(t * 2);
    const model = matMul(matMul(rotZ, rotX), spin);
    const mvp = matMul(matMul(proj, view), model);
    // Sphere.
    gl.useProgram(sphereProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(sphereProg, 'uMVP'), false, mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(sphereProg, 'uModel'), false, model);
    gl.uniform3f(gl.getUniformLocation(sphereProg, 'uCamPos'), eye[0], eye[1], eye[2]);
    gl.uniform3f(gl.getUniformLocation(sphereProg, 'uSunDir'), 0.7, 0.3, -0.6);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    // Axis (without spin).
    const axisMVP = matMul(matMul(proj, view), matMul(rotZ, rotX));
    gl.useProgram(axisProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(axisProg, 'uMVP'), false, axisMVP);
    gl.uniform3f(gl.getUniformLocation(axisProg, 'uColor'), 1.0, 0.82, 0.4);
    gl.bindBuffer(gl.ARRAY_BUFFER, axisVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.lineWidth(2);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.disable(gl.DEPTH_TEST);
    // Subtle bloom on the bright Earth-lit hemisphere and axis.
    post.run(sceneFBO.tex, 0.9, 0.25, 0.35);
  }
  return { render };
}
function rotXMat(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
function rotYMat(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
function rotZMat(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); }
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
function sub(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function norm(v) { const m = Math.sqrt(dot(v,v)); return [v[0]/m,v[1]/m,v[2]/m]; }
function matMul(a,b) { const r = new Float32Array(16); for (let i=0;i<4;i+=1) for (let j=0;j<4;j+=1) { let s=0; for (let k=0;k<4;k+=1) s+=a[i+4*k]*b[k+4*j]; r[i+4*j]=s; } return r; }
