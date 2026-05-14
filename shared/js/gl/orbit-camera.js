// Shared orbit camera. One implementation, used by every 3D hero.
//   const cam = createOrbitCamera(canvas, {
//     target: [0,0,0], radius: 5, minRadius: 1, maxRadius: 50,
//     elevationDeg: 30, azimuthDeg: 45,
//   });
//   cam.viewMatrix() -> Float32Array(16)
//   cam.projMatrix(aspect) -> Float32Array(16) (50 deg FOV, near 0.1, far 200)
//   cam.eyePosition() -> [x, y, z]
//   cam.screenToRay(px, py) -> { origin, dir }  (canvas pixel space)
//   cam.dispose()
//
// Pointer drag orbits, wheel zooms. 3s idle -> 0.5 deg/s azimuth drift.
// Any input cancels idle immediately.

const IDLE_MS = 3000;
const DRIFT_DPS = 0.5;
const TO_RAD = Math.PI / 180;

export function createOrbitCamera(canvas, opts = {}) {
  const state = {
    target: opts.target ? opts.target.slice() : [0, 0, 0],
    radius: opts.radius ?? 5,
    minRadius: opts.minRadius ?? 0.5,
    maxRadius: opts.maxRadius ?? 200,
    azimuthDeg: opts.azimuthDeg ?? 45,
    elevationDeg: opts.elevationDeg ?? 30,
    fovDeg: opts.fovDeg ?? 50,
    near: opts.near ?? 0.1,
    far: opts.far ?? 200,
    lastInputAt: performance.now(),
    dragging: false,
    pressX: 0, pressY: 0,
    azimuthRateDps: opts.azimuthRateDps ?? 1.0,    // deg per pixel of drag x
    elevationRateDps: opts.elevationRateDps ?? 1.0, // deg per pixel of drag y
    zoomRatePerWheel: opts.zoomRatePerWheel ?? 0.0015,
  };

  function clampEl(v) { return Math.max(-89, Math.min(89, v)); }

  const onDown = (e) => {
    state.dragging = true;
    state.pressX = e.clientX; state.pressY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.classList.add('dragging');
    state.lastInputAt = performance.now();
  };
  const onMove = (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.pressX;
    const dy = e.clientY - state.pressY;
    state.azimuthDeg = ((state.azimuthDeg + dx * state.azimuthRateDps * 0.4) % 360 + 360) % 360;
    state.elevationDeg = clampEl(state.elevationDeg - dy * state.elevationRateDps * 0.3);
    state.pressX = e.clientX; state.pressY = e.clientY;
    state.lastInputAt = performance.now();
  };
  const onUp = () => {
    state.dragging = false;
    canvas.classList.remove('dragging');
    state.lastInputAt = performance.now();
  };
  const onWheel = (e) => {
    e.preventDefault();
    state.radius = Math.max(state.minRadius, Math.min(state.maxRadius, state.radius * Math.exp(e.deltaY * state.zoomRatePerWheel)));
    state.lastInputAt = performance.now();
  };
  const onTouchMove = (e) => {
    if (!state.dragging || !e.touches[0]) return;
    onMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove);

  function eyePosition() {
    const az = state.azimuthDeg * TO_RAD;
    const el = state.elevationDeg * TO_RAD;
    const r = state.radius;
    return [
      state.target[0] + r * Math.cos(el) * Math.cos(az),
      state.target[1] + r * Math.sin(el),
      state.target[2] + r * Math.cos(el) * Math.sin(az),
    ];
  }

  function viewMatrix() { return lookAt(eyePosition(), state.target, [0, 1, 0]); }
  function projMatrix(aspect) { return perspective(state.fovDeg * TO_RAD, aspect, state.near, state.far); }

  function screenToRay(px, py) {
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    const ndcX = (px / w) * 2 - 1;
    const ndcY = 1 - (py / h) * 2;
    const aspect = w / h;
    const vp = matMul(projMatrix(aspect), viewMatrix());
    const inv = invertMat4(vp);
    const near = transformVec4(inv, [ndcX, ndcY, -1, 1]);
    const far = transformVec4(inv, [ndcX, ndcY, 1, 1]);
    const n = [near[0] / near[3], near[1] / near[3], near[2] / near[3]];
    const f = [far[0] / far[3], far[1] / far[3], far[2] / far[3]];
    const dir = norm([f[0] - n[0], f[1] - n[1], f[2] - n[2]]);
    return { origin: eyePosition(), dir };
  }

  function tickIdle(now) {
    if (now - state.lastInputAt > IDLE_MS) {
      const dt = 1 / 60;
      state.azimuthDeg = ((state.azimuthDeg + DRIFT_DPS * dt) % 360 + 360) % 360;
    }
  }

  function dispose() {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchmove', onTouchMove);
  }

  return {
    state,
    viewMatrix,
    projMatrix,
    eyePosition,
    screenToRay,
    tickIdle,
    dispose,
    // Mutators for capture / determinism.
    setAzimuthDeg(v) { state.azimuthDeg = ((v % 360) + 360) % 360; state.lastInputAt = performance.now(); },
    setElevationDeg(v) { state.elevationDeg = clampEl(v); state.lastInputAt = performance.now(); },
    setRadius(v) { state.radius = Math.max(state.minRadius, Math.min(state.maxRadius, v)); state.lastInputAt = performance.now(); },
    // For unit tests:
    _dispatchDrag(dx, dy) {
      state.dragging = true; state.pressX = 0; state.pressY = 0;
      onMove({ clientX: dx, clientY: dy });
      state.dragging = false;
    },
    _dispatchWheel(deltaY) { onWheel({ preventDefault() {}, deltaY }); },
  };
}

export function lookAt(eye, tgt, up) {
  const f = norm(sub(tgt, eye));
  const s = norm(cross(f, up));
  const u = cross(s, f);
  return new Float32Array([
    s[0], u[0], -f[0], 0,
    s[1], u[1], -f[1], 0,
    s[2], u[2], -f[2], 0,
    -dot(s, eye), -dot(u, eye), dot(f, eye), 1,
  ]);
}

export function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, 2 * far * near / (near - far), 0,
  ]);
}

export function matMul(a, b) {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    let s = 0; for (let k = 0; k < 4; k += 1) s += a[i + 4 * k] * b[k + 4 * j];
    r[i + 4 * j] = s;
  }
  return r;
}

export function invertMat4(m) {
  const inv = new Float32Array(16);
  inv[0] = m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
  inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
  inv[8] = m[4]*m[9]*m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
  inv[12] = -m[4]*m[9]*m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
  inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
  inv[5] = m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
  inv[9] = -m[0]*m[9]*m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
  inv[13] = m[0]*m[9]*m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
  inv[2] = m[1]*m[6]*m[15] - m[1]*m[7]*m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7] - m[13]*m[3]*m[6];
  inv[6] = -m[0]*m[6]*m[15] + m[0]*m[7]*m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7] + m[12]*m[3]*m[6];
  inv[10] = m[0]*m[5]*m[15] - m[0]*m[7]*m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7] - m[12]*m[3]*m[5];
  inv[14] = -m[0]*m[5]*m[14] + m[0]*m[6]*m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6] + m[12]*m[2]*m[5];
  inv[3] = -m[1]*m[6]*m[11] + m[1]*m[7]*m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7] + m[9]*m[3]*m[6];
  inv[7] = m[0]*m[6]*m[11] - m[0]*m[7]*m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7] - m[8]*m[3]*m[6];
  inv[11] = -m[0]*m[5]*m[11] + m[0]*m[7]*m[9] + m[4]*m[1]*m[11] - m[4]*m[3]*m[9] - m[8]*m[1]*m[7] + m[8]*m[3]*m[5];
  inv[15] = m[0]*m[5]*m[10] - m[0]*m[6]*m[9] - m[4]*m[1]*m[10] + m[4]*m[2]*m[9] + m[8]*m[1]*m[6] - m[8]*m[2]*m[5];
  let det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
  if (Math.abs(det) < 1e-12) return inv;
  det = 1 / det;
  for (let i = 0; i < 16; i += 1) inv[i] *= det;
  return inv;
}

export function transformVec4(m, v) {
  return [
    m[0]*v[0] + m[4]*v[1] + m[8]*v[2] + m[12]*v[3],
    m[1]*v[0] + m[5]*v[1] + m[9]*v[2] + m[13]*v[3],
    m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14]*v[3],
    m[3]*v[0] + m[7]*v[1] + m[11]*v[2] + m[15]*v[3],
  ];
}

export function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
export function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
export function norm(v) { const m = Math.sqrt(dot(v, v)); return m > 0 ? [v[0] / m, v[1] / m, v[2] / m] : [0, 0, 0]; }
