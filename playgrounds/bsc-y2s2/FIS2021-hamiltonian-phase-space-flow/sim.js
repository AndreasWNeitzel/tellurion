// Hamiltonian phase-space flow. Pendulum H = p^2/2 - cos(q).
// Hamilton's equations: dq/dt = dH/dp = p; dp/dt = -dH/dq = -sin(q).
// Reference: Lemos Analytical Mechanics Ch. 6 (`lemos-mech`); Goldstein Ch. 8 (`goldstein-mech`).
export function hamiltonian(q, p, system = 'pendulum') {
  if (system === 'pendulum') return 0.5 * p * p - Math.cos(q);
  if (system === 'sho') return 0.5 * (p * p + q * q);
  if (system === 'cubic') return 0.5 * p * p + 0.5 * q * q - 0.25 * q * q * q * q;
  if (system === 'doublewell') return 0.5 * p * p - 0.5 * q * q + 0.25 * q * q * q * q;  // V = -q^2/2 + q^4/4, two wells
  if (system === 'quartic') return 0.5 * p * p + 0.25 * q * q * q * q;                   // V = q^4/4, hard spring
  if (system === 'morse') { const e = Math.exp(-q); return 0.5 * p * p + (1 - e) * (1 - e); }
}
export function rhs(q, p, system = 'pendulum') {
  if (system === 'pendulum') return { dq: p, dp: -Math.sin(q) };
  if (system === 'sho') return { dq: p, dp: -q };
  if (system === 'cubic') return { dq: p, dp: -q + q * q * q };
  if (system === 'doublewell') return { dq: p, dp: q - q * q * q };
  if (system === 'quartic') return { dq: p, dp: -q * q * q };
  if (system === 'morse') { const e = Math.exp(-q); return { dq: p, dp: -2 * (1 - e) * e }; }
}
export function symplecticEuler(q, p, dt, system) {
  const { dp } = rhs(q, p, system);
  const pn = p + dt * dp;
  const qn = q + dt * pn;
  return { q: qn, p: pn };
}
export function leapfrog(q, p, dt, system) {
  const { dp } = rhs(q, p, system);
  const ph = p + 0.5 * dt * dp;
  const qn = q + dt * ph;
  const { dp: dp2 } = rhs(qn, ph, system);
  const pn = ph + 0.5 * dt * dp2;
  return { q: qn, p: pn };
}
