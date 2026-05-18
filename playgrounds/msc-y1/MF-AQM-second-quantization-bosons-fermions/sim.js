// Second quantization in the occupation-number (Fock) representation
// for a single mode (Dirac 1927; Fetter and Walecka 1971; Sakurai
// and Napolitano). A state is a real coefficient vector over the
// Fock basis |0>, |1>, ..., |nMax>.
//
// Bosons:  a|n> = sqrt(n)|n-1>,  a^dag|n> = sqrt(n+1)|n+1>,
//          [a, a^dag] = 1,  N = a^dag a.
// Fermions (Pauli): a|1> = |0>, a|0> = 0, a^dag|0> = |1>,
//          a^dag|1> = 0,  a^2 = 0,  {a, a^dag} = 1,  N in {0,1}.
// Deterministic, closed-form linear algebra.

export function fockState(n, nMax) {
  const v = new Float64Array(nMax + 1);
  if (n >= 0 && n <= nMax) v[n] = 1;
  return v;
}

// Annihilation operator a acting on a state vector.
export function annihilate(state, stat = 'boson') {
  const N = state.length - 1;
  const out = new Float64Array(N + 1);
  if (stat === 'fermion') {
    out[0] = state[1] ?? 0;                              // a|1> = |0>, a|0> = 0
    return out;
  }
  for (let n = 0; n <= N - 1; n += 1) out[n] = Math.sqrt(n + 1) * state[n + 1];
  return out;
}

// Creation operator a^dag acting on a state vector.
export function create(state, stat = 'boson') {
  const N = state.length - 1;
  const out = new Float64Array(N + 1);
  if (stat === 'fermion') {
    out[1] = state[0] ?? 0;                              // a^dag|0> = |1>, a^dag|1> = 0
    return out;
  }
  for (let n = 1; n <= N; n += 1) out[n] = Math.sqrt(n) * state[n - 1];
  return out;
}

// Number operator N = a^dag a (eigenvalue n on |n>).
export function number(state) {
  const out = new Float64Array(state.length);
  for (let n = 0; n < state.length; n += 1) out[n] = n * state[n];
  return out;
}

export function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}
export function norm(state) { return Math.sqrt(dot(state, state)); }
export function expectationN(state) {
  const nrm = dot(state, state);
  return nrm > 0 ? dot(state, number(state)) / nrm : 0;
}

// (Anti)commutator of a and a^dag acting on a state:
// bosons (a a^dag - a^dag a)|psi> = |psi>;
// fermions (a a^dag + a^dag a)|psi> = |psi>.
export function commutatorAction(state, stat = 'boson') {
  const aad = annihilate(create(state, stat), stat);
  const ada = create(annihilate(state, stat), stat);
  const out = new Float64Array(state.length);
  const sgn = stat === 'fermion' ? 1 : -1;
  for (let i = 0; i < state.length; i += 1) out[i] = aad[i] + sgn * ada[i];
  return out;
}

// Bosonic coherent state |alpha> = e^{-alpha^2/2} sum alpha^n/sqrt(n!)
// |n> (alpha real), truncated at nMax.
export function coherentState(alpha, nMax) {
  const v = new Float64Array(nMax + 1);
  let logc = -0.5 * alpha * alpha;                       // log of |0> coefficient
  v[0] = Math.exp(logc);
  for (let n = 1; n <= nMax; n += 1) {
    logc += Math.log(Math.abs(alpha) + 1e-300) - 0.5 * Math.log(n);
    v[n] = Math.sign(alpha) ** n * Math.exp(logc);
  }
  return v;
}

// Poissonian reference |<n|alpha>|^2 = e^{-nbar} nbar^n / n!.
export function poisson(n, nbar) {
  let logp = -nbar;
  for (let k = 1; k <= n; k += 1) logp += Math.log(nbar) - Math.log(k);
  return Math.exp(logp);
}

// Apply a^dag k times to |0> (the raising "pump"); fermions saturate
// at |1> by Pauli exclusion. Returns the normalised state.
export function pump(k, stat, nMax) {
  let s = fockState(0, nMax);
  for (let i = 0; i < k; i += 1) {
    const r = create(s, stat);
    if (norm(r) < 1e-12) break;                          // blocked (Pauli) -> stays
    s = r;
    const nn = norm(s);
    for (let j = 0; j < s.length; j += 1) s[j] /= nn;
  }
  return s;
}
