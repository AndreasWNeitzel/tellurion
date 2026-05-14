// sim.js
// Nuclear shell model magic numbers. A nucleon in the average nuclear
// potential sees a 3D harmonic-oscillator-like spectrum with shells of
// degeneracy 2, 6, 12, 20, 30, ... (HO without spin-orbit). With the
// strong spin-orbit term added (Mayer-Jensen 1949), the levels split and
// reorder so that the closed shells fall at the observed magic numbers
// 2, 8, 20, 28, 50, 82, 126.
//
// Reference: Krane, Introductory Nuclear Physics Ch. 5 (`krane-nuclear`).

// Simplified shell-model level table (Krane Ch. 5 fig 5.6). Each entry:
// label, j, occupancy (2j+1), parity.
// Order roughly by energy for a self-consistent oscillator + L*S Hamiltonian.
export const LEVELS = [
  { label: '1s1/2', j: 0.5,  occ: 2,  cumul: 2 },
  { label: '1p3/2', j: 1.5,  occ: 4,  cumul: 6 },
  { label: '1p1/2', j: 0.5,  occ: 2,  cumul: 8 },  // magic 8
  { label: '1d5/2', j: 2.5,  occ: 6,  cumul: 14 },
  { label: '2s1/2', j: 0.5,  occ: 2,  cumul: 16 },
  { label: '1d3/2', j: 1.5,  occ: 4,  cumul: 20 }, // magic 20
  { label: '1f7/2', j: 3.5,  occ: 8,  cumul: 28 }, // magic 28
  { label: '2p3/2', j: 1.5,  occ: 4,  cumul: 32 },
  { label: '1f5/2', j: 2.5,  occ: 6,  cumul: 38 },
  { label: '2p1/2', j: 0.5,  occ: 2,  cumul: 40 },
  { label: '1g9/2', j: 4.5,  occ: 10, cumul: 50 }, // magic 50
  { label: '1g7/2', j: 3.5,  occ: 8,  cumul: 58 },
  { label: '2d5/2', j: 2.5,  occ: 6,  cumul: 64 },
  { label: '2d3/2', j: 1.5,  occ: 4,  cumul: 68 },
  { label: '3s1/2', j: 0.5,  occ: 2,  cumul: 70 },
  { label: '1h11/2',j: 5.5,  occ: 12, cumul: 82 }, // magic 82
  { label: '1h9/2', j: 4.5,  occ: 10, cumul: 92 },
  { label: '2f7/2', j: 3.5,  occ: 8,  cumul: 100 },
  { label: '2f5/2', j: 2.5,  occ: 6,  cumul: 106 },
  { label: '3p3/2', j: 1.5,  occ: 4,  cumul: 110 },
  { label: '3p1/2', j: 0.5,  occ: 2,  cumul: 112 },
  { label: '1i13/2',j: 6.5,  occ: 14, cumul: 126 }, // magic 126
];

export const MAGIC = [2, 8, 20, 28, 50, 82, 126];

// Filled level index given nucleon count N.
export function fillIndex(N) {
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (LEVELS[i].cumul >= N) return i;
  }
  return LEVELS.length - 1;
}

export function isMagic(N) {
  return MAGIC.includes(N);
}

// "Closed-shell gap" energy: in the simplified model the energy step
// between shells at magic numbers is larger; we model it as 2 MeV between
// regular levels and 5 MeV at magic boundaries.
export function levelEnergyMeV(i) {
  let E = 0;
  for (let k = 0; k < i; k += 1) {
    E += MAGIC.includes(LEVELS[k].cumul) ? 5 : 2;
  }
  return E;
}
