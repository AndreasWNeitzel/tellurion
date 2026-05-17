// Normal modes of a 1D mass-spring chain. A fixed-end monatomic chain
// of N equal masses has exactly N modes with
//   omega_n = 2 sqrt(K/m) sin( n pi / (2 (N+1)) ),  n = 1..N,
// and mode shape A_i ~ sin( i n pi / (N+1) ). A diatomic chain with
// alternating spring constants K1, K2 (equal masses, lattice
// constant a) splits into an acoustic and an optical branch
//   omega^2 = (K1+K2)/m -/+ (1/m) sqrt( K1^2 + K2^2 + 2 K1 K2 cos(k a) ),
// with a zone-boundary gap that closes when K1 = K2 (the monatomic
// limit). The simulated chain is integrated with velocity Verlet so
// the analytic frequencies can be checked against the dynamics.
// Headless and deterministic. Reference: Ashcroft and Mermin, Solid
// State Physics, Ch. 22.

export function monatomicOmega(n, N, K, m) {
  return 2 * Math.sqrt(K / m) * Math.abs(Math.sin((n * Math.PI) / (2 * (N + 1))));
}

export function modeShape(n, N) {
  const a = new Float64Array(N + 2);            // index 0 and N+1 are the fixed walls
  for (let i = 1; i <= N; i += 1) a[i] = Math.sin((i * n * Math.PI) / (N + 1));
  return a;
}

// Diatomic two-spring branches at reduced wavenumber theta = k a in
// [0, pi]. Returns { acoustic, optical } angular frequencies.
export function diatomicBranches(theta, K1, K2, m) {
  const s = (K1 + K2) / m;
  const r = Math.sqrt(K1 * K1 + K2 * K2 + 2 * K1 * K2 * Math.cos(theta)) / m;
  return { acoustic: Math.sqrt(Math.max(0, s - r)), optical: Math.sqrt(s + r) };
}

// Zone-boundary gap (theta = pi): omega_optical - omega_acoustic.
export function bandGap(K1, K2, m) {
  const b = diatomicBranches(Math.PI, K1, K2, m);
  return b.optical - b.acoustic;
}

// Velocity-Verlet step of a fixed-end chain. k[i] is the spring
// connecting mass i-1 and i (i = 1..N, plus the two wall springs
// k[1] and k[N+1]). Returns nothing; mutates pos/vel.
export function makeChain(N) {
  return { N, pos: new Float64Array(N + 2), vel: new Float64Array(N + 2), t: 0 };
}

function accel(ch, K, m, out) {
  const { N, pos } = ch;
  for (let i = 1; i <= N; i += 1) {
    const kL = K[i], kR = K[i + 1];
    out[i] = (kL * (pos[i - 1] - pos[i]) + kR * (pos[i + 1] - pos[i])) / m;
  }
}

export function verletStep(ch, K, m, dt) {
  const { N, pos, vel } = ch;
  const a = new Float64Array(N + 2);
  accel(ch, K, m, a);
  for (let i = 1; i <= N; i += 1) { pos[i] += vel[i] * dt + 0.5 * a[i] * dt * dt; }
  const a2 = new Float64Array(N + 2);
  accel(ch, K, m, a2);
  for (let i = 1; i <= N; i += 1) { vel[i] += 0.5 * (a[i] + a2[i]) * dt; }
  ch.t += dt;
}

export function chainEnergy(ch, K, m) {
  const { N, pos, vel } = ch;
  let E = 0;
  for (let i = 1; i <= N; i += 1) E += 0.5 * m * vel[i] * vel[i];
  for (let i = 1; i <= N + 1; i += 1) E += 0.5 * K[i] * (pos[i] - pos[i - 1]) ** 2;
  return E;
}

// Uniform spring array of length N+1 (springs 1..N+1) for a monatomic
// chain, or alternating K1/K2 for a diatomic chain.
export function uniformSprings(N, K) { return new Float64Array(N + 2).fill(K); }
export function alternatingSprings(N, K1, K2) {
  const k = new Float64Array(N + 2);
  for (let i = 1; i <= N + 1; i += 1) k[i] = (i % 2 === 1) ? K1 : K2;
  return k;
}

// Excite a single monatomic normal mode (amplitude A) into the chain.
export function exciteMode(ch, n, A) {
  const sh = modeShape(n, ch.N);
  for (let i = 0; i <= ch.N + 1; i += 1) { ch.pos[i] = A * sh[i]; ch.vel[i] = 0; }
  ch.t = 0;
}

// Dominant oscillation angular frequency of mass i from a Verlet run,
// estimated by counting sign changes of its displacement.
export function measuredOmega(ch, K, m, dt, steps, probe) {
  let prev = ch.pos[probe], crossings = 0, firstT = -1, lastT = 0;
  for (let s = 0; s < steps; s += 1) {
    verletStep(ch, K, m, dt);
    const v = ch.pos[probe];
    if (prev === 0) prev = 1e-12;
    if (Math.sign(v) !== Math.sign(prev) && v !== 0) {
      if (firstT < 0) firstT = ch.t; else lastT = ch.t;
      crossings += 1;
    }
    prev = v;
  }
  if (crossings < 3 || lastT <= firstT) return 0;
  const halfPeriods = crossings - 1;             // between first and last crossing
  const period = 2 * (lastT - firstT) / halfPeriods;
  return (2 * Math.PI) / period;
}
