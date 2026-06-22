// sim.js
// The Franck-Hertz experiment. Electrons accelerated through a vapour gain kinetic
// energy from the field, but can only lose it in a fixed lump E_exc, the atomic
// excitation energy: an electron whose energy reaches E_exc may collide
// inelastically, excite an atom, and drop back to nearly zero. With a small
// retarding voltage V_r at the collector, the collector current oscillates as the
// accelerating voltage rises, dipping each time V crosses a multiple of E_exc/e.
// The spacing of the dips measures the excitation energy, direct evidence of
// quantised atomic levels.
//
// Units: energies in eV, so an electron that has fallen through V volts carries V
// eV of kinetic energy.
//
// Reference: Franck and Hertz 1914, Verh. Dtsch. Phys. Ges. 16, 457; Eisberg and
// Resnick, Quantum Physics, 2nd ed., Sec. 4.6.

function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function collisionCount(V, Eexc) { return Math.floor(V / Eexc + 1e-9); }
export function idealFinalKE(V, Eexc) { return V - collisionCount(V, Eexc) * Eexc; }

// trace one electron across the tube: accelerate, and once its energy reaches
// E_exc, collide inelastically with probability dx/mfp per step (losing E_exc and
// exciting an atom). Returns the final energy, whether it clears the retarder, and
// the positions where it excited atoms.
export function simElectron(V, Eexc, Vr, mfp, rand) {
  let ke = 0; const layers = []; const dx = 0.004;
  for (let x = 0; x < 1; x += dx) { ke += V * dx; if (ke >= Eexc && rand() < dx / mfp) { ke -= Eexc; layers.push(x); } }
  return { finalKE: ke, pass: ke > Vr, layers };
}

export function passFraction(V, Eexc, Vr, mfp, N = 300, seed = 0xC0FFEE) {
  const r = mulberry32(seed); let c = 0; for (let i = 0; i < N; i += 1) if (simElectron(V, Eexc, Vr, mfp, r).pass) c += 1; return c / N;
}

// collector current: the pass fraction times a saturating collection efficiency
// (more of the beam is collected as the accelerating voltage rises).
export function current(V, Eexc, Vr, mfp, Vs = 7, N = 300, seed = 0xC0FFEE) {
  if (V <= 0) return 0; return (1 - Math.exp(-V / Vs)) * passFraction(V, Eexc, Vr, mfp, N, seed);
}

// the ideal excitation-layer positions for a given V: x_k = k E_exc / V, where the
// running energy crosses E_exc (atoms get excited there).
export function excitationLayers(V, Eexc) { const out = []; for (let k = 1; k * Eexc < V; k += 1) out.push(k * Eexc / V); return out; }
