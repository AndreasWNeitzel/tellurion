// shared/js/engine/symplectic.js
// Velocity-Verlet and Yoshida-4 integrator for ODEs in second-order form
//   q_ddot = a(q, q_dot, t)
// over a flat generalized-coordinate vector q of arbitrary length.
//
// Engine API contract (see docs/ARCHITECTURE.md):
//   create({ positions, velocities, masses, accelerationFn, energyFn, integrator, ... })
//   step(instance, dt)
//   diagnostics(instance) -> { energy, energyDrift, [angularMomentum, lrl] }
//   snapshot(instance) -> { q, qdot, t }
//
// Headless: no DOM, no window, no performance.now, no top-level await.
//
// Symplecticity and qdot-dependent forces:
//   Velocity-Verlet and the standard Yoshida-4 composition are symplectic ONLY
//   for separable Hamiltonians H(q, p) = T(p) + V(q), i.e., forces that depend
//   on q alone. The double pendulum, particles in a rotating frame, and any
//   non-separable Hamiltonian have accelerations a(q, qdot, ...) that depend
//   on qdot through Christoffel / centripetal terms. Without compensation, a
//   plain "second half kick" uses an obsolete qdot estimate and degrades the
//   integrator to 1st-order in dt for qdot-dependent forces.
//
//   This implementation runs a one-pass predictor-corrector on the second
//   half-kick: after the drift, evaluate a at q_{n+1} using the half-step qdot
//   (predictor), apply the second half-kick to get qdot_pred, re-evaluate a at
//   (q_{n+1}, qdot_pred) (corrector), then apply the second half-kick using the
//   corrected a. For q-only forces the corrector returns the same a, so the
//   second half-kick is identity-equivalent and the scheme reduces to pure
//   velocity-Verlet (symplectic, 2nd order). For qdot-dependent forces the
//   corrector restores 2nd-order accuracy in dt at the cost of one extra
//   accelerationFn evaluation per step.
//
//   Even with the corrector, Yoshida-4 retains its formal symplecticity only
//   for separable Hamiltonians; for qdot-dependent forces it gives a non-
//   symplectic 4th-order scheme with bounded energy drift at small dt.

const YOSHIDA_W1 = 1 / (2 - Math.cbrt(2));
const YOSHIDA_W0 = 1 - 2 * YOSHIDA_W1;

// Allocate a Float64Array of length `n` initialized to zero.
function zeros(n) { return new Float64Array(n); }

// Copy src into dst (both Float64Array of equal length).
function copy(dst, src) { for (let i = 0; i < dst.length; i += 1) dst[i] = src[i]; }

// Broadcast a scalar mass into a Float64Array of given length.
function massesToArray(masses, n) {
  if (typeof masses === 'number') {
    const m = new Float64Array(n);
    for (let i = 0; i < n; i += 1) m[i] = masses;
    return m;
  }
  if (masses instanceof Float64Array) return masses;
  if (Array.isArray(masses)) return Float64Array.from(masses);
  throw new Error('masses must be a number, Float64Array, or Array of length matching positions');
}

// Factory. All arrays are taken by reference and mutated in place.
//
// Required:
//   positions:        Float64Array, generalized coordinates q
//   velocities:       Float64Array, generalized velocities qdot, same length as positions
//   masses:           number | Float64Array, per-DOF mass (or scalar broadcast)
//   accelerationFn:   (q, qdot, m, t, outAccel) => void; must fill outAccel with q_ddot
//   energyFn:         (q, qdot, m) => number, total energy for diagnostics
//
// Optional:
//   integrator:           'verlet' (default) | 'yoshida4'
//   angularMomentumFn:    (q, qdot, m) => number, exposed via diagnostics
//   lrlFn:                (q, qdot, m) => Float64Array, exposed via diagnostics
//
// Returns an opaque instance object. Do not mutate fields directly except via step.
export function create({
  positions,
  velocities,
  masses,
  accelerationFn,
  energyFn,
  integrator = 'verlet',
  angularMomentumFn = null,
  lrlFn = null,
} = {}) {
  if (!(positions instanceof Float64Array)) {
    throw new Error('positions must be a Float64Array');
  }
  if (!(velocities instanceof Float64Array)) {
    throw new Error('velocities must be a Float64Array');
  }
  if (positions.length !== velocities.length) {
    throw new Error('positions and velocities must have equal length');
  }
  if (typeof accelerationFn !== 'function') {
    throw new Error('accelerationFn must be a function (q, qdot, m, t, outAccel) => void');
  }
  if (typeof energyFn !== 'function') {
    throw new Error('energyFn must be a function (q, qdot, m) => number');
  }
  if (integrator !== 'verlet' && integrator !== 'yoshida4') {
    throw new Error(`unknown integrator '${integrator}'. Use 'verlet' or 'yoshida4'.`);
  }

  const n = positions.length;
  const m = massesToArray(masses, n);
  const a = zeros(n);
  const aNext = zeros(n);
  const qdotMid = zeros(n);

  // Prime acceleration at t = 0.
  accelerationFn(positions, velocities, m, 0, a);

  const instance = {
    n,
    q: positions,
    qdot: velocities,
    m,
    a,
    aNext,
    qdotMid,
    accelerationFn,
    energyFn,
    angularMomentumFn,
    lrlFn,
    integrator,
    t: 0,
    energy0: null, // set lazily on first diagnostics call
  };
  instance.energy0 = energyFn(positions, velocities, m);
  return instance;
}

// One velocity-Verlet step with predictor-corrector on the second half-kick.
// See the header comment for why the corrector is needed when accelerationFn
// depends on qdot.
function stepVerlet(inst, dt) {
  const { n, q, qdot, a, aNext, qdotMid, m, accelerationFn } = inst;
  const halfDt = 0.5 * dt;
  // half kick to qdot_{n+1/2}
  for (let i = 0; i < n; i += 1) qdot[i] += halfDt * a[i];
  // drift to q_{n+1}
  for (let i = 0; i < n; i += 1) q[i] += dt * qdot[i];
  inst.t += dt;
  // remember qdot at mid-step (= qdot_{n+1/2}) for the predictor-corrector pass
  for (let i = 0; i < n; i += 1) qdotMid[i] = qdot[i];
  // predictor: a at (q_{n+1}, qdot_{n+1/2})
  accelerationFn(q, qdot, m, inst.t, aNext);
  // second half kick (predictor) to obtain qdot_pred at t_{n+1}
  for (let i = 0; i < n; i += 1) qdot[i] = qdotMid[i] + halfDt * aNext[i];
  // corrector: re-evaluate a at (q_{n+1}, qdot_pred); identity for q-only forces
  accelerationFn(q, qdot, m, inst.t, aNext);
  // final qdot_{n+1} from the corrector
  for (let i = 0; i < n; i += 1) qdot[i] = qdotMid[i] + halfDt * aNext[i];
  // store a_{n+1} for the next step's first half-kick
  for (let i = 0; i < n; i += 1) a[i] = aNext[i];
}

// Yoshida 4: three Verlet substeps with time weights w1 dt, w0 dt, w1 dt where
//   w1 = 1 / (2 - 2^(1/3)),  w0 = 1 - 2 w1.
// Symplectic 4th-order for separable Hamiltonians; 4th-order non-symplectic
// otherwise. The substep weights eliminate the 3rd-order error in the
// Baker-Campbell-Hausdorff expansion of two Verlet flow operators.
function stepYoshida4(inst, dt) {
  stepVerlet(inst, YOSHIDA_W1 * dt);
  stepVerlet(inst, YOSHIDA_W0 * dt);
  stepVerlet(inst, YOSHIDA_W1 * dt);
}

export function step(inst, dt) {
  if (inst.integrator === 'verlet') stepVerlet(inst, dt);
  else                              stepYoshida4(inst, dt);
}

// Diagnostics. Computes total energy and energy drift relative to t=0.
// Optionally computes angularMomentum and lrl if their callbacks were provided.
export function diagnostics(inst) {
  const energy = inst.energyFn(inst.q, inst.qdot, inst.m);
  const out = {
    energy,
    energyDrift: inst.energy0 === 0 ? energy : (energy - inst.energy0) / inst.energy0,
    t: inst.t,
  };
  if (inst.angularMomentumFn) out.angularMomentum = inst.angularMomentumFn(inst.q, inst.qdot, inst.m);
  if (inst.lrlFn)             out.lrl             = inst.lrlFn(inst.q, inst.qdot, inst.m);
  return out;
}

// Structured-cloneable snapshot for golden tests.
export function snapshot(inst) {
  return {
    t:    inst.t,
    q:    Float64Array.from(inst.q),
    qdot: Float64Array.from(inst.qdot),
    m:    Float64Array.from(inst.m),
    integrator: inst.integrator,
  };
}

// Restore state from a snapshot (in-place on the existing instance). Useful for
// invariant tests that need to rewind to a known point.
export function restore(inst, snap) {
  if (snap.q.length !== inst.n || snap.qdot.length !== inst.n) {
    throw new Error('snapshot has different DOF count than instance');
  }
  copy(inst.q, snap.q);
  copy(inst.qdot, snap.qdot);
  copy(inst.m, snap.m);
  inst.t = snap.t;
  inst.accelerationFn(inst.q, inst.qdot, inst.m, inst.t, inst.a);
}
