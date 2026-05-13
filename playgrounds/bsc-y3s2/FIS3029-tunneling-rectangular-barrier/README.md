# Tunneling: Rectangular Barrier

A 1D Schrodinger particle of energy E incident on a rectangular barrier of height V_0 and width a. The transmission coefficient T(E) is closed-form: for E < V_0 it decays exponentially as the wave evanesces inside the barrier; for E > V_0 it oscillates with perfect resonances at E = V_0 + n^2 pi^2 / (2 a^2). The dashed classical step function (T = 0 below V_0, T = 1 above) is shown for comparison.

Slide V_0 and a to reshape the curve. Watch the resonance ticks (red) move with parameters.

## Reference

Griffiths, "Introduction to Quantum Mechanics", 3rd ed., Cambridge 2018, Sections 2.6 (The finite square well and tunneling) and 8.2 (Tunneling). Verified in chapter_index.

## Verification

- T(E -> 0) = 0; T + R = 1 to machine precision over a wide sweep.
- T at the first four resonances is unity to 1e-10.
- Thick wide barrier (kappa a >> 1): T scales as exp(-2 kappa a) within the analytic prefactor.
- V_0 = 0 gives T = 1 at all E.
