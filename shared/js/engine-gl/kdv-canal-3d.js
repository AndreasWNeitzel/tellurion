// WebGL2 renderer for the soliton canal: a 1D KdV height field u(x)
// lofted into a 3D reflective water strip with an analytic HDR sky,
// Fresnel reflection, a Blinn-Phong sun specular, concrete banks, and
// a caustic-lit floor. The renderer owns no physics; it draws whatever
// height array the caller uploads each frame (the KdV integrator lives
// in shared/js/engine/kdv-1d-spectral-cpu.js). Reuses the shared GL2
// context, shader, FBO and postprocess (bloom + ACES) modules so the
// established tonemapping is consistent with the other heroes.
//
// WebGL2 is required (documented in the playground spec.md): a
// reflective animated water surface with per-pixel Fresnel and an HDR
// sky cannot be done in Canvas2D at 60 fps.

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';

// Shared ACES tonemap + a touch of dither, applied in-shader so the
// scene draws straight to the default framebuffer (no intermediate
// RGBA16F FBO, which is not color-renderable in headless SwiftShader
// and would render black). HDR highlights (the sun specular) are
// kept by an analytic glow term rather than a separable bloom pass.
const TONEMAP_GLSL = `
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
float dh(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec4 tonemap(vec3 c, vec2 frag){
  vec3 o = aces(c);
  o += vec3(dh(frag) - 0.5) / 255.0;
  return vec4(o, 1.0);
}`;

const SKY_GLSL = `
vec3 skyColor(vec3 d) {
  d = normalize(d);
  float t = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 horizon = vec3(0.62, 0.70, 0.84);
  vec3 zenith  = vec3(0.16, 0.33, 0.62);
  vec3 ground  = vec3(0.10, 0.12, 0.15);
  vec3 sky = (d.y < 0.0) ? mix(horizon, ground, clamp(-d.y * 2.5, 0.0, 1.0))
                         : mix(horizon, zenith, pow(t, 0.55));
  vec3 sunDir = normalize(vec3(-0.35, 0.55, -0.74));
  float s = max(dot(d, sunDir), 0.0);
  sky += vec3(1.4, 1.15, 0.8) * pow(s, 250.0) * 6.0;     // sun disc (HDR)
  sky += vec3(0.9, 0.8, 0.6) * pow(s, 14.0) * 0.28;      // sun glow
  return sky;
}`;

// Fullscreen sky background. Reconstruct a world ray from clip space
// using the inverse view-projection.
const VS_SKY = `#version 300 es
layout(location=0) in vec2 a;
out vec2 vClip;
void main(){ vClip = a; gl_Position = vec4(a, 1.0, 1.0); }`;

const FS_SKY = `#version 300 es
precision highp float;
in vec2 vClip;
uniform mat4 uInvVP;
uniform vec3 uEye;
out vec4 o;
${SKY_GLSL}
${TONEMAP_GLSL}
void main(){
  vec4 far = uInvVP * vec4(vClip, 1.0, 1.0);
  vec3 world = far.xyz / far.w;
  o = tonemap(skyColor(world - uEye), gl_FragCoord.xy);
}`;

// Water surface. NX x NZ grid; X is along the canal, Z across. Height
// from a 1D R32F texture (one texel per along-canal node). Normal by
// central differences of the texture plus the transverse bank taper.
const VS_WATER = `#version 300 es
layout(location=0) in vec2 aGrid;     // (i in [0,1] along, j in [0,1] across)
uniform mat4 uVP;
uniform sampler2D uHeight;            // R32F, width NX, height 1
uniform float uNX;
uniform float uAX;                    // half-length (world X)
uniform float uAZ;                    // half-width  (world Z)
uniform float uHScale;                // vertical exaggeration
out vec3 vWorld;
out vec3 vNormal;
out float vH;
float bank(float jz){ return 1.0 - pow(abs(jz), 6.0); }   // taper to the banks
float sampleH(float iu){
  return texture(uHeight, vec2(clamp(iu, 0.0, 1.0), 0.5)).r;
}
void main(){
  float i = aGrid.x, j = aGrid.y;
  float jz = j * 2.0 - 1.0;
  float bk = bank(jz);
  float h = sampleH(i) * uHScale * bk;
  float wx = (i - 0.5) * 2.0 * uAX;
  float wz = jz * uAZ;
  vec3 P = vec3(wx, h, wz);
  float du = 1.0 / uNX;
  float hL = sampleH(i - du) * uHScale * bk;
  float hR = sampleH(i + du) * uHScale * bk;
  float dHdx = (hR - hL) / (2.0 * du * 2.0 * uAX);
  float dHdz = sampleH(i) * uHScale * (-6.0 * pow(abs(jz), 5.0) * sign(jz)) / uAZ;
  vec3 N = normalize(vec3(-dHdx, 1.0, -dHdz));
  vWorld = P; vNormal = N; vH = sampleH(i);
  gl_Position = uVP * vec4(P, 1.0);
}`;

const FS_WATER = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in float vH;
uniform vec3 uEye;
out vec4 o;
${SKY_GLSL}
${TONEMAP_GLSL}
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uEye - vWorld);
  vec3 R = reflect(-V, N);
  vec3 refl = skyColor(R);
  // Deep-water body: dark navy in the troughs warming to a clear
  // teal on the crests (more water depth catches more light).
  vec3 deep = mix(vec3(0.006, 0.035, 0.060), vec3(0.02, 0.13, 0.165),
                  clamp(vH * 1.6 + 0.45, 0.0, 1.0));
  // Schlick Fresnel; reflection dominates at grazing angles so the
  // surface reads as water mirroring the sky, not a coloured solid.
  float fres = 0.025 + 0.975 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 col = mix(deep, refl, fres);
  // Blinn-Phong sun specular (HDR highlight).
  vec3 sunDir = normalize(vec3(-0.35, 0.55, -0.74));
  vec3 Hh = normalize(sunDir + V);
  col += vec3(1.4, 1.22, 0.92) * pow(max(dot(N, Hh), 0.0), 320.0) * 4.0;
  // Faint crest sheen only on the genuinely steep soliton front.
  float steep = clamp(1.0 - N.y, 0.0, 1.0);
  col += vec3(0.30, 0.42, 0.46) * smoothstep(0.03, 0.10, steep) * 0.18;
  // Soft sun-glow halo in the reflection (stands in for bloom).
  float sg = max(dot(R, sunDir), 0.0);
  col += vec3(1.0, 0.88, 0.66) * pow(sg, 60.0) * 0.45;
  o = tonemap(col, gl_FragCoord.xy);
}`;

// Concrete banks and a caustic-lit floor. The floor samples the height
// texture to fake refractive focusing (caustics brighten under the
// soliton crest where the surface curvature converges light).
const VS_SOLID = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUV;
uniform mat4 uVP;
out vec3 vWorld;
out vec2 vUV;
void main(){ vWorld = aPos; vUV = aUV; gl_Position = uVP * vec4(aPos, 1.0); }`;

const FS_SOLID = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec2 vUV;
uniform int uIsFloor;
uniform sampler2D uHeight;
uniform float uHScale;
uniform vec3 uEye;
out vec4 o;
${TONEMAP_GLSL}
void main(){
  if (uIsFloor == 1) {
    float i = vUV.x;
    float du = 1.0 / 512.0;
    float hC = texture(uHeight, vec2(i, 0.5)).r;
    float hL = texture(uHeight, vec2(i - du, 0.5)).r;
    float hR = texture(uHeight, vec2(i + du, 0.5)).r;
    float curv = (hL + hR - 2.0 * hC) / (du * du);     // surface curvature
    float caustic = clamp(0.35 - curv * 0.02, 0.05, 1.6);
    vec3 floorCol = vec3(0.05, 0.10, 0.12) * (0.5 + caustic);
    floorCol += vec3(0.10, 0.16, 0.18) * smoothstep(0.4, 1.4, caustic);
    o = tonemap(floorCol, gl_FragCoord.xy);
  } else {
    // Banded concrete bank with a soft top edge.
    float band = 0.5 + 0.5 * sin(vWorld.x * 3.0);
    vec3 c = mix(vec3(0.16, 0.16, 0.17), vec3(0.22, 0.21, 0.20), band * 0.4);
    c *= 0.7 + 0.3 * vUV.y;
    o = tonemap(c, gl_FragCoord.xy);
  }
}`;

function buildWaterMesh(gl, NX, NZ) {
  const verts = [];
  for (let j = 0; j < NZ; j += 1) {
    for (let i = 0; i < NX; i += 1) verts.push(i / (NX - 1), j / (NZ - 1));
  }
  const idx = [];
  for (let j = 0; j < NZ - 1; j += 1) {
    for (let i = 0; i < NX - 1; i += 1) {
      const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, count: idx.length };
}

// pos(x,y,z) + uv. Floor spans the canal; banks are two side strips.
function buildSolids(gl, AX, AZ, depth, bankH) {
  const floor = [
    -AX, -depth, -AZ, 0, 0, AX, -depth, -AZ, 1, 0, AX, -depth, AZ, 1, 1,
    -AX, -depth, -AZ, 0, 0, AX, -depth, AZ, 1, 1, -AX, -depth, AZ, 0, 1,
  ];
  const mkWall = (zc, zo) => ([
    -AX, -depth, zc, 0, 0, AX, -depth, zc, 1, 0, AX, bankH, zc + zo, 1, 1,
    -AX, -depth, zc, 0, 0, AX, bankH, zc + zo, 1, 1, -AX, bankH, zc + zo, 0, 1,
  ]);
  const data = floor.concat(mkWall(-AZ, -0.18)).concat(mkWall(AZ, 0.18));
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
  gl.bindVertexArray(null);
  return { vao, floorCount: 6, wallStart: 6, wallCount: 12 };
}

export function setupKdVCanalGL(canvas, NX = 512) {
  const gl = createGL2(canvas);
  const W = canvas.width, H = canvas.height;
  const NZ = 28;
  const AX = 9.0, AZ = 1.6, DEPTH = 1.1, BANKH = 0.42, HSCALE = 1.5;

  const skyProg = compileProgram(gl, VS_SKY, FS_SKY);
  const waterProg = compileProgram(gl, VS_WATER, FS_WATER);
  const solidProg = compileProgram(gl, VS_SOLID, FS_SOLID);
  const water = buildWaterMesh(gl, NX, NZ);
  const solids = buildSolids(gl, AX, AZ, DEPTH, BANKH);

  const skyVAO = gl.createVertexArray();
  gl.bindVertexArray(skyVAO);
  const skyVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // Height texture (R32F, NX x 1), NEAREST so a vertex samples its own
  // texel exactly; CLAMP so the periodic seam is handled by the caller.
  const hTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, hTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, NX, 1, 0, gl.RED, gl.FLOAT, new Float32Array(NX));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const hBuf = new Float32Array(NX);

  function setHeights(u) {
    for (let i = 0; i < NX; i += 1) hBuf[i] = u[i];
    gl.bindTexture(gl.TEXTURE_2D, hTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NX, 1, gl.RED, gl.FLOAT, hBuf);
  }

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function invert(m) {
    const inv = new Float32Array(16), a = m;
    inv[0] = a[5]*a[10]*a[15]-a[5]*a[11]*a[14]-a[9]*a[6]*a[15]+a[9]*a[7]*a[14]+a[13]*a[6]*a[11]-a[13]*a[7]*a[10];
    inv[4]=-a[4]*a[10]*a[15]+a[4]*a[11]*a[14]+a[8]*a[6]*a[15]-a[8]*a[7]*a[14]-a[12]*a[6]*a[11]+a[12]*a[7]*a[10];
    inv[8]=a[4]*a[9]*a[15]-a[4]*a[11]*a[13]-a[8]*a[5]*a[15]+a[8]*a[7]*a[13]+a[12]*a[5]*a[11]-a[12]*a[7]*a[9];
    inv[12]=-a[4]*a[9]*a[14]+a[4]*a[10]*a[13]+a[8]*a[5]*a[14]-a[8]*a[6]*a[13]-a[12]*a[5]*a[10]+a[12]*a[6]*a[9];
    inv[1]=-a[1]*a[10]*a[15]+a[1]*a[11]*a[14]+a[9]*a[2]*a[15]-a[9]*a[3]*a[14]-a[13]*a[2]*a[11]+a[13]*a[3]*a[10];
    inv[5]=a[0]*a[10]*a[15]-a[0]*a[11]*a[14]-a[8]*a[2]*a[15]+a[8]*a[3]*a[14]+a[12]*a[2]*a[11]-a[12]*a[3]*a[10];
    inv[9]=-a[0]*a[9]*a[15]+a[0]*a[11]*a[13]+a[8]*a[1]*a[15]-a[8]*a[3]*a[13]-a[12]*a[1]*a[11]+a[12]*a[3]*a[9];
    inv[13]=a[0]*a[9]*a[14]-a[0]*a[10]*a[13]-a[8]*a[1]*a[14]+a[8]*a[2]*a[13]+a[12]*a[1]*a[10]-a[12]*a[2]*a[9];
    inv[2]=a[1]*a[6]*a[15]-a[1]*a[7]*a[14]-a[5]*a[2]*a[15]+a[5]*a[3]*a[14]+a[13]*a[2]*a[7]-a[13]*a[3]*a[6];
    inv[6]=-a[0]*a[6]*a[15]+a[0]*a[7]*a[14]+a[4]*a[2]*a[15]-a[4]*a[3]*a[14]-a[12]*a[2]*a[7]+a[12]*a[3]*a[6];
    inv[10]=a[0]*a[5]*a[15]-a[0]*a[7]*a[13]-a[4]*a[1]*a[15]+a[4]*a[3]*a[13]+a[12]*a[1]*a[7]-a[12]*a[3]*a[5];
    inv[14]=-a[0]*a[5]*a[14]+a[0]*a[6]*a[13]+a[4]*a[1]*a[14]-a[4]*a[2]*a[13]-a[12]*a[1]*a[6]+a[12]*a[2]*a[5];
    inv[3]=-a[1]*a[6]*a[11]+a[1]*a[7]*a[10]+a[5]*a[2]*a[11]-a[5]*a[3]*a[10]-a[9]*a[2]*a[7]+a[9]*a[3]*a[6];
    inv[7]=a[0]*a[6]*a[11]-a[0]*a[7]*a[10]-a[4]*a[2]*a[11]+a[4]*a[3]*a[10]+a[8]*a[2]*a[7]-a[8]*a[3]*a[6];
    inv[11]=-a[0]*a[5]*a[11]+a[0]*a[7]*a[9]+a[4]*a[1]*a[11]-a[4]*a[3]*a[9]-a[8]*a[1]*a[7]+a[8]*a[3]*a[5];
    inv[15]=a[0]*a[5]*a[10]-a[0]*a[6]*a[9]-a[4]*a[1]*a[10]+a[4]*a[2]*a[9]+a[8]*a[1]*a[6]-a[8]*a[2]*a[5];
    let det = a[0]*inv[0]+a[1]*inv[4]+a[2]*inv[8]+a[3]*inv[12];
    det = det ? 1.0 / det : 0.0;
    for (let i = 0; i < 16; i += 1) inv[i] *= det;
    return inv;
  }

  function render(view, proj, eye) {
    const VP = mul(proj, view);
    const invVP = invert(VP);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky background (no depth).
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(skyProg, 'uInvVP'), false, invVP);
    gl.uniform3f(gl.getUniformLocation(skyProg, 'uEye'), eye[0], eye[1], eye[2]);
    gl.bindVertexArray(skyVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Floor + banks.
    gl.useProgram(solidProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(solidProg, 'uVP'), false, VP);
    gl.uniform3f(gl.getUniformLocation(solidProg, 'uEye'), eye[0], eye[1], eye[2]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hTex);
    gl.uniform1i(gl.getUniformLocation(solidProg, 'uHeight'), 0);
    gl.uniform1f(gl.getUniformLocation(solidProg, 'uHScale'), HSCALE);
    gl.bindVertexArray(solids.vao);
    gl.uniform1i(gl.getUniformLocation(solidProg, 'uIsFloor'), 1);
    gl.drawArrays(gl.TRIANGLES, 0, solids.floorCount);
    gl.uniform1i(gl.getUniformLocation(solidProg, 'uIsFloor'), 0);
    gl.drawArrays(gl.TRIANGLES, solids.wallStart, solids.wallCount);

    // Water.
    gl.useProgram(waterProg);
    gl.uniformMatrix4fv(gl.getUniformLocation(waterProg, 'uVP'), false, VP);
    gl.uniform3f(gl.getUniformLocation(waterProg, 'uEye'), eye[0], eye[1], eye[2]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hTex);
    gl.uniform1i(gl.getUniformLocation(waterProg, 'uHeight'), 0);
    gl.uniform1f(gl.getUniformLocation(waterProg, 'uNX'), NX);
    gl.uniform1f(gl.getUniformLocation(waterProg, 'uAX'), AX);
    gl.uniform1f(gl.getUniformLocation(waterProg, 'uAZ'), AZ);
    gl.uniform1f(gl.getUniformLocation(waterProg, 'uHScale'), HSCALE);
    gl.bindVertexArray(water.vao);
    gl.drawElements(gl.TRIANGLES, water.count, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);

    gl.disable(gl.DEPTH_TEST);
  }

  function dispose() {
    try {
      gl.deleteTexture(hTex);
      gl.deleteProgram(skyProg); gl.deleteProgram(waterProg); gl.deleteProgram(solidProg);
    } catch { /* ignore */ }
  }

  return { gl, setHeights, render, dispose, AX, NX, HSCALE };
}
