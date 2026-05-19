// Closed-form scanning-probe microscopy. AFM: the tip-sample
// interaction is a Lennard-Jones potential V(d) = 4 eps [(sig/d)^12 -
// (sig/d)^6], force F = -dV/dd. STM: the tunnelling current decays
// exponentially with the gap, I proportional to V exp(-2 kappa d),
// kappa = sqrt(2 m phi)/hbar. With hbar^2/2m = 3.81 eV A^2 and phi in
// eV, kappa = sqrt(phi/3.81) per angstrom, so a metallic work
// function (~5 eV) gives roughly a decade of current per angstrom of
// gap change. Exact algebra, deterministic. Reference: Chen,
// Introduction to Scanning Tunneling Microscopy, 2nd ed., OUP 2008
// (`chen2008`); Binnig, Quate and Gerber, Phys. Rev. Lett. 56 (1986)
// 930 (`binnig1986`).

const HBAR2_OVER_2M = 3.80998;                       // eV * A^2

// Lennard-Jones potential and force (d, sig in angstrom; eps in eV).
export function ljPotential(d, eps = 0.02, sig = 3) {
  const s6 = (sig / d) ** 6;
  return 4 * eps * (s6 * s6 - s6);
}
export function ljForce(d, eps = 0.02, sig = 3) {
  const s6 = (sig / d) ** 6;
  return (24 * eps / d) * (2 * s6 * s6 - s6);        // F = -dV/dd; >0 repulsive
}
export function ljMinDistance(sig = 3) { return Math.pow(2, 1 / 6) * sig; }

// STM tunnelling decay constant (per angstrom) and current.
export function kappa(phiEv) { return Math.sqrt(phiEv / HBAR2_OVER_2M); }
export function stmCurrent(d, V, phiEv) {
  return V * Math.exp(-2 * kappa(phiEv) * d);
}
// Current ratio per 1 A of extra gap: I(d)/I(d+1) = exp(2 kappa).
export function decadePerAngstrom(phiEv) { return Math.exp(2 * kappa(phiEv)); }

// A 1D atomically corrugated surface, z_s(x) = amp cos(2 pi x / a).
export function surfaceProfile(x, amp = 0.5, latticeA = 4) {
  return amp * Math.cos(2 * Math.PI * x / latticeA);
}

// 2D atomic corrugation for the micrograph view: a square lattice of
// bumps z = amp/2 (cos 2pi x/a + cos 2pi y/a), in [-amp, amp],
// exactly periodic with lattice constant a in both x and y, and
// reducing along a row to the 1D surfaceProfile shape (a (100)-type
// surface). Ashcroft-Mermin Ch. 4.
export function surfaceProfile2D(x, y, amp = 0.5, latticeA = 4) {
  const k = 2 * Math.PI / latticeA;
  return 0.5 * amp * (Math.cos(k * x) + Math.cos(k * y));
}

// STM constant-height current map: gap = h0 - z_s(x).
export function stmConstantHeight(x, h0, V, phiEv, amp = 0.5, a = 4) {
  return stmCurrent(h0 - surfaceProfile(x, amp, a), V, phiEv);
}

// STM constant-current topograph: tip height that keeps I = Iset.
//   Iset = V exp(-2 kappa (h - z_s))  =>  h = z_s - ln(Iset/V)/(2 kappa).
export function stmTopograph(x, Iset, V, phiEv, amp = 0.5, a = 4) {
  return surfaceProfile(x, amp, a) - Math.log(Iset / V) / (2 * kappa(phiEv));
}

// AFM: tip-sample force as the tip at constant height h scans the
// corrugated surface, gap d = h - z_s(x).
export function afmForceScan(x, h, eps = 0.02, sig = 3, amp = 0.5, a = 4) {
  return ljForce(h - surfaceProfile(x, amp, a), eps, sig);
}
