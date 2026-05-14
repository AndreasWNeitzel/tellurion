// WebGL2 context setup. Falls back gracefully if unavailable.
export function createGL2(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('webgl2 unavailable');
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  return gl;
}
