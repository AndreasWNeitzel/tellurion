// sim.js
// Ampere's law in its three classic high-symmetry cases, where the loop
// integral collapses to B times the loop length and gives the field directly:
//   closed line integral of B . dl = mu0 * I_enclosed.
// Units: mu0 = 1.
//
//   long straight wire   B(r) = I / (2 pi r),  azimuthal; Amperian loop a circle.
//   ideal solenoid       B = mu0 n I inside (uniform, axial), 0 outside;
//                        n = N/L turns per unit length; rectangular Amperian loop.
//   toroid               B(r) = N I / (2 pi r) inside the windings, 0 outside;
//                        Amperian loop a circle of radius r.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 5.3; Young and
// Freedman, University Physics, 14e, Ch. 28.

export const MU0 = 1;

// B magnitude as a function of distance r for each case. Geometry params:
//   wire:    {} (r is distance from the wire)
//   solenoid:{ n, Rsol } (r is distance from the axis; field is uniform for r < Rsol)
//   toroid:  { N, a, b } (r is distance from the centre; field nonzero for a < r < b)
export function fieldWire(I, r) { return MU0 * I / (2 * Math.PI * Math.max(r, 1e-6)); }
export function fieldSolenoid(I, n, Rsol, r) { return r < Rsol ? MU0 * n * I : 0; }
export function fieldToroid(I, N, a, b, r) { return (r > a && r < b) ? MU0 * N * I / (2 * Math.PI * r) : 0; }

// Enclosed current threaded by an Amperian loop, and the loop's circulation
// length, for the chosen case and loop size. Used to verify Ampere's law.
export function ampereCheck(kase, p, loopParam) {
  if (kase === 'wire') {
    const r = loopParam;                       // circular loop of radius r around the wire
    const length = 2 * Math.PI * r;
    const B = fieldWire(p.I, r);
    const Ienc = p.I;                          // the whole wire is enclosed
    return { circulation: B * length, Ienc: MU0 * Ienc, B, length };
  }
  if (kase === 'solenoid') {
    // rectangular loop of axial length l straddling the wall: only the inside leg
    // contributes B l; the enclosed current is n l I (the turns it crosses).
    const l = loopParam;
    const B = fieldSolenoid(p.I, p.n, p.Rsol, 0);
    const Ienc = p.n * l * p.I;
    return { circulation: B * l, Ienc: MU0 * Ienc, B, length: l };
  }
  // toroid: circular loop of radius r inside the windings encloses all N turns.
  const r = loopParam;
  const length = 2 * Math.PI * r;
  const B = fieldToroid(p.I, p.N, p.a, p.b, r);
  const Ienc = (r > p.a && r < p.b) ? p.N * p.I : 0;
  return { circulation: B * length, Ienc: MU0 * Ienc, B, length };
}
