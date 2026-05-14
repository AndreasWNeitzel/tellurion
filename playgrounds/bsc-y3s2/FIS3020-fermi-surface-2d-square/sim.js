// sim.js
// 2D tight-binding electron on a square lattice. Dispersion:
//   E(kx, ky) = -2 t (cos kx + cos ky).
// Lattice constant a = 1; brillouin zone is (kx, ky) in [-pi, pi]^2.
// Hopping t > 0 ferromagnetically anchored.
//
// Filling parameter f = (number of electrons) / (number of sites).
// f = 1 means one electron per site (insulator with U > 0).
// Below half-filling, the Fermi surface is a closed circle near the
// gamma point. At f = 0.5 (half-filling) the Fermi surface is the
// square diagonals (van Hove singularity, perfect nesting). Above
// half-filling, it switches to closed loops around the brillouin-zone
// corners.
//
// Reference: Ashcroft-Mermin, Solid State Physics Ch. 8
// (`ashcroft-mermin`).

export function dispersion(kx, ky, t = 1) {
  return -2 * t * (Math.cos(kx) + Math.cos(ky));
}

// Fermi energy at filling f, found by bisection on the density of states.
// Sample on N x N k-grid and pick the (f * N^2)-th smallest energy.
export function fermiEnergyAtFilling(filling, t = 1, N = 200) {
  const energies = new Float64Array(N * N);
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const kx = -Math.PI + 2 * Math.PI * (i + 0.5) / N;
      const ky = -Math.PI + 2 * Math.PI * (j + 0.5) / N;
      energies[i * N + j] = dispersion(kx, ky, t);
    }
  }
  const sorted = Array.from(energies).sort((a, b) => a - b);
  const target = Math.min(Math.max(0, Math.floor(filling * N * N)), N * N - 1);
  return sorted[target];
}

// Density of states by histogram on the N x N grid.
export function densityOfStates(t = 1, N = 200, nBins = 50) {
  const energies = new Float64Array(N * N);
  let Emin = Infinity, Emax = -Infinity;
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const kx = -Math.PI + 2 * Math.PI * (i + 0.5) / N;
      const ky = -Math.PI + 2 * Math.PI * (j + 0.5) / N;
      const e = dispersion(kx, ky, t);
      energies[i * N + j] = e;
      if (e < Emin) Emin = e;
      if (e > Emax) Emax = e;
    }
  }
  const bins = new Int32Array(nBins);
  for (let k = 0; k < energies.length; k += 1) {
    const idx = Math.min(nBins - 1, Math.floor((energies[k] - Emin) / (Emax - Emin) * nBins));
    bins[idx] += 1;
  }
  return { bins, Emin, Emax, total: N * N };
}

// Fermi-circle radius in the small-filling limit (continuum approximation).
// At filling f, the Fermi area is f * (2 pi)^2; radius = sqrt(f * 4 pi).
export function fermiCircleK(f) {
  return Math.sqrt(f * 4 * Math.PI);
}
