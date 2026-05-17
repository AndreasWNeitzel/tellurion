# Radioactive Decay Chain

This playground walks a heavy nucleus down a decay series to stable
lead. The nucleus on the left is a packed cluster of protons (red)
and neutrons (blue); each decay is a real transmutation. Alpha decay
sheds a He-4 cluster and the nucleus jumps to (Z-2, N-2);
beta-minus turns a neutron into a proton, (Z+1, N-1), ejecting an
electron and antineutrino. The Segre chart on the right traces the
zigzag path from the parent to the stable endpoint.

The numbers are real physics, not props. The Q value of each step
comes from the Bethe-Weizsaecker semi-empirical mass formula, and the
alpha half-life from the Geiger-Nuttall law
`log10 t = 1.61 Z_d / sqrt(Q) - 28.9`, the signature of quantum
tunnelling through the Coulomb barrier: a one-MeV change in Q swings
the half-life by many orders of magnitude. The U-238 series takes 8
alpha and 6 beta steps to reach Pb-206; the Th-232 series ends at
Pb-208.

The series selector switches between U-238 and Th-232; the decay-step
slider scrubs through the chain (the nucleus and the chart path follow);
Reset returns to the parent and Pause halts the auto-walk. The readout
shows the current isotope, decay mode, Q value and log half-life.

## Reference

Primary citation: Krane, *Introductory Nuclear Physics*, Ch. 3 and
6-8 (`krane-nuclear`).

## Verification

- Strong invariant: every mode conserves nucleon number and charge;
  the U-238 chain is 8 alpha + 6 beta ending exactly on Pb-206; every
  alpha step is exothermic and the half-life obeys Geiger-Nuttall.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
