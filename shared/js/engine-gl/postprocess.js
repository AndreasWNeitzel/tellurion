// Hero post-processing: bloom (separable Gaussian blur threshold + composite) + ACES + dither + vignette.
// Operates on an RGBA16F input FBO; output goes to default framebuffer.
// Reference: Karis 2013 SIGGRAPH ("Real Shading in UE4") for bloom thresholding; Hill 2017 for ACES.
import { compileProgram } from './shader.js';

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a;
out vec2 uv;
void main() { uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const FS_THRESH = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uSrc;
uniform float uThreshold;
uniform float uKnee;
out vec4 o;
void main() {
  vec3 c = texture(uSrc, uv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float soft = clamp((l - uThreshold + uKnee) / (2.0 * uKnee), 0.0, 1.0);
  float w = (l > uThreshold + uKnee) ? 1.0 : (l < uThreshold - uKnee ? 0.0 : soft * soft * (3.0 - 2.0 * soft));
  o = vec4(c * w, 1.0);
}`;

const FS_BLUR = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uSrc;
uniform vec2 uTexelSize;
uniform vec2 uDir;
out vec4 o;
void main() {
  vec3 c = vec3(0.0);
  float wts[5];
  wts[0] = 0.227027; wts[1] = 0.1945946; wts[2] = 0.1216216; wts[3] = 0.054054; wts[4] = 0.016216;
  c += texture(uSrc, uv).rgb * wts[0];
  for (int i = 1; i < 5; i += 1) {
    vec2 off = uDir * uTexelSize * float(i);
    c += texture(uSrc, uv + off).rgb * wts[i];
    c += texture(uSrc, uv - off).rgb * wts[i];
  }
  o = vec4(c, 1.0);
}`;

const FS_COMPOSITE = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D uSrc;
uniform sampler2D uBloom;
uniform float uBloomStrength;
out vec4 o;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 base = texture(uSrc, uv).rgb;
  vec3 bloom = texture(uBloom, uv).rgb;
  vec3 col = base + bloom * uBloomStrength;
  col = aces(col);
  // Blue-noise dither (8-bit precision: subtract a tiny offset).
  float n = hash(gl_FragCoord.xy) - 0.5;
  col += vec3(n / 255.0);
  // Vignette.
  vec2 c = uv - 0.5;
  float vign = 1.0 - 0.30 * dot(c, c) * 2.0;
  o = vec4(col * vign, 1.0);
}`;

export function setupPostProcess(gl, w, h) {
  // Create three FBOs: bloomA, bloomB (ping-pong), final.
  function mkFBO() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w / 2, h / 2, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }
  const bloomA = mkFBO(), bloomB = mkFBO();
  const threshProg = compileProgram(gl, VS_QUAD, FS_THRESH);
  const blurProg = compileProgram(gl, VS_QUAD, FS_BLUR);
  const compProg = compileProgram(gl, VS_QUAD, FS_COMPOSITE);
  const quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  function run(srcTex, threshold = 1.0, knee = 0.25, bloomStrength = 0.5) {
    // Pass 1: threshold srcTex -> bloomA.
    gl.useProgram(threshProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.viewport(0, 0, w / 2, h / 2);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.uniform1i(gl.getUniformLocation(threshProg, 'uSrc'), 0);
    gl.uniform1f(gl.getUniformLocation(threshProg, 'uThreshold'), threshold);
    gl.uniform1f(gl.getUniformLocation(threshProg, 'uKnee'), knee);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Pass 2: horizontal blur bloomA -> bloomB.
    gl.useProgram(blurProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.uniform1i(gl.getUniformLocation(blurProg, 'uSrc'), 0);
    gl.uniform2f(gl.getUniformLocation(blurProg, 'uTexelSize'), 2 / w, 2 / h);
    gl.uniform2f(gl.getUniformLocation(blurProg, 'uDir'), 1, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Pass 3: vertical blur bloomB -> bloomA.
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
    gl.uniform1i(gl.getUniformLocation(blurProg, 'uSrc'), 0);
    gl.uniform2f(gl.getUniformLocation(blurProg, 'uDir'), 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Pass 4: composite src + bloomA -> default fb.
    gl.useProgram(compProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.uniform1i(gl.getUniformLocation(compProg, 'uSrc'), 0);
    gl.uniform1i(gl.getUniformLocation(compProg, 'uBloom'), 1);
    gl.uniform1f(gl.getUniformLocation(compProg, 'uBloomStrength'), bloomStrength);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { run };
}
