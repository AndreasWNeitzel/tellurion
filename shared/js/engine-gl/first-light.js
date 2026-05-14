// First-light gate. A hero must prove its WebGL2 context, required extensions,
// shader compilation, and one non-blank render BEFORE physics is wired.
// Usage:
//   import { runFirstLight } from '.../first-light.js';
//   const ok = await runFirstLight(canvas, {
//     requiredExtensions: ['EXT_color_buffer_float'],
//     compileSamples: [{ name: 'render.vert', source: VS_SRC, type: 'vertex' }, ...],
//     drawProbe: (gl) => { ... draws one frame ... },
//   });
//   if (!ok.pass) { mark needs-firstlight; halt this hero. }
//
// The probe analyzes a 64x64 readback for >= 3 distinct colors and < 95% bg pixels.

export async function runFirstLight(canvas, opts) {
  const reasons = [];
  const log = [];
  // 1. Context.
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) {
    reasons.push('no-webgl2-context');
    return { pass: false, reasons, log };
  }
  log.push('[first-light] WebGL2 context OK');
  // 2. Required extensions.
  for (const ext of opts.requiredExtensions ?? []) {
    if (!gl.getExtension(ext)) {
      reasons.push(`missing-extension: ${ext}`);
    } else {
      log.push(`[first-light] extension OK: ${ext}`);
    }
  }
  if (reasons.length) return { pass: false, reasons, log };
  // 3. Shader compile samples.
  for (const sample of opts.compileSamples ?? []) {
    const stage = sample.type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    const sh = gl.createShader(stage);
    gl.shaderSource(sh, sample.source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh) ?? '(no info)';
      reasons.push(`compile-fail: ${sample.name}`);
      log.push(`* ${sample.name}\n\n\`\`\`\n${info}\n\`\`\`\n`);
      log.push('Numbered source:');
      log.push(sample.source.split('\n').map((l, i) => `${(i + 1).toString().padStart(3)}: ${l}`).join('\n'));
      gl.deleteShader(sh);
      continue;
    }
    gl.deleteShader(sh);
    log.push(`[first-light] compile OK: ${sample.name}`);
  }
  if (reasons.length) return { pass: false, reasons, log };
  // 4. Draw probe + readback.
  try {
    opts.drawProbe?.(gl);
  } catch (e) {
    reasons.push(`draw-probe-threw: ${e.message}`);
    return { pass: false, reasons, log };
  }
  // Read back a 64x64 patch from the center of the canvas.
  const w = canvas.width, h = canvas.height;
  const x = Math.max(0, Math.floor(w / 2) - 32);
  const y = Math.max(0, Math.floor(h / 2) - 32);
  const px = new Uint8Array(64 * 64 * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(x, y, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const bg = opts.backgroundColor ?? [6, 6, 8];
  let bgCount = 0;
  const colors = new Set();
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    colors.add(((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5));
    if (Math.abs(r - bg[0]) <= 4 && Math.abs(g - bg[1]) <= 4 && Math.abs(b - bg[2]) <= 4) bgCount += 1;
  }
  const totalPx = 64 * 64;
  const bgFrac = bgCount / totalPx;
  const distinctColors = colors.size;
  log.push(`[first-light] readback: distinct=${distinctColors}, bgFrac=${bgFrac.toFixed(3)}`);
  if (distinctColors < 3) reasons.push(`too-few-distinct-colors: ${distinctColors}`);
  if (bgFrac >= 0.95) reasons.push(`too-much-background: ${bgFrac.toFixed(3)}`);
  return { pass: reasons.length === 0, reasons, log, distinctColors, bgFrac };
}

export function logFirstLightFailure(report, slug, log) {
  // Browser-side: format failure as markdown ready for failures/shader-compile.md.
  const md = [];
  md.push(`# First-Light Failure: ${slug}`);
  md.push('');
  md.push(`Captured at: ${new Date().toISOString()}`);
  md.push('');
  md.push('## Reasons');
  for (const r of report.reasons) md.push(`- ${r}`);
  md.push('');
  md.push('## Log');
  md.push('```');
  md.push(...log);
  md.push('```');
  return md.join('\n');
}
