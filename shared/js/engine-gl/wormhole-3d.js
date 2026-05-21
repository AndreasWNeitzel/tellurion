// WebGL2 ray-marched Ellis / Morris-Thorne wormhole. Per pixel a null
// geodesic of ds^2 = -dt^2 + dl^2 + (b0^2+l^2)dOmega^2 is integrated
// from the camera through the throat; the ray ends in either this
// universe (l > 0) or the far one (l < 0) and samples a different
// procedural sky for each, so the throat shows a warped window into
// the other region. The metric and the traverse/scatter threshold are
// the real Ellis geometry (the CPU engine wormhole-cpu.js is the same
// math, tested). Drawn to the default framebuffer with in-shader ACES
// (the RGBA16F FBO path is not color-renderable in headless GL).

import { createGL2 } from './context.js';
import { compileProgram } from './shader.js';

const VS = `#version 300 es
layout(location=0) in vec2 a;
out vec2 vUV;
void main(){ vUV = a; gl_Position = vec4(a, 0.0, 1.0); }`;

// Procedural star sky. Two universes get distinct tints/seeds so the
// far region is visibly a different place.
const FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform float uAspect;
uniform float uB0;       // throat radius
uniform float uLcam;     // camera proper distance from the throat (signed)
uniform float uYaw;      // look angle
uniform float uTime;
out vec4 o;

vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
float h31(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }

// Star field sampled by a direction; side (>0 near, <0 far) picks
// the seed and colour so the two universes look different.
vec3 sky(vec3 d, float side){
  d = normalize(d);
  float seed = side > 0.0 ? 1.0 : 37.0;
  vec3 base = side > 0.0 ? vec3(0.015,0.02,0.05) : vec3(0.05,0.022,0.03);
  // quantise direction into cells, sparse bright points
  vec3 g = floor(d * 90.0 + seed);
  float s = h31(g);
  float star = smoothstep(0.9975, 1.0, s);
  float tw = 0.6 + 0.4 * sin(uTime*1.7 + s*40.0);
  vec3 col = base;
  vec3 sc = side > 0.0 ? vec3(0.8,0.85,1.0) : vec3(1.0,0.8,0.6);
  col += sc * star * (3.0 + 6.0*h31(g+5.0)) * tw;
  // faint nebular gradient differs per side
  col += (side>0.0? vec3(0.02,0.03,0.06): vec3(0.06,0.03,0.02)) * pow(max(0.0,d.y*0.5+0.5),2.0);
  return col;
}

void main(){
  vec2 uv = vec2(vUV.x*uAspect, vUV.y);
  // camera ray (pinhole) looking toward the throat (+ -> -z), with yaw
  vec3 rd = normalize(vec3(uv.x, uv.y, -1.4));
  float cy = cos(uYaw), sy = sin(uYaw);
  rd = vec3(cy*rd.x + sy*rd.z, rd.y, -sy*rd.x + cy*rd.z);

  float b0 = uB0;
  // Reduce to the photon plane: integrate (l, phi). The camera sits at
  // proper distance l = uLcam; r_cam = sqrt(b0^2 + l^2). The ray's
  // angle to the inward radial sets the impact parameter.
  float l = uLcam;
  float rcam = sqrt(b0*b0 + l*l);
  // inward radial is -z; psi between rd and -z
  float cospsi = clamp(dot(rd, vec3(0.0,0.0,-1.0)), -1.0, 1.0);
  float sinpsi = sqrt(max(0.0, 1.0 - cospsi*cospsi));
  float L = rcam * sinpsi;           // E = 1
  // azimuth of the ray around the throat axis (for the final dir)
  float az = atan(rd.y, rd.x);

  float ldot = (cospsi >= 0.0 ? -1.0 : 1.0) * sqrt(max(0.0, 1.0 - L*L/(rcam*rcam)));
  float ldot0 = ldot;                // initial sign: toward (-) or away from the throat
  float phi = 0.0;
  bool through = false;
  // integrate the Ellis null geodesic
  for (int i = 0; i < 160; i++){
    float r2 = b0*b0 + l*l;
    float dlam = 0.06 * (0.6 + 0.4*sqrt(r2)/b0);
    // RK2 on (l, ldot); phi from L/r^2
    float a1 = L*L*l/(r2*r2);
    float lh = l + 0.5*dlam*ldot;
    float vh = ldot + 0.5*dlam*a1;
    float r2h = b0*b0 + lh*lh;
    l += dlam*vh;
    ldot += dlam*(L*L*lh/(r2h*r2h));
    phi += dlam * (L / (b0*b0 + l*l));
    if (l < -16.0*b0){ through = true; break; }
    if (l > 34.0*b0 && ldot > 0.0){ through = false; break; }
  }
  float side = through ? -1.0 : 1.0;
  // asymptotic direction: deflected by total bend angle phi, kept in
  // the ray's azimuthal plane.
  float bend = phi;
  vec3 outDir = vec3(sin(bend)*cos(az), sin(bend)*sin(az), -cos(bend)*side);
  vec3 col = sky(outDir, side);

  // throat ring glow: where the impact parameter is near b0 the ray
  // skims the throat and is strongly lensed -> bright rim. Only rays
  // heading toward the throat skim it: a camera that has crossed into
  // the far universe and faces onward (uLcam and ldot0 same sign)
  // sees no rim, so the ring stays behind after a traversal.
  float skim = exp(-pow((L - b0)/(0.10*b0), 2.0));
  if (uLcam * ldot0 > 0.0) skim = 0.0;
  col += vec3(0.5,0.75,1.0) * skim * 0.7;

  o = vec4(aces(col), 1.0);
}`;

export function setupWormholeGL(canvas) {
  const gl = createGL2(canvas);
  const W = canvas.width, H = canvas.height;
  const prog = compileProgram(gl, VS, FS);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  function render(b0, lCam, yaw, time) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(prog);
    gl.uniform1f(gl.getUniformLocation(prog, 'uAspect'), W / H);
    gl.uniform1f(gl.getUniformLocation(prog, 'uB0'), b0);
    gl.uniform1f(gl.getUniformLocation(prog, 'uLcam'), lCam);
    gl.uniform1f(gl.getUniformLocation(prog, 'uYaw'), yaw);
    gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), time);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
  function dispose() { try { gl.deleteProgram(prog); } catch { /* ignore */ } }
  return { gl, render, dispose };
}
