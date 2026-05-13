# Three-Body Figure-Eight Choreography

Three equal masses interact under Newtonian gravity in 2D, G = 1, m_i = 1. At the Chenciner-Montgomery 2000 initial condition the three masses chase one another along a single closed figure-eight curve with period T ≈ 6.326 in dimensionless time. The project's velocity-Verlet symplectic engine integrates the 6-DOF Hamiltonian with O(N^2) pairwise gravity at every step; total energy oscillates within a bounded envelope (|dE/E| < 1e-5 over 10^4 steps at dt = 0.005), total linear momentum stays at 0 to machine precision, and total angular momentum stays at 0 to machine precision. The "dv" slider perturbs the initial velocity of body 3 by a small +x kick.

Look at the trails: at dv = 0 the three colored trails sit on top of each other on a single closed figure-eight. Crank dv up to 0.01 and watch the orbits drift off the curve over many periods; eventually one body escapes. The momentum readout (|P|) is the cleanest invariant: it stays at zero to machine precision under Verlet because internal forces sum to zero. The angular momentum L is also zero by construction (the Chenciner-Montgomery IC is L = 0) and stays at zero.

Controls: drag the dv slider to perturb. Reset returns to dv = 0 (the stable choreography). Play/Pause toggles integration.

## Reference

Primary citation: Newman, "Computational Physics", 2013, Exercise 8.16 "Three-body problem" (bib key `newman2013`, verified in chapter_index this session). The specific numerical IC values for the figure-eight come from Chenciner & Montgomery, "A remarkable periodic solution of the three-body problem in the case of equal masses", Annals of Mathematics 152, 881-901 (2000); the project bibliography does not currently include this paper, so the IC numbers are tagged `[no-source: chenciner-montgomery-numerical-IC]` in the spec. Engine: `shared/js/engine/symplectic.js`, validated for Kepler at e=0.6 in `tests/engines/symplectic.test.mjs`.

## Verification

- Strong invariants (5/5 tests at seed 0xC0FFEE):
  - |dE/E| < 1e-3 over 10^4 dt at canonical IC; empirical max drift ~1e-5.
  - Total linear momentum |P| within 1e-10 of 0 over 10^4 dt.
  - Total angular momentum |L| within 1e-10 of 0 over 10^4 dt.
  - Periodic return: the bodies return to within 5e-3 of their starting positions after one period T.
  - Bit-identical reproducibility on repeat runs.
- Visual gate: SSIM > 0.92 against committed golden frames showing progressively longer trails over 4 periods.
- Last verified: see `.verified`.
